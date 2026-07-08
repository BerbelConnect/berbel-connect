"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

const inicial = {
  cliente_id: "",
  etapa: "Prospecção",
  origem: "",
  representada: "",
  descricao: "",
  oportunidade: "",
  valor_estimado: "",
  probabilidade: "10",
  proximo_contato: "",
  status: "Aberto",
};

const etapas = [
  "Prospecção",
  "Primeiro Contato",
  "Apresentação",
  "Amostras",
  "Negociação",
  "Pedido Fechado",
  "Cliente Ativo",
];

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PipelinePage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [form, setForm] = useState<any>(inicial);
  const [busca, setBusca] = useState("");

  async function carregarDados() {
    const clientesResp = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    const pipelineResp = await supabase
      .from("pipeline_comercial")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    setClientes(clientesResp.data || []);
    setPipeline(pipelineResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarOportunidade() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (!form.oportunidade.trim()) return alert("Informe a oportunidade.");

    const payload = {
      cliente_id: form.cliente_id,
      etapa: form.etapa,
      origem: form.origem,
      representada: form.representada,
      descricao: form.descricao,
      oportunidade: form.oportunidade,
      valor_estimado: Number(form.valor_estimado || 0),
      probabilidade: Number(form.probabilidade || 10),
      proximo_contato: form.proximo_contato || null,
      status: form.status,
    };

    const { error } = form.id
      ? await supabase.from("pipeline_comercial").update(payload).eq("id", form.id)
      : await supabase.from("pipeline_comercial").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function editar(item: any) {
    setForm({
      id: item.id,
      cliente_id: item.cliente_id || "",
      etapa: item.etapa || "Prospecção",
      origem: item.origem || "",
      representada: item.representada || "",
      descricao: item.descricao || "",
      oportunidade: item.oportunidade || "",
      valor_estimado: String(item.valor_estimado || ""),
      probabilidade: String(item.probabilidade || "10"),
      proximo_contato: item.proximo_contato || "",
      status: item.status || "Aberto",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function moverEtapa(item: any, etapa: string) {
    const { error } = await supabase
      .from("pipeline_comercial")
      .update({ etapa })
      .eq("id", item.id);

    if (error) return alert(error.message);
    carregarDados();
  }

  async function excluir(id: string) {
    if (!confirm("Deseja excluir esta oportunidade?")) return;

    const { error } = await supabase
      .from("pipeline_comercial")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);
    carregarDados();
  }

  const filtrado = useMemo(() => {
    const texto = busca.toLowerCase();

    return pipeline.filter((item) =>
      [
        item.clientes?.razao_social,
        item.etapa,
        item.origem,
        item.representada,
        item.oportunidade,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pipeline, busca]);

  const abertos = filtrado.filter((item) => item.status !== "Fechado").length;

  const valorPotencial = filtrado.reduce(
    (soma, item) => soma + Number(item.valor_estimado || 0),
    0
  );

  const valorPonderado = filtrado.reduce(
    (soma, item) =>
      soma +
      Number(item.valor_estimado || 0) *
        (Number(item.probabilidade || 0) / 100),
    0
  );

  const proximosContatos = filtrado.filter(
    (item) => item.proximo_contato && item.status !== "Fechado"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pipeline Comercial" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Oportunidades abertas" valor={abertos} />
              <Card titulo="Valor potencial" valor={moeda(valorPotencial)} />
              <Card titulo="Valor ponderado" valor={moeda(valorPonderado)} />
              <Card titulo="Próximos contatos" valor={proximosContatos} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar oportunidade" : "Nova oportunidade"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  value={form.cliente_id}
                  onChange={(e) =>
                    setForm({ ...form, cliente_id: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </option>
                  ))}
                </select>

                <select
                  value={form.etapa}
                  onChange={(e) => setForm({ ...form, etapa: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  {etapas.map((etapa) => (
                    <option key={etapa}>{etapa}</option>
                  ))}
                </select>

                <input
                  placeholder="Origem"
                  value={form.origem}
                  onChange={(e) => setForm({ ...form, origem: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  placeholder="Representada"
                  value={form.representada}
                  onChange={(e) =>
                    setForm({ ...form, representada: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  placeholder="Oportunidade"
                  value={form.oportunidade}
                  onChange={(e) =>
                    setForm({ ...form, oportunidade: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3 md:col-span-2"
                />

                <input
                  type="number"
                  placeholder="Valor estimado"
                  value={form.valor_estimado}
                  onChange={(e) =>
                    setForm({ ...form, valor_estimado: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Probabilidade %"
                  value={form.probabilidade}
                  onChange={(e) =>
                    setForm({ ...form, probabilidade: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  type="date"
                  value={form.proximo_contato}
                  onChange={(e) =>
                    setForm({ ...form, proximo_contato: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Aberto</option>
                  <option>Ganho</option>
                  <option>Perdido</option>
                  <option>Fechado</option>
                </select>

                <textarea
                  placeholder="Descrição"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3 md:col-span-4"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarOportunidade}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
                >
                  {form.id ? "Salvar alterações" : "Salvar oportunidade"}
                </button>

                <button
                  onClick={() => setForm(inicial)}
                  className="rounded-xl border px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Funil comercial
                </h3>

                <input
                  placeholder="Pesquisar oportunidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-7">
                {etapas.map((etapa) => {
                  const itensEtapa = filtrado.filter(
                    (item) => item.etapa === etapa
                  );

                  return (
                    <div key={etapa} className="rounded-xl bg-slate-50 p-3">
                      <h4 className="mb-3 text-sm font-bold text-slate-700">
                        {etapa} ({itensEtapa.length})
                      </h4>

                      <div className="space-y-3">
                        {itensEtapa.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border bg-white p-4 shadow-sm"
                          >
                            <p className="font-bold text-slate-800">
                              {item.oportunidade}
                            </p>

                            <p className="text-sm text-slate-500">
                              {item.clientes?.razao_social || "-"}
                            </p>

                            <p className="mt-2 text-sm">
                              {item.representada || "-"}
                            </p>

                            <p className="mt-2 font-bold text-green-700">
                              {moeda(item.valor_estimado)}
                            </p>

                            <p className="text-xs text-slate-500">
                              Probabilidade: {item.probabilidade || 0}%
                            </p>

                            <p className="text-xs text-slate-500">
                              Próximo contato: {item.proximo_contato || "-"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => editar(item)}
                                className="rounded-lg border px-2 py-1 text-xs"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => excluir(item.id)}
                                className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-700"
                              >
                                Excluir
                              </button>
                            </div>

                            <select
                              value={item.etapa}
                              onChange={(e) =>
                                moverEtapa(item, e.target.value)
                              }
                              className="mt-3 w-full rounded-lg border px-2 py-2 text-xs"
                            >
                              {etapas.map((opcao) => (
                                <option key={opcao}>{opcao}</option>
                              ))}
                            </select>
                          </div>
                        ))}

                        {itensEtapa.length === 0 && (
                          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-slate-400">
                            Sem oportunidades.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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