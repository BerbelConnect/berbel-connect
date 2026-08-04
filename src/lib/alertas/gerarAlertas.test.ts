import { describe, expect, it } from "vitest";
import { diferencaDias, gerarAlertasInteligentes } from "./gerarAlertas";

const vazias = { clientesSemCompra: [], clientesSemVisita: [], visitasHoje: [], contasReceber: [], contasPagar: [], comissoes: [], pipeline: [], metas: [] };

describe("alertas inteligentes", () => {
  it("calcula dias sem sofrer variação de horário", () => {
    expect(diferencaDias("2026-08-01", new Date(2026, 7, 3))).toBe(-2);
  });

  it("gera alerta crítico para promessa de pagamento atrasada", () => {
    const alertas = gerarAlertasInteligentes({ ...vazias, cobrancas: [
      { id: "c1", titulo: "R&E", valor: 200, data: "2026-08-01" },
    ] }, new Date(2026, 7, 4));
    expect(alertas[0].titulo).toContain("atrasada");
    expect(alertas[0].gravidade).toBe("Crítico");
    expect(alertas[0].href).toBe("/financeiro/cobrancas");
  });

  it("prioriza conta vencida como crítica e ignora conta distante", () => {
    const alertas = gerarAlertasInteligentes({ ...vazias, contasReceber: [
      { id: "1", data: "2026-08-01", valor: 500, cliente: "Cliente A" },
      { id: "2", data: "2026-09-01", valor: 900, cliente: "Cliente B" },
    ] }, new Date(2026, 7, 3));
    expect(alertas).toHaveLength(1);
    expect(alertas[0].gravidade).toBe("Crítico");
  });

  it("gera alerta para meta atrasada e oportunidade sem contato", () => {
    const alertas = gerarAlertasInteligentes({ ...vazias,
      metas: [{ id: "m1", titulo: "Meta agosto", situacao: "Atrasada" }],
      pipeline: [{ id: "p1", titulo: "Nova coleção", data: null }],
    }, new Date(2026, 7, 3));
    expect(alertas.map((item) => item.categoria)).toEqual(["Metas", "Pipeline"]);
  });
});
