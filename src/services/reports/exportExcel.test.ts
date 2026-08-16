import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }));

vi.mock("file-saver", () => ({ saveAs }));

import { exportToExcel } from "./exportExcel";

describe("exportToExcel", () => {
  beforeEach(() => saveAs.mockReset());

  it("gera uma planilha com todas as abas e o nome informado", async () => {
    exportToExcel("Relatorio-Teste", [
      { name: "Resumo", data: [{ Pedidos: 2, Total: 150.5 }] },
      { name: "Clientes", data: [{ Cliente: "Cliente Exemplo", Vendas: 3 }] },
    ]);

    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(saveAs.mock.calls[0][1]).toBe("Relatorio-Teste.xlsx");

    const arquivo = saveAs.mock.calls[0][0] as Blob;
    const workbook = XLSX.read(await arquivo.arrayBuffer(), { type: "array" });

    expect(workbook.SheetNames).toEqual(["Resumo", "Clientes"]);
    expect(workbook.Sheets.Resumo["A1"].v).toBe("Berbel Connect");
    expect(workbook.Sheets.Resumo["B1"].v).toBe("Relatório");
    expect(workbook.Sheets.Resumo["B3"].v).toBe("Resumo");
    expect(workbook.Sheets.Resumo["D6"].v).toBe(2);
    expect(workbook.Sheets.Resumo["E6"].v).toBe(150.5);
  });

  it("aceita uma aba sem registros", () => {
    exportToExcel("Relatorio-Vazio", [{ name: "Sem dados", data: [] }]);

    expect(saveAs).toHaveBeenCalledOnce();
    expect(saveAs.mock.calls[0][1]).toBe("Relatorio-Vazio.xlsx");
  });
});
