import type { ContaReceberResumo } from "@/types/historicoCliente";
import { formatarData, moeda, formatarTexto } from "./fichaHelpers";

export function FichaFinanceiroTab({ contasReceber }: { contasReceber: ContaReceberResumo[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Financeiro</h3>
        <p className="text-sm text-slate-500">Contas a receber em aberto para o cliente.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Forma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contasReceber.length > 0 ? (
              contasReceber.map((conta) => (
                <tr key={conta.id}>
                  <td className="px-4 py-4">{formatarTexto(conta.descricao)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{moeda(conta.valor)}</td>
                  <td className="px-4 py-4">{formatarData(conta.vencimento)}</td>
                  <td className="px-4 py-4">{formatarTexto(conta.status)}</td>
                  <td className="px-4 py-4">{formatarTexto(conta.forma_pagamento)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma conta a receber encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
