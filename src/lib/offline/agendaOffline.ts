import type { AgendaCliente, AgendaResultadoFormData, AgendaVisita, AgendaVisitaFormData } from "@/types/agenda";

export type OperacaoAgendaOffline =
  | { id: string; tipo: "salvar"; criado_em: string; form: AgendaVisitaFormData }
  | { id: string; tipo: "resultado"; criado_em: string; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { id: string; tipo: "progresso"; criado_em: string; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { id: string; tipo: "iniciar"; criado_em: string; visita_id: string };
type NovaOperacaoAgenda =
  | { tipo: "salvar"; form: AgendaVisitaFormData }
  | { tipo: "resultado"; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { tipo: "progresso"; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { tipo: "iniciar"; visita_id: string };
const FILA = "berbel_connect_agenda_offline_v1";
const VISITAS = "berbel_connect_agenda_cache_v1";
const CLIENTES = "berbel_connect_agenda_clientes_v1";
function ler<T>(chave: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(chave) || "") as T; } catch { return fallback; } }
function gravar(chave: string, valor: unknown) { if (typeof window === "undefined" || typeof localStorage === "undefined") return; localStorage.setItem(chave, JSON.stringify(valor)); window.dispatchEvent(new Event("berbel:agenda-offline-atualizada")); }
export function listarOperacoesAgendaOffline() { return ler<OperacaoAgendaOffline[]>(FILA, []); }
export function contarOperacoesAgendaOffline() { return listarOperacoesAgendaOffline().length; }
export function enfileirarOperacaoAgenda(operacao: NovaOperacaoAgenda) {
  const item = { ...operacao, id: crypto.randomUUID(), criado_em: new Date().toISOString() } as OperacaoAgendaOffline;
  gravar(FILA, [...listarOperacoesAgendaOffline(), item]);
  const visitas = listarVisitasAgendaOffline();
  if (item.tipo === "salvar") {
    const form = item.form;
    const visita: AgendaVisita = {
      id: form.id || `offline-${item.id}`,
      cliente_id: form.contato_avulso ? null : form.cliente_id,
      contato_avulso_nome: form.contato_avulso_nome,
      contato_avulso_empresa: form.contato_avulso_empresa,
      contato_avulso_telefone: form.contato_avulso_telefone,
      contato_avulso_endereco: form.contato_avulso_endereco,
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
      pessoa_atendida: form.pessoa_atendida,
      proxima_acao: form.proxima_acao,
      data_retorno: form.data_retorno,
      lembrete_em: form.lembrete_em,
      lembrete_antecedencia_minutos: form.lembrete_antecedencia_minutos,
      lembrete_repetir: form.lembrete_repetir,
      lembrete_intervalo_minutos: form.lembrete_intervalo_minutos,
      prioridade: form.prioridade,
      prazo_resolucao: form.prazo_resolucao,
      checklist: form.checklist,
    };
    gravar(VISITAS, [visita, ...visitas.filter((atual) => atual.id !== visita.id)]);
  } else if (item.tipo === "iniciar") {
    gravar(VISITAS, visitas.map((visita) => visita.id === item.visita_id ? { ...visita, status: "Em andamento", iniciada_em: item.criado_em } : visita));
  } else if (item.tipo === "resultado") {
    const atualizadas = visitas.map((visita) => visita.id === item.visita.id ? { ...visita, status: "Concluída", concluida: true, pessoa_atendida: item.resultado.pessoa_atendida, resultado: item.resultado.resultado, proxima_acao: item.resultado.proxima_acao, data_retorno: item.resultado.data_retorno, lembrete_em: item.resultado.lembrete_em, checklist: item.resultado.checklist, retorno_criado_id: item.resultado.agendar_retorno ? `offline-retorno-${item.visita.id}` : visita.retorno_criado_id } : visita);
    if (item.resultado.agendar_retorno && item.resultado.data_retorno) {
      const retornoId = `offline-retorno-${item.visita.id}`;
      const retorno: AgendaVisita = {
        ...item.visita,
        id: retornoId,
        data_visita: item.resultado.data_retorno,
        hora_visita: item.resultado.hora_retorno || null,
        status: "Agendada",
        resultado: "",
        observacoes: `Retorno: ${item.resultado.proxima_acao}`,
        proxima_acao: item.resultado.proxima_acao,
        prioridade: item.resultado.prioridade_retorno,
        lembrete_em: item.resultado.lembrete_em,
        alerta_retorno: Boolean(item.resultado.lembrete_em),
        concluida: false,
        iniciada_em: null,
        visita_origem_id: item.visita.id,
        retorno_criado_id: null,
        checklist: [],
      };
      gravar(VISITAS, [retorno, ...atualizadas.filter((visita) => visita.id !== retornoId)]);
    } else {
      gravar(VISITAS, atualizadas);
    }
  } else {
    gravar(VISITAS, visitas.map((visita) => visita.id === item.visita.id ? { ...visita, status: "Em andamento", pessoa_atendida: item.resultado.pessoa_atendida, resultado: item.resultado.resultado, proxima_acao: item.resultado.proxima_acao, data_retorno: item.resultado.data_retorno, lembrete_em: item.resultado.lembrete_em, checklist: item.resultado.checklist } : visita));
  }
  return item;
}
export function removerOperacaoAgenda(id: string) { gravar(FILA, listarOperacoesAgendaOffline().filter((item) => item.id !== id)); }
export function salvarCacheAgenda(clientes: AgendaCliente[], visitas: AgendaVisita[]) { gravar(CLIENTES, clientes); gravar(VISITAS, visitas); }
export function listarClientesAgendaOffline() { return ler<AgendaCliente[]>(CLIENTES, []); }
export function listarVisitasAgendaOffline() { return ler<AgendaVisita[]>(VISITAS, []); }
export function navegadorOnline() { return typeof navigator === "undefined" || typeof navigator.onLine !== "boolean" || navigator.onLine; }
