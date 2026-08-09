import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }));

import { baixarMovimento } from "./baixarMovimento";

describe("baixas financeiras auditáveis", () => {
  beforeEach(() => rpc.mockReset());

  it.each([
    ["conta_receber", "baixar_conta_receber"],
    ["conta_pagar", "baixar_conta_pagar"],
    ["comissao", "baixar_comissao"],
  ] as const)("encaminha %s para a operação correta", async (tipo, funcao) => {
    rpc.mockResolvedValue({ data: { status: "confirmado" }, error: null });

    await expect(
      baixarMovimento({
        tipo,
        id: "movimento-1",
        data: "2026-08-07",
        formaPagamento: "  PIX  ",
        motivo: "  Pagamento confirmado  ",
      })
    ).resolves.toEqual({ status: "confirmado" });

    expect(rpc).toHaveBeenCalledWith(funcao, {
      p_id: "movimento-1",
      p_data: "2026-08-07",
      p_forma_pagamento: "PIX",
      p_motivo: "Pagamento confirmado",
    });
  });

  it("envia forma de pagamento vazia como nula", async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    await baixarMovimento({
      tipo: "conta_receber",
      id: "receber-1",
      data: "2026-08-07",
      formaPagamento: "   ",
      motivo: "Recebimento confirmado",
    });

    expect(rpc).toHaveBeenCalledWith(
      "baixar_conta_receber",
      expect.objectContaining({ p_forma_pagamento: null })
    );
  });

  it("exige motivo e não chama o banco quando ele está vazio", async () => {
    await expect(
      baixarMovimento({
        tipo: "conta_pagar",
        id: "pagar-1",
        data: "2026-08-07",
        motivo: "   ",
      })
    ).rejects.toThrow("Informe o motivo da baixa.");

    expect(rpc).not.toHaveBeenCalled();
  });

  it("preserva o bloqueio do banco contra baixa duplicada", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Este movimento já possui baixa confirmada." },
    });

    await expect(
      baixarMovimento({
        tipo: "conta_receber",
        id: "receber-1",
        data: "2026-08-07",
        motivo: "Recebimento confirmado",
      })
    ).rejects.toThrow("Este movimento já possui baixa confirmada.");
  });
});

