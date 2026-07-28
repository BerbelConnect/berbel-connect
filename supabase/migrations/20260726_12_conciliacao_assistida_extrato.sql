begin;

alter table public.extratos_bancarios_lancamentos
  add column if not exists movimento_conciliado_id uuid references public.movimentacoes_financeiras_auditoria(id),
  add column if not exists conciliado_at timestamp with time zone,
  add column if not exists conciliado_por uuid,
  add column if not exists observacoes_revisao text;

create unique index if not exists extratos_lancamentos_movimento_conciliado_uidx
  on public.extratos_bancarios_lancamentos (movimento_conciliado_id)
  where movimento_conciliado_id is not null;

create or replace function public.confirmar_conciliacao_extrato(
  p_lancamento_id uuid,
  p_movimento_id uuid default null,
  p_observacoes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_lancamento public.extratos_bancarios_lancamentos%rowtype;
  v_movimento public.movimentacoes_financeiras_auditoria%rowtype;
  v_movimento_id uuid;
  v_referencia text;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
    or lower(coalesce(v_perfil.perfil, '')) not in ('administrador', 'financeiro') then
    raise exception 'Somente Administrador ou Financeiro pode aprovar conciliações.';
  end if;

  select * into v_lancamento
  from public.extratos_bancarios_lancamentos
  where id = p_lancamento_id
  for update;

  if not found then raise exception 'Lançamento do extrato não encontrado.'; end if;
  if v_lancamento.status = 'Conciliado' then
    raise exception 'Este lançamento já foi conciliado.';
  end if;

  v_movimento_id := coalesce(p_movimento_id, v_lancamento.movimento_sugerido_id);
  if v_movimento_id is null then
    raise exception 'Selecione um movimento para conciliar.';
  end if;

  select * into v_movimento
  from public.movimentacoes_financeiras_auditoria
  where id = v_movimento_id
  for update;

  if not found then raise exception 'Movimento financeiro não encontrado.'; end if;
  if abs(abs(coalesce(v_movimento.valor, 0)) - abs(v_lancamento.valor)) >= 0.005 then
    raise exception 'O valor do lançamento não corresponde ao movimento.';
  end if;
  if abs(v_movimento.data_movimento - v_lancamento.data_lancamento) > 3 then
    raise exception 'As datas diferem em mais de três dias.';
  end if;
  if exists (
    select 1 from public.extratos_bancarios_lancamentos
    where movimento_conciliado_id = v_movimento_id and id <> p_lancamento_id
  ) then
    raise exception 'Este movimento já foi usado em outro lançamento.';
  end if;

  v_referencia := coalesce(
    nullif(btrim(v_lancamento.referencia), ''),
    nullif(btrim(v_lancamento.descricao), ''),
    'Extrato bancário'
  );

  perform public.conciliar_movimento_financeiro(
    v_movimento_id,
    v_lancamento.data_lancamento,
    v_referencia,
    nullif(btrim(p_observacoes), '')
  );

  update public.extratos_bancarios_lancamentos
  set status = 'Conciliado',
      movimento_conciliado_id = v_movimento_id,
      conciliado_at = now(),
      conciliado_por = auth.uid(),
      observacoes_revisao = nullif(btrim(p_observacoes), '')
  where id = p_lancamento_id;

  return jsonb_build_object(
    'lancamento_id', p_lancamento_id,
    'movimento_id', v_movimento_id,
    'status', 'Conciliado',
    'auditado', true
  );
end;
$$;

revoke all on function public.confirmar_conciliacao_extrato(uuid, uuid, text)
  from public, anon;
grant execute on function public.confirmar_conciliacao_extrato(uuid, uuid, text)
  to authenticated;

commit;

select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'extratos_bancarios_lancamentos'
      and column_name = 'movimento_conciliado_id'
  ) as coluna_conciliacao,
  to_regprocedure('public.confirmar_conciliacao_extrato(uuid,uuid,text)') is not null
    as funcao_confirmacao;
