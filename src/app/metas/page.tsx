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

const inicial = {
  titulo: "",
  tipo: "Vendas",
  valor_meta: "",
  periodo: "Mensal",
  mes: String(new Date().getMonth() + 1),
  ano: String(new Date().getFullYear()),
  observacoes: "",
};

export default function MetasPage() {
  const [metas, setMetas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [form, setForm] = useState<any>(inicial);

  async function carregarDados() {
    const metasResp = await supabase
      .from("metas_comerciais")
      .select("*")
      .order("created_at", { ascending: false });

    const pedidosResp = await supabase.from("pedidos").select("*");
    const comissoesResp = await supabase.from("comissoes_financeiro").select("*");

    setMetas(metasResp.data || []);
    setPedidos(pedidosResp.data || []);
    setComissoes(comissoesResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarMeta() {
    if (!form.titulo.trim()) return alert("Informe o título da meta.");
    if (!form.valor_meta) return alert("Informe o valor da meta.");

    const payload = {
      titulo: form.titulo,
      tipo: form.tipo,
      valor_meta: Number(form.valor_meta || 0),
      periodo: form.periodo,
      mes: Number(form.mes || 0),
      ano: Number(form.ano || 0),
      observacoes: form.observacoes,
    };

    const { error } = form.id
      ? await supabase.from("metas_comerciais").update(payload).eq("id", form.id)
      : await supabase.from("metas_comerciais").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  async function excluirMeta(id: string) {
    if (!confirm("Deseja excluir esta meta?")) return;

    const { error } = await supabase.from("metas_comerciais").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarDados();
  }

  const totalVendas = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_total || 0),
    0
  );

  const totalComissoes = comissoes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  function realizado(meta: any) {
    if (meta.tipo === "Comissões") return totalComissoes;
    return totalVendas;
  }

  function percentual(meta: any) {
    const valorMeta = Number(meta.valor_meta || 0);
    if (!valorMeta) return 0;
    return Math.min((realizado(meta) / valorMeta) * 100, 100);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Metas Comerciais" subtitulo="Berbel Connect" />

          <div className="p-8">
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar meta" : "Nova meta"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                  placeholder="Título da meta"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Vendas</option>
                  <option>Comissões</option>
                </select>

                <input
                  type="number"
                  placeholder="Valor da meta"
                  value={form.valor_meta}
                  onChange={(e) =>
                    setForm({ ...form, valor_meta: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <select
                  value={form.periodo}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Mensal</option>
                  <option>Anual</option>
                </select>

                <input
                  type="number"
                  placeholder="Mês"
                  value={form.mes}
                  onChange={(e) => setForm({ ...form, mes: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  type="number"
                  placeholder="Ano"
                  value={form.ano}
                  onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  className="rounded-xl border px-4 py-3 md:col-span-4"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvarMeta}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
                >
                  {form.id ? "Salvar alterações" : "Salvar meta"}
                </button>

                <button
                  onClick={() => setForm(inicial)}
                  className="rounded-xl border px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                Metas cadastradas
              </h3>

              <div className="space-y-4">
                {metas.map((meta) => (
                  <div key={meta.id} className="rounded-xl border p-5">
                    <div className="mb-3 flex justify-between">
                      <div>
                        <p className="text-lg font-bold">{meta.titulo}</p>
                        <p className="text-sm text-slate-500">
                          {meta.tipo} • {meta.periodo} • {meta.mes}/{meta.ano}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-blue-700">
                          {moeda(realizado(meta))} / {moeda(meta.valor_meta)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {percentual(meta).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{ width: `${percentual(meta)}%` }}
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          setForm({
                            id: meta.id,
                            titulo: meta.titulo || "",
                            tipo: meta.tipo || "Vendas",
                            valor_meta: String(meta.valor_meta || ""),
                            periodo: meta.periodo || "Mensal",
                            mes: String(meta.mes || ""),
                            ano: String(meta.ano || ""),
                            observacoes: meta.observacoes || "",
                          })
                        }
                        className="rounded-lg border px-3 py-2"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirMeta(meta.id)}
                        className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}

                {metas.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    Nenhuma meta cadastrada.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}