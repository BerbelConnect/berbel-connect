# Entregável 18 — Metas comerciais e desempenho

## Objetivo

Transformar a tela de metas em um acompanhamento real de vendas e comissões, considerando o período e os segmentos definidos em cada objetivo.

## Implementado

- metas mensais e anuais de vendas ou comissões;
- segmentação opcional por cliente e representada;
- cálculo restrito ao mês/ano de cada meta;
- realizado, percentual, valor restante e ritmo esperado;
- situações automáticas: futura, no ritmo, atenção, atrasada e atingida;
- indicadores consolidados de metas;
- edição e exclusão preservadas;
- migração idempotente com colunas, índices e políticas de acesso;
- testes unitários dos cálculos por período e cliente.

## Implantação

1. Execute `supabase/migrations/20260803_18_metas_comerciais.sql` no SQL Editor.
2. Confirme `true` nas três colunas da consulta final.
3. Publique a branch em uma prévia da Vercel.
4. Cadastre uma meta mensal de vendas e outra de comissões.
5. Valide os segmentos por cliente e representada antes do merge.
