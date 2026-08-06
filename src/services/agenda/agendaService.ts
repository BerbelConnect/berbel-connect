import { supabase } from "@/lib/supabase";
import type { AgendaCliente, AgendaVisita } from "@/types/agenda";

export async function carregarClientes(): Promise<AgendaCliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, razao_social, cidade, estado")
    .order("razao_social", { ascending: true });

  if (error) throw error;

  return (data ?? []) as AgendaCliente[];
}

export async function carregarVisitas(): Promise<AgendaVisita[]> {
  const { data, error } = await supabase
    .from("visitas")
    .select("id, cliente_id, data_visita, hora_visita, tipo_contato, bairro, status, resultado, oportunidade, valor_potencial, observacoes, alerta_retorno, pessoa_atendida, proxima_acao, data_retorno, lembrete_em, concluida, clientes(razao_social, cidade, estado)")
    .order("data_visita", { ascending: true });

  if (error) throw error;

  return (data ?? []) as unknown as AgendaVisita[];
}
