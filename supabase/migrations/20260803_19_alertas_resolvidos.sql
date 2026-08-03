begin;

create table if not exists public.alertas_resolvidos (
  id uuid primary key default gen_random_uuid(),
  alerta_chave text not null,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  resolvido_em timestamptz not null default now(),
  unique (alerta_chave, usuario_id)
);

alter table public.alertas_resolvidos enable row level security;

drop policy if exists "alertas_resolvidos_proprios_select" on public.alertas_resolvidos;
create policy "alertas_resolvidos_proprios_select" on public.alertas_resolvidos
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "alertas_resolvidos_proprios_insert" on public.alertas_resolvidos;
create policy "alertas_resolvidos_proprios_insert" on public.alertas_resolvidos
  for insert to authenticated with check (usuario_id = auth.uid());

drop policy if exists "alertas_resolvidos_proprios_delete" on public.alertas_resolvidos;
create policy "alertas_resolvidos_proprios_delete" on public.alertas_resolvidos
  for delete to authenticated using (usuario_id = auth.uid());

create index if not exists alertas_resolvidos_usuario_idx
  on public.alertas_resolvidos (usuario_id, resolvido_em desc);

commit;

select
  to_regclass('public.alertas_resolvidos') is not null as tabela_alertas,
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'alertas_resolvidos'
  ) as politicas_alertas;
