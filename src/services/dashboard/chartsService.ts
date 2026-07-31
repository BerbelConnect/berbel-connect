import type {
  DashboardFinancialStatusAnalytics,
  DashboardRepresentadaAnalytics,
  DashboardSalesEvolutionPoint,
  DashboardVisitsAnalytics,
} from "@/types/dashboard";

export function formatSalesForChart(points: DashboardSalesEvolutionPoint[]) {
  return points.map((point) => ({
    period: point.period,
    valor_vendido: point.valor_vendido,
    comissao_prevista: point.comissao_prevista,
    comissao_recebida: point.comissao_recebida,
  }));
}

export function formatRepresentadasForChart(
  items: DashboardRepresentadaAnalytics[]
) {
  return [...items]
    .sort((a, b) => b.comissao - a.comissao)
    .map((item) => ({
      empresa: item.empresa,
      faturamento: item.faturamento,
      pedidos: item.pedidos,
      comissao: item.comissao,
    }));
}

export function formatVisitsForChart(visits: DashboardVisitsAnalytics) {
  return [
    { name: "Realizadas", value: visits.realizadas },
    { name: "Atrasadas", value: visits.atrasadas },
    { name: "Futuras", value: visits.futuras },
  ];
}

function financialLabel(status: string) {
  const [tipo, situacao] = status.split(":");

  if (!situacao) {
    return status;
  }

  return `${tipo === "receber" ? "Receber" : "Pagar"} · ${situacao}`;
}

export function formatFinancialForChart(
  items: DashboardFinancialStatusAnalytics[]
) {
  return [...items]
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      name: financialLabel(item.status),
      value: item.total,
    }));
}
