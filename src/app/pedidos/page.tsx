"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";
import { gerarPlanoPagamento } from "@/lib/pedidos/condicaoPagamento";
import { criarPedidoCompleto } from "@/lib/pedidos/criarPedidoCompleto";
import { cancelarPedido } from "@/lib/pedidos/cancelarPedido";

type Cliente = {
  id: string;
  razao_social: string;
  condicao_pagamento_padrao?: string | null;
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  preco_custo?: number;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  fornecedores?: {
    nome?: string | null;
  } | null;
  comissao_percentual: number;
};

type ItemPedido = {
  produto_id: string;
  produto_nome: string;
  fornecedor_id: string | null;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  comissao_percentual: string;
  valor_comissao: string;
  valor_custo_unitario: string;
  valor_custo_total: string;
  lucro_unitario: string;
  lucro_total: string;
};

type PedidoForm = {
  cliente_id: string;
  numero: string;
  data_pedido: string;
  data_entrega_prevista: string;
  data_entrega_real: string;
  tipo: string;
  status: string;
  condicao_pagamento: string;
  observacoes: string;
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatarMoeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function erroDeConexao(error: any) {
  const mensagem = String(error?.message || error || "").toLowerCase();

  return (
    mensagem.includes("failed to fetch") ||
    mensagem.includes("load failed") ||
    mensagem.includes("network") ||
    mensagem.includes("fetch") ||
    mensagem.includes("internet") ||
    mensagem.includes("offline") ||
    mensagem.includes("timeout") ||
    mensagem.includes("abort") ||
    mensagem.includes("connection timeout") ||
    mensagem.includes("disconnect") ||
    mensagem.includes("reset before headers")
  );
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tipoGeraFinanceiroVenda(tipo?: string | null) {
  const tipoNormalizado = normalizarTexto(tipo);

  return (
    tipoNormalizado === "revenda" ||
    tipoNormalizado === "revenda propria" ||
    tipoNormalizado === "venda direta" ||
    tipoNormalizado === "venda propria" ||
    tipoNormalizado === "compra propria"
  );
}

function statusGeraFinanceiro(status?: string | null) {
  const statusNormalizado = normalizarTexto(status);

  return statusNormalizado !== "orcamento" && statusNormalizado !== "cancelado";
}

const pedidoInicial: PedidoForm = {
  cliente_id: "",
  numero: "",
  data_pedido: hojeISO(),
  data_entrega_prevista: "",
  data_entrega_real: "",
  tipo: "Representação",
  status: "Pedido",
  condicao_pagamento: "A combinar",
  observacoes: "",
};

const itemInicial: ItemPedido = {
  produto_id: "",
  produto_nome: "",
  fornecedor_id: null,
  quantidade: "1",
  valor_unitario: "",
  valor_total: "",
  comissao_percentual: "",
  valor_comissao: "",
  valor_custo_unitario: "",
  valor_custo_total: "",
  lucro_unitario: "",
  lucro_total: "",
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
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [administrador, setAdministrador] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  async function carregarDados() {
    setCarregandoDados(true);

    try {
      const { data: sessao } = await supabase.auth.getSession();
      const email = sessao.session?.user.email;

      if (email) {
        const { data: perfilAtual } = await supabase
          .from("perfis_usuarios")
          .select("perfil")
          .eq("email", email)
          .eq("ativo", true)
          .single();

        setAdministrador(
          normalizarTexto(perfilAtual?.perfil) === "administrador"
        );
      } else {
        setAdministrador(false);
      }

      const [clientesResp, produtosResp, pedidosResp] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, razao_social, condicao_pagamento_padrao")
          .order("razao_social"),

        supabase
          .from("produtos")
          .select(
            "id, nome, preco, preco_custo, fornecedor_id, comissao_percentual, fornecedores(nome)"
          )
          .order("nome"),

        supabase
          .from("pedidos")
          .select(
            `
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
            pedido_itens(*)
          `
          )
          .order("created_at", { ascending: false }),
      ]);

      if (clientesResp.error) throw clientesResp.error;
      if (produtosResp.error) throw produtosResp.error;
      if (pedidosResp.error) throw pedidosResp.error;

      const produtosComFornecedor = (produtosResp.data || []).map(
        (produto: any) => ({
          ...produto,
          fornecedor_nome: produto?.fornecedores?.nome || null,
        })
      );

      setClientes(clientesResp.data || []);
      setProdutos(produtosComFornecedor);
      setPedidos(pedidosResp.data || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);

      if (erroDeConexao(error)) {
        alert(
          "Falha de conexão. Verifique sua internet e tente carregar novamente."
        );
      } else {
        alert(error?.message || "Erro ao carregar dados.");
      }
    } finally {
      setCarregandoDados(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function recalcularItem(item: ItemPedido) {
    const quantidade = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor_unitario || 0);
    const valorCustoUnitario = Number(item.valor_custo_unitario || 0);
    const comissao = Number(item.comissao_percentual || 0);

    const valorTotal = quantidade * valorUnitario;
    const valorCustoTotal = quantidade * valorCustoUnitario;
    const valorComissao = valorTotal * (comissao / 100);
    const lucroUnitario = valorUnitario - valorCustoUnitario;
    const lucroTotal = valorTotal - valorCustoTotal;

    return {
      ...item,
      valor_total: String(valorTotal),
      valor_comissao: String(valorComissao),
      valor_custo_total: String(valorCustoTotal),
      lucro_unitario: String(lucroUnitario),
      lucro_total: String(lucroTotal),
    };
  }

  function selecionarCliente(clienteId: string) {
    const cliente = clientes.find((item) => item.id === clienteId);

    setForm((atual) => ({
      ...atual,
      cliente_id: clienteId,
      condicao_pagamento:
        cliente?.condicao_pagamento_padrao ||
        atual.condicao_pagamento ||
        "A combinar",
    }));
  }

  function selecionarProduto(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId);

    const novoItem = recalcularItem({
      ...itemAtual,
      produto_id: produtoId,
      produto_nome: produto?.nome || "",
      fornecedor_id: produto?.fornecedor_id || null,
      valor_unitario: String(produto?.preco || ""),
      valor_custo_unitario: String(produto?.preco_custo || ""),
      comissao_percentual: String(produto?.comissao_percentual || ""),
    });

    setItemAtual(novoItem);
  }

  function atualizarItemAtual(campo: keyof ItemPedido, valor: string) {
    const novoItem = recalcularItem({
      ...itemAtual,
      [campo]: valor,
    });

    setItemAtual(novoItem);
  }

  function adicionarItem() {
    if (!itemAtual.produto_id) return alert("Selecione um produto.");
    if (!itemAtual.quantidade) return alert("Informe a quantidade.");

    if (Number(itemAtual.quantidade) <= 0) {
      return alert("A quantidade precisa ser maior que zero.");
    }

    setItens([...itens, itemAtual]);
    setItemAtual(itemInicial);
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  const valorTotalPedido = useMemo(() => {
    return itens.reduce(
      (total, item) => total + Number(item.valor_total || 0),
      0
    );
  }, [itens]);

  const valorTotalComissao = useMemo(() => {
    return itens.reduce(
      (total, item) => total + Number(item.valor_comissao || 0),
      0
    );
  }, [itens]);

  const valorCustoTotalPedido = useMemo(() => {
    return itens.reduce(
      (total, item) => total + Number(item.valor_custo_total || 0),
      0
    );
  }, [itens]);

  const lucroTotalPedido = useMemo(() => {
    return itens.reduce(
      (total, item) => total + Number(item.lucro_total || 0),
      0
    );
  }, [itens]);

  const planoPagamento = useMemo(() => {
    const dataBase =
      form.data_entrega_prevista || form.data_pedido || hojeISO();

    return gerarPlanoPagamento(
      valorTotalPedido,
      dataBase,
      form.condicao_pagamento
    );
  }, [
    form.condicao_pagamento,
    form.data_entrega_prevista,
    form.data_pedido,
    valorTotalPedido,
  ]);

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [
        pedido.numero,
        pedido.clientes?.razao_social,
        pedido.status,
        pedido.tipo,
        pedido.condicao_pagamento,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  function montarPedidoPayload() {
    return {
      cliente_id: form.cliente_id,
      data_pedido: form.data_pedido,
      data_entrega_prevista: form.data_entrega_prevista || null,
      data_entrega_real: form.data_entrega_real || null,
      tipo: form.tipo,
      status: form.status,
      condicao_pagamento: form.condicao_pagamento || "A combinar",
      observacoes: form.observacoes,
      valor_total: valorTotalPedido,
      valor_comissao: valorTotalComissao,
      valor_custo_total: valorCustoTotalPedido,
      lucro_total: lucroTotalPedido,
    };
  }

  function montarItensPayload() {
    return itens.map((item) => ({
      produto_id: item.produto_id,
      produto_nome: item.produto_nome,
      fornecedor_id: item.fornecedor_id || null,
      quantidade: Number(item.quantidade || 0),
      valor_unitario: Number(item.valor_unitario || 0),
      valor_total: Number(item.valor_total || 0),
      comissao_percentual: Number(item.comissao_percentual || 0),
      valor_comissao: Number(item.valor_comissao || 0),
      valor_custo_unitario: Number(item.valor_custo_unitario || 0),
      valor_custo_total: Number(item.valor_custo_total || 0),
      lucro_unitario: Number(item.lucro_unitario || 0),
      lucro_total: Number(item.lucro_total || 0),
    }));
  }

  function limparFormulario() {
    setForm({
      ...pedidoInicial,
      data_pedido: hojeISO(),
      numero: "",
    });

    setItens([]);
    setItemAtual(itemInicial);
    idempotencyKeyRef.current = null;
  }

  function agruparCustoPorFornecedor(itensFinanceiro: any[]) {
    const mapa = new Map<
      string,
      { fornecedor_id: string | null; fornecedor_nome: string; valor: number }
    >();

    for (const item of itensFinanceiro || []) {
      const produto = produtos.find((p) => p.id === item.produto_id);

      const fornecedorId = item.fornecedor_id || produto?.fornecedor_id || null;
      const fornecedorNome =
        produto?.fornecedor_nome ||
        produto?.fornecedores?.nome ||
        (fornecedorId ? "Fornecedor vinculado" : "Compra própria");

      const chave = fornecedorId || fornecedorNome || "sem-fornecedor";
      const valorAtual = mapa.get(chave)?.valor || 0;
      const valorItem = Number(item.valor_custo_total || 0);

      mapa.set(chave, {
        fornecedor_id: fornecedorId,
        fornecedor_nome: fornecedorNome,
        valor: valorAtual + valorItem,
      });
    }

    return Array.from(mapa.values()).filter((grupo) => grupo.valor > 0);
  }

  async function salvarPedido() {
    if (carregando) return;

    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (itens.length === 0) return alert("Adicione ao menos um produto.");
    if (!form.data_pedido) return alert("Informe a data do pedido.");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return alert(
        "Você está sem internet. Conecte-se para salvar o pedido."
      );
    }

    setCarregando(true);

    try {
      idempotencyKeyRef.current ||= globalThis.crypto.randomUUID();

      const pedidoPayload = montarPedidoPayload();
      const itensPayload = montarItensPayload();
      const geraFinanceiro = statusGeraFinanceiro(form.status);
      const venda = tipoGeraFinanceiroVenda(form.tipo);
      const contasReceber = geraFinanceiro && venda
        ? planoPagamento.parcelas.map((parcela) => ({
            numero: parcela.numero,
            total_parcelas: parcela.totalParcelas,
            prazo_dias: parcela.prazoDias,
            vencimento: parcela.vencimento,
            valor: parcela.valor,
          }))
        : [];
      const contasPagar = geraFinanceiro && venda
        ? agruparCustoPorFornecedor(itensPayload)
        : [];

      const resultado = await criarPedidoCompleto({
        idempotencyKey: idempotencyKeyRef.current,
        pedido: pedidoPayload,
        itens: itensPayload,
        contasReceber,
        contasPagar,
      });

      alert(`Pedido ${resultado.numero} salvo com sucesso.`);

      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);

      if (erroDeConexao(error)) {
        alert(
          "Falha de conexão. O pedido NÃO foi salvo. Verifique sua internet e tente novamente."
        );
        return;
      }

      alert(error?.message || "Erro inesperado ao salvar pedido.");
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarCancelamento(pedido: any) {
    if (normalizarTexto(pedido.status) === "cancelado") return;

    const motivo = prompt(
      `Informe o motivo do cancelamento do pedido ${pedido.numero || ""}:`
    );
    if (motivo === null) return;
    if (motivo.trim().length < 5) {
      return alert("Informe um motivo com pelo menos 5 caracteres.");
    }
    if (!confirm("Confirmar o cancelamento? O histórico será preservado.")) {
      return;
    }

    setCancelandoId(pedido.id);
    try {
      const resultado = await cancelarPedido(pedido.id, motivo.trim());
      alert(`Pedido ${resultado.numero} cancelado com sucesso.`);
      await carregarDados();
    } catch (error: any) {
      alert(error?.message || "Erro ao cancelar pedido.");
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pedidos" subtitulo="ERP Comercial" />

          <div className="p-8">
            {carregandoDados && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                Carregando dados do sistema...
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
              <strong>Salvamento online ativo.</strong> Os pedidos não serão
              mais salvos offline. Para salvar pedidos, é necessário estar
              conectado à internet.
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card titulo="Pedidos" valor={pedidos.length} />
              <Card titulo="Filtrados" valor={pedidosFiltrados.length} />
              <Card titulo="Total venda" valor={formatarMoeda(valorTotalPedido)} />
              <Card titulo="Custo" valor={formatarMoeda(valorCustoTotalPedido)} />
              <Card titulo="Lucro" valor={formatarMoeda(lucroTotalPedido)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Novo pedido
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Revenda, Revenda Própria e Venda direta geram contas a
                    receber e contas a pagar automaticamente quando o status não
                    for Orçamento.
                  </p>
                </div>

                <span className="text-sm text-slate-500">
                  O número será gerado ao salvar.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  value={form.cliente_id}
                  onChange={(e) => selecionarCliente(e.target.value)}
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
                  placeholder="Gerado automaticamente ao salvar"
                  value={form.numero}
                  readOnly
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
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
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Representação</option>
                  <option>Revenda</option>
                  <option>Revenda Própria</option>
                  <option>Venda direta</option>
                  <option>Venda própria</option>
                  <option>Orçamento</option>
                </select>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Orçamento</option>
                  <option>Pedido</option>
                  <option>Aprovado</option>
                  <option>Faturado</option>
                  <option>Entregue</option>
                  <option>Cancelado</option>
                </select>

                <input
                  type="date"
                  value={form.data_entrega_prevista}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      data_entrega_prevista: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                  title="Previsão de entrega"
                />

                <input
                  type="date"
                  value={form.data_entrega_real}
                  onChange={(e) =>
                    setForm({ ...form, data_entrega_real: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                  title="Entrega real"
                />

                <input
                  placeholder="Condição de pagamento. Ex: Boleto 30/45/60 dias"
                  value={form.condicao_pagamento}
                  onChange={(e) =>
                    setForm({ ...form, condicao_pagamento: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
                />

                {tipoGeraFinanceiroVenda(form.tipo) && valorTotalPedido > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-4">
                    <p className="text-sm font-bold text-blue-900">
                      Parcelas previstas
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {planoPagamento.parcelas.map((parcela) => (
                        <span
                          key={`${parcela.numero}-${parcela.vencimento}`}
                          className="rounded-lg bg-white px-3 py-2 text-sm text-blue-900 shadow-sm"
                        >
                          {parcela.numero}/{parcela.totalParcelas}:{" "}
                          {formatarMoeda(parcela.valor)} em{" "}
                          {formatarData(parcela.vencimento)}
                        </span>
                      ))}
                    </div>
                    {planoPagamento.aviso && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        {planoPagamento.aviso}
                      </p>
                    )}
                  </div>
                )}

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
                Produtos do pedido
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
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

                <input
                  type="number"
                  placeholder="Quantidade"
                  value={itemAtual.quantidade}
                  onChange={(e) =>
                    atualizarItemAtual("quantidade", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Valor unitário"
                  value={itemAtual.valor_unitario}
                  onChange={(e) =>
                    atualizarItemAtual("valor_unitario", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Comissão %"
                  value={itemAtual.comissao_percentual}
                  onChange={(e) =>
                    atualizarItemAtual("comissao_percentual", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <button
                  onClick={adicionarItem}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white"
                >
                  Adicionar
                </button>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Qtd</th>
                      <th className="px-4 py-3">Unitário</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Custo</th>
                      <th className="px-4 py-3">Lucro</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item, index) => (
                      <tr key={`${item.produto_id}-${index}`}>
                        <td className="px-4 py-4 font-semibold">
                          {item.produto_nome}
                        </td>
                        <td className="px-4 py-4">{item.quantidade}</td>
                        <td className="px-4 py-4">
                          {formatarMoeda(item.valor_unitario)}
                        </td>
                        <td className="px-4 py-4">
                          {formatarMoeda(item.valor_total)}
                        </td>
                        <td className="px-4 py-4 text-red-700">
                          {formatarMoeda(item.valor_custo_total)}
                        </td>
                        <td className="px-4 py-4 text-blue-700">
                          {formatarMoeda(item.lucro_total)}
                        </td>
                        <td className="px-4 py-4 text-green-700">
                          {formatarMoeda(item.valor_comissao)}
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
                          Nenhum produto adicionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t pt-5 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Total do pedido</p>
                  <strong className="text-2xl text-slate-900">
                    {formatarMoeda(valorTotalPedido)}
                  </strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Custo total</p>
                  <strong className="text-2xl text-red-700">
                    {formatarMoeda(valorCustoTotalPedido)}
                  </strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Lucro previsto</p>
                  <strong className="text-2xl text-blue-700">
                    {formatarMoeda(lucroTotalPedido)}
                  </strong>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Comissão prevista</p>
                  <strong className="text-2xl text-green-700">
                    {formatarMoeda(valorTotalComissao)}
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  onClick={salvarPedido}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {carregando ? "Salvando..." : "Salvar pedido"}
                </button>

                <button
                  onClick={limparFormulario}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  Pedidos cadastrados
                </h3>

                <input
                  placeholder="Pesquisar pedido..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 md:max-w-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id} className="rounded-xl border p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          Pedido {pedido.numero || "-"}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          Cliente: {pedido.clientes?.razao_social || "-"}
                        </p>

                        <p className="text-sm text-slate-500">
                          Data: {formatarData(pedido.data_pedido)}
                        </p>

                        <p className="text-sm text-slate-500">
                          Previsão entrega:{" "}
                          {formatarData(pedido.data_entrega_prevista)}
                        </p>

                        <p className="text-sm text-slate-500">
                          Tipo: {pedido.tipo || "-"}
                        </p>

                        <p className="text-sm text-slate-500">
                          Condição: {pedido.condicao_pagamento || "A combinar"}
                        </p>

                        <p className="mt-2 text-lg font-bold text-blue-700">
                          {formatarMoeda(pedido.valor_total)}
                        </p>

                        {tipoGeraFinanceiroVenda(pedido.tipo) && (
                          <>
                            <p className="text-sm font-semibold text-red-700">
                              Custo: {formatarMoeda(pedido.valor_custo_total)}
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                              Lucro: {formatarMoeda(pedido.lucro_total)}
                            </p>
                          </>
                        )}

                        <p className="text-sm font-semibold text-green-700">
                          Comissão: {formatarMoeda(pedido.valor_comissao)}
                        </p>

                        {pedido.motivo_cancelamento && (
                          <p className="mt-2 text-sm font-semibold text-red-700">
                            Motivo do cancelamento: {pedido.motivo_cancelamento}
                          </p>
                        )}
                      </div>

                      <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {pedido.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => gerarPedidoPDF(pedido)}
                        className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700"
                      >
                        PDF
                      </button>

                      {administrador && (
                        <button
                          onClick={() => solicitarCancelamento(pedido)}
                          disabled={
                            cancelandoId === pedido.id ||
                            normalizarTexto(pedido.status) === "cancelado"
                          }
                          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelandoId === pedido.id
                            ? "Cancelando..."
                            : normalizarTexto(pedido.status) === "cancelado"
                              ? "Cancelado"
                              : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {pedidosFiltrados.length === 0 && (
                  <div className="rounded-xl border p-8 text-center text-slate-500">
                    Nenhum pedido encontrado.
                  </div>
                )}
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
