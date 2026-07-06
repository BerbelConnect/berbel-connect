"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type ContaReceber = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  recebimento: string;
  status: string;
};

type ContaPagar = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pagamento: string;
  status: string;
};

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function inicioMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function fimMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

export default function FluxoCaixaPage() {
  const [receber, setReceber] = useState<ContaReceber[]>([]);
  const [pagar, setPagar] = useState<ContaPagar[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarDados() {
    const contasReceber = await supabase
      .from("contas_receber")
      .select("*")
      .order("vencimento");

    const contasPagar = await supabase
      .from("contas_pagar")
      .select("*")
      .order("vencimento");

    if (contasReceber.error)
      return alert(contasReceber.error.message);

    if (contasPagar.error)
      return alert(contasPagar.error.message);

    setReceber((contasReceber.data || []) as ContaReceber[]);
    setPagar((contasPagar.data || []) as ContaPagar[]);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const entradasPrevistas = useMemo(() => {
    return receber
      .filter((c) => c.status !== "Recebido")
      .reduce((soma, c) => soma + Number(c.valor || 0), 0);
  }, [receber]);

  const entradasRecebidas = useMemo(() => {
    return receber
      .filter((c) => c.status === "Recebido")
      .reduce((soma, c) => soma + Number(c.valor || 0), 0);
  }, [receber]);

  const saidasPrevistas = useMemo(() => {
    return pagar
      .filter((c) => c.status !== "Pago")
      .reduce((soma, c) => soma + Number(c.valor || 0), 0);
  }, [pagar]);

  const saidasPagas = useMemo(() => {
    return pagar
      .filter((c) => c.status === "Pago")
      .reduce((soma, c) => soma + Number(c.valor || 0), 0);
  }, [pagar]);

  const saldoPrevisto =
    entradasPrevistas - saidasPrevistas;

  const saldoRealizado =
    entradasRecebidas - saidasPagas;

  const movimentacoes = useMemo(() => {
    const entradas = receber.map((c) => ({
      tipo: "Entrada",
      descricao: c.descricao,
      data: c.vencimento,
      valor: Number(c.valor),
      status: c.status,
    }));

    const saidas = pagar.map((c) => ({
      tipo: "Saída",
      descricao: c.descricao,
      data: c.vencimento,
      valor: Number(c.valor),
      status: c.status,
    }));

    return [...entradas, ...saidas]
      .filter((mov) =>
        [mov.descricao, mov.tipo, mov.status]
          .join(" ")
          .toLowerCase()
          .includes(busca.toLowerCase())
      )
.sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")));  }, [receber, pagar, busca]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">

        <Sidebar />

        <section className="flex-1">

          <PageHeader
            titulo="Fluxo de Caixa"
            subtitulo="Financeiro Berbel Connect"
          />

          <div className="p-8">

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">

              <Card
                titulo="Entradas Previstas"
                valor={moeda(entradasPrevistas)}
                cor="text-blue-700"
              />

              <Card
                titulo="Entradas Recebidas"
                valor={moeda(entradasRecebidas)}
                cor="text-green-700"
              />

              <Card
                titulo="Saídas Previstas"
                valor={moeda(saidasPrevistas)}
                cor="text-red-700"
              />

              <Card
                titulo="Saldo Previsto"
                valor={moeda(saldoPrevisto)}
                cor={
                  saldoPrevisto >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }
              />

              <Card
                titulo="Saldo Realizado"
                valor={moeda(saldoRealizado)}
                cor={
                  saldoRealizado >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }
              />

            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold">
                  Movimentações Financeiras
                </h2>

                <input
                  placeholder="Pesquisar..."
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                  className="border rounded-xl px-4 py-3 w-80"
                />

              </div>
                            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {movimentacoes.map((mov, index) => (
                      <tr key={`${mov.tipo}-${mov.descricao}-${index}`}>
                        <td className="px-4 py-4">{mov.data || "-"}</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              mov.tipo === "Entrada"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {mov.tipo}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {mov.descricao || "-"}
                        </td>

                        <td
                          className={`px-4 py-4 font-bold ${
                            mov.tipo === "Entrada"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {mov.tipo === "Entrada" ? "+" : "-"}{" "}
                          {moeda(mov.valor)}
                        </td>

                        <td className="px-4 py-4">{mov.status || "-"}</td>
                      </tr>
                    ))}

                    {movimentacoes.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma movimentação encontrada.
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
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className={`mt-2 block text-2xl ${cor}`}>{valor}</strong>
    </div>
  );
}