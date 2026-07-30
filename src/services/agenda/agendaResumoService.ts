import type { AgendaResumo, AgendaVisita } from "@/types/agenda";
import { hojeISO } from "@/lib/agendaHelpers";

export function gerarResumo(visitas: AgendaVisita[]): AgendaResumo {
  const hoje = hojeISO();

  const visitasFiltradas = visitas;

  const hojeCount = visitasFiltradas.filter(
    (v) => v.data_visita === hoje
  ).length;

  const atrasadasCount = visitasFiltradas.filter(
    (v) => v.data_visita < hoje && v.status !== "Concluída"
  ).length;

  const proximasCount = visitasFiltradas.filter(
    (v) => v.data_visita > hoje && v.status !== "Concluída"
  ).length;

  const concluidasCount = visitasFiltradas.filter(
    (v) => v.status === "Concluída"
  ).length;

  const potencialTotal = visitasFiltradas.reduce(
    (soma, v) => soma + Number(v.valor_potencial || 0),
    0
  );

  return {
    hojeCount,
    atrasadasCount,
    proximasCount,
    concluidasCount,
    potencialTotal,
  };
}
