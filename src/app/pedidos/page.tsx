"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";

type Cliente = {
  id: string;
  razao_social: string;
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  preco_custo: number;
  estoque_atual: number;
  comissao_percentual: number;
  modelo_negocio: string;
  representada_id: string | null;
  representadas?: {
    nome_fantasia?: string;
  } | null;
};

type ItemPedido = {
  produto_id: string;
  produto_nome: string;
  representada_id: string | null;
  representada_nome: string;
  modelo_negocio: string;
  quantidade: string;
  valor_unitario: string;
  preco_custo: string;
  valor_total: string;
  comissao_percentual: string;
  valor_comissao: string;
  lucro_previsto: string;
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
  representada_id: null,
  representada_nome: "",
  modelo_negocio: "Representação",
  quantidade: "1",
  valor_unitario: "",
  preco_custo: "",
  valor_total: "",
  comissao_percentual: "",
  valor_comissao: "",
  lucro_previsto: "",
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

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
    const clientesResp = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    const produtosResp = await supabase
      .from("produtos")
      .select(
        "id, nome, preco, preco_custo, estoque_atual, comissao_percentual, modelo_negocio, representada_id, representadas(nome_fantasia)"
      )
      .eq("ativo", true)
      .order("nome");

    const pedidosResp = await supabase
      .from("pedidos")
      .select(`
        *,
        clientes(
          razao_social,
          nome_fantasia,
          cnpj,
          endereco,
          numero,
          bairro,
          cidade,
          estado,
          telefone,
          whatsapp,
          email
        ),
        pedido_itens(
          *,
          produtos(nome),
          representadas(nome_fantasia)
        )
      `)
      .order("created_at", { ascending: false });

    if (clientesResp.error) return alert(clientesResp.error.message);
    if (produtosResp.error) return alert(produtosResp.error.message);
    if (pedidosResp.error) return alert(pedidosResp.error.message);

    setClientes(clientesResp.data || []);
    setProdutos((produtosResp.data || []) as any);
    setPedidos(pedidosResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function gerarNumeroPedido() {
    const { data, error } = await supabase.rpc("gerar_numero_pedido");

    if (error) {
      console.error(error);
      return `PED-${Date.now()}`;
    }

    return data;
  }

  function recalcularItem(item: ItemPedido) {
    const quantidade = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor_unitario || 0);
    const custo = Number(item.preco_custo || 0);
    const percentual = Number(item.comissao_percentual || 0);

    const valorTotal = quantidade * valorUnitario;
    const valorComissao = valorTotal * (percentual / 100);
    const lucroPrevisto =
      item.modelo_negocio === "Revenda Própria"
        ? valorTotal - quantidade * custo
        : 0;

    return {
      ...item,
      valor_total: String(valorTotal),
      valor_comissao: String(valorComissao),
      lucro_previsto: String(lucroPrevisto),
    };
  }

  function selecionarProduto(produtoId: string) {
    const produto: any = produtos.find((p) => p.id === produtoId);

    if (!produto) {
      setItemAtual(itemInicial);
      return;
    }

    const novoItem = recalcularItem({
      ...itemAtual,
      produto_id: produto.id,
      produto_nome: produto.nome || "",
      representada_id: produto.representada_id || null,
      representada_nome: produto.representadas?.nome_fantasia || "",
      modelo_negocio: produto.modelo_negocio || "Representação",
      valor_unitario: String(produto.preco || ""),
      preco_custo: String(produto.preco_custo || ""),
      comissao_percentual: String(produto.comissao_percentual || ""),
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

  const valorTotalRevenda = itens
    .filter((item) => item.modelo_negocio === "Revenda Própria")
    .reduce((total, item) => total + Number(item.valor_total || 0), 0);

  const lucroPrevistoRevenda = itens
    .filter((item) => item.modelo_negocio === "Revenda Própria")
    .reduce((total, item) => total + Number(item.lucro_previsto || 0), 0);

  async function salvarPedido() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (itens.length === 0) return alert("Adicione ao menos um produto.");

    setCarregando(true);

    const numeroFinal = form.numero.trim()
      ? form.numero.trim()
      : await gerarNumeroPedido();

    const temRepresentacao = itens.some(
      (item) => item.modelo_negocio !== "Revenda Própria"
    );

    const temRevenda = itens.some(
      (item) => item.modelo_negocio === "Revenda Própria"
    );

    const tipoOperacao =
      temRepresentacao && temRevenda
        ? "Misto"
        : temRevenda
        ? "Revenda Própria"
        : "Representação";

    const { data: pedidoCriado, error: erroPedido } = await supabase
      .from("pedidos")
      .insert({
        cliente_id: form.cliente_id,
        numero: numeroFinal,
        data_pedido: form.data_pedido,
        status: form.status,
        observacoes: form.observacoes,
        tipo_operacao: tipoOperacao,
        valor_total: valorTotalPedido,
        valor_comissao: valorTotalComissao,
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
      produto_nome: item.produto_nome,
      representada_id: item.representada_id,
      representada_nome: item.representada_nome,
      modelo_negocio: item.modelo_negocio,
      quantidade: Number(item.quantidade || 0),
      valor_unitario: Number(item.valor_unitario || 0),
      preco_custo: Number(item.preco_custo || 0),
      valor_total: Number(item.valor_total || 0),
      comissao_percentual: Number(item.comissao_percentual || 0),
      valor_comissao: Number(item.valor_comissao || 0),
      lucro_previsto: Number(item.lucro_previsto || 0),
    }));

    const { error: erroItens } = await supabase
      .from("pedido_itens")
      .insert(itensPayload);

    if (erroItens) {
      setCarregando(false);
      return alert(erroItens.message);
    }

    if (valorTotalRevenda > 0) {
      await supabase.from("contas_receber").insert({
        pedido_id: pedidoCriado.id,
        cliente_id: form.cliente_id,
        descricao: `Revenda - Pedido ${numeroFinal}`,
        valor: valorTotalRevenda,
        vencimento: null,
        recebimento: null,
        status: "Pendente",
        forma_pagamento: "",
        observacoes: form.observacoes,
      });
    }

    const comissoesPayload = itens
      .filter((item) => Number(item.valor_comissao || 0) > 0)
      .map((item) => ({
        pedido_id: pedidoCriado.id,
        cliente_id: form.cliente_id,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        empresa:
          item.representada_nome ||
          (item.modelo_negocio === "Revenda Própria"
            ? "Revenda Própria"
            : "Representação"),
        percentual: Number(item.comissao_percentual || 0),
        valor_base: Number(item.valor_total || 0),
        valor_comissao: Number(item.valor_comissao || 0),
        previsao_recebimento: null,
        data_recebimento: null,
        status: "Pendente",
        observacoes: `Comissão gerada automaticamente pelo pedido ${numeroFinal}`,
      }));

    if (comissoesPayload.length > 0) {
      await supabase.from("comissoes_financeiro").insert(comissoesPayload);
    }

    setCarregando(false);
    setForm(pedidoInicial);
    setItens([]);
    setItemAtual(itemInicial);
    carregarDados();

    alert(`Pedido ${numeroFinal} salvo com sucesso.`);
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
      [
        pedido.numero,
        pedido.clientes?.razao_social,
        pedido.clientes?.cnpj,
        pedido.clientes?.bairro,
        pedido.clientes?.cidade,
        pedido.status,
        pedido.tipo_operacao,
      ]
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
          <PageHeader titulo="Pedidos V2" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos" valor={pedidos.length} />
              <Card titulo="Total atual" valor={moeda(valorTotalPedido)} />
              <Card titulo="Comissão atual" valor={moeda(valorTotalComissao)} />
              <Card titulo="Lucro revenda" valor={moeda(lucroPrevistoRevenda)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Novo pedido
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

                <Campo
                  label="Número automático se vazio"
                  value={form.numero}
                  onChange={(v) => setForm({ ...form, numero: v })}
                />

                <Campo
                  label=""
                  type="date"
                  value={form.data_pedido}
                  onChange={(v) => setForm({ ...form, data_pedido: v })}
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
                Adicionar produto
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

              {itemAtual.produto_id && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p>
                    Representada:{" "}
                    <strong>{itemAtual.representada_nome || "-"}</strong>
                  </p>
                  <p>
                    Modelo: <strong>{itemAtual.modelo_negocio}</strong>
                  </p>
                  <p>
                    Total do item: <strong>{moeda(itemAtual.valor_total)}</strong>
                  </p>
                  <p>
                    Comissão:{" "}
                    <strong className="text-green-700">
                      {moeda(itemAtual.valor_comissao)}
                    </strong>
                  </p>
                  {itemAtual.modelo_negocio === "Revenda Própria" && (
                    <p>
                      Lucro previsto:{" "}
                      <strong className="text-blue-700">
                        {moeda(itemAtual.lucro_previsto)}
                      </strong>
                    </p>
                  )}
                </div>
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
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Qtd.</th>
                      <th className="px-4 py-3">Unit.</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ação</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item, index) => (
                      <tr key={`${item.produto_id}-${index}`}>
                        <td className="px-4 py-4 font-semibold">
                          {item.produto_nome}
                        </td>
                        <td className="px-4 py-4">
                          {item.representada_nome || "-"}
                        </td>
                        <td className="px-4 py-4">{item.modelo_negocio}</td>
                        <td className="px-4 py-4">{item.quantidade}</td>
                        <td className="px-4 py-4">{moeda(item.valor_unitario)}</td>
                        <td className="px-4 py-4">{moeda(item.valor_total)}</td>
                        <td className="px-4 py-4 text-green-700">
                          {moeda(item.valor_comissao)}
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
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum item adicionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <div>
                  <p className="text-sm text-slate-500">Total do pedido</p>
                  <strong className="text-2xl">{moeda(valorTotalPedido)}</strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Comissão prevista</p>
                  <strong className="text-2xl text-green-700">
                    {moeda(valorTotalComissao)}
                  </strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Revenda própria</p>
                  <strong className="text-2xl text-blue-700">
                    {moeda(valorTotalRevenda)}
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
                  className="w-full max-w-sm rounded-xl border px-4 py-3"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Número</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Tipo</th>
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
                          {pedido.tipo_operacao || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {pedido.pedido_itens?.length || 0}
                        </td>
                        <td className="px-4 py-4">{moeda(pedido.valor_total)}</td>
                        <td className="px-4 py-4 text-green-700">
                          {moeda(pedido.valor_comissao)}
                        </td>
                        <td className="px-4 py-4">{pedido.status}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => gerarPedidoPDF(pedido)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                            >
                              PDF
                            </button>

                            <button
                              onClick={() => excluirPedido(pedido.id)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
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
                          colSpan={8}
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
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
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