"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  observacoes: string;
  ativo?: boolean;
};

const inicial: Cliente = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cidade: "",
  estado: "SP",
  observacoes: "",
  ativo: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Cliente>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("razao_social", { ascending: true });

    if (error) return alert(error.message);
    setClientes(data || []);
  }

  async function salvarCliente() {
    if (!form.razao_social.trim()) return alert("Informe a razão social.");

    setCarregando(true);

    const { error } = form.id
      ? await supabase.from("clientes").update(form).eq("id", form.id)
      : await supabase.from("clientes").insert(form);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarClientes();
  }

  async function excluirCliente(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este cliente?")) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarClientes();
  }

  function abrirWhatsApp(numero: string) {
    const limpo = numero.replace(/\D/g, "");
    if (!limpo) return alert("Cliente sem WhatsApp cadastrado.");
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return clientes.filter((cliente) =>
      [
        cliente.razao_social,
        cliente.nome_fantasia,
        cliente.cnpj,
        cliente.responsavel,
        cliente.cidade,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [clientes, busca]);

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Clientes" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes cadastrados" valor={clientes.length} />
              <Card titulo="Clientes filtrados" valor={clientesFiltrados.length} />
              <Card titulo="Estado principal" valor="SP" />
              <Card titulo="Status" valor="Ativo" />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar cliente" : "Novo cliente"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Campo label="Razão Social" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} />
                <Campo label="Nome Fantasia" value={form.nome_fantasia} onChange={(v) => setForm({ ...form, nome_fantasia: v })} />
                <Campo label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
                <Campo label="Responsável" value={form.responsavel} onChange={(v) => setForm({ ...form, responsavel: v })} />
                <Campo label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
                <Campo label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                <Campo label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Campo label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
                <Campo label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-3"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarCliente}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar cliente"}
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
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Clientes cadastrados
                </h3>

                <input
                  placeholder="Pesquisar cliente..."
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
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {cliente.razao_social}
                        </td>
                        <td className="px-4 py-4">
                          {cliente.cidade}/{cliente.estado}
                        </td>
                        <td className="px-4 py-4">{cliente.responsavel}</td>
                        <td className="px-4 py-4">{cliente.whatsapp}</td>
                        <td className="space-x-2 px-4 py-4">
                          <button onClick={() => setForm(cliente)} className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                            Editar
                          </button>

                          <button onClick={() => abrirWhatsApp(cliente.whatsapp)} className="rounded-lg bg-green-100 px-3 py-2 text-green-700">
                            WhatsApp
                          </button>

                          <button onClick={() => excluirCliente(cliente.id)} className="rounded-lg bg-red-100 px-3 py-2 text-red-700">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {clientesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Nenhum cliente encontrado.
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