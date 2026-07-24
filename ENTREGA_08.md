# Entregável 08 — Histórico financeiro

## Implementado

- tela somente leitura para consultar as baixas financeiras auditadas;
- acesso restrito a Administrador e Financeiro pelo menu e pela política RLS existente;
- resumo da quantidade de movimentações, valor total e usuários responsáveis;
- filtros por texto, tipo de lançamento e período;
- identificação do status anterior e do novo status;
- exibição de data, forma de pagamento, motivo e usuário responsável;
- exportação do resultado filtrado em CSV;
- índice por data de registro para manter a consulta rápida.

## Implantação controlada

1. aplicar `supabase/migrations/20260724_08_indice_historico_financeiro.sql`;
2. copiar os arquivos da entrega para a branch `feat/historico-financeiro`;
3. validar TypeScript, lint e build;
4. publicar a branch e aguardar a prévia da Vercel;
5. testar os filtros e a exportação CSV como Administrador;
6. confirmar que Representante não visualiza a opção no menu;
7. somente então concluir o merge.
