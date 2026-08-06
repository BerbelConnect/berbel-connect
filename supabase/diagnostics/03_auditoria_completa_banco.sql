-- Berbel Connect — auditoria completa do schema public (somente leitura)
-- Não cria, altera ou exclui dados ou objetos do banco.
-- Execute no SQL Editor do Supabase e exporte o resultado em CSV.

with tabelas as (
  select
    n.nspname as schema_name,
    c.relname as object_name,
    case c.relkind
      when 'r' then 'table'
      when 'p' then 'partitioned_table'
      when 'v' then 'view'
      when 'm' then 'materialized_view'
      else c.relkind::text
    end as object_type,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'm')
),
colunas as (
  select
    c.table_name,
    jsonb_agg(
      jsonb_build_object(
        'position', c.ordinal_position,
        'name', c.column_name,
        'data_type', c.data_type,
        'udt_name', c.udt_name,
        'nullable', c.is_nullable,
        'default', c.column_default
      ) order by c.ordinal_position
    ) as items
  from information_schema.columns c
  where c.table_schema = 'public'
  group by c.table_name
),
politicas as (
  select
    p.tablename,
    jsonb_agg(
      jsonb_build_object(
        'name', p.policyname,
        'permissive', p.permissive,
        'roles', p.roles,
        'command', p.cmd,
        'using', p.qual,
        'check', p.with_check
      ) order by p.policyname
    ) as items
  from pg_policies p
  where p.schemaname = 'public'
  group by p.tablename
),
constraints_banco as (
  select
    tc.table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', tc.constraint_name,
        'type', tc.constraint_type,
        'columns', coalesce(cols.columns, '[]'::jsonb)
      ) order by tc.constraint_name
    ) as items
  from information_schema.table_constraints tc
  left join lateral (
    select jsonb_agg(kcu.column_name order by kcu.ordinal_position) as columns
    from information_schema.key_column_usage kcu
    where kcu.constraint_schema = tc.constraint_schema
      and kcu.constraint_name = tc.constraint_name
      and kcu.table_name = tc.table_name
  ) cols on true
  where tc.table_schema = 'public'
  group by tc.table_name
),
indices as (
  select
    i.tablename,
    jsonb_agg(
      jsonb_build_object('name', i.indexname, 'definition', i.indexdef)
      order by i.indexname
    ) as items
  from pg_indexes i
  where i.schemaname = 'public'
  group by i.tablename
),
triggers_banco as (
  select
    t.event_object_table,
    jsonb_agg(
      jsonb_build_object(
        'name', t.trigger_name,
        'event', t.event_manipulation,
        'timing', t.action_timing,
        'statement', t.action_statement
      ) order by t.trigger_name, t.event_manipulation
    ) as items
  from information_schema.triggers t
  where t.trigger_schema = 'public'
  group by t.event_object_table
),
grants_tabelas as (
  select
    g.table_name,
    jsonb_agg(
      distinct jsonb_build_object(
        'grantee', g.grantee,
        'privilege', g.privilege_type
      )
    ) as items
  from information_schema.role_table_grants g
  where g.table_schema = 'public'
    and g.grantee in ('anon', 'authenticated', 'service_role')
  group by g.table_name
),
funcoes as (
  select jsonb_agg(
    jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'result', pg_get_function_result(p.oid),
      'security_definer', p.prosecdef,
      'definition', pg_get_functiondef(p.oid)
    ) order by p.proname, pg_get_function_identity_arguments(p.oid)
  ) as items
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),
objetos as (
  select jsonb_agg(
    jsonb_build_object(
      'name', t.object_name,
      'type', t.object_type,
      'rls_enabled', t.rls_enabled,
      'rls_forced', t.rls_forced,
      'columns', coalesce(c.items, '[]'::jsonb),
      'constraints', coalesce(cb.items, '[]'::jsonb),
      'indexes', coalesce(i.items, '[]'::jsonb),
      'policies', coalesce(p.items, '[]'::jsonb),
      'triggers', coalesce(tr.items, '[]'::jsonb),
      'grants', coalesce(g.items, '[]'::jsonb)
    ) order by t.object_type, t.object_name
  ) as items
  from tabelas t
  left join colunas c on c.table_name = t.object_name
  left join constraints_banco cb on cb.table_name = t.object_name
  left join indices i on i.tablename = t.object_name
  left join politicas p on p.tablename = t.object_name
  left join triggers_banco tr on tr.event_object_table = t.object_name
  left join grants_tabelas g on g.table_name = t.object_name
)
select jsonb_pretty(
  jsonb_build_object(
    'generated_at', now(),
    'database_timezone', current_setting('TIMEZONE'),
    'objects', coalesce(objetos.items, '[]'::jsonb),
    'functions', coalesce(funcoes.items, '[]'::jsonb)
  )
) as auditoria_completa
from objetos
cross join funcoes;
