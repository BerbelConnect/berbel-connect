begin;

create table if not exists public.movimentacoes_financeiras_auditoria (
  id uuid primary key default gen_random_uuid(),
  entidade text not null check (entidade in ('contas_receber', 'contas_pagar', 'comissoes_financeiro')),
  registro_id uuid not null,
  pedido_id uuid,
  operacao text not null check (operacao in ('Baixa')),
  status_anterior text,
  status_novo text not null,
  data_movimento date not null,
  forma_pagamento text,
  motivo text not null check (length(btrim(motivo)) >= 3),
  valor numeric,
  usuario_auth_id uuid not null,
  usuario_perfil_id uuid,
  usuario_email text,
  created_at timestamp with time zone not null default now()
);

create index if not exists movimentacoes_financeiras_registro_idx
  on public.movimentacoes_financeiras_auditoria (entidade, registro_id, created_at desc);

create index if not exists movimentacoes_financeiras_pedido_idx
  on public.movimentacoes_financeiras_auditoria (pedido_id, created_at desc);

alter table public.movimentacoes_financeiras_auditoria enable row level security;

drop policy if exists movimentacoes_financeiras_consulta on public.movimentacoes_financeiras_auditoria;
create policy movimentacoes_financeiras_consulta
  on public.movimentacoes_financeiras_auditoria
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

revoke insert, update, delete on public.movimentacoes_financeiras_auditoria from anon, authenticated;
grant select on public.movimentacoes_financeiras_auditoria to authenticated;

create or replace function public.baixar_movimento_financeiro(
  p_entidade text,
  p_id uuid,
  p_data date,
  p_forma_pagamento text,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_status text;
  v_status_novo text;
  v_pedido_id uuid;
  v_valor numeric;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null or lower(coalesce(v_perfil.perfil, '')) not in ('administrador', 'financeiro') then
    raise exception 'Somente Administrador ou Financeiro pode confirmar baixas.';
  end if;

  if p_data is null then
    raise exception 'Informe a data da baixa.';
  end if;

  if length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Informe um motivo com pelo menos 3 caracteres.';
  end if;

  if p_entidade = 'contas_receber' then
    select status, pedido_id, valor into v_status, v_pedido_id, v_valor
    from public.contas_receber where id = p_id for update;
    v_status_novo := 'Recebido';

    if not found then raise exception 'Conta a receber não encontrada.'; end if;
    if lower(coalesce(v_status, '')) in ('recebido', 'pago', 'quitado') then
      raise exception 'Esta conta já foi recebida.';
    end if;
    if lower(coalesce(v_status, '')) = 'cancelado' then
      raise exception 'Uma conta cancelada não pode ser recebida.';
    end if;

    update public.contas_receber
    set status = v_status_novo,
        recebimento = p_data,
        forma_pagamento = coalesce(nullif(btrim(p_forma_pagamento), ''), forma_pagamento)
    where id = p_id;
  elsif p_entidade = 'contas_pagar' then
    select status, pedido_id, valor into v_status, v_pedido_id, v_valor
    from public.contas_pagar where id = p_id for update;
    v_status_novo := 'Pago';

    if not found then raise exception 'Conta a pagar não encontrada.'; end if;
    if lower(coalesce(v_status, '')) in ('pago', 'quitado') then
      raise exception 'Esta conta já foi paga.';
    end if;
    if lower(coalesce(v_status, '')) = 'cancelado' then
      raise exception 'Uma conta cancelada não pode ser paga.';
    end if;

    update public.contas_pagar
    set status = v_status_novo,
        pagamento = p_data,
        forma_pagamento = coalesce(nullif(btrim(p_forma_pagamento), ''), forma_pagamento)
    where id = p_id;
  elsif p_entidade = 'comissoes_financeiro' then
    select status, pedido_id, valor_comissao into v_status, v_pedido_id, v_valor
    from public.comissoes_financeiro where id = p_id for update;
    v_status_novo := 'Recebida';

    if not found then raise exception 'Comissão não encontrada.'; end if;
    if lower(coalesce(v_status, '')) in ('recebida', 'recebido', 'pago', 'quitado') then
      raise exception 'Esta comissão já foi recebida.';
    end if;
    if lower(coalesce(v_status, '')) = 'cancelado' then
      raise exception 'Uma comissão cancelada não pode ser recebida.';
    end if;

    update public.comissoes_financeiro
    set status = v_status_novo, data_recebimento = p_data
    where id = p_id;
  else
    raise exception 'Tipo de movimento financeiro inválido.';
  end if;

  insert into public.movimentacoes_financeiras_auditoria (
    entidade, registro_id, pedido_id, operacao, status_anterior, status_novo,
    data_movimento, forma_pagamento, motivo, valor, usuario_auth_id,
    usuario_perfil_id, usuario_email
  ) values (
    p_entidade, p_id, v_pedido_id, 'Baixa', v_status, v_status_novo,
    p_data, nullif(btrim(p_forma_pagamento), ''), btrim(p_motivo), v_valor,
    auth.uid(), v_perfil.id, auth.jwt() ->> 'email'
  );

  return jsonb_build_object(
    'entidade', p_entidade,
    'registro_id', p_id,
    'status', v_status_novo,
    'data', p_data,
    'auditado', true
  );
end;
$$;

revoke all on function public.baixar_movimento_financeiro(text, uuid, date, text, text) from public, anon, authenticated;

create or replace function public.baixar_conta_receber(
  p_id uuid, p_data date, p_forma_pagamento text, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.baixar_movimento_financeiro('contas_receber', p_id, p_data, p_forma_pagamento, p_motivo); $$;

create or replace function public.baixar_conta_pagar(
  p_id uuid, p_data date, p_forma_pagamento text, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.baixar_movimento_financeiro('contas_pagar', p_id, p_data, p_forma_pagamento, p_motivo); $$;

create or replace function public.baixar_comissao(
  p_id uuid, p_data date, p_forma_pagamento text, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.baixar_movimento_financeiro('comissoes_financeiro', p_id, p_data, p_forma_pagamento, p_motivo); $$;

revoke all on function public.baixar_conta_receber(uuid, date, text, text) from public, anon;
revoke all on function public.baixar_conta_pagar(uuid, date, text, text) from public, anon;
revoke all on function public.baixar_comissao(uuid, date, text, text) from public, anon;
grant execute on function public.baixar_conta_receber(uuid, date, text, text) to authenticated;
grant execute on function public.baixar_conta_pagar(uuid, date, text, text) to authenticated;
grant execute on function public.baixar_comissao(uuid, date, text, text) to authenticated;

commit;
