"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { calcularProgressoMeta, type MetaComercial, type RegistroMeta } from "@/lib/metas/calculos";
import { alterarArquivamentoComercial } from "@/services/arquivamentoComercial";

type Cliente = { id: string; razao_social: string };
type Pedido = { id: string; created_at: string; cliente_id: string | null; valor_total: number | null };
type Comissao = { pedido_id: string | null; created_at: string | null; cliente_id: string | null; empresa: string | null; valor_comissao: number | null };
type MetaForm = {
  id?: string; titulo: string; tipo: MetaComercial["tipo"]; valor_meta: string;
  periodo: MetaComercial["periodo"]; mes: string; ano: string;
  cliente_id: string; representada: string; observacoes: string;
};

const agora = new Date();
const formInicial: MetaForm = {
  titulo: "", tipo: "Vendas", valor_meta: "", periodo: "Mensal",
  mes: String(agora.getMonth() + 1), ano: String(agora.getFullYear()),
  cliente_id: "", representada: "", observacoes: "",
};

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusClasses = {
  Atingida: "bg-emerald-100 text-emerald-700",
  "No ritmo": "bg-blue-100 text-blue-700",
  Atenção: "bg-amber-100 text-amber-700",
  Atrasada: "bg-red-100 text-red-700",
  Futura: "bg-slate-100 text-slate-600",
};

