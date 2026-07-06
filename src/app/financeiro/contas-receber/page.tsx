"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: string;
  razao_social: string;
};

type ContaReceber = {
  id?: string;
  pedido_id?: string;
  cliente_id: string;
  descricao: string;
  valor: string;
  vencimento: string;
  recebimento: string;
  status: string;
  forma_pagamento: string;
  observacoes: string;
};

const inicial: ContaReceber = {
  cliente_id: "",
  descricao: "",
  valor: "",
  vencimento: "",
  recebimento: "",
  status: "Pendente",
  forma_pagamento: "",
  observacoes: "",
};

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function situacaoConta(conta: any) {
  if (conta.status === "Recebido") return "Recebido";
  if (!conta.vencimento) return "Sem vencimento";
  if (conta.vencimento < hojeISO()) return "Vencido";
  if (conta.vencimento === hojeISO()) return "Vence hoje";
  return "A vencer";
}

function classeSituacao(conta: any) {
  const situacao = situacaoConta(conta);

  if (situacao === "Recebido") return "bg-green-100 text-green-700";
  if (situacao === "Vencido") return "bg-red-100 text-red-700";
  if (situacao === "Vence hoje") return "bg-yellow-100 text-yellow-700";
  if (situacao === "A vencer") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export default function ContasReceberPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [form, setForm] = useState<ContaReceber>(inicial);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    const clientesResp = await supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social");

    const contasResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)")
      .order("vencimento", { ascending: true });

    if (clientesResp.error) return alert(clientesResp.error.message);
    if (contasResp.error) return alert(contasResp.error.message);

    setClientes(clientesResp.data || []);
    setContas(contasResp.data || []);
  }

  async function salvarConta() {
    if (!form.descricao.trim()) return alert("Informe a descrição.");
    if (!form.valor) return alert("Informe o valor.");

    setCarregando(true);

    const payload = {
      cliente_id: form.cliente_id || null,
      descricao: form.descricao,
      valor: Number(form.valor || 0),
      vencimento: form.vencimento || null,
      recebimento: form.recebimento || null,
      status: form.status || "Pendente",
      forma_pagamento: form.forma_pagamento,
      observacoes: form.observacoes,
    };

    const { error } = form.id
      ? await supabase.from("contas_receber").update(payload).eq("id", form.id)
      : await supabase.from("contas_receber").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function editarConta(conta: any) {
    setForm({
      id: conta.id,
      pedido_id: conta.pedido_id || "",
      cliente_id: conta.cliente_id || "",
      descricao: conta.descricao || "",
      valor: String(conta.valor || ""),
      vencimento: conta.vencimento || "",
      recebimento: conta.recebimento || "",
      status: conta.status || "Pendente",
      forma_pagamento: conta.forma_pagamento || "",
      observacoes: conta.observacoes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirConta(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir esta conta a receber?")) return;

    const { error } = await supabase
      .from("contas_receber")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);
    carregarDados();
  }

  async function marcarRecebida(conta: any) {
    const forma = prompt(
      "Forma de recebimento: PIX, TED, Boleto, Dinheiro, Cartão ou outro",
      conta.forma_pagamento || "PIX"
    );

    if (forma === null) return;

    const { error } = await supabase
      .from("contas_receber")
      .update({
        status: "Recebido",
        recebimento: hojeISO(),
        forma_pagamento: forma,
      })
      .eq("id", conta.id);

    if (error) return alert(error.message);
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const contasFiltradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return contas
      .filter((conta) => {
        const situacao = situacaoConta(conta);

        if (filtro === "Pendentes" && conta.status === "Recebido") return false;
        if (filtro === "Recebidos" && conta.status !== "Recebido") return false;
        if (filtro === "Vencidos" && situacao !== "Vencido") return false;
        if (filtro === "Hoje" && situacao !== "Vence hoje") return false;

        return true;
      })
      .filter((conta) =>
        [
          conta.descricao,
          conta.status,
          conta.forma_pagamento,
          conta.observacoes,
          conta.clientes?.razao_social,
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto)
      );
  }, [contas, busca, filtro]);

  const total = contasFiltradas.reduce(
    (soma, conta) => soma + Number(conta.valor || 0),
    0
  );

  const pendente = contasFiltradas
    .filter((conta) => conta.status !== "Recebido")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  const recebido = contasFiltradas
    .filter((conta) => conta.status === "Recebido")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  const vencido = contasFiltradas
    .filter((conta) => situacaoConta(conta) === "Vencido")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  const venceHoje = contasFiltradas
    .filter((conta) => situacaoConta(conta) === "Vence hoje")
    .reduce((soma, conta) => soma + Number(conta.valor || 0), 0);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Contas a Receber" subtitulo="Financeiro" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card titulo="Total" valor={moeda(total)} />
              <Card titulo="A receber" valor={moeda(pendente)} />
              <Card titulo="Recebido" valor={moeda(recebido)} />
              <Card titulo="Vencido" valor={moeda(vencido)} />
              <Card titulo="Vence hoje" valor={moeda(venceHoje)} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar conta" : "Nova conta a receber"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  value={form.cliente_id}
                  onChange={(e) =>
                    setForm({ ...form, cliente_id: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </option>
                  ))}
                </select>

                <Campo
                  label="Descrição"
                  value={form.descricao}
                  onChange={(v) => setForm({ ...form, descricao: v })}
                />

                <Campo
                  label="Valor"
                  type="number"
                  value={form.valor}
                  onChange={(v) => setForm({ ...form, valor: v })}
                />

                <Campo
                  label="Vencimento"
                  type="date"
                  value={form.vencimento}
                  onChange={(v) => setForm({ ...form, vencimento: v })}
                />

                <Campo
                  label="Recebimento"
                  type="date"
                  value={form.recebimento}
                  onChange={(v) => setForm({ ...form, recebimento: v })}
                />

                <Campo
                  label="Forma de pagamento"
                  value={form.forma_pagamento}
                  onChange={(v) =>
                    setForm({ ...form, forma_pagamento: v })
                  }
                />

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 md:col-span-4"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarConta}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar conta"}
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
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Contas cadastradas
                </h3>

                <div className="flex flex-wrap gap-2">
                  {["Todos", "Pendentes", "Recebidos", "Vencidos", "Hoje"].map(
                    (opcao) => (
                      <button
                        key={opcao}
                        onClick={() => setFiltro(opcao)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                          filtro === opcao
                            ? "bg-blue-700 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {opcao}
                      </button>
                    )
                  )}
                </div>

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
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Recebimento</th>
                      <th className="px-4 py-3">Situação</th>
                      <th className="px-4 py-3">Forma</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {contasFiltradas.map((conta) => (
                      <tr key={conta.id}>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {conta.descricao}
                        </td>

                        <td className="px-4 py-4">
                          {conta.clientes?.razao_social || "-"}
                        </td>

                        <td className="px-4 py-4 font-semibold">
                          {moeda(conta.valor)}
                        </td>

                        <td className="px-4 py-4">
                          {conta.vencimento || "-"}
                        </td>

                        <td className="px-4 py-4">
                          {conta.recebimento || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${classeSituacao(
                              conta
                            )}`}
                          >
                            {situacaoConta(conta)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {conta.forma_pagamento || "-"}
                        </td>

                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarConta(conta)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          {conta.status !== "Recebido" && (
                            <button
                              onClick={() => marcarRecebida(conta)}
                              className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                            >
                              Receber
                            </button>
                          )}

                          <button
                            onClick={() => excluirConta(conta.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {contasFiltradas.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma conta a receber encontrada.
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