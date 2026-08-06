export type ComissaoCobranca = {
  id: string;
  empresa: string;
  cliente: string;
  pedido: string;
  valor: number;
  previsao: string | null;
  status: string;
};

export type RegistroCobranca = {
  id: string;
  comissao_id: string;
  contato_em: string;
  canal: string;
  resultado: string;
  promessa_data: string | null;
  promessa_valor: number | null;
  observacoes: string;
};

export type ItemCobranca = ComissaoCobranca & {
  diasAtraso: number;
  prioridade: "Crítica" | "Alta" | "Média" | "Baixa";
  ultimoContato: RegistroCobranca | null;
};

const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const dataIso = (data: Date) => dataIsoBrasil(data);

export function diasEntre(data: string | null, hoje = dataIso(new Date())) {
  if (!data) return 0;
  const inicio = new Date(`${data.slice(0, 10)}T00:00:00Z`).getTime();
  const fim = new Date(`${hoje}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((fim - inicio) / 86_400_000));
}

export function prioridadeCobranca(diasAtraso: number, valor: number): ItemCobranca["prioridade"] {
  if (diasAtraso >= 30 || (diasAtraso >= 15 && valor >= 500)) return "Crítica";
  if (diasAtraso >= 15 || (diasAtraso >= 7 && valor >= 250)) return "Alta";
  if (diasAtraso >= 7 || valor >= 500) return "Média";
  return "Baixa";
}

export function montarAcompanhamento(comissoes: ComissaoCobranca[], registros: RegistroCobranca[], hoje = dataIso(new Date())) {
  const recebidos = new Set(["recebida", "recebido", "pago", "paga", "quitado"]);
  const historico = new Map<string, RegistroCobranca[]>();
  for (const registro of registros) {
    const lista = historico.get(registro.comissao_id) || [];
    lista.push(registro); historico.set(registro.comissao_id, lista);
  }
  const itens = comissoes.filter((item) => !recebidos.has(normalizar(item.status))).map((item) => {
    const diasAtraso = item.previsao && item.previsao.slice(0, 10) < hoje ? diasEntre(item.previsao, hoje) : 0;
    const contatos = (historico.get(item.id) || []).sort((a, b) => b.contato_em.localeCompare(a.contato_em));
    return { ...item, diasAtraso, prioridade: prioridadeCobranca(diasAtraso, item.valor), ultimoContato: contatos[0] || null };
  }).sort((a, b) => b.diasAtraso - a.diasAtraso || b.valor - a.valor);
  return {
    itens,
    totalPendente: itens.reduce((soma, item) => soma + item.valor, 0),
    totalVencido: itens.filter((item) => item.diasAtraso > 0).reduce((soma, item) => soma + item.valor, 0),
    semContato: itens.filter((item) => !item.ultimoContato).length,
    promessasAbertas: registros.filter((item) => item.resultado === "Promessa de pagamento" && item.promessa_data && item.promessa_data >= hoje).length,
  };
}
import { dataIsoBrasil } from "../dataBrasil";
