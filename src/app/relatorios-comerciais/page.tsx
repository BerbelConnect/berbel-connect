"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RelatoriosComerciaisPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);

  async function carregarDados() {
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    const itensResp = await supabase
      .from("pedido_itens")
      .select("*");

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)");

    setPedidos(pedidosResp.data || []);
    setItens(itensResp.data || []);
    setComissoes(comissoesResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalVendido = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_total || 0),
    0
  );

  const totalComissao = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_comissao || 0),
    0
  );

  const ticketMedio = pedidos.length ? totalVendido / pedidos.length : 0;

  const topProdutos = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number; quantidade: number }>();

    itens.forEach((item) => {
      const nome = item.produto_nome || "Produto não informado";
      const atual = mapa.get(nome) || { nome, total: 0, quantidade: 0 };

      atual.total += Number(item.valor_total || 0);
      atual.quantidade += Number(item.quantidade || 0);

      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [itens]);

  const topRepresentadas = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number; comissao: number }>();

    comissoes.forEach((item) => {
      const nome = item.empresa || "Sem representada";
      const atual = mapa.get(nome) || { nome, total: 0, comissao: 0 };

      atual.total += Number(item.valor_base || 0);
      atual.comissao += Number(item.valor_comissao || 0);

      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.comissao - a.comissao)
      .slice(0, 10);
  }, [comissoes]);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number; pedidos: number }>();

    pedidos.forEach((pedido) => {
      const nome = pedido.clientes?.razao_social || "Cliente não informado";
      const atual = mapa.get(nome) || { nome, total: 0, pedidos: 0 };

      atual.total += Number(pedido.valor_total || 0);
      atual.pedidos += 1;

      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [pedidos]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Relatórios Comerciais" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos" valor={pedidos.length} />
              <Card titulo="Vendas" valor={moeda(totalVendido)} />
              <Card titulo="Comissões" valor={moeda(totalComissao)} />
              <Card titulo="Ticket médio" valor={moeda(ticketMedio)} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Ranking titulo="Top clientes" dados={topClientes} tipo="clientes" />
              <Ranking titulo="Top produtos" dados={topProdutos} tipo="produtos" />
              <Ranking titulo="Top representadas" dados={topRepresentadas} tipo="representadas" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Ranking({
  titulo,
  dados,
  tipo,
}: {
  titulo: string;
  dados: any[];
  tipo: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold text-slate-800">{titulo}</h3>

      <div className="space-y-3">
        {dados.map((item, index) => (
          <div key={`${item.nome}-${index}`} className="rounded-xl border p-4">
            <p className="font-bold text-slate-800">
              {index + 1}. {item.nome}
            </p>

            {tipo === "clientes" && (
              <>
                <p className="text-sm text-slate-500">
                  Pedidos: {item.pedidos}
                </p>
                <p className="font-semibold text-blue-700">
                  {moeda(item.total)}
                </p>
              </>
            )}

            {tipo === "produtos" && (
              <>
                <p className="text-sm text-slate-500">
                  Quantidade: {item.quantidade}
                </p>
                <p className="font-semibold text-blue-700">
                  {moeda(item.total)}
                </p>
              </>
            )}

            {tipo === "representadas" && (
              <>
                <p className="text-sm text-slate-500">
                  Valor base: {moeda(item.total)}
                </p>
                <p className="font-semibold text-green-700">
                  Comissão: {moeda(item.comissao)}
                </p>
              </>
            )}
          </div>
        ))}

        {dados.length === 0 && (
          <p className="py-8 text-center text-slate-500">
            Nenhum dado encontrado.
          </p>
        )}
      </div>
    </section>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}