begin;

alter table public.visitas
  add column if not exists lembrete_em timestamptz,
  add column if not exists concluida_em timestamptz;

create index if not exists visitas_data_status_idx
  on public.visitas (data_visita, status);

create index if not exists visitas_lembrete_em_idx
  on public.visitas (lembrete_em)
  where lembrete_em is not null;

create or replace function public.concluir_visita_com_retorno(
  p_visita_id uuid,
  p_pessoa_atendida text,
  p_resultado text,
  p_proxima_acao text,
  p_data_retorno date,
  p_hora_retorno time,
  p_lembrete_em timestamptz,
  p_agendar_retorno boolean default false
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_visita public.visitas%rowtype;
  v_retorno_id uuid;
begin
  select * into v_visita from public.visitas where id = p_visita_id;
  if not found then raise exception 'Visita não encontrada'; end if;

  update public.visitas
     set pessoa_atendida = nullif(trim(p_pessoa_atendida), ''),
         resultado = nullif(trim(p_resultado), ''),
         proxima_acao = nullif(trim(p_proxima_acao), ''),
         data_retorno = p_data_retorno,
         lembrete_em = p_lembrete_em,
         alerta_retorno = p_lembrete_em is not null or p_data_retorno is not null,
         status = 'Concluída',
         concluida = true,
         concluida_em = now()
   where id = p_visita_id;

  if p_agendar_retorno and p_data_retorno is not null then
    insert into public.visitas (
      cliente_id, data_visita, hora_visita, tipo_contato, bairro, status,
      oportunidade, valor_potencial, observacoes, alerta_retorno, lembrete_em
    ) values (
      v_visita.cliente_id, p_data_retorno, p_hora_retorno,
      coalesce(v_visita.tipo_contato, 'Presencial'), v_visita.bairro, 'Agendada',
      v_visita.oportunidade, v_visita.valor_potencial,
      concat('Retorno da visita de ', to_char(v_visita.data_visita, 'DD/MM/YYYY'),
             case when nullif(trim(p_proxima_acao), '') is not null then ': ' || trim(p_proxima_acao) else '' end),
      p_lembrete_em is not null, p_lembrete_em
    ) returning id into v_retorno_id;
  end if;

  return v_retorno_id;
end;
$$;

revoke all on function public.concluir_visita_com_retorno(uuid,text,text,text,date,time,timestamptz,boolean) from public, anon;
grant execute on function public.concluir_visita_com_retorno(uuid,text,text,text,date,time,timestamptz,boolean) to authenticated;

commit;
