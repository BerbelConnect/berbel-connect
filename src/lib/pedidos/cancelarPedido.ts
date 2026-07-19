import { supabase } from "@/lib/supabase";

export type CancelarPedidoResult = {
  pedido_id: string;
  numero: string;
  status: "Cancelado";
  contas_receber_canceladas?: number;
  contas_pagar_canceladas?: number;
  comissoes_canceladas?: number;
  reutilizado: boolean;
};

export async function cancelarPedido(
  pedidoId: string,
  motivo: string
): Promise<CancelarPedidoResult> {
  const { data, error } = await supabase.rpc("cancelar_pedido", {
    p_pedido_id: pedidoId,
    p_motivo: motivo,
  });

  if (error) throw error;

  if (!data || typeof data !== "object") {
    throw new Error("O banco não retornou o resumo do cancelamento.");
  }

  return data as CancelarPedidoResult;
}
