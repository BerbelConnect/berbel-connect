import type { PedidoResumo } from "@/types/historicoCliente";
import { formatarData, moeda, formatarTexto } from "./fichaHelpers";

export function FichaPedidosTab({ pedidos }: { pedidos: PedidoResumo[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Pedidos</h3>
          <p className="text-sm text-slate-500">Histórico de pedidos registrados para o cliente.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          {pedidos.length} pedidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Comissão</th>
              <th className="px-4 py-3">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="px-4 py-4 font-semibold text-slate-800">{formatarTexto(pedido.numero)}</td>
                  <td className="px-4 py-4">{formatarData(pedido.data_pedido)}</td>
                  <td className="px-4 py-4">{formatarTexto(pedido.status)}</td>
                  <td className="px-4 py-4">{formatarTexto(pedido.tipo)}</td>
                  <td className="px-4 py-4 font-semibold text-blue-700">{moeda(pedido.valor_total)}</td>
                  <td className="px-4 py-4 font-semibold text-green-700">{moeda(pedido.valor_comissao)}</td>
                  <td className="px-4 py-4">{formatarTexto(pedido.observacoes)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
