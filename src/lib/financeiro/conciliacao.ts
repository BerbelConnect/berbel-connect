import { supabase } from "@/lib/supabase";

export async function conciliarMovimento(input: {
  movimentoId: string;
  data: string;
  referencia: string;
  observacoes?: string;
}) {
  const { data, error } = await supabase.rpc("conciliar_movimento_financeiro", {
    p_movimento_id: input.movimentoId,
    p_data_conciliacao: input.data,
    p_referencia: input.referencia.trim(),
    p_observacoes: input.observacoes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function desfazerConciliacao(input: {
  movimentoId: string;
  motivo: string;
}) {
  const { data, error } = await supabase.rpc("desfazer_conciliacao_financeira", {
    p_movimento_id: input.movimentoId,
    p_motivo: input.motivo.trim(),
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function confirmarConciliacaoExtrato(input: {
  lancamentoId: string;
  movimentoId?: string | null;
  observacoes?: string;
}) {
  const { data, error } = await supabase.rpc("confirmar_conciliacao_extrato", {
    p_lancamento_id: input.lancamentoId,
    p_movimento_id: input.movimentoId || null,
    p_observacoes: input.observacoes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return data;
}
