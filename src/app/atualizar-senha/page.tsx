"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AtualizarSenhaPage() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [sessaoValida, setSessaoValida] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessaoValida(Boolean(data.session));
      setVerificando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY" || sessao) {
        setSessaoValida(true);
        setVerificando(false);
      }
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function atualizar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (senha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas informadas não são iguais.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro("Não foi possível atualizar a senha. Solicite um novo link de recuperação.");
      return;
    }

    await supabase.auth.signOut();
    setMensagem("Senha atualizada com sucesso. Você já pode entrar com a nova senha.");
    setSenha("");
    setConfirmacao("");
    setSessaoValida(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-blue-900 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Berbel Connect</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Criar nova senha</h1>
        </div>

        {verificando ? (
          <p className="text-center text-sm text-slate-500">Validando o link de recuperação...</p>
        ) : mensagem ? (
          <div className="space-y-5 text-center">
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{mensagem}</p>
            <Link href="/login" className="inline-block font-bold text-blue-700 hover:underline">
              Entrar no Berbel Connect
            </Link>
          </div>
        ) : !sessaoValida ? (
          <div className="space-y-5 text-center">
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Este link é inválido ou expirou. Solicite um novo e-mail de recuperação.
            </p>
            <Link href="/recuperar-senha" className="inline-block font-bold text-blue-700 hover:underline">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={atualizar}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="senha">
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:border-blue-700"
              />
              <p className="mt-1 text-xs text-slate-500">Use pelo menos 8 caracteres.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="confirmacao">
                Confirmar nova senha
              </label>
              <input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(evento) => setConfirmacao(evento.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:border-blue-700"
              />
            </div>

            {erro && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Atualizando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
