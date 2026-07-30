import type { HistoricoClienteDados } from "@/types/historicoCliente";
import { formatarData, moeda, formatarTexto } from "./fichaHelpers";

export function FichaResumoTab({ historico }: { historico: HistoricoClienteDados }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Resumo do cliente</h3>
            <p className="text-sm text-slate-500">Informações principais e indicadores comerciais.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Ranking {historico.resumo.ranking}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Cliente</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{historico.cliente.razao_social}</p>
            <p className="text-sm text-slate-500">{formatarTexto(historico.cliente.nome_fantasia)}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Contato</p>
            <p className="mt-2 text-sm text-slate-900">{formatarTexto(historico.cliente.email)}</p>
            <p className="text-sm text-slate-900">{formatarTexto(historico.cliente.whatsapp)}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Localização</p>
            <p className="mt-2 text-sm text-slate-900">
              {formatarTexto(historico.cliente.cidade)} / {formatarTexto(historico.cliente.estado)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total comprado", value: moeda(historico.resumo.totalComprado) },
          { label: "Pedidos", value: historico.resumo.numeroPedidos },
          { label: "Ticket médio", value: moeda(historico.resumo.ticketMedio) },
          { label: "Comissão acumulada", value: moeda(historico.resumo.comissaoTotal) },
          { label: "Contas pendentes", value: historico.resumo.contasPendentes },
          { label: "Contas vencidas", value: historico.resumo.contasVencidas },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      {historico.alertas.length > 0 && (
        <section className="rounded-3xl bg-amber-50 p-6 shadow-sm">
          <h4 className="mb-4 text-lg font-bold text-amber-900">Alertas inteligentes</h4>
          <div className="grid gap-4 md:grid-cols-3">
            {historico.alertas.map((alerta) => (
              <div key={alerta.tipo} className="rounded-3xl border border-amber-200 bg-white p-5">
                <p className="text-sm font-semibold text-amber-800">{alerta.titulo}</p>
                <p className="mt-2 text-sm text-slate-600">{alerta.descricao}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-lg font-bold text-slate-900">Dados complementares</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Última compra</p>
            <p className="mt-2 text-slate-900">{formatarData(historico.resumo.ultimaCompra)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Dias sem compra</p>
            <p className="mt-2 text-slate-900">{historico.resumo.diasSemCompra ?? "-"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">CNPJ</p>
            <p className="mt-2 text-slate-900">{formatarTexto(historico.cliente.cnpj)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
