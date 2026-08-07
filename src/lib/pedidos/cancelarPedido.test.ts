import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }));

import { cancelarPedido } from "./cancelarPedido";

describe("cancelamento auditável de pedido", () => {
  beforeEach(() => rpc.mockReset());

  it("envia pedido e motivo para a operação atômica", async () => {
    rpc.mockResolvedValue({
      data: {
        pedido_id: "pedido-1",
        numero: "PED-1",
        status: "Cancelado",
        contas_receber_canceladas: 2,
        contas_pagar_canceladas: 1,
        comissoes_canceladas: 0,
        reutilizado: false,
      },
      error: null,
    });

    await expect(cancelarPedido("pedido-1", "Cliente desistiu")).resolves.toMatchObject({
      status: "Cancelado",
      contas_receber_canceladas: 2,
      contas_pagar_canceladas: 1,
      reutilizado: false,
    });
    expect(rpc).toHaveBeenCalledWith("cancelar_pedido", {
      p_pedido_id: "pedido-1",
      p_motivo: "Cliente desistiu",
    });
  });

  it("trata novo cancelamento como repetição segura", async () => {
    rpc.mockResolvedValue({
      data: { pedido_id: "pedido-1", numero: "PED-1", status: "Cancelado", reutilizado: true },
      error: null,
    });

    await expect(cancelarPedido("pedido-1", "Cliente desistiu")).resolves.toMatchObject({
      reutilizado: true,
    });
  });

  it("mantém o bloqueio do banco quando já houve pagamento", async () => {
    const erro = new Error("O pedido possui pagamento confirmado e não pode ser cancelado automaticamente.");
    rpc.mockResolvedValue({ data: null, error: erro });

    await expect(cancelarPedido("pedido-1", "Cliente desistiu")).rejects.toBe(erro);
  });

  it("recusa resposta vazia para não informar cancelamento sem confirmação", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(cancelarPedido("pedido-1", "Cliente desistiu")).rejects.toThrow(
      "não retornou o resumo do cancelamento"
    );
  });
});
