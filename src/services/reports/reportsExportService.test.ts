import { beforeEach, describe, expect, it, vi } from "vitest";

const { exportToExcel } = vi.hoisted(() => ({ exportToExcel: vi.fn() }));

vi.mock("./exportExcel", () => ({ exportToExcel }));

import { exportarRelatorioComercialExcel } from "./reportsExportService";

describe("exportarRelatorioComercialExcel", () => {
  beforeEach(() => exportToExcel.mockReset());

  it("monta as seis abas com resumo, rankings e detalhes", () => {
    exportarRelatorioComercialExcel(
      { pedidos: 2, vendas: 300, comissoes: 15, ticket: 150 },
      [{ nome: "Cliente A", pedidos: 2, total: 300 }],
      [{ nome: "Produto A", quantidade: 4, total: 300 }],
      [{ nome: "Representada A", total: 300, comissao: 15 }],
      [
        {
          id: "pedido-1",
          created_at: "2026-08-07T12:00:00.000Z",
          cliente_id: "cliente-1",
          valor_total: 300,
          valor_comissao: 15,
          status: "Pedido",
          clientes: { razao_social: "Cliente A" },
        },
      ],
      [
        {
          id: "comissao-1",
          pedido_id: "pedido-1",
          created_at: "2026-08-07T12:00:00.000Z",
          cliente_id: "cliente-1",
          empresa: "Representada A",
          valor_base: 300,
          valor_comissao: 15,
          status: "Pendente",
          clientes: [{ razao_social: "Cliente A" }],
        },
      ],
    );

    expect(exportToExcel).toHaveBeenCalledOnce();
    expect(exportToExcel).toHaveBeenCalledWith("Relatorio Comercial", [
      { name: "Resumo", data: [{ Pedidos: 2, Vendas: 300, Comissões: 15, "Ticket Médio": 150 }] },
      { name: "Top Clientes", data: [{ Cliente: "Cliente A", Pedidos: 2, Total: 300 }] },
      { name: "Top Produtos", data: [{ Produto: "Produto A", Quantidade: 4, Total: 300 }] },
      { name: "Top Representadas", data: [{ Representada: "Representada A", "Valor Base": 300, Comissão: 15 }] },
      { name: "Pedidos Detalhados", data: [{ Data: "2026-08-07T12:00:00.000Z", Cliente: "Cliente A", Status: "Pedido", Valor: 300 }] },
      { name: "Comissões Detalhadas", data: [{ Data: "2026-08-07T12:00:00.000Z", Cliente: "Cliente A", Representada: "Representada A", Status: "Pendente", "Valor Base": 300, Comissão: 15 }] },
    ]);
  });
});
