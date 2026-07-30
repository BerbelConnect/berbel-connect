"use client";

import { useMemo } from "react";
import type { HistoricoClienteDados } from "@/types/historicoCliente";
import { FichaResumoTab } from "./FichaResumoTab";
import { FichaPedidosTab } from "./FichaPedidosTab";
import { FichaFinanceiroTab } from "./FichaFinanceiroTab";
import { FichaProdutosTab } from "./FichaProdutosTab";
import { FichaVisitasTab } from "./FichaVisitasTab";
import { FichaComissoesTab } from "./FichaComissoesTab";
import { FichaHistoricoTab } from "./FichaHistoricoTab";
import { FichaObservacoesTab } from "./FichaObservacoesTab";

const tabs = [
  "Resumo",
  "Pedidos",
  "Financeiro",
  "Produtos",
  "Visitas",
  "Comissões",
  "Histórico",
  "Observações",
] as const;

type Tab = (typeof tabs)[number];

type FichaTabsProps = {
  historico: HistoricoClienteDados;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function FichaTabs({ historico, activeTab, onTabChange }: FichaTabsProps) {
  const currentTab = useMemo(() => {
    switch (activeTab) {
      case "Resumo":
        return <FichaResumoTab historico={historico} />;
      case "Pedidos":
        return <FichaPedidosTab pedidos={historico.pedidos} />;
      case "Financeiro":
        return <FichaFinanceiroTab contasReceber={historico.contasReceber} />;
      case "Produtos":
        return <FichaProdutosTab produtos={historico.produtosMaisComprados} />;
      case "Visitas":
        return <FichaVisitasTab visitas={historico.visitas} />;
      case "Comissões":
        return <FichaComissoesTab comissoes={historico.comissoes} />;
      case "Histórico":
        return <FichaHistoricoTab historico={historico} />;
      case "Observações":
        return <FichaObservacoesTab observacoes={historico.cliente.observacoes} />;
      default:
        return null;
    }
  }, [activeTab, historico]);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex min-w-[720px] gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                tab === activeTab
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {currentTab}
    </div>
  );
}
