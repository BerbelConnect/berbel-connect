# Entregável 06 — Convite seguro de Representantes

## Implementado

- criação coordenada da conta de autenticação e do perfil comercial;
- função protegida que valida o Administrador autenticado;
- convite por e-mail para o Representante criar a própria senha;
- perfil criado com o mesmo identificador da conta de autenticação;
- reversão da conta se a criação do perfil falhar;
- bloqueio de e-mails duplicados;
- e-mail de login imutável na edição comum;
- desativação do perfil no lugar da exclusão insegura.

## Implantação

1. publicar a função `convidar-representante` no Supabase;
2. publicar a interface em uma prévia da Vercel;
3. validar a tela como Administrador sem enviar um convite real;
4. após o merge, convidar um e-mail de teste controlado;
5. validar criação da senha, login e carteira vazia do novo Representante.

## Observação sobre e-mail

O provedor padrão do Supabase possui limite reduzido. Para operação com vários
usuários, configurar SMTP próprio antes dos convites reais.
