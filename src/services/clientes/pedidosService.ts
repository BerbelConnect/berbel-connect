import type { HistoricoClienteDados, PedidoResumo } from "@/types/historicoCliente";

export function selecionarPedidosCliente(
  historico: HistoricoClienteDados
): PedidoResumo[] {
  return historico.pedidos;
}
