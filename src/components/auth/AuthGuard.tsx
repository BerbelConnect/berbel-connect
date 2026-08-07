"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decidirAcesso, rotaPublica } from "@/lib/auth/permissoes";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    async function verificar() {
      setCarregando(true);

      const { data: sessao } = await supabase.auth.getSession();
      const usuario = sessao.session?.user;

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

      const { data: perfil } = await supabase
        .from("perfis_usuarios")
        .select("perfil, ativo")
        .eq("email", usuario?.email)
        .single();

      const decisao = decidirAcesso({ pathname, temUsuario: true, perfil });

      if (decisao === "encerrar-sessao") {
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

  if (!autorizado) return null;

  return <>{children}</>;
}
