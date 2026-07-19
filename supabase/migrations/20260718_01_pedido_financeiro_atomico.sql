begin;

-- A migration para de forma segura se houver números duplicados preexistentes.
do $$
begin
  if exists (
    select 1
    from public.pedidos
    where numero is not null and btrim(numero) <> ''
    group by numero
    having count(*) > 1
  ) then
    raise exception
      'Existem valores duplicados em pedidos.numero. Corrija-os antes de aplicar a migration.';
  end if;

  if exists (
    select 1
    from public.pedidos
    where numero_pedido is not null and btrim(numero_pedido) <> ''
    group by numero_pedido
    having count(*) > 1
  ) then
    raise exception
      'Existem valores duplicados em pedidos.numero_pedido. Corrija-os antes de aplicar a migration.';
  end if;
end;
$$;

alter table public.pedidos
  add column if not exists idempotency_key text;

alter table public.contas_receber
  add column if not exists parcela_numero integer,
  add column if not exists parcelas_total integer,
  add column if not exists prazo_dias integer,
  add column if not exists condicao_pagamento text;

create unique index if not exists pedidos_numero_unique
  on public.pedidos (numero)
  where numero is not null and btrim(numero) <> '';

create unique index if not exists pedidos_numero_pedido_unique
  on public.pedidos (numero_pedido)
  where numero_pedido is not null and btrim(numero_pedido) <> '';

create unique index if not exists pedidos_idempotency_key_unique
  on public.pedidos (idempotency_key)
  where idempotency_key is not null and btrim(idempotency_key) <> '';

create index if not exists pedidos_cliente_id_idx
  on public.pedidos (cliente_id);

create index if not exists pedidos_status_idx
  on public.pedidos (status);

create index if not exists pedido_itens_pedido_id_idx
  on public.pedido_itens (pedido_id);

create index if not exists contas_receber_cliente_id_idx
  on public.contas_receber (cliente_id);

create index if not exists contas_receber_vencimento_idx
  on public.contas_receber (vencimento);

create index if not exists contas_pagar_fornecedor_id_idx
  on public.contas_pagar (fornecedor_id);

create index if not exists contas_pagar_vencimento_idx
  on public.contas_pagar (vencimento);

