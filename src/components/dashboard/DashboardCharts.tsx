"use client";

import type {
  DashboardAnalytics,
  DashboardPeriodKey,
} from "@/types/dashboard";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";
import { FinancialStatusChart } from "./FinancialStatusChart";
import { RepresentadasChart } from "./RepresentadasChart";
import { SalesEvolutionChart } from "./SalesEvolutionChart";
import { VisitsChart } from "./VisitsChart";

type Props = {
  analytics: DashboardAnalytics | null;
  period: DashboardPeriodKey;
  isLoading: boolean;
  errorMessage: string | null;
  onPeriodChange: (period: DashboardPeriodKey) => void;
};

const emptyAnalytics: DashboardAnalytics = {
  salesEvolution: [],
  representadas: [],
  visits: {
    realizadas: 0,
    atrasadas: 0,
    futuras: 0,
  },
  financialStatus: [],
};

export function DashboardCharts({
  analytics,
  period,
  isLoading,
  errorMessage,
  onPeriodChange,
}: Props) {
  const data = analytics ?? emptyAnalytics;

  return (
    <section className="min-w-0 space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Analytics
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Desempenho por período
            </h2>
          </div>

          <DashboardPeriodFilter period={period} onChange={onPeriodChange} />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível carregar os gráficos: {errorMessage}
          </div>
        ) : null}
      </div>

      <SalesEvolutionChart data={data.salesEvolution} isLoading={isLoading} />

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <RepresentadasChart data={data.representadas} isLoading={isLoading} />
        <VisitsChart data={data.visits} isLoading={isLoading} />
      </div>

      <FinancialStatusChart data={data.financialStatus} isLoading={isLoading} />
    </section>
  );
}
