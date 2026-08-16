begin;

create table if not exists public.auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid,
  operacao text not null,
  motivo text not null check (length(btrim(motivo)) >= 5),
  valores_antes jsonb,
  valores_depois jsonb,
  usuario_auth_id uuid not null,
  usuario_perfil_id uuid,
  usuario_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists auditoria_eventos_entidade_idx
  on public.auditoria_eventos (entidade, entidade_id, created_at desc);
create index if not exists auditoria_eventos_created_at_idx
  on public.auditoria_eventos (created_at desc);

create table if not exists public.ajustes_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'Conciliação bancária',
  saldo_sistema_antes numeric(14,2) not null,
  saldo_banco numeric(14,2) not null,
  valor_ajuste numeric(14,2) not null,
  saldo_sistema_depois numeric(14,2) not null,
  motivo text not null check (length(btrim(motivo)) >= 5),
  usuario_auth_id uuid not null,
  usuario_perfil_id uuid,
  usuario_email text not null,
  created_at timestamptz not null default now()
);

alter table public.auditoria_eventos enable row level security;
alter table public.ajustes_financeiros enable row level security;

drop policy if exists auditoria_eventos_admin_select on public.auditoria_eventos;
create policy auditoria_eventos_admin_select on public.auditoria_eventos
  for select to authenticated using (public.usuario_administrador());
drop policy if exists ajustes_financeiros_admin_select on public.ajustes_financeiros;
create policy ajustes_financeiros_admin_select on public.ajustes_financeiros
  for select to authenticated using (public.usuario_administrador());

revoke insert, update, delete on public.auditoria_eventos from anon, authenticated;
revoke insert, update, delete on public.ajustes_financeiros from anon, authenticated;
grant select on public.auditoria_eventos, public.ajustes_financeiros to authenticated;

create or replace function public.saldo_financeiro_auditado()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select round(
    coalesce((select sum(valor) from public.contas_receber
      where recebimento is not null or lower(coalesce(status, '')) in ('recebido','pago','quitado')), 0)
    - coalesce((select sum(valor) from public.contas_pagar
      where pagamento is not null or lower(coalesce(status, '')) in ('pago','quitado')), 0)
    + coalesce((select sum(valor_ajuste) from public.ajustes_financeiros), 0), 2
  );
$$;

revoke all on function public.saldo_financeiro_auditado() from public, anon;
grant execute on function public.saldo_financeiro_auditado() to authenticated;

create or replace function public.conciliar_saldo_bancario(p_saldo_banco numeric, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes numeric(14,2);
  v_ajuste numeric(14,2);
  v_id uuid;
  v_perfil uuid;
begin
  if not public.usuario_administrador() then raise exception 'Somente administradores podem conciliar o saldo.'; end if;
  if p_saldo_banco is null then raise exception 'Informe o saldo real do banco.'; end if;
  if length(btrim(coalesce(p_motivo,''))) < 5 then raise exception 'Informe um motivo com pelo menos 5 caracteres.'; end if;
  perform pg_advisory_xact_lock(hashtext('conciliacao_saldo_bancario'));
  v_perfil := public.usuario_perfil_id();
  v_antes := public.saldo_financeiro_auditado();
  v_ajuste := round(p_saldo_banco - v_antes, 2);
  insert into public.ajustes_financeiros (
    saldo_sistema_antes, saldo_banco, valor_ajuste, saldo_sistema_depois, motivo,
    usuario_auth_id, usuario_perfil_id, usuario_email
  ) values (
    v_antes, round(p_saldo_banco,2), v_ajuste, round(p_saldo_banco,2), btrim(p_motivo),
    auth.uid(), v_perfil, coalesce(auth.jwt()->>'email','')
  ) returning id into v_id;
  insert into public.auditoria_eventos (
    entidade, entidade_id, operacao, motivo, valores_antes, valores_depois,
    usuario_auth_id, usuario_perfil_id, usuario_email
  ) values (
    'financeiro', v_id, 'Conciliação de saldo', btrim(p_motivo),
    jsonb_build_object('saldo_sistema',v_antes),
    jsonb_build_object('saldo_banco',round(p_saldo_banco,2),'ajuste',v_ajuste,'saldo_sistema',round(p_saldo_banco,2)),
    auth.uid(), v_perfil, coalesce(auth.jwt()->>'email','')
  );
  return jsonb_build_object('ajuste_id',v_id,'saldo_antes',v_antes,'valor_ajuste',v_ajuste,'saldo_depois',round(p_saldo_banco,2));
end;
$$;

create or replace function public.snapshot_pedido_completo(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'pedido', to_jsonb(p),
    'itens', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at, i.id) from public.pedido_itens i where i.pedido_id=p.id),'[]'::jsonb),
    'contas_receber', coalesce((select jsonb_agg(to_jsonb(r) order by r.vencimento, r.id) from public.contas_receber r where r.pedido_id=p.id),'[]'::jsonb),
    'contas_pagar', coalesce((select jsonb_agg(to_jsonb(g) order by g.vencimento, g.id) from public.contas_pagar g where g.pedido_id=p.id),'[]'::jsonb),
    'comissoes', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at, c.id) from public.comissoes_financeiro c where c.pedido_id=p.id),'[]'::jsonb)
  ) from public.pedidos p where p.id=p_id;