create or replace function public.criar_pedido_completo(
  p_idempotency_key text,
  p_pedido jsonb,
  p_itens jsonb,
  p_contas_receber jsonb default '[]'::jsonb,
  p_contas_pagar jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido_id uuid;
  v_pedido_existente public.pedidos%rowtype;
  v_numero text;
  v_cliente_id uuid;
  v_tipo text;
  v_tipo_normalizado text;
  v_status text;
  v_status_normalizado text;
  v_condicao_pagamento text;
  v_data_pedido date;
  v_data_entrega_prevista date;
  v_data_entrega_real date;
  v_data_base date;
  v_valor_total numeric;
  v_valor_comissao numeric;
  v_valor_custo_total numeric;
  v_lucro_total numeric;
  v_soma_receber numeric;
  v_soma_pagar numeric;
  v_gera_movimentos boolean;
  v_tipo_venda boolean;
  v_tipo_representacao boolean;
  v_itens_criados integer := 0;
  v_receber_criadas integer := 0;
  v_pagar_criadas integer := 0;
  v_comissoes_criadas integer := 0;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para criar um pedido.';
  end if;

  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'A chave de idempotência é obrigatória.';
  end if;

  -- Serializa tentativas simultâneas com a mesma chave antes da consulta.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  select *
    into v_pedido_existente
  from public.pedidos
  where idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return jsonb_build_object(
      'pedido_id', v_pedido_existente.id,
      'numero', coalesce(v_pedido_existente.numero, v_pedido_existente.numero_pedido),
      'valor_total', coalesce(v_pedido_existente.valor_total, 0),
      'valor_custo_total', coalesce(v_pedido_existente.valor_custo_total, 0),
      'lucro_total', coalesce(v_pedido_existente.lucro_total, 0),
      'valor_comissao', coalesce(v_pedido_existente.valor_comissao, 0),
      'itens_criados', (
        select count(*) from public.pedido_itens where pedido_id = v_pedido_existente.id
      ),
      'parcelas_criadas', (
        select count(*) from public.contas_receber where pedido_id = v_pedido_existente.id
      ),
      'contas_pagar_criadas', (
        select count(*) from public.contas_pagar where pedido_id = v_pedido_existente.id
      ),
      'reutilizado', true
    );
  end if;

  if jsonb_typeof(p_pedido) is distinct from 'object' then
    raise exception 'Os dados do pedido são inválidos.';
  end if;

  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'O pedido deve possuir ao menos um item.';
  end if;

  if jsonb_typeof(p_contas_receber) is distinct from 'array' then
    raise exception 'A lista de contas a receber é inválida.';
  end if;

  if jsonb_typeof(p_contas_pagar) is distinct from 'array' then
    raise exception 'A lista de contas a pagar é inválida.';
  end if;

  v_cliente_id := nullif(p_pedido ->> 'cliente_id', '')::uuid;
  v_tipo := coalesce(nullif(btrim(p_pedido ->> 'tipo'), ''), 'Representação');
  v_status := coalesce(nullif(btrim(p_pedido ->> 'status'), ''), 'Pedido');
  v_condicao_pagamento := coalesce(
    nullif(btrim(p_pedido ->> 'condicao_pagamento'), ''),
    'A combinar'
  );
  v_data_pedido := coalesce(nullif(p_pedido ->> 'data_pedido', '')::date, current_date);
  v_data_entrega_prevista := nullif(p_pedido ->> 'data_entrega_prevista', '')::date;
  v_data_entrega_real := nullif(p_pedido ->> 'data_entrega_real', '')::date;
  v_data_base := coalesce(v_data_entrega_prevista, v_data_pedido);
  v_valor_total := round(coalesce((p_pedido ->> 'valor_total')::numeric, 0), 2);
  v_valor_comissao := round(coalesce((p_pedido ->> 'valor_comissao')::numeric, 0), 2);
  v_valor_custo_total := round(
    coalesce((p_pedido ->> 'valor_custo_total')::numeric, 0),
    2
  );
  v_lucro_total := round(coalesce((p_pedido ->> 'lucro_total')::numeric, 0), 2);

  if v_cliente_id is null then
    raise exception 'O cliente é obrigatório.';
  end if;

  if not exists (select 1 from public.clientes where id = v_cliente_id) then
    raise exception 'O cliente informado não existe.';
  end if;

  if v_valor_total < 0 or v_valor_comissao < 0 or v_valor_custo_total < 0 then
    raise exception 'Os valores do pedido não podem ser negativos.';
  end if;

  select round(coalesce(sum(
    coalesce((item ->> 'quantidade')::numeric, 0) *
    coalesce((item ->> 'valor_unitario')::numeric, 0)
  ), 0), 2)
    into v_soma_receber
  from jsonb_array_elements(p_itens) item;

  if abs(v_soma_receber - v_valor_total) > 0.009 then
    raise exception
      'A soma dos itens (%) é diferente do total do pedido (%).',
      v_soma_receber,
      v_valor_total;
  end if;

  v_tipo_normalizado := lower(v_tipo);
  v_status_normalizado := lower(v_status);
  v_gera_movimentos := v_status_normalizado not in ('orçamento', 'orcamento', 'cancelado');
  v_tipo_venda := v_tipo_normalizado in (
    'revenda',
    'revenda própria',
    'revenda propria',
    'venda direta',
    'venda própria',
    'venda propria',
    'compra própria',
    'compra propria'
  );
  v_tipo_representacao := v_tipo_normalizado in ('representação', 'representacao');

  if v_gera_movimentos and v_tipo_venda and v_valor_total > 0 then
    if jsonb_array_length(p_contas_receber) = 0 then
      raise exception 'Pedidos de venda devem possuir ao menos uma conta a receber.';
    end if;

    select round(coalesce(sum((parcela ->> 'valor')::numeric), 0), 2)
      into v_soma_receber
    from jsonb_array_elements(p_contas_receber) parcela;

    if abs(v_soma_receber - v_valor_total) > 0.009 then
      raise exception
        'A soma das parcelas (%) é diferente do total do pedido (%).',
        v_soma_receber,
        v_valor_total;
    end if;
  end if;

  if v_gera_movimentos and v_tipo_venda and v_valor_custo_total > 0 then
    if jsonb_array_length(p_contas_pagar) = 0 then
      raise exception 'Pedidos com custo devem possuir ao menos uma conta a pagar.';
    end if;

    select round(coalesce(sum((conta ->> 'valor')::numeric), 0), 2)
      into v_soma_pagar
    from jsonb_array_elements(p_contas_pagar) conta;

    if abs(v_soma_pagar - v_valor_custo_total) > 0.009 then
      raise exception
        'A soma das contas a pagar (%) é diferente do custo do pedido (%).',
        v_soma_pagar,
        v_valor_custo_total;
    end if;
  end if;

  v_numero := public.gerar_numero_pedido();

  insert into public.pedidos (
    cliente_id,
    numero,
    numero_pedido,
    data_pedido,
    data_entrega_prevista,
    data_entrega_real,
    tipo,
    tipo_operacao,
    status,
    condicao_pagamento,
    observacoes,
    valor_total,
    valor_comissao,
    valor_custo_total,
    lucro_total,
    gera_financeiro,
    gera_comissao,
    idempotency_key
  ) values (
    v_cliente_id,
    v_numero,
    v_numero,
    v_data_pedido,
    v_data_entrega_prevista,
    v_data_entrega_real,
    v_tipo,
    v_tipo,
    v_status,
    v_condicao_pagamento,
    nullif(p_pedido ->> 'observacoes', ''),
    v_valor_total,
    v_valor_comissao,
    v_valor_custo_total,
    v_lucro_total,
    v_gera_movimentos and v_tipo_venda,
    v_gera_movimentos and v_tipo_representacao,
    p_idempotency_key
  )
  returning id into v_pedido_id;

  insert into public.pedido_itens (
    pedido_id,
    produto_id,
    produto_nome,
    fornecedor_id,
    quantidade,
    valor_unitario,
    valor_total,
    comissao_percentual,
    valor_comissao,
    valor_custo_unitario,
    valor_custo_total,
    lucro_unitario,
    lucro_total
  )
  select
    v_pedido_id,
    nullif(item ->> 'produto_id', '')::uuid,
    nullif(item ->> 'produto_nome', ''),
    nullif(item ->> 'fornecedor_id', '')::uuid,
    coalesce((item ->> 'quantidade')::numeric, 0),
    round(coalesce((item ->> 'valor_unitario')::numeric, 0), 2),
    round(coalesce((item ->> 'valor_total')::numeric, 0), 2),
    round(coalesce((item ->> 'comissao_percentual')::numeric, 0), 4),
    round(coalesce((item ->> 'valor_comissao')::numeric, 0), 2),
    round(coalesce((item ->> 'valor_custo_unitario')::numeric, 0), 2),
    round(coalesce((item ->> 'valor_custo_total')::numeric, 0), 2),
    round(coalesce((item ->> 'lucro_unitario')::numeric, 0), 2),
    round(coalesce((item ->> 'lucro_total')::numeric, 0), 2)
  from jsonb_array_elements(p_itens) item;

  get diagnostics v_itens_criados = row_count;

  if v_gera_movimentos and v_tipo_venda then
    insert into public.contas_receber (
      pedido_id,
      cliente_id,
      descricao,
      valor,
      vencimento,
      data_vencimento,
      status,
      parcela_numero,
      parcelas_total,
      prazo_dias,
      condicao_pagamento
    )
    select
      v_pedido_id,
      v_cliente_id,
      concat(
        'Recebimento do pedido ',
        v_numero,
        ' - Parcela ',
        parcela ->> 'numero',
        '/',
        parcela ->> 'total_parcelas'
      ),
      round((parcela ->> 'valor')::numeric, 2),
      (parcela ->> 'vencimento')::date,
      (parcela ->> 'vencimento')::date,
      'Pendente',
      (parcela ->> 'numero')::integer,
      (parcela ->> 'total_parcelas')::integer,
      coalesce((parcela ->> 'prazo_dias')::integer, 0),
      v_condicao_pagamento
    from jsonb_array_elements(p_contas_receber) parcela;

    get diagnostics v_receber_criadas = row_count;

    insert into public.contas_pagar (
      pedido_id,
      fornecedor_id,
      categoria,
      fornecedor,
      descricao,
      valor,
      vencimento,
      data_vencimento,
      status
    )
    select
      v_pedido_id,
      nullif(conta ->> 'fornecedor_id', '')::uuid,
      'Mercadoria',
      coalesce(nullif(conta ->> 'fornecedor_nome', ''), 'Compra própria'),
      concat('Custo de mercadoria do pedido ', v_numero),
      round((conta ->> 'valor')::numeric, 2),
      v_data_base,
      v_data_base,
      'Pendente'
    from jsonb_array_elements(p_contas_pagar) conta;

    get diagnostics v_pagar_criadas = row_count;
  elsif v_gera_movimentos and v_tipo_representacao and v_valor_comissao > 0 then
    insert into public.comissoes_financeiro (
      pedido_id,
      cliente_id,
      empresa,
      percentual,
      valor_base,
      valor_comissao,
      previsao_recebimento,
      data_previsao,
      status
    ) values (
      v_pedido_id,
      v_cliente_id,
      coalesce(nullif(p_pedido ->> 'empresa', ''), v_tipo),
      case
        when v_valor_total > 0 then round((v_valor_comissao / v_valor_total) * 100, 4)
        else 0
      end,
      v_valor_total,
      v_valor_comissao,
      v_data_base,
      v_data_base,
      'Pendente'
    );

    get diagnostics v_comissoes_criadas = row_count;
  end if;

  return jsonb_build_object(
    'pedido_id', v_pedido_id,
    'numero', v_numero,
    'valor_total', v_valor_total,
    'valor_custo_total', v_valor_custo_total,
    'lucro_total', v_lucro_total,
    'valor_comissao', v_valor_comissao,
    'itens_criados', v_itens_criados,
    'parcelas_criadas', v_receber_criadas,
    'contas_pagar_criadas', v_pagar_criadas,
    'comissoes_criadas', v_comissoes_criadas,
    'reutilizado', false
  );
end;
$$;

revoke all on function public.criar_pedido_completo(text, jsonb, jsonb, jsonb, jsonb)
  from public;
revoke all on function public.criar_pedido_completo(text, jsonb, jsonb, jsonb, jsonb)
  from anon;
grant execute on function public.criar_pedido_completo(text, jsonb, jsonb, jsonb, jsonb)
  to authenticated;

commit;
