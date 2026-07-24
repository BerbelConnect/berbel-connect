import { supabase } from "@/lib/supabase";
import type { TipoBaixa } from "@/lib/financeiro/baixarMovimento";

const funcoes: Record<TipoBaixa, string> = {
  conta_receber: "estornar_conta_receber",
  conta_pagar: "estornar_conta_pagar",
  comissao: "estornar_comissao",
};

export async function estornarMovimento(input: {
  tipo: TipoBaixa;
  id: string;
  motivo: string;
}) {
  const motivo = input.motivo.trim();
  if (motivo.length < 3) {
    throw new Error("Informe o motivo do estorno com pelo menos 3 caracteres.");
  }

  const { data, error } = await supabase.rpc(funcoes[input.tipo], {
    p_id: input.id,
    p_motivo: motivo,
  });

  if (error) throw new Error(error.message);
  return data;
}
