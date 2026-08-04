"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import {
  calcularResumoPainelExecutivo,
  ordenarPrioridades,
  type ComissaoExecutiva,
  type ContaExecutiva,
  type PromessaExecutiva,
} from "@/lib/financeiro/painelExecutivo";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().slice(0, 10);
const dataBr = (valor?: string | null) => valor ? new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : "Sem previsão";

export default function PainelExecutivoFinanceiroPage() {
  const [receber, setReceber] = useState<ContaExecutiva[]>([]);
  const [pagar, setPagar] = useState<ContaExecutiva[]>([]);
  const [comissoes, setComissoes] = useState<ComissaoExecutiva[]>([]);
  const [promessas, setPromessas] = useState<PromessaExecutiva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  async function carregar() {
    setCarregando(true); setErro("");
    const [r, p, c, contatos] = await Promise.all([
      supabase.from("contas_receber").select("id, valor, vencimento, status, descricao"),
      supabase.from("contas_pagar").select("id, valor, vencimento, status, descricao"),
      supabase.from("comissoes_financeiro").select("id, valor_comissao, previsao_recebimento, data_previsao, status, empresa, clientes(razao_social)"),
      supabase.from("cobrancas_recebimentos").select("id, promessa_data, resultado"),
    ]);
    const falha = [r.error, p.error, c.error, contatos.error].find(Boolean);
    if (falha) { setErro(falha.message); setCarregando(false); return; }
    setReceber((r.data || []).map((item) => ({ ...item, valor: Number(item.valor || 0) })));
    setPagar((p.data || []).map((item) => ({ ...item, valor: Number(item.valor || 0) })));
    setComissoes((c.data || []).map((item) => {
      const clientes = item.clientes as unknown as { razao_social?: string } | { razao_social?: string }[] | null;
      const cliente = Array.isArray(clientes) ? clientes[0]?.razao_social : clientes?.razao_social;
      return { id: item.id, valor: Number(item.valor_comissao || 0), previsao: item.previsao_recebimento || item.data_previsao, status: item.status, empresa: item.empresa, cliente };
    }));
    setPromessas((contatos.data || []).map((item) => ({ id: item.id, promessaData: item.promessa_data, resultado: item.resultado })));
    setAtualizadoEm(new Date()); setCarregando(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const resumo = useMemo(() => calcularResumoPainelExecutivo(receber, pagar, comissoes, promessas, hoje()), [receber, pagar, comissoes, promessas]);
  const prioridades = useMemo(() => ordenarPrioridades(comissoes, hoje()), [comissoes]);

  return <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar />
    <section className="min-w-0 flex-1"><PageHeader titulo="Painel Executivo Financeiro" subtitulo="Visão diária de caixa, comissões e cobranças" />
      <div className="space-y-5 p-4 sm:p-6 xl:p-8">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-bold">Resumo financeiro de hoje</h2><p className="text-sm text-slate-500">{atualizadoEm ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Carregando dados..."}</p></div>
          <button onClick={() => void carregar()} disabled={carregando} className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-60">{carregando ? "Atualizando..." : "Atualizar painel"}</button>
        </div>
        {erro && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card titulo="A receber" valor={moeda(resumo.receberPendente)} detalhe={`Vencido: ${moeda(resumo.receberVencido)}`} cor="text-blue-700" />
          <Card titulo="A pagar" valor={moeda(resumo.pagarPendente)} detalhe={`Vencido: ${moeda(resumo.pagarVencido)}`} cor="text-red-700" />
          <Card titulo="Saldo previsto" valor={moeda(resumo.saldoPrevisto)} detalhe="Receber menos pagar" cor={resumo.saldoPrevisto >= 0 ? "text-emerald-700" : "text-red-700"} />
          <Card titulo="Comissões pendentes" valor={moeda(resumo.comissaoPendente)} detalhe={`Vencidas: ${moeda(resumo.comissaoVencida)}`} cor="text-orange-700" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Prioridades financeiras</h2><p className="text-sm text-slate-500">Comissões mais antigas para acompanhamento.</p></div><Link href="/financeiro/cobrancas" className="text-sm font-semibold text-blue-700">Abrir cobranças</Link></div>
            <div className="space-y-2">{prioridades.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{item.empresa || "Representada"} · {item.cliente || "Cliente"}</p><p className={item.vencida ? "text-sm text-red-600" : "text-sm text-slate-500"}>{item.vencida ? "Vencida" : "Prevista"} em {dataBr(item.previsao)}</p></div><strong className="text-emerald-700">{moeda(item.valor)}</strong></div>)}{!carregando && prioridades.length === 0 && <p className="py-8 text-center text-slate-500">Nenhuma prioridade financeira.</p>}</div>
          </section>
          <section className="space-y-5"><div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Compromissos próximos</h2><p className="mt-2 text-4xl font-bold text-blue-700">{resumo.promessasProximas}</p><p className="text-sm text-slate-500">Promessas para os próximos 7 dias</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-3 text-xl font-bold">Ações rápidas</h2><div className="grid gap-2">{[["Contas a receber","/financeiro/contas-receber"],["Contas a pagar","/financeiro/contas-pagar"],["Fechamento de comissões","/financeiro/comissoes"],["Cobrança de recebimentos","/financeiro/cobrancas"],["Central de alertas","/alertas"],["Fluxo de caixa","/financeiro/fluxo-caixa"]].map(([nome, href]) => <Link key={href} href={href} className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">{nome}</Link>)}</div></div>
          </section>
        </div>
      </div>
    </section></div></main>;
}

function Card({ titulo, valor, detalhe, cor }: { titulo: string; valor: string; detalhe: string; cor: string }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><p className={`mt-2 text-2xl font-bold ${cor}`}>{valor}</p><p className="mt-2 text-xs text-slate-500">{detalhe}</p></div>;
}
