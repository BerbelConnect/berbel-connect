-- Verificação somente leitura após a migration 20260806_25.

select
  c.relname as objeto,
  case c.relkind when 'r' then 'tabela' when 'v' then 'view' else c.relkind::text end as tipo,
  c.relrowsecurity as rls_habilitada,
  coalesce(c.reloptions::text, '') as opcoes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'visitas',
    'pipeline_comercial',
    'representadas',
    'metas_comerciais',
    'vw_alertas_comerciais',
    'vw_clientes_resumo',
    'vw_representadas_resumo'
  )
order by c.relname;

select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'visitas',
    'pipeline_comercial',
    'representadas',
    'metas_comerciais'
  )
order by tablename, policyname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'visitas',
    'pipeline_comercial',
    'representadas',
    'metas_comerciais',
    'vw_alertas_comerciais',
    'vw_clientes_resumo',
    'vw_representadas_resumo'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
