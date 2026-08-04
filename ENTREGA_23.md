# Entregável 23 — Cobrança e acompanhamento de recebimentos

## Implementado

- central de cobranças baseada nas comissões pendentes e vencidas;
- priorização automática por prazo e valor;
- filtros por representada, prioridade, situação e pesquisa;
- registro de contatos por WhatsApp, telefone, e-mail, visita ou outro canal;
- resultados de contato e promessas de pagamento com data e valor;
- histórico persistente por comissão e usuário responsável;
- indicadores de pendências, vencidos, itens sem contato e promessas abertas;
- ligação direta com o fechamento de comissões, sem realizar baixa financeira;
- testes unitários das regras de atraso e prioridade.

## Implantação

1. Execute `supabase/migrations/20260804_23_cobranca_recebimentos.sql` no SQL Editor.
2. Confirme `true` nas duas colunas da consulta final.
3. Publique a branch e abra a prévia da Vercel.
4. Acesse **Cobrança de Recebimentos**.
5. Abra o histórico de uma comissão e registre um contato somente se ele realmente ocorreu.
6. Valide os filtros e indicadores antes do merge.
