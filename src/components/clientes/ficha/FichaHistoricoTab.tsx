import type { HistoricoClienteDados } from "@/types/historicoCliente";
import { formatarData, formatarTexto } from "./fichaHelpers";

export function FichaHistoricoTab({ historico }: { historico: HistoricoClienteDados }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Histórico</h3>
        <p className="text-sm text-slate-500">Linha do tempo com eventos principais do cliente.</p>
      </div>

      <div className="space-y-4">
        {historico.timeline.length > 0 ? (
          historico.timeline.map((evento) => (
            <div key={evento.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{evento.titulo}</p>
                  <p className="text-sm text-slate-500">{evento.categoria}</p>
                </div>
                <p className="text-sm text-slate-500">{formatarData(evento.data)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">{formatarTexto(evento.descricao)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>
        )}
      </div>
    </div>
  );
}
