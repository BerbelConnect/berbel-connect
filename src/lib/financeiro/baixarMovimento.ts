import { supabase } from "@/lib/supabase";

export type TipoBaixa = "conta_receber" | "conta_pagar" | "comissao";

const funcoes: Record<TipoBaixa, string> = {
  conta_receber: "baixar_conta_receber",
  conta_pagar: "baixar_conta_pagar",
  comissao: "baixar_comissao",
};

export async function baixarMovimento(input: {
  tipo: TipoBaixa;
  id: string;
  data: string;
  formaPagamento?: string;
  motivo: string;
}) {
  const motivo = input.motivo.trim();
  if (!motivo) throw new Error("Informe o motivo da baixa.");

  const { data, error } = await supabase.rpc(funcoes[input.tipo], {
    p_id: input.id,
    p_data: input.data,
    p_forma_pagamento: input.formaPagamento?.trim() || null,
    p_motivo: motivo,
  });

  if (error) throw new Error(error.message);
  return data;
}
