import { dataIsoBrasil } from "@/lib/dataBrasil";
import { supabase } from "@/lib/supabase";

type VisitaRow = {
  id: string;
  hora_visita?: string | null;
  tipo_contato?: string | null;
  status?: string | null;
  clientes?: { razao_social?: string | null } | null;
};

function hojeISO() {
  return dataIsoBrasil();
}

export async function carregarAgendaResumo() {
  const hoje = hojeISO();

  const [visitasHojeResp, visitasAtrasadasResp] = await Promise.all([
    supabase
      .from("visitas")
      .select("id")
      .eq("data_visita", hoje)
      .order("hora_visita", { ascending: true }),
    supabase
      .from("visitas")
      .select("id")
      .lt("data_visita", hoje)
      .neq("status", "ConcluÃ­da"),
  ]);

  return {
    visitasHojeCount: visitasHojeResp.data?.length || 0,
    visitasAtrasadasCount: visitasAtrasadasResp.data?.length || 0,
  };
}

export async function carregarVisitasHoje() {
  const hoje = hojeISO();

  const { data, error } = await supabase
    .from("visitas")
    .select("id, hora_visita, tipo_contato, status, clientes(razao_social)")
    .eq("data_visita", hoje)
    .order("hora_visita", { ascending: true })
    .limit(5);

  if (error) {
    throw error;
  }

  const visitas = (data || []) as VisitaRow[];

  return visitas.map((visita) => ({
    id: visita.id,
    hora_visita: visita.hora_visita || "",
    tipo_contato: visita.tipo_contato || null,
    status: visita.status || null,
    cliente_nome: visita.clientes?.razao_social || null,
  }));
}
