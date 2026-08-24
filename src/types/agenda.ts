export type AgendaCliente = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cidade?: string;
  estado?: string;
};

export type AgendaVisitaClientesRelation = {
  razao_social: string;
  cidade?: string;
  estado?: string;
};

export type AgendaVisita = {
  id: string;
  cliente_id: string | null;
  contato_avulso_nome?: string | null;
  contato_avulso_empresa?: string | null;
  contato_avulso_telefone?: string | null;
  contato_avulso_endereco?: string | null;
  data_visita: string;
  hora_visita: string | null;
  tipo_contato: string;
  bairro: string;
  status: string;
  resultado: string;
  oportunidade: string;
  valor_potencial: number | null;
  observacoes: string;
  alerta_retorno: boolean;
  pessoa_atendida?: string | null;
  proxima_acao?: string | null;
  data_retorno?: string | null;
  lembrete_em?: string | null;
  concluida?: boolean | null;
  iniciada_em?: string | null;
  clientes?: AgendaVisitaClientesRelation | null;
};

export type AgendaVisitaFormData = {
  id?: string;
  cliente_id: string;
  contato_avulso: boolean;
  contato_avulso_nome: string;
  contato_avulso_empresa: string;
  contato_avulso_telefone: string;
  contato_avulso_endereco: string;
  data_visita: string;
  hora_visita: string;
  tipo_contato: string;
  bairro: string;
  status: string;
  resultado: string;
  oportunidade: string;
  valor_potencial: string;
  observacoes: string;
  alerta_retorno: boolean;
  pessoa_atendida: string;
  proxima_acao: string;
  data_retorno: string;
  lembrete_em: string;
};

export type AgendaVisualizacao = "dia" | "semana" | "mes";

export type AgendaResultadoFormData = {
  pessoa_atendida: string;
  resultado: string;
  proxima_acao: string;
  data_retorno: string;
  hora_retorno: string;
  lembrete_em: string;
  agendar_retorno: boolean;
};

export type AgendaResumo = {
  hojeCount: number;
  atrasadasCount: number;
  proximasCount: number;
  concluidasCount: number;
  potencialTotal: number;
};

export function nomeExibicaoVisita(visita: AgendaVisita) {
  return visita.clientes?.razao_social || visita.contato_avulso_empresa || visita.contato_avulso_nome || "Contato não informado";
}
