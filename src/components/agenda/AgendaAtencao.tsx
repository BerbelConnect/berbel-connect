import { listarVisitasQuePrecisamAtencao } from "@/lib/agendaAtencao";
import { nomeExibicaoVisita, type AgendaVisita } from "@/types/agenda";

export function AgendaAtencao({ visitas, hoje, onAbrir }: { visitas: AgendaVisita[]; hoje: string; onAbrir: (visita: AgendaVisita) => void }) {
  const itens = listarVisitasQuePrecisamAtencao(visitas, hoje);
  if (!itens.length) return <section className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"><h3 className="font-bold text-green-800">Precisa de atenção</h3><p className="mt-1 text-sm text-green-700">Nenhuma pendência crítica no momento.</p></section>;
  return <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-bold text-amber-900">Precisa de atenção</h3><p className="text-sm text-amber-800">{itens.length} compromisso(s) exigem ação</p></div></div>
    <div className="grid gap-3 md:grid-cols-2">{itens.map(({ visita, motivos, nivel }) => <div key={visita.id} className="rounded-xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><strong>{nomeExibicaoVisita(visita)}</strong><span className={nivel === "Urgente" ? "rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700" : "rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700"}>{nivel}</span></div><ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}</ul><button onClick={() => onAbrir(visita)} className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Abrir compromisso</button></div>)}</div>
  </section>;
}
