select
  to_regprocedure('public.estornar_conta_receber(uuid,text)') is not null
    as funcao_estorno_receber,
  to_regprocedure('public.estornar_conta_pagar(uuid,text)') is not null
    as funcao_estorno_pagar,
  to_regprocedure('public.estornar_comissao(uuid,text)') is not null
    as funcao_estorno_comissao,
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.movimentacoes_financeiras_auditoria'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%Estorno%'
  ) as auditoria_aceita_estorno;

select
  operacao,
  count(*) as quantidade
from public.movimentacoes_financeiras_auditoria
group by operacao
order by operacao;
