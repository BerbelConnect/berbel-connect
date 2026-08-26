# Entrega 30 — Transferência automática de pendências

## Incluído

- Compromissos não resolvidos de dias anteriores avançam automaticamente para o dia atual.
- Data originalmente agendada preservada.
- Contagem de dias transferidos e data da última transferência.
- Operação idempotente, sem duplicar compromissos ou transferências.
- Identificação visual no cartão e permanência na central Precisa de atenção.
- Atualização local ao abrir a agenda offline e confirmação no banco ao reconectar.

## Banco de dados

Executar `supabase/migrations/20260826_03_agenda_transferencia_pendencias.sql` antes de testar a prévia.
