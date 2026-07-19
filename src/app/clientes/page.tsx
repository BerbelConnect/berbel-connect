"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  observacoes: string;
  ativo?: boolean;
  responsavel_perfil_id?: string;
};

type Representante = {
  id: string;
  nome: string | null;
  email: string;
};

const inicial: Cliente = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  endereco: "",
  numero: "",
  bairro: "",
  cep: "",
  cidade: "Franca",
  estado: "SP",
  observacoes: "",
  ativo: true,
  responsavel_perfil_id: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Cliente>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [perfilAtual, setPerfilAtual] = useState("");
  const [representantes, setRepresentantes] = useState<Representante[]>([]);

  const administrador = perfilAtual === "Administrador";

  function nomeRepresentante(id?: string) {
    const representante = representantes.find((item) => item.id === id);
    return representante?.nome || representante?.email || "-";
  }

  async function carregarAcesso() {
    const { data: usuario } = await supabase.auth.getUser();
    const emailUsuario = usuario.user?.email;
    if (!emailUsuario) return;

    const { data: perfil } = await supabase
      .from("perfis_usuarios")
      .select("perfil")
      .ilike("email", emailUsuario)
      .single();

    setPerfilAtual(perfil?.perfil || "");

    const { data: lista, error } = await supabase
      .from("perfis_usuarios")
      .select("id, nome, email")
      .eq("perfil", "Representante")
      .eq("ativo", true)
      .order("nome");

    if (error) return alert(error.message);
    const representantesAtivos = lista || [];
    setRepresentantes(representantesAtivos);

    if (perfil?.perfil === "Administrador" && representantesAtivos.length === 1) {
      setForm((atual) =>
        atual.id || atual.responsavel_perfil_id
          ? atual
          : { ...atual, responsavel_perfil_id: representantesAtivos[0].id }
      );
    }
  }

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("razao_social", { ascending: true });

    if (error) return alert(error.message);
    setClientes(data || []);
  }

  async function salvarCliente() {
    if (!form.razao_social.trim()) return alert("Informe a razão social.");
    if (administrador && !form.responsavel_perfil_id) {
      return alert("Selecione o representante responsável pela carteira.");
    }

    setCarregando(true);

    const payload = {
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj,
      responsavel: form.responsavel,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      endereco: form.endereco,
      numero: form.numero,
      bairro: form.bairro,
      cep: form.cep,
      cidade: form.cidade,
      estado: form.estado,
      observacoes: form.observacoes,
      ativo: form.ativo,
      responsavel_perfil_id: form.responsavel_perfil_id || undefined,
    };

    const { error } = form.id
      ? await supabase.from("clientes").update(payload).eq("id", form.id)
      : await supabase.from("clientes").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm({
      ...inicial,
      responsavel_perfil_id:
        administrador && representantes.length === 1
          ? representantes[0].id
          : "",
    });
    carregarClientes();
  }

  function editarCliente(cliente: Cliente) {
    setForm({
      id: cliente.id,
      razao_social: cliente.razao_social || "",
      nome_fantasia: cliente.nome_fantasia || "",
      cnpj: cliente.cnpj || "",
      responsavel: cliente.responsavel || "",
      telefone: cliente.telefone || "",
      whatsapp: cliente.whatsapp || "",
      email: cliente.email || "",
      endereco: cliente.endereco || "",
      numero: cliente.numero || "",
      bairro: cliente.bairro || "",
      cep: cliente.cep || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "SP",
      observacoes: cliente.observacoes || "",
      ativo: cliente.ativo ?? true,
      responsavel_perfil_id: cliente.responsavel_perfil_id || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirCliente(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este cliente?")) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarClientes();
  }

  function abrirWhatsApp(numero?: string) {
    const limpo = numero?.replace(/\D/g, "");
    if (!limpo) return alert("Cliente sem WhatsApp cadastrado.");
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  function abrirMapa(cliente: Cliente) {
    const endereco = encodeURIComponent(
      `${cliente.endereco || ""}, ${cliente.numero || ""}, ${cliente.bairro || ""}, ${cliente.cidade || ""} - ${cliente.estado || ""}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${endereco}`,
      "_blank"
    );
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return clientes.filter((cliente) =>
      [
        cliente.razao_social,
        cliente.nome_fantasia,
        cliente.cnpj,
        cliente.responsavel,
        cliente.bairro,
        cliente.cidade,
        cliente.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [clientes, busca]);

  const ativos = clientes.filter((c) => c.ativo !== false).length;
  const bairros = new Set(clientes.map((c) => c.bairro).filter(Boolean)).size;

  useEffect(() => {
    const carregamento = window.setTimeout(() => {
      void carregarClientes();
      void carregarAcesso();
    }, 0);

    return () => window.clearTimeout(carregamento);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Clientes V2" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes" valor={clientes.length} />
              <Card titulo="Ativos" valor={ativos} />
              <Card titulo="Bairros" valor={bairros} />
              <Card titulo="Filtrados" valor={clientesFiltrados.length} />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar cliente" : "Novo cliente"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Campo label="Razão Social" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} />
                <Campo label="Nome Fantasia" value={form.nome_fantasia} onChange={(v) => setForm({ ...form, nome_fantasia: v })} />
                <Campo label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
                <Campo label="Contato no cliente" value={form.responsavel} onChange={(v) => setForm({ ...form, responsavel: v })} />

                <Campo label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
                <Campo label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                <Campo label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Campo label="CEP" value={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />

                <Campo label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
                <Campo label="Número" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
                <Campo label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
                <Campo label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />

                <Campo label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />

                {administrador ? (
                  <select
                    value={form.responsavel_perfil_id || ""}
                    onChange={(e) =>
                      setForm({ ...form, responsavel_perfil_id: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">Representante responsável</option>
                    {representantes.map((representante) => (
                      <option key={representante.id} value={representante.id}>
                        {representante.nome || representante.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Carteira: {nomeRepresentante(form.responsavel_perfil_id)}
                  </div>
                )}

                <select
                  value={form.ativo ? "Ativo" : "Inativo"}
                  onChange={(e) =>
                    setForm({ ...form, ativo: e.target.value === "Ativo" })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
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
                  onClick={salvarCliente}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  {carregando
                    ? "Salvando..."
                    : form.id
                    ? "Salvar alterações"
                    : "Salvar cliente"}
                </button>

                <button
                  onClick={() =>
                    setForm({
                      ...inicial,
                      responsavel_perfil_id:
                        administrador && representantes.length === 1
                          ? representantes[0].id
                          : "",
                    })
                  }
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Clientes cadastrados
                </h3>

                <input
                  placeholder="Pesquisar cliente, bairro ou cidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Representante</th>
                      <th className="px-4 py-3">Endereço</th>
                      <th className="px-4 py-3">Bairro</th>
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">
                            {cliente.razao_social}
                          </p>
                          <p className="text-xs text-slate-500">
                            {cliente.nome_fantasia || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          {cliente.responsavel || "-"}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-700">
                          {nomeRepresentante(cliente.responsavel_perfil_id)}
                        </td>

                        <td className="px-4 py-4">
                          {cliente.endereco || "-"}, {cliente.numero || "-"}
                        </td>

                        <td className="px-4 py-4">{cliente.bairro || "-"}</td>

                        <td className="px-4 py-4">
                          {cliente.cidade || "-"}/{cliente.estado || "-"}
                        </td>

                        <td className="px-4 py-4">{cliente.whatsapp || "-"}</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              cliente.ativo === false
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {cliente.ativo === false ? "Inativo" : "Ativo"}
                          </span>
                        </td>

                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editarCliente(cliente)}
                            className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => abrirWhatsApp(cliente.whatsapp)}
                            className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                          >
                            WhatsApp
                          </button>

                          <button
                            onClick={() => abrirMapa(cliente)}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                          >
                            Maps
                          </button>

                          {administrador && (
                            <button
                              onClick={() => excluirCliente(cliente.id)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {clientesFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhum cliente encontrado.
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
