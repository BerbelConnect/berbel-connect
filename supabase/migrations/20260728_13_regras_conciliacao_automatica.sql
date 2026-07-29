begin;

create table if not exists public.regras_conciliacao_automatica (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) >= 3),
  termo_descricao text,
  tipo_movimento text not null default 'qualquer'
    check (tipo_movimento in ('qualquer', 'contas_pagar', 'contas_receber')),
  tolerancia_valor numeric(14,2) not null default 0
    check (tolerancia_valor >= 0),
  tolerancia_dias integer not null default 0
    check (tolerancia_dias >= 0),
  prioridade integer not null default 100
    check (prioridade > 0),
  ativo boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists regras_conciliacao_ativas_prioridade_idx
  on public.regras_conciliacao_automatica (ativo, prioridade desc);

create or replace function public.atualizar_regras_conciliacao_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists regras_conciliacao_updated_at
  on public.regras_conciliacao_automatica;

create trigger regras_conciliacao_updated_at
before update on public.regras_conciliacao_automatica
for each row execute function public.atualizar_regras_conciliacao_updated_at();

alter table public.regras_conciliacao_automatica enable row level security;

drop policy if exists regras_conciliacao_gestao
  on public.regras_conciliacao_automatica;

create policy regras_conciliacao_gestao
on public.regras_conciliacao_automatica
for all
to authenticated
using (
  exists (
    select 1
    from public.perfis_usuarios p
    where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and p.ativo is true
      and lower(p.perfil) in ('administrador', 'financeiro')
  )
)
with check (
  exists (
    select 1
    from public.perfis_usuarios p
    where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and p.ativo is true
      and lower(p.perfil) in ('administrador', 'financeiro')
  )
);

revoke all on public.regras_conciliacao_automatica from anon;
grant select, insert, update, delete
  on public.regras_conciliacao_automatica to authenticated;

create or replace function public.avaliar_regra_conciliacao(
  p_descricao text,
  p_tipo_movimento text
)
returns public.regras_conciliacao_automatica
language sql
stable
security definer
set search_path = public
as $$
  select r
  from public.regras_conciliacao_automatica r
  where r.ativo is true
    and r.tipo_movimento in ('qualquer', p_tipo_movimento)
    and (
      nullif(btrim(r.termo_descricao), '') is null
      or coalesce(p_descricao, '') ilike '%' || btrim(r.termo_descricao) || '%'
    )
  order by r.prioridade desc, r.created_at asc
  limit 1;
$$;

revoke all on function public.avaliar_regra_conciliacao(text, text)
  from public, anon;
grant execute on function public.avaliar_regra_conciliacao(text, text)
  to authenticated;

commit;

select
  to_regclass('public.regras_conciliacao_automatica') is not null as tabela,
  to_regprocedure('public.avaliar_regra_conciliacao(text,text)') is not null as funcao,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'regras_conciliacao_automatica'
  ) as politicas;

