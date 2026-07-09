"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

const inicial = {
  email: "",
  nome: "",
  perfil: "Representante",
  ativo: true,
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [form, setForm] = useState<any>(inicial);

  async function carregar() {
    const { data, error } = await supabase
      .from("perfis_usuarios")
      .select("*")
      .order("nome");

    if (error) return alert(error.message);
    setUsuarios(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    if (!form.email.trim()) return alert("Informe o e-mail.");
    if (!form.nome.trim()) return alert("Informe o nome.");

    const payload = {
      email: form.email,
      nome: form.nome,
      perfil: form.perfil,
      ativo: form.ativo,
    };

    const { error } = form.id
      ? await supabase.from("perfis_usuarios").update(payload).eq("id", form.id)
      : await supabase.from("perfis_usuarios").insert(payload);

    if (error) return alert(error.message);

    setForm(inicial);
    carregar();
  }

  function editar(usuario: any) {
    setForm({
      id: usuario.id,
      email: usuario.email || "",
      nome: usuario.nome || "",
      perfil: usuario.perfil || "Representante",
      ativo: usuario.ativo ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(id: string) {
    if (!confirm("Deseja excluir este perfil?")) return;

    const { error } = await supabase
      .from("perfis_usuarios")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);
    carregar();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Usuários e Perfis" subtitulo="Berbel Connect" />

          <div className="p-8">
            <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-800">
                {form.id ? "Editar usuário" : "Novo perfil de usuário"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                  placeholder="Nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  placeholder="E-mail de login"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                />

                <select
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Administrador</option>
                  <option>Representante</option>
                  <option>Financeiro</option>
                  <option>Assistente</option>
                </select>

                <select
                  value={form.ativo ? "Ativo" : "Inativo"}
                  onChange={(e) =>
                    setForm({ ...form, ativo: e.target.value === "Ativo" })
                  }
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={salvar}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white"
                >
                  {form.id ? "Salvar alterações" : "Salvar usuário"}
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
                Usuários cadastrados
              </h3>

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
                        <td className="px-4 py-4 font-semibold">
                          {usuario.nome || "-"}
                        </td>

                        <td className="px-4 py-4">{usuario.email}</td>

                        <td className="px-4 py-4">{usuario.perfil}</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              usuario.ativo
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {usuario.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        <td className="space-x-2 px-4 py-4">
                          <button
                            onClick={() => editar(usuario)}
                            className="rounded-lg border px-3 py-2"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => excluir(usuario.id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}

                    {usuarios.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-slate-500"
                        >
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