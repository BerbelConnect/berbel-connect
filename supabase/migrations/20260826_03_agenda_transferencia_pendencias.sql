begin;

alter table public.visitas
  add column if not exists data_original date,
  add column if not exists quantidade_transferencias integer not null default 0,
  add column if not exists ultima_transferencia_data date,
  add column if not exists transferido_em timestamptz;

update public.visitas set data_original = data_visita where data_original is null;

alter table public.visitas drop constraint if exists visitas_quantidade_transferencias_check;
alter table public.visitas add constraint visitas_quantidade_transferencias_check check (quantidade_transferencias >= 0);

create or replace function public.transferir_pendencias_agenda(p_data_referencia date default current_date)
returns integer language plpgsql security invoker set search_path = public as $$
declare v_total integer;
begin
  update public.visitas
  set data_original = coalesce(data_original, data_visita),
      quantidade_transferencias = quantidade_transferencias + greatest(1, p_data_referencia - data_visita),
      ultima_transferencia_data = p_data_referencia,
      transferido_em = now(),
      data_visita = p_data_referencia
  where data_visita < p_data_referencia
    and status not in ('Concluída', 'Cancelada');
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

grant execute on function public.transferir_pendencias_agenda(date) to authenticated;

commit;
