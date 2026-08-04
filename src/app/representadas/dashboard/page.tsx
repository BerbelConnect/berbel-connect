"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import {
  calcularDesempenhoRepresentadas,
  intervaloPeriodo,
  type ComissaoRepresentada,
} from "@/lib/representadas/desempenho";

type ItemPedido = { pedido_id: string | null; produto_nome: string | null; quantidade: number | null };
type Periodo = "mes" | "30d" | "90d" | "ano" | "custom";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (valor: unknown) => Number(valor || 0);
const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const clienteNome = (clientes: unknown) => {
  const cliente = Array.isArray(clientes) ? clientes[0] : clientes;
  return cliente && typeof cliente === "object" && "razao_social" in cliente
    ? texto((cliente as { razao_social?: unknown }).razao_social) || "Cliente não informado"
    : "Cliente não informado";
};

export default function DashboardRepresentadasPage() {
  const [comissoes, setComissoes] = useState<ComissaoRepresentada[]>([]);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [representada, setRepresentada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");
    const [comissoesResp, itensResp] = await Promise.all([
      supabase.from("comissoes_financeiro").select("id, pedido_id, created_at, empresa, valor_base, valor_comissao, status, clientes(razao_social)"),
      supabase.from("pedido_itens").select("pedido_id, produto_nome, quantidade"),
    ]);
    if (comissoesResp.error || itensResp.error) {
      setErro(comissoesResp.error?.message || itensResp.error?.message || "Não foi possível carregar os dados.");
    } else {
      setComissoes((comissoesResp.data || []).map((item) => ({
        id: String(item.id), pedido_id: item.pedido_id ? String(item.pedido_id) : null,
        created_at: texto(item.created_at), empresa: texto(item.empresa) || "Sem representada",
        valor_base: numero(item.valor_base), valor_comissao: numero(item.valor_comissao),
        status: texto(item.status), cliente: clienteNome(item.clientes),
      })));
      setItens((itensResp.data || []) as ItemPedido[]);
    }
    setCarregando(false);
  }

  useEffect(() => { const timer = window.setTimeout(() => { void carregarDados(); }, 0); return () => window.clearTimeout(timer); }, []);

  const intervalo = useMemo(() => intervaloPeriodo(periodo, inicio, fim), [periodo, inicio, fim]);
  const resultado = useMemo(() => calcularDesempenhoRepresentadas(comissoes, intervalo.inicio, intervalo.fim), [comissoes, intervalo]);
  const nomes = useMemo(() => resultado.representadas.map((item) => item.nome), [resultado]);
  const linhas = representada ? resultado.representadas.filter((item) => item.nome === representada) : resultado.representadas;
  const resumo = useMemo(() => linhas.reduce((acc, item) => ({
    pedidos: acc.pedidos + item.pedidos, vendas: acc.vendas + item.vendas,
    prevista: acc.prevista + item.comissao, recebida: acc.recebida + item.recebida,
    pendente: acc.pendente + item.pendente,
  }), { pedidos: 0, vendas: 0, prevista: 0, recebida: 0, pendente: 0 }), [linhas]);

  const idsPedidos = useMemo(() => new Set(comissoes.filter((item) => {
    const data = item.created_at.slice(0, 10);
    return data >= intervalo.inicio && data <= intervalo.fim && (!representada || item.empresa === representada);
  }).map((item) => item.pedido_id).filter(Boolean)), [comissoes, intervalo, representada]);

  const topProdutos = useMemo(() => {
    const mapa = new Map<string, number>();
    itens.filter((item) => item.pedido_id && idsPedidos.has(item.pedido_id)).forEach((item) => {
      const nome = texto(item.produto_nome) || "Produto não informado";
      mapa.set(nome, (mapa.get(nome) || 0) + numero(item.quantidade));
    });
    return [...mapa].map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  }, [itens, idsPedidos]);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, number>();
    comissoes.filter((item) => {
      const data = item.created_at.slice(0, 10);
      return data >= intervalo.inicio && data <= intervalo.fim && (!representada || item.empresa === representada);
    }).forEach((item) => mapa.set(item.cliente, (mapa.get(item.cliente) || 0) + item.valor_base));
    return [...mapa].map(([nome, vendas]) => ({ nome, vendas })).sort((a, b) => b.vendas - a.vendas).slice(0, 5);
  }, [comissoes, intervalo, representada]);

  return <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar /><section className="min-w-0 flex-1">
    <PageHeader titulo="Desempenho das Representadas" subtitulo="Vendas, comissões e evolução por empresa" />
    <div className="space-y-5 p-4 md:p-8">
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-5">
        <label className="text-sm font-medium text-slate-600">Período<select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="mes">Mês atual</option><option value="30d">Últimos 30 dias</option><option value="90d">Últimos 90 dias</option><option value="ano">Ano atual</option><option value="custom">Personalizado</option></select></label>
        <label className="text-sm font-medium text-slate-600">Representada<select value={representada} onChange={(e) => setRepresentada(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3"><option value="">Todas</option>{nomes.map((nome) => <option key={nome}>{nome}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-600">Data inicial<input type="date" disabled={periodo !== "custom"} value={inicio} onChange={(e) => setInicio(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 disabled:bg-slate-100" /></label>
        <label className="text-sm font-medium text-slate-600">Data final<input type="date" disabled={periodo !== "custom"} value={fim} onChange={(e) => setFim(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 disabled:bg-slate-100" /></label>
        <button onClick={() => void carregarDados()} className="self-end rounded-xl bg-slate-900 p-3 font-semibold text-white">Atualizar</button>
      </div><p className="mt-3 text-xs text-slate-500">Dados de {new Date(`${intervalo.inicio}T00:00:00`).toLocaleDateString("pt-BR")} a {new Date(`${intervalo.fim}T00:00:00`).toLocaleDateString("pt-BR")}.</p></section>

      {erro ? <div className="rounded-xl bg-red-50 p-4 text-red-700">{erro}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Card titulo="Pedidos" valor={resumo.pedidos} /><Card titulo="Valor intermediado" valor={moeda(resumo.vendas)} /><Card titulo="Comissão prevista" valor={moeda(resumo.prevista)} /><Card titulo="Comissão recebida" valor={moeda(resumo.recebida)} destaque="text-emerald-700" /><Card titulo="Comissão pendente" valor={moeda(resumo.pendente)} destaque="text-amber-700" /></div>

      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="text-xl font-bold text-slate-900">Comparativo por representada</h2><p className="text-sm text-slate-500">Projeção mensal considera o ritmo diário do mês atual.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-4 py-3">Representada</th><th className="px-4 py-3 text-right">Pedidos</th><th className="px-4 py-3 text-right">Vendas</th><th className="px-4 py-3 text-right">Comissão</th><th className="px-4 py-3 text-right">Recebida</th><th className="px-4 py-3 text-right">Pendente</th><th className="px-4 py-3 text-right">Projeção</th></tr></thead><tbody className="divide-y divide-slate-200">{linhas.map((item) => <tr key={item.nome}><td className="px-4 py-3 font-semibold">{item.nome}</td><td className="px-4 py-3 text-right">{item.pedidos}</td><td className="px-4 py-3 text-right">{moeda(item.vendas)}</td><td className="px-4 py-3 text-right">{moeda(item.comissao)}</td><td className="px-4 py-3 text-right text-emerald-700">{moeda(item.recebida)}</td><td className="px-4 py-3 text-right text-amber-700">{moeda(item.pendente)}</td><td className="px-4 py-3 text-right font-semibold text-blue-700">{moeda(item.projecao)}</td></tr>)}{!carregando && linhas.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhum dado encontrado no período.</td></tr> : null}</tbody></table></div></section>

      <div className="grid gap-5 lg:grid-cols-2"><Ranking titulo="Top clientes" itens={topClientes.map((item) => ({ nome: item.nome, valor: moeda(item.vendas) }))} /><Ranking titulo="Top produtos" itens={topProdutos.map((item) => ({ nome: item.nome, valor: `${item.quantidade.toLocaleString("pt-BR")} un.` }))} /></div>
    </div>
  </section></div></main>;
}

function Card({ titulo, valor, destaque = "text-slate-900" }: { titulo: string; valor: string | number; destaque?: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{titulo}</p><strong className={`mt-2 block text-2xl ${destaque}`}>{valor}</strong></div>; }
function Ranking({ titulo, itens }: { titulo: string; itens: { nome: string; valor: string }[] }) { return <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold text-slate-900">{titulo}</h2><div className="space-y-2">{itens.map((item, index) => <div key={item.nome} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><span><b className="mr-2 text-blue-600">{index + 1}.</b>{item.nome}</span><strong>{item.valor}</strong></div>)}{itens.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-slate-500">Nenhum dado encontrado.</p> : null}</div></section>; }
