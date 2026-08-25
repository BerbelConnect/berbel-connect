import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AgendaResultadoFormData, AgendaVisita, AgendaVisitaFormData } from "@/types/agenda";
import { alterarArquivamentoComercial } from "@/services/arquivamentoComercial";
import { enfileirarOperacaoAgenda, navegadorOnline } from "../../lib/offline/agendaOffline";

export async function salvarVisitaOnline(
  form: AgendaVisitaFormData
): Promise<PostgrestError | null> {
  const payload = {
    cliente_id: form.contato_avulso ? null : form.cliente_id,
    contato_avulso_nome: form.contato_avulso ? form.contato_avulso_nome.trim() : null,
    contato_avulso_empresa: form.contato_avulso ? form.contato_avulso_empresa.trim() || null : null,
    contato_avulso_telefone: form.contato_avulso ? form.contato_avulso_telefone.trim() || null : null,
    contato_avulso_endereco: form.contato_avulso ? form.contato_avulso_endereco.trim() || null : null,
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

export async function salvarVisita(form: AgendaVisitaFormData): Promise<Error | null> {
  if (!navegadorOnline()) { enfileirarOperacaoAgenda({ tipo: "salvar", form }); return null; }
  try {
    const error = await salvarVisitaOnline(form);
    if (error && /fetch|network|conex/i.test(error.message)) { enfileirarOperacaoAgenda({ tipo: "salvar", form }); return null; }
    return error;
  } catch { enfileirarOperacaoAgenda({ tipo: "salvar", form }); return null; }
}

export async function registrarResultadoVisitaOnline(
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

export async function registrarResultadoVisita(visita: AgendaVisita, form: AgendaResultadoFormData): Promise<Error | null> {
  if (!navegadorOnline()) { enfileirarOperacaoAgenda({ tipo: "resultado", visita, resultado: form }); return null; }
  try {
    const error = await registrarResultadoVisitaOnline(visita, form);
    if (error && /fetch|network|conex/i.test(error.message)) { enfileirarOperacaoAgenda({ tipo: "resultado", visita, resultado: form }); return null; }
    return error;
  } catch { enfileirarOperacaoAgenda({ tipo: "resultado", visita, resultado: form }); return null; }
}

export async function iniciarVisitaOnline(id: string): Promise<Error | null> {
  const { error } = await supabase.from("visitas").update({ status: "Em andamento", iniciada_em: new Date().toISOString() }).eq("id", id);
  return error;
}
export async function iniciarVisita(id: string): Promise<Error | null> {
  if (!navegadorOnline()) { enfileirarOperacaoAgenda({ tipo: "iniciar", visita_id: id }); return null; }
  try {
    const error = await iniciarVisitaOnline(id);
    if (error && /fetch|network|conex/i.test(error.message)) { enfileirarOperacaoAgenda({ tipo: "iniciar", visita_id: id }); return null; }
    return error;
  } catch { enfileirarOperacaoAgenda({ tipo: "iniciar", visita_id: id }); return null; }
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
