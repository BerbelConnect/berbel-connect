"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardRepresentadaAnalytics } from "@/types/dashboard";

type Props = {
  data: DashboardRepresentadaAnalytics[];
  isLoading?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

export function RepresentadasChart({
  data,
  isLoading = false,
}: Props) {
  const chartData = [...data]
    .sort((a, b) => b.comissao - a.comissao)
    .slice(0, 8);

  return (
    <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Representadas
        </p>

        <h3 className="text-lg font-bold text-slate-900">
          Comissões por empresa
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Comparativo entre comissão gerada e quantidade de pedidos.
        </p>
      </div>

      {isLoading ? (
        <div className="h-72 min-h-72 animate-pulse rounded-2xl bg-slate-100" />
      ) : chartData.length === 0 ? (
        <div className="flex h-72 min-h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
          Sem dados para o período selecionado.
        </div>
      ) : (
        <div className="h-72 min-h-72 min-w-0 w-full">
          <ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={0}
  minHeight={288}
  initialDimension={{ width: 600, height: 288 }}
>
            <BarChart
              data={chartData}
              margin={{
                top: 8,
                right: 16,
                left: 0,
                bottom: 40,
              }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="empresa"
                angle={-20}
                textAnchor="end"
                interval={0}
                height={70}
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
                yAxisId="money"
                width={82}
                tickFormatter={formatCurrency}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="count"
                orientation="right"
                allowDecimals={false}
                width={40}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value, name) =>
                  name === "Comissão"
                    ? [formatCurrency(value as number), name]
                    : [value, name]
                }
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(15,23,42,.08)",
                }}
              />

              <Legend
                wrapperStyle={{
                  paddingTop: "12px",
                  fontSize: "12px",
                }}
              />

              <Bar
                yAxisId="money"
                dataKey="comissao"
                name="Comissão"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />

              <Bar
                yAxisId="count"
                dataKey="pedidos"
                name="Lançamentos"
                fill="#14b8a6"
                radius={[8, 8, 0, 0]}
                opacity={0.65}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}