"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: string;
  razao_social: string;
};

type Visita = {
  id?: string;
  cliente_id: string;
  data_visita: string;
  hora_visita: string;
  pessoa_atendida: string;
  tipo: string;
  resumo: string;
  proxima_acao: string;
  data_retorno: string;
  status: string;
};

const inicial: Visita = {
  cliente_id: "",
  data_visita: "",
  hora_visita: "",
  pessoa_atendida: "",
  tipo: "Visita",
  resumo: "",
  proxima_acao: "",
  data_retorno: "",
  status: "Realizada",
};

export default function VisitasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [form, setForm] = useState<Visita>(inicial);
  const [carregando, setCarregando] = useState(false);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    if (error) return alert(error.message);
    setClientes(data || []);
  }

  async function carregarVisitas() {
    const { data, error } = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: false });

    if (error) return alert(error.message);
    setVisitas(data || []);
  }

  async function salvarVisita() {
    if (!form.cliente_id) return alert("Selecione um cliente.");
    if (!form.data_visita) return alert("Informe a data da visita.");

    setCarregando(true);

    const { error } = form.id
      ? await supabase.from("visitas").update(form).eq("id", form.id)
      : await supabase.from("visitas").insert(form);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarVisitas();
  }

  async function excluirVisita(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir esta visita?")) return;

    const { error } = await supabase.from("visitas").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarVisitas();
  }

  useEffect(() => {
    carregarClientes();
    carregarVisitas();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Visitas Comerciais" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Visitas cadastradas" valor={visitas.length} />
              <Card titulo="Clientes" valor={clientes.length} />
              <Card titulo="Status padrão" valor="Realizada" />
              <Card titulo="Tipo padrão" valor="Visita" />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar visita" : "Nova visita"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <select
                  value={form.cliente_id}
                  onChange={(e) =>
                    setForm({ ...form, cliente_id: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
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
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />

                <input
                  type="time"
                  value={form.hora_visita}
                  onChange={(e) =>
                    setForm({ ...form, hora_visita: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />

                <Campo
                  label="Pessoa atendida"
                  value={form.pessoa_atendida}
                  onChange={(v) => setForm({ ...form, pessoa_atendida: v })}
                />

                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Visita</option>
                  <option>Ligação</option>
                  <option>WhatsApp</option>
                  <option>Reunião</option>
                  <option>Prospecção</option>
                </select>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Realizada</option>
                  <option>Agendada</option>
                  <option>Pendente</option>
                  <option>Cancelada</option>
                </select>

                <input
                  type="date"
                  value={form.data_retorno}
                  onChange={(e) =>
                    setForm({ ...form, data_retorno: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />

                <Campo
                  label="Próxima ação"
                  value={form.proxima_acao}
                  onChange={(v) => setForm({ ...form, proxima_acao: v })}
                />

                <textarea
                  placeholder="Resumo da visita"
                  value={form.resumo}
                  onChange={(e) =>
                    setForm({ ...form, resumo: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-3"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarVisita}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar visita"}
                </button>

                <button
                  onClick={() => setForm(inicial)}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Histórico de visitas
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Próxima ação</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visitas.map((visita) => (
                      <tr key={visita.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {visita.clientes?.razao_social ||
                            "Cliente não informado"}
                        </td>
                        <td className="px-4 py-4">{visita.data_visita}</td>
                        <td className="px-4 py-4">{visita.tipo}</td>
                        <td className="px-4 py-4">{visita.status}</td>
                        <td className="px-4 py-4">{visita.proxima_acao}</td>
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() =>
                              setForm({
                                id: visita.id,
                                cliente_id: visita.cliente_id,
                                data_visita: visita.data_visita || "",
                                hora_visita: visita.hora_visita || "",
                                pessoa_atendida:
                                  visita.pessoa_atendida || "",
                                tipo: visita.tipo || "Visita",
                                resumo: visita.resumo || "",
                                proxima_acao: visita.proxima_acao || "",
                                data_retorno: visita.data_retorno || "",
                                status: visita.status || "Realizada",
                              })
                            }
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluirVisita(visita.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {visitas.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma visita cadastrada ainda.
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

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
    />
  );
}