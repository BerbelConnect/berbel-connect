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

export default function ComissoesFinanceiroPage() {
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarComissoes() {
    const { data, error } = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social), pedidos(numero, status, valor_total)")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);
    setComissoes(data || []);
  }

  async function marcarRecebida(id: string) {
    const { error } = await supabase
      .from("comissoes_financeiro")
      .update({
        status: "Recebida",
        data_recebimento: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (error) return alert(error.message);
    carregarComissoes();
  }

  async function excluirComissao(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir esta comissão?")) return;

    const { error } = await supabase
      .from("comissoes_financeiro")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);
    carregarComissoes();
  }

  useEffect(() => {
    carregarComissoes();
  }, []);

  const filtradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return comissoes.filter((item) =>
      [
        item.empresa,
        item.status,
        item.clientes?.razao_social,
        item.pedidos?.numero,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [comissoes, busca]);

  const totalPrevisto = filtradas.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  const totalRecebido = filtradas
    .filter((item) => item.status === "Recebida")
    .reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0);

  const totalPendente = totalPrevisto - totalRecebido;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Comissões Inteligentes" subtitulo="Financeiro" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Previsto" valor={moeda(totalPrevisto)} />
              <Card titulo="Recebido" valor={moeda(totalRecebido)} />
              <Card titulo="Pendente" valor={moeda(totalPendente)} />
              <Card titulo="Registros" valor={filtradas.length} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Comissões cadastradas
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
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">%</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Previsão</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {item.empresa || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {item.clientes?.razao_social || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {item.pedidos?.numero || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {Number(item.percentual || 0).toFixed(2)}%
                        </td>

                        <td className="px-4 py-4 font-semibold text-green-700">
                          {moeda(item.valor_comissao)}
                        </td>

                        <td className="px-4 py-4">
                          {item.previsao_recebimento || "-"}
                        </td>

                        <td className="px-4 py-4">{item.status}</td>

                        <td className="space-x-2 px-4 py-4">
                          {item.status !== "Recebida" && (
                            <button
                              onClick={() => marcarRecebida(item.id)}
                              className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                            >
                              Receber
                            </button>
                          )}

                          <button
                            onClick={() => excluirComissao(item.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filtradas.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma comissão cadastrada.
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