$$;

revoke all on function public.snapshot_pedido_completo(uuid) from public, anon, authenticated;

create or replace function public.editar_pedido_auditavel(
  p_pedido_id uuid, p_motivo text, p_pedido jsonb, p_itens jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ant jsonb; v_dep jsonb; v_total numeric; v_custo numeric; v_comissao numeric; v_lucro numeric;
  v_pedido public.pedidos%rowtype; v_perfil uuid; v_receber_count integer; v_pagar_count integer;
begin
  if not public.usuario_administrador() then raise exception 'Somente administradores podem editar pedidos auditavelmente.'; end if;
  if length(btrim(coalesce(p_motivo,''))) < 5 then raise exception 'Informe um motivo com pelo menos 5 caracteres.'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens)=0 then raise exception 'O pedido deve possuir ao menos um item.'; end if;
  select * into v_pedido from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;
  if lower(coalesce(v_pedido.status,''))='cancelado' then raise exception 'Pedido cancelado não pode ser editado.'; end if;
  if exists(select 1 from public.contas_receber where pedido_id=p_pedido_id and (recebimento is not null or lower(coalesce(status,'')) in ('recebido','pago','quitado')))
    or exists(select 1 from public.contas_pagar where pedido_id=p_pedido_id and (pagamento is not null or lower(coalesce(status,'')) in ('pago','quitado')))
    or exists(select 1 from public.comissoes_financeiro where pedido_id=p_pedido_id and (data_recebimento is not null or lower(coalesce(status,'')) in ('recebida','recebido','pago','quitado')))
  then raise exception 'O pedido possui movimentação liquidada. Estorne-a antes da edição.'; end if;
  v_ant := public.snapshot_pedido_completo(p_pedido_id);
  select round(sum(qtd*unit),2), round(sum(qtd*custo),2), round(sum(qtd*unit*pct/100),2)
  into v_total,v_custo,v_comissao from (
    select coalesce((x->>'quantidade')::numeric,0) qtd, coalesce((x->>'valor_unitario')::numeric,0) unit,
      coalesce((x->>'valor_custo_unitario')::numeric,0) custo, coalesce((x->>'comissao_percentual')::numeric,0) pct
    from jsonb_array_elements(p_itens) x
  ) s;
  if v_total < 0 or v_custo < 0 then raise exception 'Valores não podem ser negativos.'; end if;
  v_lucro := round(v_total-v_custo,2);
  update public.pedidos set
    cliente_id=coalesce(nullif(p_pedido->>'cliente_id','')::uuid,cliente_id),
    numero=coalesce(nullif(btrim(p_pedido->>'numero'),''),numero),
    numero_pedido=coalesce(nullif(btrim(p_pedido->>'numero'),''),numero_pedido),
    data_pedido=coalesce(nullif(p_pedido->>'data_pedido','')::date,data_pedido),
    data_entrega_prevista=nullif(p_pedido->>'data_entrega_prevista','')::date,
    observacoes=nullif(p_pedido->>'observacoes',''), valor_total=v_total, valor_custo_total=v_custo,
    valor_comissao=v_comissao, lucro_total=v_lucro
  where id=p_pedido_id;
  delete from public.pedido_itens where pedido_id=p_pedido_id;
  insert into public.pedido_itens (pedido_id,produto_id,produto_nome,fornecedor_id,quantidade,valor_unitario,valor_total,comissao_percentual,valor_comissao,valor_custo_unitario,valor_custo_total,lucro_unitario,lucro_total)
  select p_pedido_id,nullif(x->>'produto_id','')::uuid,nullif(x->>'produto_nome',''),nullif(x->>'fornecedor_id','')::uuid,
    (x->>'quantidade')::numeric,round((x->>'valor_unitario')::numeric,2),round((x->>'quantidade')::numeric*(x->>'valor_unitario')::numeric,2),
    round(coalesce((x->>'comissao_percentual')::numeric,0),4),round((x->>'quantidade')::numeric*(x->>'valor_unitario')::numeric*coalesce((x->>'comissao_percentual')::numeric,0)/100,2),
    round(coalesce((x->>'valor_custo_unitario')::numeric,0),2),round((x->>'quantidade')::numeric*coalesce((x->>'valor_custo_unitario')::numeric,0),2),
    round((x->>'valor_unitario')::numeric-coalesce((x->>'valor_custo_unitario')::numeric,0),2),round((x->>'quantidade')::numeric*((x->>'valor_unitario')::numeric-coalesce((x->>'valor_custo_unitario')::numeric,0)),2)
  from jsonb_array_elements(p_itens) x;
  select count(*) into v_receber_count from public.contas_receber where pedido_id=p_pedido_id;
  select count(*) into v_pagar_count from public.contas_pagar where pedido_id=p_pedido_id;
  update public.contas_receber set valor=round(v_total/greatest(v_receber_count,1),2), cliente_id=(select cliente_id from public.pedidos where id=p_pedido_id) where pedido_id=p_pedido_id;
  if v_receber_count>0 then update public.contas_receber set valor=valor+(v_total-(select sum(valor) from public.contas_receber where pedido_id=p_pedido_id)) where id=(select id from public.contas_receber where pedido_id=p_pedido_id order by vencimento,id limit 1); end if;
  update public.contas_pagar set valor=round(v_custo/greatest(v_pagar_count,1),2) where pedido_id=p_pedido_id;
  if v_pagar_count>0 then update public.contas_pagar set valor=valor+(v_custo-(select sum(valor) from public.contas_pagar where pedido_id=p_pedido_id)) where id=(select id from public.contas_pagar where pedido_id=p_pedido_id order by vencimento,id limit 1); end if;
  update public.comissoes_financeiro set valor_base=v_total, valor_comissao=v_comissao,
    percentual=case when v_total>0 then round(v_comissao/v_total*100,4) else 0 end where pedido_id=p_pedido_id;
  v_dep := public.snapshot_pedido_completo(p_pedido_id); v_perfil:=public.usuario_perfil_id();
  insert into public.auditoria_eventos(entidade,entidade_id,operacao,motivo,valores_antes,valores_depois,usuario_auth_id,usuario_perfil_id,usuario_email)
  values('pedido',p_pedido_id,'Edição transacional',btrim(p_motivo),v_ant,v_dep,auth.uid(),v_perfil,coalesce(auth.jwt()->>'email',''));
  return jsonb_build_object('pedido_id',p_pedido_id,'valor_total',v_total,'valor_custo_total',v_custo,'valor_comissao',v_comissao,'lucro_total',v_lucro);
