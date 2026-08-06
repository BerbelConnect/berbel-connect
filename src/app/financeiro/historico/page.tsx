"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { dataIsoBrasil } from "@/lib/dataBrasil";

type Movimento = {
  id: string;
  entidade: "contas_receber" | "contas_pagar" | "comissoes_financeiro";
  registro_id: string;
  pedido_id: string | null;
  operacao: string;
  status_anterior: string | null;
  status_novo: string;
  data_movimento: string;
  forma_pagamento: string | null;
  motivo: string;
  valor: number | null;
  usuario_email: string | null;
  created_at: string;
};

const rotulosEntidade: Record<Movimento["entidade"], string> = {
  contas_receber: "Conta a receber",
  contas_pagar: "Conta a pagar",
  comissoes_financeiro: "Comissão",
};

function moeda(valor: number | null) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBrasil(valor?: string | null, incluirHora = false) {
  if (!valor) return "-";

  const data = incluirHora
    ? new Date(valor)
    : new Date(`${valor.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(data.getTime())) return valor;

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    ...(incluirHora ? { timeStyle: "short" } : {}),
  });
}

function csvCampo(valor: unknown) {
  return `"${String(valor ?? "").replaceAll('"', '""')}"`;
}

export default function HistoricoFinanceiroPage() {
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [busca, setBusca] = useState("");
  const [entidade, setEntidade] = useState("todos");
  const [operacao, setOperacao] = useState("todas");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarHistorico() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("movimentacoes_financeiras_auditoria")
      .select(
        "id, entidade, registro_id, pedido_id, operacao, status_anterior, status_novo, data_movimento, forma_pagamento, motivo, valor, usuario_email, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErro(error.message);
      setMovimentos([]);
    } else {
      setMovimentos((data || []) as Movimento[]);
    }

    setCarregando(false);
  }

  useEffect(() => {
    const carregamento = window.setTimeout(() => {
      void carregarHistorico();
    }, 0);

    return () => window.clearTimeout(carregamento);
  }, []);

  const filtrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return movimentos.filter((item) => {
      if (entidade !== "todos" && item.entidade !== entidade) return false;
      if (operacao !== "todas" && item.operacao !== operacao) return false;
      if (dataInicial && item.data_movimento < dataInicial) return false;
      if (dataFinal && item.data_movimento > dataFinal) return false;

      if (!texto) return true;

      return [
        rotulosEntidade[item.entidade],
        item.operacao,
        item.status_anterior,
        item.status_novo,
        item.forma_pagamento,
        item.motivo,
        item.usuario_email,
        item.pedido_id,
        item.registro_id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [movimentos, busca, entidade, operacao, dataInicial, dataFinal]);

  const totalMovimentado = filtrados.reduce(
    (soma, item) => soma + Number(item.valor || 0),
    0
  );

  const usuarios = new Set(
    filtrados.map((item) => item.usuario_email).filter(Boolean)
  ).size;

  function limparFiltros() {
    setBusca("");
    setEntidade("todos");
    setOperacao("todas");
    setDataInicial("");
    setDataFinal("");
  }

  function exportarCsv() {
    const cabecalho = [
      "Tipo",
      "Operação",
      "Data da movimentação",
      "Valor",
      "Status anterior",
      "Status novo",
      "Forma de pagamento",
      "Motivo",
      "Usuário",
      "Registrado em",
      "Pedido ID",
      "Registro ID",
    ];

    const linhas = filtrados.map((item) => [
      rotulosEntidade[item.entidade],
      item.operacao,
      item.data_movimento,
      Number(item.valor || 0).toFixed(2),
      item.status_anterior || "",
      item.status_novo,
      item.forma_pagamento || "",
      item.motivo,
      item.usuario_email || "",
      item.created_at,
      item.pedido_id || "",
      item.registro_id,
    ]);

    const conteudo = [cabecalho, ...linhas]
      .map((linha) => linha.map(csvCampo).join(";"))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${conteudo}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-financeiro-${dataIsoBrasil()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <PageHeader
            titulo="Histórico Financeiro"
            subtitulo="Auditoria das baixas realizadas"
          />

          <div className="p-4 pt-20 lg:p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card titulo="Movimentações filtradas" valor={filtrados.length} />
              <Card titulo="Valor movimentado" valor={moeda(totalMovimentado)} />
              <Card titulo="Usuários responsáveis" valor={usuarios} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 xl:flex-row">
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Pesquisar motivo, usuário, status ou identificação..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={entidade}
                  onChange={(event) => setEntidade(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="contas_receber">Contas a receber</option>
                  <option value="contas_pagar">Contas a pagar</option>
                  <option value="comissoes_financeiro">Comissões</option>
                </select>

                <select
                  value={operacao}
                  onChange={(event) => setOperacao(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="todas">Todas as operações</option>
                  <option value="Baixa">Baixas</option>
                  <option value="Estorno">Estornos</option>
                </select>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  De
                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(event) => setDataInicial(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-3"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Até
                  <input
                    type="date"
                    value={dataFinal}
                    onChange={(event) => setDataFinal(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-3"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
                >
                  Limpar filtros
                </button>
                <button
                  type="button"
                  onClick={exportarCsv}
                  disabled={filtrados.length === 0}
                  className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={carregarHistorico}
                  className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
                >
                  Atualizar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Registro das movimentações
              </h3>

              {erro && (
                <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
                  Não foi possível carregar o histórico: {erro}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Operação</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Alteração</th>
                      <th className="px-4 py-3">Forma</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3">Registrado em</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {rotulosEntidade[item.entidade]}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.operacao === "Estorno"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.operacao}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {dataBrasil(item.data_movimento)}
                        </td>
                        <td className="px-4 py-4 font-bold text-blue-700">
                          {moeda(item.valor)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-500">
                            {item.status_anterior || "-"}
                          </span>
                          <span className="px-2">→</span>
                          <span className="font-semibold text-green-700">
                            {item.status_novo}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {item.forma_pagamento || "-"}
                        </td>
                        <td className="max-w-xs px-4 py-4">{item.motivo}</td>
                        <td className="px-4 py-4">
                          {item.usuario_email || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {dataBrasil(item.created_at, true)}
                        </td>
                      </tr>
                    ))}

                    {!carregando && filtrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Nenhuma movimentação encontrada.
                        </td>
                      </tr>
                    )}

                    {carregando && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Carregando histórico...
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

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}
