import type { VisitaResumo } from "@/types/historicoCliente";
import { formatarData, formatarTexto } from "./fichaHelpers";

export function FichaVisitasTab({ visitas }: { visitas: VisitaResumo[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Visitas</h3>
        <p className="text-sm text-slate-500">Registros de visitas e follow-up junto ao cliente.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Atendido</th>
              <th className="px-4 py-3">Resumo</th>
              <th className="px-4 py-3">Próxima ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visitas.length > 0 ? (
              visitas.map((visita) => (
                <tr key={visita.id}>
                  <td className="px-4 py-4"><div>{formatarData(visita.data_visita)}</div>{visita.visita_origem_id && <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Retorno</span>}{visita.retorno_criado_id && <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Gerou retorno</span>}</td>
                  <td className="px-4 py-4">{formatarTexto(visita.hora_visita)}</td>
                  <td className="px-4 py-4">{formatarTexto(visita.tipo)}</td>
                  <td className="px-4 py-4">{formatarTexto(visita.pessoa_atendida)}</td>
                  <td className="px-4 py-4">{formatarTexto(visita.resumo)}</td>
                  <td className="px-4 py-4">{formatarTexto(visita.proxima_acao)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma visita encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
