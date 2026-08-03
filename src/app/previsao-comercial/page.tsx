"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { calcularPrevisaoComercial, type MetaPrevisao, type OportunidadePrevisao, type RegistroValor } from "@/lib/previsao/calculos";

type Linha = Record<string, unknown>;
function texto(value: unknown) { return typeof value === "string" ? value : null; }
function numero(value: unknown) { return Number(value || 0); }
function moeda(valor: number) { return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function PrevisaoComercialPage() {
  const [pedidos, setPedidos] = useState<Linha[]>([]);
  const [comissoes, setComissoes] = useState<Linha[]>([]);
  const [pipeline, setPipeline] = useState<Linha[]>([]);
  const [metas, setMetas] = useState<Linha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const [pedidosResp, comissoesResp, pipelineResp, metasResp] = await Promise.all([
      supabase.from("pedidos").select("id, created_at, valor_total"),
      supabase.from("comissoes_financeiro").select("id, created_at, empresa, valor_comissao"),
      supabase.from("pipeline_comercial").select("id, valor_estimado, probabilidade, status, representada"),
      supabase.from("metas_comerciais").select("tipo, valor_meta, mes, ano, periodo"),
    ]);
    const falha = [pedidosResp, comissoesResp, pipelineResp, metasResp].find((resp) => resp.error)?.error;
    if (falha) setErro(falha.message);
    else {
      setPedidos((pedidosResp.data || []) as Linha[]);
      setComissoes((comissoesResp.data || []) as Linha[]);
      setPipeline((pipelineResp.data || []) as Linha[]);
      setMetas((metasResp.data || []) as Linha[]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  const previsao = useMemo(() => calcularPrevisaoComercial({
    vendas: pedidos.map((item): RegistroValor => ({ data: texto(item.created_at), valor: numero(item.valor_total) })),
    comissoes: comissoes.map((item): RegistroValor => ({ data: texto(item.created_at), valor: numero(item.valor_comissao) })),
    pipeline: pipeline.map((item): OportunidadePrevisao => ({ valor: numero(item.valor_estimado), probabilidade: numero(item.probabilidade), status: texto(item.status) })),
    metas: metas.map((item): MetaPrevisao => ({
      tipo: texto(item.tipo) === "Comissões" ? "Comissões" : "Vendas",
      valor: numero(item.valor_meta), mes: item.mes === null ? null : numero(item.mes),
      ano: numero(item.ano), periodo: texto(item.periodo) === "Anual" ? "Anual" : "Mensal",
    })),
  }), [comissoes, metas, pedidos, pipeline]);

  const porRepresentada = useMemo(() => {
    const hoje = new Date();
    const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const mapa = new Map<string, { realizado: number; pipeline: number }>();
    comissoes.forEach((item) => {
      const data = new Date(texto(item.created_at) || "");
      if (Number.isNaN(data.getTime()) || data.getFullYear() !== hoje.getFullYear() || data.getMonth() !== hoje.getMonth()) return;
      const nome = texto(item.empresa) || "Sem representada";
      const atual = mapa.get(nome) || { realizado: 0, pipeline: 0 };
      atual.realizado += numero(item.valor_comissao);
      mapa.set(nome, atual);
    });
    pipeline.forEach((item) => {
      if (texto(item.status) === "Fechado") return;
      const nome = texto(item.representada) || "Sem representada";
      const atual = mapa.get(nome) || { realizado: 0, pipeline: 0 };
      atual.pipeline += numero(item.valor_estimado) * (numero(item.probabilidade) / 100);
      mapa.set(nome, atual);
    });
    return Array.from(mapa.entries()).map(([nome, valores]) => ({
      nome, ...valores,
      projecao: valores.realizado / Math.max(hoje.getDate(), 1) * diasMes,
    })).sort((a, b) => b.projecao - a.projecao);
  }, [comissoes, pipeline]);

  const tendenciaPositiva = previsao.tendenciaPercentual >= 0;
  const progressoMeta = previsao.metaVendas > 0 ? (previsao.vendasAtual / previsao.metaVendas) * 100 : 0;

  return (
    <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar />
      <section className="min-w-0 flex-1"><PageHeader titulo="Previsão Comercial" subtitulo="Projeção do fechamento mensal" />
        <div className="space-y-6 p-4 sm:p-6 xl:p-8">
          {erro ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div> : null}
          {carregando ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card titulo="Vendas realizadas no mês" valor={moeda(previsao.vendasAtual)} detalhe={`${previsao.diasDecorridos} dia(s) decorridos`} />
              <Card titulo="Cenário provável" valor={moeda(previsao.cenarioProvavel)} detalhe="Ritmo atual + pipeline ponderado" />
              <Card titulo="Comissão projetada" valor={moeda(previsao.comissaoProjetada)} detalhe={`Realizada: ${moeda(previsao.comissaoAtual)}`} />
              <Card titulo="Tendência mensal" valor={`${tendenciaPositiva ? "+" : ""}${previsao.tendenciaPercentual.toFixed(1)}%`} detalhe="Comparação do ritmo diário" destaque={tendenciaPositiva ? "verde" : "vermelho"} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5"><h2 className="text-xl font-bold text-slate-900">Cenários de fechamento</h2><p className="text-sm text-slate-500">Estimativas matemáticas baseadas no ritmo do mês e nas oportunidades abertas.</p></div>
              <div className="grid gap-4 md:grid-cols-3">
                <Cenario nome="Conservador" valor={previsao.cenarioConservador} detalhe="85% do ritmo + 25% do pipeline ponderado" cor="amber" />
                <Cenario nome="Provável" valor={previsao.cenarioProvavel} detalhe="Ritmo atual + pipeline ponderado" cor="blue" />
                <Cenario nome="Otimista" valor={previsao.cenarioOtimista} detalhe="Ritmo ampliado + 75% do pipeline total" cor="emerald" />
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Pipeline ponderado considerado: <strong className="text-slate-900">{moeda(previsao.pipelinePonderado)}</strong>. O valor ponderado aplica a probabilidade registrada em cada oportunidade.</div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Caminho para as metas</h2>
                <div className="mt-5 space-y-5">
                  <MetaLinha titulo="Meta de vendas" meta={previsao.metaVendas} realizado={previsao.vendasAtual} porDia={previsao.necessarioPorDiaVendas} dias={previsao.diasRestantes} />
                  <MetaLinha titulo="Meta de comissões" meta={previsao.metaComissoes} realizado={previsao.comissaoAtual} porDia={previsao.necessarioPorDiaComissoes} dias={previsao.diasRestantes} />
                </div>
                {previsao.metaVendas > 0 ? <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(progressoMeta, 100)}%` }} /></div> : null}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Comparação mensal</h2>
                <div className="mt-5 grid grid-cols-2 gap-4"><CardInterno titulo="Mês atual" valor={moeda(previsao.vendasAtual)} /><CardInterno titulo="Mês anterior" valor={moeda(previsao.vendasMesAnterior)} /></div>
                <p className="mt-5 text-sm text-slate-600">A tendência compara o valor médio vendido por dia no mês atual com o ritmo médio diário de todo o mês anterior.</p>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5"><h2 className="text-xl font-bold text-slate-900">Projeção por representada</h2><p className="text-sm text-slate-500">Comissões do mês e oportunidades ponderadas informadas no pipeline.</p></div>
              <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-slate-700"><tr><th className="px-4 py-3">Representada</th><th className="px-4 py-3 text-right">Comissão realizada</th><th className="px-4 py-3 text-right">Projeção da comissão</th><th className="px-4 py-3 text-right">Pipeline ponderado</th></tr></thead><tbody className="divide-y divide-slate-200">{porRepresentada.map((item) => <tr key={item.nome}><td className="px-4 py-3 font-semibold">{item.nome}</td><td className="px-4 py-3 text-right">{moeda(item.realizado)}</td><td className="px-4 py-3 text-right font-semibold text-emerald-700">{moeda(item.projecao)}</td><td className="px-4 py-3 text-right">{moeda(item.pipeline)}</td></tr>)}{porRepresentada.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhuma representada com dados para projeção.</td></tr> : null}</tbody></table></div>
            </section>
          </>}
        </div>
      </section>
    </div></main>
  );
}

function Card({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe: string; destaque?: "verde" | "vermelho" }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><p className={`mt-2 text-2xl font-bold ${destaque === "verde" ? "text-emerald-700" : destaque === "vermelho" ? "text-red-700" : "text-slate-900"}`}>{valor}</p><p className="mt-2 text-xs text-slate-500">{detalhe}</p></div>;
}
function Cenario({ nome, valor, detalhe, cor }: { nome: string; valor: number; detalhe: string; cor: "amber" | "blue" | "emerald" }) {
  const cores = { amber: "border-amber-300 bg-amber-50", blue: "border-blue-300 bg-blue-50", emerald: "border-emerald-300 bg-emerald-50" };
  return <div className={`rounded-2xl border p-5 ${cores[cor]}`}><p className="font-semibold text-slate-700">{nome}</p><p className="mt-2 text-2xl font-bold text-slate-900">{moeda(valor)}</p><p className="mt-2 text-xs text-slate-600">{detalhe}</p></div>;
}
function MetaLinha({ titulo, meta, realizado, porDia, dias }: { titulo: string; meta: number; realizado: number; porDia: number; dias: number }) {
  return <div className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold text-slate-900">{titulo}</p><p className="text-sm text-slate-500">Realizado: {moeda(realizado)}</p></div><p className="font-bold text-blue-700">{meta > 0 ? moeda(meta) : "Não definida"}</p></div><p className="mt-3 text-sm text-slate-600">{meta > 0 ? porDia > 0 ? `Necessário por dia: ${moeda(porDia)} durante ${dias} dia(s).` : "Meta atingida ou período encerrado." : "Cadastre uma meta para acompanhar o esforço diário."}</p></div>;
}
function CardInterno({ titulo, valor }: { titulo: string; valor: string }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-xl font-bold text-slate-900">{valor}</p></div>; }
