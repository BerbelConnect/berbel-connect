"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const menu = [
  { nome: "Dashboard", href: "/dashboard" },

  { nome: "Clientes", href: "/clientes" },
  { nome: "Dashboard Clientes", href: "/clientes/dashboard" },

  { nome: "Fornecedores", href: "/fornecedores" },

  { nome: "Representadas", href: "/representadas" },
  { nome: "Dashboard Representadas", href: "/representadas/dashboard" },

  { nome: "Produtos", href: "/produtos" },

  { nome: "Pedidos", href: "/pedidos" },
  { nome: "Consulta de Pedidos", href: "/pedidos/consulta" },

  { nome: "Agenda Inteligente", href: "/agenda" },
  { nome: "Visitas", href: "/visitas" },
  { nome: "Roteirizador", href: "/rotas" },

  { nome: "Pipeline Comercial", href: "/pipeline" },
  { nome: "IA Comercial", href: "/ia-comercial" },
  { nome: "Central de Alertas", href: "/alertas" },

  { nome: "Financeiro", href: "/financeiro" },
  { nome: "Comissões", href: "/comissoes" },
  { nome: "Fluxo de Caixa", href: "/fluxo-caixa" },

  { nome: "Relatórios Comerciais", href: "/relatorios-comerciais" },
  { nome: "Exportações", href: "/exportacoes" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold">Berbel Connect</h1>
        <p className="text-sm text-slate-400">
          CRM para Representantes
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menu.map((item) => (
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
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={sair}
          className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}