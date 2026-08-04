"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { montarAcompanhamento, type ComissaoCobranca, type RegistroCobranca } from "@/lib/cobrancas/acompanhamento";
import { montarAgendaCobrancas } from "@/lib/cobrancas/agenda";

type FormContato = {
  comissao: ComissaoCobranca;
  canal: string;
  resultado: string;
  promessa_data: string;
  promessa_valor: string;
  observacoes: string;
};

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (valor: string | null) => valor ? new Date(valor).toLocaleDateString("pt-BR") : "—";
const texto = (valor: unknown) => typeof valor === "string" ? valor.trim() : "";
const relacao = (valor: unknown) => Array.isArray(valor) ? valor[0] : valor;

export default function CobrancasPage() {
  const [comissoes, setComissoes] = useState<ComissaoCobranca[]>([]);
  const [registros, setRegistros] = useState<RegistroCobranca[]>([]);
  const [empresa, setEmpresa] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [situacao, setSituacao] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [form, setForm] = useState<FormContato | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true); setErro("");
    const [resComissoes, resCobrancas] = await Promise.all([
      supabase.from("comissoes_financeiro")
        .select("id, empresa, valor_comissao, previsao_recebimento, data_previsao, status, clientes(razao_social), pedidos(numero)")
        .order("data_previsao", { ascending: true }),
      supabase.from("cobrancas_recebimentos")
        .select("id, comissao_id, contato_em, canal, resultado, promessa_data, promessa_valor, observacoes")
        .order("contato_em", { ascending: false }),
    ]);
    if (resComissoes.error) setErro(resComissoes.error.message);
    else if (resCobrancas.error) setErro(resCobrancas.error.message);
    setComissoes((resComissoes.data || []).map((item) => {
      const cliente = relacao(item.clientes) as { razao_social?: unknown } | null;
      const pedido = relacao(item.pedidos) as { numero?: unknown } | null;
      return {
        id: String(item.id), empresa: texto(item.empresa) || "Sem representada",
        cliente: texto(cliente?.razao_social) || "Cliente não informado", pedido: texto(pedido?.numero) || "—",
        valor: Number(item.valor_comissao || 0), previsao: texto(item.data_previsao) || texto(item.previsao_recebimento) || null,
        status: texto(item.status) || "Pendente",
      };
    }));
    setRegistros((resCobrancas.data || []).map((item) => ({
      id: String(item.id), comissao_id: String(item.comissao_id), contato_em: texto(item.contato_em),
      canal: texto(item.canal), resultado: texto(item.resultado), promessa_data: texto(item.promessa_data) || null,
      promessa_valor: item.promessa_valor == null ? null : Number(item.promessa_valor), observacoes: texto(item.observacoes),
    })));
    setCarregando(false);
  }

  useEffect(() => { const timer = window.setTimeout(() => void carregar(), 0); return () => window.clearTimeout(timer); }, []);
  const acompanhamento = useMemo(() => montarAcompanhamento(comissoes, registros), [comissoes, registros]);
  const empresas = useMemo(() => [...new Set(comissoes.map((item) => item.empresa))].sort(), [comissoes]);
  const itens = useMemo(() => acompanhamento.itens.filter((item) => {
    const termo = busca.toLowerCase();
    const itemSituacao = item.diasAtraso > 0 ? "Vencida" : "A vencer";
    return (!empresa || item.empresa === empresa) && (!prioridade || item.prioridade === prioridade)
      && (!situacao || itemSituacao === situacao)
      && [item.empresa, item.cliente, item.pedido].join(" ").toLowerCase().includes(termo);
  }), [acompanhamento, empresa, prioridade, situacao, busca]);
  const historico = useMemo(() => registros.filter((item) => item.comissao_id === selecionada), [registros, selecionada]);
  const agenda = useMemo(() => montarAgendaCobrancas(acompanhamento.itens, registros), [acompanhamento, registros]);

  async function copiarMensagem(mensagem: string) {
    await navigator.clipboard.writeText(mensagem);
    alert("Mensagem copiada. Revise o texto antes de enviar pelo WhatsApp.");
  }

  async function salvarContato() {
    if (!form || form.observacoes.trim().length < 3) return alert("Informe uma observação com pelo menos 3 caracteres.");
    if (form.resultado === "Promessa de pagamento" && (!form.promessa_data || Number(form.promessa_valor) <= 0)) return alert("Informe a data e o valor prometidos.");
    const { data: sessao } = await supabase.auth.getSession(); const usuario = sessao.session?.user.id;
    if (!usuario) return alert("Sessão expirada. Entre novamente no sistema.");
    const { error } = await supabase.from("cobrancas_recebimentos").insert({
      comissao_id: form.comissao.id, canal: form.canal, resultado: form.resultado,
      promessa_data: form.resultado === "Promessa de pagamento" ? form.promessa_data : null,
      promessa_valor: form.resultado === "Promessa de pagamento" ? Number(form.promessa_valor) : null,
      observacoes: form.observacoes.trim(), usuario_id: usuario,
    });
    if (error) return alert(error.message);
    setForm(null); await carregar(); alert("Contato registrado no histórico.");
  }

  return <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar /><section className="min-w-0 flex-1">
    <PageHeader titulo="Cobrança de Recebimentos" subtitulo="Acompanhamento de comissões pendentes e vencidas" />
    <div className="space-y-5 p-4 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card titulo="Pendente" valor={moeda(acompanhamento.totalPendente)} /><Card titulo="Vencido" valor={moeda(acompanhamento.totalVencido)} cor="text-red-700" /><Card titulo="Sem contato" valor={acompanhamento.semContato} cor="text-amber-700" /><Card titulo="Promessas abertas" valor={acompanhamento.promessasAbertas} cor="text-blue-700" /></div>
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar representada, cliente ou pedido..." className="rounded-xl border border-slate-300 p-3 xl:col-span-2" />
        <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="rounded-xl border border-slate-300 p-3"><option value="">Todas as representadas</option>{empresas.map((nome) => <option key={nome}>{nome}</option>)}</select>
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="rounded-xl border border-slate-300 p-3"><option value="">Todas as prioridades</option><option>Crítica</option><option>Alta</option><option>Média</option><option>Baixa</option></select>
        <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className="rounded-xl border border-slate-300 p-3"><option value="">Todas as situações</option><option>Vencida</option><option>A vencer</option></select>
      </div><div className="mt-4 flex justify-end"><button onClick={() => void carregar()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Atualizar cobranças</button></div></section>
      {erro ? <div className="rounded-xl bg-red-50 p-4 text-red-700">{erro}</div> : null}
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Agenda automática</h2><p className="text-sm text-slate-500">Promessas próximas e cobranças vencidas ainda sem contato.</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{agenda.length} compromisso(s)</span></div>{agenda.length ? <div className="grid gap-3 lg:grid-cols-2">{agenda.slice(0, 8).map((item) => <article key={item.chave} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex gap-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.urgencia === "Atrasada" ? "bg-red-100 text-red-700" : item.urgencia === "Hoje" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{item.urgencia}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.tipo}</span></div><strong className="mt-2 block">{item.empresa} · {item.cliente}</strong><span className="text-sm text-slate-500">{item.pedido} · {dataBr(item.data)} · {moeda(item.valor)}</span></div><button onClick={() => void copiarMensagem(item.mensagem)} className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-700">Copiar mensagem</button></div></article>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-center text-slate-500">Nenhum compromisso de cobrança para os próximos sete dias.</p>}</section>
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Fila de cobrança</h2><span className="text-sm text-slate-500">{itens.length} item(ns)</span></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Prioridade</th><th className="p-3">Representada / cliente</th><th className="p-3">Pedido</th><th className="p-3">Previsão</th><th className="p-3">Atraso</th><th className="p-3 text-right">Comissão</th><th className="p-3">Último contato</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{itens.map((item) => <tr key={item.id}><td className="p-3"><Prioridade valor={item.prioridade} /></td><td className="p-3"><strong className="block">{item.empresa}</strong><span className="text-slate-500">{item.cliente}</span></td><td className="p-3">{item.pedido}</td><td className="p-3">{dataBr(item.previsao)}</td><td className="p-3">{item.diasAtraso ? <span className="font-semibold text-red-700">{item.diasAtraso} dia(s)</span> : <span className="text-slate-500">A vencer</span>}</td><td className="p-3 text-right font-semibold">{moeda(item.valor)}</td><td className="p-3">{item.ultimoContato ? <><span className="block">{item.ultimoContato.canal}</span><small className="text-slate-500">{dataBr(item.ultimoContato.contato_em)}</small></> : <span className="text-amber-700">Não contatado</span>}</td><td className="p-3"><div className="flex gap-2"><button onClick={() => setForm({ comissao: item, canal: "WhatsApp", resultado: "Contato realizado", promessa_data: "", promessa_valor: String(item.valor), observacoes: "" })} className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white">Registrar contato</button><button onClick={() => setSelecionada(selecionada === item.id ? null : item.id)} className="rounded-lg border px-3 py-2">Histórico</button></div></td></tr>)}{!carregando && itens.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">Nenhuma cobrança encontrada.</td></tr> : null}</tbody></table></div></section>
      {selecionada ? <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">Histórico da cobrança</h2>{historico.length ? <div className="space-y-3">{historico.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.canal} · {item.resultado}</strong><span className="text-sm text-slate-500">{dataBr(item.contato_em)}</span></div><p className="mt-2">{item.observacoes}</p>{item.promessa_data ? <p className="mt-2 text-blue-700">Promessa: {dataBr(item.promessa_data)} · {moeda(item.promessa_valor || 0)}</p> : null}</div>)}</div> : <p className="text-slate-500">Ainda não há contatos registrados para esta comissão.</p>}</section> : null}
    </div>
    {form ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold">Registrar contato de cobrança</h2><p className="mt-1 text-sm text-slate-500">{form.comissao.empresa} · {form.comissao.cliente} · {moeda(form.comissao.valor)}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Campo titulo="Canal"><select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} className="mt-2 w-full rounded-xl border p-3"><option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Visita</option><option>Outro</option></select></Campo><Campo titulo="Resultado"><select value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} className="mt-2 w-full rounded-xl border p-3"><option>Contato realizado</option><option>Sem retorno</option><option>Promessa de pagamento</option><option>Contestação</option><option>Outro</option></select></Campo>{form.resultado === "Promessa de pagamento" ? <><Campo titulo="Data prometida"><input type="date" value={form.promessa_data} onChange={(e) => setForm({ ...form, promessa_data: e.target.value })} className="mt-2 w-full rounded-xl border p-3" /></Campo><Campo titulo="Valor prometido"><input type="number" min="0.01" step="0.01" value={form.promessa_valor} onChange={(e) => setForm({ ...form, promessa_valor: e.target.value })} className="mt-2 w-full rounded-xl border p-3" /></Campo></> : null}<label className="text-sm font-medium text-slate-600 sm:col-span-2">Observações<textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border p-3" placeholder="Descreva o contato realizado..." /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setForm(null)} className="rounded-xl border px-4 py-3">Cancelar</button><button onClick={() => void salvarContato()} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white">Salvar no histórico</button></div></div></div> : null}
  </section></div></main>;
}

function Card({ titulo, valor, cor = "text-slate-900" }: { titulo: string; valor: string | number; cor?: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><strong className={`mt-2 block text-2xl ${cor}`}>{valor}</strong></div>; }
function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <label className="text-sm font-medium text-slate-600">{titulo}{children}</label>; }
function Prioridade({ valor }: { valor: string }) { const cor = valor === "Crítica" ? "bg-red-100 text-red-700" : valor === "Alta" ? "bg-orange-100 text-orange-700" : valor === "Média" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cor}`}>{valor}</span>; }
