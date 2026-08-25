# Entrega 26 — Agenda de campo offline

## Incluído

- Visita para cliente cadastrado ou contato avulso.
- Nome, empresa, telefone e endereço para contatos ainda não cadastrados.
- Botão para iniciar a visita e registrar o horário real.
- Rascunho local das anotações durante o atendimento.
- Cache local da agenda e dos clientes para consulta sem internet.
- Fila offline para criar, iniciar e concluir visitas.
- Indicador e sincronização junto ao aviso offline geral.
- Agenda e Visitas adicionadas ao cache do PWA.

## Banco de dados

Executar no Supabase, antes de publicar o código:

`supabase/migrations/20260823_01_agenda_campo_offline.sql`

## Próxima etapa

- Fotos offline usando IndexedDB e Supabase Storage.
- Checklist por visita.
- Central "Precisa de atenção" e transferência diária preservando o prazo original.
- Notificações persistentes no celular.

## Validação

O ambiente desta entrega não conseguiu instalar as dependências do npm, portanto os comandos `npm test`, `npm run lint` e `npm run build` devem ser executados localmente antes do merge.
