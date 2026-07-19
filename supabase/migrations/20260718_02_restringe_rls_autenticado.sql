begin;

-- Evita bloquear a administração caso ainda não exista um administrador ativo.
do $$
begin
  if not exists (
    select 1
    from public.perfis_usuarios
    where lower(perfil) = 'administrador'
      and ativo is true
      and nullif(btrim(email), '') is not null
  ) then
    raise exception
      'Nenhum Administrador ativo foi encontrado em perfis_usuarios. Cadastre-o antes desta migration.';
  end if;
end;
$$;

-- Impede acesso anônimo às tabelas operacionais. Os usuários autenticados
-- continuam compartilhando os dados da empresa, como no comportamento atual.
do $$
declare
  v_tabela text;
  v_politica record;
begin
  foreach v_tabela in array array[
    'clientes',
    'fornecedores',
    'produtos',
    'pedidos',
    'pedido_itens',
    'contas_receber',
    'contas_pagar',
    'comissoes_financeiro'
  ]
  loop
    for v_politica in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = v_tabela
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        v_politica.policyname,
        v_tabela
      );
    end loop;

    execute format('alter table public.%I enable row level security', v_tabela);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      v_tabela || '_select_authenticated',
      v_tabela
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      v_tabela || '_insert_authenticated',
      v_tabela
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      v_tabela || '_update_authenticated',
      v_tabela
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      v_tabela || '_delete_authenticated',
      v_tabela
    );
  end loop;
end;
$$;

create or replace function public.usuario_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis_usuarios
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(perfil) = 'administrador'
      and ativo is true
  );
$$;

revoke all on function public.usuario_administrador() from public;
revoke all on function public.usuario_administrador() from anon;
grant execute on function public.usuario_administrador() to authenticated;

do $$
declare
  v_politica record;
begin
  for v_politica in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'perfis_usuarios'
  loop
    execute format(
      'drop policy if exists %I on public.perfis_usuarios',
      v_politica.policyname
    );
  end loop;
end;
$$;

alter table public.perfis_usuarios enable row level security;

create policy perfis_select_proprio_ou_admin
  on public.perfis_usuarios
  for select
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.usuario_administrador()
  );

create policy perfis_insert_admin
  on public.perfis_usuarios
  for insert
  to authenticated
  with check (public.usuario_administrador());

create policy perfis_update_admin
  on public.perfis_usuarios
  for update
  to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());

create policy perfis_delete_admin
  on public.perfis_usuarios
  for delete
  to authenticated
  using (public.usuario_administrador());

commit;
