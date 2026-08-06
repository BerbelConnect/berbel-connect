export const FUSO_HORARIO_BRASIL = "America/Sao_Paulo";

type PartesData = {
  ano: number;
  mes: number;
  dia: number;
};

function partesNoFuso(instante: Date, fusoHorario = FUSO_HORARIO_BRASIL): PartesData {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fusoHorario,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value || 0);

  return { ano: valor("year"), mes: valor("month"), dia: valor("day") };
}

function doisDigitos(valor: number) {
  return String(valor).padStart(2, "0");
}

function montarDataIso({ ano, mes, dia }: PartesData) {
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

export function dataIsoBrasil(instante = new Date()) {
  return montarDataIso(partesNoFuso(instante));
}

export function mesIsoBrasil(instante = new Date()) {
  return dataIsoBrasil(instante).slice(0, 7);
}

export function inicioMesBrasil(instante = new Date()) {
  return `${mesIsoBrasil(instante)}-01`;
}

export function fimMesBrasil(instante = new Date()) {
  const { ano, mes } = partesNoFuso(instante);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return montarDataIso({ ano, mes, dia: ultimoDia });
}

export function adicionarDiasDataIso(dataIso: string, dias: number) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return data.toISOString().slice(0, 10);
}

export function adicionarMesesDataIso(dataIso: string, meses: number) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-").map(Number);
  const primeiroDiaDestino = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const anoDestino = primeiroDiaDestino.getUTCFullYear();
  const mesDestino = primeiroDiaDestino.getUTCMonth() + 1;
  const ultimoDiaDestino = new Date(Date.UTC(anoDestino, mesDestino, 0)).getUTCDate();

  return montarDataIso({
    ano: anoDestino,
    mes: mesDestino,
    dia: Math.min(dia, ultimoDiaDestino),
  });
}
