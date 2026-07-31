"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardSalesEvolutionPoint } from "@/types/dashboard";

type Props = {
  data: DashboardSalesEvolutionPoint[];
  isLoading?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatPeriod(period: string) {
  const [year, month] = period.split("-");

  if (!year || !month) {
    return period;
  }

  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrency(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(numericValue);
}

export function SalesEvolutionChart({
  data,
  isLoading = false,
}: Props) {
  return (
    <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Comercial
        </p>

        <h3 className="text-lg font-bold text-slate-900">
          Evolução de vendas
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Comparativo entre vendas e comissões no período selecionado.
        </p>
      </div>

      {isLoading ? (
        <div className="h-72 min-h-72 animate-pulse rounded-2xl bg-slate-100" />
      ) : data.length === 0 ? (
        <div className="flex h-72 min-h-72 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-500">
          Sem dados para o período selecionado.
        </div>
      ) : (
        <div className="h-72 min-h-72 min-w-0 w-full">
          <ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={0}
  minHeight={288}
  initialDimension={{ width: 800, height: 288 }}
>
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: 16,
                left: 0,
                bottom: 4,
              }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="period"
                tickFormatter={formatPeriod}
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#cbd5e1",
                }}
                tickLine={false}
                minTickGap={20}
              />

              <YAxis
                yAxisId="sales"
                orientation="left"
                tickFormatter={formatCurrency}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                width={82}
              />

              <YAxis
                yAxisId="commission"
                orientation="right"
                tickFormatter={formatCurrency}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                width={82}
              />

              <Tooltip
                formatter={(value, name) => [
  formatCurrency(Number(value ?? 0)),
  String(name),
]}
                labelFormatter={(label) => formatPeriod(String(label))}
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />

              <Legend
                wrapperStyle={{
                  paddingTop: "12px",
                  fontSize: "12px",
                }}
              />

              <Line
                yAxisId="sales"
                type="linear"
                dataKey="valor_vendido"
                name="Vendas"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#2563eb",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />

              <Line
                yAxisId="commission"
                type="linear"
                dataKey="comissao_prevista"
                name="Comissão prevista"
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#f59e0b",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />

              <Line
                yAxisId="commission"
                type="linear"
                dataKey="comissao_recebida"
                name="Comissão recebida"
                stroke="#16a34a"
                strokeDasharray="2 4"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#16a34a",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}