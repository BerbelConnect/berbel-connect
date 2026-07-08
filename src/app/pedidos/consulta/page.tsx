"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ConsultaPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        clientes(razao_social, whatsapp),
        pedido_itens(
          *,
          produtos(nome),
          representadas(nome_fantasia)
        )
      `
      )
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
            `${index + 1}. ${
              item.produto_nome || item.produtos?.nome || "-"
            } | ${item.representada_nome || "-"} | Qtd: ${
              item.quantidade
            } | Total: ${moeda(item.valor_total)}`
        )
        .join("\n") || "-";

    const mensagem = `
Olá! Segue resumo do pedido ${pedido.numero || pedido.id}.

Cliente: ${pedido.clientes?.razao_social || "-"}
Tipo: ${pedido.tipo_operacao || "-"}
Status: ${pedido.status || "-"}
Total: ${moeda(pedido.valor_total)}
Comissão prevista: ${moeda(pedido.valor_comissao)}

Itens:
${itensTexto}
`;

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

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [
        pedido.numero,
        pedido.clientes?.razao_social,
        pedido.status,
        pedido.tipo_operacao,
        pedido.pedido_itens
          ?.map(
            (item: any) =>
              `${item.produto_nome || ""} ${item.representada_nome || ""}`
          )
          .join(" "),
      ]
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

  const pedidosRepresentacao = pedidosFiltrados.filter(
    (pedido) => pedido.tipo_operacao === "Representação"
  ).length;

  const pedidosRevenda = pedidosFiltrados.filter(
    (pedido) => pedido.tipo_operacao === "Revenda Própria"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Consulta de Pedidos V2" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos" valor={pedidosFiltrados.length} />
              <Card titulo="Total vendido" valor={moeda(totalPedidos)} />
              <Card titulo="Comissão" valor={moeda(totalComissao)} />
              <Card
                titulo="Representação / Revenda"
                valor={`${pedidosRepresentacao} / ${pedidosRevenda}`}
              />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">
                  Pedidos cadastrados
                </h2>

                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar pedido..."
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id} className="rounded-2xl border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Pedido {pedido.numero || pedido.id}
                        </h3>

                        <p className="text-sm text-slate-600">
                          Cliente: {pedido.clientes?.razao_social || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Tipo: {pedido.tipo_operacao || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Status: {pedido.status || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-700">
                          {moeda(pedido.valor_total)}
                        </p>

                        <p className="text-sm font-semibold text-green-700">
                          Comissão: {moeda(pedido.valor_comissao)}
                        </p>

                        <p className="text-xs text-slate-500">
                          Itens: {pedido.pedido_itens?.length || 0}
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
                        {pedidoAberto === pedido.id
                          ? "Ocultar itens"
                          : "Ver itens"}
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
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Produto</th>
                              <th className="px-4 py-3">Representada</th>
                              <th className="px-4 py-3">Modelo</th>
                              <th className="px-4 py-3">Qtd.</th>
                              <th className="px-4 py-3">Unit.</th>
                              <th className="px-4 py-3">Total</th>
                              <th className="px-4 py-3">Comissão</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {pedido.pedido_itens?.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-4 py-4 font-semibold">
                                  {item.produto_nome ||
                                    item.produtos?.nome ||
                                    "-"}
                                </td>

                                <td className="px-4 py-4">
                                  {item.representada_nome ||
                                    item.representadas?.nome_fantasia ||
                                    "-"}
                                </td>

                                <td className="px-4 py-4">
                                  {item.modelo_negocio || "-"}
                                </td>

                                <td className="px-4 py-4">
                                  {item.quantidade}
                                </td>

                                <td className="px-4 py-4">
                                  {moeda(item.valor_unitario)}
                                </td>

                                <td className="px-4 py-4 font-semibold">
                                  {moeda(item.valor_total)}
                                </td>

                                <td className="px-4 py-4 font-semibold text-green-700">
                                  {moeda(item.valor_comissao)}
                                </td>
                              </tr>
                            ))}

                            {(!pedido.pedido_itens ||
                              pedido.pedido_itens.length === 0) && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="px-4 py-8 text-center text-slate-500"
                                >
                                  Nenhum item encontrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {pedidosFiltrados.length === 0 && (
                  <div className="rounded-xl border p-8 text-center text-slate-500">
                    Nenhum pedido encontrado.
                  </div>
                )}
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