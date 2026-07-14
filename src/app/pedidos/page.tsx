"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";
import {
  contarPedidosOffline,
  navegadorOnline,
  salvarPedidoOffline,
} from "@/lib/offline/pedidosOffline";
import {
  listarClientesOffline,
  listarProdutosOffline,
  obterDataAtualizacaoCache,
  salvarClientesOffline,
  salvarProdutosOffline,
} from "@/lib/offline/dadosOffline";

type Cliente = {
  id: string;
  razao_social: string;
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  preco_custo?: number;
  comissao_percentual: number;
};

type ItemPedido = {
  produto_id: string;
  produto_nome: string;
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
  observacoes: string;
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function gerarNumeroLocal() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  const segundo = String(data.getSeconds()).padStart(2, "0");

  return `OFF-${ano}${mes}${dia}-${hora}${minuto}${segundo}`;
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

function formatarDataHora(data?: string | null) {
  if (!data) return "Nunca atualizado";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "Data inválida";
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

function dispositivoMovel() {
  if (typeof navigator === "undefined") return false;

  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

function tipoGeraFinanceiroVenda(tipo?: string | null) {
  return tipo === "Revenda" || tipo === "Venda direta";
}

function statusGeraFinanceiro(status?: string | null) {
  return status !== "Orçamento" && status !== "Cancelado";
}

const pedidoInicial: PedidoForm = {
  cliente_id: "",
  numero: "",
  data_pedido: hojeISO(),
  data_entrega_prevista: "",
  data_entrega_real: "",
  tipo: "Representação",
  status: "Pedido",
  observacoes: "",
};

const itemInicial: ItemPedido = {
  produto_id: "",
  produto_nome: "",
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
  const [carregandoCache, setCarregandoCache] = useState(false);
  const [online, setOnline] = useState(true);
  const [pendentesOffline, setPendentesOffline] = useState(0);
  const [usandoCache, setUsandoCache] = useState(false);
  const [cacheAtualizadoEm, setCacheAtualizadoEm] = useState<string | null>(
    null
  );
    function atualizarPendentesOffline() {
    setOnline(navegadorOnline());
    setPendentesOffline(contarPedidosOffline());
    setCacheAtualizadoEm(obterDataAtualizacaoCache());
  }

  function carregarDadosDoCache() {
    const clientesCache = listarClientesOffline();
    const produtosCache = listarProdutosOffline();

    setClientes(clientesCache);
    setProdutos(produtosCache);
    setUsandoCache(true);
    setCacheAtualizadoEm(obterDataAtualizacaoCache());

    return {
      clientesCache,
      produtosCache,
    };
  }

  async function gerarNovoNumero() {
    if (!navegadorOnline() || dispositivoMovel()) {
      setForm((atual) => ({
        ...atual,
        numero: atual.numero || gerarNumeroLocal(),
      }));
      return;
    }

    try {
      const { count, error } = await supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true });

      if (error) throw error;

      const proximo = String((count || 0) + 1).padStart(6, "0");

      setForm((atual) => ({
        ...atual,
        numero: atual.numero || `PED-${proximo}`,
      }));
    } catch {
      setForm((atual) => ({
        ...atual,
        numero: atual.numero || gerarNumeroLocal(),
      }));
    }
  }

  async function carregarDados() {
    atualizarPendentesOffline();

    if (!navegadorOnline()) {
      carregarDadosDoCache();

      setForm((atual) => ({
        ...atual,
        numero: atual.numero || gerarNumeroLocal(),
      }));

      return;
    }

    try {
      const [clientesResp, produtosResp, pedidosResp] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, razao_social")
          .order("razao_social"),

        supabase
          .from("produtos")
          .select("id, nome, preco, preco_custo, comissao_percentual")
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

      const clientesOnline = clientesResp.data || [];
      const produtosOnline = produtosResp.data || [];

      setClientes(clientesOnline);
      setProdutos(produtosOnline);

      salvarClientesOffline(clientesOnline);
      salvarProdutosOffline(produtosOnline);

      if (!pedidosResp.error) {
        setPedidos(pedidosResp.data || []);
      }

      setUsandoCache(false);
      setCacheAtualizadoEm(obterDataAtualizacaoCache());

      if (!form.numero) {
        await gerarNovoNumero();
      }
    } catch (error) {
      console.error("Erro ao carregar dados online. Usando cache.", error);

      const { clientesCache, produtosCache } = carregarDadosDoCache();

      if (clientesCache.length === 0 || produtosCache.length === 0) {
        alert(
          "Não foi possível carregar dados online e ainda não existe cache offline de clientes/produtos."
        );
      }

      setForm((atual) => ({
        ...atual,
        numero: atual.numero || gerarNumeroLocal(),
      }));
    }
  }

  async function atualizarCacheManual() {
    if (!navegadorOnline()) {
      alert("Você está sem internet. Conecte para atualizar os dados offline.");
      return;
    }

    setCarregandoCache(true);
    await carregarDados();
    setCarregandoCache(false);

    alert("Clientes e produtos atualizados para uso offline.");
  }

  useEffect(() => {
    carregarDados();

    function atualizarStatus() {
      atualizarPendentesOffline();

      if (navegadorOnline()) {
        carregarDados();
      } else {
        carregarDadosDoCache();
      }
    }

    window.addEventListener("online", atualizarStatus);
    window.addEventListener("offline", atualizarStatus);
    window.addEventListener(
      "berbel:pedidos-offline-atualizados",
      atualizarStatus
    );
    window.addEventListener("berbel:dados-offline-atualizados", atualizarStatus);

    return () => {
      window.removeEventListener("online", atualizarStatus);
      window.removeEventListener("offline", atualizarStatus);
      window.removeEventListener(
        "berbel:pedidos-offline-atualizados",
        atualizarStatus
      );
      window.removeEventListener(
        "berbel:dados-offline-atualizados",
        atualizarStatus
      );
    };
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

  function selecionarProduto(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId);

    const novoItem = recalcularItem({
      ...itemAtual,
      produto_id: produtoId,
      produto_nome: produto?.nome || "",
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

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return pedidos.filter((pedido) =>
      [
        pedido.numero,
        pedido.clientes?.razao_social,
        pedido.status,
        pedido.tipo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busca]);

  function montarPedidoPayload() {
    return {
      cliente_id: form.cliente_id,
      numero: form.numero || gerarNumeroLocal(),
      data_pedido: form.data_pedido,
      data_entrega_prevista: form.data_entrega_prevista || null,
      data_entrega_real: form.data_entrega_real || null,
      tipo: form.tipo,
      status: form.status,
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

    setTimeout(() => {
      gerarNovoNumero();
    }, 200);
  }

  function salvarPedidoNoNavegador(motivo?: string) {
    const pedidoPayload = montarPedidoPayload();
    const itensPayload = montarItensPayload();

    salvarPedidoOffline({
      pedido: pedidoPayload,
      itens: itensPayload,
    });

    atualizarPendentesOffline();

    alert(
      motivo ||
        "O pedido foi salvo no navegador e ficará aguardando sincronização."
    );

    limparFormulario();
  }
    async function registrarFinanceiro(pedidoCriado: any) {
    if (!pedidoCriado?.id) return;

    const dataBase =
      form.data_entrega_prevista || form.data_pedido || hojeISO();

    await supabase
      .from("contas_receber")
      .delete()
      .eq("pedido_id", pedidoCriado.id);

    await supabase
      .from("contas_pagar")
      .delete()
      .eq("pedido_id", pedidoCriado.id);

    await supabase
      .from("comissoes_financeiro")
      .delete()
      .eq("pedido_id", pedidoCriado.id);

    if (!statusGeraFinanceiro(form.status)) {
      return;
    }

    if (tipoGeraFinanceiroVenda(form.tipo)) {
      if (valorTotalPedido > 0) {
        await supabase.from("contas_receber").insert({
          pedido_id: pedidoCriado.id,
          cliente_id: form.cliente_id,
          descricao: `Recebimento do pedido ${pedidoCriado.numero || form.numero}`,
          valor: valorTotalPedido,
          data_vencimento: dataBase,
          status: "Em aberto",
        });
      }

      if (valorCustoTotalPedido > 0) {
        await supabase.from("contas_pagar").insert({
          pedido_id: pedidoCriado.id,
          fornecedor_id: null,
          descricao: `Custo de mercadoria do pedido ${
            pedidoCriado.numero || form.numero
          }`,
          valor: valorCustoTotalPedido,
          data_vencimento: dataBase,
          status: "Em aberto",
        });
      }

      return;
    }

    if (form.tipo === "Representação" && valorTotalComissao > 0) {
      await supabase.from("comissoes_financeiro").insert({
        pedido_id: pedidoCriado.id,
        cliente_id: form.cliente_id,
        empresa: form.tipo,
        valor_base: valorTotalPedido,
        valor_comissao: valorTotalComissao,
        data_previsao: dataBase,
        status: "Pendente",
      });
    }
  }

  async function salvarPedido() {
    if (carregando) return;

    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (itens.length === 0) return alert("Adicione ao menos um produto.");
    if (!form.data_pedido) return alert("Informe a data do pedido.");

    if (dispositivoMovel()) {
      setCarregando(true);

      salvarPedidoNoNavegador(
        "Pedido salvo no celular. Depois entre em Pedidos Offline e toque em Sincronizar todos."
      );

      setCarregando(false);
      return;
    }

    if (!navegadorOnline()) {
      setCarregando(true);

      salvarPedidoNoNavegador(
        "Você está sem internet. O pedido foi salvo offline e ficará aguardando sincronização."
      );

      setCarregando(false);
      return;
    }

    setCarregando(true);

    let pedidoCriadoOnline: any = null;

    try {
      const pedidoPayload = montarPedidoPayload();
      const itensPayload = montarItensPayload();

      const { data: pedidoCriado, error: erroPedido } = await supabase
        .from("pedidos")
        .insert(pedidoPayload)
        .select()
        .single();

      if (erroPedido) {
        setCarregando(false);

        if (erroDeConexao(erroPedido)) {
          salvarPedidoNoNavegador(
            "A conexão falhou. O pedido foi salvo offline para sincronizar depois."
          );
          return;
        }

        return alert(erroPedido.message);
      }

      pedidoCriadoOnline = pedidoCriado;

      const itensBanco = itensPayload.map((item) => ({
        ...item,
        pedido_id: pedidoCriado.id,
      }));

      const { error: erroItens } = await supabase
        .from("pedido_itens")
        .insert(itensBanco);

      if (erroItens) {
        setCarregando(false);

        alert(
          "O pedido principal foi salvo, mas houve erro ao salvar os itens. Verifique a consulta de pedidos antes de repetir."
        );
        return;
      }

      try {
        await registrarFinanceiro(pedidoCriado);
      } catch (erroFinanceiro) {
        console.warn(
          "Pedido salvo, mas houve falha no financeiro:",
          erroFinanceiro
        );
      }

      setCarregando(false);

      alert("Pedido salvo com sucesso.");
      limparFormulario();
      carregarDados();
    } catch (error: any) {
      setCarregando(false);

      if (pedidoCriadoOnline?.id) {
        alert(
          "O pedido foi salvo, mas houve falha em alguma etapa complementar. Verifique em Consulta de Pedidos antes de repetir."
        );
        limparFormulario();
        carregarDados();
        return;
      }

      if (erroDeConexao(error)) {
        salvarPedidoNoNavegador(
          "A conexão falhou. O pedido foi salvo offline e será sincronizado depois."
        );
        return;
      }

      alert(error?.message || "Erro inesperado ao salvar pedido.");
    }
  }

  async function excluirPedido(id: string) {
    if (!confirm("Deseja excluir este pedido?")) return;

    await supabase.from("pedido_itens").delete().eq("pedido_id", id);
    await supabase.from("contas_receber").delete().eq("pedido_id", id);
    await supabase.from("contas_pagar").delete().eq("pedido_id", id);
    await supabase.from("comissoes_financeiro").delete().eq("pedido_id", id);

    const { error } = await supabase.from("pedidos").delete().eq("id", id);

    if (error) return alert(error.message);

    carregarDados();
  }
    return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Pedidos" subtitulo="ERP Comercial" />

          <div className="p-8">
            {!online && (
              <div className="mb-6 rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-sm text-yellow-800">
                <strong>Modo offline ativo.</strong> Os pedidos feitos agora
                serão salvos no navegador e sincronizados depois.
              </div>
            )}

            {dispositivoMovel() && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                <strong>Modo celular ativo.</strong> Para evitar travamento, os
                pedidos criados no celular serão salvos primeiro offline.
                Depois sincronize em <strong>Pedidos Offline</strong>.
              </div>
            )}

            {usandoCache && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                <strong>Dados offline carregados.</strong> Clientes e produtos
                estão sendo usados a partir do armazenamento do navegador.
              </div>
            )}

            {(clientes.length === 0 || produtos.length === 0) && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <strong>Atenção:</strong> ainda não há clientes/produtos salvos
                para uso offline. Abra esta tela com internet e clique em
                atualizar dados offline.
              </div>
            )}

            {pendentesOffline > 0 && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                Existem <strong>{pendentesOffline}</strong> pedido(s)
                aguardando sincronização.{" "}
                <Link href="/pedidos/offline" className="font-bold underline">
                  Ver pedidos offline
                </Link>
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card titulo="Pedidos" valor={pedidos.length} />
              <Card titulo="Filtrados" valor={pedidosFiltrados.length} />
              <Card titulo="Clientes cache" valor={clientes.length} />
              <Card titulo="Produtos cache" valor={produtos.length} />
              <Card titulo="Offline" valor={pendentesOffline} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Dados para uso offline
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Última atualização:{" "}
                    <strong>{formatarDataHora(cacheAtualizadoEm)}</strong>
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <button
                    onClick={atualizarCacheManual}
                    disabled={carregandoCache}
                    className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {carregandoCache
                      ? "Atualizando..."
                      : "Atualizar dados offline"}
                  </button>

                  <Link
                    href="/pedidos/offline"
                    className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold"
                  >
                    Pedidos offline
                  </Link>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Novo pedido
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Revenda e Venda direta geram contas a receber e a pagar
                    automaticamente quando o status não for Orçamento.
                  </p>
                </div>

                <button
                  onClick={gerarNovoNumero}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold"
                >
                  Gerar número
                </button>
              </div>

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
                  onChange={(e) =>
                    setForm({ ...form, numero: e.target.value })
                  }
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
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Representação</option>
                  <option>Revenda</option>
                  <option>Venda direta</option>
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
                        <td className="px-4 py-4">
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
                  {carregando
                    ? "Salvando..."
                    : dispositivoMovel()
                    ? "Salvar no celular"
                    : online
                    ? "Salvar pedido"
                    : "Salvar offline"}
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

                      <button
                        onClick={() => excluirPedido(pedido.id)}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
                      >
                        Excluir
                      </button>
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