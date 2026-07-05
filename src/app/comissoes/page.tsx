"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

export default function ComissoesPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), produtos(nome)")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);

    setPedidos(data || []);
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [pedido.clientes?.razao_social, pedido.produtos?.nome, pedido.status]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  const totalVendido = filtrados.reduce(
    (total, pedido) => total + Number(pedido.valor_total || 0),
    0
  );

  const totalComissao = filtrados.reduce(
    (total, pedido) => total + Number(pedido.valor_comissao || 0),
    0
  );

  const pedidosFaturados = filtrados.filter(
    (pedido) => pedido.status === "Faturado"
  );

  const comissaoFaturada = pedidosFaturados.reduce(
    (total, pedido) => total + Number(pedido.valor_comissao || 0),
    0
  );

  const comissaoPendente = totalComissao - comissaoFaturada;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Comissões" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Total vendido" valor={`R$ ${totalVendido.toFixed(2)}`} />
              <Card titulo="Comissão prevista" valor={`R$ ${totalComissao.toFixed(2)}`} />
              <Card titulo="Comissão faturada" valor={`R$ ${comissaoFaturada.toFixed(2)}`} />
              <Card titulo="Comissão pendente" valor={`R$ ${comissaoPendente.toFixed(2)}`} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Comissões por pedido
                </h3>

                <input
                  placeholder="Pesquisar comissão..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Valor pedido</th>
                      <th className="px-4 py-3">%</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {pedido.clientes?.razao_social || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {pedido.produtos?.nome || "-"}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          {Number(pedido.comissao_percentual || 0).toFixed(2)}%
                        </td>
                        <td className="px-4 py-4 font-semibold text-green-700">
                          R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">{pedido.status}</td>
                      </tr>
                    ))}

                    {filtrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma comissão encontrada.
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