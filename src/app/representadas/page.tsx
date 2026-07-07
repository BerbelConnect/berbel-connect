"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Representada = {
  id?: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  contato: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  comissao_padrao: string;
  prazo_pagamento_dias: string;
  observacoes: string;
  ativa: boolean;
};

const inicial: Representada = {
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  contato: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cidade: "Franca",
  estado: "SP",
  comissao_padrao: "",
  prazo_pagamento_dias: "30",
  observacoes: "",
  ativa: true,
};

export default function RepresentadasPage() {
  const [representadas, setRepresentadas] = useState<any[]>([]);
  const [form, setForm] = useState<Representada>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarRepresentadas() {
    const { data, error } = await supabase
      .from("representadas")
      .select("*")
      .order("nome_fantasia", { ascending: true });

    if (error) return alert(error.message);
    setRepresentadas(data || []);
  }

  async function salvarRepresentada() {
    if (!form.nome_fantasia.trim()) {
      alert("Informe o nome fantasia da representada.");
      return;
    }

    setCarregando(true);

    const payload = {
      nome_fantasia: form.nome_fantasia,
      razao_social: form.razao_social,
      cnpj: form.cnpj,
      contato: form.contato,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      cidade: form.cidade,
      estado: form.estado,
      comissao_padrao: Number(form.comissao_padrao || 0),
      prazo_pagamento_dias: Number(form.prazo_pagamento_dias || 30),
      observacoes: form.observacoes,
      ativa: form.ativa,
    };

    const { error } = form.id
      ? await supabase.from("representadas").update(payload).eq("id", form.id)
      : await supabase.from("representadas").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarRepresentadas();
  }

  function editarRepresentada(rep: any) {
    setForm({
      id: rep.id,
      nome_fantasia: rep.nome_fantasia || "",
      razao_social: rep.razao_social || "",
      cnpj: rep.cnpj || "",
      contato: rep.contato || "",
      telefone: rep.telefone || "",
      whatsapp: rep.whatsapp || "",
      email: rep.email || "",
      cidade: rep.cidade || "",
      estado: rep.estado || "SP",
      comissao_padrao: String(rep.comissao_padrao || ""),
      prazo_pagamento_dias: String(rep.prazo_pagamento_dias || "30"),
      observacoes: rep.observacoes || "",
      ativa: rep.ativa ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirRepresentada(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir esta representada?")) return;

    const { error } = await supabase
      .from("representadas")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);

    carregarRepresentadas();
  }

  function abrirWhatsApp(numero?: string) {
    const limpo = numero?.replace(/\D/g, "");
    if (!limpo) return alert("Representada sem WhatsApp cadastrado.");
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  useEffect(() => {
    carregarRepresentadas();
  }, []);

  const filtradas = useMemo(() => {
    const texto = busca.toLowerCase();

    return representadas.filter((rep) =>
      [
        rep.nome_fantasia,
        rep.razao_social,
        rep.cnpj,
        rep.contato,
        rep.cidade,
        rep.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [representadas, busca]);

  const ativas = representadas.filter((rep) => rep.ativa).length;
  const inativas = representadas.filter((rep) => !rep.ativa).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Representadas" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Representadas" valor={representadas.length} />
              <Card titulo="Ativas" valor={ativas} />
              <Card titulo="Inativas" valor={inativas} />
              <Card titulo="Filtradas" valor={filtradas.length} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar representada" : "Nova representada"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Campo
                  label="Nome Fantasia"
                  value={form.nome_fantasia}
                  onChange={(v) => setForm({ ...form, nome_fantasia: v })}
                />

                <Campo
                  label="Razão Social"
                  value={form.razao_social}
                  onChange={(v) => setForm({ ...form, razao_social: v })}
                />

                <Campo
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={(v) => setForm({ ...form, cnpj: v })}
                />

                <Campo
                  label="Contato Comercial"
                  value={form.contato}
                  onChange={(v) => setForm({ ...form, contato: v })}
                />

                <Campo
                  label="Telefone"
                  value={form.telefone}
                  onChange={(v) => setForm({ ...form, telefone: v })}
                />

                <Campo
                  label="WhatsApp"
                  value={form.whatsapp}
                  onChange={(v) => setForm({ ...form, whatsapp: v })}
                />

                <Campo
                  label="E-mail"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />

                <Campo
                  label="Cidade"
                  value={form.cidade}
                  onChange={(v) => setForm({ ...form, cidade: v })}
                />

                <Campo
                  label="Estado"
                  value={form.estado}
                  onChange={(v) => setForm({ ...form, estado: v })}
                />

                <Campo
                  label="Comissão padrão %"
                  type="number"
                  value={form.comissao_padrao}
                  onChange={(v) => setForm({ ...form, comissao_padrao: v })}
                />

                <Campo
                  label="Prazo pagamento dias"
                  type="number"
                  value={form.prazo_pagamento_dias}
                  onChange={(v) =>
                    setForm({ ...form, prazo_pagamento_dias: v })
                  }
                />

                <select
                  value={form.ativa ? "Ativa" : "Inativa"}
                  onChange={(e) =>
                    setForm({ ...form, ativa: e.target.value === "Ativa" })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Ativa</option>
                  <option>Inativa</option>
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
                  onClick={salvarRepresentada}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar representada"}
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
                  Representadas cadastradas
                </h3>

                <input
                  placeholder="Pesquisar representada..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Representada</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Prazo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((rep) => (
                      <tr key={rep.id}>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800">
                            {rep.nome_fantasia}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rep.razao_social || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p>{rep.contato || "-"}</p>
                          <p className="text-xs text-slate-500">
                            {rep.whatsapp || rep.telefone || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          {rep.cidade || "-"}/{rep.estado || "-"}
                        </td>

                        <td className="px-4 py-4 font-semibold text-green-700">
                          {Number(rep.comissao_padrao || 0).toFixed(2)}%
                        </td>

                        <td className="px-4 py-4">
                          {rep.prazo_pagamento_dias || 0} dias
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              rep.ativa
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rep.ativa ? "Ativa" : "Inativa"}
                          </span>
                        </td>

                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarRepresentada(rep)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => abrirWhatsApp(rep.whatsapp)}
                            className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                          >
                            WhatsApp
                          </button>

                          <button
                            onClick={() => excluirRepresentada(rep.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filtradas.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma representada cadastrada.
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
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
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