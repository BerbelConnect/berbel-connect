# Entregável 11 — Importação de extrato bancário

## Objetivo

Permitir que Administradores e usuários do Financeiro importem extratos CSV,
validem os lançamentos antes da gravação e recebam sugestões de correspondência
com as baixas já auditadas.

## Implementado

- leitura local de CSV com delimitador `;` ou `,`;
- reconhecimento dos campos data, descrição/histórico, valor e referência;
- valores brasileiros e internacionais;
- pré-visualização antes da gravação;
- indicação de linhas inválidas;
- sugestão por valor e proximidade de até três dias;
- hash SHA-256 do arquivo e bloqueio de importação duplicada;
- armazenamento da importação e de seus lançamentos;
- RLS para Administrador e Financeiro;
- conciliação manual existente preservada.

## Implantação controlada

1. Copiar todo o conteúdo deste pacote para a raiz do projeto.
2. No Supabase, abrir **SQL Editor** e executar
   `supabase/migrations/20260726_11_importacao_extrato_bancario.sql`.
3. Conferir a última linha do resultado: duas tabelas, uma função e duas
   políticas devem estar presentes.
4. Publicar a branch em uma prévia da Vercel.
5. Abrir **Financeiro → Conciliação Financeira** e importar
   `EXTRATO_TESTE.csv`.
6. Conferir a prévia, as validações e as sugestões antes de confirmar.
7. Repetir o mesmo arquivo e verificar se o sistema bloqueia a duplicação.
8. Somente depois concluir o merge.

O arquivo de teste possui dados fictícios e pode ser removido depois da
validação.
