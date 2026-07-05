"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

export default function ConsultaPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), pedido_itens(*, produtos(nome))")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPedidos(data || []);
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Consulta de Pedidos" subtitulo="ERP Comercial" />

          <div className="p-8">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Pedidos cadastrados
              </h3>

              <div className="space-y-4">
                {pedidos.map((pedido) => (
                  <div key={pedido.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          Pedido {pedido.numero || pedido.id}
                        </p>
                        <p className="text-sm text-slate-500">
                          Cliente: {pedido.clientes?.razao_social || "-"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Status: {pedido.status || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-700">
                          Comissão: R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </p>

                        <button
                          onClick={() =>
                            setPedidoAberto(
                              pedidoAberto === pedido.id ? null : pedido.id
                            )
                          }
                          className="mt-3 rounded-lg bg-blue-100 px-4 py-2 text-blue-700"
                        >
                          {pedidoAberto === pedido.id ? "Fechar" : "Ver itens"}
                        </button>
                      </div>
                    </div>

                    {pedidoAberto === pedido.id && (
                      <div className="mt-5 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Produto</th>
                              <th className="px-4 py-3">Qtd.</th>
                              <th className="px-4 py-3">Valor unit.</th>
                              <th className="px-4 py-3">Total</th>
                              <th className="px-4 py-3">Comissão</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {pedido.pedido_itens?.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">
                                  {item.produtos?.nome || "-"}
                                </td>
                                <td className="px-4 py-3">{item.quantidade}</td>
                                <td className="px-4 py-3">
                                  R$ {Number(item.valor_unitario || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                  R$ {Number(item.valor_total || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-green-700">
                                  R$ {Number(item.valor_comissao || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {pedidos.length === 0 && (
                  <p className="text-center text-slate-500">
                    Nenhum pedido cadastrado.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}