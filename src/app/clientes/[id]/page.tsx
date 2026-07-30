"use client";

import { use, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { FichaTabs } from "@/components/clientes/ficha/FichaTabs";
import { buscarFichaCompletaCliente } from "@/services/clientes/clienteFichaService";
import type { HistoricoClienteDados } from "@/types/historicoCliente";

type ClienteRouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export default function ClienteFichaPage({ params }: ClienteRouteParams) {
  const { id } = use(params);
  const [historico, setHistorico] = useState<HistoricoClienteDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "Resumo"
    | "Pedidos"
    | "Financeiro"
    | "Produtos"
    | "Visitas"
    | "Comissões"
    | "Histórico"
    | "Observações"
  >("Resumo");

  useEffect(() => {
    let mounted = true;

    function normalizeError(err: unknown) {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      try {
        if (err && typeof err === "object") {
          const maybeErr = err as Record<string, unknown>;
          if (maybeErr && typeof maybeErr.message === "string") return String(maybeErr.message);
          return JSON.stringify(maybeErr);
        }
        return String(err);
      } catch {
        return "Erro desconhecido";
      }
    }

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        const dados = await buscarFichaCompletaCliente(id);
        if (!mounted) return;
        setHistorico(dados);
      } catch (err: unknown) {
        if (!mounted) return;
        setErro(normalizeError(err) || "Não foi possível carregar o cliente.");
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Ficha do Cliente" subtitulo="CRM Comercial" />

          <div className="p-8">
            {erro ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                {erro}
              </div>
            ) : null}

            {carregando ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                Carregando ficha do cliente...
              </div>
            ) : historico ? (
              <FichaTabs
                historico={historico}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            ) : (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                Ficha do cliente não encontrada.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
