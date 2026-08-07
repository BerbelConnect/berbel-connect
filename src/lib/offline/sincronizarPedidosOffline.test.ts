import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  criarPedidoCompleto,
  atualizarPedidoOffline,
  removerPedidoOffline,
  listarPedidosOffline,
} = vi.hoisted(() => ({
  criarPedidoCompleto: vi.fn(),
  atualizarPedidoOffline: vi.fn(),
  removerPedidoOffline: vi.fn(),
  listarPedidosOffline: vi.fn(),
}));

vi.mock("@/lib/pedidos/criarPedidoCompleto", () => ({ criarPedidoCompleto }));
vi.mock("@/lib/offline/pedidosOffline", () => ({
  atualizarPedidoOffline,
  listarPedidosOffline,
  removerPedidoOffline,
}));

import { sincronizarPedidosOffline } from "./sincronizarPedidosOffline";

function criarStorage() {
  const dados = new Map<string, string>();
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => dados.set(chave, valor),
    removeItem: (chave: string) => dados.delete(chave),
  };
}

const item = {
  versao: 2 as const,
  id_local: "offline-1",
  criado_em: "2026-08-07T10:00:00.000Z",
  atualizado_em: "2026-08-07T10:00:00.000Z",
  status: "pendente" as const,
  pedido: { cliente_id: "c1" },
  itens: [{ produto_id: "p1" }],
  contas_receber: [],
  contas_pagar: [],
};

describe("sincronização transacional offline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", criarStorage());
    vi.stubGlobal("crypto", { randomUUID: () => "dono-1" });
    listarPedidosOffline.mockReturnValue([item]);
  });

  it("remove da fila somente depois da confirmação do RPC", async () => {
    criarPedidoCompleto.mockResolvedValue({ pedido_id: "pedido-1", numero: "PED-000001" });
    const resultado = await sincronizarPedidosOffline();
    expect(criarPedidoCompleto).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: "offline-1" }));
    expect(removerPedidoOffline).toHaveBeenCalledWith("offline-1");
    expect(resultado.sincronizados).toBe(1);
  });

  it("mantém o pedido na fila quando pedido ou financeiro falham", async () => {
    criarPedidoCompleto.mockRejectedValue(new Error("falha transacional"));
    const resultado = await sincronizarPedidosOffline();
    expect(removerPedidoOffline).not.toHaveBeenCalled();
    expect(atualizarPedidoOffline).toHaveBeenLastCalledWith("offline-1", expect.objectContaining({ status: "erro" }));
    expect(resultado.erros).toBe(1);
  });

  it("impede sincronização concorrente em outra aba", async () => {
    localStorage.setItem("berbel_connect_sincronizacao_offline", JSON.stringify({ dono: "outra-aba", expira_em: Date.now() + 30_000 }));
    const resultado = await sincronizarPedidosOffline();
    expect(criarPedidoCompleto).not.toHaveBeenCalled();
    expect(resultado.sucesso).toBe(false);
  });
});
