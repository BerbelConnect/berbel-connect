import { describe, expect, it } from "vitest";

import { criarRelatorioComercialPdf } from "./exportPdf";

describe("criarRelatorioComercialPdf", () => {
  it("gera um PDF paginado com resumo e detalhes", () => {
    const doc = criarRelatorioComercialPdf({
      summary: {
        quantidadePedidos: 1,
        totalVendido: 1040.4,
        totalComissao: 31.21,
        ticketMedio: 1040.4,
      },
      filters: {
        period: "30d",
        startDate: null,
        endDate: null,
        clienteId: null,
        representada: null,
      },
      clienteNome: "Todos",
      pedidos: [
        {
          id: "pedido-1",
          created_at: "2026-08-03T12:00:00.000Z",
          cliente_id: "cliente-1",
          valor_total: 1040.4,
          valor_comissao: 31.21,
          status: "Confirmado",
          clientes: { razao_social: "Cliente Exemplo" },
        },
      ],
      comissoes: [
        {
          id: "comissao-1",
          pedido_id: "pedido-1",
          created_at: "2026-08-03T12:00:00.000Z",
          cliente_id: "cliente-1",
          empresa: "Representada Exemplo",
          valor_base: 1040.4,
          valor_comissao: 31.21,
          status: "Prevista",
          clientes: { razao_social: "Cliente Exemplo" },
        },
      ],
      clientes: [{ nome: "Cliente Exemplo", pedidos: 1, total: 1040.4 }],
      produtos: [{ nome: "Produto Exemplo", quantidade: 2, total: 1040.4 }],
      representadas: [
        { nome: "Representada Exemplo", total: 1040.4, comissao: 31.21 },
      ],
    });

    const bytes = new Uint8Array(doc.output("arraybuffer"));
    const signature = String.fromCharCode(...bytes.slice(0, 4));

    expect(signature).toBe("%PDF");
    expect(doc.getNumberOfPages()).toBe(3);
    expect(bytes.length).toBeGreaterThan(5_000);
  });
});
