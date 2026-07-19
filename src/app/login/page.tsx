"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) return alert("Informe e-mail e senha.");

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) return alert(error.message);

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-blue-900 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Berbel
          </p>
          <h1 className="text-4xl font-bold text-slate-900">Connect</h1>
          <p className="mt-2 text-sm text-slate-500">
            Acesse seu ERP comercial
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-700"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-700"
          />

          <button
            onClick={entrar}
            disabled={carregando}
            className="w-full rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center">
            <Link
              href="/recuperar-senha"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
