import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AgendaResultadoFormData, AgendaVisita, AgendaVisitaFormData } from "@/types/agenda";
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
    pessoa_atendida: form.pessoa_atendida || null,
    proxima_acao: form.proxima_acao || null,
    data_retorno: form.data_retorno || null,
    lembrete_em: form.lembrete_em || null,
  };

  const { error } = form.id
    ? await supabase.from("visitas").update(payload).eq("id", form.id)
    : await supabase.from("visitas").insert(payload);

  return error;
}

export async function registrarResultadoVisita(
  visita: AgendaVisita,
  form: AgendaResultadoFormData
): Promise<PostgrestError | null> {
  const lembreteIso = form.lembrete_em
    ? new Date(form.lembrete_em).toISOString()
    : null;
  const { error } = await supabase.rpc("concluir_visita_com_retorno", {
    p_visita_id: visita.id,
    p_pessoa_atendida: form.pessoa_atendida || null,
    p_resultado: form.resultado,
    p_proxima_acao: form.proxima_acao || null,
    p_data_retorno: form.data_retorno || null,
    p_hora_retorno: form.hora_retorno || null,
    p_lembrete_em: lembreteIso,
    p_agendar_retorno: form.agendar_retorno,
  });

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
