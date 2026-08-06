import { describe, expect, it } from "vitest";
import { aguardaPagamentoCliente, descricaoRegraComissao, regraDaEmpresa } from "./regras";

describe("regras de comissão por representada", () => {
  it("considera a venda para R&E", () => {
    expect(regraDaEmpresa("R&E")).toBe("venda");
    expect(descricaoRegraComissao("R & E")).toContain("15");
  });

  it("aguarda o pagamento do cliente para Solução e Fibrart", () => {
    expect(aguardaPagamentoCliente("Solução", null)).toBe(true);
    expect(aguardaPagamentoCliente("Fibrart", null)).toBe(true);
    expect(aguardaPagamentoCliente("Fibrart", "2026-08-05")).toBe(false);
  });
});
