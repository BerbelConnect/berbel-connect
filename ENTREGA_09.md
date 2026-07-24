# Entregável 09 — Estorno financeiro auditável

## Implementado

- estorno transacional de contas a receber, contas a pagar e comissões;
- motivo obrigatório com pelo menos três caracteres;
- retorno do lançamento ao status `Pendente`;
- preservação da baixa original e inclusão de um novo evento de `Estorno`;
- identificação do usuário responsável, valor, forma, data e alteração de status;
- permissão restrita a Administrador ou Financeiro;
- bloqueio de estorno duplicado ou de lançamento ainda pendente;
- identificação visual de baixas e estornos no Histórico Financeiro.

## Implantação controlada

1. aplicar `supabase/migrations/20260724_09_estorno_financeiro_auditavel.sql`;
2. executar `supabase/diagnostics/20260724_09_estorno_financeiro_auditavel.sql`;
3. copiar os arquivos da entrega para a branch `feat/estorno-financeiro-auditavel`;
4. publicar a branch e aguardar a prévia da Vercel;
5. testar uma baixa e o respectivo estorno;
6. confirmar os dois eventos no Histórico Financeiro;
7. somente então concluir o merge.
