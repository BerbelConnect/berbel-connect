begin;

-- Esta migration foi desenhada para o cenário confirmado de um único
-- Representante ativo. A transação inteira é revertida se o cenário mudar.
do $$
declare
  v_administradores integer;
  v_representantes integer;
begin
  select count(*) into v_administradores
  from public.perfis_usuarios
  where lower(perfil) = 'administrador'
    and ativo is true
    and nullif(btrim(email), '') is not null;

  select count(*) into v_representantes
  from public.perfis_usuarios
  where lower(perfil) = 'representante'
    and ativo is true
    and nullif(btrim(email), '') is not null;

  if v_administradores < 1 then
    raise exception 'Nenhum Administrador ativo foi encontrado.';
  end if;

  if v_representantes <> 1 then
    raise exception
      'Esperado exatamente 1 Representante ativo; foram encontrados %.',
      v_representantes;
  end if;
end;
$$;

alter table public.clientes
  add column if not exists responsavel_perfil_id uuid;

alter table public.pedidos
  add column if not exists responsavel_perfil_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clientes_responsavel_perfil_id_fkey'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_responsavel_perfil_id_fkey
      foreign key (responsavel_perfil_id)
      references public.perfis_usuarios(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pedidos_responsavel_perfil_id_fkey'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_responsavel_perfil_id_fkey
      foreign key (responsavel_perfil_id)
      references public.perfis_usuarios(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists clientes_responsavel_perfil_id_idx
  on public.clientes (responsavel_perfil_id);

create index if not exists pedidos_responsavel_perfil_id_idx
  on public.pedidos (responsavel_perfil_id);

create or replace function public.usuario_perfil_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.perfis_usuarios
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ativo is true
  limit 1;
$$;

revoke all on function public.usuario_perfil_id() from public;
revoke all on function public.usuario_perfil_id() from anon;
grant execute on function public.usuario_perfil_id() to authenticated;

create or replace function public.usuario_representante()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis_usuarios
    where id = public.usuario_perfil_id()
      and lower(perfil) = 'representante'
      and ativo is true
  );
$$;

revoke all on function public.usuario_representante() from public;
revoke all on function public.usuario_representante() from anon;
grant execute on function public.usuario_representante() to authenticated;

-- Atribuição inicial aprovada: todos os clientes antigos pertencem ao único
-- Representante ativo. Pedidos herdam o responsável do cliente.
update public.clientes
set responsavel_perfil_id = (
  select id
  from public.perfis_usuarios
  where lower(perfil) = 'representante' and ativo is true
  limit 1
);

update public.pedidos p
set responsavel_perfil_id = coalesce(
  (
    select c.responsavel_perfil_id
    from public.clientes c
    where c.id = p.cliente_id
  ),
  (
    select id
    from public.perfis_usuarios
    where lower(perfil) = 'representante' and ativo is true
    limit 1
  )
);

alter table public.clientes
  alter column responsavel_perfil_id set not null;

alter table public.pedidos
  alter column responsavel_perfil_id set not null;

create or replace function public.definir_responsavel_comercial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atual uuid;
  v_unico_representante uuid;
begin
  v_atual := public.usuario_perfil_id();

  if v_atual is null then
    raise exception 'Usuário ativo não encontrado em perfis_usuarios.';
  end if;

  if tg_table_name = 'clientes' then
    if tg_op = 'UPDATE' and not public.usuario_administrador() then
      new.responsavel_perfil_id := old.responsavel_perfil_id;
    elsif new.responsavel_perfil_id is null then
      if public.usuario_administrador() then
        select id into v_unico_representante
        from public.perfis_usuarios
        where lower(perfil) = 'representante' and ativo is true
        order by created_at
        limit 1;
      end if;
      new.responsavel_perfil_id := coalesce(v_unico_representante, v_atual);
    elsif not public.usuario_administrador()
      and new.responsavel_perfil_id <> v_atual then
      raise exception 'O Representante não pode atribuir clientes a outro usuário.';
    end if;
  elsif tg_table_name = 'pedidos' then
    if tg_op = 'UPDATE' and not public.usuario_administrador() then
      new.responsavel_perfil_id := old.responsavel_perfil_id;
    elsif new.responsavel_perfil_id is null then
      select responsavel_perfil_id
        into new.responsavel_perfil_id
      from public.clientes
      where id = new.cliente_id;
      new.responsavel_perfil_id := coalesce(new.responsavel_perfil_id, v_atual);
    elsif not public.usuario_administrador()
      and new.responsavel_perfil_id <> v_atual then
      raise exception 'O Representante não pode criar pedidos para outro usuário.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clientes_definir_responsavel on public.clientes;
create trigger trg_clientes_definir_responsavel
before insert or update of responsavel_perfil_id on public.clientes
for each row execute function public.definir_responsavel_comercial();

drop trigger if exists trg_pedidos_definir_responsavel on public.pedidos;
create trigger trg_pedidos_definir_responsavel
before insert or update of responsavel_perfil_id, cliente_id on public.pedidos
for each row execute function public.definir_responsavel_comercial();

revoke all on function public.definir_responsavel_comercial() from public;
revoke all on function public.definir_responsavel_comercial() from anon;

-- Remove as políticas amplas criadas na etapa anterior.
do $$
declare
  v_tabela text;
  v_politica record;
begin
  foreach v_tabela in array array[
    'clientes', 'fornecedores', 'produtos', 'pedidos', 'pedido_itens',
    'contas_receber', 'contas_pagar', 'comissoes_financeiro'
  ] loop
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
  end loop;
end;
$$;

-- Clientes: Administrador controla tudo; Representante trabalha apenas nos seus.
create policy clientes_admin_all on public.clientes
  for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());
