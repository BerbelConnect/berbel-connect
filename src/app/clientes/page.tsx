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
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  ativo?: boolean;
};

const inicial: Cliente = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "SP",
  observacoes: "",
  ativo: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Cliente>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

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

    setCarregando(true);

    const payload = {
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj,
      responsavel: form.responsavel,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      cep: form.cep,
      endereco: form.endereco,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,
      observacoes: form.observacoes,
      ativo: form.ativo ?? true,
    };

    const { error } = form.id
      ? await supabase.from("clientes").update(payload).eq("id", form.id)
      : await supabase.from("clientes").insert(payload);

    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarClientes();
  }

  async function excluirCliente(id?: string) {
    if (!id) return;
    if (!confirm("Deseja excluir este cliente?")) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return alert(error.message);

    carregarClientes();
  }

  function editarCliente(cliente: any) {
    setForm({
      id: cliente.id,
      razao_social: cliente.razao_social || "",
      nome_fantasia: cliente.nome_fantasia || "",
      cnpj: cliente.cnpj || "",
      responsavel: cliente.responsavel || "",
      telefone: cliente.telefone || "",
      whatsapp: cliente.whatsapp || "",
      email: cliente.email || "",
      cep: cliente.cep || "",
      endereco: cliente.endereco || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "SP",
      observacoes: cliente.observacoes || "",
      ativo: cliente.ativo ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abrirWhatsApp(numero: string) {
    const limpo = numero?.replace(/\D/g, "");
    if (!limpo) return alert("Cliente sem WhatsApp cadastrado.");
    window.open(`https://wa.me/55${limpo}`, "_blank");
  }

  function abrirMaps(cliente: Cliente) {
    const enderecoCompleto = [
      cliente.endereco,
      cliente.numero,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
      cliente.cep,
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");

    if (!cliente.endereco && !cliente.cidade) {
      alert("Cliente sem endereço ou cidade cadastrada.");
      return;
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        enderecoCompleto
      )}`,
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
        cliente.endereco,
        cliente.bairro,
        cliente.cidade,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [clientes, busca]);

  useEffect(() => {
    carregarClientes();
  }, []);  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Clientes" subtitulo="CRM Comercial" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Clientes cadastrados" valor={clientes.length} />
              <Card titulo="Clientes filtrados" valor={clientesFiltrados.length} />
              <Card titulo="Estado principal" valor="SP" />
              <Card titulo="Status" valor="Ativo" />
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar cliente" : "Novo cliente"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                <Campo label="Razão Social" value={form.razao_social} onChange={(v)=>setForm({...form,razao_social:v})}/>
                <Campo label="Nome Fantasia" value={form.nome_fantasia} onChange={(v)=>setForm({...form,nome_fantasia:v})}/>
                <Campo label="CNPJ" value={form.cnpj} onChange={(v)=>setForm({...form,cnpj:v})}/>
                <Campo label="Responsável" value={form.responsavel} onChange={(v)=>setForm({...form,responsavel:v})}/>

                <Campo label="Telefone" value={form.telefone} onChange={(v)=>setForm({...form,telefone:v})}/>
                <Campo label="WhatsApp" value={form.whatsapp} onChange={(v)=>setForm({...form,whatsapp:v})}/>
                <Campo label="E-mail" value={form.email} onChange={(v)=>setForm({...form,email:v})}/>
                <Campo label="CEP" value={form.cep} onChange={(v)=>setForm({...form,cep:v})}/>

                <Campo label="Endereço" value={form.endereco} onChange={(v)=>setForm({...form,endereco:v})}/>
                <Campo label="Número" value={form.numero} onChange={(v)=>setForm({...form,numero:v})}/>
                <Campo label="Complemento" value={form.complemento} onChange={(v)=>setForm({...form,complemento:v})}/>
                <Campo label="Bairro" value={form.bairro} onChange={(v)=>setForm({...form,bairro:v})}/>

                <Campo label="Cidade" value={form.cidade} onChange={(v)=>setForm({...form,cidade:v})}/>
                <Campo label="Estado" value={form.estado} onChange={(v)=>setForm({...form,estado:v})}/>

                <textarea
                  placeholder="Observações"
                  value={form.observacoes}
                  onChange={(e)=>setForm({...form,observacoes:e.target.value})}
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
                  onClick={()=>setForm(inicial)}
                  className="rounded-xl border px-6 py-3"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-center justify-between">

                <h3 className="text-xl font-bold">
                  Clientes cadastrados
                </h3>

                <input
                  placeholder="Pesquisar..."
                  value={busca}
                  onChange={(e)=>setBusca(e.target.value)}
                  className="w-80 rounded-xl border px-4 py-3"
                />

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-4 py-3 text-left">Empresa</th>
                      <th>Cidade</th>
                      <th>Responsável</th>
                      <th>WhatsApp</th>
                      <th>Ações</th>

                    </tr>

                  </thead>

                  <tbody>

                    {clientesFiltrados.map((cliente)=>(

                      <tr key={cliente.id} className="border-b">

                        <td className="px-4 py-4 font-semibold">
                          {cliente.razao_social}
                        </td>

                        <td>
                          {cliente.cidade}/{cliente.estado}
                        </td>

                        <td>
                          {cliente.responsavel}
                        </td>

                        <td>
                          {cliente.whatsapp}
                        </td>

                        <td className="space-x-2">

                          <button
                            onClick={()=>editarCliente(cliente)}
                            className="rounded-lg border px-3 py-2"
                          >
                            Editar
                          </button>

                          <button
                            onClick={()=>abrirWhatsApp(cliente.whatsapp)}
                            className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
                          >
                            WhatsApp
                          </button>

                          <button
                            onClick={()=>abrirMaps(cliente)}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700"
                          >
                            Maps
                          </button>

                          <button
                            onClick={()=>excluirCliente(cliente.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>

                        </td>

                      </tr>

                    ))}

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

function Card({
  titulo,
  valor,
}:{
  titulo:string;
  valor:string|number;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl">{valor}</strong>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}:{
  label:string;
  value:string;
  onChange:(v:string)=>void;
}) {
  return (
    <input
      placeholder={label}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600"
    />
  );
}