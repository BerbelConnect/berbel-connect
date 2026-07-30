"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { buscarHistoricoCliente } from "@/services/historicoClienteService";
import type { HistoricoClienteDados } from "@/types/historicoCliente";

type ClienteOption = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
};

function moeda(valor: number | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

export default function Historico360Page() {
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [historico, setHistorico] = useState<HistoricoClienteDados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social", { ascending: true });

      if (error) {
        setErro(error.message);
        return;
      }

      const lista = data || [];
      setClientes(lista);
      if (lista.length > 0) {
        setClienteId((prev) => prev || lista[0].id);
      }
    }

    void carregar();
  }, []);

  useEffect(() => {
    if (!clienteId) return;

    async function carregar() {
      setErro("");
      setCarregando(true);

      try {
        const dados = await buscarHistoricoCliente(clienteId);
        setHistorico(dados);
      } catch (error) {
        setHistorico(null);
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o histórico do cliente."
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, [clienteId]);

  const alertas = historico?.alertas || [];
  const produtos = historico?.produtosMaisComprados || [];
  const timeline = historico?.timeline || [];

  const visitasRecentes = useMemo(
    () => historico?.visitas.slice(0, 5) || [],
    [historico]
  );

  const contasRecentes = useMemo(
    () => historico?.contasReceber.slice(0, 6) || [],
    [historico]
  );

  const comissoesRecentes = useMemo(
    () => historico?.comissoes.slice(0, 6) || [],
    [historico]
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Histórico 360 do Cliente" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Selecione o cliente para visualizar o relatório completo.</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Histórico 360 do Cliente</h3>
              </div>

              <div className="flex w-full max-w-md items-center gap-3">
                <label htmlFor="cliente" className="sr-only">
                  Cliente
                </label>
                <select
                  id="cliente"
                  value={clienteId}
                  onChange={(event) => setClienteId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {erro ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                {erro}
              </div>
            ) : null}

            {!historico && !carregando ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                Selecione um cliente para exibir o histórico completo.
              </div>
            ) : null}

            {carregando ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                Carregando histórico do cliente...
              </div>
            ) : null}

            {historico ? (
              <>
                {alertas.length > 0 && (
                  <section className="mb-6 grid gap-4 md:grid-cols-3">
                    {alertas.map((alerta) => (
                      <div key={alerta.tipo} className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                        <p className="text-sm font-semibold text-amber-800">{alerta.titulo}</p>
                        <p className="mt-2 text-sm text-slate-600">{alerta.descricao}</p>
                      </div>
                    ))}
                  </section>
                )}

                <section className="mb-6 grid gap-4 md:grid-cols-3">
                  <Card titulo="Total comprado" valor={moeda(historico.resumo.totalComprado)} />
                  <Card titulo="Pedidos" valor={historico.resumo.numeroPedidos} />
                  <Card titulo="Ticket médio" valor={moeda(historico.resumo.ticketMedio)} />
                  <Card titulo="Comissão acumulada" valor={moeda(historico.resumo.comissaoTotal)} />
                  <Card titulo="Contas pendentes" valor={historico.resumo.contasPendentes} />
                  <Card titulo="Contas vencidas" valor={historico.resumo.contasVencidas} />
                </section>

                <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Dados do cliente</h3>
                      <p className="text-sm text-slate-500">Visão geral do cliente selecionado.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      Ranking {historico.resumo.ranking}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <ResumoItem label="Nome" value={historico.cliente.razao_social} />
                    <ResumoItem label="Cidade" value={`${historico.cliente.cidade || "-"} / ${historico.cliente.estado || "-"}`} />
                    <ResumoItem label="E-mail / WhatsApp" value={`${historico.cliente.email || "-"} • ${historico.cliente.whatsapp || "-"}`} />
                  </div>
                </section>

                <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Produtos mais comprados</h3>
                        <p className="text-sm text-slate-500">Principais itens por volume e valor.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                        Top 10
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Produto</th>
                            <th className="px-4 py-3">Quantidade</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Comissão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {produtos.length > 0 ? (
                            produtos.map((item) => (
                              <tr key={item.produto_nome}>
                                <td className="px-4 py-4 font-semibold text-slate-800">{item.produto_nome}</td>
                                <td className="px-4 py-4">{item.quantidade}</td>
                                <td className="px-4 py-4">{moeda(item.valor_total)}</td>
                                <td className="px-4 py-4">{moeda(item.comissao_total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                Nenhum produto encontrado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-xl font-bold text-slate-900">Últimas ações</h3>
                    <div className="space-y-4">
                      {timeline.slice(0, 6).map((evento) => (
                        <div key={evento.id} className="rounded-3xl border border-slate-100 p-4">
                          <p className="text-sm font-semibold text-slate-900">{evento.titulo}</p>
                          <p className="mt-1 text-sm text-slate-500">{evento.categoria} • {formatarData(evento.data)}</p>
                          <p className="mt-2 text-sm text-slate-600">{evento.descricao}</p>
                        </div>
                      ))}
                      {timeline.length === 0 && (
                        <p className="text-sm text-slate-500">Ainda não há eventos para este cliente.</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Pedidos recentes</h3>
                        <p className="text-sm text-slate-500">Últimos pedidos cadastrados.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                        {historico.pedidos.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Pedido</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historico.pedidos.length > 0 ? (
                            historico.pedidos.slice(0, 6).map((pedido) => (
                              <tr key={pedido.id}>
                                <td className="px-4 py-4 font-semibold text-slate-800">{pedido.numero || pedido.id}</td>
                                <td className="px-4 py-4">{formatarData(pedido.data_pedido)}</td>
                                <td className="px-4 py-4">{pedido.status || "-"}</td>
                                <td className="px-4 py-4">{moeda(pedido.valor_total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                Nenhum pedido registrado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Visitas recentes</h3>
                          <p className="text-sm text-slate-500">Últimas interações com o cliente.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                          {visitasRecentes.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {visitasRecentes.length > 0 ? (
                          visitasRecentes.map((visita) => (
                            <div key={visita.id} className="rounded-3xl border border-slate-100 p-4">
                              <p className="font-semibold text-slate-800">{visita.tipo || "Visita"}</p>
                              <p className="text-sm text-slate-500">{formatarData(visita.data_visita)} • {visita.pessoa_atendida || "Sem registro"}</p>
                              <p className="mt-1 text-sm text-slate-600">{visita.resumo || "Sem resumo."}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">Nenhuma visita registrada.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Contas a receber</h3>
                          <p className="text-sm text-slate-500">Faturas e vencimentos atuais.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                          {contasRecentes.length}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Descrição</th>
                              <th className="px-4 py-3">Vencimento</th>
                              <th className="px-4 py-3">Valor</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {contasRecentes.length > 0 ? (
                              contasRecentes.map((conta) => (
                                <tr key={conta.id}>
                                  <td className="px-4 py-4">{conta.descricao || "-"}</td>
                                  <td className="px-4 py-4">{formatarData(conta.vencimento)}</td>
                                  <td className="px-4 py-4">{moeda(conta.valor)}</td>
                                  <td className="px-4 py-4">{conta.status || "-"}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                  Nenhuma conta encontrada.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Comissões recentes</h3>
                          <p className="text-sm text-slate-500">Movimentações financeiras vinculadas.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                          {comissoesRecentes.length}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Data</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {comissoesRecentes.length > 0 ? (
                              comissoesRecentes.map((comissao) => (
                                <tr key={comissao.id}>
                                  <td className="px-4 py-4">{formatarData(comissao.data_recebimento)}</td>
                                  <td className="px-4 py-4">{comissao.status || "-"}</td>
                                  <td className="px-4 py-4">{moeda(comissao.valor_comissao)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                  Nenhuma comissão registrada.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}

function ResumoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
