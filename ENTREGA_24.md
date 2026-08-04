# Entregável 24 — Agenda automática de cobranças e promessas

## Implementado

- agenda automática com promessas próximas, de hoje e atrasadas;
- inclusão de cobranças vencidas ainda sem contato;
- mensagens profissionais prontas para copiar e revisar no WhatsApp;
- nenhum envio automático ou abertura externa sem ação do usuário;
- integração das promessas à Central de Alertas;
- gravidade crítica para promessas atrasadas e alta para vencimento próximo;
- navegação dos alertas diretamente para a Cobrança de Recebimentos;
- testes unitários da agenda, mensagens e alertas de promessa.

## Validação

1. Abra **Cobrança de Recebimentos** na prévia.
2. Confira a seção **Agenda automática**.
3. Clique em **Copiar mensagem** e confirme o aviso; não envie o texto.
4. Abra a **Central de Alertas** e filtre por **Comissões**.
5. As promessas reais registradas aparecerão quando estiverem a até sete dias do vencimento.
6. Valide a prévia da Vercel antes do merge.
