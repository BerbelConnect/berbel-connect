import { supabase } from "@/lib/supabase";

export async function editarPedidoAuditavel(pedidoId: string, motivo: string, pedido: object, itens: object[]) {
  const { data, error } = await supabase.rpc("editar_pedido_auditavel", {
    p_pedido_id: pedidoId, p_motivo: motivo, p_pedido: pedido, p_itens: itens,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirPedidoCancelado(pedidoId: string, motivo: string) {
  const { data, error } = await supabase.rpc("excluir_pedido_cancelado_auditavel", {
    p_pedido_id: pedidoId, p_motivo: motivo,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function conciliarSaldoBanco(saldoBanco: number, motivo: string) {
  const { data, error } = await supabase.rpc("conciliar_saldo_bancario", {
    p_saldo_banco: saldoBanco, p_motivo: motivo,
  });
  if (error) throw new Error(error.message);
  return data;
}
