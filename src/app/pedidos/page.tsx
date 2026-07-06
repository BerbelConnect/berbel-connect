"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";

type Cliente = { id: string; razao_social: string };

type Produto = {
  id: string;
  nome: string;
  preco: number;
  comissao_percentual: number;
  fornecedores?: { nome?: string } | null;
};

type ItemPedido = {
  produto_id: string;
  produto_nome: string;
  fornecedor_nome: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  comissao_percentual: string;
  valor_comissao: string;
};

type PedidoForm = {
  cliente_id: string;
  numero: string;
  data_pedido: string;
  status: string;
  observacoes: string;
};

const pedidoInicial: PedidoForm = {
  cliente_id: "",
  numero: "",
  data_pedido: new Date().toISOString().slice(0, 10),
  status: "Orçamento",
  observacoes: "",
};

const itemInicial: ItemPedido = {
  produto_id: "",
  produto_nome: "",
  fornecedor_nome: "",
  quantidade: "1",
  valor_unitario: "",
  valor_total: "",
  comissao_percentual: "",
  valor_comissao: "",
};

export default function PedidosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [form, setForm] = useState<PedidoForm>(pedidoInicial);
  const [itemAtual, setItemAtual] = useState<ItemPedido>(itemInicial);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    const { data: clientesData } = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    const { data: produtosData } = await supabase
      .from("produtos")
      .select("id, nome, preco, comissao_percentual, fornecedores(nome)")
      .order("nome");

    const { data: pedidosData, error } = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), pedido_itens(*)")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);

    setClientes(clientesData || []);
    setProdutos((produtosData || []) as any);
    setPedidos(pedidosData || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function recalcularItem(item: ItemPedido) {
    const quantidade = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor_unitario || 0);
    const comissao = Number(item.comissao_percentual || 0);

    const valorTotal = quantidade * valorUnitario;
    const valorComissao = valorTotal * (comissao / 100);

    return {
      ...item,
      valor_total: String(valorTotal),
      valor_comissao: String(valorComissao),
    };
  }

  function selecionarProduto(produtoId: string) {
    const produto: any = produtos.find((p) => p.id === produtoId);

    const novoItem = recalcularItem({
      ...itemAtual,
      produto_id: produtoId,
      produto_nome: produto?.nome || "",
      fornecedor_nome: produto?.fornecedores?.nome || "",
      valor_unitario: String(produto?.preco || ""),
      comissao_percentual: String(produto?.comissao_percentual || ""),
    });

    setItemAtual(novoItem);
  }

  function adicionarItem() {
    if (!itemAtual.produto_id) return alert("Selecione um produto.");
    if (!itemAtual.quantidade) return alert("Informe a quantidade.");

    setItens([...itens, itemAtual]);
    setItemAtual(itemInicial);
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  const valorTotalPedido = itens.reduce(
    (total, item) => total + Number(item.valor_total || 0),
    0
  );

  const valorTotalComissao = itens.reduce(
    (total, item) => total + Number(item.valor_comissao || 0),
    0
  );

  async function salvarPedido() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (itens.length === 0) return alert("Adicione ao menos um produto.");

    setCarregando(true);

    const { data: pedidoCriado, error: erroPedido } = await supabase
      .from("pedidos")
      .insert({
        cliente_id: form.cliente_id,
        numero: form.numero,
        data_pedido: form.data_pedido,
        status: form.status,
        observacoes: form.observacoes,
        valor_total: valorTotalPedido,
        valor_comissao: valorTotalComissao,
        comissao_percentual: 0,
        quantidade: itens.reduce(
          (total, item) => total + Number(item.quantidade || 0),
          0
        ),
        valor_unitario: 0,
      })
      .select()
      .single();

    if (erroPedido) {
      setCarregando(false);
      return alert(erroPedido.message);
    }

    const itensPayload = itens.map((item) => ({
      pedido_id: pedidoCriado.id,
      produto_id: item.produto_id,
      quantidade: Number(item.quantidade || 0),
      valor_unitario: Number(item.valor_unitario || 0),
      valor_total: Number(item.valor_total || 0),
      comissao_percentual: Number(item.comissao_percentual || 0),
      valor_comissao: Number(item.valor_comissao || 0),
    }));

    const { error: erroItens } = await supabase
      .from("pedido_itens")
      .insert(itensPayload);

    if (erroItens) {
      setCarregando(false);
      return alert(erroItens.message);
    }

    await supabase.from("contas_receber").insert({
      pedido_id: pedidoCriado.id,
      cliente_id: form.cliente_id,
      descricao: `Pedido ${form.numero || pedidoCriado.id}`,
      valor: valorTotalPedido,
      vencimento: null,
      recebimento: null,
      status: "Pendente",
      forma_pagamento: "",
      observacoes: form.observacoes,
    });

    const comissoesPayload = itens.map((item) => ({
      pedido_id: pedidoCriado.id,
      cliente_id: form.cliente_id,
      produto_id: item.produto_id,
      produto_nome: item.produto_nome,
      empresa: item.fornecedor_nome || item.produto_nome,
      percentual: Number(item.comissao_percentual || 0),
      valor_base: Number(item.valor_total || 0),
      valor_comissao: Number(item.valor_comissao || 0),
      previsao_recebimento: null,
      data_recebimento: null,
      status: "Pendente",
      observacoes: `Comissão gerada automaticamente pelo pedido ${
        form.numero || pedidoCriado.id
      }`,
    }));

    await supabase.from("comissoes_financeiro").insert(comissoesPayload);

    setCarregando(false);
    setForm(pedidoInicial);
    setItens([]);
    setItemAtual(itemInicial);
    carregarDados();

    alert("Pedido salvo com financeiro e comissões gerados automaticamente.");
  }

  async function excluirPedido(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este pedido?")) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarDados();
  }

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [pedido.numero, pedido.clientes?.razao_social, pedido.status]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pedidos" subtitulo="ERP Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos" valor={pedidos.length} />
              <Card titulo="Filtrados" valor={pedidosFiltrados.length} />
              <Card titulo="Total" valor={`R$ ${valorTotalPedido.toFixed(2)}`} />
              <Card titulo="Comissão" valor={`R$ ${valorTotalComissao.toFixed(2)}`} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Novo pedido com vários produtos
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
                  placeholder="Número do pedido"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="date"
                  value={form.data_pedido}
                  onChange={(e) =>
                    setForm({ ...form, data_pedido: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Orçamento</option>
                  <option>Pedido</option>
                  <option>Aprovado</option>
                  <option>Faturado</option>
                  <option>Cancelado</option>
                </select>

                <textarea
                  placeholder="Observações do pedido"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-4"
                />
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Adicionar produto ao pedido
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <select
                  value={itemAtual.produto_id}
                  onChange={(e) => selecionarProduto(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
                >
                  <option value="">Selecione o produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>

                <Campo
                  label="Quantidade"
                  value={itemAtual.quantidade}
                  onChange={(v) =>
                    setItemAtual(recalcularItem({ ...itemAtual, quantidade: v }))
                  }
                />

                <Campo
                  label="Valor unitário"
                  value={itemAtual.valor_unitario}
                  onChange={(v) =>
                    setItemAtual(
                      recalcularItem({ ...itemAtual, valor_unitario: v })
                    )
                  }
                />

                <Campo
                  label="Comissão %"
                  value={itemAtual.comissao_percentual}
                  onChange={(v) =>
                    setItemAtual(
                      recalcularItem({ ...itemAtual, comissao_percentual: v })
                    )
                  }
                />
              </div>

              {itemAtual.fornecedor_nome && (
                <p className="mt-3 text-sm text-slate-500">
                  Representada: <strong>{itemAtual.fornecedor_nome}</strong>
                </p>
              )}

              <button
                onClick={adicionarItem}
                className="mt-5 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Adicionar item
              </button>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Itens do pedido
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Representada</th>
                      <th className="px-4 py-3">Qtd.</th>
                      <th className="px-4 py-3">Valor unit.</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ação</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item, index) => (
                      <tr key={`${item.produto_id}-${index}`}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {item.produto_nome}
                        </td>
                        <td className="px-4 py-4">
                          {item.fornecedor_nome || "-"}
                        </td>
                        <td className="px-4 py-4">{item.quantidade}</td>
                        <td className="px-4 py-4">
                          R$ {Number(item.valor_unitario || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(item.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-green-700">
                          R$ {Number(item.valor_comissao || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => removerItem(index)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}

                    {itens.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum item adicionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-5">
                <div>
                  <p className="text-sm text-slate-500">Total do pedido</p>
                  <strong className="text-2xl text-slate-900">
                    R$ {valorTotalPedido.toFixed(2)}
                  </strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Comissão prevista</p>
                  <strong className="text-2xl text-green-700">
                    R$ {valorTotalComissao.toFixed(2)}
                  </strong>
                </div>

                <button
                  onClick={salvarPedido}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando ? "Salvando..." : "Salvar pedido"}
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
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Número</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Itens</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="px-4 py-4 font-semibold">
                          {pedido.numero || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {pedido.clientes?.razao_social || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {pedido.pedido_itens?.length || 0}
                        </td>
                        <td className="px-4 py-4">
                          R$ {Number(pedido.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-green-700">
                          R$ {Number(pedido.valor_comissao || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">{pedido.status}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => gerarPedidoPDF(pedido)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200"
                            >
                              PDF
                            </button>

                            <button
                              onClick={() => excluirPedido(pedido.id)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {pedidosFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
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

function Card({ titulo, valor }: { titulo: string | number; valor: string | number }) {
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