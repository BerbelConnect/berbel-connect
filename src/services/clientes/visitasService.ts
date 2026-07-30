import type { HistoricoClienteDados, VisitaResumo } from "@/types/historicoCliente";

export function selecionarVisitasCliente(
  historico: HistoricoClienteDados
): VisitaResumo[] {
  return historico.visitas;
}
