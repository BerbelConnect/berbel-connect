import type { AgendaVisualizacao } from "@/types/agenda";
import Link from "next/link";

type Props = {
  visualizacao: AgendaVisualizacao;
  referencia: string;
  onVisualizacao: (valor: AgendaVisualizacao) => void;
  onReferencia: (valor: string) => void;
};

export function AgendaViewSelector({ visualizacao, referencia, onVisualizacao, onReferencia }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Visualização</p>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(["dia", "semana", "mes"] as const).map((item) => (
            <button key={item} onClick={() => onVisualizacao(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${visualizacao === item ? "bg-blue-700 text-white" : "text-slate-600"}`}>
              {item === "dia" ? "Dia" : item === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3"><Link href={`/rotas?data=${encodeURIComponent(referencia)}`} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Planejar rota desta data</Link><label className="text-sm font-semibold text-slate-600">
        Data de referência
        <input type="date" value={referencia} onChange={(e) => onReferencia(e.target.value)} className="ml-3 rounded-xl border border-slate-200 px-4 py-2" />
      </label></div>
    </div>
  );
}
