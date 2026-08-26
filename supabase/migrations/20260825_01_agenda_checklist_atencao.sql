begin;

alter table public.visitas
  add column if not exists prioridade text not null default 'Normal',
  add column if not exists prazo_resolucao date,
  add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.visitas drop constraint if exists visitas_prioridade_check;
alter table public.visitas add constraint visitas_prioridade_check
  check (prioridade in ('Baixa', 'Normal', 'Alta', 'Urgente'));

alter table public.visitas drop constraint if exists visitas_checklist_array_check;
alter table public.visitas add constraint visitas_checklist_array_check
  check (jsonb_typeof(checklist) = 'array');

create index if not exists visitas_prazo_resolucao_idx
  on public.visitas (prazo_resolucao)
  where prazo_resolucao is not null and status not in ('Concluída', 'Cancelada');

commit;
