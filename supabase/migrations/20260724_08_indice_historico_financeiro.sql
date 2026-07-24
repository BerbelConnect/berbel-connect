begin;

create index if not exists movimentacoes_financeiras_created_at_idx
  on public.movimentacoes_financeiras_auditoria (created_at desc);

commit;
