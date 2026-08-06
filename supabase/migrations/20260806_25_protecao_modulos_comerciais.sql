begin;

-- Esta migration remove acessos anônimos ainda existentes nos módulos
-- comerciais. Nenhum registro é criado, alterado ou excluído.

do $$
declare
  v_objeto text;
begin
  foreach v_objeto in array array[
    'visitas',
    'pipeline_comercial',
    'representadas',
    'metas_comerciais'
  ]
  loop
    if to_regclass(format('public.%I', v_objeto)) is null then
      raise exception 'Objeto obrigatório public.% não encontrado', v_objeto;
    end if;
  end loop;
end;
$$;

-- Visitas e agenda: mantém o compartilhamento atual entre usuários da
-- empresa, mas exige sessão autenticada para qualquer operação.
drop policy if exists "Permitir cadastro visitas" on public.visitas;
drop policy if exists "Permitir edicao visitas" on public.visitas;
drop policy if exists "Permitir exclusao visitas" on public.visitas;
drop policy if exists "Permitir leitura visitas" on public.visitas;

alter table public.visitas enable row level security;

create policy visitas_authenticated_select
  on public.visitas for select to authenticated using (true);
create policy visitas_authenticated_insert
  on public.visitas for insert to authenticated with check (true);
create policy visitas_authenticated_update
  on public.visitas for update to authenticated
  using (true) with check (true);
create policy visitas_authenticated_delete
  on public.visitas for delete to authenticated using (true);

-- Pipeline: mantém o comportamento compartilhado atual somente para quem
-- estiver autenticado.
drop policy if exists pipeline_select on public.pipeline_comercial;
drop policy if exists pipeline_insert on public.pipeline_comercial;
drop policy if exists pipeline_update on public.pipeline_comercial;
drop policy if exists pipeline_delete on public.pipeline_comercial;

alter table public.pipeline_comercial enable row level security;

create policy pipeline_authenticated_select
  on public.pipeline_comercial for select to authenticated using (true);
create policy pipeline_authenticated_insert
  on public.pipeline_comercial for insert to authenticated with check (true);
create policy pipeline_authenticated_update
  on public.pipeline_comercial for update to authenticated
  using (true) with check (true);
create policy pipeline_authenticated_delete
  on public.pipeline_comercial for delete to authenticated using (true);

-- Representadas: todos os usuários autenticados podem consultar, mas apenas
-- administradores podem cadastrar, editar ou excluir.
drop policy if exists "Permitir cadastro representadas" on public.representadas;
drop policy if exists "Permitir edicao representadas" on public.representadas;
drop policy if exists "Permitir exclusao representadas" on public.representadas;
drop policy if exists "Permitir leitura representadas" on public.representadas;

alter table public.representadas enable row level security;

create policy representadas_authenticated_select
  on public.representadas for select to authenticated using (true);
create policy representadas_admin_all
  on public.representadas for all to authenticated
  using (public.usuario_administrador())
  with check (public.usuario_administrador());

-- Remove as quatro políticas antigas que ainda concediam acesso ao papel
-- public. As políticas authenticated já existentes permanecem ativas.
drop policy if exists metas_select on public.metas_comerciais;
drop policy if exists metas_insert on public.metas_comerciais;
drop policy if exists metas_update on public.metas_comerciais;
drop policy if exists metas_delete on public.metas_comerciais;

-- O papel anon não precisa de privilégios diretos nesses módulos. O
-- service_role não é alterado e authenticated mantém seus privilégios.
revoke all privileges on table public.visitas from anon;
revoke all privileges on table public.pipeline_comercial from anon;
revoke all privileges on table public.representadas from anon;
revoke all privileges on table public.metas_comerciais from anon;

-- Views comuns executam com as permissões do usuário que as consulta. Isso
-- faz com que respeitem as políticas RLS das tabelas de origem.
do $$
declare
  v_view text;
begin
  foreach v_view in array array[
    'vw_alertas_comerciais',
    'vw_clientes_resumo',
    'vw_representadas_resumo'
  ]
  loop
    if to_regclass(format('public.%I', v_view)) is not null then
      execute format(
        'alter view public.%I set (security_invoker = true)',
        v_view
      );
      execute format(
        'revoke all privileges on table public.%I from anon',
        v_view
      );
      execute format(
        'grant select on table public.%I to authenticated',
        v_view
      );
    end if;
  end loop;
end;
$$;

commit;
