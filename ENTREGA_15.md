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
- exclusão de baixas que possuam estorno posterior;
- bloqueio no banco contra novas sugestões de movimentos estornados;
- tolerâncias da regra permitidas apenas para o movimento originalmente sugerido;
- quatro novos testes unitários da estratégia de correspondência.

## Implantação controlada

1. Execute no Supabase SQL Editor:
   `supabase/migrations/20260803_15_aplicacao_regras_conciliacao.sql`.
2. Execute também:
   `supabase/migrations/20260803_15b_excluir_baixas_estornadas.sql`.
3. Confirme `true` nas consultas de verificação das duas migrations.
4. Publique a branch em uma prévia da Vercel.
5. Cadastre uma regra ativa em **Financeiro → Regras de Conciliação**.
6. Importe um CSV compatível em **Financeiro → Conciliação Financeira**.
7. Confira o nome da regra e a confiança antes de confirmar a importação.
8. Aprove individualmente a sugestão e confirme o registro da conciliação.
9. Somente depois conclua o merge.
