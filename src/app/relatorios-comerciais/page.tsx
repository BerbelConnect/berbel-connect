"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { ReportsRanking } from "@/components/reports/ReportsRanking";
import { ReportsSummaryCards } from "@/components/reports/ReportsSummaryCards";
import { carregarReportsDashboard } from "@/services/reports/reportsService";
import { exportarRelatorioComercialExcel } from "@/services/reports/reportsExportService";

import type {
  ClientRankingItem,
  ProductRankingItem,
  ReportComissao,
  ReportFilters,
  ReportPedido,
  ReportSummary,
  ReportsDashboardData,
  RepresentadaRankingItem,
} from "@/types/reports";

const initialFilters: ReportFilters = {
  period: "12m",
  startDate: null,
  endDate: null,
  clienteId: null,
  representada: null,
};

const initialData: ReportsDashboardData = {
  pedidos: [],
  itens: [],
  comissoes: [],
  clientes: [],
  representadas: [],
};

function getClienteNome(
  clientes: ReportPedido["clientes"] | ReportComissao["clientes"]
) {
  if (!clientes) {
    return "Cliente não informado";
  }

  if (Array.isArray(clientes)) {
    return clientes[0]?.razao_social || "Cliente não informado";
  }

  return clientes.razao_social || "Cliente não informado";
}

function getPeriodStartDate(filters: ReportFilters) {
  if (filters.period === "custom") {
    return filters.startDate
      ? new Date(`${filters.startDate}T00:00:00`)
      : null;
  }

  const date = new Date();

  switch (filters.period) {
    case "30d":
      date.setDate(date.getDate() - 30);
      return date;
    case "90d":
      date.setDate(date.getDate() - 90);
      return date;
    case "6m":
      date.setMonth(date.getMonth() - 6);
      return date;
    case "12m":
      date.setMonth(date.getMonth() - 12);
      return date;
    default:
      return null;
  }
}

function getPeriodEndDate(filters: ReportFilters) {
  if (filters.period !== "custom" || !filters.endDate) {
    return null;
  }

  return new Date(`${filters.endDate}T23:59:59`);
}

function isDateInsidePeriod(
  value: string | null | undefined,
  filters: ReportFilters
) {
  if (!value) {
    return false;
  }

  const itemDate = new Date(value);

  if (Number.isNaN(itemDate.getTime())) {
    return false;
  }

  const startDate = getPeriodStartDate(filters);
  const endDate = getPeriodEndDate(filters);

  if (startDate && itemDate < startDate) {
    return false;
  }

  if (endDate && itemDate > endDate) {
    return false;
  }

  return true;
}

