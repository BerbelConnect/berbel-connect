export type ClienteStatus = "Ativo" | "Inativo" | "Prospecto";

export type Cliente = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  responsavel: string;
  cargo: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  materiaisUtilizados: string;
  fornecedoresAtuais: string;
  observacoes: string;
  ultimaVisita: string;
  status: ClienteStatus;
};

export type ClienteFormData = Omit<Cliente, "id" | "ultimaVisita" | "status">;

export const emptyClienteForm: ClienteFormData = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  inscricaoEstadual: "",
  responsavel: "",
  cargo: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  materiaisUtilizados: "",
  fornecedoresAtuais: "",
  observacoes: "",
};
