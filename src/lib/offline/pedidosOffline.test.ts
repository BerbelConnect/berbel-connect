import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarPedidoOffline,
  listarPedidosOffline,
  removerPedidoOffline,
  salvarPedidoOffline,
} from "./pedidosOffline";

function criarStorage() {
  const dados = new Map<string, string>();
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => dados.set(chave, valor),
    removeItem: (chave: string) => dados.delete(chave),
    clear: () => dados.clear(),
  };
}

const entrada = {
  idempotencyKey: "offline-teste-1",
  pedido: {
    cliente_id: "cliente-1",
    data_pedido: "2026-08-07",
    data_entrega_prevista: null,
    data_entrega_real: null,
    tipo: "Representação",
    status: "Pedido",
    condicao_pagamento: "A combinar",
    observacoes: "",
    valor_total: 100,
    valor_comissao: 2,
    valor_custo_total: 0,
    lucro_total: 0,
  },
  itens: [{
    produto_id: "produto-1",
    produto_nome: "Produto",
    fornecedor_id: null,
    quantidade: 1,
    valor_unitario: 100,
    valor_total: 100,
    comissao_percentual: 2,
    valor_comissao: 2,
    valor_custo_unitario: 0,
    valor_custo_total: 0,
    lucro_unitario: 0,
    lucro_total: 0,
  }],
  contasReceber: [],
  contasPagar: [],
};

describe("fila segura de pedidos offline", () => {
  beforeEach(() => {
    const storage = criarStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-teste" });
  });

  it("preserva o mesmo pedido sem duplicar pela chave de idempotência", () => {
    salvarPedidoOffline(entrada);
    salvarPedidoOffline(entrada);
    expect(listarPedidosOffline()).toHaveLength(1);
    expect(listarPedidosOffline()[0].id_local).toBe("offline-teste-1");
  });

  it("mantém erro e tentativas para nova sincronização", () => {
    salvarPedidoOffline(entrada);
    atualizarPedidoOffline("offline-teste-1", { status: "erro", erro: "sem conexão", tentativas: 1 });
    expect(listarPedidosOffline()[0]).toMatchObject({ status: "erro", erro: "sem conexão", tentativas: 1 });
  });

  it("restaura o último backup quando a fila principal está corrompida", () => {
    salvarPedidoOffline(entrada);
    atualizarPedidoOffline("offline-teste-1", { status: "pendente" });
    localStorage.setItem("berbel_connect_pedidos_offline", "{inválido");
    expect(listarPedidosOffline()).toHaveLength(1);
  });

  it("remove somente o pedido confirmado", () => {
    salvarPedidoOffline(entrada);
    removerPedidoOffline("offline-teste-1");
    expect(listarPedidosOffline()).toEqual([]);
  });
});
