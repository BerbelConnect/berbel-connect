"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataTexto(valor?: string | null) {
  if (!valor) return "-";
  return String(valor);
}

type BoletoEdicao = {
  numero_boleto: string;
  data_boleto: string;
};

export default function FinanceiroPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [receber, setReceber] = useState<any[]>([]);
  const [pagar, setPagar] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [boletoEdicao, setBoletoEdicao] = useState<Record<string, BoletoEdicao>>(
    {}
  );
  const [salvandoBoletoId, setSalvandoBoletoId] = useState<string | null>(null);

  async function carregarDados() {
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    const receberResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)")
      .order("vencimento", { ascending: true });

    const pagarResp = await supabase
      .from("contas_pagar")
      .select("*")
      .order("vencimento", { ascending: true });

    if (pedidosResp.error) return alert(pedidosResp.error.message);
    if (receberResp.error) return alert(receberResp.error.message);
    if (pagarResp.error) return alert(pagarResp.error.message);

    setPedidos(pedidosResp.data || []);
    setReceber(receberResp.data || []);
    setPagar(pagarResp.data || []);
  }

  async function marcarRecebido(id: string) {
    const { error } = await supabase
      .from("contas_receber")
      .update({
        status: "Recebido",
        recebimento: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (error) return alert(error.message);
    await carregarDados();
  }

  async function marcarPago(id: string) {
    const { error } = await supabase
      .from("contas_pagar")
      .update({
        status: "Pago",
        pagamento: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (error) return alert(error.message);
    await carregarDados();
  }

  function valoresBoleto(item: any): BoletoEdicao {
    return {
      numero_boleto:
        boletoEdicao[item.id]?.numero_boleto ?? item.numero_boleto ?? "",
      data_boleto: boletoEdicao[item.id]?.data_boleto ?? item.data_boleto ?? "",
    };
  }

  function atualizarBoleto(
    item: any,
    campo: keyof BoletoEdicao,
    valor: string
  ) {
    setBoletoEdicao((atual) => ({
      ...atual,
      [item.id]: {
        numero_boleto:
          atual[item.id]?.numero_boleto ?? item.numero_boleto ?? "",
        data_boleto: atual[item.id]?.data_boleto ?? item.data_boleto ?? "",
        [campo]: valor,
      },
    }));
  }

  async function salvarBoleto(item: any) {
    const valores = valoresBoleto(item);

    setSalvandoBoletoId(item.id);

    const { error } = await supabase
      .from("contas_receber")
      .update({
        numero_boleto: valores.numero_boleto || null,
        data_boleto: valores.data_boleto || null,
      })
      .eq("id", item.id);

    setSalvandoBoletoId(null);

    if (error) return alert(error.message);

    setBoletoEdicao((atual) => {
      const copia = { ...atual };
      delete copia[item.id];
      return copia;
    });

    await carregarDados();
    alert("Dados do boleto salvos com sucesso.");
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalVendido = pedidos.reduce(
    (total, p) => total + Number(p.valor_total || 0),
    0
  );

  const comissaoPrevista = pedidos.reduce(
    (total, p) => total + Number(p.valor_comissao || 0),
    0
  );

  const receitasPrevistas = receber.reduce(
    (total, r) => total + Number(r.valor || 0),
    0
  );

  const receitasRecebidas = receber
    .filter((r) => r.status === "Recebido")
    .reduce((total, r) => total + Number(r.valor || 0), 0);

  const despesasPrevistas = pagar.reduce(
    (total, p) => total + Number(p.valor || 0),
    0
  );

  const despesasPagas = pagar
    .filter((p) => p.status === "Pago")
    .reduce((total, p) => total + Number(p.valor || 0), 0);

  const saldoPrevisto = receitasPrevistas - despesasPrevistas;
  const saldoRealizado = receitasRecebidas - despesasPagas;

  const receberFiltrado = useMemo(() => {
    const texto = busca.toLowerCase();

    return receber.filter((item) =>
      [
        item.descricao,
        item.status,
        item.clientes?.razao_social,
        item.numero_boleto,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [receber, busca]);

  const pagarFiltrado = useMemo(() => {
    const texto = busca.toLowerCase();

    return pagar.filter((item) =>
      [item.descricao, item.categoria, item.status, item.fornecedor]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pagar, busca]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Financeiro" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Total vendido" valor={moeda(totalVendido)} />
              <Card titulo="Comissão prevista" valor={moeda(comissaoPrevista)} />
              <Card titulo="Receitas previstas" valor={moeda(receitasPrevistas)} />
              <Card titulo="Receitas recebidas" valor={moeda(receitasRecebidas)} />
              <Card titulo="Despesas previstas" valor={moeda(despesasPrevistas)} />
              <Card titulo="Despesas pagas" valor={moeda(despesasPagas)} />
              <Card titulo="Saldo previsto" valor={moeda(saldoPrevisto)} />
              <Card titulo="Saldo realizado" valor={moeda(saldoRealizado)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  Contas a receber
                </h3>

                <input
                  placeholder="Pesquisar financeiro ou boleto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 md:w-80"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Nº boleto</th>
                      <th className="px-4 py-3">Data boleto</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {receberFiltrado.map((item) => {
                      const boleto = valoresBoleto(item);

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-semibold">
                            {item.descricao || "-"}
                          </td>

                          <td className="px-4 py-4">
                            {item.clientes?.razao_social || "-"}
                          </td>

                          <td className="px-4 py-4">{moeda(item.valor)}</td>

                          <td className="px-4 py-4">
                            {dataTexto(item.vencimento || item.data_vencimento)}
                          </td>

                          <td className="px-4 py-4">
                            <input
                              placeholder="Nº boleto"
                              value={boleto.numero_boleto}
                              onChange={(e) =>
                                atualizarBoleto(
                                  item,
                                  "numero_boleto",
                                  e.target.value
                                )
                              }
                              className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="date"
                              value={boleto.data_boleto}
                              onChange={(e) =>
                                atualizarBoleto(
                                  item,
                                  "data_boleto",
                                  e.target.value
                                )
                              }
                              className="w-40 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-4">{item.status}</td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => salvarBoleto(item)}
                                disabled={salvandoBoletoId === item.id}
                                className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                              >
                                {salvandoBoletoId === item.id
                                  ? "Salvando..."
                                  : "Salvar boleto"}
                              </button>

                              {item.status !== "Recebido" && (
                                <button
                                  onClick={() => marcarRecebido(item.id)}
                                  className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                                >
                                  Receber
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {receberFiltrado.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma conta a receber cadastrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Contas a pagar
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pagarFiltrado.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 font-semibold">
                          {item.descricao}
                        </td>
                        <td className="px-4 py-4">{item.categoria || "-"}</td>
                        <td className="px-4 py-4">{item.fornecedor || "-"}</td>
                        <td className="px-4 py-4">{moeda(item.valor)}</td>
                        <td className="px-4 py-4">
                          {dataTexto(item.vencimento || item.data_vencimento)}
                        </td>
                        <td className="px-4 py-4">{item.status}</td>
                        <td className="px-4 py-4">
                          {item.status !== "Pago" && (
                            <button
                              onClick={() => marcarPago(item.id)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                            >
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {pagarFiltrado.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma conta a pagar cadastrada.
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