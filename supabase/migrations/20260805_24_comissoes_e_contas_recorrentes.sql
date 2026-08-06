begin;

-- Calendário complementar: feriados estaduais, municipais ou internos podem
-- ser cadastrados aqui. Os feriados nacionais são calculados pela função.
create table if not exists public.feriados_financeiros (
  data date primary key,
  descricao text not null,
  created_at timestamptz not null default now()
);

alter table public.feriados_financeiros enable row level security;

drop policy if exists feriados_financeiros_select_authenticated on public.feriados_financeiros;
create policy feriados_financeiros_select_authenticated
  on public.feriados_financeiros for select to authenticated using (true);

drop policy if exists feriados_financeiros_manage_authenticated on public.feriados_financeiros;
create policy feriados_financeiros_manage_authenticated
  on public.feriados_financeiros for all to authenticated using (true) with check (true);

create or replace function public.pascoa_no_ano(p_ano integer)
returns date
language plpgsql
immutable
as $$
declare
  a integer; b integer; c integer; d integer; e integer; f integer;
  g integer; h integer; i integer; k integer; l integer; m integer;
  mes integer; dia integer;
begin
  a := p_ano % 19; b := p_ano / 100; c := p_ano % 100;
  d := b / 4; e := b % 4; f := (b + 8) / 25;
  g := (b - f + 1) / 3; h := (19 * a + b - d - g + 15) % 30;
  i := c / 4; k := c % 4; l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  mes := (h + l - 7 * m + 114) / 31;
  dia := ((h + l - 7 * m + 114) % 31) + 1;
  return make_date(p_ano, mes, dia);
end;
$$;

create or replace function public.eh_dia_util_financeiro(p_data date)
returns boolean
language sql
stable
set search_path = public
as $$
  select extract(isodow from p_data) < 6
    and p_data not in (
      make_date(extract(year from p_data)::integer, 1, 1),
      public.pascoa_no_ano(extract(year from p_data)::integer) - 48,
      public.pascoa_no_ano(extract(year from p_data)::integer) - 47,
      public.pascoa_no_ano(extract(year from p_data)::integer) - 2,
      make_date(extract(year from p_data)::integer, 4, 21),
      make_date(extract(year from p_data)::integer, 5, 1),
      public.pascoa_no_ano(extract(year from p_data)::integer) + 60,
      make_date(extract(year from p_data)::integer, 9, 7),
      make_date(extract(year from p_data)::integer, 10, 12),
      make_date(extract(year from p_data)::integer, 11, 2),
      make_date(extract(year from p_data)::integer, 11, 15),
      make_date(extract(year from p_data)::integer, 11, 20),
      make_date(extract(year from p_data)::integer, 12, 25)
    )
    and not exists (select 1 from public.feriados_financeiros f where f.data = p_data);
$$;

create or replace function public.proximo_dia_util_financeiro(p_data date)
returns date
language plpgsql
stable
set search_path = public
as $$
declare
  v_data date := p_data;
begin
  while not public.eh_dia_util_financeiro(v_data) loop
    v_data := v_data + 1;
  end loop;
  return v_data;
end;
$$;

alter table public.comissoes_financeiro
  add column if not exists data_pagamento_cliente date,
  add column if not exists regra_recebimento text;

create or replace function public.calcular_previsao_comissao(
  p_empresa text,
  p_data_venda date,
  p_data_pagamento_cliente date
)
returns date
language plpgsql
stable
set search_path = public
as $$
declare
  v_empresa text := lower(translate(coalesce(p_empresa, ''), 'ÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç', 'AAAAEEEIIIOOOOUUUCaaaaeeeiiioooouuuc'));
  v_base date;
  v_dia integer;
begin
  if v_empresa like '%r&e%' or v_empresa like '%r & e%' then
    v_base := p_data_venda;
    v_dia := 15;
  elsif v_empresa like '%solucao%' then
    v_base := p_data_pagamento_cliente;
    v_dia := 1;
  elsif v_empresa like '%fibrart%' then
    v_base := p_data_pagamento_cliente;
    v_dia := 10;
  else
    return null;
  end if;

  if v_base is null then return null; end if;
  return public.proximo_dia_util_financeiro(
    make_date(
      extract(year from (v_base + interval '1 month'))::integer,
      extract(month from (v_base + interval '1 month'))::integer,
      v_dia
    )
  );
end;
$$;

create or replace function public.aplicar_regra_previsao_comissao()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_data_venda date;
  v_previsao date;
  v_empresa text;
