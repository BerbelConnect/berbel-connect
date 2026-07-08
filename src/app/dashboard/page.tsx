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

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [receber, setReceber] = useState<any[]>([]);
  const [pagar, setPagar] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);

  async function carregarDados() {
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), pedido_itens(*)")
      .order("created_at", { ascending: false });

    const receberResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)");

    const pagarResp = await supabase.from("contas_pagar").select("*");

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)");

    const clientesResp = await supabase.from("clientes").select("*");

    const visitasResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: true });

    setPedidos(pedidosResp.data || []);
    setReceber(receberResp.data || []);
    setPagar(pagarResp.data || []);
    setComissoes(comissoesResp.data || []);
    setClientes(clientesResp.data || []);
    setVisitas(visitasResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const totalVendido = pedidos.reduce(
    (soma, p) => soma + Number(p.valor_total || 0),
    0
  );

  const totalComissao = comissoes.reduce(
    (soma, c) => soma + Number(c.valor_comissao || 0),
    0
  );

  const comissaoRecebida = comissoes
    .filter((c) => c.status === "Recebida")
    .reduce((soma, c) => soma + Number(c.valor_comissao || 0), 0);

  const comissaoPendente = totalComissao - comissaoRecebida;

  const totalReceber = receber
    .filter((c) => c.status !== "Recebido")
    .reduce((soma, c) => soma + Number(c.valor || 0), 0);

  const totalPagar = pagar
    .filter((c) => c.status !== "Pago")
    .reduce((soma, c) => soma + Number(c.valor || 0), 0);

  const saldoPrevisto = totalReceber - totalPagar;

  const visitasHoje = visitas.filter((v) => v.data_visita === hoje);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const nome = pedido.clientes?.razao_social || "Cliente não informado";
      mapa.set(nome, (mapa.get(nome) || 0) + Number(pedido.valor_total || 0));
    });

    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidos]);

  const topRepresentadas = useMemo(() => {
    const mapa = new Map<string, number>();

    comissoes.forEach((item) => {
      const nome = item.empresa || "Sem representada";
      mapa.set(nome, (mapa.get(nome) || 0) + Number(item.valor_comissao || 0));
    });

    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [comissoes]);

  const pedidosRecentes = pedidos.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Dashboard Executivo V2" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Vendas intermediadas" valor={moeda(totalVendido)} />
              <Card titulo="Comissão prevista" valor={moeda(totalComissao)} />
              <Card titulo="Comissão recebida" valor={moeda(comissaoRecebida)} />
              <Card titulo="Comissão pendente" valor={moeda(comissaoPendente)} />
              <Card titulo="A receber" valor={moeda(totalReceber)} />
              <Card titulo="A pagar" valor={moeda(totalPagar)} />
              <Card titulo="Saldo previsto" valor={moeda(saldoPrevisto)} />
              <Card titulo="Visitas hoje" valor={visitasHoje.length} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Pedidos recentes
                </h3>

                <div className="space-y-3">
                  {pedidosRecentes.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex justify-between rounded-xl border p-4"
                    >
                      <div>
                        <p className="font-bold">
                          {pedido.numero || pedido.id}
                        </p>
                        <p className="text-sm text-slate-500">
                          {pedido.clientes?.razao_social || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {pedido.tipo_operacao || "-"} • {pedido.status || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-blue-700">
                          {moeda(pedido.valor_total)}
                        </p>
                        <p className="text-sm text-green-700">
                          {moeda(pedido.valor_comissao)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {pedidosRecentes.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum pedido cadastrado.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Top clientes
                </h3>

                <div className="space-y-3">
                  {topClientes.map((cliente, index) => (
                    <div
                      key={cliente.nome}
                      className="flex justify-between rounded-xl border p-4"
                    >
                      <p className="font-bold">
                        {index + 1}. {cliente.nome}
                      </p>

                      <p className="font-bold text-blue-700">
                        {moeda(cliente.total)}
                      </p>
                    </div>
                  ))}

                  {topClientes.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum cliente com vendas.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Top representadas por comissão
                </h3>

                <div className="space-y-3">
                  {topRepresentadas.map((rep, index) => (
                    <div
                      key={rep.nome}
                      className="flex justify-between rounded-xl border p-4"
                    >
                      <p className="font-bold">
                        {index + 1}. {rep.nome}
                      </p>

                      <p className="font-bold text-green-700">
                        {moeda(rep.total)}
                      </p>
                    </div>
                  ))}

                  {topRepresentadas.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhuma comissão registrada.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Visitas de hoje
                </h3>

                <div className="space-y-3">
                  {visitasHoje.map((visita) => (
                    <div key={visita.id} className="rounded-xl border p-4">
                      <p className="font-bold">
                        {visita.clientes?.razao_social || "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {visita.hora_visita || "-"} • {visita.status || "-"}
                      </p>
                      <p className="mt-2 text-sm">
                        Próxima ação: {visita.proxima_acao || "-"}
                      </p>
                    </div>
                  ))}

                  {visitasHoje.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhuma visita para hoje.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
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