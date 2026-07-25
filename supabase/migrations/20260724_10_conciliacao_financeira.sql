begin;

create table if not exists public.conciliacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  movimento_id uuid not null unique
    references public.movimentacoes_financeiras_auditoria(id),
  status text not null default 'Conciliado'
    check (status in ('Conciliado', 'Desfeito')),
  data_conciliacao date not null,
  referencia text not null check (length(btrim(referencia)) >= 2),
  observacoes text,
  motivo_desfazer text,
  usuario_auth_id uuid not null,
  usuario_perfil_id uuid,
  usuario_email text,
  conciliado_at timestamp with time zone not null default now(),
  desfeito_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

create index if not exists conciliacoes_financeiras_data_idx
  on public.conciliacoes_financeiras (data_conciliacao desc);

alter table public.conciliacoes_financeiras enable row level security;

drop policy if exists conciliacoes_financeiras_consulta
  on public.conciliacoes_financeiras;
create policy conciliacoes_financeiras_consulta
  on public.conciliacoes_financeiras
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.perfis_usuarios p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.ativo is true
        and lower(p.perfil) in ('administrador', 'financeiro')
    )
  );

revoke insert, update, delete on public.conciliacoes_financeiras
  from anon, authenticated;
grant select on public.conciliacoes_financeiras to authenticated;

create or replace function public.conciliar_movimento_financeiro(
  p_movimento_id uuid,
  p_data_conciliacao date,
  p_referencia text,
  p_observacoes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_movimento public.movimentacoes_financeiras_auditoria%rowtype;
  v_conciliacao public.conciliacoes_financeiras%rowtype;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
    or lower(coalesce(v_perfil.perfil, ''))
      not in ('administrador', 'financeiro') then
    raise exception 'Somente Administrador ou Financeiro pode conciliar.';
  end if;

  if p_data_conciliacao is null then
    raise exception 'Informe a data da conciliação.';
  end if;

  if length(btrim(coalesce(p_referencia, ''))) < 2 then
    raise exception 'Informe a referência do extrato bancário.';
  end if;

  select * into v_movimento
  from public.movimentacoes_financeiras_auditoria
  where id = p_movimento_id
    and operacao = 'Baixa'
  for update;

  if v_movimento.id is null then
    raise exception 'Baixa financeira não encontrada.';
  end if;

  if exists (
    select 1
    from public.movimentacoes_financeiras_auditoria estorno
    where estorno.entidade = v_movimento.entidade
      and estorno.registro_id = v_movimento.registro_id
      and estorno.operacao = 'Estorno'
      and estorno.created_at > v_movimento.created_at
  ) then
    raise exception 'Uma baixa estornada não pode ser conciliada.';
  end if;

  insert into public.conciliacoes_financeiras (
    movimento_id,
    status,
    data_conciliacao,
    referencia,
    observacoes,
    usuario_auth_id,
    usuario_perfil_id,
    usuario_email,
    conciliado_at,
    desfeito_at,
    updated_at
  ) values (
    p_movimento_id,
    'Conciliado',
    p_data_conciliacao,
    btrim(p_referencia),
    nullif(btrim(coalesce(p_observacoes, '')), ''),
    auth.uid(),
    v_perfil.id,
    auth.jwt() ->> 'email',
    now(),
    null,
    now()
  )
  on conflict (movimento_id) do update
  set status = 'Conciliado',
      data_conciliacao = excluded.data_conciliacao,
      referencia = excluded.referencia,
      observacoes = excluded.observacoes,
      motivo_desfazer = null,
      usuario_auth_id = excluded.usuario_auth_id,
      usuario_perfil_id = excluded.usuario_perfil_id,
      usuario_email = excluded.usuario_email,
      conciliado_at = now(),
      desfeito_at = null,
      updated_at = now()
  returning * into v_conciliacao;

  return jsonb_build_object(
    'movimento_id', v_conciliacao.movimento_id,
    'status', v_conciliacao.status,
    'data_conciliacao', v_conciliacao.data_conciliacao,
    'referencia', v_conciliacao.referencia
  );
end;
$$;

create or replace function public.desfazer_conciliacao_financeira(
  p_movimento_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_conciliacao public.conciliacoes_financeiras%rowtype;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
    or lower(coalesce(v_perfil.perfil, ''))
      not in ('administrador', 'financeiro') then
    raise exception 'Somente Administrador ou Financeiro pode desfazer.';
  end if;

  if length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Informe o motivo com pelo menos 3 caracteres.';
  end if;

  update public.conciliacoes_financeiras
  set status = 'Desfeito',
      motivo_desfazer = btrim(p_motivo),
      usuario_auth_id = auth.uid(),
      usuario_perfil_id = v_perfil.id,
      usuario_email = auth.jwt() ->> 'email',
      desfeito_at = now(),
      updated_at = now()
  where movimento_id = p_movimento_id
    and status = 'Conciliado'
  returning * into v_conciliacao;

  if v_conciliacao.id is null then
    raise exception 'Conciliação ativa não encontrada.';
  end if;

  return jsonb_build_object(
    'movimento_id', v_conciliacao.movimento_id,
    'status', v_conciliacao.status,
    'motivo', v_conciliacao.motivo_desfazer
  );
end;
$$;

revoke all on function public.conciliar_movimento_financeiro(
  uuid, date, text, text
) from public, anon;
revoke all on function public.desfazer_conciliacao_financeira(
  uuid, text
) from public, anon;

grant execute on function public.conciliar_movimento_financeiro(
  uuid, date, text, text
) to authenticated;
grant execute on function public.desfazer_conciliacao_financeira(
  uuid, text
) to authenticated;

commit;
