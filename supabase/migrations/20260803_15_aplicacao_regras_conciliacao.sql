begin;

alter table public.extratos_bancarios_lancamentos
  add column if not exists regra_sugerida_id uuid
    references public.regras_conciliacao_automatica(id) on delete set null,
  add column if not exists regra_sugerida_nome text,
  add column if not exists criterio_sugestao text,
  add column if not exists confianca_sugestao smallint
    check (confianca_sugestao between 0 and 100);

create index if not exists extratos_lancamentos_regra_sugerida_idx
  on public.extratos_bancarios_lancamentos (regra_sugerida_id)
  where regra_sugerida_id is not null;

create or replace function public.importar_extrato_bancario(
  p_nome_arquivo text,
  p_hash_arquivo text,
  p_lancamentos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfis_usuarios%rowtype;
  v_importacao_id uuid;
  v_lancamento jsonb;
  v_quantidade integer;
  v_movimento public.movimentacoes_financeiras_auditoria%rowtype;
  v_regra public.regras_conciliacao_automatica%rowtype;
  v_movimento_id uuid;
  v_regra_id uuid;
  v_valor numeric;
  v_data date;
  v_descricao text;
  v_diferenca_valor numeric;
  v_diferenca_dias integer;
  v_confianca integer;
  v_criterio text;
begin
  select * into v_perfil
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;

  if v_perfil.id is null
    or lower(coalesce(v_perfil.perfil, '')) not in ('administrador', 'financeiro')
  then
    raise exception 'Somente Administrador ou Financeiro pode importar extratos.';
  end if;

  if length(btrim(coalesce(p_nome_arquivo, ''))) < 3 then
    raise exception 'Nome do arquivo inválido.';
  end if;

  if length(btrim(coalesce(p_hash_arquivo, ''))) < 32 then
    raise exception 'Identificador do arquivo inválido.';
  end if;

  if jsonb_typeof(p_lancamentos) <> 'array'
    or jsonb_array_length(p_lancamentos) = 0
  then
    raise exception 'O extrato não possui lançamentos válidos.';
  end if;

  if exists (
    select 1 from public.extratos_bancarios_importacoes
    where hash_arquivo = p_hash_arquivo
  ) then
    raise exception 'Este arquivo já foi importado.';
  end if;

  v_quantidade := jsonb_array_length(p_lancamentos);

  insert into public.extratos_bancarios_importacoes (
    nome_arquivo,
    hash_arquivo,
    quantidade_lancamentos,
    usuario_auth_id,
    usuario_email
  ) values (
    btrim(p_nome_arquivo),
    btrim(p_hash_arquivo),
    v_quantidade,
    auth.uid(),
    auth.jwt() ->> 'email'
  )
  returning id into v_importacao_id;

  for v_lancamento in
    select value from jsonb_array_elements(p_lancamentos)
  loop
    if coalesce((v_lancamento ->> 'numero_linha')::integer, 0) < 2
      or nullif(v_lancamento ->> 'data_lancamento', '') is null
      or length(btrim(coalesce(v_lancamento ->> 'descricao', ''))) = 0
      or nullif(v_lancamento ->> 'valor', '') is null
    then
      raise exception 'O extrato contém um lançamento inválido.';
    end if;

    v_data := (v_lancamento ->> 'data_lancamento')::date;
    v_descricao := btrim(v_lancamento ->> 'descricao');
    v_valor := (v_lancamento ->> 'valor')::numeric;
    v_movimento_id := nullif(v_lancamento ->> 'movimento_sugerido_id', '')::uuid;
    v_regra_id := nullif(v_lancamento ->> 'regra_sugerida_id', '')::uuid;
    v_confianca := null;
    v_criterio := null;

    if v_movimento_id is not null then
      select * into v_movimento
      from public.movimentacoes_financeiras_auditoria
      where id = v_movimento_id
        and operacao = 'Baixa';

      if not found then
        raise exception 'Movimento sugerido não encontrado.';
      end if;

      v_diferenca_valor := abs(abs(coalesce(v_movimento.valor, 0)) - abs(v_valor));
      v_diferenca_dias := abs(v_movimento.data_movimento - v_data);

      if v_regra_id is not null then
        select * into v_regra
        from public.regras_conciliacao_automatica
        where id = v_regra_id
          and ativo is true;

        if not found
          or v_regra.tipo_movimento not in ('qualquer', v_movimento.entidade)
          or (
            nullif(btrim(v_regra.termo_descricao), '') is not null
            and v_descricao not ilike '%' || btrim(v_regra.termo_descricao) || '%'
          )
          or v_diferenca_valor > v_regra.tolerancia_valor
          or v_diferenca_dias > v_regra.tolerancia_dias
        then
          raise exception 'A regra informada não corresponde ao lançamento sugerido.';
        end if;

        v_confianca := greatest(
          70,
          round(
            100
            - case when v_regra.tolerancia_valor > 0
                then (v_diferenca_valor / v_regra.tolerancia_valor) * 15
                else 0 end
            - case when v_regra.tolerancia_dias > 0
                then (v_diferenca_dias::numeric / v_regra.tolerancia_dias) * 15
                else 0 end
          )::integer
        );
        v_criterio := 'Regra: ' || v_regra.nome;
      else
        if v_diferenca_valor >= 0.005 or v_diferenca_dias > 3 then
          raise exception 'A sugestão padrão não corresponde por valor e data.';
        end if;
        v_confianca := greatest(75, 90 - (v_diferenca_dias * 5));
        v_criterio := 'Valor exato e data em até 3 dias';
      end if;
    elsif v_regra_id is not null then
      raise exception 'Uma regra não pode ser gravada sem movimento sugerido.';
    end if;

    insert into public.extratos_bancarios_lancamentos (
      importacao_id,
      numero_linha,
      data_lancamento,
      descricao,
      referencia,
      valor,
      movimento_sugerido_id,
      regra_sugerida_id,
      regra_sugerida_nome,
      criterio_sugestao,
      confianca_sugestao
    ) values (
      v_importacao_id,
      (v_lancamento ->> 'numero_linha')::integer,
      v_data,
      v_descricao,
      nullif(btrim(coalesce(v_lancamento ->> 'referencia', '')), ''),
      v_valor,
      v_movimento_id,
      v_regra_id,
      case when v_regra_id is not null then v_regra.nome else null end,
      v_criterio,
      v_confianca
    );
  end loop;

  return jsonb_build_object(
    'importacao_id', v_importacao_id,
    'quantidade', v_quantidade,
    'duplicado', false
  );
end;
$$;

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
  v_regra public.regras_conciliacao_automatica%rowtype;
  v_movimento_id uuid;
  v_referencia text;
  v_usar_regra boolean;
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
    and operacao = 'Baixa'
  for update;

  if not found then raise exception 'Movimento financeiro não encontrado.'; end if;

  v_usar_regra := v_lancamento.regra_sugerida_id is not null
    and v_lancamento.movimento_sugerido_id = v_movimento_id;

  if v_usar_regra then
    select * into v_regra
    from public.regras_conciliacao_automatica
    where id = v_lancamento.regra_sugerida_id
      and ativo is true;

    if not found
      or v_regra.tipo_movimento not in ('qualquer', v_movimento.entidade)
      or (
        nullif(btrim(v_regra.termo_descricao), '') is not null
        and v_lancamento.descricao not ilike '%' || btrim(v_regra.termo_descricao) || '%'
      )
      or abs(abs(coalesce(v_movimento.valor, 0)) - abs(v_lancamento.valor))
        > v_regra.tolerancia_valor
      or abs(v_movimento.data_movimento - v_lancamento.data_lancamento)
        > v_regra.tolerancia_dias
    then
      raise exception 'A regra da sugestão não é mais válida para este movimento.';
    end if;
  else
    if abs(abs(coalesce(v_movimento.valor, 0)) - abs(v_lancamento.valor)) >= 0.005 then
      raise exception 'O valor do lançamento não corresponde ao movimento.';
    end if;
    if abs(v_movimento.data_movimento - v_lancamento.data_lancamento) > 3 then
      raise exception 'As datas diferem em mais de três dias.';
    end if;
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
    'regra_id', case when v_usar_regra then v_lancamento.regra_sugerida_id else null end,
    'status', 'Conciliado',
    'auditado', true
  );
end;
$$;

revoke all on function public.importar_extrato_bancario(text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.importar_extrato_bancario(text, text, jsonb)
  to authenticated;

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
      and column_name = 'regra_sugerida_id'
  ) as coluna_regra,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'extratos_bancarios_lancamentos'
      and column_name = 'confianca_sugestao'
  ) as coluna_confianca,
  to_regprocedure('public.importar_extrato_bancario(text,text,jsonb)') is not null
    as funcao_importacao,
  to_regprocedure('public.confirmar_conciliacao_extrato(uuid,uuid,text)') is not null
    as funcao_confirmacao;
