"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Fornecedor = {
  id?: string;
  nome: string;
  categoria: string;
  contato: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  comissao_percentual: string;
  observacoes: string;
  ativo?: boolean;
};

const inicial: Fornecedor = {
  nome: "",
  categoria: "",
  contato: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cidade: "",
  estado: "SP",
  comissao_percentual: "",
  observacoes: "",
  ativo: true,
};

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<Fornecedor>(inicial);
  const [busca, setBusca] = useState("");

  async function carregar() {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .order("nome");

    if (error) return alert(error.message);
    setFornecedores(data || []);
  }

  async function salvar() {
    if (!form.nome.trim()) return alert("Informe o nome do fornecedor.");

    const payload = {
      ...form,
      comissao_percentual: Number(form.comissao_percentual || 0),
    };

    const { error } = form.id
      ? await supabase.from("fornecedores").update(payload).eq("id", form.id)
      : await supabase.from("fornecedores").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregar();
  }

  async function excluir(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este fornecedor?")) return;

    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (error) return alert(error.message);

    carregar();
  }

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return fornecedores.filter((f) =>
      [f.nome, f.categoria, f.contato, f.cidade]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [fornecedores, busca]);

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-gradient-to-b from-slate-950 to-blue-900 text-white">
          <div className="p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Berbel</p>
            <h1 className="text-3xl font-bold">Connect</h1>
          </div>

          <nav className="space-y-2 px-5">
            <a href="/" className="block rounded-xl px-4 py-3 hover:bg-white/10">Painel</a>
            <a href="/clientes" className="block rounded-xl px-4 py-3 hover:bg-white/10">Clientes</a>
            <a href="/fornecedores" className="block rounded-xl bg-blue-600 px-4 py-3">Fornecedores</a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">Produtos</a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">Agenda</a>
            <a href="/visitas" className="block rounded-xl px-4 py-3 hover:bg-white/10">Visitas</a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">Pedidos</a>
            <a className="block rounded-xl px-4 py-3 hover:bg-white/10">Comissões</a>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-10 py-7">
            <div>
              <p className="text-sm font-medium text-slate-500">CRM Comercial</p>
              <h2 className="text-3xl font-bold text-slate-900">Fornecedores</h2>
            </div>
            <a href="/" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Voltar ao painel
            </a>
          </header>

          <div className="p-8">
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar fornecedor" : "Novo fornecedor"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Campo label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                <Campo label="Categoria" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
                <Campo label="Contato" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} />
                <Campo label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
                <Campo label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                <Campo label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Campo label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
                <Campo label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
                <Campo label="Comissão %" value={form.comissao_percentual} onChange={(v) => setForm({ ...form, comissao_percentual: v })} />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-3"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={salvar} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800">
                  {form.id ? "Salvar alterações" : "Salvar fornecedor"}
                </button>
                <button onClick={() => setForm(inicial)} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold">
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">Fornecedores cadastrados</h3>
                <input
                  placeholder="Pesquisar fornecedor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">{f.nome}</td>
                        <td className="px-4 py-4">{f.categoria}</td>
                        <td className="px-4 py-4">{f.contato}</td>
                        <td className="px-4 py-4">{f.comissao_percentual}%</td>
                        <td className="space-x-2 px-4 py-4">
                          <button onClick={() => setForm(f)} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Editar</button>
                          <button onClick={() => excluir(f.id)} className="rounded-lg bg-red-100 px-3 py-2 text-red-700">Excluir</button>
                        </td>
                      </tr>
                    ))}

                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Nenhum fornecedor encontrado.
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