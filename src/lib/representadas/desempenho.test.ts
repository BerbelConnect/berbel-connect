import { describe, expect, it } from "vitest";
import { calcularDesempenhoRepresentadas, intervaloPeriodo, type ComissaoRepresentada } from "./desempenho";

const hoje = new Date("2026-08-10T12:00:00Z");
const base: ComissaoRepresentada[] = [
  { id: "1", pedido_id: "p1", created_at: "2026-08-02", empresa: "Fibrart", valor_base: 1000, valor_comissao: 30, status: "Pendente", cliente: "A" },
  { id: "2", pedido_id: "p2", created_at: "2026-08-05", empresa: "Fibrart", valor_base: 2000, valor_comissao: 60, status: "Recebida", cliente: "B" },
  { id: "3", pedido_id: "p3", created_at: "2026-07-20", empresa: "R&E", valor_base: 500, valor_comissao: 20, status: "Pendente", cliente: "C" },
];

describe("desempenho das representadas", () => {
  it("filtra o período e separa recebida de pendente", () => {
    const resultado = calcularDesempenhoRepresentadas(base, "2026-08-01", "2026-08-10", hoje).representadas[0];
    expect(resultado.nome).toBe("Fibrart"); expect(resultado.pedidos).toBe(2);
    expect(resultado.vendas).toBe(3000); expect(resultado.recebida).toBe(60); expect(resultado.pendente).toBe(30);
  });
  it("projeta a comissão pelo ritmo do mês", () => {
    const resultado = calcularDesempenhoRepresentadas(base, "2026-08-01", "2026-08-10", hoje).representadas[0];
    expect(resultado.projecao).toBeCloseTo(279, 2);
  });
  it("calcula os intervalos predefinidos", () => {
    expect(intervaloPeriodo("mes", "", "", hoje)).toEqual({ inicio: "2026-08-01", fim: "2026-08-10" });
    expect(intervaloPeriodo("30d", "", "", hoje).inicio).toBe("2026-07-12");
  });
});
