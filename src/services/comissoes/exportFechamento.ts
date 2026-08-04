import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { exportToExcel } from "@/services/reports/exportExcel";
import type { ComissaoFechamento, ResumoFechamento } from "@/lib/comissoes/fechamento";
type Grupo = { empresa: string; registros: number; valorBase: number; comissao: number; recebida: number; pendente: number; vencida: number };
type Dados = { registros: ComissaoFechamento[]; resumo: ResumoFechamento; porEmpresa: Grupo[]; inicio: string; fim: string; empresa: string };
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (valor: string | null) => valor ? new Date(`${valor.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : "—";
export function exportarFechamentoExcel(dados: Dados) { exportToExcel(`Fechamento-Comissoes-${dados.fim}`, [
  { name: "Resumo", data: [{ Representada: dados.empresa, Início: dados.inicio, Fim: dados.fim, Previsto: dados.resumo.previsto, Recebido: dados.resumo.recebido, Pendente: dados.resumo.pendente, Vencido: dados.resumo.vencido }] },
  { name: "Por Representada", data: dados.porEmpresa.map((item) => ({ Representada: item.empresa, Registros: item.registros, "Valor Base": item.valorBase, Comissão: item.comissao, Recebida: item.recebida, Pendente: item.pendente, Vencida: item.vencida })) },
  { name: "Comissões", data: dados.registros.map((item) => ({ Representada: item.empresa, Cliente: item.cliente, Pedido: item.pedido, Previsão: item.previsao, Recebimento: item.recebimento, "Valor Base": item.valor_base, Percentual: item.percentual, Comissão: item.valor_comissao, Situação: item.situacao })) },
]); }
export function exportarFechamentoPdf(dados: Dados) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }); const largura = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, largura, 28, "F"); doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("Berbel Connect", 14, 12); doc.setFontSize(13); doc.text("Fechamento de Comissões", 14, 21);
  doc.setTextColor(51, 65, 85); doc.setFontSize(9); doc.text(`Período: ${data(dados.inicio)} a ${data(dados.fim)}`, 14, 37); doc.text(`Representada: ${dados.empresa}`, 120, 37);
  autoTable(doc, { startY: 44, head: [["Previsto", "Recebido", "Pendente", "Vencido"]], body: [[moeda(dados.resumo.previsto), moeda(dados.resumo.recebido), moeda(dados.resumo.pendente), moeda(dados.resumo.vencido)]], headStyles: { fillColor: [37, 99, 235] }, styles: { halign: "center" } });
  autoTable(doc, { startY: 67, head: [["Representada", "Registros", "Valor base", "Comissão", "Recebida", "Pendente", "Vencida"]], body: dados.porEmpresa.map((item) => [item.empresa, item.registros, moeda(item.valorBase), moeda(item.comissao), moeda(item.recebida), moeda(item.pendente), moeda(item.vencida)]), headStyles: { fillColor: [30, 41, 59] }, styles: { fontSize: 8 } });
  doc.addPage(); doc.setTextColor(15, 23, 42); doc.setFontSize(14); doc.text("Comissões detalhadas", 14, 16);
  autoTable(doc, { startY: 22, head: [["Representada", "Cliente", "Pedido", "Previsão", "Base", "%", "Comissão", "Situação"]], body: dados.registros.map((item) => [item.empresa, item.cliente, item.pedido, data(item.previsao), moeda(item.valor_base), `${item.percentual.toFixed(2)}%`, moeda(item.valor_comissao), item.situacao || "Pendente"]), headStyles: { fillColor: [5, 150, 105] }, styles: { fontSize: 7 } });
  const paginas = doc.getNumberOfPages(); for (let pagina = 1; pagina <= paginas; pagina++) { doc.setPage(pagina); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Berbel Connect • Página ${pagina} de ${paginas}`, largura - 14, 202, { align: "right" }); }
  doc.save(`Fechamento-Comissoes-${dados.fim}.pdf`);
}
