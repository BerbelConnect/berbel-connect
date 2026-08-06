import { supabase } from "@/lib/supabase";
import { normalizarMotivoArquivamento } from "@/lib/arquivamentoComercial";

export type ModuloArquivavel = "clientes" | "produtos" | "fornecedores" | "representadas" | "pipeline" | "metas" | "visitas";

export async function alterarArquivamentoComercial(modulo: ModuloArquivavel, registroId: string, motivo: string, arquivar = true) {
  const { data, error } = await supabase.rpc("alterar_arquivamento_comercial", {
    p_modulo: modulo,
    p_registro_id: registroId,
    p_motivo: normalizarMotivoArquivamento(motivo),
    p_arquivar: arquivar,
  });
  if (error) throw error;
  return data;
}
