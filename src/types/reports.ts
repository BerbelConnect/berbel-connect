export type ReportPeriodKey =
  | "30d"
  | "90d"
  | "6m"
  | "12m"
  | "custom";

export type ReportFilters = {
  period: ReportPeriodKey;
  startDate: string | null;
  endDate: string | null;
  clienteId: string | null;
  representada: string | null;
};

export type ReportPedido = {
  id: string;
  created_at: string;
  cliente_id: string | null;
  valor_total: number | null;
  valor_comissao: number | null;
  status: string | null;
  clientes:
    | {
        razao_social: string | null;
      }
    | {
        razao_social: string | null;
      }[]
    | null;
};

export type ReportPedidoItem = {
  id: string;
  pedido_id: string | null;
  produto_nome: string | null;
  quantidade: number | null;
  valor_total: number | null;
};

export type ReportComissao = {
  id: string;
  pedido_id: string | null;
  created_at: string | null;
  cliente_id: string | null;
  empresa: string | null;
  valor_base: number | null;
  valor_comissao: number | null;
  status: string | null;
  clientes:
    | {
        razao_social: string | null;
      }
    | {
        razao_social: string | null;
      }[]
    | null;
};

export type ReportClienteOption = {
  id: string;
  razao_social: string;
};

export type ReportRepresentadaOption = {
  nome: string;
};

export type ReportSummary = {
  quantidadePedidos: number;
  totalVendido: number;
  totalComissao: number;
  ticketMedio: number;
};

export type ClientRankingItem = {
  nome: string;
  total: number;
  pedidos: number;
};

export type ProductRankingItem = {
  nome: string;
  total: number;
  quantidade: number;
};

export type RepresentadaRankingItem = {
  nome: string;
  total: number;
  comissao: number;
};

export type ReportsDashboardData = {
  pedidos: ReportPedido[];
  itens: ReportPedidoItem[];
  comissoes: ReportComissao[];
  clientes: ReportClienteOption[];
  representadas: ReportRepresentadaOption[];
};

export type ReportsRankings = {
  clientes: ClientRankingItem[];
  produtos: ProductRankingItem[];
  representadas: RepresentadaRankingItem[];
};
