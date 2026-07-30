export type DashboardResumo = {
  totalVendido: number;
  totalComissao: number;
  comissaoRecebida: number;
  comissaoPendente: number;
  totalReceber: number;
  totalPagar: number;
  saldoPrevisto: number;
  valorPipeline: number;
  clientesCount: number;
  visitasHojeCount: number;
  visitasAtrasadasCount: number;
  oportunidadesAbertasCount: number;
  clientesSemVisita: DashboardAlertaCliente[];
  clientesSemCompra: DashboardAlertaCliente[];
  visitasHoje: DashboardVisitaResumo[];
  pedidosRecentes: DashboardPedidoResumo[];
  pipelineAberto: DashboardPipelineItem[];
  contasReceberPendentes: DashboardContaReceberResumo[];
  comissoesPendentes: DashboardComissaoPendenteResumo[];
  topClientes: DashboardRankingItem[];
  topRepresentadas: DashboardRankingItem[];
};

export type DashboardAlertaCliente = {
  cliente_id: string;
  razao_social: string;
  cidade: string | null;
  estado: string | null;
  dias_sem_visita: number;
  dias_sem_compra: number;
};

export type DashboardPedidoResumo = {
  id: string;
  numero: string | null;
  valor_total: number;
  status: string | null;
  cliente_nome: string | null;
};

export type DashboardPipelineItem = {
  id: string;
  oportunidade: string | null;
  etapa: string | null;
  valor_estimado: number;
  status: string | null;
  cliente_nome: string | null;
};

export type DashboardVisitaResumo = {
  id: string;
  hora_visita: string | null;
  tipo_contato: string | null;
  status: string | null;
  cliente_nome: string | null;
};

export type DashboardContaReceberResumo = {
  id: string;
  descricao: string | null;
  valor: number;
  cliente_nome: string | null;
};

export type DashboardComissaoPendenteResumo = {
  id: string;
  empresa: string | null;
  valor_comissao: number;
  cliente_nome: string | null;
  status: string | null;
};

export type DashboardRankingItem = {
  nome: string;
  total: number;
};
