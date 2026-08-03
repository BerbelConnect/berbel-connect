# Entregável 20 — Previsão comercial e comissões

## Implementado

- realizado de vendas e comissões no mês;
- projeção pelo ritmo diário;
- cenários conservador, provável e otimista;
- pipeline ponderado pela probabilidade;
- comparação do ritmo com o mês anterior;
- projeção de comissão;
- esforço diário para atingir metas;
- projeção de comissões por representada;
- nova opção **Previsão Comercial** no menu;
- testes unitários dos cenários e tendências.

## Validação

1. Execute `supabase/migrations/20260803_20_identificar_representada_comissoes.sql` no SQL Editor.
2. Confirme os resultados da consulta de verificação ao final do arquivo.
3. Abra **Previsão Comercial** na prévia.
4. Compare o realizado com os Relatórios Comerciais.
5. Confira as metas e o valor necessário por dia.
6. Valide o pipeline ponderado e os três cenários.
7. Confira se a tabela separa as comissões por representada.
