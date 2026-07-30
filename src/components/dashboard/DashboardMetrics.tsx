import type { DashboardResumo } from "@/types/dashboard";

type DashboardMetricsProps = {
  resumo: DashboardResumo;
};

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}

export function DashboardMetrics({ resumo }: DashboardMetricsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card titulo="Vendas intermediadas" valor={resumo.totalVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão prevista" valor={resumo.totalComissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão recebida" valor={resumo.comissaoRecebida.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Comissão pendente" valor={resumo.comissaoPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="A receber" valor={resumo.totalReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="A pagar" valor={resumo.totalPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Saldo previsto" valor={resumo.saldoPrevisto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Pipeline aberto" valor={resumo.valorPipeline.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Card titulo="Clientes" valor={resumo.clientesCount} />
      <Card titulo="Visitas hoje" valor={resumo.visitasHojeCount} />
      <Card titulo="Visitas atrasadas" valor={resumo.visitasAtrasadasCount} />
      <Card titulo="Oportunidades" valor={resumo.oportunidadesAbertasCount} />
    </div>
  );
}
