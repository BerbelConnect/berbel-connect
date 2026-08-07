import { describe, expect, it } from "vitest";
import {
  movimentoCancelado,
  movimentoPendente,
  situacaoContaReceber,
} from "./statusMovimento";

describe("situação de movimentos financeiros", () => {
  it("prioriza cancelamento sobre a data de vencimento", () => {
    expect(
      situacaoContaReceber(
        { status: "Cancelado", vencimento: "2026-09-05" },
        "2026-08-07"
      )
    ).toBe("Cancelado");
  });

  it("reconhece status sem depender de maiúsculas ou acentos", () => {
    expect(movimentoCancelado({ status: " CANCELADO " })).toBe(true);
    expect(movimentoPendente({ status: "Pendente" })).toBe(true);
  });

  it("mantém as situações operacionais das contas ativas", () => {
    expect(
      situacaoContaReceber(
        { status: "Pendente", vencimento: "2026-08-06" },
        "2026-08-07"
      )
    ).toBe("Vencido");
    expect(
      situacaoContaReceber(
        { status: "Recebido", vencimento: "2026-08-06" },
        "2026-08-07"
      )
    ).toBe("Recebido");
  });
});
