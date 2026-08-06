export type ComissaoFechamento = {
  id: string; pedido_id: string | null; created_at: string; empresa: string; cliente: string;
  pedido: string; pedido_status: string; percentual: number; valor_base: number; valor_comissao: number;
  previsao: string | null; recebimento: string | null; pagamento_cliente?: string | null; regra_recebimento?: string | null;
  status: string; situacao?: "Aguardando cliente" | "Pendente" | "Vencida" | "Recebida";
};
export type ResumoFechamento = { previsto: number; recebido: number; pendente: number; vencido: number };
const iso = (data: Date) => data.toISOString().slice(0, 10);
const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function intervaloFechamento(periodo: "mes" | "30d" | "90d" | "ano" | "custom", inicio = "", fim = "", agora = new Date()) {
  const final = iso(agora); if (periodo === "custom" && inicio && fim) return { inicio, fim };
  if (periodo === "mes") return { inicio: `${final.slice(0, 7)}-01`, fim: final };
  if (periodo === "ano") return { inicio: `${final.slice(0, 4)}-01-01`, fim: final };
  const data = new Date(agora); data.setDate(data.getDate() - (periodo === "90d" ? 89 : 29)); return { inicio: iso(data), fim: final };
}
export function situacaoComissao(item: ComissaoFechamento, dataAtual = iso(new Date())): "Aguardando cliente" | "Pendente" | "Vencida" | "Recebida" {
  if (["recebida", "recebido", "pago", "paga", "quitado"].includes(normalizar(item.status))) return "Recebida";
  if (!item.previsao && ["solucao", "fibrart"].some((nome) => normalizar(item.empresa).includes(nome))) return "Aguardando cliente";
  if (item.previsao && item.previsao.slice(0, 10) < dataAtual) return "Vencida";
  return "Pendente";
}
export function calcularFechamento(comissoes: ComissaoFechamento[], inicio: string, fim: string, dataAtual = iso(new Date())) {
  const registros = comissoes.filter((item) => {
    const data = item.created_at.slice(0, 10); return data >= inicio && data <= fim && normalizar(item.status) !== "cancelada";
  }).map((item) => ({ ...item, situacao: situacaoComissao(item, dataAtual) }));
  const resumo: ResumoFechamento = { previsto: 0, recebido: 0, pendente: 0, vencido: 0 };
  const mapa = new Map<string, { empresa: string; registros: number; valorBase: number; comissao: number; recebida: number; pendente: number; vencida: number }>();
  for (const item of registros) {
    resumo.previsto += item.valor_comissao;
    if (item.situacao === "Recebida") resumo.recebido += item.valor_comissao; else resumo.pendente += item.valor_comissao;
    if (item.situacao === "Vencida") resumo.vencido += item.valor_comissao;
    const atual = mapa.get(item.empresa) || { empresa: item.empresa, registros: 0, valorBase: 0, comissao: 0, recebida: 0, pendente: 0, vencida: 0 };
    atual.registros += 1; atual.valorBase += item.valor_base; atual.comissao += item.valor_comissao;
    if (item.situacao === "Recebida") atual.recebida += item.valor_comissao; else atual.pendente += item.valor_comissao;
    if (item.situacao === "Vencida") atual.vencida += item.valor_comissao; mapa.set(item.empresa, atual);
  }
  return { registros, resumo, porEmpresa: [...mapa.values()].sort((a, b) => b.comissao - a.comissao) };
}
