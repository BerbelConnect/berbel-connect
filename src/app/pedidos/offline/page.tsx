"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  listarPedidosOffline,
  removerPedidoOffline,
  limparPedidosOffline,
  type PedidoOffline,
} from "@/lib/offline/pedidosOffline";
import { sincronizarPedidosOffline } from "@/lib/offline/sincronizarPedidosOffline";

function formatarMoeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

export default function PedidosOfflinePage() {
  const [pedidos, setPedidos] = useState<PedidoOffline[]>([]);
  const [busca, setBusca] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [detalheAberto, setDetalheAberto] = useState<string | null>(null);

  function carregar() {
    setPedidos(listarPedidosOffline());
  }

  useEffect(() => {
    carregar();

    window.addEventListener("storage", carregar);
    window.addEventListener("berbel:pedidos-offline-atualizados", carregar);

    return () => {
      window.removeEventListener("storage", carregar);
      window.removeEventListener("berbel:pedidos-offline-atualizados", carregar);
    };
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((item) =>
      [
        item.id_local,
        item.status,
        item.erro,
        item.pedido?.numero,
        item.pedido?.status,
        item.pedido?.tipo,
        item.pedido?.observacoes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  const totalOffline = pedidos.reduce(
    (total, item) => total + Number(item.pedido?.valor_total || 0),
    0
  );

  const comissaoOffline = pedidos.reduce(
    (total, item) => total + Number(item.pedido?.valor_comissao || 0),
    0
  );

  async function sincronizarTodos() {
    if (!navigator.onLine) {
      alert("Você ainda está sem internet.");
      return;
    }

    if (pedidos.length === 0) {
      alert("Não há pedidos offline para sincronizar.");
      return;
    }

    setSincronizando(true);

    const resultado = await sincronizarPedidosOffline();

    setSincronizando(false);
    carregar();

    alert(resultado.mensagem);

    window.dispatchEvent(new Event("berbel:pedidos-offline-atualizados"));
  }

  function excluirPedido(idLocal: string) {
    if (!confirm("Deseja excluir este pedido offline?")) return;

    removerPedidoOffline(idLocal);
    carregar();
  }

  function limparTudo() {
    if (!confirm("Deseja apagar todos os pedidos offline?")) return;

    limparPedidosOffline();
    carregar();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pedidos Offline" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pendentes" valor={pedidos.length} />
              <Card titulo="Filtrados" valor={pedidosFiltrados.length} />
              <Card titulo="Total offline" valor={formatarMoeda(totalOffline)} />
              <Card
                titulo="Comissão offline"
                valor={formatarMoeda(comissaoOffline)}
              />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Fila de sincronização
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pedidos criados sem internet ficam salvos aqui até serem enviados para o Supabase.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <button
                    onClick={sincronizarTodos}
                    disabled={sincronizando}
                    className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                  >
                    {sincronizando ? "Sincronizando..." : "Sincronizar todos"}
                  </button>

                  <button
                    onClick={limparTudo}
                    className="rounded-xl border border-red-300 px-6 py-3 font-semibold text-red-700"
                  >
                    Limpar fila
                  </button>
                </div>
              </div>

              <input
                placeholder="Pesquisar pedido offline..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </section>

            <section className="space-y-4">
              {pedidosFiltrados.map((item) => {
                const aberto = detalheAberto === item.id_local;

                return (
                  <div key={item.id_local} className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            Pedido {item.pedido?.numero || item.id_local}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.status === "erro"
                                ? "bg-red-100 text-red-700"
                                : item.status === "sincronizando"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Criado em: {formatarDataHora(item.criado_em)}
                        </p>

                        <p className="text-sm text-slate-500">
                          Data do pedido: {formatarData(item.pedido?.data_pedido)}
                        </p>

                        <p className="text-sm text-slate-500">
                          Tipo: {item.pedido?.tipo || "-"} | Status:{" "}
                          {item.pedido?.status || "-"}
                        </p>

                        <p className="mt-2 text-lg font-bold text-blue-700">
                          {formatarMoeda(item.pedido?.valor_total)}
                        </p>

                        <p className="text-sm font-semibold text-green-700">
                          Comissão: {formatarMoeda(item.pedido?.valor_comissao)}
                        </p>

                        {item.erro && (
                          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            <strong>Erro:</strong> {item.erro}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setDetalheAberto(aberto ? null : item.id_local)
                          }
                          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          {aberto ? "Ocultar" : "Ver itens"}
                        </button>

                        <button
                          onClick={() => excluirPedido(item.id_local)}
                          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {aberto && (
                      <div className="mt-5 overflow-x-auto rounded-xl border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Produto</th>
                              <th className="px-4 py-3">Qtd</th>
                              <th className="px-4 py-3">Unitário</th>
                              <th className="px-4 py-3">Total</th>
                              <th className="px-4 py-3">Comissão</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {(item.itens || []).map((produto: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-4 font-semibold">
                                  {produto.produto_nome || "-"}
                                </td>
                                <td className="px-4 py-4">
                                  {produto.quantidade || 0}
                                </td>
                                <td className="px-4 py-4">
                                  {formatarMoeda(produto.valor_unitario)}
                                </td>
                                <td className="px-4 py-4">
                                  {formatarMoeda(produto.valor_total)}
                                </td>
                                <td className="px-4 py-4 text-green-700">
                                  {formatarMoeda(produto.valor_comissao)}
                                </td>
                              </tr>
                            ))}

                            {(!item.itens || item.itens.length === 0) && (
                              <tr>
                                <td
                                  colSpan={5}
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
                );
              })}

              {pedidosFiltrados.length === 0 && (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
                  Nenhum pedido offline encontrado.
                </div>
              )}
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