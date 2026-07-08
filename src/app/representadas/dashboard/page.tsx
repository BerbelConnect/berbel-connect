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

export default function DashboardRepresentadasPage() {
  const [dados, setDados] = useState<any[]>([]);

  async function carregarDados() {
    const { data, error } = await supabase
      .from("vw_representadas_resumo")
      .select("*")
      .order("comissao_prevista", { ascending: false });

    if (error) return alert(error.message);
    setDados(data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalVendas = dados.reduce(
    (soma, item) => soma + Number(item.valor_intermediado || 0),
    0
  );

  const totalComissao = dados.reduce(
    (soma, item) => soma + Number(item.comissao_prevista || 0),
    0
  );

  const totalRecebida = dados.reduce(
    (soma, item) => soma + Number(item.comissao_recebida || 0),
    0
  );

  const totalPendente = dados.reduce(
    (soma, item) => soma + Number(item.comissao_pendente || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Dashboard das Representadas"
            subtitulo="Berbel Connect"
          />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Valor intermediado" valor={moeda(totalVendas)} />
              <Card titulo="Comissão prevista" valor={moeda(totalComissao)} />
              <Card titulo="Comissão recebida" valor={moeda(totalRecebida)} />
              <Card titulo="Comissão pendente" valor={moeda(totalPendente)} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Resultado por representada
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Representada</th>
                      <th className="px-4 py-3">Pedidos</th>
                      <th className="px-4 py-3">Valor intermediado</th>
                      <th className="px-4 py-3">Comissão prevista</th>
                      <th className="px-4 py-3">Recebida</th>
                      <th className="px-4 py-3">Pendente</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {dados.map((item) => (
                      <tr key={item.representada}>
                        <td className="px-4 py-4 font-semibold">
                          {item.representada || "-"}
                        </td>
                        <td className="px-4 py-4">{item.pedidos || 0}</td>
                        <td className="px-4 py-4">
                          {moeda(item.valor_intermediado)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-green-700">
                          {moeda(item.comissao_prevista)}
                        </td>
                        <td className="px-4 py-4 text-blue-700">
                          {moeda(item.comissao_recebida)}
                        </td>
                        <td className="px-4 py-4 text-red-700">
                          {moeda(item.comissao_pendente)}
                        </td>
                      </tr>
                    ))}

                    {dados.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum dado encontrado.
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