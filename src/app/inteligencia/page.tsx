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

function diasDesde(data?: string) {
  if (!data) return null;
  const hoje = new Date();
  const alvo = new Date(data);
  return Math.floor((hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24));
}

export default function InteligenciaPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);

  async function carregarDados() {
    const clientesResp = await supabase.from("clientes").select("*");
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("data_pedido", { ascending: false });

    const visitasResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: false });

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    setClientes(clientesResp.data || []);
    setPedidos(pedidosResp.data || []);
    setVisitas(visitasResp.data || []);
    setComissoes(comissoesResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const clientesSemPedido = useMemo(() => {
    return clientes.filter(
      (cliente) => !pedidos.some((pedido) => pedido.cliente_id === cliente.id)
    );
  }, [clientes, pedidos]);

  const clientesSemVisita = useMemo(() => {
    return clientes.filter(
      (cliente) => !visitas.some((visita) => visita.cliente_id === cliente.id)
    );
  }, [clientes, visitas]);

  const comissoesPendentes = comissoes.filter(
    (item) => item.status !== "Recebida"
  );

  const totalComissoesPendentes = comissoesPendentes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  const clientesComUltimaCompra = useMemo(() => {
    return clientes
      .map((cliente) => {
        const pedidosCliente = pedidos.filter(
          (pedido) => pedido.cliente_id === cliente.id
        );

        const ultimoPedido = pedidosCliente[0];

        return {
          ...cliente,
          ultimo_pedido: ultimoPedido?.data_pedido || null,
          dias_sem_compra: diasDesde(ultimoPedido?.data_pedido),
          total_comprado: pedidosCliente.reduce(
            (soma, pedido) => soma + Number(pedido.valor_total || 0),
            0
          ),
        };
      })
      .filter(
        (cliente) =>
          cliente.dias_sem_compra === null || cliente.dias_sem_compra >= 30
      )
      .sort(
        (a, b) => Number(b.dias_sem_compra || 9999) - Number(a.dias_sem_compra || 9999)
      )
      .slice(0, 10);
  }, [clientes, pedidos]);

  const pedidosRecentes = pedidos.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Inteligência Comercial" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes sem pedido" valor={clientesSemPedido.length} />
              <Card titulo="Clientes sem visita" valor={clientesSemVisita.length} />
              <Card titulo="Comissões pendentes" valor={moeda(totalComissoesPendentes)} />
              <Card titulo="Pedidos recentes" valor={pedidosRecentes.length} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Oportunidades de visita
                </h3>

                <div className="space-y-3">
                  {clientesComUltimaCompra.map((cliente) => (
                    <div key={cliente.id} className="rounded-xl border p-4">
                      <p className="font-bold text-slate-800">
                        {cliente.razao_social}
                      </p>

                      <p className="text-sm text-slate-500">
                        Último pedido: {cliente.ultimo_pedido || "Nunca comprou"}
                      </p>

                      <p className="mt-2 text-sm">
                        {cliente.dias_sem_compra === null
                          ? "Cliente ainda não possui pedido registrado."
                          : `Está há ${cliente.dias_sem_compra} dias sem comprar.`}
                      </p>

                      <p className="mt-2 font-semibold text-green-700">
                        Total comprado: {moeda(cliente.total_comprado)}
                      </p>
                    </div>
                  ))}

                  {clientesComUltimaCompra.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhuma oportunidade encontrada.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Comissões pendentes
                </h3>

                <div className="space-y-3">
                  {comissoesPendentes.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex justify-between rounded-xl border p-4">
                      <div>
                        <p className="font-bold text-slate-800">
                          {item.empresa || "Representada"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.clientes?.razao_social || "-"}
                        </p>
                      </div>

                      <p className="font-bold text-green-700">
                        {moeda(item.valor_comissao)}
                      </p>
                    </div>
                  ))}

                  {comissoesPendentes.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhuma comissão pendente.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Pedidos recentes
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {pedidosRecentes.map((pedido) => (
                    <div key={pedido.id} className="rounded-xl border p-4">
                      <p className="font-bold text-slate-800">
                        {pedido.numero || pedido.id}
                      </p>

                      <p className="text-sm text-slate-500">
                        {pedido.clientes?.razao_social || "-"}
                      </p>

                      <p className="mt-2 font-semibold text-blue-700">
                        {moeda(pedido.valor_total)}
                      </p>
                    </div>
                  ))}

                  {pedidosRecentes.length === 0 && (
                    <p className="py-8 text-center text-slate-500 md:col-span-2">
                      Nenhum pedido recente.
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