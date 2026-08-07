import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarDadosPedidosOffline, salvarDadosPedidosOffline } from "./dadosPedidosOffline";

const armazenamento = new Map<string, string>();

beforeEach(() => {
  vi.restoreAllMocks();
  armazenamento.clear();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (chave: string) => armazenamento.get(chave) ?? null,
      setItem: (chave: string, valor: string) => armazenamento.set(chave, valor),
      removeItem: (chave: string) => armazenamento.delete(chave),
    },
  });
});

describe("dados de apoio dos pedidos offline", () => {
  it("recupera clientes, produtos e pedidos da última carga válida", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    salvarDadosPedidosOffline("Usuario@Empresa.com", {
      clientes: [{ id: "c1" }], produtos: [{ id: "p1" }], pedidos: [{ id: "v1" }],
    });
    expect(carregarDadosPedidosOffline("usuario@empresa.com", 2_000)).toMatchObject({
      clientes: [{ id: "c1" }], produtos: [{ id: "p1" }], pedidos: [{ id: "v1" }],
    });
  });

  it("descarta dados com mais de 30 dias", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    salvarDadosPedidosOffline("usuario@empresa.com", { clientes: [], produtos: [], pedidos: [] });
    expect(carregarDadosPedidosOffline("usuario@empresa.com", 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
