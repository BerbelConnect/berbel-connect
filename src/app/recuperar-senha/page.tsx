"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    setCarregando(true);
    const redirectTo = `${window.location.origin}/atualizar-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setCarregando(false);

    if (error) {
      setErro("Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.");
      return;
    }

    setMensagem(
      "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Verifique também a caixa de spam."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-blue-900 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Berbel Connect</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Recuperar senha</h1>
          <p className="mt-2 text-sm text-slate-500">
            Informe o e-mail usado para entrar no sistema.
          </p>
        </div>

        <form className="space-y-4" onSubmit={enviar}>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:border-blue-700"
          />

          {erro && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
          {mensagem && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{mensagem}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-blue-700 hover:underline">
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  );
}
