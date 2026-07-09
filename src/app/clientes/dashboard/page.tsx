"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function diasSemCompra(data?: string | null) {
  if (!data) return "-";
  return Math.floor(
    (new Date().getTime() - new Date(data).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function DashboardClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);

  async function carregar() {
    const { data, error } = await supabase
      .from("vw_clientes_resumo")
      .select("*")
      .order("valor_comprado", { ascending: false });

    if (error) return alert(error.message);
    setClientes(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const totalVendas = clientes.reduce(
    (soma, c) => soma + Number(c.valor_comprado || 0),
    0
  );

  const totalComissao = clientes.reduce(
    (soma, c) => soma + Number(c.comissao_gerada || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Dashboard de Clientes" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes" valor={clientes.length} />
              <Card titulo="Valor comprado" valor={moeda(totalVendas)} />
              <Card titulo="Comissão gerada" valor={moeda(totalComissao)} />
              <Card
                titulo="Ticket médio"
                valor={moeda(clientes.length ? totalVendas / clientes.length : 0)}
              />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold">Ranking de Clientes</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Pedidos</th>
                      <th className="px-4 py-3">Comprado</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Última compra</th>
                      <th className="px-4 py-3">Dias sem compra</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="px-4 py-4 font-semibold">
                          {cliente.razao_social || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {cliente.cidade || "-"} / {cliente.estado || "-"}
                        </td>
                        <td className="px-4 py-4">{cliente.total_pedidos || 0}</td>
                        <td className="px-4 py-4 font-semibold text-blue-700">
                          {moeda(cliente.valor_comprado)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-green-700">
                          {moeda(cliente.comissao_gerada)}
                        </td>
                        <td className="px-4 py-4">
                          {cliente.ultima_compra
                            ? new Date(cliente.ultima_compra).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="px-4 py-4">
                          {diasSemCompra(cliente.ultima_compra)}
                        </td>
                      </tr>
                    ))}

                    {clientes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Nenhum cliente encontrado.
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
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}