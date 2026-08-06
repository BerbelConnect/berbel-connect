import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export type ExcelSheet = {
  name: string;
  data: Record<string, unknown>[];
};

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MONEY_FORMAT = '"R$" #,##0.00';

function cellValue(value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value;
  return String(value);
}

function columnNames(data: Record<string, unknown>[]) {
  const names = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((key) => names.add(key)));
  return [...names];
}

function isMoneyColumn(name: string) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  return ["valor", "venda", "comissão", "ticket", "total", "recebid", "pendente", "vencid", "previst"]
    .some((term) => normalized.includes(term));
}

function configureSheet(
  worksheet: ExcelJS.Worksheet,
  sheet: ExcelSheet,
  exportDate: Date,
) {
  const columns = columnNames(sheet.data);
  const totalColumns = Math.max(columns.length, 1);

  worksheet.addRow(["Berbel Connect"]);
  worksheet.addRow(["Relatório", sheet.name]);
  worksheet.addRow(["Exportado", exportDate.toLocaleString("pt-BR")]);
  worksheet.addRow([]);

  if (columns.length) {
    worksheet.addRow(columns);
    sheet.data.forEach((item) => {
      worksheet.addRow(columns.map((column) => cellValue(item[column])));
    });
  }

  worksheet.mergeCells(1, 1, 1, totalColumns);
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  worksheet.getRow(1).height = 24;

  if (columns.length) {
    const header = worksheet.getRow(5);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    header.alignment = { vertical: "middle" };
    header.height = 20;

    columns.forEach((column, index) => {
      const values = sheet.data.map((row) => String(row[column] ?? ""));
      const width = Math.min(
        Math.max(column.length, ...values.map((value) => value.length)) + 3,
        40,
      );
      worksheet.getColumn(index + 1).width = Math.max(width, 15);

      if (isMoneyColumn(column)) {
        for (let row = 6; row <= worksheet.rowCount; row += 1) {
          worksheet.getCell(row, index + 1).numFmt = MONEY_FORMAT;
        }
      }
    });

    worksheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5, column: columns.length },
    };
    worksheet.views = [{ state: "frozen", ySplit: 5 }];
  } else {
    worksheet.getColumn(1).width = 24;
    worksheet.views = [{ state: "frozen", ySplit: 4 }];
  }
}

export function createExcelWorkbook(
  sheets: ExcelSheet[],
  exportDate = new Date(),
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Berbel Connect";
  workbook.created = exportDate;

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name);
    configureSheet(worksheet, sheet, exportDate);
  });

  return workbook;
}

export async function exportToExcel(fileName: string, sheets: ExcelSheet[]) {
  const workbook = createExcelWorkbook(sheets);
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);

  saveAs(new Blob([bytes], { type: EXCEL_MIME_TYPE }), `${fileName}.xlsx`);
}