export default function RelatoriosComerciaisPage() {
  const [data, setData] = useState<ReportsDashboardData>(initialData);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function carregarDados() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await carregarReportsDashboard();

        if (!isMounted) {
          return;
        }

        setData(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os relatórios comerciais."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarDados();

    return () => {
      isMounted = false;
    };
  }, []);

  const comissoesFiltradas = useMemo(() => {
    return data.comissoes.filter((comissao) => {
      const correspondePeriodo = isDateInsidePeriod(
        comissao.created_at,
        filters
      );

      const correspondeCliente =
        !filters.clienteId || comissao.cliente_id === filters.clienteId;

      const correspondeRepresentada =
        !filters.representada || comissao.empresa === filters.representada;

      return (
        correspondePeriodo &&
        correspondeCliente &&
        correspondeRepresentada
      );
    });
  }, [data.comissoes, filters]);

  const pedidoIdsDaRepresentada = useMemo(() => {
    if (!filters.representada) {
      return null;
    }

    return new Set(
      data.comissoes
        .filter((comissao) => comissao.empresa === filters.representada)
        .map((comissao) => comissao.pedido_id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [data.comissoes, filters.representada]);

  const pedidosFiltrados = useMemo(() => {
    return data.pedidos.filter((pedido) => {
      const correspondePeriodo = isDateInsidePeriod(
        pedido.created_at,
        filters
      );

      const correspondeCliente =
        !filters.clienteId || pedido.cliente_id === filters.clienteId;

      const correspondeRepresentada =
        !pedidoIdsDaRepresentada || pedidoIdsDaRepresentada.has(pedido.id);

      return correspondePeriodo && correspondeCliente && correspondeRepresentada;
    });
  }, [data.pedidos, filters, pedidoIdsDaRepresentada]);

  const pedidoIdsFiltrados = useMemo(
    () => new Set(pedidosFiltrados.map((pedido) => pedido.id)),
    [pedidosFiltrados]
  );

  const itensFiltrados = useMemo(() => {
    return data.itens.filter(
      (item) =>
        item.pedido_id !== null && pedidoIdsFiltrados.has(item.pedido_id)
    );
  }, [data.itens, pedidoIdsFiltrados]);

  const summary = useMemo<ReportSummary>(() => {
    const totalVendido = pedidosFiltrados.reduce(
      (total, pedido) => total + Number(pedido.valor_total || 0),
      0
    );

    const totalComissao = comissoesFiltradas.reduce(
      (total, comissao) => total + Number(comissao.valor_comissao || 0),
      0
    );

    return {
      quantidadePedidos: pedidosFiltrados.length,
      totalVendido,
      totalComissao,
      ticketMedio:
        pedidosFiltrados.length > 0
          ? totalVendido / pedidosFiltrados.length
          : 0,
    };
  }, [comissoesFiltradas, pedidosFiltrados]);

  const topClientes = useMemo<ClientRankingItem[]>(() => {
    const ranking = new Map<string, ClientRankingItem>();

    pedidosFiltrados.forEach((pedido) => {
      const nome = getClienteNome(pedido.clientes);
      const itemAtual = ranking.get(nome) ?? {
        nome,
        total: 0,
        pedidos: 0,
      };

      itemAtual.total += Number(pedido.valor_total || 0);
      itemAtual.pedidos += 1;

      ranking.set(nome, itemAtual);
    });

    return Array.from(ranking.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [pedidosFiltrados]);

  const topProdutos = useMemo<ProductRankingItem[]>(() => {
    const ranking = new Map<string, ProductRankingItem>();

    itensFiltrados.forEach((item) => {
      const nome = item.produto_nome || "Produto não informado";
      const itemAtual = ranking.get(nome) ?? {
        nome,
        total: 0,
        quantidade: 0,
      };

      itemAtual.total += Number(item.valor_total || 0);
      itemAtual.quantidade += Number(item.quantidade || 0);

      ranking.set(nome, itemAtual);
    });

    return Array.from(ranking.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [itensFiltrados]);

  const topRepresentadas = useMemo<RepresentadaRankingItem[]>(() => {
    const ranking = new Map<string, RepresentadaRankingItem>();

    comissoesFiltradas.forEach((comissao) => {
      const nome = comissao.empresa || "Sem representada";
      const itemAtual = ranking.get(nome) ?? {
        nome,
        total: 0,
        comissao: 0,
      };

      itemAtual.total += Number(comissao.valor_base || 0);
      itemAtual.comissao += Number(comissao.valor_comissao || 0);

      ranking.set(nome, itemAtual);
    });

    return Array.from(ranking.values())
      .sort((a, b) => b.comissao - a.comissao)
      .slice(0, 10);
  }, [comissoesFiltradas]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <PageHeader
            titulo="Relatórios Comerciais"
            subtitulo="Berbel Connect"
          />

          <div className="space-y-6 p-4 sm:p-6 xl:p-8">
            <ReportsFilters
              filters={filters}
              clientes={data.clientes}
              representadas={data.representadas}
              onChange={setFilters}
              onClear={() => setFilters(initialFilters)}
              onExportExcel={() =>
                exportarRelatorioComercialExcel(
                  {
                    pedidos: summary.quantidadePedidos,
                    vendas: summary.totalVendido,
                    comissoes: summary.totalComissao,
                    ticket: summary.ticketMedio,
                  },
                  topClientes,
                  topProdutos,
                  topRepresentadas,
                )
              }
              onPrint={() => window.print()}
            />

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                  />
                ))}
              </div>
            ) : (
              <>
                <ReportsSummaryCards summary={summary} />

                <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
                  <ReportsRanking
                    titulo="Top clientes"
                    tipo="clientes"
                    dados={topClientes}
                  />

                  <ReportsRanking
                    titulo="Top produtos"
                    tipo="produtos"
                    dados={topProdutos}
                  />

                  <ReportsRanking
                    titulo="Top representadas"
                    tipo="representadas"
                    dados={topRepresentadas}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
