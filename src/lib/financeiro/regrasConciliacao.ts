import { supabase } from "@/lib/supabase";

export type TipoMovimentoRegra =
  | "qualquer"
  | "contas_pagar"
  | "contas_receber";

export type RegraConciliacao = {
  id: string;
  nome: string;
  termo_descricao: string | null;
  tipo_movimento: TipoMovimentoRegra;
  tolerancia_valor: number;
  tolerancia_dias: number;
  prioridade: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type RegraConciliacaoInput = Omit<
  RegraConciliacao,
  "id" | "created_at" | "updated_at"
>;

export async function listarRegrasConciliacao() {
  const { data, error } = await supabase
    .from("regras_conciliacao_automatica")
    .select("*")
    .order("prioridade", { ascending: false })
    .order("nome");

  if (error) throw error;
  return (data ?? []) as RegraConciliacao[];
}

export async function salvarRegraConciliacao(
  input: RegraConciliacaoInput,
  id?: string
) {
  const payload = {
    ...input,
    nome: input.nome.trim(),
    termo_descricao: input.termo_descricao?.trim() || null,
  };

  if (id) {
    const { error } = await supabase
      .from("regras_conciliacao_automatica")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("regras_conciliacao_automatica")
    .insert(payload);
  if (error) throw error;
}

export async function alterarEstadoRegra(id: string, ativo: boolean) {
  const { error } = await supabase
    .from("regras_conciliacao_automatica")
    .update({ ativo })
    .eq("id", id);
  if (error) throw error;
}

