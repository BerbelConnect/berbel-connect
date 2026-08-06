export type GravidadeAlerta = "Crítico" | "Alto" | "Médio" | "Baixo";
export type CategoriaAlerta = "Metas" | "Clientes" | "Financeiro" | "Comissões" | "Pipeline" | "Agenda";

export type AlertaInteligente = {
  chave: string;
  categoria: CategoriaAlerta;
  gravidade: GravidadeAlerta;
  titulo: string;
  detalhe: string;
  href: string;
  dataReferencia?: string | null;
};

export type FonteAlerta = {
  id: string;
  titulo?: string | null;
  nome?: string | null;
  cliente?: string | null;
  valor?: number | null;
  data?: string | null;
  status?: string | null;
  situacao?: string | null;
  detalhe?: string | null;
  diasAviso?: number | null;
};

function moeda(valor: number | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function diferencaDias(data: string | null | undefined, hoje = new Date()) {
  if (!data) return null;
  const alvo = new Date(`${data.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
  return Math.round((alvo.getTime() - base.getTime()) / 86_400_000);
}

export function gerarAlertasInteligentes(fontes: {
  clientesSemCompra: FonteAlerta[];
  clientesSemVisita: FonteAlerta[];
  visitasHoje: FonteAlerta[];
  contasReceber: FonteAlerta[];
  contasPagar: FonteAlerta[];
  comissoes: FonteAlerta[];
  pipeline: FonteAlerta[];
  metas: FonteAlerta[];
  cobrancas?: FonteAlerta[];
}, hoje = new Date()): AlertaInteligente[] {
  const alertas: AlertaInteligente[] = [];

  fontes.clientesSemCompra.forEach((item) => {
    const dias = diferencaDias(item.data, hoje);
    if (dias !== null && dias < -45) alertas.push({
      chave: `cliente-compra:${item.id}`, categoria: "Clientes", gravidade: dias < -90 ? "Alto" : "Médio",
      titulo: `${item.nome || "Cliente"} sem comprar há ${Math.abs(dias)} dias`,
      detalhe: "Cliente que pode precisar de reativação comercial.", href: "/clientes/historico-360", dataReferencia: item.data,
    });
  });

  fontes.clientesSemVisita.forEach((item) => {
    const dias = diferencaDias(item.data, hoje);
    if (dias !== null && dias < -30) alertas.push({
      chave: `cliente-visita:${item.id}`, categoria: "Clientes", gravidade: dias < -60 ? "Alto" : "Médio",
      titulo: `${item.nome || "Cliente"} sem visita há ${Math.abs(dias)} dias`,
      detalhe: "Considere agendar um novo contato.", href: "/agenda", dataReferencia: item.data,
    });
  });

  fontes.visitasHoje.forEach((item) => alertas.push({
    chave: `visita:${item.id}:${item.data}`, categoria: "Agenda", gravidade: "Baixo",
    titulo: "Visita agendada para hoje", detalhe: item.cliente || "Cliente não informado", href: "/visitas", dataReferencia: item.data,
  }));

  const adicionarConta = (item: FonteAlerta, tipo: "receber" | "pagar") => {
    const dias = diferencaDias(item.data, hoje);
    const antecedencia = tipo === "pagar" ? Number(item.diasAviso ?? 7) : 7;
    if (dias === null || dias > antecedencia) return;
    const vencida = dias < 0;
    alertas.push({
      chave: `conta-${tipo}:${item.id}`, categoria: "Financeiro", gravidade: vencida ? "Crítico" : dias <= 2 ? "Alto" : "Médio",
      titulo: vencida ? `Conta a ${tipo} vencida há ${Math.abs(dias)} dias` : `Conta a ${tipo} vence em ${dias === 0 ? "hoje" : `${dias} dias`}`,
      detalhe: `${item.cliente || item.titulo || "Sem identificação"} • ${moeda(item.valor)}`,
      href: tipo === "receber" ? "/financeiro/contas-receber" : "/financeiro/contas-pagar", dataReferencia: item.data,
    });
  };
  fontes.contasReceber.forEach((item) => adicionarConta(item, "receber"));
  fontes.contasPagar.forEach((item) => adicionarConta(item, "pagar"));

  fontes.comissoes.forEach((item) => {
    const dias = diferencaDias(item.data, hoje);
    if (dias === null || dias > 7) return;
    const vencida = dias < 0;
    alertas.push({
      chave: `comissao:${item.id}`, categoria: "Comissões", gravidade: vencida ? "Alto" : "Médio",
      titulo: vencida ? `Comissão vencida há ${Math.abs(dias)} dias` : "Comissão próxima do recebimento",
      detalhe: `${item.titulo || "Representada não informada"} • ${moeda(item.valor)}`,
      href: "/financeiro/comissoes", dataReferencia: item.data,
    });
  });

  (fontes.cobrancas || []).forEach((item) => {
    const dias = diferencaDias(item.data, hoje);
    if (dias === null || dias > 7) return;
    const atrasada = dias < 0;
    alertas.push({
      chave: `promessa-cobranca:${item.id}:${item.data}`, categoria: "Comissões",
      gravidade: atrasada ? "Crítico" : dias <= 1 ? "Alto" : "Médio",
      titulo: atrasada ? `Promessa de pagamento atrasada há ${Math.abs(dias)} dias` : dias === 0 ? "Promessa de pagamento para hoje" : `Promessa de pagamento em ${dias} dias`,
      detalhe: `${item.titulo || "Representada não informada"} • ${moeda(item.valor)}`,
      href: "/financeiro/cobrancas", dataReferencia: item.data,
    });
  });

  fontes.pipeline.forEach((item) => {
    const dias = diferencaDias(item.data, hoje);
    if (dias === null) alertas.push({
      chave: `pipeline-sem-data:${item.id}`, categoria: "Pipeline", gravidade: "Médio",
      titulo: "Oportunidade sem próximo contato", detalhe: item.titulo || "Oportunidade aberta", href: "/pipeline",
    });
    else if (dias < 0) alertas.push({
      chave: `pipeline-atrasado:${item.id}`, categoria: "Pipeline", gravidade: "Alto",
      titulo: `Contato comercial atrasado há ${Math.abs(dias)} dias`, detalhe: `${item.titulo || "Oportunidade"} • ${item.cliente || "Cliente não informado"}`, href: "/pipeline", dataReferencia: item.data,
    });
  });

  fontes.metas.forEach((item) => {
    if (!["Atrasada", "Atenção"].includes(item.situacao || "")) return;
    alertas.push({
      chave: `meta:${item.id}:${item.situacao}`, categoria: "Metas", gravidade: item.situacao === "Atrasada" ? "Crítico" : "Médio",
      titulo: item.situacao === "Atrasada" ? "Meta comercial atrasada" : "Meta abaixo do ritmo esperado",
      detalhe: `${item.titulo || "Meta"}${item.detalhe ? ` • ${item.detalhe}` : ""}`, href: "/metas",
    });
  });

  const ordem: Record<GravidadeAlerta, number> = { Crítico: 0, Alto: 1, Médio: 2, Baixo: 3 };
  return alertas.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}
