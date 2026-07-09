"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { gerarPedidoPDF } from "@/lib/pdf/pedidoPdf";

const statusOpcoes = [
  "Todos",
  "Orçamento",
  "Pedido",
  "Em produção",
  "Faturado",
  "Entregue",
  "Cancelado",
];

const tipoOpcoes = ["Todos", "Representação", "Revenda Própria", "Misto"];

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function statusClasse(status: string) {
  if (status === "Entregue") return "bg-green-100 text-green-700";
  if (status === "Faturado") return "bg-blue-100 text-blue-700";
  if (status === "Em produção") return "bg-orange-100 text-orange-700";
  if (status === "Cancelado") return "bg-red-100 text-red-700";
  if (status === "Pedido") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-700";
}

function dataBR(data?: string | null) {
  if (!data) return "-";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function ConsultaPedidosPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todos");
  const [editando, setEditando] = useState<any | null>(null);

  async function carregarDados() {
    const clientesResp = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

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
    if (pedidosResp.error) return alert(pedidosResp.error.message);

    setClientes(clientesResp.data || []);
    setPedidos(pedidosResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function alterarStatus(pedido: any, status: string) {
    const payload: any = { status };

    if (status === "Entregue" && !pedido.data_entrega_real) {
      payload.data_entrega_real = hojeISO();
    }

    const { error } = await supabase
      .from("pedidos")
      .update(payload)
      .eq("id", pedido.id);

    if (error) return alert(error.message);

    carregarDados();
  }

  function abrirEdicao(pedido: any) {
    setEditando({
      id: pedido.id,
      cliente_id: pedido.cliente_id || "",
      numero: pedido.numero || "",
      data_pedido: pedido.data_pedido || hojeISO(),
      data_entrega_prevista: pedido.data_entrega_prevista || "",
      data_entrega_real: pedido.data_entrega_real || "",
      status: pedido.status || "Pedido",
      tipo_operacao: pedido.tipo_operacao || "Representação",
      observacoes: pedido.observacoes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarEdicao() {
    if (!editando?.id) return;
    if (!editando.cliente_id) return alert("Selecione o cliente.");

    const { error } = await supabase
      .from("pedidos")
      .update({
        cliente_id: editando.cliente_id,
        numero: editando.numero,
        data_pedido: editando.data_pedido,
        data_entrega_prevista: editando.data_entrega_prevista || null,
        data_entrega_real: editando.data_entrega_real || null,
        status: editando.status,
        tipo_operacao: editando.tipo_operacao,
        observacoes: editando.observacoes,
      })
      .eq("id", editando.id);

    if (error) return alert(error.message);

    setEditando(null);
    carregarDados();
    alert("Pedido atualizado com sucesso.");
  }
    function enviarWhatsApp(pedido: any) {
    const numero = pedido.clientes?.whatsapp?.replace(/\D/g, "");

    if (!numero) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }

    const itensTexto =
      pedido.pedido_itens
        ?.map(
          (item: any, index: number) =>
            `${index + 1}. ${
              item.produto_nome || item.produtos?.nome || "-"
            } | ${item.representada_nome || "-"} | Qtd: ${
              item.quantidade
            } | Total: ${moeda(item.valor_total)}`
        )
        .join("\n") || "-";

    const mensagem = `
Olá ${pedido.clientes?.razao_social || ""}, tudo bem?

Segue o resumo do pedido ${pedido.numero || pedido.id}.

Status: ${pedido.status || "-"}
Tipo: ${pedido.tipo_operacao || "-"}
Previsão de entrega: ${dataBR(pedido.data_entrega_prevista)}
Valor total: ${moeda(pedido.valor_total)}

Itens:
${itensTexto}

Qualquer dúvida estou à disposição.

Marcelo Henrique Berbel
Berbel Connect
`;

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  async function duplicarPedido(pedido: any) {
    if (!confirm(`Deseja duplicar o pedido ${pedido.numero || pedido.id}?`)) {
      return;
    }

    const { data: novoNumero } = await supabase.rpc("gerar_numero_pedido");

    const { data: pedidoCriado, error: erroPedido } = await supabase
      .from("pedidos")
      .insert({
        cliente_id: pedido.cliente_id,
        numero: novoNumero || `PED-${Date.now()}`,
        data_pedido: hojeISO(),
        data_entrega_prevista: pedido.data_entrega_prevista || null,
        data_entrega_real: null,
        status: "Orçamento",
        observacoes: pedido.observacoes || "",
        tipo_operacao: pedido.tipo_operacao || "Representação",
        valor_total: Number(pedido.valor_total || 0),
        valor_comissao: Number(pedido.valor_comissao || 0),
        quantidade: Number(pedido.quantidade || 0),
        valor_unitario: 0,
      })
      .select()
      .single();

    if (erroPedido) return alert(erroPedido.message);

    const itens = pedido.pedido_itens || [];

    if (itens.length > 0) {
      const itensPayload = itens.map((item: any) => ({
        pedido_id: pedidoCriado.id,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome || item.produtos?.nome || "",
        representada_id: item.representada_id || null,
        representada_nome:
          item.representada_nome || item.representadas?.nome_fantasia || "",
        modelo_negocio: item.modelo_negocio || "Representação",
        quantidade: Number(item.quantidade || 0),
        valor_unitario: Number(item.valor_unitario || 0),
        preco_custo: Number(item.preco_custo || 0),
        valor_total: Number(item.valor_total || 0),
        comissao_percentual: Number(item.comissao_percentual || 0),
        valor_comissao: Number(item.valor_comissao || 0),
        lucro_previsto: Number(item.lucro_previsto || 0),
      }));

      await supabase.from("pedido_itens").insert(itensPayload);
    }

    carregarDados();
    alert(`Pedido duplicado com sucesso: ${novoNumero}`);
  }

  async function excluirPedido(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este pedido?")) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    const hoje = hojeISO();
    const agora = new Date();

    return pedidos.filter((pedido) => {
      const dataPedido = pedido.data_pedido || pedido.created_at?.slice(0, 10);

      const bateBusca = [
        pedido.numero,
        pedido.clientes?.razao_social,
        pedido.clientes?.cnpj,
        pedido.clientes?.bairro,
        pedido.clientes?.cidade,
        pedido.status,
        pedido.tipo_operacao,
        pedido.pedido_itens
          ?.map(
            (item: any) =>
              `${item.produto_nome || ""} ${item.representada_nome || ""}`
          )
          .join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);

      const bateStatus =
        filtroStatus === "Todos" || pedido.status === filtroStatus;

      const bateTipo =
        filtroTipo === "Todos" || pedido.tipo_operacao === filtroTipo;

      let batePeriodo = true;

      if (filtroPeriodo === "Hoje") {
        batePeriodo = dataPedido === hoje;
      }

      if (filtroPeriodo === "Este mês") {
        const data = new Date(dataPedido);
        batePeriodo =
          data.getMonth() === agora.getMonth() &&
          data.getFullYear() === agora.getFullYear();
      }

      if (filtroPeriodo === "Este ano") {
        const data = new Date(dataPedido);
        batePeriodo = data.getFullYear() === agora.getFullYear();
      }

      return bateBusca && bateStatus && bateTipo && batePeriodo;
    });
  }, [pedidos, busca, filtroStatus, filtroTipo, filtroPeriodo]);

  const totalPedidos = pedidosFiltrados.reduce(
    (total, pedido) => total + Number(pedido.valor_total || 0),
    0
  );

  const totalComissao = pedidosFiltrados.reduce(
    (total, pedido) => total + Number(pedido.valor_comissao || 0),
    0
  );

  const pedidosRepresentacao = pedidosFiltrados.filter(
    (pedido) => pedido.tipo_operacao === "Representação"
  ).length;

  const pedidosRevenda = pedidosFiltrados.filter(
    (pedido) => pedido.tipo_operacao === "Revenda Própria"
  ).length;

  const pedidosProducao = pedidosFiltrados.filter(
    (pedido) => pedido.status === "Em produção"
  ).length;

  const pedidosEntregues = pedidosFiltrados.filter(
    (pedido) => pedido.status === "Entregue"
  ).length;

  const pedidosAtrasados = pedidosFiltrados.filter(
    (pedido) =>
      pedido.data_entrega_prevista &&
      pedido.data_entrega_prevista < hojeISO() &&
      pedido.status !== "Entregue" &&
      pedido.status !== "Cancelado"
  ).length;
    return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Consulta de Pedidos V3"
            subtitulo="Berbel Connect"
          />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Pedidos" valor={pedidosFiltrados.length} />
              <Card titulo="Total vendido" valor={moeda(totalPedidos)} />
              <Card titulo="Comissão" valor={moeda(totalComissao)} />
              <Card
                titulo="Representação / Revenda"
                valor={`${pedidosRepresentacao} / ${pedidosRevenda}`}
              />
              <Card titulo="Em produção" valor={pedidosProducao} />
              <Card titulo="Entregues" valor={pedidosEntregues} />
              <Card titulo="Atrasados" valor={pedidosAtrasados} />
            </div>

            {editando && (
              <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Editar pedido {editando.numero}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <select
                    value={editando.cliente_id}
                    onChange={(e) =>
                      setEditando({ ...editando, cliente_id: e.target.value })
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
                    value={editando.numero}
                    onChange={(e) =>
                      setEditando({ ...editando, numero: e.target.value })
                    }
                    placeholder="Número"
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <input
                    type="date"
                    value={editando.data_pedido}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        data_pedido: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <select
                    value={editando.status}
                    onChange={(e) =>
                      setEditando({ ...editando, status: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    {statusOpcoes
                      .filter((s) => s !== "Todos")
                      .map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                  </select>

                  <select
                    value={editando.tipo_operacao}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        tipo_operacao: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    {tipoOpcoes
                      .filter((t) => t !== "Todos")
                      .map((tipo) => (
                        <option key={tipo}>{tipo}</option>
                      ))}
                  </select>

                  <input
                    type="date"
                    value={editando.data_entrega_prevista}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        data_entrega_prevista: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <input
                    type="date"
                    value={editando.data_entrega_real}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        data_entrega_real: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  />

                  <textarea
                    value={editando.observacoes}
                    onChange={(e) =>
                      setEditando({
                        ...editando,
                        observacoes: e.target.value,
                      })
                    }
                    placeholder="Observações"
                    className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-4"
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Os campos de data acima são: data do pedido, previsão de entrega e entrega real.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={salvarEdicao}
                    className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
                  >
                    Salvar alterações
                  </button>

                  <button
                    onClick={() => setEditando(null)}
                    className="rounded-xl border px-6 py-3 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            )}

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar pedido..."
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  {statusOpcoes.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  {tipoOpcoes.map((tipo) => (
                    <option key={tipo}>{tipo}</option>
                  ))}
                </select>

                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option>Todos</option>
                  <option>Hoje</option>
                  <option>Este mês</option>
                  <option>Este ano</option>
                </select>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Pedidos cadastrados
              </h2>

              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id} className="rounded-2xl border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Pedido {pedido.numero || pedido.id}
                        </h3>

                        <p className="text-sm text-slate-600">
                          Cliente: {pedido.clientes?.razao_social || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          CNPJ: {pedido.clientes?.cnpj || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Endereço: {pedido.clientes?.endereco || "-"},{" "}
                          {pedido.clientes?.numero || "-"} -{" "}
                          {pedido.clientes?.bairro || "-"} -{" "}
                          {pedido.clientes?.cidade || "-"}/
                          {pedido.clientes?.estado || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Telefone: {pedido.clientes?.telefone || "-"} | WhatsApp:{" "}
                          {pedido.clientes?.whatsapp || "-"}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          Tipo: {pedido.tipo_operacao || "-"}
                        </p>

                        <p className="text-sm text-slate-600">
                          Previsão de entrega:{" "}
                          <strong>{dataBR(pedido.data_entrega_prevista)}</strong>
                        </p>

                        <p className="text-sm text-slate-600">
                          Entrega real:{" "}
                          <strong>{dataBR(pedido.data_entrega_real)}</strong>
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasse(
                              pedido.status
                            )}`}
                          >
                            {pedido.status || "-"}
                          </span>

                          <select
                            value={pedido.status || "Orçamento"}
                            onChange={(e) =>
                              alterarStatus(pedido, e.target.value)
                            }
                            className="rounded-lg border px-3 py-2 text-xs"
                          >
                            {statusOpcoes
                              .filter((s) => s !== "Todos")
                              .map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-700">
                          {moeda(pedido.valor_total)}
                        </p>

                        <p className="text-sm font-semibold text-green-700">
                          Comissão: {moeda(pedido.valor_comissao)}
                        </p>

                        <p className="text-xs text-slate-500">
                          Itens: {pedido.pedido_itens?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          setPedidoAberto(
                            pedidoAberto === pedido.id ? null : pedido.id
                          )
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2 text-white"
                      >
                        {pedidoAberto === pedido.id
                          ? "Ocultar itens"
                          : "Ver itens"}
                      </button>

                      <button
                        onClick={() => abrirEdicao(pedido)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-white"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => duplicarPedido(pedido)}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-white"
                      >
                        Duplicar
                      </button>

                      <button
                        onClick={() => gerarPedidoPDF(pedido)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                      >
                        PDF
                      </button>

                      <button
                        onClick={() => enviarWhatsApp(pedido)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                      >
                        WhatsApp
                      </button>

                      <button
                        onClick={() => excluirPedido(pedido.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white"
                      >
                        Excluir
                      </button>
                    </div>

                    {pedidoAberto === pedido.id && (
                      <div className="mt-6 overflow-x-auto">
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
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {pedido.pedido_itens?.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-4 py-4 font-semibold">
                                  {item.produto_nome ||
                                    item.produtos?.nome ||
                                    "-"}
                                </td>
                                <td className="px-4 py-4">
                                  {item.representada_nome ||
                                    item.representadas?.nome_fantasia ||
                                    "-"}
                                </td>
                                <td className="px-4 py-4">
                                  {item.modelo_negocio || "-"}
                                </td>
                                <td className="px-4 py-4">
                                  {item.quantidade}
                                </td>
                                <td className="px-4 py-4">
                                  {moeda(item.valor_unitario)}
                                </td>
                                <td className="px-4 py-4 font-semibold">
                                  {moeda(item.valor_total)}
                                </td>
                                <td className="px-4 py-4 font-semibold text-green-700">
                                  {moeda(item.valor_comissao)}
                                </td>
                              </tr>
                            ))}

                            {(!pedido.pedido_itens ||
                              pedido.pedido_itens.length === 0) && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="px-4 py-8 text-center text-slate-500"
                                >
                                  Nenhum item encontrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
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