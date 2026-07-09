"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const menu = [
  { nome: "Dashboard", href: "/dashboard", perfis: ["Administrador", "Representante", "Financeiro", "Assistente"] },

  { nome: "Clientes", href: "/clientes", perfis: ["Administrador", "Representante", "Assistente"] },
  { nome: "Dashboard Clientes", href: "/clientes/dashboard", perfis: ["Administrador", "Representante"] },
  { nome: "Fornecedores", href: "/fornecedores", perfis: ["Administrador", "Assistente"] },

  { nome: "Representadas", href: "/representadas", perfis: ["Administrador", "Representante", "Assistente"] },
  { nome: "Dashboard Representadas", href: "/representadas/dashboard", perfis: ["Administrador", "Representante"] },
  { nome: "Produtos", href: "/produtos", perfis: ["Administrador", "Representante", "Assistente"] },

  { nome: "Pedidos", href: "/pedidos", perfis: ["Administrador", "Representante"] },
  { nome: "Consulta de Pedidos", href: "/pedidos/consulta", perfis: ["Administrador", "Representante", "Assistente"] },

  { nome: "Agenda Inteligente", href: "/agenda", perfis: ["Administrador", "Representante", "Assistente"] },
  { nome: "Visitas", href: "/visitas", perfis: ["Administrador", "Representante", "Assistente"] },
  { nome: "Roteirizador", href: "/rotas", perfis: ["Administrador", "Representante"] },

  { nome: "Pipeline Comercial", href: "/pipeline", perfis: ["Administrador", "Representante"] },
  { nome: "Metas", href: "/metas", perfis: ["Administrador", "Representante"] },
  { nome: "IA Comercial", href: "/ia-comercial", perfis: ["Administrador", "Representante"] },
  { nome: "Central de Alertas", href: "/alertas", perfis: ["Administrador", "Representante", "Financeiro"] },

  { nome: "Financeiro", href: "/financeiro", perfis: ["Administrador", "Financeiro"] },
  { nome: "Contas a Receber", href: "/financeiro/contas-receber", perfis: ["Administrador", "Financeiro"] },
  { nome: "Contas a Pagar", href: "/financeiro/contas-pagar", perfis: ["Administrador", "Financeiro"] },
  { nome: "Fluxo de Caixa", href: "/financeiro/fluxo-caixa", perfis: ["Administrador", "Financeiro"] },
  { nome: "Comissões Financeiras", href: "/financeiro/comissoes", perfis: ["Administrador", "Financeiro"] },
  { nome: "Relatórios Financeiros", href: "/financeiro/relatorios", perfis: ["Administrador", "Financeiro"] },

  { nome: "Relatórios Comerciais", href: "/relatorios-comerciais", perfis: ["Administrador", "Representante"] },
  { nome: "Exportações", href: "/exportacoes", perfis: ["Administrador", "Financeiro"] },
  { nome: "Usuários e Perfis", href: "/usuarios", perfis: ["Administrador"] },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [perfil, setPerfil] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil() {
    setCarregando(true);

    const { data: sessao } = await supabase.auth.getSession();
    const email = sessao.session?.user.email;

    if (!email) {
      setCarregando(false);
      return;
    }

    const { data } = await supabase
      .from("perfis_usuarios")
      .select("nome, perfil, ativo")
      .eq("email", email)
      .eq("ativo", true)
      .single();

    if (data) {
      setPerfil(data.perfil);
      setNome(data.nome || email);
    } else {
      setPerfil("Sem perfil");
      setNome(email);
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarPerfil();
  }, []);

  const menuFiltrado = useMemo(() => {
    if (!perfil) return [];
    return menu.filter((item) => item.perfis.includes(perfil));
  }, [perfil]);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold">Berbel Connect</h1>
        <p className="text-sm text-slate-400">CRM para Representantes</p>

        <div className="mt-4 rounded-xl bg-slate-800 p-3">
          <p className="text-xs text-slate-400">Usuário</p>
          <p className="text-sm font-semibold">
            {carregando ? "Carregando..." : nome}
          </p>
          <p className="mt-1 text-xs text-blue-300">
            {carregando ? "Verificando perfil..." : perfil}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuFiltrado.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.nome}
            </Link>
          ))}

          {!carregando && menuFiltrado.length === 0 && (
            <p className="rounded-lg bg-red-500/20 p-4 text-sm text-red-100">
              Nenhum menu liberado para este perfil.
            </p>
          )}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={sair}
          className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}