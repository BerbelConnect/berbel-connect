# Entregável 17 — Relatórios detalhados e PDF

## Objetivo

Transformar a Central de Relatórios Comerciais em um documento completo de conferência, preservando a visão executiva e exibindo os registros que formam cada total.

## Implementado

- tabelas detalhadas de pedidos e comissões conforme os filtros ativos;
- contagem de registros e áreas com rolagem para volumes maiores;
- exportação profissional em PDF, com filtros, totais, rankings e memórias detalhadas;
- paginação e identificação do Berbel Connect no PDF;
- exportação Excel ampliada com abas de pedidos e comissões detalhados;
- manutenção da impressão pelo navegador;
- dependência `jspdf` declarada diretamente no projeto.

## Validação

1. Abra **Relatórios Comerciais**.
2. Selecione período, cliente e/ou representada.
3. Confira se as tabelas detalhadas correspondem aos indicadores.
4. Exporte o Excel e valide as seis abas.
5. Exporte o PDF e confira resumo, rankings, pedidos e comissões.
6. Teste um intervalo sem vendas: totais e tabelas devem ficar vazios.
7. Valide a prévia da Vercel antes do merge.
