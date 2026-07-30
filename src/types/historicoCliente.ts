export type ClienteResumo = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

export type PedidoItemResumo = {
  id?: string;
  pedido_id?: string;
  produto_id?: string;
  produto_nome?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  valor_comissao?: number;
};

export type PedidoResumo = {
  id: string;
  numero?: string | null;
  data_pedido?: string | null;
  status?: string | null;
  tipo?: string | null;
  valor_total?: number;
  valor_comissao?: number;
  observacoes?: string | null;
  created_at?: string | null;
  pedido_itens: PedidoItemResumo[];
};

export type VisitaResumo = {
  id: string;
  data_visita?: string | null;
  hora_visita?: string | null;
  pessoa_atendida?: string | null;
  tipo?: string | null;
  resumo?: string | null;
  proxima_acao?: string | null;
  data_retorno?: string | null;
  status?: string | null;
};

export type ContaReceberResumo = {
  id: string;
  descricao?: string | null;
  valor?: number;
  vencimento?: string | null;
  status?: string | null;
  forma_pagamento?: string | null;
  observacoes?: string | null;
  pedido_id?: string | null;
};

export type ComissaoResumo = {
  id: string;
  valor_comissao?: number;
  status?: string | null;
  data_recebimento?: string | null;
  pedido_id?: string | null;
};

export type ProdutoMaisComprado = {
  produto_nome: string;
  quantidade: number;
  valor_total: number;
  comissao_total: number;
};

export type RankingCliente = "A" | "B" | "C";

export type AlertaInteligente = {
  tipo: "sem_compra" | "contas_vencidas" | "oportunidade_venda";
  titulo: string;
  descricao: string;
};

export type TimelineEvento = {
  id: string;
  tipo:
    | "pedido"
    | "visita"
    | "pagamento"
    | "observacao"
    | "movimentacao";
  data: string;
  titulo: string;
  descricao: string;
  categoria: string;
};

export type HistoricoClienteResumo = {
  totalComprado: number;
  numeroPedidos: number;
  ticketMedio: number;
  maiorCompra: number;
  ultimaCompra: string | null;
  diasSemCompra: number | null;
  comissaoTotal: number;
  contasPendentes: number;
  contasVencidas: number;
  ranking: RankingCliente;
};

export type HistoricoClienteDados = {
  cliente: ClienteResumo;
  pedidos: PedidoResumo[];
  visitas: VisitaResumo[];
  contasReceber: ContaReceberResumo[];
  comissoes: ComissaoResumo[];
  produtosMaisComprados: ProdutoMaisComprado[];
  timeline: TimelineEvento[];
  alertas: AlertaInteligente[];
  resumo: HistoricoClienteResumo;
};
