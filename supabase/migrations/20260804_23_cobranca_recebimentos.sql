begin;

create table if not exists public.cobrancas_recebimentos (
  id uuid primary key default gen_random_uuid(),
  comissao_id uuid not null references public.comissoes_financeiro(id) on delete cascade,
  contato_em timestamptz not null default now(),
  canal text not null check (canal in ('WhatsApp', 'Telefone', 'E-mail', 'Visita', 'Outro')),
  resultado text not null check (resultado in ('Sem retorno', 'Contato realizado', 'Promessa de pagamento', 'Contestação', 'Outro')),
  promessa_data date,
  promessa_valor numeric(14,2) check (promessa_valor is null or promessa_valor >= 0),
  observacoes text not null check (char_length(trim(observacoes)) >= 3),
  usuario_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint promessa_completa check (
    resultado <> 'Promessa de pagamento'
    or (promessa_data is not null and promessa_valor is not null and promessa_valor > 0)
  )
);

alter table public.cobrancas_recebimentos enable row level security;

drop policy if exists "cobrancas_recebimentos_select" on public.cobrancas_recebimentos;
create policy "cobrancas_recebimentos_select" on public.cobrancas_recebimentos
  for select to authenticated using (true);

drop policy if exists "cobrancas_recebimentos_insert" on public.cobrancas_recebimentos;
create policy "cobrancas_recebimentos_insert" on public.cobrancas_recebimentos
  for insert to authenticated with check (usuario_id = auth.uid());

drop policy if exists "cobrancas_recebimentos_update" on public.cobrancas_recebimentos;
create policy "cobrancas_recebimentos_update" on public.cobrancas_recebimentos
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists cobrancas_recebimentos_comissao_idx
  on public.cobrancas_recebimentos (comissao_id, contato_em desc);
create index if not exists cobrancas_recebimentos_promessa_idx
  on public.cobrancas_recebimentos (promessa_data) where promessa_data is not null;

commit;

select
  to_regclass('public.cobrancas_recebimentos') is not null as tabela_cobrancas,
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cobrancas_recebimentos') as politicas_cobrancas;
