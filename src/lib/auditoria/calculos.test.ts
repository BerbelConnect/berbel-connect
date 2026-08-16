import { describe, expect, it } from "vitest";
import { calcularTotaisItens, motivoValido } from "./calculos";

describe("cálculos auditáveis de pedidos", () => {
  it("recalcula venda, custo, comissão e lucro pelos itens", () => {
    expect(calcularTotaisItens([
      { quantidade: 2, valor_unitario: 100, valor_custo_unitario: 60, comissao_percentual: 5 },
      { quantidade: 1, valor_unitario: 50, valor_custo_unitario: 20, comissao_percentual: 10 },
    ])).toEqual({ valorTotal: 250, valorCustoTotal: 140, valorComissao: 15, lucroTotal: 110 });
  });

  it("exige motivo significativo", () => {
    expect(motivoValido("erro", 5)).toBe(false);
    expect(motivoValido("Correção conferida no banco", 5)).toBe(true);
  });
});
