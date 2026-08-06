begin;

alter table public.clientes add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.produtos add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.fornecedores add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.representadas add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.pipeline_comercial add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.metas_comerciais add column if not exists arquivada boolean not null default false, add column if not exists arquivado_em timestamptz, add column if not exists arquivado_por uuid, add column if not exists motivo_arquivamento text;
alter table public.visitas add column if not exists cancelado_em timestamptz, add column if not exists cancelado_por uuid, add column if not exists motivo_cancelamento text;

create table if not exists public.historico_arquivamento_comercial (
  id uuid primary key default gen_random_uuid(), modulo text not null, registro_id uuid not null,
  acao text not null check (acao in ('Arquivado', 'Reativado')), motivo text not null,
  usuario_id uuid not null, created_at timestamptz not null default now()
);
create index if not exists historico_arquivamento_registro_idx on public.historico_arquivamento_comercial (modulo, registro_id, created_at desc);
alter table public.historico_arquivamento_comercial enable row level security;
drop policy if exists historico_arquivamento_select_authenticated on public.historico_arquivamento_comercial;
create policy historico_arquivamento_select_authenticated on public.historico_arquivamento_comercial for select to authenticated using (true);
drop policy if exists historico_arquivamento_insert_authenticated on public.historico_arquivamento_comercial;
create policy historico_arquivamento_insert_authenticated on public.historico_arquivamento_comercial for insert to authenticated with check (usuario_id = auth.uid());
revoke all on public.historico_arquivamento_comercial from anon;
grant select, insert on public.historico_arquivamento_comercial to authenticated;

create or replace function public.alterar_arquivamento_comercial(p_modulo text, p_registro_id uuid, p_motivo text, p_arquivar boolean default true)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v_modulo text := lower(btrim(coalesce(p_modulo, ''))); v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if auth.uid() is null then raise exception 'É necessário estar autenticado.'; end if;
  if p_registro_id is null then raise exception 'Registro não informado.'; end if;
  if length(v_motivo) < 5 then raise exception 'Informe um motivo com pelo menos 5 caracteres.'; end if;
  case v_modulo
    when 'clientes' then update public.clientes set ativo=not p_arquivar, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'produtos' then update public.produtos set ativo=not p_arquivar, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'fornecedores' then update public.fornecedores set ativo=not p_arquivar, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'representadas' then update public.representadas set ativa=not p_arquivar, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'pipeline' then update public.pipeline_comercial set status=case when p_arquivar then 'Arquivada' else 'Aberto' end, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'metas' then update public.metas_comerciais set arquivada=p_arquivar, arquivado_em=case when p_arquivar then now() end, arquivado_por=case when p_arquivar then auth.uid() end, motivo_arquivamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    when 'visitas' then update public.visitas set status=case when p_arquivar then 'Cancelada' else 'Agendada' end, concluida=false, cancelado_em=case when p_arquivar then now() end, cancelado_por=case when p_arquivar then auth.uid() end, motivo_cancelamento=case when p_arquivar then v_motivo end where id=p_registro_id;
    else raise exception 'Módulo não permitido para arquivamento.';
  end case;
  if not found then raise exception 'Registro não encontrado ou sem permissão para alteração.'; end if;
  insert into public.historico_arquivamento_comercial(modulo,registro_id,acao,motivo,usuario_id)
  values(v_modulo,p_registro_id,case when p_arquivar then 'Arquivado' else 'Reativado' end,v_motivo,auth.uid());
  return jsonb_build_object('modulo',v_modulo,'registro_id',p_registro_id,'arquivado',p_arquivar);
end; $$;
revoke all on function public.alterar_arquivamento_comercial(text,uuid,text,boolean) from public;
revoke all on function public.alterar_arquivamento_comercial(text,uuid,text,boolean) from anon;
grant execute on function public.alterar_arquivamento_comercial(text,uuid,text,boolean) to authenticated;
commit;
