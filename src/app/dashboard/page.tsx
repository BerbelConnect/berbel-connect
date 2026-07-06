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
  const [visitas, setVisitas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  async function carregarDados() {
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    const receberResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)");

    const pagarResp = await supabase.from("contas_pagar").select("*");

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)");

    const visitasResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: true });

    const clientesResp = await supabase.from("clientes").select("*");

    setPedidos(pedidosResp.data || []);
    setReceber(receberResp.data || []);
    setPagar(pagarResp.data || []);
    setComissoes(comissoesResp.data || []);
    setVisitas(visitasResp.data || []);
    setClientes(clientesResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const totalVendido = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_total || 0),
    0
  );

  const comissaoPrevista = comissoes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  const comissaoRecebida = comissoes
    .filter((item) => item.status === "Recebida")
    .reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0);

  const contasReceber = receber
    .filter((item) => item.status !== "Recebido")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const contasPagar = pagar
    .filter((item) => item.status !== "Pago")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const saldoPrevisto = contasReceber - contasPagar;

  const visitasHoje = visitas.filter((visita) => visita.data_visita === hoje);

  const pedidosRecentes = pedidos.slice(0, 5);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number }>();

    pedidos.forEach((pedido) => {
      const nome = pedido.clientes?.razao_social || "Cliente não informado";
      const atual = mapa.get(nome) || { nome, total: 0 };

      atual.total += Number(pedido.valor_total || 0);
      mapa.set(nome, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidos]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Dashboard Executivo" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Vendas totais" valor={moeda(totalVendido)} />
              <Card titulo="Comissão prevista" valor={moeda(comissaoPrevista)} />
              <Card titulo="Comissão recebida" valor={moeda(comissaoRecebida)} />
              <Card titulo="Saldo previsto" valor={moeda(saldoPrevisto)} />
              <Card titulo="A receber" valor={moeda(contasReceber)} />
              <Card titulo="A pagar" valor={moeda(contasPagar)} />
              <Card titulo="Visitas hoje" valor={visitasHoje.length} />
              <Card titulo="Clientes" valor={clientes.length} />
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
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          Pedido {pedido.numero || pedido.id}
                        </p>
                        <p className="text-sm text-slate-500">
                          {pedido.clientes?.razao_social || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-blue-700">
                          {moeda(pedido.valor_total)}
                        </p>
                        <p className="text-sm text-slate-500">{pedido.status}</p>
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
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {index + 1}. {cliente.nome}
                        </p>
                        <p className="text-sm text-slate-500">
                          Total comprado
                        </p>
                      </div>

                      <p className="font-bold text-green-700">
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

              <section className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Visitas de hoje
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {visitasHoje.map((visita) => (
                    <div key={visita.id} className="rounded-xl border p-4">
                      <p className="font-bold text-slate-800">
                        {visita.clientes?.razao_social || "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {visita.hora_visita || ""} • {visita.status || "-"}
                      </p>
                      <p className="mt-2 text-sm">
                        Próxima ação: {visita.proxima_acao || "-"}
                      </p>
                    </div>
                  ))}

                  {visitasHoje.length === 0 && (
                    <p className="py-8 text-center text-slate-500 md:col-span-2">
                      Nenhuma visita agendada para hoje.
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