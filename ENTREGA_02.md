# Entregável 02 — Cancelamento auditável de pedidos

## Objetivo

Substituir a exclusão definitiva por um cancelamento transacional que preserve
o pedido, os itens e o histórico financeiro.

## Regras

- somente Administradores autenticados podem cancelar;
- o motivo é obrigatório e fica registrado no pedido;
- pedido, contas a receber, contas a pagar e comissões são atualizados na mesma
  transação;
- lançamentos financeiros permanecem no banco com status `Cancelado`;
- pedidos com recebimento, pagamento ou comissão já confirmados são bloqueados
  para exigir tratamento financeiro manual;
- uma segunda tentativa devolve o cancelamento existente sem duplicar efeitos.

## Aplicação controlada

1. aplicar `supabase/migrations/20260719_03_cancelamento_pedido_auditavel.sql`;
2. publicar a interface em uma Vercel Preview;
3. criar e cancelar um pedido de teste sem baixa financeira;
4. verificar o histórico no banco antes do merge em produção.
