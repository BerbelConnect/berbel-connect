"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { baixarMovimento } from "@/lib/financeiro/baixarMovimento";
import { estornarMovimento } from "@/lib/financeiro/estornarMovimento";

type ContaPagar = {
  id?: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  valor: string;
  vencimento: string;
  pagamento: string;
  status: string;
  forma_pagamento: string;
  observacoes: string;
};

type RecorrenciaForm = {
  descricao: string; categoria: string; fornecedor: string; valor_padrao: string;
  dia_vencimento: string; data_inicio: string; data_termino: string;
  forma_pagamento: string; dias_aviso: string; observacoes: string;
};

const inicial: ContaPagar = {
  descricao: "",
  categoria: "",
  fornecedor: "",
  valor: "",
  vencimento: "",
  pagamento: "",
  status: "Pendente",
  forma_pagamento: "",
  observacoes: "",
};

const recorrenciaInicial: RecorrenciaForm = {
  descricao: "", categoria: "", fornecedor: "", valor_padrao: "", dia_vencimento: "10",
  data_inicio: new Date().toISOString().slice(0, 10), data_termino: "", forma_pagamento: "",
  dias_aviso: "5", observacoes: "",
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ContasPagarPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [form, setForm] = useState<ContaPagar>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [recorrencias, setRecorrencias] = useState<any[]>([]);
  const [recorrenciaForm, setRecorrenciaForm] = useState<RecorrenciaForm>(recorrenciaInicial);
  const [salvandoRecorrencia, setSalvandoRecorrencia] = useState(false);

  async function carregarContas() {
    const [contasResp, recorrenciasResp] = await Promise.all([
      supabase.from("contas_pagar").select("*").order("vencimento", { ascending: true }),
      supabase.from("contas_pagar_recorrencias").select("*").order("descricao"),
    ]);

    if (contasResp.error) return alert(contasResp.error.message);
    if (recorrenciasResp.error) return alert(recorrenciasResp.error.message);
    setContas(contasResp.data || []);
    setRecorrencias(recorrenciasResp.data || []);
  }

  async function salvarConta() {
    if (!form.descricao.trim()) return alert("Informe a descrição.");
    if (!form.valor) return alert("Informe o valor.");

    setCarregando(true);

    const payload = {
      descricao: form.descricao,
      categoria: form.categoria,
      fornecedor: form.fornecedor,
      valor: Number(form.valor || 0),
      vencimento: form.vencimento || null,
      forma_pagamento: form.forma_pagamento,
      observacoes: form.observacoes,
      ...(form.id ? { valor_editado: true } : {}),
    };

    const { error } = form.id
      ? await supabase.from("contas_pagar").update(payload).eq("id", form.id)
      : await supabase.from("contas_pagar").insert({ ...payload, status: "Pendente" });

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarContas();
  }

  function editarConta(conta: any) {
    setForm({
      id: conta.id,
      descricao: conta.descricao || "",
      categoria: conta.categoria || "",
      fornecedor: conta.fornecedor || "",
      valor: String(conta.valor || ""),
      vencimento: conta.vencimento || "",
      pagamento: conta.pagamento || "",
      status: conta.status || "Pendente",
      forma_pagamento: conta.forma_pagamento || "",
      observacoes: conta.observacoes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function marcarPago(conta: any) {
    const forma = prompt("Forma de pagamento", conta.forma_pagamento || "PIX");
    if (forma === null) return;
    const motivo = prompt("Motivo da baixa", "Pagamento confirmado");
    if (motivo === null) return;

    try {
      await baixarMovimento({
        tipo: "conta_pagar",
        id: conta.id,
        data: new Date().toISOString().slice(0, 10),
        formaPagamento: forma,
        motivo,
      });
      alert("Pagamento registrado com auditoria.");
      carregarContas();
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : "Não foi possível registrar a baixa.");
    }
  }

  async function estornarPagamento(conta: any) {
    const motivo = prompt("Motivo do estorno");
    if (motivo === null) return;

    try {
      await estornarMovimento({
        tipo: "conta_pagar",
        id: conta.id,
        motivo,
      });
      alert("Pagamento estornado com registro de auditoria.");
      carregarContas();
    } catch (erro) {
      alert(erro instanceof Error ? erro.message : "Não foi possível realizar o estorno.");
    }
  }

  useEffect(() => {
    async function iniciar() {
      const limite = new Date(); limite.setMonth(limite.getMonth() + 12);
      const { error } = await supabase.rpc("gerar_parcelas_contas_fixas", { p_ate: limite.toISOString().slice(0, 10) });
      if (error) console.error("Não foi possível gerar parcelas recorrentes:", error.message);
      await carregarContas();
    }
    void iniciar();
  }, []);

  async function salvarRecorrencia() {
    if (!recorrenciaForm.descricao.trim()) return alert("Informe a descrição da conta fixa.");
    if (!recorrenciaForm.valor_padrao) return alert("Informe o valor padrão.");
    setSalvandoRecorrencia(true);
    const { error } = await supabase.from("contas_pagar_recorrencias").insert({
      descricao: recorrenciaForm.descricao, categoria: recorrenciaForm.categoria,
      fornecedor: recorrenciaForm.fornecedor, valor_padrao: Number(recorrenciaForm.valor_padrao),
      dia_vencimento: Number(recorrenciaForm.dia_vencimento), data_inicio: recorrenciaForm.data_inicio,
      data_termino: recorrenciaForm.data_termino || null, forma_pagamento: recorrenciaForm.forma_pagamento,
      dias_aviso: Number(recorrenciaForm.dias_aviso || 5), observacoes: recorrenciaForm.observacoes,
    });
    if (!error) {
      const limite = new Date(); limite.setMonth(limite.getMonth() + 12);
      await supabase.rpc("gerar_parcelas_contas_fixas", { p_ate: limite.toISOString().slice(0, 10) });
    }
    setSalvandoRecorrencia(false);
    if (error) return alert(error.message);
    setRecorrenciaForm(recorrenciaInicial); await carregarContas();
    alert("Conta fixa criada e parcelas mensais geradas.");
  }

  async function alterarStatusRecorrencia(id: string, status: "Ativa" | "Pausada" | "Encerrada") {
    const payload = status === "Encerrada" ? { status, data_termino: new Date().toISOString().slice(0, 10) } : { status };
    const { error } = await supabase.from("contas_pagar_recorrencias").update(payload).eq("id", id);
    if (error) return alert(error.message);
    const hojeMes = `${new Date().toISOString().slice(0, 7)}-01`;
    const novoStatusParcela = status === "Ativa" ? "Pendente" : status === "Pausada" ? "Pausada" : "Cancelado";
    const statusAtualParcela = status === "Ativa" ? "Pausada" : "Pendente";
    const parcelasResp = await supabase.from("contas_pagar").update({ status: novoStatusParcela })
      .eq("recorrencia_id", id).eq("status", statusAtualParcela).gte("competencia", hojeMes);
    if (parcelasResp.error) return alert(parcelasResp.error.message);
    await carregarContas();
  }

  async function alterarValorPadrao(recorrencia: any) {
    const valor = prompt("Novo valor padrão para os próximos meses:", String(recorrencia.valor_padrao));
    if (valor === null) return;
    const novoValor = Number(valor.replace(",", "."));
    if (!Number.isFinite(novoValor) || novoValor < 0) return alert("Informe um valor válido.");
    const hojeMes = `${new Date().toISOString().slice(0, 7)}-01`;
    const { error } = await supabase.from("contas_pagar_recorrencias").update({ valor_padrao: novoValor }).eq("id", recorrencia.id);
    if (error) return alert(error.message);
    const parcelasResp = await supabase.from("contas_pagar").update({ valor: novoValor })
      .eq("recorrencia_id", recorrencia.id).eq("valor_editado", false).eq("status", "Pendente").gte("competencia", hojeMes);
    if (parcelasResp.error) return alert(parcelasResp.error.message);
    await carregarContas();
  }

  const contasFiltradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return contas.filter((conta) =>
      [
        conta.descricao,
        conta.categoria,
        conta.fornecedor,
        conta.status,
        conta.forma_pagamento,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [contas, busca]);

  const total = contasFiltradas.reduce(
    (soma, conta) => soma + Number(conta.valor || 0),
    0
  );

  const pendente = contasFiltradas
    .filter((conta) => conta.status === "Pendente")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  const pago = contasFiltradas
    .filter((conta) => conta.status === "Pago")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Contas a Pagar" subtitulo="Financeiro" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Total" valor={moeda(total)} />
              <Card titulo="Pendente" valor={moeda(pendente)} />
              <Card titulo="Pago" valor={moeda(pago)} />
              <Card titulo="Lançamentos" valor={contasFiltradas.length} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Nova conta fixa mensal</h3>
              <p className="mb-5 mt-1 text-sm text-slate-500">Ex.: combustível, internet e demais despesas que se repetem todo mês.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Campo label="Descrição" value={recorrenciaForm.descricao} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, descricao: v })} />
                <Campo label="Categoria" value={recorrenciaForm.categoria} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, categoria: v })} />
                <Campo label="Fornecedor" value={recorrenciaForm.fornecedor} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, fornecedor: v })} />
                <Campo label="Valor padrão" type="number" value={recorrenciaForm.valor_padrao} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, valor_padrao: v })} />
                <Campo label="Dia do vencimento" type="number" value={recorrenciaForm.dia_vencimento} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, dia_vencimento: v })} />
                <Campo label="Data de início" type="date" value={recorrenciaForm.data_inicio} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, data_inicio: v })} />
                <Campo label="Data de término (opcional)" type="date" value={recorrenciaForm.data_termino} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, data_termino: v })} />
                <Campo label="Avisar com quantos dias" type="number" value={recorrenciaForm.dias_aviso} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, dias_aviso: v })} />
                <Campo label="Forma de pagamento" value={recorrenciaForm.forma_pagamento} onChange={(v) => setRecorrenciaForm({ ...recorrenciaForm, forma_pagamento: v })} />
                <textarea placeholder="Observações" value={recorrenciaForm.observacoes} onChange={(e) => setRecorrenciaForm({ ...recorrenciaForm, observacoes: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-3" />
              </div>
              <button onClick={() => void salvarRecorrencia()} disabled={salvandoRecorrencia} className="mt-5 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-60">
                {salvandoRecorrencia ? "Gerando parcelas..." : "Criar conta fixa"}
              </button>
            </section>

            {recorrencias.length > 0 && <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">Contas fixas configuradas</h3>
              <div className="grid gap-4 lg:grid-cols-2">{recorrencias.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3"><div><strong className="text-slate-900">{item.descricao}</strong><p className="text-sm text-slate-500">{moeda(item.valor_padrao)} · vence dia {item.dia_vencimento} · aviso {item.dias_aviso} dia(s) antes</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.status}</span></div>
                <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void alterarValorPadrao(item)} className="rounded-lg border px-3 py-2 text-sm">Alterar valor</button>{item.status === "Ativa" ? <button onClick={() => void alterarStatusRecorrencia(item.id, "Pausada")} className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">Pausar</button> : item.status === "Pausada" ? <button onClick={() => void alterarStatusRecorrencia(item.id, "Ativa")} className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">Reativar</button> : null}{item.status !== "Encerrada" && <button onClick={() => void alterarStatusRecorrencia(item.id, "Encerrada")} className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">Encerrar</button>}</div>
              </div>)}</div>
            </section>}

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar conta" : "Nova conta a pagar"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Campo label="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} />
                <Campo label="Categoria" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
                <Campo label="Fornecedor" value={form.fornecedor} onChange={(v) => setForm({ ...form, fornecedor: v })} />
                <Campo label="Valor" type="number" value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />

                <Campo label="Vencimento" type="date" value={form.vencimento} onChange={(v) => setForm({ ...form, vencimento: v })} />
                <Campo label="Forma de pagamento" value={form.forma_pagamento} onChange={(v) => setForm({ ...form, forma_pagamento: v })} />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-4"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarConta}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar conta"}
                </button>

                <button
                  onClick={() => setForm(inicial)}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Contas cadastradas
                </h3>

                <input
                  placeholder="Pesquisar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

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
                      <th className="px-4 py-3">Origem</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {contasFiltradas.map((conta) => (
                      <tr key={conta.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {conta.descricao}
                        </td>
                        <td className="px-4 py-4">{conta.categoria || "-"}</td>
                        <td className="px-4 py-4">{conta.fornecedor || "-"}</td>
                        <td className="px-4 py-4">{moeda(conta.valor)}</td>
                        <td className="px-4 py-4">{conta.vencimento || "-"}</td>
                        <td className="px-4 py-4">{conta.status}</td>
                        <td className="px-4 py-4">{conta.recorrencia_id ? `Fixa · ${conta.competencia?.slice(0, 7) || "mensal"}` : "Avulsa"}</td>
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarConta(conta)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          {conta.status === "Pendente" && (
                            <button
                              onClick={() => marcarPago(conta)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                            >
                              Pagar
                            </button>
                          )}

                          {conta.status === "Pago" && (
                            <button
                              onClick={() => estornarPagamento(conta)}
                              className="rounded-lg bg-amber-100 px-3 py-2 text-amber-800"
                            >
                              Estornar
                            </button>
                          )}

                        </td>
                      </tr>
                    ))}

                    {contasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
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

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
    />
  );
}
