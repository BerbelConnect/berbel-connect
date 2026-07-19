# Entregável 03 — Permissões por responsável

## Modelo adotado

- Administrador vê e mantém todos os registros;
- Representante vê e altera somente seus clientes e pedidos;
- itens e lançamentos financeiros seguem o responsável do pedido;
- Representante pode consultar produtos e fornecedores, sem mantê-los;
- baixas e alterações financeiras permanecem exclusivas do Administrador;
- exclusões permanecem exclusivas do Administrador.
- a interface de pedidos oculta o cancelamento para o Representante.

## Migração dos dados existentes

O cenário validado possui um Administrador e um Representante ativos. Por
decisão do responsável pelo projeto, todos os clientes e pedidos existentes são
atribuídos ao único Representante. A migration aborta integralmente se houver
quantidade diferente de um Representante ativo.

## Implantação

1. aplicar `20260719_04_permissoes_por_responsavel.sql`;
2. validar as contagens de atribuição como Administrador;
3. testar login do Representante em clientes, pedidos e financeiro;
4. testar criação de cliente e pedido pelo Representante;
5. publicar somente após os testes dos dois perfis.
