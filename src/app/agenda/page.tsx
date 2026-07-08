"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: string;
  razao_social: string;
  cidade?: string;
  estado?: string;
};

const inicial = {
  cliente_id: "",
  data_visita: new Date().toISOString().slice(0, 10),
  hora_visita: "",
  tipo_contato: "Presencial",
  bairro: "",
  status: "Agendada",
  resultado: "",
  oportunidade: "",
  valor_potencial: "",
  observacoes: "",
  alerta_retorno: false,
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgendaPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [form, setForm] = useState<any>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    const clientesResp = await supabase
      .from("clientes")
      .select("id, razao_social, cidade, estado")
      .order("razao_social");

    const visitasResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social, cidade, estado)")
      .order("data_visita", { ascending: true });

    if (clientesResp.error) return alert(clientesResp.error.message);
    if (visitasResp.error) return alert(visitasResp.error.message);

    setClientes(clientesResp.data || []);
    setVisitas(visitasResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarVisita() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (!form.data_visita) return alert("Informe a data da visita.");

    setCarregando(true);

    const payload = {
      cliente_id: form.cliente_id,
      data_visita: form.data_visita,
      hora_visita: form.hora_visita || null,
      tipo_contato: form.tipo_contato,
      bairro: form.bairro,
      status: form.status,
      resultado: form.resultado,
      oportunidade: form.oportunidade,
      valor_potencial: Number(form.valor_potencial || 0),
      observacoes: form.observacoes,
      alerta_retorno: form.alerta_retorno,
    };

    const { error } = form.id
      ? await supabase.from("visitas").update(payload).eq("id", form.id)
      : await supabase.from("visitas").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function editarVisita(visita: any) {
    setForm({
      id: visita.id,
      cliente_id: visita.cliente_id || "",
      data_visita: visita.data_visita || hojeISO(),
      hora_visita: visita.hora_visita || "",
      tipo_contato: visita.tipo_contato || "Presencial",
      bairro: visita.bairro || "",
      status: visita.status || "Agendada",
      resultado: visita.resultado || "",
      oportunidade: visita.oportunidade || "",
      valor_potencial: String(visita.valor_potencial || ""),
      observacoes: visita.observacoes || "",
      alerta_retorno: visita.alerta_retorno || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function concluirVisita(visita: any) {
    const { error } = await supabase
      .from("visitas")
      .update({
        status: "Concluída",
        resultado: visita.resultado || "Visita concluída",
      })
      .eq("id", visita.id);

    if (error) return alert(error.message);
    carregarDados();
  }

  async function excluirVisita(id: string) {
    if (!confirm("Deseja excluir esta visita?")) return;

    const { error } = await supabase.from("visitas").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarDados();
  }

  function abrirWhatsApp(cliente: any) {
    alert("Para abrir WhatsApp direto, precisamos usar o WhatsApp cadastrado no cliente.");
  }

  const visitasFiltradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return visitas.filter((visita) =>
      [
        visita.clientes?.razao_social,
        visita.bairro,
        visita.status,
        visita.tipo_contato,
        visita.resultado,
        visita.oportunidade,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [visitas, busca]);

  const hoje = hojeISO();

  const visitasHoje = visitasFiltradas.filter(
    (v) => v.data_visita === hoje
  );

  const atrasadas = visitasFiltradas.filter(
    (v) => v.data_visita < hoje && v.status !== "Concluída"
  );

  const proximas = visitasFiltradas.filter(
    (v) => v.data_visita > hoje && v.status !== "Concluída"
  );

  const concluidas = visitasFiltradas.filter(
    (v) => v.status === "Concluída"
  );

  const potencialTotal = visitasFiltradas.reduce(
    (soma, v) => soma + Number(v.valor_potencial || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Agenda Inteligente" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card titulo="Hoje" valor={visitasHoje.length} />
              <Card titulo="Atrasadas" valor={atrasadas.length} />
              <Card titulo="Próximas" valor={proximas.length} />
              <Card titulo="Concluídas" valor={concluidas.length} />
              <Card titulo="Potencial" valor={moeda(potencialTotal)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar visita" : "Nova visita"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  value={form.cliente_id}
                  onChange={(e) =>
                    setForm({ ...form, cliente_id: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={form.data_visita}
                  onChange={(e) =>
                    setForm({ ...form, data_visita: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="time"
                  value={form.hora_visita}
                  onChange={(e) =>
                    setForm({ ...form, hora_visita: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={form.tipo_contato}
                  onChange={(e) =>
                    setForm({ ...form, tipo_contato: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Presencial</option>
                  <option>WhatsApp</option>
                  <option>Ligação</option>
                  <option>E-mail</option>
                  <option>Retorno</option>
                  <option>Cobrança</option>
                </select>

                <input
                  placeholder="Bairro"
                  value={form.bairro}
                  onChange={(e) =>
                    setForm({ ...form, bairro: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Agendada</option>
                  <option>Em andamento</option>
                  <option>Concluída</option>
                  <option>Remarcar</option>
                  <option>Cancelada</option>
                </select>

                <input
                  placeholder="Oportunidade"
                  value={form.oportunidade}
                  onChange={(e) =>
                    setForm({ ...form, oportunidade: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Valor potencial"
                  value={form.valor_potencial}
                  onChange={(e) =>
                    setForm({ ...form, valor_potencial: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <textarea
                  placeholder="Resultado"
                  value={form.resultado}
                  onChange={(e) =>
                    setForm({ ...form, resultado: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
                />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
                />

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.alerta_retorno}
                    onChange={(e) =>
                      setForm({ ...form, alerta_retorno: e.target.checked })
                    }
                  />
                  Gerar alerta de retorno
                </label>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarVisita}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar visita"}
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
                  Visitas cadastradas
                </h3>

                <input
                  placeholder="Pesquisar agenda..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="space-y-4">
                {visitasFiltradas.map((visita) => (
                  <div key={visita.id} className="rounded-xl border p-5">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-slate-800">
                          {visita.clientes?.razao_social || "-"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {visita.data_visita || "-"} às{" "}
                          {visita.hora_visita || "--:--"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {visita.tipo_contato || "-"} • Bairro:{" "}
                          {visita.bairro || "-"}
                        </p>

                        <p className="mt-2 text-sm">
                          Oportunidade: {visita.oportunidade || "-"}
                        </p>

                        <p className="text-sm">
                          Resultado: {visita.resultado || "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            visita.status === "Concluída"
                              ? "bg-green-100 text-green-700"
                              : visita.data_visita < hoje
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {visita.status || "Agendada"}
                        </span>

                        <p className="mt-3 font-bold text-green-700">
                          {moeda(visita.valor_potencial)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => editarVisita(visita)}
                        className="rounded-lg border px-3 py-2"
                      >
                        Editar
                      </button>

                      {visita.status !== "Concluída" && (
                        <button
                          onClick={() => concluirVisita(visita)}
                          className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                        >
                          Concluir
                        </button>
                      )}

                      <button
                        onClick={() => excluirVisita(visita.id)}
                        className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}

                {visitasFiltradas.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    Nenhuma visita encontrada.
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
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}