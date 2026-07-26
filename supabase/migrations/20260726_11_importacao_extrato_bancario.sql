begin;

create table if not exists public.extratos_bancarios_importacoes (
  id uuid primary key default gen_random_uuid(),
  nome_arquivo text not null,
  hash_arquivo text not null unique,
  quantidade_lancamentos integer not null check (quantidade_lancamentos > 0),
  usuario_auth_id uuid not null,
  usuario_email text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.extratos_bancarios_lancamentos (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null references public.extratos_bancarios_importacoes(id) on delete restrict,
  numero_linha integer not null,
  data_lancamento date not null,
  descricao text not null,
  referencia text,
  valor numeric not null,
  movimento_sugerido_id uuid references public.movimentacoes_financeiras_auditoria(id) on delete set null,
  status text not null default 'Importado' check (status in ('Importado', 'Conciliado', 'Ignorado')),
  created_at timestamp with time zone not null default now(),
  unique (importacao_id, numero_linha)
);

create index if not exists extratos_lancamentos_data_valor_idx
  on public.extratos_bancarios_lancamentos (data_lancamento, valor);

create index if not exists extratos_lancamentos_movimento_idx
  on public.extratos_bancarios_lancamentos (movimento_sugerido_id)
  where movimento_sugerido_id is not null;

alter table public.extratos_bancarios_importacoes enable row level security;
alter table public.extratos_bancarios_lancamentos enable row level security;

drop policy if exists extratos_importacoes_acesso on public.extratos_bancarios_importacoes;
create policy extratos_importacoes_acesso
  on public.extratos_bancarios_importacoes
  for all
  to authenticated
  using (
    exists (
      select 1 from public.perfis_usuarios p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.ativo is true
        and lower(p.perfil) in ('administrador', 'financeiro')
    )
  )
  with check (
    usuario_auth_id = auth.uid()
    and exists (
      select 1 from public.perfis_usuarios p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.ativo is true
        and lower(p.perfil) in ('administrador', 'financeiro')
    )
  );

drop policy if exists extratos_lancamentos_acesso on public.extratos_bancarios_lancamentos;
create policy extratos_lancamentos_acesso
  on public.extratos_bancarios_lancamentos
  for all
  to authenticated
  using (
    exists (
      select 1 from public.perfis_usuarios p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.ativo is true
        and lower(p.perfil) in ('administrador', 'financeiro')
    )
  )
  with check (
    exists (
      select 1 from public.perfis_usuarios p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.ativo is true
        and lower(p.perfil) in ('administrador', 'financeiro')
    )
  );

grant select on public.extratos_bancarios_importacoes to authenticated;
grant select, update on public.extratos_bancarios_lancamentos to authenticated;
revoke all on public.extratos_bancarios_importacoes from anon;
revoke all on public.extratos_bancarios_lancamentos from anon;

create or replace function public.importar_extrato_bancario(
  p_nome_arquivo text,
  p_hash_arquivo text,
  p_lancamentos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_importacao_id uuid;
  v_lancamento jsonb;
  v_quantidade integer;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
    or lower(coalesce(v_perfil.perfil, '')) not in ('administrador', 'financeiro')
  then
    raise exception 'Somente Administrador ou Financeiro pode importar extratos.';
  end if;

  if length(btrim(coalesce(p_nome_arquivo, ''))) < 3 then
    raise exception 'Nome do arquivo inválido.';
  end if;

  if length(btrim(coalesce(p_hash_arquivo, ''))) < 32 then
    raise exception 'Identificador do arquivo inválido.';
  end if;

  if jsonb_typeof(p_lancamentos) <> 'array'
    or jsonb_array_length(p_lancamentos) = 0
  then
    raise exception 'O extrato não possui lançamentos válidos.';
  end if;

  if exists (
    select 1 from public.extratos_bancarios_importacoes
    where hash_arquivo = p_hash_arquivo
  ) then
    raise exception 'Este arquivo já foi importado.';
  end if;

  v_quantidade := jsonb_array_length(p_lancamentos);

  insert into public.extratos_bancarios_importacoes (
    nome_arquivo,
    hash_arquivo,
    quantidade_lancamentos,
    usuario_auth_id,
    usuario_email
  ) values (
    btrim(p_nome_arquivo),
    btrim(p_hash_arquivo),
    v_quantidade,
    auth.uid(),
    auth.jwt() ->> 'email'
  )
  returning id into v_importacao_id;

  for v_lancamento in
    select value from jsonb_array_elements(p_lancamentos)
  loop
    if coalesce((v_lancamento ->> 'numero_linha')::integer, 0) < 2
      or nullif(v_lancamento ->> 'data_lancamento', '') is null
      or length(btrim(coalesce(v_lancamento ->> 'descricao', ''))) = 0
      or nullif(v_lancamento ->> 'valor', '') is null
    then
      raise exception 'O extrato contém um lançamento inválido.';
    end if;

    insert into public.extratos_bancarios_lancamentos (
      importacao_id,
      numero_linha,
      data_lancamento,
      descricao,
      referencia,
      valor,
      movimento_sugerido_id
    ) values (
      v_importacao_id,
      (v_lancamento ->> 'numero_linha')::integer,
      (v_lancamento ->> 'data_lancamento')::date,
      btrim(v_lancamento ->> 'descricao'),
      nullif(btrim(coalesce(v_lancamento ->> 'referencia', '')), ''),
      (v_lancamento ->> 'valor')::numeric,
      nullif(v_lancamento ->> 'movimento_sugerido_id', '')::uuid
    );
  end loop;

  return jsonb_build_object(
    'importacao_id', v_importacao_id,
    'quantidade', v_quantidade,
    'duplicado', false
  );
end;
$$;

revoke all on function public.importar_extrato_bancario(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.importar_extrato_bancario(text, text, jsonb)
  to authenticated;

commit;

-- Verificação:
select
  to_regclass('public.extratos_bancarios_importacoes') is not null as tabela_importacoes,
  to_regclass('public.extratos_bancarios_lancamentos') is not null as tabela_lancamentos,
  to_regprocedure('public.importar_extrato_bancario(text,text,jsonb)') is not null
    as funcao_importacao,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'extratos_bancarios_importacoes',
        'extratos_bancarios_lancamentos'
      )
  ) as politicas;
