"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import {
  conciliarMovimento,
  desfazerConciliacao,
} from "@/lib/financeiro/conciliacao";

type Movimento = {
  id: string;
  entidade: string;
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

type Conciliacao = {
  movimento_id: string;
  status: "Conciliado" | "Desfeito";
  data_conciliacao: string;
  referencia: string;
  observacoes: string | null;
  usuario_email: string | null;
};

const moeda = (valor: number | null) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const hoje = () => new Date().toISOString().slice(0, 10);

export default function ConciliacaoFinanceiraPage() {
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"Todos" | "Pendentes" | "Conciliados">(
    "Pendentes",
  );
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [movimentosResult, conciliacoesResult] = await Promise.all([
      supabase
        .from("movimentacoes_financeiras_auditoria")
        .select("*")
        .eq("operacao", "Baixa")
        .order("created_at", { ascending: false }),
      supabase
        .from("conciliacoes_financeiras")
        .select(
          "movimento_id,status,data_conciliacao,referencia,observacoes,usuario_email",
        ),
    ]);

    if (movimentosResult.error) {
      alert(movimentosResult.error.message);
    } else {
      setMovimentos((movimentosResult.data || []) as Movimento[]);
    }

    if (conciliacoesResult.error) {
      alert(conciliacoesResult.error.message);
    } else {
      setConciliacoes((conciliacoesResult.data || []) as Conciliacao[]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const conciliacaoPorMovimento = useMemo(
    () => new Map(conciliacoes.map((item) => [item.movimento_id, item])),
    [conciliacoes],
  );

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return movimentos.filter((movimento) => {
      const conciliacao = conciliacaoPorMovimento.get(movimento.id);
      const conciliado = conciliacao?.status === "Conciliado";
      if (filtro === "Pendentes" && conciliado) return false;
      if (filtro === "Conciliados" && !conciliado) return false;

      if (!termo) return true;
      return [
        movimento.entidade,
        movimento.pedido_id,
        movimento.motivo,
        movimento.usuario_email,
        conciliacao?.referencia,
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo));
    });
  }, [busca, conciliacaoPorMovimento, filtro, movimentos]);

  const totalConciliado = useMemo(
    () =>
      movimentos.reduce((total, movimento) => {
        const item = conciliacaoPorMovimento.get(movimento.id);
        return item?.status === "Conciliado"
          ? total + Number(movimento.valor || 0)
          : total;
      }, 0),
    [conciliacaoPorMovimento, movimentos],
  );

  async function conciliar(movimento: Movimento) {
    const data = prompt("Data da conciliação (AAAA-MM-DD)", hoje());
    if (data === null) return;
    const referencia = prompt("Referência do extrato bancário");
    if (referencia === null) return;
    const observacoes = prompt("Observações (opcional)", "") ?? "";

    try {
      await conciliarMovimento({
        movimentoId: movimento.id,
        data,
        referencia,
        observacoes,
      });
      alert("Movimento conciliado com sucesso.");
      carregar();
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : "Não foi possível conciliar.");
    }
  }

  async function desfazer(movimento: Movimento) {
    const motivo = prompt("Motivo para desfazer a conciliação");
    if (motivo === null) return;

    try {
      await desfazerConciliacao({ movimentoId: movimento.id, motivo });
      alert("Conciliação desfeita com sucesso.");
      carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível desfazer a conciliação.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-[220px]">
        <PageHeader
          title="Conciliação Financeira"
          subtitle="Conferência das baixas com o extrato bancário"
        />

        <div className="space-y-5 p-6">
          <section className="grid gap-4 md:grid-cols-3">
            <Card titulo="Baixas auditadas" valor={movimentos.length} />
            <Card
              titulo="Conciliadas"
              valor={
                conciliacoes.filter((item) => item.status === "Conciliado")
                  .length
              }
            />
            <Card titulo="Valor conciliado" valor={moeda(totalConciliado)} />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3"
                placeholder="Pesquisar pedido, motivo, responsável ou referência..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
              <div className="flex gap-2">
                {(["Todos", "Pendentes", "Conciliados"] as const).map(
                  (opcao) => (
                    <button
                      key={opcao}
                      className={`rounded-xl px-4 py-3 font-semibold ${
                        filtro === opcao
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                      onClick={() => setFiltro(opcao)}
                    >
                      {opcao}
                    </button>
                  ),
                )}
                <button
                  className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
                  onClick={carregar}
                >
                  Atualizar
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Movimentos para conciliar</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Forma</th>
                    <th className="p-3">Motivo da baixa</th>
                    <th className="p-3">Referência bancária</th>
                    <th className="p-3">Situação</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((movimento) => {
                    const conciliacao = conciliacaoPorMovimento.get(
                      movimento.id,
                    );
                    const conciliado = conciliacao?.status === "Conciliado";
                    return (
                      <tr key={movimento.id} className="border-t">
                        <td className="p-3">{movimento.entidade}</td>
                        <td className="p-3">{movimento.data_movimento}</td>
                        <td className="p-3 font-semibold text-blue-700">
                          {moeda(movimento.valor)}
                        </td>
                        <td className="p-3">
                          {movimento.forma_pagamento || "—"}
                        </td>
                        <td className="p-3">{movimento.motivo}</td>
                        <td className="p-3">
                          {conciliacao?.referencia || "—"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ${
                              conciliado
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {conciliado ? "Conciliado" : "Pendente"}
                          </span>
                        </td>
                        <td className="p-3">
                          {conciliado ? (
                            <button
                              className="rounded-lg bg-amber-100 px-3 py-2 text-amber-800"
                              onClick={() => desfazer(movimento)}
                            >
                              Desfazer
                            </button>
                          ) : (
                            <button
                              className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white"
                              onClick={() => conciliar(movimento)}
                            >
                              Conciliar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!carregando && linhas.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  Nenhum movimento encontrado.
                </p>
              )}
              {carregando && (
                <p className="py-10 text-center text-slate-500">Carregando...</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-950">{valor}</strong>
    </div>
  );
}