create policy clientes_representante_select on public.clientes
  for select to authenticated
  using (responsavel_perfil_id = public.usuario_perfil_id());
create policy clientes_representante_insert on public.clientes
  for insert to authenticated
  with check (responsavel_perfil_id = public.usuario_perfil_id());
create policy clientes_representante_update on public.clientes
  for update to authenticated
  using (responsavel_perfil_id = public.usuario_perfil_id())
  with check (responsavel_perfil_id = public.usuario_perfil_id());

-- Catálogos compartilhados para leitura; manutenção exclusiva do Administrador.
create policy fornecedores_authenticated_select on public.fornecedores
  for select to authenticated using (true);
create policy fornecedores_admin_write on public.fornecedores
  for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());
create policy produtos_authenticated_select on public.produtos
  for select to authenticated using (true);
create policy produtos_admin_write on public.produtos
  for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());

-- Pedidos: Representante cria e atualiza somente os próprios; nunca exclui.
create policy pedidos_admin_all on public.pedidos
  for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());
create policy pedidos_representante_select on public.pedidos
  for select to authenticated
  using (responsavel_perfil_id = public.usuario_perfil_id());
create policy pedidos_representante_insert on public.pedidos
  for insert to authenticated
  with check (responsavel_perfil_id = public.usuario_perfil_id());
create policy pedidos_representante_update on public.pedidos
  for update to authenticated
  using (responsavel_perfil_id = public.usuario_perfil_id())
  with check (responsavel_perfil_id = public.usuario_perfil_id());

-- Itens seguem o responsável do pedido.
create policy pedido_itens_admin_all on public.pedido_itens
  for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());
create policy pedido_itens_representante_select on public.pedido_itens
  for select to authenticated
  using (exists (
    select 1 from public.pedidos p
    where p.id = pedido_itens.pedido_id
      and p.responsavel_perfil_id = public.usuario_perfil_id()
  ));
create policy pedido_itens_representante_insert on public.pedido_itens
  for insert to authenticated
  with check (exists (
    select 1 from public.pedidos p
    where p.id = pedido_itens.pedido_id
      and p.responsavel_perfil_id = public.usuario_perfil_id()
  ));
create policy pedido_itens_representante_update on public.pedido_itens
  for update to authenticated
  using (exists (
    select 1 from public.pedidos p
    where p.id = pedido_itens.pedido_id
      and p.responsavel_perfil_id = public.usuario_perfil_id()
  ))
  with check (exists (
    select 1 from public.pedidos p
    where p.id = pedido_itens.pedido_id
      and p.responsavel_perfil_id = public.usuario_perfil_id()
  ));

-- Financeiro: Representante enxerga e cria lançamentos dos próprios pedidos;
-- baixas, alterações e exclusões permanecem exclusivas do Administrador.
do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'contas_receber', 'contas_pagar', 'comissoes_financeiro'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.usuario_administrador()) with check (public.usuario_administrador())',
      v_tabela || '_admin_all', v_tabela
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.responsavel_perfil_id = public.usuario_perfil_id()))',
      v_tabela || '_representante_select', v_tabela
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.pedidos p where p.id = pedido_id and p.responsavel_perfil_id = public.usuario_perfil_id()))',
      v_tabela || '_representante_insert', v_tabela
    );
  end loop;
end;
$$;

commit;
