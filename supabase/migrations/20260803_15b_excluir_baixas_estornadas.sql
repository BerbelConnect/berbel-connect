begin;

create or replace function public.validar_sugestao_extrato_ativa()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_movimento public.movimentacoes_financeiras_auditoria%rowtype;
begin
  if new.movimento_sugerido_id is null then
    return new;
  end if;

  select * into v_movimento
  from public.movimentacoes_financeiras_auditoria
  where id = new.movimento_sugerido_id
    and operacao = 'Baixa';

  if not found then
    raise exception 'Movimento sugerido não corresponde a uma baixa.';
  end if;

  if exists (
    select 1
    from public.movimentacoes_financeiras_auditoria estorno
    where estorno.entidade = v_movimento.entidade
      and estorno.registro_id = v_movimento.registro_id
      and estorno.operacao = 'Estorno'
      and estorno.created_at > v_movimento.created_at
  ) then
    raise exception 'Uma baixa estornada não pode ser sugerida para conciliação.';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_sugestao_extrato_ativa
  on public.extratos_bancarios_lancamentos;

create trigger validar_sugestao_extrato_ativa
before insert or update of movimento_sugerido_id
on public.extratos_bancarios_lancamentos
for each row
execute function public.validar_sugestao_extrato_ativa();

commit;

select
  to_regprocedure('public.validar_sugestao_extrato_ativa()') is not null
    as funcao_validacao,
  exists (
    select 1
    from pg_trigger
    where tgname = 'validar_sugestao_extrato_ativa'
      and not tgisinternal
  ) as trigger_validacao;
