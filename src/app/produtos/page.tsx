"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Fornecedor = {
  id: string;
  nome: string;
};

type Representada = {
  id: string;
  nome_fantasia: string;
  comissao_padrao: number;
};

type ProdutoForm = {
  id?: string;
  fornecedor_id: string;
  representada_id: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  cor: string;
  preco: string;
  preco_custo: string;
  estoque_atual: string;
  comissao_percentual: string;
  modelo_negocio: string;
  observacoes: string;
  ativo: boolean;
};

const inicial: ProdutoForm = {
  fornecedor_id: "",
  representada_id: "",
  codigo: "",
  nome: "",
  categoria: "",
  unidade: "UN",
  cor: "",
  preco: "",
  preco_custo: "",
  estoque_atual: "",
  comissao_percentual: "",
  modelo_negocio: "Representação",
  observacoes: "",
  ativo: true,
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [representadas, setRepresentadas] = useState<Representada[]>([]);
  const [form, setForm] = useState<ProdutoForm>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    const fornecedoresResp = await supabase
      .from("fornecedores")
      .select("id, nome")
      .order("nome");

    const representadasResp = await supabase
      .from("representadas")
      .select("id, nome_fantasia, comissao_padrao")
      .eq("ativa", true)
      .order("nome_fantasia");

    const produtosResp = await supabase
      .from("produtos")
      .select("*, fornecedores(nome), representadas(nome_fantasia)")
      .order("nome");

    if (fornecedoresResp.error) return alert(fornecedoresResp.error.message);
    if (representadasResp.error) return alert(representadasResp.error.message);
    if (produtosResp.error) return alert(produtosResp.error.message);

    setFornecedores(fornecedoresResp.data || []);
    setRepresentadas(representadasResp.data || []);
    setProdutos(produtosResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function gerarCodigoProduto() {
    const { data, error } = await supabase.rpc("gerar_codigo_produto");

    if (error) {
      console.error(error);
      return `PROD-${Date.now()}`;
    }

    return data;
  }

  function selecionarRepresentada(id: string) {
    const representada = representadas.find((item) => item.id === id);

    setForm({
      ...form,
      representada_id: id,
      modelo_negocio: "Representação",
      comissao_percentual: String(representada?.comissao_padrao || ""),
    });
  }

  async function salvarProduto() {
    if (!form.nome.trim()) return alert("Informe o nome do produto.");

    setCarregando(true);

    const codigoFinal = form.codigo.trim()
      ? form.codigo.trim()
      : await gerarCodigoProduto();

    const payload = {
      fornecedor_id: form.fornecedor_id || null,
      representada_id: form.representada_id || null,
      codigo: codigoFinal,
      nome: form.nome,
      categoria: form.categoria,
      unidade: form.unidade,
      cor: form.cor,
      preco: Number(form.preco || 0),
      preco_custo: Number(form.preco_custo || 0),
      estoque_atual: Number(form.estoque_atual || 0),
      comissao_percentual: Number(form.comissao_percentual || 0),
      modelo_negocio: form.modelo_negocio,
      observacoes: form.observacoes,
      ativo: form.ativo,
    };

    const { error } = form.id
      ? await supabase.from("produtos").update(payload).eq("id", form.id)
      : await supabase.from("produtos").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function editarProduto(produto: any) {
    setForm({
      id: produto.id,
      fornecedor_id: produto.fornecedor_id || "",
      representada_id: produto.representada_id || "",
      codigo: produto.codigo || "",
      nome: produto.nome || "",
      categoria: produto.categoria || "",
      unidade: produto.unidade || "UN",
      cor: produto.cor || "",
      preco: String(produto.preco || ""),
      preco_custo: String(produto.preco_custo || ""),
      estoque_atual: String(produto.estoque_atual || ""),
      comissao_percentual: String(produto.comissao_percentual || ""),
      modelo_negocio: produto.modelo_negocio || "Representação",
      observacoes: produto.observacoes || "",
      ativo: produto.ativo ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirProduto(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este produto?")) return;

    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarDados();
  }

  const produtosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return produtos.filter((produto) =>
      [
        produto.codigo,
        produto.nome,
        produto.categoria,
        produto.cor,
        produto.modelo_negocio,
        produto.fornecedores?.nome,
        produto.representadas?.nome_fantasia,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [produtos, busca]);

  const ativos = produtos.filter((produto) => produto.ativo !== false).length;
  const representacao = produtos.filter(
    (produto) => produto.modelo_negocio !== "Revenda Própria"
  ).length;
  const revenda = produtos.filter(
    (produto) => produto.modelo_negocio === "Revenda Própria"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Produtos V2" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Produtos" valor={produtos.length} />
              <Card titulo="Ativos" valor={ativos} />
              <Card titulo="Representação" valor={representacao} />
              <Card titulo="Revenda própria" valor={revenda} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar produto" : "Novo produto"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  value={form.representada_id}
                  onChange={(e) => selecionarRepresentada(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Representada</option>
                  {representadas.map((representada) => (
                    <option key={representada.id} value={representada.id}>
                      {representada.nome_fantasia}
                    </option>
                  ))}
                </select>

                <select
                  value={form.modelo_negocio}
                  onChange={(e) =>
                    setForm({ ...form, modelo_negocio: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Representação</option>
                  <option>Revenda Própria</option>
                </select>

                <select
                  value={form.fornecedor_id}
                  onChange={(e) =>
                    setForm({ ...form, fornecedor_id: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Fornecedor / compra própria</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>

                <Campo
                  label="Código automático se vazio"
                  value={form.codigo}
                  onChange={(v) => setForm({ ...form, codigo: v })}
                />

                <Campo
                  label="Nome do produto"
                  value={form.nome}
                  onChange={(v) => setForm({ ...form, nome: v })}
                />

                <Campo
                  label="Categoria"
                  value={form.categoria}
                  onChange={(v) => setForm({ ...form, categoria: v })}
                />

                <Campo
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />

                <Campo
                  label="Cor"
                  value={form.cor}
                  onChange={(v) => setForm({ ...form, cor: v })}
                />

                <Campo
                  label="Preço venda"
                  type="number"
                  value={form.preco}
                  onChange={(v) => setForm({ ...form, preco: v })}
                />

                <Campo
                  label="Preço custo"
                  type="number"
                  value={form.preco_custo}
                  onChange={(v) => setForm({ ...form, preco_custo: v })}
                />

                <Campo
                  label="Estoque atual"
                  type="number"
                  value={form.estoque_atual}
                  onChange={(v) => setForm({ ...form, estoque_atual: v })}
                />

                <Campo
                  label="Comissão %"
                  type="number"
                  value={form.comissao_percentual}
                  onChange={(v) =>
                    setForm({ ...form, comissao_percentual: v })
                  }
                />

                <select
                  value={form.ativo ? "Ativo" : "Inativo"}
                  onChange={(e) =>
                    setForm({ ...form, ativo: e.target.value === "Ativo" })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-4"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarProduto}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar produto"}
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
                      <th className="px-4 py-3">Representada</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Preço</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Estoque</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {produtosFiltrados.map((produto) => (
                      <tr key={produto.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">
                            {produto.nome}
                          </p>
                          <p className="text-xs text-slate-500">
                            {produto.codigo || "-"} •{" "}
                            {produto.categoria || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          {produto.representadas?.nome_fantasia || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {produto.modelo_negocio || "Representação"}
                        </td>

                        <td className="px-4 py-4">{moeda(produto.preco)}</td>

                        <td className="px-4 py-4 font-semibold text-green-700">
                          {Number(produto.comissao_percentual || 0).toFixed(2)}%
                        </td>

                        <td className="px-4 py-4">
                          {produto.modelo_negocio === "Revenda Própria"
                            ? Number(produto.estoque_atual || 0).toFixed(2)
                            : "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              produto.ativo === false
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {produto.ativo === false ? "Inativo" : "Ativo"}
                          </span>
                        </td>

                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarProduto(produto)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluirProduto(produto.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {produtosFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
    />
  );
}