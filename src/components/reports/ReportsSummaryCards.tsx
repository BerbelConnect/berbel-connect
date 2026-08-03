"use client";

import type { ReportSummary } from "@/types/reports";

type Props = {
  summary: ReportSummary;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <h3 className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </h3>

      {subtitle ? (
        <p className="mt-2 text-xs text-slate-400">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function ReportsSummaryCards({
  summary,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <Card
        title="Pedidos"
        value={summary.quantidadePedidos.toString()}
      />

      <Card
        title="Vendas"
        value={formatCurrency(summary.totalVendido)}
      />

      <Card
        title="Comissões"
        value={formatCurrency(summary.totalComissao)}
      />

      <Card
        title="Ticket Médio"
        value={formatCurrency(summary.ticketMedio)}
      />
    </div>
  );
}