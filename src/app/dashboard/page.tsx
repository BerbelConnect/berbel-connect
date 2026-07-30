"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  DashboardHeader,
  DashboardMetrics,
  DashboardAlerts,
  DashboardAgenda,
  DashboardPipeline,
  DashboardFinanceiro,
  DashboardRankings,
} from "@/components/dashboard";
import { carregarResumoExecutivo } from "@/services/dashboard/resumoService";
import type { DashboardResumo } from "@/types/dashboard";

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await carregarResumoExecutivo();
        if (!isMounted) return;
        setResumo(data);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="flex">
          <Sidebar />
          <section className="flex-1 p-8">Carregando...</section>
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
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900">Erro ao carregar dashboard</h1>
              <p className="mt-2 text-slate-600">{errorMessage}</p>
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

        <section className="flex-1">
          <DashboardHeader titulo="Dashboard Executivo V3" subtitulo="Centro de comando Berbel Connect" />

          <div className="p-8">
            <DashboardMetrics resumo={resumo} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <DashboardAlerts clientesSemVisita={resumo.clientesSemVisita} clientesSemCompra={resumo.clientesSemCompra} />
              <DashboardAgenda visitasHoje={resumo.visitasHoje} pedidosRecentes={resumo.pedidosRecentes} />
              <DashboardPipeline pipelineAberto={resumo.pipelineAberto} />
              <DashboardFinanceiro contasReceberPendentes={resumo.contasReceberPendentes} comissoesPendentes={resumo.comissoesPendentes} />
              <DashboardRankings topClientes={resumo.topClientes} topRepresentadas={resumo.topRepresentadas} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
