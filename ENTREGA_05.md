# Entregável 05 — Gestão de carteira por representante

## Objetivo

Tornar visível e administrável, na tela de Clientes, a relação de propriedade
criada pela Entrega 03.

## Implementado

- separação entre o contato do cliente e o Representante responsável;
- seleção do Representante responsável disponível somente ao Administrador;
- atribuição automática quando há apenas um Representante ativo;
- exibição do dono da carteira na listagem de clientes;
- Representante visualiza a própria carteira sem poder transferi-la;
- exclusão de clientes ocultada para Representantes;
- compatibilidade com as políticas RLS e o gatilho de atribuição já implantados.

## Validação controlada

1. Administrador visualiza a coluna `Representante` nos 63 clientes;
2. Administrador consegue editar um cliente mantendo o mesmo Representante;
3. Representante visualiza somente a própria carteira;
4. Representante não visualiza seletor de transferência nem botão de exclusão;
5. criação de cliente pelo Representante atribui automaticamente a própria carteira.
