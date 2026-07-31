"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardFinancialStatusAnalytics } from "@/types/dashboard";
import { formatFinancialForChart } from "@/services/dashboard/chartsService";

type Props = {
  data: DashboardFinancialStatusAnalytics[];
  isLoading?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(numericValue);
}

export function FinancialStatusChart({
  data,
  isLoading = false,
}: Props) {
  const chartData = formatFinancialForChart(data);

  return (
    <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Financeiro
        </p>

        <h3 className="text-lg font-bold text-slate-900">
          Valores por situação
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Distribuição dos valores financeiros por status.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 min-h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : chartData.length === 0 ? (
        <div className="flex h-64 min-h-64 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-500">
          Sem movimentações no período selecionado.
        </div>
      ) : (
        <div className="h-64 min-h-64 min-w-0 w-full">
         <ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={0}
  minHeight={256}
  initialDimension={{ width: 800, height: 256 }}
>
            <BarChart
              data={chartData}
              margin={{
                top: 8,
                right: 16,
                left: 0,
                bottom: 36,
              }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
  dataKey="name"
  interval={0}
  tick={{
    fill: "#64748b",
    fontSize: 11,
  }}
  tickLine={false}
  axisLine={{
    stroke: "#cbd5e1",
  }}
/>

              <YAxis
                width={82}
                tickFormatter={formatCurrency}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [
                  formatCurrency(value as number),
                  "Total",
                ]}
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />

              <Bar
                dataKey="value"
                name="Total"
                fill="#7c3aed"
                radius={[8, 8, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}