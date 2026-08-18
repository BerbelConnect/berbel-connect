import type { DashboardResumo } from "@/types/dashboard";

type DashboardMetricsProps = {
  resumo: DashboardResumo;
};

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          •
        </div>
      </div>
      <strong className="text-3xl font-semibold text-slate-900">{valor}</strong>
    </div>
  );
}

export function DashboardMetrics({ resumo }: DashboardMetricsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card titulo="Vendas intermediadas" valor={resumo.totalVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão prevista" valor={resumo.totalComissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão recebida" valor={resumo.comissaoRecebida.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão pendente" valor={resumo.comissaoPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="A receber no mês" valor={resumo.totalReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="A pagar no mês" valor={resumo.totalPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card
        titulo="Saldo real do banco"
        valor={resumo.saldoRealBanco === null
          ? "Não conciliado"
          : resumo.saldoRealBanco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      />
      <Card titulo="Pipeline aberto" valor={resumo.valorPipeline.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Clientes" valor={resumo.clientesCount} />
      <Card titulo="Visitas hoje" valor={resumo.visitasHojeCount} />
      <Card titulo="Visitas atrasadas" valor={resumo.visitasAtrasadasCount} />
      <Card titulo="Oportunidades" valor={resumo.oportunidadesAbertasCount} />
    </div>
  );
}
