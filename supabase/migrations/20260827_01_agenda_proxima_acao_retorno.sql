begin;

alter table public.visitas
  add column if not exists visita_origem_id uuid references public.visitas(id) on delete set null,
  add column if not exists retorno_criado_id uuid references public.visitas(id) on delete set null;

create unique index if not exists visitas_retorno_unico_por_origem_idx
  on public.visitas (visita_origem_id)
  where visita_origem_id is not null;

create index if not exists visitas_retorno_criado_idx
  on public.visitas (retorno_criado_id)
  where retorno_criado_id is not null;

drop function if exists public.concluir_visita_com_retorno(uuid,text,text,text,date,time,timestamptz,boolean);

create or replace function public.concluir_visita_com_retorno(
  p_visita_id uuid,
  p_pessoa_atendida text,
  p_resultado text,
  p_proxima_acao text,
  p_data_retorno date,
  p_hora_retorno time,
  p_lembrete_em timestamptz,
  p_agendar_retorno boolean default false,
  p_prioridade_retorno text default 'Normal'
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_visita public.visitas%rowtype;
  v_retorno_id uuid;
begin
  select * into v_visita from public.visitas where id = p_visita_id for update;
  if not found then raise exception 'Visita não encontrada'; end if;

  if p_agendar_retorno and (p_data_retorno is null or nullif(trim(p_proxima_acao), '') is null) then
    raise exception 'Informe a próxima ação e a data do retorno';
  end if;

  update public.visitas
     set pessoa_atendida = nullif(trim(p_pessoa_atendida), ''),
         resultado = nullif(trim(p_resultado), ''),
         proxima_acao = nullif(trim(p_proxima_acao), ''),
         data_retorno = p_data_retorno,
         lembrete_em = p_lembrete_em,
         alerta_retorno = p_lembrete_em is not null or p_data_retorno is not null,
         status = 'Concluída', concluida = true, concluida_em = now()
   where id = p_visita_id;

  if p_agendar_retorno then
    insert into public.visitas (
      cliente_id, contato_avulso_nome, contato_avulso_empresa,
      contato_avulso_telefone, contato_avulso_endereco,
      data_visita, hora_visita, tipo_contato, bairro, status,
      oportunidade, valor_potencial, observacoes, proxima_acao,
      prioridade, alerta_retorno, lembrete_em, visita_origem_id
    ) values (
      v_visita.cliente_id, v_visita.contato_avulso_nome, v_visita.contato_avulso_empresa,
      v_visita.contato_avulso_telefone, v_visita.contato_avulso_endereco,
      p_data_retorno, p_hora_retorno, coalesce(v_visita.tipo_contato, 'Presencial'),
      v_visita.bairro, 'Agendada', v_visita.oportunidade, v_visita.valor_potencial,
      concat('Retorno da visita de ', to_char(v_visita.data_visita, 'DD/MM/YYYY'), ': ', trim(p_proxima_acao)),
      trim(p_proxima_acao),
      case when p_prioridade_retorno in ('Baixa','Normal','Alta','Urgente') then p_prioridade_retorno else 'Normal' end,
      p_lembrete_em is not null, p_lembrete_em, p_visita_id
    )
    on conflict (visita_origem_id) where visita_origem_id is not null do update
      set data_visita = excluded.data_visita,
          hora_visita = excluded.hora_visita,
          proxima_acao = excluded.proxima_acao,
          prioridade = excluded.prioridade,
          lembrete_em = excluded.lembrete_em,
          alerta_retorno = excluded.alerta_retorno
    returning id into v_retorno_id;

    update public.visitas set retorno_criado_id = v_retorno_id where id = p_visita_id;
  end if;

  return v_retorno_id;
end;
$$;

revoke all on function public.concluir_visita_com_retorno(uuid,text,text,text,date,time,timestamptz,boolean,text) from public, anon;
grant execute on function public.concluir_visita_com_retorno(uuid,text,text,text,date,time,timestamptz,boolean,text) to authenticated;

commit;
