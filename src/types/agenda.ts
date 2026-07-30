export type AgendaCliente = {
  id: string;
  razao_social: string;
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
  cliente_id: string;
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
  clientes?: AgendaVisitaClientesRelation | null;
};

export type AgendaVisitaFormData = {
  id?: string;
  cliente_id: string;
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
};

export type AgendaResumo = {
  hojeCount: number;
  atrasadasCount: number;
  proximasCount: number;
  concluidasCount: number;
  potencialTotal: number;
};