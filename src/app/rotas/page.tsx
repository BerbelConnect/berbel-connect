"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

export default function RotasPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [bairroFiltro, setBairroFiltro] = useState("");

  async function carregar() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("bairro");

    if (error) {
      alert(error.message);
      return;
    }

    setClientes(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const bairros = useMemo(() => {
    const lista = clientes
      .map((c) => c.bairro)
      .filter(Boolean);

    return [...new Set(lista)].sort();
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    if (!bairroFiltro) return clientes;

    return clientes.filter(
      (cliente) => cliente.bairro === bairroFiltro
    );
  }, [clientes, bairroFiltro]);

  function abrirGoogleMaps(cliente: any) {
    const endereco = encodeURIComponent(
      `${cliente.endereco || ""}, ${cliente.bairro || ""}, ${cliente.cidade || ""}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${endereco}`,
      "_blank"
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Roteirizador Inteligente"
            subtitulo="Berbel Connect"
          />

          <div className="p-8">

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">
                Planejamento por bairro
              </h2>

              <select
                value={bairroFiltro}
                onChange={(e) =>
                  setBairroFiltro(e.target.value)
                }
                className="w-full max-w-sm rounded-xl border px-4 py-3"
              >
                <option value="">
                  Todos os bairros
                </option>

                {bairros.map((bairro) => (
                  <option key={bairro}>
                    {bairro}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">
                Sequência sugerida de visitas
              </h2>

              <div className="space-y-4">
                {clientesFiltrados.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between rounded-xl border p-5"
                  >
                    <div>
                      <p className="text-lg font-bold">
                        {index + 1}. {cliente.razao_social}
                      </p>

                      <p className="text-sm text-slate-500">
                        {cliente.bairro || "-"} • {cliente.cidade || "-"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {cliente.endereco || "-"}
                      </p>
                    </div>

                    <button
                      onClick={() => abrirGoogleMaps(cliente)}
                      className="rounded-xl bg-blue-700 px-5 py-3 text-white"
                    >
                      Abrir rota
                    </button>
                  </div>
                ))}

                {clientesFiltrados.length === 0 && (
                  <div className="rounded-xl border p-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
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