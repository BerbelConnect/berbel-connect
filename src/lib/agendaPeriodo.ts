import type { AgendaVisita, AgendaVisualizacao } from "@/types/agenda";

function parseData(data: string) {
  return new Date(`${data}T12:00:00`);
}

function isoLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function intervaloAgenda(referencia: string, visualizacao: AgendaVisualizacao) {
  const data = parseData(referencia);
  let inicio = new Date(data);
  let fim = new Date(data);

  if (visualizacao === "semana") {
    const deslocamento = (data.getDay() + 6) % 7;
    inicio.setDate(data.getDate() - deslocamento);
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else if (visualizacao === "mes") {
    inicio = new Date(data.getFullYear(), data.getMonth(), 1, 12);
    fim = new Date(data.getFullYear(), data.getMonth() + 1, 0, 12);
  }

  return { inicio: isoLocal(inicio), fim: isoLocal(fim) };
}

export function filtrarPorPeriodo(
  visitas: AgendaVisita[],
  referencia: string,
  visualizacao: AgendaVisualizacao
) {
  const { inicio, fim } = intervaloAgenda(referencia, visualizacao);
  return visitas.filter((visita) => visita.data_visita >= inicio && visita.data_visita <= fim);
}

export function diasDoCalendarioMes(referencia: string) {
  const data = parseData(referencia);
  const primeiro = new Date(data.getFullYear(), data.getMonth(), 1, 12);
  const inicio = new Date(primeiro);
  inicio.setDate(primeiro.getDate() - primeiro.getDay());
  return Array.from({ length: 42 }, (_, indice) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + indice);
    return { data: isoLocal(dia), pertenceAoMes: dia.getMonth() === data.getMonth() };
  });
}
