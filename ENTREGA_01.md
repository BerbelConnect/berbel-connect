# Entregável 01 — Pedido → Financeiro transacional

## Implementado

- interpretação de condições como `À vista`, `28 DDL` e `30/45/60 dias`;
- divisão do total em centavos, com ajuste da diferença na última parcela;
- cálculo de vencimentos sem depender do fuso horário do dispositivo;
- prévia das parcelas na tela antes de salvar o pedido;
- criação de uma conta a receber por parcela, com número, total e prazo;
- aviso e fallback compatível para `A combinar` ou condição não reconhecida;
- 11 testes unitários para as regras financeiras;
- diagnóstico SQL somente leitura para levantar schema, constraints, índices e RLS;
- RPC `criar_pedido_completo` que grava pedido, itens, parcelas, contas a pagar
  ou comissão em uma única transação;
- numeração sequencial gerada exclusivamente no banco;
- chave de idempotência para impedir pedidos duplicados em reenvios;
- índices únicos e índices de consulta para o fluxo de pedidos;
- migration separada para retirar o acesso anônimo às tabelas operacionais.

## Validações executadas

- `npm test`: 11 testes aprovados;
- `npx tsc --noEmit`: aprovado;
- lint dos arquivos financeiros novos: aprovado;
- `npm run build`: aprovado usando variáveis públicas fictícias apenas para validar a compilação.

## Arquivos para aplicação controlada

- `supabase/migrations/20260718_01_pedido_financeiro_atomico.sql`: estrutura,
  índices e função transacional. Para sem alterações se detectar números
  duplicados.
- `supabase/migrations/20260718_02_restringe_rls_autenticado.sql`: políticas
  para usuários autenticados. Para sem alterações se não existir um perfil
  Administrador ativo.

As migrations devem ser aplicadas nessa ordem e separadamente. A aplicação no
Supabase não faz parte deste checkpoint local e requer confirmação explícita.

## Débitos anteriores identificados

- o lint completo do projeto já possui 170 erros e 7 avisos anteriores a esta branch;
- sem `.env.local`, o build precisa receber valores de teste para as variáveis públicas do Supabase;
- o lint completo do projeto ainda precisa de uma etapa própria de saneamento;
- a exclusão de pedidos continua sendo um fluxo separado e deve receber uma
  função transacional antes de ser liberada a perfis não administrativos.

## Próxima execução no Supabase, após aprovação

1. Fazer backup do banco ou confirmar um ponto de restauração.
2. Executar `20260718_01_pedido_financeiro_atomico.sql`.
3. Testar a criação de um pedido em ambiente controlado.
4. Confirmar o Administrador ativo e executar
   `20260718_02_restringe_rls_autenticado.sql`.
5. Validar login, criação, consulta e exclusão com um usuário autenticado.
