import { supabase } from "@/lib/supabase";

export type ItemPedidoCompleto = {
  produto_id: string;
  produto_nome: string;
  fornecedor_id: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  comissao_percentual: number;
  valor_comissao: number;
  valor_custo_unitario: number;
  valor_custo_total: number;
  lucro_unitario: number;
  lucro_total: number;
};

export type ParcelaPedidoCompleto = {
  numero: number;
  total_parcelas: number;
  prazo_dias: number;
  vencimento: string;
  valor: number;
};

export type ContaPagarPedidoCompleto = {
  fornecedor_id: string | null;
  fornecedor_nome: string;
  valor: number;
};

export type CriarPedidoCompletoInput = {
  idempotencyKey: string;
  pedido: {
    cliente_id: string;
    data_pedido: string;
    data_entrega_prevista: string | null;
    data_entrega_real: string | null;
    tipo: string;
    status: string;
    condicao_pagamento: string;
    observacoes: string;
    valor_total: number;
    valor_comissao: number;
    valor_custo_total: number;
    lucro_total: number;
  };
  itens: ItemPedidoCompleto[];
  contasReceber: ParcelaPedidoCompleto[];
  contasPagar: ContaPagarPedidoCompleto[];
};

export type CriarPedidoCompletoResult = {
  pedido_id: string;
  numero: string;
  valor_total: number;
  valor_custo_total: number;
  lucro_total: number;
  valor_comissao: number;
  itens_criados: number;
  parcelas_criadas: number;
  contas_pagar_criadas: number;
  comissoes_criadas?: number;
  reutilizado: boolean;
};

export async function criarPedidoCompleto(
  input: CriarPedidoCompletoInput
): Promise<CriarPedidoCompletoResult> {
  const { data, error } = await supabase.rpc("criar_pedido_completo", {
    p_idempotency_key: input.idempotencyKey,
    p_pedido: input.pedido,
    p_itens: input.itens,
    p_contas_receber: input.contasReceber,
    p_contas_pagar: input.contasPagar,
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object") {
    throw new Error("O banco não retornou o resumo do pedido criado.");
  }

  return data as CriarPedidoCompletoResult;
}
