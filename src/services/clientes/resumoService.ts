import type {
  AlertaInteligente,
  ClienteResumo,
  HistoricoClienteDados,
  HistoricoClienteResumo,
} from "@/types/historicoCliente";

export type FichaResumoDados = {
  cliente: ClienteResumo;
  resumo: HistoricoClienteResumo;
  alertas: AlertaInteligente[];
};

export function selecionarResumoCliente(
  historico: HistoricoClienteDados
): FichaResumoDados {
  return {
    cliente: historico.cliente,
    resumo: historico.resumo,
    alertas: historico.alertas,
  };
}
