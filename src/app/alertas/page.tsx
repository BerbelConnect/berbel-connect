"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { gerarAlertasInteligentes, type AlertaInteligente, type CategoriaAlerta, type GravidadeAlerta } from "@/lib/alertas/gerarAlertas";
import { calcularProgressoMeta, type MetaComercial, type RegistroMeta } from "@/lib/metas/calculos";
import { dataIsoBrasil } from "@/lib/dataBrasil";

type Linha = Record<string, unknown>;

function texto(value: unknown) { return typeof value === "string" ? value : null; }
function numero(value: unknown) { return Number(value || 0); }
function relacaoNome(value: unknown) {
  if (Array.isArray(value)) return texto((value[0] as Linha | undefined)?.razao_social);
  if (value && typeof value === "object") return texto((value as Linha).razao_social);
  return null;
}
function relacaoEmpresa(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object" ? texto((item as Linha).empresa) : null;
}

const gravidadeClasses: Record<GravidadeAlerta, string> = {
  Crítico: "border-red-500 bg-red-50 text-red-700",
  Alto: "border-orange-500 bg-orange-50 text-orange-700",
  Médio: "border-amber-500 bg-amber-50 text-amber-700",
  Baixo: "border-blue-500 bg-blue-50 text-blue-700",
};
const categorias: (CategoriaAlerta | "Todas")[] = ["Todas", "Metas", "Clientes", "Financeiro", "Comissões", "Pipeline", "Agenda"];

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaInteligente[]>([]);
  const [resolvidos, setResolvidos] = useState<Set<string>>(new Set());
  const [categoria, setCategoria] = useState<CategoriaAlerta | "Todas">("Todas");
  const [gravidade, setGravidade] = useState<GravidadeAlerta | "Todas">("Todas");
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"ativos" | "resolvidos">("ativos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const hojeIso = dataIsoBrasil();
    const { data: sessao } = await supabase.auth.getSession();
    const usuarioId = sessao.session?.user.id;

    const [clientes, visitas, receber, pagar, pipeline, comissoes, metas, pedidos, cobrancas, resolvidosResp] = await Promise.all([
      supabase.from("vw_alertas_comerciais").select("*"),
      supabase.from("visitas").select("id, data_visita, clientes(razao_social)").eq("data_visita", hojeIso),
      supabase.from("contas_receber").select("id, descricao, valor, vencimento, status, clientes(razao_social)").neq("status", "Recebido"),
      supabase.from("contas_pagar").select("id, descricao, fornecedor, valor, vencimento, status, dias_aviso").eq("status", "Pendente"),
      supabase.from("pipeline_comercial").select("id, oportunidade, proximo_contato, status, clientes(razao_social)").neq("status", "Fechado"),
      supabase.from("comissoes_financeiro").select("id, pedido_id, created_at, cliente_id, empresa, valor_comissao, data_previsao, previsao_recebimento, status").neq("status", "Recebida"),
      supabase.from("metas_comerciais").select("*"),
      supabase.from("pedidos").select("id, created_at, cliente_id, valor_total"),
      supabase.from("cobrancas_recebimentos").select("id, comissao_id, resultado, promessa_data, promessa_valor, comissoes_financeiro(empresa)").eq("resultado", "Promessa de pagamento").not("promessa_data", "is", null),
      usuarioId ? supabase.from("alertas_resolvidos").select("alerta_chave").eq("usuario_id", usuarioId) : Promise.resolve({ data: [], error: null }),
    ]);

    const falha = [clientes, visitas, receber, pagar, pipeline, comissoes, metas, pedidos, cobrancas, resolvidosResp].find((resp) => resp.error)?.error;
    if (falha) {
      setErro(falha.message);
      setCarregando(false);
      return;
    }

    const clienteRows = (clientes.data || []) as Linha[];
    const comissaoRows = (comissoes.data || []) as Linha[];
    const pedidoRows = (pedidos.data || []) as Linha[];
    const fontesMetas = ((metas.data || []) as MetaComercial[]).map((meta) => {
      const registros: RegistroMeta[] = meta.tipo === "Comissões"
        ? comissaoRows.map((item) => ({ created_at: texto(item.created_at), valor: numero(item.valor_comissao), cliente_id: texto(item.cliente_id), representada: texto(item.empresa), pedido_id: texto(item.pedido_id) }))
        : pedidoRows.map((item) => ({ created_at: texto(item.created_at), valor: numero(item.valor_total), cliente_id: texto(item.cliente_id), pedido_id: texto(item.id) }));
      const ids = meta.representada ? new Set(comissaoRows.filter((item) => texto(item.empresa) === meta.representada).map((item) => texto(item.pedido_id)).filter((id): id is string => Boolean(id))) : null;
      const progresso = calcularProgressoMeta(meta, registros, ids);
      return { id: meta.id, titulo: meta.titulo, situacao: progresso.situacao, detalhe: `${progresso.percentual.toFixed(1)}% realizado` };
    });

    setAlertas(gerarAlertasInteligentes({
      clientesSemCompra: clienteRows.map((item) => ({ id: String(item.id), nome: texto(item.razao_social), data: texto(item.ultima_compra) })),
      clientesSemVisita: clienteRows.map((item) => ({ id: String(item.id), nome: texto(item.razao_social), data: texto(item.ultima_visita) })),
      visitasHoje: ((visitas.data || []) as Linha[]).map((item) => ({ id: String(item.id), data: texto(item.data_visita), cliente: relacaoNome(item.clientes) })),
      contasReceber: ((receber.data || []) as Linha[]).map((item) => ({ id: String(item.id), titulo: texto(item.descricao), cliente: relacaoNome(item.clientes), valor: numero(item.valor), data: texto(item.vencimento), status: texto(item.status) })),
      contasPagar: ((pagar.data || []) as Linha[]).map((item) => ({ id: String(item.id), titulo: texto(item.descricao), cliente: texto(item.fornecedor), valor: numero(item.valor), data: texto(item.vencimento), status: texto(item.status), diasAviso: numero(item.dias_aviso) })),
      comissoes: comissaoRows.map((item) => ({ id: String(item.id), titulo: texto(item.empresa), valor: numero(item.valor_comissao), data: texto(item.data_previsao) || texto(item.previsao_recebimento), status: texto(item.status) })),
      pipeline: ((pipeline.data || []) as Linha[]).map((item) => ({ id: String(item.id), titulo: texto(item.oportunidade), cliente: relacaoNome(item.clientes), data: texto(item.proximo_contato), status: texto(item.status) })),
      metas: fontesMetas,
      cobrancas: ((cobrancas.data || []) as Linha[]).map((item) => ({ id: String(item.id), titulo: relacaoEmpresa(item.comissoes_financeiro), valor: numero(item.promessa_valor), data: texto(item.promessa_data) })),
    }));
    setResolvidos(new Set(((resolvidosResp.data || []) as Linha[]).map((item) => String(item.alerta_chave))));
    setCarregando(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  async function resolver(alerta: AlertaInteligente) {
    const { data: sessao } = await supabase.auth.getSession();
    const usuarioId = sessao.session?.user.id;
    if (!usuarioId) return alert("Sua sessão expirou. Entre novamente.");
    const { error } = await supabase.from("alertas_resolvidos").upsert({ alerta_chave: alerta.chave, usuario_id: usuarioId }, { onConflict: "alerta_chave,usuario_id" });
    if (error) return alert(error.message);
    setResolvidos((atual) => new Set(atual).add(alerta.chave));
  }

  async function reabrir(alerta: AlertaInteligente) {
    const { data: sessao } = await supabase.auth.getSession();
    const usuarioId = sessao.session?.user.id;
    if (!usuarioId) return;
    const { error } = await supabase.from("alertas_resolvidos").delete().eq("alerta_chave", alerta.chave).eq("usuario_id", usuarioId);
    if (error) return alert(error.message);
    setResolvidos((atual) => { const proximo = new Set(atual); proximo.delete(alerta.chave); return proximo; });
  }

  const filtrados = useMemo(() => alertas.filter((item) => {
    const estaResolvido = resolvidos.has(item.chave);
    if ((aba === "resolvidos") !== estaResolvido) return false;
    if (categoria !== "Todas" && item.categoria !== categoria) return false;
    if (gravidade !== "Todas" && item.gravidade !== gravidade) return false;
    const termo = busca.toLocaleLowerCase("pt-BR");
    return `${item.titulo} ${item.detalhe}`.toLocaleLowerCase("pt-BR").includes(termo);
  }), [aba, alertas, busca, categoria, gravidade, resolvidos]);

  const ativos = alertas.filter((item) => !resolvidos.has(item.chave));
  const resumo = {
    total: ativos.length,
    criticos: ativos.filter((item) => item.gravidade === "Crítico").length,
    altos: ativos.filter((item) => item.gravidade === "Alto").length,
    resolvidos: alertas.filter((item) => resolvidos.has(item.chave)).length,
  };

  return (
    <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar />
      <section className="min-w-0 flex-1"><PageHeader titulo="Central de Alertas" subtitulo="Prioridades comerciais e financeiras" />
        <div className="space-y-6 p-4 sm:p-6 xl:p-8">
          {erro ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Alertas ativos", resumo.total], ["Críticos", resumo.criticos], ["Alta prioridade", resumo.altos], ["Resolvidos", resumo.resolvidos]].map(([titulo, valor]) => <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p></div>)}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar alertas..." className="rounded-xl border border-slate-300 p-3" />
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaAlerta | "Todas")} className="rounded-xl border border-slate-300 p-3">{categorias.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={gravidade} onChange={(e) => setGravidade(e.target.value as GravidadeAlerta | "Todas")} className="rounded-xl border border-slate-300 p-3"><option>Todas</option><option>Crítico</option><option>Alto</option><option>Médio</option><option>Baixo</option></select>
              <button type="button" onClick={() => void carregar()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Atualizar alertas</button>
            </div>
            <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => setAba("ativos")} className={`rounded-xl px-5 py-2 text-sm font-semibold ${aba === "ativos" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>Ativos ({resumo.total})</button><button type="button" onClick={() => setAba("resolvidos")} className={`rounded-xl px-5 py-2 text-sm font-semibold ${aba === "resolvidos" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>Resolvidos ({resumo.resolvidos})</button></div>
          </section>

          {carregando ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : <div className="space-y-4">
            {filtrados.map((alertaItem) => <article key={alertaItem.chave} className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${gravidadeClasses[alertaItem.gravidade].split(" ")[0]}`}>
              <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${gravidadeClasses[alertaItem.gravidade].split(" ").slice(1).join(" ")}`}>{alertaItem.gravidade}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{alertaItem.categoria}</span></div><h2 className="mt-3 text-lg font-bold text-slate-900">{alertaItem.titulo}</h2><p className="mt-1 text-sm text-slate-600">{alertaItem.detalhe}</p></div><div className="flex flex-wrap gap-2"><Link href={alertaItem.href} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Ver origem</Link>{aba === "ativos" ? <button type="button" onClick={() => void resolver(alertaItem)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Marcar resolvido</button> : <button type="button" onClick={() => void reabrir(alertaItem)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Reabrir</button>}</div></div>
            </article>)}
            {filtrados.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500">Nenhum alerta encontrado com estes filtros.</div> : null}
          </div>}
        </div>
      </section>
    </div></main>
  );
}
