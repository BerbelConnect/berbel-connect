import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { createExcelWorkbook } from "./exportExcel";

describe("exportação Excel", () => {
  it("gera um arquivo que pode ser reaberto com abas, dados e formatação", async () => {
    const workbook = createExcelWorkbook(
      [
        {
          name: "Resumo",
          data: [{ Pedidos: 3, "Valor Total": 1250.5, Recebida: 0, Vencida: 0 }],
        },
        {
          name: "Clientes",
          data: [{ Cliente: "Empresa Exemplo", Cidade: "Franca" }],
        },
      ],
      new Date("2026-08-06T12:00:00-03:00"),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);

    expect(reopened.worksheets.map((sheet) => sheet.name)).toEqual(["Resumo", "Clientes"]);
    expect(reopened.getWorksheet("Resumo")?.getCell("A5").value).toBe("Pedidos");
    expect(reopened.getWorksheet("Resumo")?.getCell("B6").value).toBe(1250.5);
    expect(reopened.getWorksheet("Resumo")?.getCell("B6").numFmt).toBe('"R$" #,##0.00');
    expect(reopened.getWorksheet("Resumo")?.getCell("C6").numFmt).toBe('"R$" #,##0.00');
    expect(reopened.getWorksheet("Resumo")?.getCell("D6").numFmt).toBe('"R$" #,##0.00');
    expect(reopened.getWorksheet("Resumo")?.getColumn(3).numFmt).toBe('"R$" #,##0.00');
    expect(reopened.getWorksheet("Resumo")?.getColumn(4).numFmt).toBe('"R$" #,##0.00');
    expect(reopened.getWorksheet("Clientes")?.getCell("A6").value).toBe("Empresa Exemplo");
  });
});
