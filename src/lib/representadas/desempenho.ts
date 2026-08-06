export type ComissaoRepresentada = {
  id: string;
  pedido_id: string | null;
  created_at: string;
  empresa: string;
  valor_base: number;
  valor_comissao: number;
  status: string;
  cliente: string;
};

export type DesempenhoRepresentada = {
  nome: string;
  pedidos: number;
  vendas: number;
  comissao: number;
  recebida: number;
  pendente: number;
  projecao: number;
};

const iso = (data: Date) => dataIsoBrasil(data);
const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function intervaloPeriodo(periodo: "mes" | "30d" | "90d" | "ano" | "custom", inicio = "", fim = "", hoje = new Date()) {
  const final = iso(hoje);
  if (periodo === "custom" && inicio && fim) return { inicio, fim };
  if (periodo === "mes") return { inicio: `${final.slice(0, 7)}-01`, fim: final };
  if (periodo === "ano") return { inicio: `${final.slice(0, 4)}-01-01`, fim: final };
  const dias = periodo === "90d" ? 89 : 29;
  return { inicio: adicionarDiasDataIso(final, -dias), fim: final };
}

export function calcularDesempenhoRepresentadas(comissoes: ComissaoRepresentada[], inicio: string, fim: string, hoje = new Date()): { representadas: DesempenhoRepresentada[] } {
  const mapa = new Map<string, Omit<DesempenhoRepresentada, "nome" | "projecao"> & { ids: Set<string> }>();
  for (const item of comissoes) {
    const data = item.created_at.slice(0, 10);
    if (!data || data < inicio || data > fim) continue;
    const nome = item.empresa.trim() || "Sem representada";
    const atual = mapa.get(nome) || { pedidos: 0, vendas: 0, comissao: 0, recebida: 0, pendente: 0, ids: new Set<string>() };
    if (item.pedido_id) atual.ids.add(item.pedido_id);
    atual.vendas += Number(item.valor_base || 0);
    atual.comissao += Number(item.valor_comissao || 0);
    if (["recebida", "pago", "paga"].includes(normalizar(item.status))) atual.recebida += Number(item.valor_comissao || 0);
    else atual.pendente += Number(item.valor_comissao || 0);
    atual.pedidos = atual.ids.size;
    mapa.set(nome, atual);
  }
  const mesAtual = inicio.slice(0, 7) === iso(hoje).slice(0, 7) && fim.slice(0, 7) === iso(hoje).slice(0, 7);
  const diasDecorridos = Math.max(1, Number(iso(hoje).slice(8, 10)));
  const diasMes = Number(fimMesBrasil(hoje).slice(8, 10));
  return { representadas: [...mapa].map(([nome, item]) => ({
    nome, pedidos: item.pedidos, vendas: item.vendas, comissao: item.comissao,
    recebida: item.recebida, pendente: item.pendente,
    projecao: mesAtual ? item.comissao / diasDecorridos * diasMes : item.comissao,
  })).sort((a, b) => b.comissao - a.comissao) };
}
import { adicionarDiasDataIso, dataIsoBrasil, fimMesBrasil } from "../dataBrasil";
