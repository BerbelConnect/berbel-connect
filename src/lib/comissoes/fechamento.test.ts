import { describe, expect, it } from "vitest";
import { calcularFechamento, dataComissaoBrasil, intervaloFechamento, situacaoComissao, type ComissaoFechamento } from "./fechamento";
const item = (parcial: Partial<ComissaoFechamento>): ComissaoFechamento => ({ id: "1", pedido_id: "p1", created_at: "2026-08-02", empresa: "Fibrart", cliente: "A", pedido: "1", pedido_status: "Pedido", percentual: 3, valor_base: 1000, valor_comissao: 30, previsao: "2026-08-05", recebimento: null, status: "Pendente", ...parcial });
describe("fechamento de comissões", () => {
  it("classifica recebidas, vencidas e pendentes", () => { expect(situacaoComissao(item({ status: "Recebida" }), "2026-08-10")).toBe("Recebida"); expect(situacaoComissao(item({}), "2026-08-10")).toBe("Vencida"); expect(situacaoComissao(item({ previsao: "2026-08-15" }), "2026-08-10")).toBe("Pendente"); });
  it("aguarda pagamento do cliente na Solução e Fibrart", () => { expect(situacaoComissao(item({ empresa: "Solução", previsao: null }), "2026-08-10")).toBe("Aguardando cliente"); expect(situacaoComissao(item({ empresa: "Fibrart", previsao: null }), "2026-08-10")).toBe("Aguardando cliente"); });
  it("consolida valores por representada", () => { const resultado = calcularFechamento([item({}), item({ id: "2", valor_base: 2000, valor_comissao: 60, status: "Recebida" })], "2026-08-01", "2026-08-31", "2026-08-10"); expect(resultado.resumo).toEqual({ previsto: 90, recebido: 60, pendente: 30, vencido: 30 }); expect(resultado.porEmpresa[0].valorBase).toBe(3000); });
  it("calcula período mensal", () => { expect(intervaloFechamento("mes", "", "", new Date("2026-08-10T12:00:00Z"))).toEqual({ inicio: "2026-08-01", fim: "2026-08-10" }); });
  it("converte a criação UTC para a data operacional do Brasil", () => {
    expect(dataComissaoBrasil("2026-08-07T01:06:00.000Z")).toBe("2026-08-06");
    expect(dataComissaoBrasil("2026-08-06")).toBe("2026-08-06");
  });
  it("remove comissões canceladas do fechamento", () => {
    const resultado = calcularFechamento(
      [item({ status: "Cancelado" }), item({ id: "2", status: "Cancelada" })],
      "2026-08-01",
      "2026-08-31",
      "2026-08-10"
    );
    expect(resultado.registros).toEqual([]);
    expect(resultado.resumo.previsto).toBe(0);
  });
});
