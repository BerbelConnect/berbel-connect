export type AgendaFotoLocal = {
  id: string;
  visita_id: string;
  nome_arquivo: string;
  mime_type: string;
  tamanho: number;
  criado_em: string;
  blob: Blob;
};

export type AgendaFoto = {
  id: string;
  visita_id: string;
  nome_arquivo: string;
  mime_type: string;
  tamanho: number;
  criado_em: string;
  storage_path?: string;
  url: string;
  pendente: boolean;
};
