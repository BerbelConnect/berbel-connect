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
      .select("*, clientes(razao_social, whatsapp, endereco, numero, bairro, cidade, estado, cep)")
      .order("data_visita", { ascending: true });

    if (error) return alert(error.message);
    setVisitas(data || []);
  }

  async function concluirVisita(id: string) {
    const { error } = await supabase
      .from("visitas")
      .update({ concluida: true, status: "Realizada" })
      .eq("id", id);

    if (error) return alert(error.message);
    carregarVisitas();
  }

  function abrirWhatsApp(numero?: string) {
    const limpo = numero?.replace(/\D/g, "");
    if (!limpo) return alert("Cliente sem WhatsApp cadastrado.");
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  function abrirMaps(cliente: any) {
    const endereco = [
      cliente?.endereco,
      cliente?.numero,
      cliente?.bairro,
      cliente?.cidade,
      cliente?.estado,
      cliente?.cep,
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");

    if (!endereco) return alert("Cliente sem endereço cadastrado.");

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`,
      "_blank"
    );
  }

  useEffect(() => {
    carregarVisitas();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const filtradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return visitas.filter((v) =>
      [
        v.clientes?.razao_social,
        v.status,
        v.tipo,
        v.prioridade,
        v.proxima_acao,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [visitas, busca]);

  const visitasHoje = visitas.filter((v) => v.data_visita === hoje);
  const pendentes = visitas.filter((v) => !v.concluida);
  const concluidas = visitas.filter((v) => v.concluida);
  const retornos = visitas.filter((v) => v.data_retorno && !v.concluida);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Agenda Inteligente" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Visitas hoje" valor={visitasHoje.length} />
              <Card titulo="Pendentes" valor={pendentes.length} />
              <Card titulo="Concluídas" valor={concluidas.length} />
              <Card titulo="Retornos" valor={retornos.length} />
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
                  className="w-full max-w-sm rounded-xl border px-4 py-3"
                />
              </div>

              <div className="space-y-4">
                {filtradas.map((visita) => (
                  <div key={visita.id} className="rounded-xl border p-5">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold">
                          {visita.clientes?.razao_social || "Cliente não informado"}
                        </h4>

                        <p className="text-sm text-slate-600">
                          Data: {visita.data_visita || "-"} {visita.hora_visita || ""}
                        </p>

                        <p className="text-sm text-slate-600">
                          Tipo: {visita.tipo || "-"} | Status: {visita.status || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Prioridade: {visita.prioridade || "Normal"}
                        </p>

                        <p className="mt-2 text-sm">
                          Próxima ação: {visita.proxima_acao || "-"}
                        </p>

                        <p className="text-sm">
                          Retorno: {visita.data_retorno || "-"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => abrirWhatsApp(visita.clientes?.whatsapp)}
                          className="rounded-lg bg-green-100 px-4 py-2 text-green-700"
                        >
                          WhatsApp
                        </button>

                        <button
                          onClick={() => abrirMaps(visita.clientes)}
                          className="rounded-lg bg-blue-100 px-4 py-2 text-blue-700"
                        >
                          Maps
                        </button>

                        {!visita.concluida && (
                          <button
                            onClick={() => concluirVisita(visita.id)}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-white"
                          >
                            Concluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filtradas.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    Nenhum compromisso encontrado.
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

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}