export default function MetasPage() {
  const [metas, setMetas] = useState<MetaComercial[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<MetaForm>(formInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const [metasResp, pedidosResp, comissoesResp, clientesResp] = await Promise.all([
      supabase.from("metas_comerciais").select("*").order("ano", { ascending: false }).order("mes", { ascending: false }),
      supabase.from("pedidos").select("id, created_at, cliente_id, valor_total"),
      supabase.from("comissoes_financeiro").select("pedido_id, created_at, cliente_id, empresa, valor_comissao"),
      supabase.from("clientes").select("id, razao_social").order("razao_social"),
    ]);
    const falha = metasResp.error || pedidosResp.error || comissoesResp.error || clientesResp.error;
    if (falha) setErro(falha.message);
    else {
      setMetas((metasResp.data || []) as MetaComercial[]);
      setPedidos((pedidosResp.data || []) as Pedido[]);
      setComissoes((comissoesResp.data || []) as Comissao[]);
      setClientes((clientesResp.data || []) as Cliente[]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void carregarDados(), 0);
    return () => window.clearTimeout(timer);
  }, [carregarDados]);

  const representadas = useMemo(() => Array.from(new Set(comissoes.map((item) => item.empresa).filter((nome): nome is string => Boolean(nome)))).sort(), [comissoes]);
  const clientePorId = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente.razao_social])), [clientes]);

  const progressos = useMemo(() => new Map(metas.map((meta) => {
    const registros: RegistroMeta[] = meta.tipo === "Comissões"
      ? comissoes.map((item) => ({ created_at: item.created_at, valor: item.valor_comissao, cliente_id: item.cliente_id, representada: item.empresa, pedido_id: item.pedido_id }))
      : pedidos.map((item) => ({ created_at: item.created_at, valor: item.valor_total, cliente_id: item.cliente_id, pedido_id: item.id }));
    const ids = meta.representada
      ? new Set(comissoes.filter((item) => item.empresa === meta.representada && item.pedido_id).map((item) => item.pedido_id as string))
      : null;
    return [meta.id, calcularProgressoMeta(meta, registros, ids)] as const;
  })), [comissoes, metas, pedidos]);

  const resumo = useMemo(() => ({
    total: metas.length,
    atingidas: metas.filter((meta) => progressos.get(meta.id)?.situacao === "Atingida").length,
    atencao: metas.filter((meta) => ["Atenção", "Atrasada"].includes(progressos.get(meta.id)?.situacao || "")).length,
    potencial: metas.reduce((total, meta) => total + Number(meta.valor_meta || 0), 0),
  }), [metas, progressos]);

  async function salvarMeta() {
    if (!form.titulo.trim()) return alert("Informe o título da meta.");
    if (Number(form.valor_meta) <= 0) return alert("Informe um valor de meta maior que zero.");
    if (form.periodo === "Mensal" && (Number(form.mes) < 1 || Number(form.mes) > 12)) return alert("Selecione um mês válido.");
    if (Number(form.ano) < 2020) return alert("Informe um ano válido.");

    setSalvando(true);
    const payload = {
      titulo: form.titulo.trim(), tipo: form.tipo, valor_meta: Number(form.valor_meta),
      periodo: form.periodo, mes: form.periodo === "Mensal" ? Number(form.mes) : null,
      ano: Number(form.ano), cliente_id: form.cliente_id || null,
      representada: form.representada || null, observacoes: form.observacoes.trim() || null,
    };
    const { error } = form.id
      ? await supabase.from("metas_comerciais").update(payload).eq("id", form.id)
      : await supabase.from("metas_comerciais").insert(payload);
    setSalvando(false);
    if (error) return alert(error.message);
    setForm(formInicial);
    await carregarDados();
  }

  async function alterarArquivoMeta(meta: MetaComercial) {
    const arquivar = !meta.arquivada;
    const motivo = prompt(arquivar ? "Informe o motivo do arquivamento:" : "Informe o motivo da reativação:");
    if (motivo === null) return;
    try { await alterarArquivamentoComercial("metas", meta.id, motivo, arquivar); }
    catch (error) { return alert((error as Error).message); }
    await carregarDados();
  }

  function editarMeta(meta: MetaComercial) {
    setForm({
      id: meta.id, titulo: meta.titulo, tipo: meta.tipo,
      valor_meta: String(meta.valor_meta), periodo: meta.periodo,
      mes: String(meta.mes || agora.getMonth() + 1), ano: String(meta.ano),
      cliente_id: meta.cliente_id || "", representada: meta.representada || "",
      observacoes: meta.observacoes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar />
      <section className="min-w-0 flex-1"><PageHeader titulo="Metas Comerciais" subtitulo="Acompanhamento de vendas e comissões" />
        <div className="space-y-6 p-4 sm:p-6 xl:p-8">
          {erro ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Metas cadastradas", resumo.total], ["Metas atingidas", resumo.atingidas], ["Precisam de atenção", resumo.atencao], ["Potencial das metas", moeda(resumo.potencial)]].map(([titulo, valor]) => (
              <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p></div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">{form.id ? "Editar meta" : "Nova meta"}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-medium text-slate-600">Título<input aria-label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3" placeholder="Ex.: Meta de vendas de agosto" /></label>
              <label className="text-sm font-medium text-slate-600">Tipo<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as MetaComercial["tipo"] })} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option>Vendas</option><option>Comissões</option></select></label>
              <label className="text-sm font-medium text-slate-600">Valor da meta<input aria-label="Valor da meta" type="number" min="0" step="0.01" value={form.valor_meta} onChange={(e) => setForm({ ...form, valor_meta: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label>
              <label className="text-sm font-medium text-slate-600">Período<select value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value as MetaComercial["periodo"] })} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option>Mensal</option><option>Anual</option></select></label>
              <label className="text-sm font-medium text-slate-600">Mês<select disabled={form.periodo === "Anual"} value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3 disabled:bg-slate-100">{meses.map((nome, index) => <option key={nome} value={index + 1}>{nome}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-600">Ano<input aria-label="Ano" type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label>
              <label className="text-sm font-medium text-slate-600">Cliente (opcional)<select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="">Todos os clientes</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.razao_social}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-600">Representada (opcional)<select value={form.representada} onChange={(e) => setForm({ ...form, representada: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="">Todas as representadas</option>{representadas.map((nome) => <option key={nome}>{nome}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-600 md:col-span-2 xl:col-span-4">Observações<textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 p-3" /></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={salvando} onClick={() => void salvarMeta()} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-60">{salvando ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar meta"}</button><button type="button" onClick={() => setForm(formInicial)} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">{form.id ? "Cancelar edição" : "Limpar"}</button></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5"><h2 className="text-xl font-bold text-slate-900">Acompanhamento das metas</h2><p className="text-sm text-slate-500">O realizado considera somente o período e os segmentos definidos em cada meta.</p></div>
            {carregando ? <div className="h-32 animate-pulse rounded-xl bg-slate-100" /> : <div className="grid gap-5 xl:grid-cols-2">
              {metas.map((meta) => { const progresso = progressos.get(meta.id)!; return (
                <article key={meta.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{meta.titulo}</h3><p className="text-sm text-slate-500">{meta.tipo} • {meta.periodo === "Mensal" ? `${meses[Number(meta.mes) - 1]}/` : ""}{meta.ano}</p><p className="mt-1 text-xs text-slate-500">{meta.cliente_id ? clientePorId.get(meta.cliente_id) : "Todos os clientes"} • {meta.representada || "Todas as representadas"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[progresso.situacao]}`}>{progresso.situacao}</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Realizado</p><p className="font-bold text-blue-700">{moeda(progresso.realizado)}</p></div><div><p className="text-slate-500">Meta</p><p className="font-bold">{moeda(meta.valor_meta)}</p></div><div><p className="text-slate-500">Falta</p><p className="font-bold text-amber-700">{moeda(progresso.restante)}</p></div><div><p className="text-slate-500">Progresso</p><p className="font-bold">{progresso.percentual.toFixed(1)}%</p></div></div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${progresso.situacao === "Atingida" ? "bg-emerald-500" : progresso.situacao === "Atrasada" ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${Math.min(progresso.percentual, 100)}%` }} /></div>
                  <p className="mt-2 text-xs text-slate-500">Ritmo esperado até hoje: {progresso.esperado.toFixed(1)}%</p>
                  {meta.observacoes ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{meta.observacoes}</p> : null}
                  <div className="mt-4 flex gap-2"><button type="button" onClick={() => editarMeta(meta)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Editar</button><button type="button" onClick={() => void alterarArquivoMeta(meta)} className={meta.arquivada ? "rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700" : "rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"}>{meta.arquivada ? "Reativar" : "Arquivar"}</button></div>
                </article>
              ); })}
              {metas.length === 0 ? <p className="py-10 text-center text-slate-500 xl:col-span-2">Nenhuma meta cadastrada.</p> : null}
            </div>}
          </section>
        </div>
      </section>
    </div></main>
  );
}
