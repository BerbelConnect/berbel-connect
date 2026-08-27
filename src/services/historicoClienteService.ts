import { supabase } from "@/lib/supabase";
import type {
  HistoricoClienteDados,
  PedidoResumo,
  ProdutoMaisComprado,
  TimelineEvento,
  VisitaResumo,
  ContaReceberResumo,
  ComissaoResumo,
  ClienteResumo,
  AlertaInteligente,
  HistoricoClienteResumo,
} from "@/types/historicoCliente";

type RawRecord = Record<string, unknown>;

type RawHistoricoClienteData = {
  cliente: RawRecord;
  pedidos: RawRecord[];
  visitas: RawRecord[];
  contasReceber: RawRecord[];
  comissoes: RawRecord[];
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown) {
  return toNumber(value);
}

function dataISO(data?: string | null) {
  if (!data) return null;
  return data.slice(0, 10);
}

function diasDesde(data?: string | null) {
  if (!data) return null;
  const alvo = new Date(data);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  const diff = hoje.getTime() - alvo.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calcularRanking(totalComprado: number, numeroPedidos: number, diasSemCompra: number | null) {
  if (
    totalComprado >= 100000 &&
    numeroPedidos >= 5 &&
    diasSemCompra !== null &&
    diasSemCompra <= 30
  ) {
    return "A" as const;
  }

  if (
    totalComprado >= 30000 &&
    numeroPedidos >= 3 &&
    diasSemCompra !== null &&
    diasSemCompra <= 60
  ) {
    return "B" as const;
  }

  return "C" as const;
}

function calcularResumo(
  pedidos: PedidoResumo[],
  contasReceber: ContaReceberResumo[],
  comissoes: ComissaoResumo[]
): HistoricoClienteResumo {
  const totalComprado = pedidos.reduce(
    (soma, pedido) => soma + toNumber(pedido.valor_total),
    0
  );
  const numeroPedidos = pedidos.length;
  const ticketMedio = numeroPedidos ? totalComprado / numeroPedidos : 0;
  const maiorCompra = pedidos.reduce(
    (maior, pedido) => Math.max(maior, toNumber(pedido.valor_total)),
    0
  );
  const ultimaCompra = pedidos[0]?.data_pedido || null;
  const diasSemCompra = diasDesde(ultimaCompra);
  const comissaoTotal = comissoes.reduce(
    (soma, item) => soma + toNumber(item.valor_comissao),
    0
  );
  const contasPendentes = contasReceber.filter(
    (conta) => conta.status !== "Recebido"
  ).length;
  const contasVencidas = contasReceber.filter(
    (conta) =>
      conta.status !== "Recebido" &&
      conta.vencimento &&
      new Date(conta.vencimento) < new Date()
  ).length;
  const ranking = calcularRanking(totalComprado, numeroPedidos, diasSemCompra);

  return {
    totalComprado,
    numeroPedidos,
    ticketMedio,
    maiorCompra,
    ultimaCompra,
    diasSemCompra,
    comissaoTotal,
    contasPendentes,
    contasVencidas,
    ranking,
  };
}

function maparPedido(item: RawRecord): PedidoResumo {
  return {
    id: getString(item.id) || "",
    numero: getString(item.numero),
    data_pedido: dataISO(getString(item.data_pedido)),
    status: getString(item.status),
    tipo: getString(item.tipo),
    valor_total: getNumber(item.valor_total),
    valor_comissao: getNumber(item.valor_comissao),
    observacoes: getString(item.observacoes),
    created_at: getString(item.created_at),
    pedido_itens: Array.isArray(item.pedido_itens)
      ? item.pedido_itens.map((produto) => ({
          id: getString((produto as RawRecord).id),
          pedido_id: getString((produto as RawRecord).pedido_id),
          produto_id: getString((produto as RawRecord).produto_id),
          produto_nome: getString((produto as RawRecord).produto_nome),
          quantidade: getNumber((produto as RawRecord).quantidade),
          valor_unitario: getNumber((produto as RawRecord).valor_unitario),
          valor_total: getNumber((produto as RawRecord).valor_total),
          valor_comissao: getNumber((produto as RawRecord).valor_comissao),
        }))
      : [],
  };
}

function maparVisita(item: RawRecord): VisitaResumo {
  return {
    id: getString(item.id) || "",
    data_visita: dataISO(getString(item.data_visita)),
    hora_visita: getString(item.hora_visita),
    pessoa_atendida: getString(item.pessoa_atendida),
    tipo: getString(item.tipo),
    resumo: getString(item.resumo),
    proxima_acao: getString(item.proxima_acao),
    data_retorno: dataISO(getString(item.data_retorno)),
    status: getString(item.status),
    visita_origem_id: getString(item.visita_origem_id),
    retorno_criado_id: getString(item.retorno_criado_id),
  };
}

function maparContaReceber(item: RawRecord): ContaReceberResumo {
  return {
    id: getString(item.id) || "",
    descricao: getString(item.descricao),
    valor: getNumber(item.valor),
    vencimento: dataISO(getString(item.vencimento)),
    status: getString(item.status),
    forma_pagamento: getString(item.forma_pagamento),
    observacoes: getString(item.observacoes),
    pedido_id: getString(item.pedido_id),
  };
}

function maparComissao(item: RawRecord): ComissaoResumo {
  return {
    id: getString(item.id) || "",
    valor_comissao: getNumber(item.valor_comissao),
    status: getString(item.status),
    data_recebimento: dataISO(getString(item.data_recebimento)),
    pedido_id: getString(item.pedido_id),
  };
}

function construirProdutosMaisComprados(pedidos: PedidoResumo[]) {
  const mapa = new Map<string, ProdutoMaisComprado>();

  pedidos.forEach((pedido) => {
    pedido.pedido_itens.forEach((item) => {
      const nome = item.produto_nome || "Produto não informado";
      const quantidade = item.quantidade || 0;
      const valor = item.valor_total || 0;
      const comissao = item.valor_comissao || 0;

      const existente = mapa.get(nome);
      if (existente) {
        existente.quantidade += quantidade;
        existente.valor_total += valor;
        existente.comissao_total += comissao;
      } else {
        mapa.set(nome, {
          produto_nome: nome,
          quantidade,
          valor_total: valor,
          comissao_total: comissao,
        });
      }
    });
  });

  return Array.from(mapa.values())
    .sort((a, b) => b.quantidade - a.quantidade || b.valor_total - a.valor_total)
    .slice(0, 5);
}

function montarHistoricoCliente(
  raw: RawHistoricoClienteData
): HistoricoClienteDados {
  const cliente: ClienteResumo = {
    id: getString(raw.cliente.id) || "",
    razao_social: getString(raw.cliente.razao_social) || "",
    nome_fantasia: getString(raw.cliente.nome_fantasia),
    cnpj: getString(raw.cliente.cnpj),
    cidade: getString(raw.cliente.cidade),
    estado: getString(raw.cliente.estado),
    telefone: getString(raw.cliente.telefone),
    whatsapp: getString(raw.cliente.whatsapp),
    email: getString(raw.cliente.email),
    observacoes: getString(raw.cliente.observacoes),
  };

  const pedidos = raw.pedidos.map(maparPedido);
  const visitas = raw.visitas.map(maparVisita);
  const contasReceber = raw.contasReceber.map(maparContaReceber);
  const comissoes = raw.comissoes.map(maparComissao);

  const resumo = calcularResumo(pedidos, contasReceber, comissoes);
  const produtosMaisComprados = construirProdutosMaisComprados(pedidos);
  const timeline = construirTimeline(pedidos, visitas, contasReceber, comissoes);
  const alertas = construirAlertas(resumo, contasReceber);

  return {
    cliente,
    pedidos,
    visitas,
    contasReceber,
    comissoes,
    produtosMaisComprados,
    timeline,
    alertas,
    resumo,
  };
}

function construirTimeline(
  pedidos: PedidoResumo[],
  visitas: VisitaResumo[],
  contasReceber: ContaReceberResumo[],
  comissoes: ComissaoResumo[]
): TimelineEvento[] {
  const eventos: TimelineEvento[] = [];

  pedidos.forEach((pedido) => {
    if (pedido.data_pedido) {
      eventos.push({
        id: `pedido-${pedido.id}`,
        tipo: "pedido",
        data: pedido.data_pedido,
        titulo: `Pedido ${pedido.numero || pedido.id}`,
        descricao: `Status: ${pedido.status || "-"} • Valor ${pedido.valor_total?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        categoria: "Pedidos",
      });
    }

    if (pedido.observacoes) {
      eventos.push({
        id: `pedido-observacao-${pedido.id}`,
        tipo: "observacao",
        data: pedido.data_pedido || pedido.created_at || "",
        titulo: `Observação de pedido ${pedido.numero || pedido.id}`,
        descricao: pedido.observacoes,
        categoria: "Observações",
      });
    }
  });

  visitas.forEach((visita) => {
    if (visita.data_visita) {
      eventos.push({
        id: `visita-${visita.id}`,
        tipo: "visita",
        data: visita.data_visita,
        titulo: `Visita ${visita.tipo || "Comercial"}`,
        descricao: visita.resumo || visita.pessoa_atendida || "Sem resumo",
        categoria: "Visitas",
      });
    }
  });

  contasReceber.forEach((conta) => {
    if (conta.vencimento) {
      eventos.push({
        id: `conta-${conta.id}`,
        tipo: "pagamento",
        data: conta.vencimento,
        titulo: `Conta a receber ${conta.descricao || "Sem descrição"}`,
        descricao: `Valor ${conta.valor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • Status ${conta.status || "-"}`,
        categoria: "Financeiro",
      });
    }
  });

  comissoes.forEach((comissao) => {
    if (comissao.data_recebimento) {
      eventos.push({
        id: `comissao-${comissao.id}`,
        tipo: "movimentacao",
        data: comissao.data_recebimento,
        titulo: `Comissão ${comissao.status || "Financeira"}`,
        descricao: `Valor ${comissao.valor_comissao?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        categoria: "Movimentações",
      });
    }
  });

  return eventos.sort((a, b) => (a.data < b.data ? 1 : -1));
}

function construirAlertas(
  resumo: HistoricoClienteResumo,
  contasReceber: ContaReceberResumo[]
): AlertaInteligente[] {
  const alertas: AlertaInteligente[] = [];

  if (resumo.diasSemCompra !== null && resumo.diasSemCompra >= 45) {
    alertas.push({
      tipo: "sem_compra",
      titulo: "Cliente sem compra há muitos dias",
      descricao: `Última compra há ${resumo.diasSemCompra} dias.`,
    });
  }

  const contasVencidas = contasReceber.filter((conta) => {
    return conta.status !== "Recebido" && conta.vencimento && new Date(conta.vencimento) < new Date();
  });

  if (contasVencidas.length > 0) {
    alertas.push({
      tipo: "contas_vencidas",
      titulo: "Contas vencidas",
      descricao: `${contasVencidas.length} conta(s) vencida(s) pendente(s).`,
    });
  }

  if (resumo.numeroPedidos > 0 && resumo.diasSemCompra !== null && resumo.diasSemCompra >= 30) {
    alertas.push({
      tipo: "oportunidade_venda",
      titulo: "Oportunidade de venda",
      descricao: "Cliente com histórico de pedidos e sem compra recente.",
    });
  }

  return alertas;
}

export async function buscarHistoricoCliente(
  clienteId: string
): Promise<HistoricoClienteDados> {
  const [clienteResp, pedidosResp, visitasResp, contasReceberResp, comissoesResp] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, razao_social, nome_fantasia, cnpj, cidade, estado, telefone, whatsapp, email, observacoes")
      .eq("id", clienteId)
      .single(),
    supabase
      .from("pedidos")
      .select(`*, pedido_itens(*)`)
      .eq("cliente_id", clienteId)
      .order("data_pedido", { ascending: false }),
    supabase
      .from("visitas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("data_visita", { ascending: false }),
    supabase
      .from("contas_receber")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("vencimento", { ascending: false }),
    supabase
      .from("comissoes_financeiro")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("data_recebimento", { ascending: false }),
  ]);

  if (clienteResp.error) throw clienteResp.error;
  if (pedidosResp.error) throw pedidosResp.error;
  if (visitasResp.error) throw visitasResp.error;
  if (contasReceberResp.error) throw contasReceberResp.error;
  if (comissoesResp.error) throw comissoesResp.error;
  if (!clienteResp.data) throw new Error("Cliente não encontrado.");

  const raw: RawHistoricoClienteData = {
    cliente: clienteResp.data,
    pedidos: pedidosResp.data || [],
    visitas: visitasResp.data || [],
    contasReceber: contasReceberResp.data || [],
    comissoes: comissoesResp.data || [],
  };

  return montarHistoricoCliente(raw);
}
