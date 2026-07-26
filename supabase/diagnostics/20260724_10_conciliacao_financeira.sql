select
  to_regclass('public.conciliacoes_financeiras') is not null
    as tabela_conciliacoes,
  to_regprocedure(
    'public.conciliar_movimento_financeiro(uuid,date,text,text)'
  ) is not null as funcao_conciliar,
  to_regprocedure(
    'public.desfazer_conciliacao_financeira(uuid,text)'
  ) is not null as funcao_desfazer,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'conciliacoes_financeiras'
  ) as politicas_rls;

select
  status,
  count(*) as quantidade,
  coalesce(sum(m.valor), 0) as valor
from public.conciliacoes_financeiras c
join public.movimentacoes_financeiras_auditoria m
  on m.id = c.movimento_id
group by status
order by status;
