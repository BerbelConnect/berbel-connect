begin;

alter table public.movimentacoes_financeiras_auditoria
  drop constraint if exists movimentacoes_financeiras_auditoria_operacao_check;

alter table public.movimentacoes_financeiras_auditoria
  add constraint movimentacoes_financeiras_auditoria_operacao_check
  check (operacao in ('Baixa', 'Estorno'));

create or replace function public.estornar_movimento_financeiro(
  p_entidade text,
  p_id uuid,
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
  v_status_novo text := 'Pendente';
  v_pedido_id uuid;
  v_valor numeric;
  v_forma_pagamento text;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
     or lower(coalesce(v_perfil.perfil, '')) not in ('administrador', 'financeiro') then
    raise exception 'Somente Administrador ou Financeiro pode realizar estornos.';
  end if;

  if length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Informe o motivo do estorno com pelo menos 3 caracteres.';
  end if;

  if p_entidade = 'contas_receber' then
    select status, pedido_id, valor, forma_pagamento
      into v_status, v_pedido_id, v_valor, v_forma_pagamento
    from public.contas_receber
    where id = p_id
    for update;

    if not found then raise exception 'Conta a receber não encontrada.'; end if;
    if lower(coalesce(v_status, '')) not in ('recebido', 'recebida', 'quitado') then
      raise exception 'Somente uma conta recebida pode ser estornada.';
    end if;

    update public.contas_receber
    set status = v_status_novo,
        recebimento = null
    where id = p_id;

  elsif p_entidade = 'contas_pagar' then
    select status, pedido_id, valor, forma_pagamento
      into v_status, v_pedido_id, v_valor, v_forma_pagamento
    from public.contas_pagar
    where id = p_id
    for update;

    if not found then raise exception 'Conta a pagar não encontrada.'; end if;
    if lower(coalesce(v_status, '')) not in ('pago', 'paga', 'quitado') then
      raise exception 'Somente uma conta paga pode ser estornada.';
    end if;

    update public.contas_pagar
    set status = v_status_novo,
        pagamento = null
    where id = p_id;

  elsif p_entidade = 'comissoes_financeiro' then
    select status, pedido_id, valor_comissao
      into v_status, v_pedido_id, v_valor
    from public.comissoes_financeiro
    where id = p_id
    for update;

    if not found then raise exception 'Comissão não encontrada.'; end if;
    if lower(coalesce(v_status, '')) not in ('recebido', 'recebida', 'pago', 'quitado') then
      raise exception 'Somente uma comissão recebida pode ser estornada.';
    end if;

    update public.comissoes_financeiro
    set status = v_status_novo,
        data_recebimento = null
    where id = p_id;

  else
    raise exception 'Tipo de movimento financeiro inválido.';
  end if;

  insert into public.movimentacoes_financeiras_auditoria (
    entidade, registro_id, pedido_id, operacao, status_anterior, status_novo,
    data_movimento, forma_pagamento, motivo, valor, usuario_auth_id,
    usuario_perfil_id, usuario_email
  ) values (
    p_entidade, p_id, v_pedido_id, 'Estorno', v_status, v_status_novo,
    current_date, v_forma_pagamento, btrim(p_motivo), v_valor, auth.uid(),
    v_perfil.id, auth.jwt() ->> 'email'
  );

  return jsonb_build_object(
    'entidade', p_entidade,
    'registro_id', p_id,
    'status', v_status_novo,
    'operacao', 'Estorno',
    'auditado', true
  );
end;
$$;

revoke all on function public.estornar_movimento_financeiro(text, uuid, text)
  from public, anon, authenticated;

create or replace function public.estornar_conta_receber(
  p_id uuid, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.estornar_movimento_financeiro('contas_receber', p_id, p_motivo); $$;

create or replace function public.estornar_conta_pagar(
  p_id uuid, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.estornar_movimento_financeiro('contas_pagar', p_id, p_motivo); $$;

create or replace function public.estornar_comissao(
  p_id uuid, p_motivo text
) returns jsonb
language sql security definer set search_path = public
as $$ select public.estornar_movimento_financeiro('comissoes_financeiro', p_id, p_motivo); $$;

revoke all on function public.estornar_conta_receber(uuid, text) from public, anon;
revoke all on function public.estornar_conta_pagar(uuid, text) from public, anon;
revoke all on function public.estornar_comissao(uuid, text) from public, anon;
grant execute on function public.estornar_conta_receber(uuid, text) to authenticated;
grant execute on function public.estornar_conta_pagar(uuid, text) to authenticated;
grant execute on function public.estornar_comissao(uuid, text) to authenticated;

commit;
