# Entrega 28 — Fotos offline na agenda

## Incluído

- Captura ou seleção de várias fotos durante o atendimento.
- Redução automática das imagens para economizar dados e espaço.
- Pré-visualização e remoção antes ou depois da sincronização.
- Armazenamento offline em IndexedDB.
- Envio posterior pelo aviso geral de sincronização.
- Bucket privado e links temporários para visualização.
- Fotos vinculadas à visita e excluídas junto com ela.

## Banco de dados

Executar antes de testar a prévia:

`supabase/migrations/20260826_01_agenda_fotos_offline.sql`

## Validação

- `npm test`
- `npx tsc --noEmit`
- `npm run build`
