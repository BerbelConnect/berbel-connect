"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const rotasPublicas = ["/login", "/recuperar-senha", "/atualizar-senha"];

const permissoes = [
  { prefixo: "/dashboard", perfis: ["Administrador", "Representante", "Financeiro", "Assistente"] },
  { prefixo: "/clientes", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/fornecedores", perfis: ["Administrador", "Assistente"] },
  { prefixo: "/representadas", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/produtos", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/pedidos", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/agenda", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/visitas", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/rotas", perfis: ["Administrador", "Representante"] },
  { prefixo: "/pipeline", perfis: ["Administrador", "Representante"] },
  { prefixo: "/ia-comercial", perfis: ["Administrador", "Representante"] },
  { prefixo: "/alertas", perfis: ["Administrador", "Representante", "Financeiro"] },
  { prefixo: "/financeiro", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/comissoes", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/relatorios-comerciais", perfis: ["Administrador", "Representante"] },
  { prefixo: "/exportacoes", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/usuarios", perfis: ["Administrador"] },
  { prefixo: "/metas", perfis: ["Administrador", "Representante"] },
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const rotaPublica = useMemo(
    () => rotasPublicas.includes(pathname),
    [pathname]
  );

  useEffect(() => {
    async function verificar() {
      setCarregando(true);

      const { data: sessao } = await supabase.auth.getSession();
      const usuario = sessao.session?.user;

      if (!usuario && !rotaPublica) {
        router.replace("/login");
        return;
      }

      if (usuario && pathname === "/login") {
        router.replace("/dashboard");
        return;
      }

      if (rotaPublica) {
        setAutorizado(true);
        setCarregando(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("perfis_usuarios")
        .select("perfil, ativo")
        .eq("email", usuario?.email)
        .single();

      if (!perfil || !perfil.ativo) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const regra = permissoes.find((item) =>
        pathname.startsWith(item.prefixo)
      );

      if (regra && !regra.perfis.includes(perfil.perfil)) {
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
  }, [pathname, rotaPublica, router]);

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
