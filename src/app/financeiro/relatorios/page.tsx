"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RelatoriosFinanceirosPage() {
  const [receber, setReceber] = useState<any[]>([]);
  const [pagar, setPagar] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarDados() {
    const receberResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)")
      .order("vencimento", { ascending: true });

    const pagarResp = await supabase
      .from("contas_pagar")
      .select("*")
      .order("vencimento", { ascending: true });

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social), pedidos(numero)")
      .order("created_at", { ascending: false });

    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    if (receberResp.error) return alert(receberResp.error.message);
    if (pagarResp.error) return alert(pagarResp.error.message);
    if (comissoesResp.error) return alert(comissoesResp.error.message);
    if (pedidosResp.error) return alert(pedidosResp.error.message);

    setReceber(receberResp.data || []);
    setPagar(pagarResp.data || []);
    setComissoes(comissoesResp.data || []);
    setPedidos(pedidosResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalVendido = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_total || 0),
    0
  );

  const totalReceber = receber
    .filter((item) => item.status !== "Recebido")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalRecebido = receber
    .filter((item) => item.status === "Recebido")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalPagar = pagar
    .filter((item) => item.status !== "Pago")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalPago = pagar
    .filter((item) => item.status === "Pago")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const comissaoPrevista = comissoes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  const comissaoRecebida = comissoes
    .filter((item) => item.status === "Recebida")
    .reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0);

  const saldoPrevisto = totalReceber - totalPagar;
  const saldoRealizado = totalRecebido - totalPago;

  const movimentacoes = useMemo(() => {
    const texto = busca.toLowerCase();

    const entradas = receber.map((item) => ({
      tipo: "Receber",
      descricao: item.descricao,
      cliente: item.clientes?.razao_social || "-",
      valor: Number(item.valor || 0),
      data: item.vencimento || item.recebimento || "-",
      status: item.status,
    }));

    const saidas = pagar.map((item) => ({
      tipo: "Pagar",
      descricao: item.descricao,
      cliente: item.fornecedor || "-",
      valor: Number(item.valor || 0),
      data: item.vencimento || item.pagamento || "-",
      status: item.status,
    }));

    const lista = [...entradas, ...saidas];

    return lista.filter((item) =>
      [item.tipo, item.descricao, item.cliente, item.status]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [receber, pagar, busca]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Relatórios Financeiros" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Total vendido" valor={moeda(totalVendido)} />
              <Card titulo="A receber" valor={moeda(totalReceber)} />
              <Card titulo="Recebido" valor={moeda(totalRecebido)} />
              <Card titulo="A pagar" valor={moeda(totalPagar)} />
              <Card titulo="Pago" valor={moeda(totalPago)} />
              <Card titulo="Saldo previsto" valor={moeda(saldoPrevisto)} />
              <Card titulo="Saldo realizado" valor={moeda(saldoRealizado)} />
              <Card titulo="Comissão prevista" valor={moeda(comissaoPrevista)} />
              <Card titulo="Comissão recebida" valor={moeda(comissaoRecebida)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Resumo consolidado
                </h3>

                <input
                  placeholder="Pesquisar movimentação..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Resumo
                  titulo="Receitas"
                  linhas={[
                    ["Previsto", moeda(totalReceber)],
                    ["Recebido", moeda(totalRecebido)],
                    ["Pendente", moeda(totalReceber)],
                  ]}
                />

                <Resumo
                  titulo="Despesas"
                  linhas={[
                    ["Previsto", moeda(totalPagar)],
                    ["Pago", moeda(totalPago)],
                    ["Pendente", moeda(totalPagar)],
                  ]}
                />

                <Resumo
                  titulo="Comissões"
                  linhas={[
                    ["Prevista", moeda(comissaoPrevista)],
                    ["Recebida", moeda(comissaoRecebida)],
                    ["Pendente", moeda(comissaoPrevista - comissaoRecebida)],
                  ]}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Movimentações do relatório
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Cliente/Fornecedor</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {movimentacoes.map((item, index) => (
                      <tr key={`${item.tipo}-${index}`}>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.tipo === "Receber"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-semibold">
                          {item.descricao || "-"}
                        </td>

                        <td className="px-4 py-4">{item.cliente || "-"}</td>
                        <td className="px-4 py-4">{item.data || "-"}</td>

                        <td
                          className={`px-4 py-4 font-bold ${
                            item.tipo === "Receber"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {item.tipo === "Receber" ? "+" : "-"} {moeda(item.valor)}
                        </td>

                        <td className="px-4 py-4">{item.status || "-"}</td>
                      </tr>
                    ))}

                    {movimentacoes.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
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

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}

function Resumo({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: [string, string][];
}) {
  return (
    <div className="rounded-2xl border p-5">
      <h4 className="mb-4 font-bold text-slate-800">{titulo}</h4>

      <div className="space-y-3">
        {linhas.map(([label, valor]) => (
          <div key={label} className="flex justify-between border-b pb-2">
            <span className="text-slate-500">{label}</span>
            <strong>{valor}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}