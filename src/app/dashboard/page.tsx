"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [clientes, setClientes] = useState(0);
  const [fornecedores, setFornecedores] = useState(0);
  const [produtos, setProdutos] = useState(0);
  const [visitas, setVisitas] = useState(0);
  const [pedidos, setPedidos] = useState<any[]>([]);

  async function carregarDados() {
    const { count: clientesCount } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true });

    const { count: fornecedoresCount } = await supabase
      .from("fornecedores")
      .select("*", { count: "exact", head: true });

    const { count: produtosCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact", head: true });

    const { count: visitasCount } = await supabase
      .from("visitas")
      .select("*", { count: "exact", head: true });

    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    setClientes(clientesCount || 0);
    setFornecedores(fornecedoresCount || 0);
    setProdutos(produtosCount || 0);
    setVisitas(visitasCount || 0);
    setPedidos(pedidosData || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const valorTotalPedidos = pedidos.reduce(
    (total, pedido) => total + Number(pedido.valor_total || 0),
    0
  );

  const comissaoPrevista = pedidos.reduce(
    (total, pedido) => total + Number(pedido.valor_comissao || 0),
    0
  );

  const pedidosEmAberto = pedidos.filter(
    (pedido) =>
      pedido.status === "Orçamento" ||
      pedido.status === "Pedido" ||
      pedido.status === "Aprovado"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Dashboard Executivo" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes" valor={clientes} />
              <Card titulo="Fornecedores" valor={fornecedores} />
              <Card titulo="Produtos" valor={produtos} />
              <Card titulo="Visitas" valor={visitas} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card
                titulo="Valor em pedidos"
                valor={`R$ ${valorTotalPedidos.toFixed(2)}`}
              />
              <Card
                titulo="Comissão prevista"
                valor={`R$ ${comissaoPrevista.toFixed(2)}`}
              />
              <Card titulo="Pedidos em aberto" valor={pedidosEmAberto} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Últimos pedidos
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Valor total</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pedidos.slice(0, 8).map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {pedido.status}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          {pedido.created_at
                            ? new Date(pedido.created_at).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </td>
                      </tr>
                    ))}

                    {pedidos.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum pedido cadastrado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}