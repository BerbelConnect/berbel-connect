-- Berbel Connect — diagnóstico somente leitura
-- Execute no SQL Editor do Supabase antes da migration transacional.
-- Este arquivo não cria, altera ou exclui nenhum objeto do banco.

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
)
select
  'COLUNA' as tipo_registro,
  c.table_name as objeto,
  c.ordinal_position::text as ordem,
  c.column_name as nome,
  concat(
    c.data_type,
    case
      when c.character_maximum_length is not null
        then concat('(', c.character_maximum_length, ')')
      else ''
    end
  ) as definicao,
  concat(
    'nullable=', c.is_nullable,
    '; default=', coalesce(c.column_default, 'NULL')
  ) as detalhes
from information_schema.columns c
join tabelas_alvo t on t.nome = c.table_name
where c.table_schema = 'public'

union all

select
  'CONSTRAINT' as tipo_registro,
  tc.table_name as objeto,
  '' as ordem,
  tc.constraint_name as nome,
  tc.constraint_type as definicao,
  coalesce(string_agg(kcu.column_name, ', ' order by kcu.ordinal_position), '') as detalhes
from information_schema.table_constraints tc
join tabelas_alvo t on t.nome = tc.table_name
left join information_schema.key_column_usage kcu
  on kcu.constraint_schema = tc.constraint_schema
 and kcu.constraint_name = tc.constraint_name
 and kcu.table_name = tc.table_name
where tc.table_schema = 'public'
group by tc.table_name, tc.constraint_name, tc.constraint_type

union all

select
  'ÍNDICE' as tipo_registro,
  i.tablename as objeto,
  '' as ordem,
  i.indexname as nome,
  '' as definicao,
  i.indexdef as detalhes
from pg_indexes i
join tabelas_alvo t on t.nome = i.tablename
where i.schemaname = 'public'

union all

select
  'RLS' as tipo_registro,
  p.tablename as objeto,
  '' as ordem,
  p.policyname as nome,
  concat(p.cmd, '; permissive=', p.permissive) as definicao,
  concat(
    'roles=', array_to_string(p.roles, ','),
    '; using=', coalesce(p.qual, 'NULL'),
    '; check=', coalesce(p.with_check, 'NULL')
  ) as detalhes
from pg_policies p
join tabelas_alvo t on t.nome = p.tablename
where p.schemaname = 'public'

order by objeto, tipo_registro, ordem, nome;

-- Confirma separadamente se RLS está habilitada em cada tabela.
select
  c.relname as tabela,
  c.relrowsecurity as rls_habilitada,
  c.relforcerowsecurity as rls_forcada
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'pedidos',
    'pedido_itens',
    'clientes',
    'produtos',
    'fornecedores',
    'contas_receber',
    'contas_pagar',
    'comissoes_financeiro',
    'perfis_usuarios'
  )
order by c.relname;

-- Lista funções públicas que podem já participar do fluxo de pedidos.
select
  p.proname as funcao,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  pg_get_function_result(p.oid) as retorno,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.proname ilike '%pedido%'
    or p.proname ilike '%financeir%'
    or p.proname ilike '%comiss%'
  )
order by p.proname;
