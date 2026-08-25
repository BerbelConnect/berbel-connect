begin;

alter table public.visitas alter column cliente_id drop not null;
alter table public.visitas
  add column if not exists contato_avulso_nome text,
  add column if not exists contato_avulso_empresa text,
  add column if not exists contato_avulso_telefone text,
  add column if not exists contato_avulso_endereco text,
  add column if not exists iniciada_em timestamptz;

alter table public.visitas drop constraint if exists visitas_cliente_ou_contato_check;
alter table public.visitas add constraint visitas_cliente_ou_contato_check
  check (cliente_id is not null or nullif(trim(contato_avulso_nome), '') is not null);

create index if not exists visitas_contato_avulso_nome_idx
  on public.visitas (lower(contato_avulso_nome))
  where contato_avulso_nome is not null;

commit;
