# Entregável 13 — Regras de conciliação automática

## Objetivo

Permitir que Administradores e usuários do Financeiro cadastrem regras de sugestão para a conciliação bancária, com prioridade e tolerâncias configuráveis.

As regras apenas melhoram a correspondência sugerida. A aprovação da conciliação continua manual.

## Implementado

- cadastro, edição, ativação e desativação de regras;
- termo opcional para pesquisar na descrição do extrato;
- tipo de movimento: qualquer, conta a pagar ou conta a receber;
- tolerância de valor e de dias;
- prioridade das regras;
- RLS restrita a Administrador e Financeiro;
- RPC para o sistema localizar a regra aplicável de maior prioridade;
- página em `/financeiro/regras-conciliacao`.

## Aplicação

1. Copie o conteúdo deste pacote para a raiz do projeto.
2. No Supabase SQL Editor, execute:
   `supabase/migrations/20260728_13_regras_conciliacao_automatica.sql`
3. Confirme que o resultado final da consulta de verificação apresenta:
   - `tabela = true`;
   - `funcao = true`;
   - `politicas = 1`.
4. Adicione ao menu Financeiro:
   `{ href: "/financeiro/regras-conciliacao", label: "Regras de Conciliação" }`
5. Faça commit, publique a branch e abra uma prévia da Vercel.

## Validação

1. Abra **Financeiro → Regras de Conciliação**.
2. Cadastre uma regra ativa com prioridade `100`.
3. Edite a regra e altere a tolerância.
4. Desative e reative a regra.
5. Confirme que um Representante não consegue acessar ou alterar as regras.

