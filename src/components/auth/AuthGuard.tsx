"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decidirAcesso, rotaPublica } from "@/lib/auth/permissoes";
import {
  carregarPerfilOffline,
  limparPerfilOffline,
  salvarPerfilOffline,
} from "@/lib/auth/perfilOffline";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [erroAcesso, setErroAcesso] = useState("");

  useEffect(() => {
    async function verificar() {
      setCarregando(true);
      setErroAcesso("");

      const { data: sessao, error: erroSessao } = await supabase.auth.getSession();
      const usuario = sessao.session?.user;

      if (erroSessao && !usuario) {
        setErroAcesso("Não foi possível confirmar sua sessão. Reconecte-se e tente novamente.");
        setCarregando(false);
        return;
      }

      if (!usuario) {
        const decisao = decidirAcesso({ pathname, temUsuario: false, perfil: null });
        if (decisao === "redirecionar-login") {
          router.replace("/login");
          return;
        }
        setAutorizado(true);
        setCarregando(false);
        return;
      }

      if (pathname === "/login") {
        router.replace("/dashboard");
        return;
      }

      if (rotaPublica(pathname)) {
        setAutorizado(true);
        setCarregando(false);
        return;
      }

      const email = usuario.email ?? "";
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      let perfil = offline ? carregarPerfilOffline(email) : null;

      if (!offline) {
        const { data, error } = await supabase
          .from("perfis_usuarios")
          .select("perfil, ativo")
          .eq("email", email)
          .single();

        if (!error && data) {
          perfil = data;
          salvarPerfilOffline(email, data);
        } else {
          perfil = carregarPerfilOffline(email);
        }
      }

      if (!perfil) {
        setErroAcesso(
          offline
            ? "Conecte-se à internet uma vez para validar seu acesso neste dispositivo."
            : "Não foi possível validar seu perfil agora. Tente novamente em instantes."
        );
        setCarregando(false);
        return;
      }

      const decisao = decidirAcesso({ pathname, temUsuario: true, perfil });

      if (decisao === "encerrar-sessao") {
        limparPerfilOffline(email);
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (decisao === "redirecionar-dashboard") {
        router.replace("/dashboard");
        return;
      }

      setAutorizado(true);
      setCarregando(false);
    }

    verificar();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      verificar();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">Carregando Berbel Connect...</p>
        </div>
      </main>
    );
  }

  if (erroAcesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Acesso temporariamente indisponível</h1>
          <p className="mt-3 text-sm text-slate-600">{erroAcesso}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!autorizado) return null;

  return <>{children}</>;
}
