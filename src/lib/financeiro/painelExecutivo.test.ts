import { describe, expect, it } from "vitest";
import { calcularResumoPainelExecutivo, ordenarPrioridades } from "./painelExecutivo";

describe("painel executivo financeiro", () => {
  it("consolida pendências, vencidos e saldo previsto", () => {
    const resumo = calcularResumoPainelExecutivo(
      [{ id: "r1", valor: 1000, vencimento: "2026-08-01", status: "Pendente" }, { id: "r2", valor: 200, status: "Recebido" }],
      [{ id: "p1", valor: 300, vencimento: "2026-08-10", status: "Pendente" }],
      [{ id: "c1", valor: 50, previsao: "2026-08-02", status: "Pendente" }],
      [{ id: "x", promessaData: "2026-08-08", resultado: "Promessa de pagamento" }],
      "2026-08-04"
    );
    expect(resumo).toMatchObject({ receberPendente: 1000, receberVencido: 1000, pagarPendente: 300, saldoPrevisto: 700, comissaoVencida: 50, promessasProximas: 1 });
  });

  it("prioriza a comissão mais antiga", () => {
    const itens = ordenarPrioridades([
      { id: "2", valor: 20, previsao: "2026-08-06", status: "Pendente" },
      { id: "1", valor: 10, previsao: "2026-08-01", status: "Pendente" },
    ], "2026-08-04");
    expect(itens[0]).toMatchObject({ id: "1", vencida: true });
  });
});
