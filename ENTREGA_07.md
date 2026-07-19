# Entregável 07 — Baixas financeiras auditáveis

## Implementado

- baixas transacionais de contas a receber, contas a pagar e comissões;
- bloqueio de baixa duplicada e de lançamentos cancelados;
- data, forma e motivo obrigatórios conforme o tipo de movimento;
- identificação do usuário autenticado que confirmou a operação;
- histórico imutável em `movimentacoes_financeiras_auditoria`;
- permissão de baixa somente para Administrador ou Financeiro;
- interface integrada às RPCs, sem alteração direta do status;
- remoção das exclusões destrutivas nas três telas financeiras.

## Implantação controlada

1. aplicar `supabase/migrations/20260719_07_baixas_financeiras_auditaveis.sql`;
2. executar a consulta de verificação fornecida após a migration;
3. publicar a branch em uma prévia da Vercel;
4. validar uma baixa de teste ainda pendente;
5. verificar o registro correspondente na auditoria;
6. somente então concluir o merge.
