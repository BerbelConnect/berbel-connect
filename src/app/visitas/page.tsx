"use client";

import { useEffect, useState } from "react";
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

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      return;
    }

    setClientes(data || []);
  }

  async function carregarVisitas() {
    const { data, error } = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: false });

    if (error) {
      alert("Erro ao carregar visitas: " + error.message);
      return;
    }

    setVisitas(data || []);
  }

  async function salvarVisita() {
    if (!form.cliente_id) return alert("Selecione um cliente.");
    if (!form.data_visita) return alert("Informe a data da visita.");

    setCarregando(true);

    const { error } = await supabase.from("visitas").insert(form);

    setCarregando(false);

    if (error) {
      alert("Erro ao salvar visita: " + error.message);
      return;
    }

    setForm(inicial);
    carregarVisitas();
  }

  useEffect(() => {
    carregarClientes();
    carregarVisitas();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-gradient-to-b from-slate-950 to-blue-900 text-white">
          <div className="p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
              Berbel
            </p>
            <h1 className="text-3xl font-bold">Connect</h1>
          </div>

          <nav className="space-y-2 px-5">
            <a href="/" className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Painel
            </a>
            <a href="/clientes" className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Clientes
            </a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Fornecedores
            </a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Produtos
            </a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Agenda
            </a>
            <a href="/visitas" className="block rounded-xl bg-blue-600 px-4 py-3">
              Visitas
            </a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Pedidos
            </a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">
              Comissões
            </a>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-10 py-7">
            <div>
              <p className="text-sm font-medium text-slate-500">CRM Comercial</p>
              <h2 className="text-3xl font-bold text-slate-900">
                Visitas Comerciais
              </h2>
            </div>

            <a
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar ao painel
            </a>
          </header>

          <div className="p-8">
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Nova visita
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                <input
                  placeholder="Pessoa atendida"
                  value={form.pessoa_atendida}
                  onChange={(e) =>
                    setForm({ ...form, pessoa_atendida: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Visita</option>
                  <option>Ligação</option>
                  <option>WhatsApp</option>
                  <option>Reunião</option>
                  <option>Prospecção</option>
                </select>

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
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
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  placeholder="Próxima ação"
                  value={form.proxima_acao}
                  onChange={(e) =>
                    setForm({ ...form, proxima_acao: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
                />

                <textarea
                  placeholder="Resumo da visita"
                  value={form.resumo}
                  onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-3"
                />
              </div>

              <button
                onClick={salvarVisita}
                disabled={carregando}
                className="mt-5 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
              >
                {carregando ? "Salvando..." : "Salvar visita"}
              </button>
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
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visitas.map((visita) => (
                      <tr key={visita.id}>
                        <td className="px-4 py-4 font-semibold">
                          {visita.clientes?.razao_social || "Cliente não informado"}
                        </td>
                        <td className="px-4 py-4">{visita.data_visita}</td>
                        <td className="px-4 py-4">{visita.tipo}</td>
                        <td className="px-4 py-4">{visita.status}</td>
                        <td className="px-4 py-4">{visita.proxima_acao}</td>
                      </tr>
                    ))}

                    {visitas.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
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