import type {
  ComissaoResumo,
  ContaReceberResumo,
  HistoricoClienteDados,
} from "@/types/historicoCliente";

export function selecionarContasReceberCliente(
  historico: HistoricoClienteDados
): ContaReceberResumo[] {
  return historico.contasReceber;
}

export function selecionarComissoesCliente(
  historico: HistoricoClienteDados
): ComissaoResumo[] {
  return historico.comissoes;
}
