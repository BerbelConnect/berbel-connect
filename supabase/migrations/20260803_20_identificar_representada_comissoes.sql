begin;

alter table public.comissoes_financeiro
  add column if not exists representada_id uuid references public.representadas(id) on delete set null;

create index if not exists comissoes_financeiro_representada_id_idx
  on public.comissoes_financeiro (representada_id);

create or replace function public.identificar_representada_da_comissao()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_representada_id uuid;
  v_representada_nome text;
  v_quantidade integer;
begin
  if new.pedido_id is null then
    return new;
  end if;

  select
    (array_agg(distinct produto.representada_id))[1],
    min(representada.nome_fantasia),
    count(distinct produto.representada_id)
  into
    v_representada_id,
    v_representada_nome,
    v_quantidade
  from public.pedido_itens item
  join public.produtos produto on produto.id = item.produto_id
  join public.representadas representada on representada.id = produto.representada_id
  where item.pedido_id = new.pedido_id
    and produto.representada_id is not null;

  -- Só preenche automaticamente quando todos os itens identificados pertencem
  -- à mesma representada. Pedidos mistos permanecem disponíveis para revisão.
  if v_quantidade = 1 then
    new.representada_id := v_representada_id;
    new.empresa := v_representada_nome;
  end if;

  return new;
end;
$$;

drop trigger if exists identificar_representada_comissao
  on public.comissoes_financeiro;

create trigger identificar_representada_comissao
before insert or update of pedido_id, empresa
on public.comissoes_financeiro
for each row
execute function public.identificar_representada_da_comissao();

-- Corrige o histórico quando os itens do pedido apontam de forma inequívoca
-- para uma única representada.
with representada_por_pedido as (
  select
    item.pedido_id,
    (array_agg(distinct produto.representada_id))[1] as representada_id,
    min(representada.nome_fantasia) as representada_nome
  from public.pedido_itens item
  join public.produtos produto on produto.id = item.produto_id
  join public.representadas representada on representada.id = produto.representada_id
  where produto.representada_id is not null
  group by item.pedido_id
  having count(distinct produto.representada_id) = 1
)
update public.comissoes_financeiro comissao
set
  representada_id = origem.representada_id,
  empresa = origem.representada_nome
from representada_por_pedido origem
where origem.pedido_id = comissao.pedido_id
  and (
    comissao.representada_id is distinct from origem.representada_id
    or comissao.empresa is distinct from origem.representada_nome
  );

commit;

-- Verificação: mostra quantas comissões já estão identificadas e quais ainda
-- precisam de revisão por falta de vínculo ou por pedido com várias empresas.
select
  count(*) as total_comissoes,
  count(*) filter (where representada_id is not null) as identificadas,
  count(*) filter (where representada_id is null) as revisar,
  count(distinct representada_id) filter (where representada_id is not null) as representadas_encontradas
from public.comissoes_financeiro;

select
  coalesce(empresa, 'Não informada') as representada,
  count(*) as comissoes,
  round(sum(coalesce(valor_base, 0)), 2) as valor_base,
  round(sum(coalesce(valor_comissao, 0)), 2) as valor_comissao
from public.comissoes_financeiro
group by empresa
order by empresa;
