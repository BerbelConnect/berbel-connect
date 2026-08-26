begin;

alter table public.visitas
  add column if not exists lembrete_antecedencia_minutos integer not null default 30,
  add column if not exists lembrete_repetir boolean not null default true,
  add column if not exists lembrete_intervalo_minutos integer not null default 30;

alter table public.visitas drop constraint if exists visitas_lembrete_antecedencia_check;
alter table public.visitas add constraint visitas_lembrete_antecedencia_check check (lembrete_antecedencia_minutos in (0, 15, 30, 60, 1440));
alter table public.visitas drop constraint if exists visitas_lembrete_intervalo_check;
alter table public.visitas add constraint visitas_lembrete_intervalo_check check (lembrete_intervalo_minutos in (15, 30, 60, 1440));

commit;