begin
  select coalesce(data_pedido, created_at::date) into v_data_venda
  from public.pedidos where id = new.pedido_id;

  v_empresa := lower(translate(coalesce(new.empresa, ''), 'ÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç', 'AAAAEEEIIIOOOOUUUCaaaaeeeiiioooouuuc'));
  v_previsao := public.calcular_previsao_comissao(new.empresa, coalesce(v_data_venda, new.created_at::date), new.data_pagamento_cliente);

  if v_empresa like '%r&e%' or v_empresa like '%r & e%' then
    new.regra_recebimento := 'Venda: dia 15 do mês seguinte';
    new.data_previsao := v_previsao;
    new.previsao_recebimento := v_previsao;
  elsif v_empresa like '%solucao%' then
    new.regra_recebimento := 'Pagamento do cliente: dia 1 do mês seguinte';
    new.data_previsao := v_previsao;
    new.previsao_recebimento := v_previsao;
  elsif v_empresa like '%fibrart%' then
    new.regra_recebimento := 'Pagamento do cliente: dia 10 do mês seguinte';
    new.data_previsao := v_previsao;
    new.previsao_recebimento := v_previsao;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_aplicar_regra_previsao_comissao on public.comissoes_financeiro;
create trigger zz_aplicar_regra_previsao_comissao
before insert or update of pedido_id, empresa, data_pagamento_cliente
on public.comissoes_financeiro
for each row execute function public.aplicar_regra_previsao_comissao();

-- Recalcula o histórico de R&E. Solução e Fibrart passam a ter previsão
-- assim que o pagamento do cliente for informado.
update public.comissoes_financeiro set empresa = empresa
where lower(translate(coalesce(empresa, ''), 'ÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç', 'AAAAEEEIIIOOOOUUUCaaaaeeeiiioooouuuc'))
  similar to '%(r&e|r & e|solucao|fibrart)%';

create table if not exists public.contas_pagar_recorrencias (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text,
  fornecedor text,
  valor_padrao numeric(14,2) not null check (valor_padrao >= 0),
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  data_inicio date not null,
  data_termino date,
  forma_pagamento text,
  observacoes text,
  dias_aviso integer not null default 5 check (dias_aviso between 0 and 90),
  status text not null default 'Ativa' check (status in ('Ativa', 'Pausada', 'Encerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_termino is null or data_termino >= data_inicio)
);

alter table public.contas_pagar
  add column if not exists recorrencia_id uuid references public.contas_pagar_recorrencias(id) on delete set null,
  add column if not exists competencia date,
  add column if not exists dias_aviso integer not null default 5,
  add column if not exists valor_editado boolean not null default false;

create unique index if not exists contas_pagar_recorrencia_competencia_uidx
  on public.contas_pagar (recorrencia_id, competencia)
  where recorrencia_id is not null;

create index if not exists contas_pagar_recorrencia_idx on public.contas_pagar (recorrencia_id);

alter table public.contas_pagar_recorrencias enable row level security;
drop policy if exists contas_pagar_recorrencias_authenticated on public.contas_pagar_recorrencias;
create policy contas_pagar_recorrencias_authenticated
  on public.contas_pagar_recorrencias for all to authenticated using (true) with check (true);

create or replace function public.gerar_parcelas_contas_fixas(p_ate date default (current_date + interval '12 months')::date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_criadas integer := 0;
begin
  insert into public.contas_pagar (
    recorrencia_id, competencia, descricao, categoria, fornecedor, valor,
    vencimento, data_vencimento, status, forma_pagamento, observacoes, dias_aviso
  )
  select
    r.id,
    mes::date,
    r.descricao,
    r.categoria,
    r.fornecedor,
    r.valor_padrao,
    make_date(extract(year from mes)::integer, extract(month from mes)::integer,
      least(r.dia_vencimento, extract(day from (mes + interval '1 month - 1 day'))::integer)),
    make_date(extract(year from mes)::integer, extract(month from mes)::integer,
      least(r.dia_vencimento, extract(day from (mes + interval '1 month - 1 day'))::integer)),
    'Pendente',
    r.forma_pagamento,
    r.observacoes,
    r.dias_aviso
  from public.contas_pagar_recorrencias r
  cross join lateral generate_series(
    date_trunc('month', greatest(r.data_inicio, current_date))::date,
    date_trunc('month', least(coalesce(r.data_termino, p_ate), p_ate))::date,
    interval '1 month'
  ) mes
  where r.status = 'Ativa'
  on conflict (recorrencia_id, competencia) where recorrencia_id is not null do nothing;

  get diagnostics v_criadas = row_count;
  return v_criadas;
end;
$$;

revoke all on function public.gerar_parcelas_contas_fixas(date) from public, anon;
grant execute on function public.gerar_parcelas_contas_fixas(date) to authenticated;

-- Gera a parcela do mês atual e dos próximos 12 meses. Mudanças posteriores
-- no valor padrão não alteram estas parcelas, preservando o histórico.
select public.gerar_parcelas_contas_fixas((current_date + interval '12 months')::date);

commit;
