"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

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

  async function carregarContas() {
    const { data, error } = await supabase
      .from("contas_pagar")
      .select("*")
      .order("vencimento", { ascending: true });

    if (error) return alert(error.message);
    setContas(data || []);
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
      pagamento: form.pagamento || null,
      status: form.status || "Pendente",
      forma_pagamento: form.forma_pagamento,
      observacoes: form.observacoes,
    };

    const { error } = form.id
      ? await supabase.from("contas_pagar").update(payload).eq("id", form.id)
      : await supabase.from("contas_pagar").insert(payload);

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

  async function excluirConta(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir esta conta a pagar?")) return;

    const { error } = await supabase.from("contas_pagar").delete().eq("id", id);

    if (error) return alert(error.message);
    carregarContas();
  }

  async function marcarPago(conta: any) {
    const { error } = await supabase
      .from("contas_pagar")
      .update({
        status: "Pago",
        pagamento: new Date().toISOString().slice(0, 10),
      })
      .eq("id", conta.id);

    if (error) return alert(error.message);
    carregarContas();
  }

  useEffect(() => {
    carregarContas();
  }, []);

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
    .filter((conta) => conta.status !== "Pago")
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
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar conta" : "Nova conta a pagar"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Campo label="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} />
                <Campo label="Categoria" value={form.categoria} onChange={(v) => setForm({ ...form, categoria: v })} />
                <Campo label="Fornecedor" value={form.fornecedor} onChange={(v) => setForm({ ...form, fornecedor: v })} />
                <Campo label="Valor" type="number" value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />

                <Campo label="Vencimento" type="date" value={form.vencimento} onChange={(v) => setForm({ ...form, vencimento: v })} />
                <Campo label="Pagamento" type="date" value={form.pagamento} onChange={(v) => setForm({ ...form, pagamento: v })} />
                <Campo label="Forma de pagamento" value={form.forma_pagamento} onChange={(v) => setForm({ ...form, forma_pagamento: v })} />

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                </select>

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
                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarConta(conta)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          {conta.status !== "Pago" && (
                            <button
                              onClick={() => marcarPago(conta)}
                              className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                            >
                              Pagar
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
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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