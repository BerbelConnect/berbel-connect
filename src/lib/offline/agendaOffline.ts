import type { AgendaCliente, AgendaResultadoFormData, AgendaVisita, AgendaVisitaFormData } from "@/types/agenda";

export type OperacaoAgendaOffline =
  | { id: string; tipo: "salvar"; criado_em: string; form: AgendaVisitaFormData }
  | { id: string; tipo: "resultado"; criado_em: string; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { id: string; tipo: "iniciar"; criado_em: string; visita_id: string };
type NovaOperacaoAgenda =
  | { tipo: "salvar"; form: AgendaVisitaFormData }
  | { tipo: "resultado"; visita: AgendaVisita; resultado: AgendaResultadoFormData }
  | { tipo: "iniciar"; visita_id: string };
const FILA = "berbel_connect_agenda_offline_v1";
const VISITAS = "berbel_connect_agenda_cache_v1";
const CLIENTES = "berbel_connect_agenda_clientes_v1";
function ler<T>(chave: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(chave) || "") as T; } catch { return fallback; } }
function gravar(chave: string, valor: unknown) { if (typeof window === "undefined" || typeof localStorage === "undefined") return; localStorage.setItem(chave, JSON.stringify(valor)); window.dispatchEvent(new Event("berbel:agenda-offline-atualizada")); }
export function listarOperacoesAgendaOffline() { return ler<OperacaoAgendaOffline[]>(FILA, []); }
export function contarOperacoesAgendaOffline() { return listarOperacoesAgendaOffline().length; }
export function enfileirarOperacaoAgenda(operacao: NovaOperacaoAgenda) { const item = { ...operacao, id: crypto.randomUUID(), criado_em: new Date().toISOString() } as OperacaoAgendaOffline; gravar(FILA, [...listarOperacoesAgendaOffline(), item]); return item; }
export function removerOperacaoAgenda(id: string) { gravar(FILA, listarOperacoesAgendaOffline().filter((item) => item.id !== id)); }
export function salvarCacheAgenda(clientes: AgendaCliente[], visitas: AgendaVisita[]) { gravar(CLIENTES, clientes); gravar(VISITAS, visitas); }
export function listarClientesAgendaOffline() { return ler<AgendaCliente[]>(CLIENTES, []); }
export function listarVisitasAgendaOffline() { return ler<AgendaVisita[]>(VISITAS, []); }
export function navegadorOnline() { return typeof navigator === "undefined" || typeof navigator.onLine !== "boolean" || navigator.onLine; }
