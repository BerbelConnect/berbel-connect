import type { AgendaVisita } from "@/types/agenda";

export function filtrarVisitas(visitas: AgendaVisita[], busca: string): AgendaVisita[] {
  const texto = busca.toLowerCase();

  return visitas.filter((visita) =>
    [
      visita.clientes?.razao_social,
      visita.bairro,
      visita.status,
      visita.tipo_contato,
      visita.resultado,
      visita.oportunidade,
    ]
      .join(" ")
      .toLowerCase()
      .includes(texto)
  );
}
