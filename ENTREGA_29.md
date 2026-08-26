# Entrega 29 — Lembretes e notificações da agenda

## Incluído

- Central de lembretes pendentes dentro da agenda.
- Antecedência configurável por compromisso.
- Repetição até concluir ou cancelar.
- Solicitação de permissão para notificações do celular.
- Notificação persistente pelo PWA e abertura direta da agenda.
- Cálculo e testes das regras de disparo e repetição.

## Observação

As notificações locais dependem de o PWA estar ativo. O envio garantido com o aplicativo totalmente fechado exige uma etapa posterior com Web Push no servidor.

## Banco de dados

Executar `supabase/migrations/20260826_02_agenda_lembretes_notificacoes.sql` antes de testar a prévia.
