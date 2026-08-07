import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }));

import { criarPedidoCompleto, type CriarPedidoCompletoInput } from "./criarPedidoCompleto";

const input: CriarPedidoCompletoInput = {
  idempotencyKey: "tentativa-123",
  pedido: {
    cliente_id: "cliente-1",
    data_pedido: "2026-08-06",
    data_entrega_prevista: null,
    data_entrega_real: null,
    tipo: "Revenda",
    status: "Pedido",
    condicao_pagamento: "30 dias",
    observacoes: "",
    valor_total: 100,
    valor_comissao: 0,
    valor_custo_total: 60,
    lucro_total: 40,
  },
  itens: [],
  contasReceber: [],
  contasPagar: [],
};

describe("criação atômica de pedido", () => {
  beforeEach(() => rpc.mockReset());

  it("envia a mesma chave de idempotência e todos os movimentos em uma RPC", async () => {
    rpc.mockResolvedValue({
      data: { pedido_id: "pedido-1", numero: "PED-1", reutilizado: false },
      error: null,
    });

    await criarPedidoCompleto(input);

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("criar_pedido_completo", {
      p_idempotency_key: "tentativa-123",
      p_pedido: input.pedido,
      p_itens: input.itens,
      p_contas_receber: input.contasReceber,
      p_contas_pagar: input.contasPagar,
    });
  });

  it("aceita o resumo reutilizado devolvido em uma repetição segura", async () => {
    rpc.mockResolvedValue({
      data: { pedido_id: "pedido-1", numero: "PED-1", reutilizado: true },
      error: null,
    });

    await expect(criarPedidoCompleto(input)).resolves.toMatchObject({
      pedido_id: "pedido-1",
      reutilizado: true,
    });
  });

  it("não mascara um erro do banco", async () => {
    const erro = new Error("A soma das parcelas é diferente do total.");
    rpc.mockResolvedValue({ data: null, error: erro });

    await expect(criarPedidoCompleto(input)).rejects.toBe(erro);
  });

  it("recusa resposta vazia para não confirmar um pedido incerto", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(criarPedidoCompleto(input)).rejects.toThrow(
      "não retornou o resumo do pedido"
    );
  });
});
