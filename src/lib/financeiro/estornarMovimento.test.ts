import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }));

import { estornarMovimento } from "./estornarMovimento";

describe("estornos financeiros auditáveis", () => {
  beforeEach(() => rpc.mockReset());

  it.each([
    ["conta_receber", "estornar_conta_receber"],
    ["conta_pagar", "estornar_conta_pagar"],
    ["comissao", "estornar_comissao"],
  ] as const)("encaminha %s para a operação correta", async (tipo, funcao) => {
    rpc.mockResolvedValue({ data: { status: "estornado" }, error: null });

    await expect(
      estornarMovimento({
        tipo,
        id: "movimento-1",
        motivo: "  Lançamento informado incorretamente  ",
      })
    ).resolves.toEqual({ status: "estornado" });

    expect(rpc).toHaveBeenCalledWith(funcao, {
      p_id: "movimento-1",
      p_motivo: "Lançamento informado incorretamente",
    });
  });

  it.each(["", " ", "ab", " a "])(
    "recusa motivo insuficiente (%j) sem chamar o banco",
    async (motivo) => {
      await expect(
        estornarMovimento({
          tipo: "conta_pagar",
          id: "pagar-1",
          motivo,
        })
      ).rejects.toThrow("Informe o motivo do estorno com pelo menos 3 caracteres.");

      expect(rpc).not.toHaveBeenCalled();
    }
  );

  it("preserva o bloqueio do banco contra estorno duplicado", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Este movimento já foi estornado." },
    });

    await expect(
      estornarMovimento({
        tipo: "conta_pagar",
        id: "pagar-1",
        motivo: "Pagamento lançado incorretamente",
      })
    ).rejects.toThrow("Este movimento já foi estornado.");
  });
});

