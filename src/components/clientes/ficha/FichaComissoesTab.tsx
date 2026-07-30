import type { ComissaoResumo } from "@/types/historicoCliente";
import { formatarData, moeda } from "./fichaHelpers";

export function FichaComissoesTab({ comissoes }: { comissoes: ComissaoResumo[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Comissões</h3>
        <p className="text-sm text-slate-500">Movimentações de comissões associadas ao cliente.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Recebimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pedido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comissoes.length > 0 ? (
              comissoes.map((comissao) => (
                <tr key={comissao.id}>
                  <td className="px-4 py-4">{formatarData(comissao.data_recebimento)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{moeda(comissao.valor_comissao)}</td>
                  <td className="px-4 py-4">{comissao.status || "-"}</td>
                  <td className="px-4 py-4">{comissao.pedido_id || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma comissão encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
