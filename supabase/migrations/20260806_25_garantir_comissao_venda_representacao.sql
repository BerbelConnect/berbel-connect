begin;

-- Garante que toda venda de representacao com comissao positiva possua
-- exatamente um lancamento no fechamento. A verificacao e adiada ate o fim
-- da transacao para permitir que criar_pedido_completo grave primeiro os itens
-- e, nas instalacoes atualizadas, a propria comissao.
create or replace function public.garantir_comissao_do_pedido(p_pedido_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_empresa text;
  v_representada_id uuid;
  v_quantidade_representadas integer;
begin
  select * into v_pedido
  from public.pedidos
  where id = p_pedido_id;

  if not found
    or not coalesce(v_pedido.gera_comissao, false)
    or coalesce(v_pedido.valor_comissao, 0) <= 0
    or lower(translate(coalesce(v_pedido.status, ''),
      'ÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç',
      'AAAAEEEIIIOOOOUUUCaaaaeeeiiioooouuuc')) in ('orcamento', 'cancelado', 'cancelada')
  then
    return 0;
  end if;

  if exists (
    select 1 from public.comissoes_financeiro
    where pedido_id = p_pedido_id
  ) then
    return 0;
  end if;

  select
    min(representada.nome_fantasia),
    (array_agg(distinct produto.representada_id))[1],
    count(distinct produto.representada_id)
  into v_empresa, v_representada_id, v_quantidade_representadas
  from public.pedido_itens item
  join public.produtos produto on produto.id = item.produto_id
  join public.representadas representada on representada.id = produto.representada_id
  where item.pedido_id = p_pedido_id
    and produto.representada_id is not null;

  -- Um pedido de representacao deve apontar para uma unica representada.
  -- Se o cadastro antigo nao possuir o vinculo, preserva um nome neutro para
  -- nao perder a comissao; pedidos mistos ficam bloqueados para revisao.
  if coalesce(v_quantidade_representadas, 0) > 1 then
    raise exception 'O pedido % possui produtos de mais de uma representada.',
      coalesce(v_pedido.numero, v_pedido.numero_pedido, p_pedido_id::text);
  end if;

  insert into public.comissoes_financeiro (
    pedido_id,
    cliente_id,
    representada_id,
    empresa,
    percentual,
    valor_base,
    valor_comissao,
    previsao_recebimento,
    data_previsao,
    status
  ) values (
    v_pedido.id,
    v_pedido.cliente_id,
    v_representada_id,
    coalesce(nullif(v_empresa, ''), 'Representacao'),
    case
      when coalesce(v_pedido.valor_total, 0) > 0
        then round((v_pedido.valor_comissao / v_pedido.valor_total) * 100, 4)
      else 0
    end,
    coalesce(v_pedido.valor_total, 0),
    v_pedido.valor_comissao,
    null,
    null,
    'Pendente'
  );

  return 1;
end;
$$;

revoke all on function public.garantir_comissao_do_pedido(uuid) from public, anon;
grant execute on function public.garantir_comissao_do_pedido(uuid) to authenticated;

create or replace function public.garantir_comissao_apos_pedido()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.garantir_comissao_do_pedido(new.id);
  return new;
end;
$$;

drop trigger if exists zz_garantir_comissao_apos_pedido on public.pedidos;
create constraint trigger zz_garantir_comissao_apos_pedido
after insert or update on public.pedidos
deferrable initially deferred
for each row execute function public.garantir_comissao_apos_pedido();

-- Repara vendas de representacao existentes que ficaram sem lancamento,
-- incluindo pedidos criados antes desta migration.
select public.garantir_comissao_do_pedido(pedido.id)
from public.pedidos pedido
where coalesce(pedido.gera_comissao, false)
  and coalesce(pedido.valor_comissao, 0) > 0
  and not exists (
    select 1 from public.comissoes_financeiro comissao
    where comissao.pedido_id = pedido.id
  );

commit;
