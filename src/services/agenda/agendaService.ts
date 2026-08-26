import { supabase } from "@/lib/supabase";
import type { AgendaCliente, AgendaVisita } from "@/types/agenda";
import { listarClientesAgendaOffline, listarVisitasAgendaOffline, navegadorOnline, salvarCacheAgenda } from "../../lib/offline/agendaOffline";

export async function carregarClientes(): Promise<AgendaCliente[]> {
  if (!navegadorOnline()) return listarClientesAgendaOffline();
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, razao_social, nome_fantasia, cidade, estado")
      .order("razao_social", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AgendaCliente[];
  } catch {
    return listarClientesAgendaOffline();
  }
}

export async function carregarVisitas(): Promise<AgendaVisita[]> {
  if (!navegadorOnline()) return listarVisitasAgendaOffline();
  try {
    const { data, error } = await supabase
      .from("visitas")
      .select("id, cliente_id, contato_avulso_nome, contato_avulso_empresa, contato_avulso_telefone, contato_avulso_endereco, data_visita, hora_visita, tipo_contato, bairro, status, resultado, oportunidade, valor_potencial, observacoes, alerta_retorno, pessoa_atendida, proxima_acao, data_retorno, lembrete_em, concluida, iniciada_em, prioridade, prazo_resolucao, checklist, clientes(razao_social, cidade, estado)")
      .order("data_visita", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as AgendaVisita[];
  } catch {
    return listarVisitasAgendaOffline();
  }
}

export function atualizarCacheAgenda(clientes: AgendaCliente[], visitas: AgendaVisita[]) { salvarCacheAgenda(clientes, visitas); }
