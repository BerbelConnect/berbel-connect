# Entregável 19 — Central de alertas inteligentes

## Implementado

- alertas priorizados por gravidade;
- integração com metas, clientes, agenda, contas a receber e pagar, comissões e pipeline;
- regras de prazo para evitar alertas financeiros prematuros;
- filtros por categoria, gravidade e texto;
- navegação direta para a origem;
- marcação persistente como resolvido por usuário;
- possibilidade de reabrir alertas;
- indicadores de ativos, críticos, alta prioridade e resolvidos;
- testes unitários das regras de datas e prioridades.

## Implantação

1. Execute `supabase/migrations/20260803_19_alertas_resolvidos.sql`.
2. Confirme `true` nas duas colunas finais.
3. Na prévia, abra **Central de Alertas**.
4. Teste filtros, **Ver origem**, **Marcar resolvido** e **Reabrir**.
