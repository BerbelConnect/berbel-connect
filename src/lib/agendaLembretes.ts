import type { AgendaVisita } from "@/types/agenda";

export function dataLembreteVisita(visita: AgendaVisita): Date | null {
  if (visita.lembrete_em) {
    const explicito = new Date(visita.lembrete_em);
    if (!Number.isNaN(explicito.getTime())) return explicito;
  }
  if (!visita.data_visita || !visita.hora_visita) return null;
  const compromisso = new Date(`${visita.data_visita}T${visita.hora_visita}`);
  if (Number.isNaN(compromisso.getTime())) return null;
  compromisso.setMinutes(compromisso.getMinutes() - (visita.lembrete_antecedencia_minutos ?? 30));
  return compromisso;
}

export function lembretePendente(visita: AgendaVisita, agora = new Date()) {
  if (["Concluída", "Cancelada"].includes(visita.status)) return false;
  const data = dataLembreteVisita(visita);
  return Boolean(data && data.getTime() <= agora.getTime());
}

export function podeRepetirNotificacao(visita: AgendaVisita, ultimoEnvio: string | null, agora = new Date()) {
  if (!lembretePendente(visita, agora)) return false;
  if (!ultimoEnvio) return true;
  if (visita.lembrete_repetir === false) return false;
  const ultimo = new Date(ultimoEnvio).getTime();
  const intervalo = (visita.lembrete_intervalo_minutos ?? 30) * 60_000;
  return Number.isNaN(ultimo) || agora.getTime() - ultimo >= intervalo;
}
