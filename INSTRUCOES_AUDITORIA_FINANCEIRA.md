# Auditoria financeira — aplicação

## 1. Copiar os arquivos

Com o GitHub Desktop na branch `feat/auditoria-financeira`, copie todo o conteúdo do pacote para a raiz do projeto e confirme a substituição dos arquivos existentes. O pacote mantém a mesma estrutura de pastas do projeto.

## 2. Aplicar a migration no Supabase

1. Abra o projeto no painel do Supabase.
2. Entre em **SQL Editor** e crie uma consulta nova.
3. Abra `supabase/migrations/20260816_28_auditoria_financeira_pedidos.sql`.
4. Copie o conteúdo completo, cole no SQL Editor e clique em **Run** uma única vez.
5. Confirme que a execução terminou sem erro. A migration é transacional: se ocorrer falha, nenhuma alteração parcial é mantida.

## 3. Validar

Execute na pasta do projeto:

```powershell
npm install
npm test
npm run lint
npm run build
```

Depois acesse com um usuário de perfil **Administrador**:

- **Auditoria Administrativa**: registre uma conciliação de teste e confira o histórico.
- **Consulta de Pedidos**: edite itens de um pedido ainda não liquidado e confirme totais, comissão, contas a receber e contas a pagar.
- Cancele um pedido sem baixas e confirme que surge a opção **Excluir definitivamente**.
- Após a exclusão, confira a cópia completa no histórico da auditoria.

## Regras de segurança implementadas

- A área e as funções são exclusivas do Administrador, tanto na interface quanto no banco.
- Motivo, usuário, e-mail, data/hora e valores antes/depois são obrigatoriamente registrados.
- Ajustes financeiros são novos lançamentos; o histórico anterior não é alterado.
- Pedidos só podem ser excluídos quando estiverem cancelados.
- Pedidos com recebimento, pagamento ou comissão já liquidada precisam ser estornados antes da edição.
- A edição do pedido e de todos os reflexos financeiros ocorre na mesma transação do PostgreSQL.
