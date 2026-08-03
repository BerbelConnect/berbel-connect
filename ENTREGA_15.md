# Entregável 15 — Aplicação das regras na conciliação assistida

## Objetivo

Usar as regras cadastradas na Entrega 13 para melhorar as sugestões apresentadas
durante a importação e a revisão do extrato bancário, mantendo a aprovação final
sempre manual.

## Implementado

- aplicação por descrição, tipo de movimento, tolerância de valor e dias;
- respeito à prioridade das regras ativas;
- fallback preservado para valor exato e diferença de até três dias;
- identificação da regra aplicada na prévia e na revisão;
- percentual de confiança da sugestão;
- gravação da regra, critério e confiança para auditoria;
- revalidação no banco durante a importação e a aprovação;
- tolerâncias da regra permitidas apenas para o movimento originalmente sugerido;
- quatro novos testes unitários da estratégia de correspondência.

## Implantação controlada

1. Execute no Supabase SQL Editor:
   `supabase/migrations/20260803_15_aplicacao_regras_conciliacao.sql`.
2. Confirme `true` nas quatro colunas da consulta de verificação.
3. Publique a branch em uma prévia da Vercel.
4. Cadastre uma regra ativa em **Financeiro → Regras de Conciliação**.
5. Importe um CSV compatível em **Financeiro → Conciliação Financeira**.
6. Confira o nome da regra e a confiança antes de confirmar a importação.
7. Aprove individualmente a sugestão e confirme o registro da conciliação.
8. Somente depois conclua o merge.
