"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";

export default function ConsultaPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social, whatsapp), pedido_itens(*, produtos(nome))")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPedidos(data || []);
  }

  function enviarWhatsApp(pedido: any) {
    const numero = pedido.clientes?.whatsapp?.replace(/\D/g, "");

    if (!numero) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }

    const itensTexto =
      pedido.pedido_itens
        ?.map(
          (item: any, index: number) =>
            `${index + 1}. ${item.produtos?.nome || "-"} | Qtd: ${
              item.quantidade
            } | Total: R$ ${Number(item.valor_total || 0).toFixed(2)}`
        )
        .join("\n") || "-";

    const mensagem = `Olá, ${pedido.clientes?.razao_social || "tudo bem"}!

Segue o resumo do pedido ${pedido.numero || pedido.id}.

Status: ${pedido.status || "-"}
Valor total: R$ ${Number(pedido.valor_total || 0).toFixed(2)}

Itens:
${itensTexto}

Qualquer dúvida estou à disposição.

Marcelo Henrique Berbel
Berbel Connect Representações
Telefone: (16) 98806-9279
E-mail: berbelm@icloud.com`;

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  async function excluirPedido(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este pedido?")) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarPedidos();
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [pedido.numero, pedido.clientes?.razao_social, pedido.status]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  const totalPedidos = pedidosFiltrados.reduce(
    (total, pedido) => total + Number(pedido.valor_total || 0),
    0
  );

  const totalComissao = pedidosFiltrados.reduce(
    (total, pedido) => total + Number(pedido.valor_comissao || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Consulta de Pedidos" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card titulo="Pedidos" valor={pedidosFiltrados.length} />
              <Card titulo="Total vendido" valor={`R$ ${totalPedidos.toFixed(2)}`} />
              <Card titulo="Comissão" valor={`R$ ${totalComissao.toFixed(2)}`} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pedidos cadastrados</h2>

                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-80 rounded-xl border px-4 py-3"
                />
              </div>

              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id} className="rounded-xl border p-5">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold">
                          Pedido {pedido.numero || pedido.id}
                        </h3>

                        <p>Cliente: {pedido.clientes?.razao_social}</p>
                        <p>Status: {pedido.status}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </p>

                        <p className="text-green-700">
                          Comissão: R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          setPedidoAberto(
                            pedidoAberto === pedido.id ? null : pedido.id
                          )
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2 text-white"
                      >
                        {pedidoAberto === pedido.id ? "Ocultar itens" : "Ver itens"}
                      </button>

                      <button
                        onClick={() => gerarPedidoPDF(pedido)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                      >
                        PDF
                      </button>

                      <button
                        onClick={() => enviarWhatsApp(pedido)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                      >
                        WhatsApp
                      </button>

                      <button
                        onClick={() => excluirPedido(pedido.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white"
                      >
                        Excluir
                      </button>
                    </div>

                    {pedidoAberto === pedido.id && (
                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 text-left">Produto</th>
                              <th>Qtd.</th>
                              <th>Unit.</th>
                              <th>Total</th>
                            </tr>
                          </thead>

                          <tbody>
                            {pedido.pedido_itens?.map((item: any) => (
                              <tr key={item.id} className="border-b">
                                <td className="py-3">{item.produtos?.nome}</td>
                                <td className="text-center">{item.quantidade}</td>
                                <td className="text-center">
                                  R$ {Number(item.valor_unitario).toFixed(2)}
                                </td>
                                <td className="text-center">
                                  R$ {Number(item.valor_total).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-slate-500">{titulo}</p>
      <strong className="text-3xl">{valor}</strong>
    </div>
  );
}