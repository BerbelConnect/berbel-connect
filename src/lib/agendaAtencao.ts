import type { AgendaVisita } from "@/types/agenda";

export type AgendaAtencaoItem = { visita: AgendaVisita; motivos: string[]; nivel: "Urgente" | "Atenção" | "Pendente" };

export function listarVisitasQuePrecisamAtencao(visitas: AgendaVisita[], hoje: string): AgendaAtencaoItem[] {
  return visitas.flatMap((visita) => {
    if (visita.status === "Cancelada") return [];
    const motivos: string[] = [];
    if (visita.status !== "Concluída" && visita.data_visita < hoje) motivos.push("Compromisso atrasado");
    if (visita.prazo_resolucao && visita.prazo_resolucao < hoje && visita.status !== "Concluída") motivos.push("Prazo de resolução vencido");
    if (visita.status === "Aguardando retorno") motivos.push("Aguardando retorno");
    if ((visita.quantidade_transferencias || 0) > 0 && visita.status !== "Concluída") motivos.push("Compromisso transferido e ainda não resolvido");
    if (visita.data_retorno && visita.data_retorno <= hoje && visita.proxima_acao) motivos.push("Próxima ação precisa ser realizada");
    const checklist = visita.checklist || [];
    if (visita.data_visita <= hoje && checklist.some((item) => !item.concluido) && visita.status !== "Concluída") motivos.push("Checklist incompleto");
    if (!motivos.length) return [];
    const nivel = visita.prioridade === "Urgente" || motivos.some((motivo) => motivo.includes("vencido")) ? "Urgente" : visita.status === "Aguardando retorno" ? "Atenção" : "Pendente";
    return [{ visita, motivos, nivel }];
  });
}
