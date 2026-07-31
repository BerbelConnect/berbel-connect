"use client";

import React from "react";
import type { DashboardPeriodKey } from "@/types/dashboard";

type Props = {
  period: DashboardPeriodKey;
  onChange: (p: DashboardPeriodKey) => void;
};

const options: { key: DashboardPeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "year", label: "Ano atual" },
  { key: "12m", label: "Últimos 12 meses" },
];

export function DashboardPeriodFilter({ period, onChange }: Props) {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="inline-flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              period === opt.key
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
