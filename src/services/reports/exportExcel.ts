import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export type ExcelSheet = {
  name: string;
  data: Record<string, unknown>[];
};

function autoSizeColumns(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;

  const cols = Object.keys(data[0]).map((key) => {
    const max = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    );

    return {
      wch: Math.min(Math.max(max + 3, 15), 40),
    };
  });

  ws["!cols"] = cols;
}

function formatCurrencyColumns(
  ws: XLSX.WorkSheet,
  data: Record<string, unknown>[]
) {
  if (!data.length) return;

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  Object.keys(data[0]).forEach((key, index) => {
    const isMoney =
      key.toLowerCase().includes("valor") ||
      key.toLowerCase().includes("venda") ||
      key.toLowerCase().includes("comissão") ||
      key.toLowerCase().includes("ticket") ||
      key.toLowerCase().includes("total");

    if (!isMoney) return;

    for (let row = 1; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({
        c: index,
        r: row,
      });

      if (ws[cell]) {
        ws[cell].z = '"R$" #,##0.00';
      }
    }
  });
}

export function exportToExcel(
  fileName: string,
  sheets: ExcelSheet[]
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const exportDate = new Date().toLocaleString("pt-BR");

    const rows = [
      {
        "Berbel Connect": "",
      },
      {
        Relatório: sheet.name,
      },
      {
        Exportado: exportDate,
      },
      {},
      ...sheet.data,
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);

    autoSizeColumns(worksheet, rows);

    formatCurrencyColumns(worksheet, rows);

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 4,
    };

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name
    );
  });

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileName}.xlsx`
  );
}