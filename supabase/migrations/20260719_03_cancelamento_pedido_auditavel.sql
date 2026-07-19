begin;

alter table public.pedidos
  add column if not exists cancelado_em timestamptz,
  add column if not exists cancelado_por uuid,
  add column if not exists motivo_cancelamento text;

create index if not exists pedidos_cancelado_em_idx
  on public.pedidos (cancelado_em)
  where cancelado_em is not null;

create or replace function public.cancelar_pedido(
  p_pedido_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_receber_canceladas integer := 0;
  v_pagar_canceladas integer := 0;
  v_comissoes_canceladas integer := 0;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para cancelar um pedido.';
  end if;

  if not public.usuario_administrador() then
    raise exception 'Somente administradores podem cancelar pedidos.';
  end if;

  if nullif(btrim(p_motivo), '') is null or length(btrim(p_motivo)) < 5 then
    raise exception 'Informe um motivo de cancelamento com pelo menos 5 caracteres.';
  end if;

  select *
    into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if lower(coalesce(v_pedido.status, '')) = 'cancelado' then
    return jsonb_build_object(
      'pedido_id', v_pedido.id,
      'numero', coalesce(v_pedido.numero, v_pedido.numero_pedido),
      'status', 'Cancelado',
      'reutilizado', true
    );
  end if;

  if exists (
    select 1
    from public.contas_receber
    where pedido_id = p_pedido_id
      and (
        recebimento is not null
        or lower(coalesce(status, '')) in ('recebido', 'pago', 'quitado')
      )
  ) then
    raise exception
      'O pedido possui recebimento confirmado e não pode ser cancelado automaticamente.';
  end if;

  if exists (
    select 1
    from public.contas_pagar
    where pedido_id = p_pedido_id
      and (
        pagamento is not null
        or lower(coalesce(status, '')) in ('pago', 'quitado')
      )
  ) then
    raise exception
      'O pedido possui pagamento confirmado e não pode ser cancelado automaticamente.';
  end if;

  if exists (
    select 1
    from public.comissoes_financeiro
    where pedido_id = p_pedido_id
      and (
        data_recebimento is not null
        or lower(coalesce(status, '')) in ('recebida', 'recebido', 'pago', 'quitado')
      )
  ) then
    raise exception
      'O pedido possui comissão recebida e não pode ser cancelado automaticamente.';
  end if;

  update public.contas_receber
  set
    status = 'Cancelado',
    observacoes = concat_ws(
      E'\n',
      nullif(observacoes, ''),
      'Cancelado pelo pedido: ' || btrim(p_motivo)
    )
  where pedido_id = p_pedido_id
    and lower(coalesce(status, '')) <> 'cancelado';
  get diagnostics v_receber_canceladas = row_count;

  update public.contas_pagar
  set
    status = 'Cancelado',
    observacoes = concat_ws(
      E'\n',
      nullif(observacoes, ''),
      'Cancelado pelo pedido: ' || btrim(p_motivo)
    )
  where pedido_id = p_pedido_id
    and lower(coalesce(status, '')) <> 'cancelado';
  get diagnostics v_pagar_canceladas = row_count;

  update public.comissoes_financeiro
  set
    status = 'Cancelado',
    observacoes = concat_ws(
      E'\n',
      nullif(observacoes, ''),
      'Cancelado pelo pedido: ' || btrim(p_motivo)
    )
  where pedido_id = p_pedido_id
    and lower(coalesce(status, '')) <> 'cancelado';
  get diagnostics v_comissoes_canceladas = row_count;

  update public.pedidos
  set
    status = 'Cancelado',
    gera_financeiro = false,
    gera_comissao = false,
    cancelado_em = now(),
    cancelado_por = auth.uid(),
    motivo_cancelamento = btrim(p_motivo)
  where id = p_pedido_id;

  return jsonb_build_object(
    'pedido_id', p_pedido_id,
    'numero', coalesce(v_pedido.numero, v_pedido.numero_pedido),
    'status', 'Cancelado',
    'contas_receber_canceladas', v_receber_canceladas,
    'contas_pagar_canceladas', v_pagar_canceladas,
    'comissoes_canceladas', v_comissoes_canceladas,
    'reutilizado', false
  );
end;
$$;

revoke all on function public.cancelar_pedido(uuid, text) from public;
revoke all on function public.cancelar_pedido(uuid, text) from anon;
grant execute on function public.cancelar_pedido(uuid, text) to authenticated;

commit;
