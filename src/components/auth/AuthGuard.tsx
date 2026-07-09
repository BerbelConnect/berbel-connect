"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const rotasPublicas = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession();
      const logado = !!data.session;
      const rotaPublica = rotasPublicas.includes(pathname);

      if (!logado && !rotaPublica) {
        router.replace("/login");
        return;
      }

      if (logado && pathname === "/login") {
        router.replace("/dashboard");
        return;
      }

      setCarregando(false);
    }

    verificarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      verificarSessao();
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

  return <>{children}</>;
}