"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id: string;
  email: string;
  nome: string | null;
  perfil: string | null;
  ativo: boolean | null;
};

type Formulario = {
  id?: string;
  email: string;
  nome: string;
  perfil: string;
  ativo: boolean;
};

const inicial: Formulario = {
  email: "",
  nome: "",
  perfil: "Representante",
  ativo: true,
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState<Formulario>(inicial);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const { data, error } = await supabase
      .from("perfis_usuarios")
      .select("id, email, nome, perfil, ativo")
      .order("nome");

    if (error) return alert(error.message);
    setUsuarios(data || []);
  }

  useEffect(() => {
    const carregamento = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(carregamento);
  }, []);

  async function salvar() {
    setMensagem("");
    if (!form.email.trim()) return alert("Informe o e-mail.");
    if (!form.nome.trim()) return alert("Informe o nome.");

    setCarregando(true);

    if (form.id) {
      const { error } = await supabase
        .from("perfis_usuarios")
        .update({
          nome: form.nome.trim(),
          perfil: form.perfil,
          ativo: form.ativo,
        })
        .eq("id", form.id);

      setCarregando(false);
      if (error) return alert(error.message);
      setMensagem("Perfil atualizado com sucesso.");
    } else {
      const { data, error } = await supabase.functions.invoke("convidar-representante", {
        body: {
          email: form.email.trim(),
          nome: form.nome.trim(),
        },
      });

      setCarregando(false);
      if (error) return alert("Não foi possível enviar o convite. Tente novamente mais tarde.");
      if (!data?.ok) return alert(data?.erro || "Não foi possível criar o acesso.");
      setMensagem("Convite enviado. O Representante deve abrir o e-mail para criar a senha.");
    }

    setForm(inicial);
    await carregar();
  }

  function editar(usuario: Usuario) {
    setMensagem("");
    setForm({
      id: usuario.id,
      email: usuario.email || "",
      nome: usuario.nome || "",
      perfil: usuario.perfil || "Representante",
      ativo: usuario.ativo ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />
        <section className="flex-1">
          <PageHeader titulo="Usuários e Perfis" subtitulo="Berbel Connect" />

          <div className="p-8">
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-slate-800">
                {form.id ? "Editar perfil" : "Convidar Representante"}
              </h3>
              <p className="mb-5 text-sm text-slate-500">
                {form.id
                  ? "O e-mail de login não pode ser alterado por esta tela."
                  : "O Representante receberá um e-mail seguro para criar a própria senha."}
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                  placeholder="Nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />
                <input
                  type="email"
                  placeholder="E-mail de login"
                  value={form.email}
                  disabled={Boolean(form.id)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border px-4 py-3 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <select
                  value={form.perfil}
                  disabled={!form.id}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                  className="rounded-xl border px-4 py-3 disabled:bg-slate-100"
                >
                  <option>Representante</option>
                  <option>Administrador</option>
                  <option>Financeiro</option>
                  <option>Assistente</option>
                </select>
                <select
                  value={form.ativo ? "Ativo" : "Inativo"}
                  disabled={!form.id}
                  onChange={(e) => setForm({ ...form, ativo: e.target.value === "Ativo" })}
                  className="rounded-xl border px-4 py-3 disabled:bg-slate-100"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>

              {mensagem && (
                <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{mensagem}</p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvar}
                  disabled={carregando}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {carregando
                    ? "Processando..."
                    : form.id
                      ? "Salvar alterações"
                      : "Enviar convite"}
                </button>
                <button
                  onClick={() => {
                    setForm(inicial);
                    setMensagem("");
                  }}
                  className="rounded-xl border px-6 py-3 font-semibold"
                >
                  Limpar
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">Usuários cadastrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Perfil</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td className="px-4 py-4 font-semibold">{usuario.nome || "-"}</td>
                        <td className="px-4 py-4">{usuario.email}</td>
                        <td className="px-4 py-4">{usuario.perfil}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            usuario.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {usuario.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => editar(usuario)} className="rounded-lg border px-3 py-2">
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Nenhum usuário cadastrado.
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
