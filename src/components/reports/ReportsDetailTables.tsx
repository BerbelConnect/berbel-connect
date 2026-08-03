"use client";

import type { ReportComissao, ReportPedido } from "@/types/reports";

type Props = {
  pedidos: ReportPedido[];
  comissoes: ReportComissao[];
};

function formatCurrency(value: number | null) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR");
}

function getClienteNome(
  clientes: ReportPedido["clientes"] | ReportComissao["clientes"],
) {
  if (!clientes) return "Cliente não informado";
  if (Array.isArray(clientes)) {
    return clientes[0]?.razao_social || "Cliente não informado";
  }
  return clientes.razao_social || "Cliente não informado";
}

function EmptyRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-slate-500">
        Nenhum registro encontrado para os filtros selecionados.
      </td>
    </tr>
  );
}

export function ReportsDetailTables({ pedidos, comissoes }: Props) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pedidos detalhados</h2>
            <p className="text-sm text-slate-500">Registros que compõem o total de vendas.</p>
          </div>
          <span className="text-sm font-semibold text-slate-600">{pedidos.length} registro(s)</span>
        </div>
        <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pedidos.length === 0 ? <EmptyRow columns={4} /> : null}
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(pedido.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{getClienteNome(pedido.clientes)}</td>
                  <td className="px-4 py-3">{pedido.status || "Não informado"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(pedido.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Comissões detalhadas</h2>
            <p className="text-sm text-slate-500">Memória de cálculo das comissões filtradas.</p>
          </div>
          <span className="text-sm font-semibold text-slate-600">{comissoes.length} registro(s)</span>
        </div>
        <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Representada</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comissoes.length === 0 ? <EmptyRow columns={6} /> : null}
              {comissoes.map((comissao) => (
                <tr key={comissao.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(comissao.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{getClienteNome(comissao.clientes)}</td>
                  <td className="px-4 py-3">{comissao.empresa || "Não informada"}</td>
                  <td className="px-4 py-3">{comissao.status || "Não informado"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatCurrency(comissao.valor_base)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(comissao.valor_comissao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
