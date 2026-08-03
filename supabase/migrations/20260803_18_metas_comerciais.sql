begin;

create table if not exists public.metas_comerciais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'Vendas',
  valor_meta numeric(14,2) not null default 0,
  periodo text not null default 'Mensal',
  mes integer,
  ano integer not null default extract(year from current_date)::integer,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.metas_comerciais
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null,
  add column if not exists representada text;

alter table public.metas_comerciais enable row level security;

drop policy if exists "metas_comerciais_select_authenticated" on public.metas_comerciais;
create policy "metas_comerciais_select_authenticated"
  on public.metas_comerciais for select to authenticated using (true);

drop policy if exists "metas_comerciais_insert_authenticated" on public.metas_comerciais;
create policy "metas_comerciais_insert_authenticated"
  on public.metas_comerciais for insert to authenticated with check (true);

drop policy if exists "metas_comerciais_update_authenticated" on public.metas_comerciais;
create policy "metas_comerciais_update_authenticated"
  on public.metas_comerciais for update to authenticated using (true) with check (true);

drop policy if exists "metas_comerciais_delete_authenticated" on public.metas_comerciais;
create policy "metas_comerciais_delete_authenticated"
  on public.metas_comerciais for delete to authenticated using (true);

create index if not exists metas_comerciais_periodo_idx
  on public.metas_comerciais (ano, mes, tipo);

commit;

select
  to_regclass('public.metas_comerciais') is not null as tabela_metas,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'metas_comerciais' and column_name = 'cliente_id'
  ) as coluna_cliente,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'metas_comerciais' and column_name = 'representada'
  ) as coluna_representada;
