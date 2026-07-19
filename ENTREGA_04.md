# Entregável 04 — Recuperação de senha

## Implementado

- link `Esqueci minha senha` na tela de login;
- solicitação de recuperação pelo e-mail cadastrado no Supabase;
- resposta neutra que não revela se uma conta existe;
- página pública para criação da nova senha;
- validação de no mínimo 8 caracteres e confirmação da senha;
- tratamento de links inválidos ou expirados;
- encerramento da sessão de recuperação antes do novo login.

## Configuração necessária

Em **Supabase → Authentication → URL Configuration**:

- `Site URL`: `https://berbel-connect.vercel.app`;
- `Redirect URLs`: incluir `https://berbel-connect.vercel.app/**`.

Essa configuração já foi ajustada durante a validação da Entrega 03.

## Validação controlada

1. abrir `/login` e clicar em `Esqueci minha senha`;
2. informar o e-mail da conta Representante;
3. abrir somente o link do e-mail mais recente;
4. cadastrar e confirmar uma nova senha com 8 ou mais caracteres;
5. confirmar o retorno ao login;
6. entrar com a nova senha e validar o perfil Representante.
