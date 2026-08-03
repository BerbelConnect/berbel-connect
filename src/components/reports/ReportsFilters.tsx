"use client";

import type {
  ReportClienteOption,
  ReportFilters,
  ReportRepresentadaOption,
} from "@/types/reports";

type Props = {
  filters: ReportFilters;
  clientes: ReportClienteOption[];
  representadas: ReportRepresentadaOption[];
  onChange: (filters: ReportFilters) => void;

  onApply?: () => void;
  onClear?: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
};

export function ReportsFilters({
  filters,
  clientes,
  representadas,
  onChange,
  onApply,
  onClear,
  onExportExcel,
  onExportPdf,
  onPrint,
}: Props) {
  function update<K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K]
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Filtros do relatório
        </h2>

        <p className="text-sm text-slate-500">
          Selecione os critérios para gerar o relatório.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={onApply}
      className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      Aplicar filtros
    </button>

    <button
      type="button"
      onClick={onClear}
      className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      Limpar
    </button>
  </div>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={onExportExcel}
      className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
    >
      Excel
    </button>

    <button
      type="button"
      onClick={onExportPdf}
      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
    >
      PDF
    </button>

    <button
      type="button"
      onClick={onPrint}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      Imprimir
    </button>
  </div>
</div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Período
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-3"
            value={filters.period}
            onChange={(e) =>
              update("period", e.target.value as ReportFilters["period"])
            }
          >
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos 12 meses</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Cliente
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-3"
            value={filters.clienteId ?? ""}
            onChange={(e) =>
              update("clienteId", e.target.value || null)
            }
          >
            <option value="">Todos</option>

            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.razao_social}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Representada
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 p-3"
            value={filters.representada ?? ""}
            onChange={(e) =>
              update("representada", e.target.value || null)
            }
          >
            <option value="">Todas</option>

            {representadas.map((empresa) => (
              <option key={empresa.nome} value={empresa.nome}>
                {empresa.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Data inicial
          </label>

          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 p-3"
            value={filters.startDate ?? ""}
            onChange={(e) =>
              update("startDate", e.target.value || null)
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Data final
          </label>

          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 p-3"
            value={filters.endDate ?? ""}
            onChange={(e) =>
              update("endDate", e.target.value || null)
            }
          />
        </div>
      </div>
    </section>
  );
}