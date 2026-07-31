"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { DashboardVisitsAnalytics } from "@/types/dashboard";
import { formatVisitsForChart } from "@/services/dashboard/chartsService";

type Props = {
  data: DashboardVisitsAnalytics;
  isLoading?: boolean;
};

const chartColors = [
  "#16a34a",
  "#dc2626",
  "#2563eb",
];

export function VisitsChart({
  data,
  isLoading = false,
}: Props) {
  const chartData = formatVisitsForChart(data);
  const total = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Agenda
        </p>

        <h3 className="text-lg font-bold text-slate-900">
          Situação das visitas
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Distribuição das visitas realizadas, futuras e atrasadas.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 min-h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : total === 0 ? (
        <div className="flex h-64 min-h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
          Sem visitas no período selecionado.
        </div>
      ) : (
        <div className="h-64 min-h-64 min-w-0 w-full">
          <ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={0}
  minHeight={256}
  initialDimension={{ width: 600, height: 256 }}
>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [value, "Visitas"]}
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow:
                    "0 10px 25px rgba(15,23,42,.08)",
                }}
              />

              <Legend
                wrapperStyle={{
                  paddingTop: "12px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}