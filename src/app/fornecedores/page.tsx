"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
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
  const [carregando, setCarregando] = useState(false);

  async function carregarFornecedores() {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setFornecedores(data || []);
  }

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const fornecedoresFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return fornecedores.filter((fornecedor) =>
      [
        fornecedor.nome,
        fornecedor.categoria,
        fornecedor.contato,
        fornecedor.telefone,
        fornecedor.whatsapp,
        fornecedor.email,
        fornecedor.cidade,
        fornecedor.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [fornecedores, busca]);

  async function salvarFornecedor() {
    if (!form.nome.trim()) {
      alert("Informe o nome do fornecedor.");
      return;
    }

    setCarregando(true);

    const payload = {
      nome: form.nome,
      categoria: form.categoria,
      contato: form.contato,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      cidade: form.cidade,
      estado: form.estado,
      comissao_percentual: Number(form.comissao_percentual || 0),
      observacoes: form.observacoes,
      ativo: form.ativo ?? true,
    };

    const { error } = form.id
      ? await supabase.from("fornecedores").update(payload).eq("id", form.id)
      : await supabase.from("fornecedores").insert(payload);

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setForm(inicial);
    carregarFornecedores();
  }

  async function excluirFornecedor(id?: string) {
    if (!id) return;

    const confirmar = confirm("Deseja excluir este fornecedor?");
    if (!confirmar) return;

    const { error } = await supabase.from("fornecedores").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarFornecedores();
  }

  function editarFornecedor(fornecedor: any) {
    setForm({
      id: fornecedor.id,
      nome: fornecedor.nome || "",
      categoria: fornecedor.categoria || "",
      contato: fornecedor.contato || "",
      telefone: fornecedor.telefone || "",
      whatsapp: fornecedor.whatsapp || "",
      email: fornecedor.email || "",
      cidade: fornecedor.cidade || "",
      estado: fornecedor.estado || "SP",
      comissao_percentual: String(fornecedor.comissao_percentual || ""),
      observacoes: fornecedor.observacoes || "",
      ativo: fornecedor.ativo ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Fornecedores" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Fornecedores cadastrados" valor={fornecedores.length} />
              <Card titulo="Fornecedores filtrados" valor={fornecedoresFiltrados.length} />
              <Card titulo="Estado principal" valor="SP" />
              <Card titulo="Status" valor="Ativo" />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar fornecedor" : "Novo fornecedor"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Campo label="Nome do fornecedor" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
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
                <button
                  onClick={salvarFornecedor}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar fornecedor"}
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
                  Fornecedores cadastrados
                </h3>

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
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {fornecedoresFiltrados.map((fornecedor) => (
                      <tr key={fornecedor.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {fornecedor.nome}
                        </td>
                        <td className="px-4 py-4">{fornecedor.categoria || "-"}</td>
                        <td className="px-4 py-4">{fornecedor.contato || "-"}</td>
                        <td className="px-4 py-4">
                          {fornecedor.cidade || "-"}/{fornecedor.estado || "SP"}
                        </td>
                        <td className="px-4 py-4">
                          {Number(fornecedor.comissao_percentual || 0).toFixed(2)}%
                        </td>
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarFornecedor(fornecedor)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluirFornecedor(fornecedor.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {fornecedoresFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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