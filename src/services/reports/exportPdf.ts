import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import type {
  ClientRankingItem,
  ProductRankingItem,
  ReportComissao,
  ReportFilters,
  ReportPedido,
  ReportSummary,
  RepresentadaRankingItem,
} from "@/types/reports";

export type RelatorioComercialPdfData = {
  summary: ReportSummary;
  filters: ReportFilters;
  clienteNome: string;
  pedidos: ReportPedido[];
  comissoes: ReportComissao[];
  clientes: ClientRankingItem[];
  produtos: ProductRankingItem[];
  representadas: RepresentadaRankingItem[];
};

function currency(value: number | null) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
}

function clienteNome(clientes: ReportPedido["clientes"] | ReportComissao["clientes"]) {
  if (!clientes) return "Cliente não informado";
  if (Array.isArray(clientes)) return clientes[0]?.razao_social || "Cliente não informado";
  return clientes.razao_social || "Cliente não informado";
}

function periodo(filters: ReportFilters) {
  const labels = { "30d": "Últimos 30 dias", "90d": "Últimos 90 dias", "6m": "Últimos 6 meses", "12m": "Últimos 12 meses" };
  if (filters.period !== "custom") return labels[filters.period];
  return `${date(filters.startDate)} a ${date(filters.endDate)}`;
}

export function criarRelatorioComercialPdf(data: RelatorioComercialPdfData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Berbel Connect", 14, 12);
  doc.setFontSize(13);
  doc.text("Relatório Comercial", 14, 21);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Período: ${periodo(data.filters)}`, 14, 36);
  doc.text(`Cliente: ${data.clienteNome}`, 14, 42);
  doc.text(`Representada: ${data.filters.representada || "Todas"}`, 110, 42);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 205, 36);

  autoTable(doc, {
    startY: 49,
    head: [["Pedidos", "Vendas", "Comissões", "Ticket médio"]],
    body: [[data.summary.quantidadePedidos, currency(data.summary.totalVendido), currency(data.summary.totalComissao), currency(data.summary.ticketMedio)]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], fontStyle: "bold" },
    styles: { halign: "center", cellPadding: 3 },
  });

  autoTable(doc, {
    startY: 72,
    head: [["Top clientes", "Pedidos", "Total", "Top produtos", "Quantidade", "Total", "Top representadas", "Base", "Comissão"]],
    body: Array.from({ length: Math.max(data.clientes.length, data.produtos.length, data.representadas.length, 1) }, (_, index) => [
      data.clientes[index]?.nome || "", data.clientes[index]?.pedidos ?? "", data.clientes[index] ? currency(data.clientes[index].total) : "",
      data.produtos[index]?.nome || "", data.produtos[index]?.quantidade ?? "", data.produtos[index] ? currency(data.produtos[index].total) : "",
      data.representadas[index]?.nome || "", data.representadas[index] ? currency(data.representadas[index].total) : "", data.representadas[index] ? currency(data.representadas[index].comissao) : "",
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], fontSize: 7 },
    styles: { fontSize: 7, overflow: "linebreak" },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Pedidos detalhados", 14, 16);
  autoTable(doc, {
    startY: 21,
    head: [["Data", "Cliente", "Status", "Valor"]],
    body: data.pedidos.map((item) => [date(item.created_at), clienteNome(item.clientes), item.status || "Não informado", currency(item.valor_total)]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Comissões detalhadas", 14, 16);
  autoTable(doc, {
    startY: 21,
    head: [["Data", "Cliente", "Representada", "Status", "Valor base", "Comissão"]],
    body: data.comissoes.map((item) => [date(item.created_at), clienteNome(item.clientes), item.empresa || "Não informada", item.status || "Não informado", currency(item.valor_base), currency(item.valor_comissao)]),
    theme: "striped",
    headStyles: { fillColor: [5, 150, 105] },
    styles: { fontSize: 8 },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Berbel Connect • Página ${page} de ${pages}`, pageWidth - 14, 202, { align: "right" });
  }

  return doc;
}

export function exportarRelatorioComercialPdf(data: RelatorioComercialPdfData) {
  criarRelatorioComercialPdf(data).save(`Relatorio-Comercial-${new Date().toISOString().slice(0, 10)}.pdf`);
}
