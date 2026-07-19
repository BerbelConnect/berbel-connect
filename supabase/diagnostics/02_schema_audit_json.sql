-- Berbel Connect — diagnóstico consolidado somente leitura
-- Retorna uma única linha JSON para facilitar copiar/exportar o resultado.

with tabelas_alvo(nome) as (
  values
    ('pedidos'),
    ('pedido_itens'),
    ('clientes'),
    ('produtos'),
    ('fornecedores'),
    ('contas_receber'),
    ('contas_pagar'),
    ('comissoes_financeiro'),
    ('perfis_usuarios')
),
colunas as (
  select
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
  from information_schema.columns c
  join tabelas_alvo t on t.nome = c.table_name
  where c.table_schema = 'public'
),
constraints_banco as (
  select
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    coalesce(
      jsonb_agg(kcu.column_name order by kcu.ordinal_position)
        filter (where kcu.column_name is not null),
      '[]'::jsonb
    ) as columns
  from information_schema.table_constraints tc
  join tabelas_alvo t on t.nome = tc.table_name
  left join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema
   and kcu.constraint_name = tc.constraint_name
   and kcu.table_name = tc.table_name
  where tc.table_schema = 'public'
  group by tc.table_name, tc.constraint_name, tc.constraint_type
),
foreign_keys as (
  select
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name as foreign_table_name,
    ccu.column_name as foreign_column_name,
    rc.update_rule,
    rc.delete_rule
  from information_schema.table_constraints tc
  join tabelas_alvo t on t.nome = tc.table_name
  join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema
   and kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_schema = tc.constraint_schema
   and ccu.constraint_name = tc.constraint_name
  join information_schema.referential_constraints rc
    on rc.constraint_schema = tc.constraint_schema
   and rc.constraint_name = tc.constraint_name
  where tc.table_schema = 'public'
    and tc.constraint_type = 'FOREIGN KEY'
),
indices as (
  select i.tablename, i.indexname, i.indexdef
  from pg_indexes i
  join tabelas_alvo t on t.nome = i.tablename
  where i.schemaname = 'public'
),
rls_tabelas as (
  select
    c.relname as table_name,
    c.relrowsecurity as enabled,
    c.relforcerowsecurity as forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join tabelas_alvo t on t.nome = c.relname
  where n.nspname = 'public'
    and c.relkind = 'r'
),
politicas as (
  select
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
  from pg_policies p
  join tabelas_alvo t on t.nome = p.tablename
  where p.schemaname = 'public'
),
funcoes as (
  select
    p.proname,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as result,
    p.prosecdef as security_definer,
    pg_get_functiondef(p.oid) as definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      p.proname ilike '%pedido%'
      or p.proname ilike '%financeir%'
      or p.proname ilike '%comiss%'
    )
),
triggers_banco as (
  select
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
  from information_schema.triggers
  where trigger_schema = 'public'
    and event_object_table in (select nome from tabelas_alvo)
)
select jsonb_pretty(
  jsonb_build_object(
    'generated_at', now(),
    'columns', coalesce(
      (select jsonb_agg(to_jsonb(c) order by c.table_name, c.ordinal_position) from colunas c),
      '[]'::jsonb
    ),
    'constraints', coalesce(
      (select jsonb_agg(to_jsonb(c) order by c.table_name, c.constraint_name) from constraints_banco c),
      '[]'::jsonb
    ),
    'foreign_keys', coalesce(
      (select jsonb_agg(to_jsonb(f) order by f.table_name, f.constraint_name) from foreign_keys f),
      '[]'::jsonb
    ),
    'indexes', coalesce(
      (select jsonb_agg(to_jsonb(i) order by i.tablename, i.indexname) from indices i),
      '[]'::jsonb
    ),
    'rls_tables', coalesce(
      (select jsonb_agg(to_jsonb(r) order by r.table_name) from rls_tabelas r),
      '[]'::jsonb
    ),
    'policies', coalesce(
      (select jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname) from politicas p),
      '[]'::jsonb
    ),
    'functions', coalesce(
      (select jsonb_agg(to_jsonb(f) order by f.proname) from funcoes f),
      '[]'::jsonb
    ),
    'triggers', coalesce(
      (select jsonb_agg(to_jsonb(t) order by t.table_name, t.trigger_name) from triggers_banco t),
      '[]'::jsonb
    )
  )
) as schema_audit;
