"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import {
  conciliarMovimento,
  confirmarConciliacaoExtrato,
  desfazerConciliacao,
} from "@/lib/financeiro/conciliacao";
import {
  filtrarBaixasAtivas,
  hashArquivo,
  lerCsv,
  LinhaExtrato,
  sugerirCorrespondencias,
} from "@/lib/financeiro/extrato";
import type { RegraConciliacao } from "@/lib/financeiro/regrasConciliacao";
import { dataIsoBrasil } from "@/lib/dataBrasil";

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

type LancamentoExtrato = {
  id: string;
  numero_linha: number;
  data_lancamento: string;
  descricao: string;
  referencia: string | null;
  valor: number;
  movimento_sugerido_id: string | null;
  movimento_conciliado_id: string | null;
  regra_sugerida_id: string | null;
  regra_sugerida_nome: string | null;
  criterio_sugestao: string | null;
  confianca_sugestao: number | null;
  status: "Importado" | "Conciliado" | "Ignorado";
  observacoes_revisao: string | null;
  created_at: string;
};

const moeda = (valor: number | null) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const hoje = () => dataIsoBrasil();

export default function ConciliacaoFinanceiraPage() {
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [regras, setRegras] = useState<RegraConciliacao[]>([]);
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>([]);
  const [lancamentosExtrato, setLancamentosExtrato] = useState<
    LancamentoExtrato[]
  >([]);
  const [movimentosSelecionados, setMovimentosSelecionados] = useState<
    Record<string, string>
  >({});
  const [aprovandoId, setAprovandoId] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"Todos" | "Pendentes" | "Conciliados">(
    "Pendentes",
  );
  const [carregando, setCarregando] = useState(true);
  const [arquivoNome, setArquivoNome] = useState("");
  const [arquivoHash, setArquivoHash] = useState("");
  const [linhasExtrato, setLinhasExtrato] = useState<LinhaExtrato[]>([]);
  const [erroArquivo, setErroArquivo] = useState("");
  const [importando, setImportando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [
      movimentosResult,
      conciliacoesResult,
      lancamentosResult,
      regrasResult,
    ] =
      await Promise.all([
      supabase
        .from("movimentacoes_financeiras_auditoria")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("conciliacoes_financeiras")
        .select(
          "movimento_id,status,data_conciliacao,referencia,observacoes,usuario_email",
        ),
      supabase
        .from("extratos_bancarios_lancamentos")
        .select(
          "id,numero_linha,data_lancamento,descricao,referencia,valor,movimento_sugerido_id,movimento_conciliado_id,regra_sugerida_id,regra_sugerida_nome,criterio_sugestao,confianca_sugestao,status,observacoes_revisao,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("regras_conciliacao_automatica")
        .select("*")
        .eq("ativo", true)
        .order("prioridade", { ascending: false }),
      ]);

    const movimentosAtivos = movimentosResult.error
      ? []
      : (filtrarBaixasAtivas(
          (movimentosResult.data || []) as Movimento[],
        ) as Movimento[]);
    const idsConciliados = new Set(
      ((conciliacoesResult.data || []) as Conciliacao[])
        .filter((item) => item.status === "Conciliado")
        .map((item) => item.movimento_id),
    );
    const idsDisponiveis = new Set(
      movimentosAtivos
        .filter((item) => !idsConciliados.has(item.id))
        .map((item) => item.id),
    );

    if (movimentosResult.error) {
      alert(movimentosResult.error.message);
    } else {
      setMovimentos(movimentosAtivos);
    }

    if (conciliacoesResult.error) {
      alert(conciliacoesResult.error.message);
    } else {
      setConciliacoes((conciliacoesResult.data || []) as Conciliacao[]);
    }

    if (lancamentosResult.error) {
      alert(lancamentosResult.error.message);
    } else {
      const recebidos = (lancamentosResult.data || []) as LancamentoExtrato[];
      setLancamentosExtrato(recebidos);
      setMovimentosSelecionados((atuais) => {
        const proximos = { ...atuais };
        recebidos.forEach((item) => {
          if (
            !proximos[item.id] &&
            item.movimento_sugerido_id &&
            idsDisponiveis.has(item.movimento_sugerido_id)
          ) {
            proximos[item.id] = item.movimento_sugerido_id;
          } else if (
            proximos[item.id] &&
            !idsDisponiveis.has(proximos[item.id])
          ) {
            delete proximos[item.id];
          }
        });
        return proximos;
      });
    }
    if (regrasResult.error) {
      alert(regrasResult.error.message);
    } else {
      setRegras((regrasResult.data || []) as RegraConciliacao[]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    const carregamento = window.setTimeout(() => {
      void carregar();
    }, 0);

    return () => window.clearTimeout(carregamento);
  }, [carregar]);

  const conciliacaoPorMovimento = useMemo(
    () => new Map(conciliacoes.map((item) => [item.movimento_id, item])),
    [conciliacoes],
  );

  const pendentes = useMemo(
    () =>
      movimentos.filter(
        (movimento) =>
          conciliacaoPorMovimento.get(movimento.id)?.status !== "Conciliado",
      ),
    [conciliacaoPorMovimento, movimentos],
  );

  const movimentoPorId = useMemo(
    () => new Map(pendentes.map((item) => [item.id, item])),
    [pendentes],
  );

  const sugestoesPendentes = useMemo(
    () =>
      lancamentosExtrato.filter(
        (item) =>
          item.status === "Importado" && !item.movimento_conciliado_id,
      ),
    [lancamentosExtrato],
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

  const linhasValidas = linhasExtrato.filter((linha) => linha.valido);
  const sugestoes = linhasExtrato.filter(
    (linha) => linha.movimentoSugeridoId,
  ).length;

  async function selecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    setErroArquivo("");
    setLinhasExtrato([]);
    setArquivoNome(arquivo.name);

    try {
      if (!arquivo.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Selecione um arquivo no formato CSV.");
      }
      const conteudo = await arquivo.text();
      const lidas = lerCsv(conteudo);
      setLinhasExtrato(sugerirCorrespondencias(lidas, pendentes, regras));
      setArquivoHash(await hashArquivo(conteudo));
    } catch (erro) {
      setArquivoHash("");
      setErroArquivo(
        erro instanceof Error ? erro.message : "Não foi possível ler o CSV.",
      );
    }
  }

  function limparArquivo() {
    setArquivoNome("");
    setArquivoHash("");
    setLinhasExtrato([]);
    setErroArquivo("");
  }

  async function importarArquivo() {
    if (!arquivoNome || !arquivoHash || linhasValidas.length === 0) return;
    if (linhasValidas.length !== linhasExtrato.length) {
      alert("Corrija as linhas inválidas antes de importar o extrato.");
      return;
    }

    setImportando(true);
    const lancamentos = linhasValidas.map((linha) => ({
      numero_linha: linha.numeroLinha,
      data_lancamento: linha.data,
      descricao: linha.descricao,
      referencia: linha.referencia,
      valor: linha.valor,
      movimento_sugerido_id: linha.movimentoSugeridoId || null,
      regra_sugerida_id: linha.regraSugeridaId || null,
    }));
    const { error } = await supabase.rpc("importar_extrato_bancario", {
      p_nome_arquivo: arquivoNome,
      p_hash_arquivo: arquivoHash,
      p_lancamentos: lancamentos,
    });
    setImportando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      `Extrato importado com sucesso: ${linhasValidas.length} lançamento(s).`,
    );
    limparArquivo();
    carregar();
  }

  async function aprovarSugestao(lancamento: LancamentoExtrato) {
    const movimentoId =
      movimentosSelecionados[lancamento.id] ||
      lancamento.movimento_sugerido_id ||
      "";
    if (!movimentoId) {
      alert("Selecione um movimento financeiro para aprovar.");
      return;
    }

    const observacoes =
      prompt("Observações da aprovação (opcional)", "") ?? "";
    setAprovandoId(lancamento.id);
    try {
      await confirmarConciliacaoExtrato({
        lancamentoId: lancamento.id,
        movimentoId,
        observacoes,
      });
      alert("Sugestão aprovada e movimento conciliado com sucesso.");
      await carregar();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível aprovar a sugestão.",
      );
    } finally {
      setAprovandoId("");
    }
  }

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
      alert(
        erro instanceof Error ? erro.message : "Não foi possível conciliar.",
      );
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
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="p-6 pb-0">
          <h1 className="text-3xl font-bold text-slate-900">
            Conciliação Financeira
          </h1>
          <p className="mt-1 text-slate-600">
            Conferência das baixas com o extrato bancário
          </p>
        </div>

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
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-xl font-bold">
                Aprovar sugestões importadas
              </h2>
              <p className="text-sm text-slate-500">
                Confira o lançamento do extrato e o movimento sugerido antes de
                confirmar.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Descrição do extrato</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Referência</th>
                    <th className="p-3">Movimento financeiro</th>
                    <th className="p-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sugestoesPendentes.map((lancamento) => {
                    const sugerido = lancamento.movimento_sugerido_id
                      ? movimentoPorId.get(lancamento.movimento_sugerido_id)
                      : null;
                    const movimentoSelecionado =
                      movimentosSelecionados[lancamento.id] ||
                      (sugerido ? lancamento.movimento_sugerido_id : "") ||
                      "";
                    return (
                      <tr key={lancamento.id} className="border-t">
                        <td className="p-3">{lancamento.data_lancamento}</td>
                        <td className="p-3">
                          <span className="font-medium">
                            {lancamento.descricao}
                          </span>
                          {sugerido && (
                            <span className="mt-1 block text-xs text-emerald-700">
                              {lancamento.regra_sugerida_nome
                                ? `Regra: ${lancamento.regra_sugerida_nome}`
                                : "Correspondência por valor e data"}
                              {lancamento.confianca_sugestao !== null &&
                                ` · ${lancamento.confianca_sugestao}% de confiança`}
                            </span>
                          )}
                          {lancamento.movimento_sugerido_id && !sugerido && (
                            <span className="mt-1 block text-xs text-amber-700">
                              Sugestão indisponível: movimento estornado ou já
                              conciliado
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-blue-700">
                          {moeda(lancamento.valor)}
                        </td>
                        <td className="p-3">
                          {lancamento.referencia || "—"}
                        </td>
                        <td className="p-3">
                          <select
                            className="w-full min-w-72 rounded-lg border border-slate-200 px-3 py-2"
                            value={
                              movimentoSelecionado
                            }
                            onChange={(evento) =>
                              setMovimentosSelecionados((atuais) => ({
                                ...atuais,
                                [lancamento.id]: evento.target.value,
                              }))
                            }
                          >
                            <option value="">Selecione o movimento</option>
                            {pendentes.map((movimento) => (
                              <option key={movimento.id} value={movimento.id}>
                                {movimento.entidade} ·{" "}
                                {movimento.data_movimento} ·{" "}
                                {moeda(movimento.valor)} · {movimento.motivo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <button
                            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                            disabled={
                              aprovandoId === lancamento.id ||
                              !movimentoSelecionado
                            }
                            onClick={() => aprovarSugestao(lancamento)}
                          >
                            {aprovandoId === lancamento.id
                              ? "Aprovando..."
                              : "Aprovar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!carregando && sugestoesPendentes.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  Nenhuma sugestão importada aguardando aprovação.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Importar extrato bancário</h2>
                <p className="mt-1 text-sm text-slate-500">
                  CSV com as colunas Data, Descrição, Valor e Referência
                  (opcional).
                </p>
              </div>
              <label className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white">
                Selecionar CSV
                <input
                  className="hidden"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={selecionarArquivo}
                />
              </label>
            </div>

            {erroArquivo && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
                {erroArquivo}
              </p>
            )}

            {linhasExtrato.length > 0 && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Resumo titulo="Arquivo" valor={arquivoNome} />
                  <Resumo titulo="Lançamentos" valor={linhasExtrato.length} />
                  <Resumo titulo="Válidos" valor={linhasValidas.length} />
                  <Resumo titulo="Sugestões" valor={sugestoes} />
                </div>
                <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-3">Linha</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Correspondência sugerida</th>
                        <th className="p-3">Validação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhasExtrato.map((linha) => (
                        <tr key={linha.numeroLinha} className="border-t">
                          <td className="p-3">{linha.numeroLinha}</td>
                          <td className="p-3">{linha.data || "—"}</td>
                          <td className="p-3">{linha.descricao || "—"}</td>
                          <td className="p-3 font-semibold">
                            {Number.isFinite(linha.valor)
                              ? moeda(linha.valor)
                              : "—"}
                          </td>
                          <td className="p-3">
                            {linha.movimentoSugeridoTexto || "Sem sugestão"}
                            {linha.movimentoSugeridoId && (
                              <span className="mt-1 block text-xs text-emerald-700">
                                {linha.criterioSugestao}
                                {linha.confiancaSugestao !== undefined &&
                                  ` · ${linha.confiancaSugestao}% de confiança`}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-3 py-1 font-semibold ${
                                linha.valido
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {linha.valido ? "Válida" : linha.erro}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
                    onClick={limparArquivo}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    disabled={
                      importando ||
                      linhasValidas.length === 0 ||
                      linhasValidas.length !== linhasExtrato.length
                    }
                    onClick={importarArquivo}
                  >
                    {importando ? "Importando..." : "Confirmar importação"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3"
                placeholder="Pesquisar pedido, motivo, responsável ou referência..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
              <div className="flex flex-wrap gap-2">
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
            <h2 className="mb-4 text-xl font-bold">
              Movimentos para conciliar
            </h2>
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
                <p className="py-10 text-center text-slate-500">
                  Carregando...
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-950">{valor}</strong>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <strong className="mt-1 block truncate text-slate-900">{valor}</strong>
    </div>
  );
}
