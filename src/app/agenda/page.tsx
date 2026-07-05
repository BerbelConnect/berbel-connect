"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

export default function AgendaPage() {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarVisitas() {
    const { data, error } = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: true });

    if (error) return alert(error.message);
    setVisitas(data || []);
  }

  useEffect(() => {
    carregarVisitas();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const filtradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return visitas.filter((visita) =>
      [
        visita.clientes?.razao_social,
        visita.status,
        visita.tipo,
        visita.proxima_acao,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [visitas, busca]);

  const visitasHoje = visitas.filter((v) => v.data_visita === hoje);
  const retornosPendentes = visitas.filter(
    (v) => v.data_retorno && v.status !== "Cancelada"
  );
  const agendadas = visitas.filter((v) => v.status === "Agendada");

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Agenda Comercial" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Visitas hoje" valor={visitasHoje.length} />
              <Card titulo="Agendadas" valor={agendadas.length} />
              <Card titulo="Retornos pendentes" valor={retornosPendentes.length} />
              <Card titulo="Total de visitas" valor={visitas.length} />
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Compromissos comerciais
                </h3>

                <input
                  placeholder="Pesquisar na agenda..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Próxima ação</th>
                      <th className="px-4 py-3">Retorno</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((visita) => (
                      <tr key={visita.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {visita.data_visita}
                        </td>
                        <td className="px-4 py-4">{visita.hora_visita || "-"}</td>
                        <td className="px-4 py-4">
                          {visita.clientes?.razao_social || "-"}
                        </td>
                        <td className="px-4 py-4">{visita.tipo}</td>
                        <td className="px-4 py-4">{visita.status}</td>
                        <td className="px-4 py-4">{visita.proxima_acao || "-"}</td>
                        <td className="px-4 py-4">{visita.data_retorno || "-"}</td>
                      </tr>
                    ))}

                    {filtradas.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum compromisso encontrado.
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