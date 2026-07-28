# Entregável 12 — Conciliação assistida do extrato

## Implementado

- lista persistente das sugestões importadas e ainda não revisadas;
- aprovação individual e controlada de cada correspondência;
- validação no banco de valor, data, permissão e duplicidade;
- conciliação e vínculo com o lançamento bancário em uma única transação;
- identificação do usuário que aprovou e registro da data da revisão;
- conciliação manual existente preservada.

## Implantação controlada

1. Copiar o conteúdo deste pacote para a raiz do projeto.
2. No Supabase, executar `supabase/migrations/20260726_12_conciliacao_assistida_extrato.sql`.
3. Confirmar que o resultado final mostra `true` para coluna e função.
4. Publicar a branch e abrir uma prévia da Vercel.
5. Em **Financeiro → Conciliação Financeira**, aprovar uma sugestão importada.
6. Somente após validar, concluir o merge.
