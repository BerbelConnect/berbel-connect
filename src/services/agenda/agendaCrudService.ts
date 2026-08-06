import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AgendaVisita, AgendaVisitaFormData } from "@/types/agenda";
import { alterarArquivamentoComercial } from "@/services/arquivamentoComercial";

export async function salvarVisita(
  form: AgendaVisitaFormData
): Promise<PostgrestError | null> {
  const payload = {
    cliente_id: form.cliente_id,
    data_visita: form.data_visita,
    hora_visita: form.hora_visita || null,
    tipo_contato: form.tipo_contato,
    bairro: form.bairro,
    status: form.status,
    resultado: form.resultado,
    oportunidade: form.oportunidade,
    valor_potencial: Number(form.valor_potencial || 0),
    observacoes: form.observacoes,
    alerta_retorno: form.alerta_retorno,
  };

  const { error } = form.id
    ? await supabase.from("visitas").update(payload).eq("id", form.id)
    : await supabase.from("visitas").insert(payload);

  return error;
}

export async function concluirVisita(
  visita: AgendaVisita
): Promise<PostgrestError | null> {
  const { error } = await supabase
    .from("visitas")
    .update({
      status: "Concluída",
      resultado: visita.resultado || "Visita concluída",
    })
    .eq("id", visita.id);

  return error;
}

export async function alterarCancelamentoVisita(id: string, motivo: string, cancelar: boolean): Promise<Error | null> {
  try { await alterarArquivamentoComercial("visitas", id, motivo, cancelar); return null; }
  catch (error) { return error as Error; }
}
