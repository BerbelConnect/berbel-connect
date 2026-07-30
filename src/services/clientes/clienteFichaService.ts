import { buscarHistoricoCliente } from "@/services/historicoClienteService";
import type { HistoricoClienteDados } from "@/types/historicoCliente";

export async function buscarFichaCompletaCliente(
  clienteId: string
): Promise<HistoricoClienteDados> {
  return buscarHistoricoCliente(clienteId);
}
