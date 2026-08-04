import { describe, expect, it } from "vitest";
import { mensagemCobranca, montarAgendaCobrancas } from "./agenda";

describe("agenda de cobranças", () => {
  const item = { id: "c1", pedido_id: null, created_at: "2026-07-01", empresa: "R&E", cliente: "Cliente A", pedido: "10", pedido_status: "Pedido", percentual: 4, valor_base: 1000, valor_comissao: 40, previsao: "2026-08-01", recebimento: null, status: "Pendente", valor: 40, diasAtraso: 3, prioridade: "Média" as const, ultimoContato: null };

  it("inclui promessa próxima e cobrança vencida sem contato", () => {
    const registros = [{ id: "r1", comissao_id: "c1", contato_em: "2026-08-03", canal: "WhatsApp", resultado: "Promessa de pagamento", promessa_data: "2026-08-05", promessa_valor: 40, observacoes: "Confirmado" }];
    const agenda = montarAgendaCobrancas([item], registros, "2026-08-04");
    expect(agenda.map((x) => x.tipo)).toContain("Promessa");
    expect(agenda.map((x) => x.tipo)).toContain("Cobrança");
  });

  it("gera texto sem envio automático", () => {
    expect(mensagemCobranca("Fibrart", 126.36, "2026-08-10")).toContain("R$ 126,36");
    expect(mensagemCobranca("Fibrart", 126.36, "2026-08-10")).toContain("Poderia verificar");
  });
});
