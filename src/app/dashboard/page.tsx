"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DashboardAgenda,
  DashboardAlerts,
  DashboardCharts,
  DashboardFinanceiro,
  DashboardGoals,
  DashboardHeader,
  DashboardInsights,
  DashboardMetrics,
  DashboardPipeline,
  DashboardRankings,
  DashboardSkeleton,
} from "@/components/dashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { carregarAnalytics } from "@/services/dashboard/analyticsService";
import { carregarResumoExecutivo } from "@/services/dashboard/resumoService";
import type {
  DashboardAnalytics,
  DashboardPeriodKey,
  DashboardResumo,
} from "@/types/dashboard";

function getSaudacao(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatUltimaAtualizacao(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const [period, setPeriod] = useState<DashboardPeriodKey>("12m");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const saudacao = useMemo(
    () => (ultimaAtualizacao ? getSaudacao(ultimaAtualizacao) : "Bom dia"),
    [ultimaAtualizacao]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await carregarResumoExecutivo();

        if (!isMounted) return;

        setResumo(data);
        setUltimaAtualizacao(new Date());
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Erro inesperado ao carregar o dashboard."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const data = await carregarAnalytics(period);

        if (!isMounted) return;

        setAnalytics(data);
      } catch (error) {
        if (!isMounted) return;

        setAnalyticsError(
          error instanceof Error ? error.message : "Erro inesperado ao carregar os gráficos."
        );
      } finally {
        if (isMounted) {
          setIsAnalyticsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [period]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="flex">
          <Sidebar />
          <section className="flex-1 p-8">
            <DashboardSkeleton />
          </section>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="flex">
          <Sidebar />
          <section className="flex-1 p-8">
            <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">
                Erro ao carregar dashboard
              </h1>
              <p className="mt-4 text-slate-600">{errorMessage}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!resumo) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <DashboardHeader
            titulo="Dashboard Executivo"
            subtitulo="Centro de comando Berbel Connect"
            saudacao={saudacao}
            ultimaAtualizacao={
              ultimaAtualizacao
                ? formatUltimaAtualizacao(ultimaAtualizacao)
                : null
            }
          />

          <div className="space-y-6 p-4 sm:p-6 xl:p-8">
            <DashboardMetrics resumo={resumo} />

            <DashboardCharts
              analytics={analytics}
              period={period}
              isLoading={isAnalyticsLoading}
              errorMessage={analyticsError}
              onPeriodChange={setPeriod}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DashboardGoals />
              <DashboardInsights />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DashboardAlerts
                clientesSemVisita={resumo.clientesSemVisita}
                clientesSemCompra={resumo.clientesSemCompra}
              />
              <DashboardAgenda
                visitasHoje={resumo.visitasHoje}
                pedidosRecentes={resumo.pedidosRecentes}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <DashboardPipeline pipelineAberto={resumo.pipelineAberto} />
              <DashboardFinanceiro
                contasReceberPendentes={resumo.contasReceberPendentes}
                comissoesPendentes={resumo.comissoesPendentes}
              />
              <DashboardRankings
                topClientes={resumo.topClientes}
                topRepresentadas={resumo.topRepresentadas}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