end;
$$;

create or replace function public.excluir_pedido_cancelado_auditavel(p_pedido_id uuid,p_motivo text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_snapshot jsonb; v_numero text; v_perfil uuid;
begin
  if not public.usuario_administrador() then raise exception 'Somente administradores podem excluir pedidos.'; end if;
  if length(btrim(coalesce(p_motivo,'')))<5 then raise exception 'Informe um motivo com pelo menos 5 caracteres.'; end if;
  select coalesce(numero,numero_pedido) into v_numero from public.pedidos where id=p_pedido_id and lower(coalesce(status,''))='cancelado' for update;
  if not found then raise exception 'Somente pedidos cancelados podem ser excluídos definitivamente.'; end if;
  v_snapshot:=public.snapshot_pedido_completo(p_pedido_id); v_perfil:=public.usuario_perfil_id();
  insert into public.auditoria_eventos(entidade,entidade_id,operacao,motivo,valores_antes,valores_depois,usuario_auth_id,usuario_perfil_id,usuario_email)
  values('pedido',p_pedido_id,'Exclusão definitiva de cancelado',btrim(p_motivo),v_snapshot,null,auth.uid(),v_perfil,coalesce(auth.jwt()->>'email',''));
  delete from public.conciliacoes_financeiras where movimento_id in (select id from public.movimentacoes_financeiras_auditoria where registro_id in (select id from public.contas_receber where pedido_id=p_pedido_id union select id from public.contas_pagar where pedido_id=p_pedido_id));
  delete from public.movimentacoes_financeiras_auditoria where registro_id in (select id from public.contas_receber where pedido_id=p_pedido_id union select id from public.contas_pagar where pedido_id=p_pedido_id);
  delete from public.comissoes_financeiro where pedido_id=p_pedido_id; delete from public.contas_receber where pedido_id=p_pedido_id;
  delete from public.contas_pagar where pedido_id=p_pedido_id; delete from public.pedido_itens where pedido_id=p_pedido_id; delete from public.pedidos where id=p_pedido_id;
  return jsonb_build_object('pedido_id',p_pedido_id,'numero',v_numero,'excluido',true);
end; $$;

revoke all on function public.conciliar_saldo_bancario(numeric,text) from public,anon;
revoke all on function public.editar_pedido_auditavel(uuid,text,jsonb,jsonb) from public,anon;
revoke all on function public.excluir_pedido_cancelado_auditavel(uuid,text) from public,anon;
grant execute on function public.conciliar_saldo_bancario(numeric,text) to authenticated;
grant execute on function public.editar_pedido_auditavel(uuid,text,jsonb,jsonb) to authenticated;
grant execute on function public.excluir_pedido_cancelado_auditavel(uuid,text) to authenticated;

-- Bloqueia DELETE direto: a exclusão permitida passa pela função acima, que usa SECURITY DEFINER.
revoke delete on public.pedidos,public.pedido_itens,public.contas_receber,public.contas_pagar,public.comissoes_financeiro from authenticated;

commit;
