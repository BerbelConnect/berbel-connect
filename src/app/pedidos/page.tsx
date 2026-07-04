"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = { id: string; razao_social: string };
type Produto = {
  id: string;
  nome: string;
  preco: number;
  comissao_percentual: number;
};

type Pedido = {
  id?: string;
  cliente_id: string;
  produto_id: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  comissao_percentual: string;
  valor_comissao: string;
  status: string;
  observacoes: string;
};

const inicial: Pedido = {
  cliente_id: "",
  produto_id: "",
  quantidade: "1",
  valor_unitario: "",
  valor_total: "",
  comissao_percentual: "",
  valor_comissao: "",
  status: "Orçamento",
  observacoes: "",
};

export default function PedidosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [form, setForm] = useState<Pedido>(inicial);
  const [busca, setBusca] = useState("");

  async function carregarDados() {
    const { data: clientesData } = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    const { data: produtosData } = await supabase
      .from("produtos")
      .select("id, nome, preco, comissao_percentual")
      .order("nome");

    const { data: pedidosData, error } = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), produtos(nome)")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);

    setClientes(clientesData || []);
    setProdutos(produtosData || []);
    setPedidos(pedidosData || []);
  }

  function recalcular(novoForm: Pedido) {
    const quantidade = Number(novoForm.quantidade || 0);
    const valorUnitario = Number(novoForm.valor_unitario || 0);
    const comissao = Number(novoForm.comissao_percentual || 0);

    const total = quantidade * valorUnitario;
    const valorComissao = total * (comissao / 100);

    return {
      ...novoForm,
      valor_total: String(total),
      valor_comissao: String(valorComissao),
    };
  }

  function selecionarProduto(produtoId: string) {
    const produto = produtos.find((item) => item.id === produtoId);

    setForm(
      recalcular({
        ...form,
        produto_id: produtoId,
        valor_unitario: String(produto?.preco || ""),
        comissao_percentual: String(produto?.comissao_percentual || ""),
      })
    );
  }

  async function salvar() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (!form.produto_id) return alert("Selecione o produto.");

    const payload = {
      cliente_id: form.cliente_id,
      produto_id: form.produto_id,
      quantidade: Number(form.quantidade || 0),
      valor_unitario: Number(form.valor_unitario || 0),
      valor_total: Number(form.valor_total || 0),
      comissao_percentual: Number(form.comissao_percentual || 0),
      valor_comissao: Number(form.valor_comissao || 0),
      status: form.status,
      observacoes: form.observacoes,
    };

    const { error } = form.id
      ? await supabase.from("pedidos").update(payload).eq("id", form.id)
      : await supabase.from("pedidos").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  async function excluir(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este pedido?")) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarDados();
  }

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [pedido.clientes?.razao_social, pedido.produtos?.nome, pedido.status]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pedidos" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos cadastrados" valor={pedidos.length} />
              <Card titulo="Pedidos filtrados" valor={filtrados.length} />
              <Card
                titulo="Valor total"
                valor={`R$ ${pedidos
                  .reduce((total, pedido) => total + Number(pedido.valor_total || 0), 0)
                  .toFixed(2)}`}
              />
              <Card
                titulo="Comissão prevista"
                valor={`R$ ${pedidos
                  .reduce(
                    (total, pedido) => total + Number(pedido.valor_comissao || 0),
                    0
                  )
                  .toFixed(2)}`}
              />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar pedido" : "Novo pedido"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </option>
                  ))}
                </select>

                <select
                  value={form.produto_id}
                  onChange={(e) => selecionarProduto(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Selecione o produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Orçamento</option>
                  <option>Pedido</option>
                  <option>Aprovado</option>
                  <option>Faturado</option>
                  <option>Cancelado</option>
                </select>

                <Campo
                  label="Quantidade"
                  value={form.quantidade}
                  onChange={(v) => setForm(recalcular({ ...form, quantidade: v }))}
                />

                <Campo
                  label="Valor unitário"
                  value={form.valor_unitario}
                  onChange={(v) =>
                    setForm(recalcular({ ...form, valor_unitario: v }))
                  }
                />

                <Campo
                  label="Comissão %"
                  value={form.comissao_percentual}
                  onChange={(v) =>
                    setForm(recalcular({ ...form, comissao_percentual: v }))
                  }
                />

                <Campo label="Valor total" value={form.valor_total} onChange={() => {}} />
                <Campo
                  label="Valor comissão"
                  value={form.valor_comissao}
                  onChange={() => {}}
                />

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
                  {form.id ? "Salvar alterações" : "Salvar pedido"}
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
                  Pedidos cadastrados
                </h3>

                <input
                  placeholder="Pesquisar pedido..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {pedido.clientes?.razao_social}
                        </td>
                        <td className="px-4 py-4">{pedido.produtos?.nome}</td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">{pedido.status}</td>
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() =>
                              setForm({
                                id: pedido.id,
                                cliente_id: pedido.cliente_id,
                                produto_id: pedido.produto_id,
                                quantidade: String(pedido.quantidade || ""),
                                valor_unitario: String(pedido.valor_unitario || ""),
                                valor_total: String(pedido.valor_total || ""),
                                comissao_percentual: String(
                                  pedido.comissao_percentual || ""
                                ),
                                valor_comissao: String(pedido.valor_comissao || ""),
                                status: pedido.status || "Orçamento",
                                observacoes: pedido.observacoes || "",
                              })
                            }
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluir(pedido.id)}
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
                          Nenhum pedido encontrado.
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