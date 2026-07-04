"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Fornecedor = {
  id: string;
  nome: string;
  comissao_percentual: number;
};

type Produto = {
  id?: string;
  fornecedor_id: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  cor: string;
  preco: string;
  comissao_percentual: string;
  observacoes: string;
};

const inicial: Produto = {
  fornecedor_id: "",
  codigo: "",
  nome: "",
  categoria: "",
  unidade: "UN",
  cor: "",
  preco: "",
  comissao_percentual: "",
  observacoes: "",
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<Produto>(inicial);
  const [busca, setBusca] = useState("");

  async function carregarFornecedores() {
    const { data } = await supabase
      .from("fornecedores")
      .select("id, nome, comissao_percentual")
      .order("nome");

    setFornecedores(data || []);
  }

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*, fornecedores(nome)")
      .order("nome");

    if (error) return alert(error.message);
    setProdutos(data || []);
  }

  async function salvar() {
    if (!form.nome.trim()) return alert("Informe o nome do produto.");

    const payload = {
      ...form,
      preco: Number(form.preco || 0),
      comissao_percentual: Number(form.comissao_percentual || 0),
    };

    const { error } = form.id
      ? await supabase.from("produtos").update(payload).eq("id", form.id)
      : await supabase.from("produtos").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarProdutos();
  }

  async function excluir(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este produto?")) return;

    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarProdutos();
  }

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return produtos.filter((produto) =>
      [
        produto.codigo,
        produto.nome,
        produto.categoria,
        produto.cor,
        produto.fornecedores?.nome,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [produtos, busca]);

  useEffect(() => {
    carregarFornecedores();
    carregarProdutos();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Produtos" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Produtos cadastrados" valor={produtos.length} />
              <Card titulo="Produtos filtrados" valor={filtrados.length} />
              <Card titulo="Fornecedores" valor={fornecedores.length} />
              <Card titulo="Unidade padrão" valor="UN" />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar produto" : "Novo produto"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <select
                  value={form.fornecedor_id}
                  onChange={(e) => {
                    const fornecedor = fornecedores.find(
                      (item) => item.id === e.target.value
                    );

                    setForm({
                      ...form,
                      fornecedor_id: e.target.value,
                      comissao_percentual: String(
                        fornecedor?.comissao_percentual || ""
                      ),
                    });
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Selecione o fornecedor</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>

                <Campo label="Código" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v })} />
                <Campo label="Nome do produto" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                <Campo label="Categoria" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
                <Campo label="Unidade" value={form.unidade} onChange={(v) => setForm({ ...form, unidade: v })} />
                <Campo label="Cor" value={form.cor} onChange={(v) => setForm({ ...form, cor: v })} />
                <Campo label="Preço" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
                <Campo label="Comissão %" value={form.comissao_percentual} onChange={(v) => setForm({ ...form, comissao_percentual: v })} />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-3"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvar}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {form.id ? "Salvar alterações" : "Salvar produto"}
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
                  Produtos cadastrados
                </h3>

                <input
                  placeholder="Pesquisar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Preço</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((produto) => (
                      <tr key={produto.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {produto.nome}
                        </td>
                        <td className="px-4 py-4">
                          {produto.fornecedores?.nome || "-"}
                        </td>
                        <td className="px-4 py-4">{produto.categoria}</td>
                        <td className="px-4 py-4">
                          R$ {Number(produto.preco || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          {produto.comissao_percentual}%
                        </td>
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() =>
                              setForm({
                                ...produto,
                                preco: String(produto.preco || ""),
                                comissao_percentual: String(
                                  produto.comissao_percentual || ""
                                ),
                              })
                            }
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluir(produto.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filtrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum produto encontrado.
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