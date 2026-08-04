"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { baixarMovimento } from "@/lib/financeiro/baixarMovimento";
import { estornarMovimento } from "@/lib/financeiro/estornarMovimento";
import { calcularFechamento, intervaloFechamento, type ComissaoFechamento } from "@/lib/comissoes/fechamento";
import { exportarFechamentoExcel, exportarFechamentoPdf } from "@/services/comissoes/exportFechamento";

type Periodo = "mes" | "30d" | "90d" | "ano" | "custom";
type BaixaForm = { id: string; data: string; forma: string; motivo: string };
const hoje = () => new Date().toISOString().slice(0, 10);
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (valor: string | null) => valor ? new Date(`${valor.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : "—";
const texto = (valor: unknown) => typeof valor === "string" ? valor.trim() : "";
const numero = (valor: unknown) => Number(valor || 0);
const relacao = (valor: unknown) => Array.isArray(valor) ? valor[0] : valor;

export default function ComissoesFinanceiroPage() {
  const [comissoes, setComissoes] = useState<ComissaoFechamento[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [situacao, setSituacao] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [baixa, setBaixa] = useState<BaixaForm | null>(null);

  async function carregarComissoes() {
    setCarregando(true); setErro("");
    const { data, error } = await supabase.from("comissoes_financeiro")
      .select("id, pedido_id, created_at, empresa, percentual, valor_base, valor_comissao, previsao_recebimento, data_previsao, data_recebimento, status, clientes(razao_social), pedidos(numero, status)")
      .order("created_at", { ascending: false });
    if (error) setErro(error.message);
    else setComissoes((data || []).map((item) => {
      const cliente = relacao(item.clientes) as { razao_social?: unknown } | null;
      const pedido = relacao(item.pedidos) as { numero?: unknown; status?: unknown } | null;
      return {
        id: String(item.id), pedido_id: item.pedido_id ? String(item.pedido_id) : null,
        created_at: texto(item.created_at), empresa: texto(item.empresa) || "Sem representada",
        cliente: texto(cliente?.razao_social) || "Cliente não informado", pedido: texto(pedido?.numero) || "—",
        pedido_status: texto(pedido?.status), percentual: numero(item.percentual), valor_base: numero(item.valor_base),
        valor_comissao: numero(item.valor_comissao), previsao: texto(item.data_previsao) || texto(item.previsao_recebimento) || null,
        recebimento: texto(item.data_recebimento) || null, status: texto(item.status) || "Pendente",
      };
    }));
    setCarregando(false);
  }

  useEffect(() => { const timer = window.setTimeout(() => { void carregarComissoes(); }, 0); return () => window.clearTimeout(timer); }, []);
  const intervalo = useMemo(() => intervaloFechamento(periodo, inicio, fim), [periodo, inicio, fim]);
  const fechamento = useMemo(() => calcularFechamento(comissoes, intervalo.inicio, intervalo.fim), [comissoes, intervalo]);
  const empresas = useMemo(() => [...new Set(comissoes.map((item) => item.empresa))].sort(), [comissoes]);
  const filtradas = useMemo(() => fechamento.registros.filter((item) => {
    const termo = busca.toLowerCase();
    return (!empresa || item.empresa === empresa) && (!situacao || item.situacao === situacao)
      && [item.empresa, item.cliente, item.pedido, item.status].join(" ").toLowerCase().includes(termo);
  }), [fechamento, empresa, situacao, busca]);
  const resumo = useMemo(() => calcularFechamento(filtradas, "0000-01-01", "9999-12-31").resumo, [filtradas]);
  const porEmpresa = useMemo(() => calcularFechamento(filtradas, "0000-01-01", "9999-12-31").porEmpresa, [filtradas]);

  async function confirmarBaixa() {
    if (!baixa) return;
    if (baixa.motivo.trim().length < 3) return alert("Informe um motivo com pelo menos 3 caracteres.");
    try {
      await baixarMovimento({ tipo: "comissao", id: baixa.id, data: baixa.data, formaPagamento: baixa.forma, motivo: baixa.motivo });
      setBaixa(null); await carregarComissoes(); alert("Recebimento registrado com auditoria.");
    } catch (error) { alert(error instanceof Error ? error.message : "Não foi possível registrar o recebimento."); }
  }
  async function estornar(id: string) {
    const motivo = prompt("Informe o motivo do estorno:"); if (motivo === null) return;
    try { await estornarMovimento({ tipo: "comissao", id, motivo }); await carregarComissoes(); alert("Recebimento estornado com auditoria."); }
    catch (error) { alert(error instanceof Error ? error.message : "Não foi possível estornar."); }
  }
  const exportData = { registros: filtradas, resumo, porEmpresa, inicio: intervalo.inicio, fim: intervalo.fim, empresa: empresa || "Todas" };

  return <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar /><section className="min-w-0 flex-1">
    <PageHeader titulo="Fechamento de Comissões" subtitulo="Conferência e recebimentos por representada" />
    <div className="space-y-5 p-4 md:p-8">
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        <Campo titulo="Período"><select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="mes">Mês atual</option><option value="30d">Últimos 30 dias</option><option value="90d">Últimos 90 dias</option><option value="ano">Ano atual</option><option value="custom">Personalizado</option></select></Campo>
        <Campo titulo="Representada"><select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="">Todas</option>{empresas.map((nome) => <option key={nome}>{nome}</option>)}</select></Campo>
        <Campo titulo="Situação"><select value={situacao} onChange={(e) => setSituacao(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="">Todas</option><option>Pendente</option><option>Vencida</option><option>Recebida</option></select></Campo>
        <Campo titulo="Data inicial"><input type="date" disabled={periodo !== "custom"} value={inicio} onChange={(e) => setInicio(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 disabled:bg-slate-100" /></Campo>
        <Campo titulo="Data final"><input type="date" disabled={periodo !== "custom"} value={fim} onChange={(e) => setFim(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 disabled:bg-slate-100" /></Campo>
        <button onClick={() => exportarFechamentoExcel(exportData)} className="self-end rounded-xl border border-emerald-500 p-3 font-semibold text-emerald-700">Excel</button>
        <button onClick={() => exportarFechamentoPdf(exportData)} className="self-end rounded-xl bg-slate-900 p-3 font-semibold text-white">PDF</button>
      </div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar representada, cliente ou pedido..." className="w-full max-w-xl rounded-xl border border-slate-300 p-3" /><button onClick={() => void carregarComissoes()} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Atualizar</button></div></section>
      {erro ? <div className="rounded-xl bg-red-50 p-4 text-red-700">{erro}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Card titulo="Comissões" valor={filtradas.length} /><Card titulo="Previsto" valor={moeda(resumo.previsto)} /><Card titulo="Recebido" valor={moeda(resumo.recebido)} cor="text-emerald-700" /><Card titulo="Pendente" valor={moeda(resumo.pendente)} cor="text-amber-700" /><Card titulo="Vencido" valor={moeda(resumo.vencido)} cor="text-red-700" /></div>
      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">Fechamento por representada</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Representada</th><th className="p-3 text-right">Registros</th><th className="p-3 text-right">Valor base</th><th className="p-3 text-right">Comissão</th><th className="p-3 text-right">Recebida</th><th className="p-3 text-right">Pendente</th><th className="p-3 text-right">Vencida</th></tr></thead><tbody className="divide-y">{porEmpresa.map((item) => <tr key={item.empresa}><td className="p-3 font-semibold">{item.empresa}</td><td className="p-3 text-right">{item.registros}</td><td className="p-3 text-right">{moeda(item.valorBase)}</td><td className="p-3 text-right">{moeda(item.comissao)}</td><td className="p-3 text-right text-emerald-700">{moeda(item.recebida)}</td><td className="p-3 text-right text-amber-700">{moeda(item.pendente)}</td><td className="p-3 text-right text-red-700">{moeda(item.vencida)}</td></tr>)}</tbody></table></div></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">Comissões detalhadas</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Representada</th><th className="p-3">Cliente</th><th className="p-3">Pedido</th><th className="p-3">Previsão</th><th className="p-3 text-right">Base</th><th className="p-3 text-right">Comissão</th><th className="p-3">Situação</th><th className="p-3">Ação</th></tr></thead><tbody className="divide-y">{filtradas.map((item) => <tr key={item.id}><td className="p-3 font-semibold">{item.empresa}</td><td className="p-3">{item.cliente}</td><td className="p-3">{item.pedido}</td><td className="p-3">{dataBr(item.previsao)}</td><td className="p-3 text-right">{moeda(item.valor_base)}</td><td className="p-3 text-right font-semibold text-emerald-700">{moeda(item.valor_comissao)}</td><td className="p-3"><Badge situacao={item.situacao} /></td><td className="p-3">{item.situacao === "Recebida" ? <button onClick={() => void estornar(item.id)} className="rounded-lg bg-amber-100 px-3 py-2 text-amber-800">Estornar</button> : <button onClick={() => setBaixa({ id: item.id, data: hoje(), forma: "Transferência", motivo: "Comissão recebida" })} className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white">Receber</button>}</td></tr>)}{!carregando && filtradas.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">Nenhuma comissão encontrada.</td></tr> : null}</tbody></table></div></section>
    </div>
    {baixa ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold">Registrar recebimento</h2><div className="mt-5 space-y-4"><Campo titulo="Data"><input type="date" value={baixa.data} onChange={(e) => setBaixa({ ...baixa, data: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></Campo><Campo titulo="Forma de recebimento"><select value={baixa.forma} onChange={(e) => setBaixa({ ...baixa, forma: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option>Transferência</option><option>PIX</option><option>Boleto</option><option>Dinheiro</option><option>Outro</option></select></Campo><Campo titulo="Motivo para auditoria"><input value={baixa.motivo} onChange={(e) => setBaixa({ ...baixa, motivo: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></Campo></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setBaixa(null)} className="rounded-xl border px-4 py-3">Cancelar</button><button onClick={() => void confirmarBaixa()} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white">Confirmar recebimento</button></div></div></div> : null}
  </section></div></main>;
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <label className="text-sm font-medium text-slate-600">{titulo}{children}</label>; }
function Card({ titulo, valor, cor = "text-slate-900" }: { titulo: string; valor: string | number; cor?: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><strong className={`mt-2 block text-2xl ${cor}`}>{valor}</strong></div>; }
function Badge({ situacao }: { situacao: string }) { const cor = situacao === "Recebida" ? "bg-emerald-100 text-emerald-700" : situacao === "Vencida" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cor}`}>{situacao}</span>; }
