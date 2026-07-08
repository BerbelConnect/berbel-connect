const menu = [
  { nome: "Painel", href: "/" },
  { nome: "Dashboard", href: "/dashboard" },

  { nome: "Clientes", href: "/clientes" },
  { nome: "Fornecedores", href: "/fornecedores" },
  { nome: "Representadas", href: "/representadas" },
  { nome: "Produtos", href: "/produtos" },

  { nome: "Visitas", href: "/visitas" },
  { nome: "Agenda", href: "/agenda" },

  { nome: "Pedidos", href: "/pedidos" },
  { nome: "Consultar Pedidos", href: "/pedidos/consulta" },

  { nome: "Financeiro", href: "/financeiro" },
  { nome: "Contas a Receber", href: "/financeiro/contas-receber" },
  { nome: "Contas a Pagar", href: "/financeiro/contas-pagar" },
  { nome: "Fluxo de Caixa", href: "/financeiro/fluxo-caixa" },
  { nome: "Comissões Financeiras", href: "/financeiro/comissoes" },
  { nome: "Relatórios Financeiros", href: "/financeiro/relatorios" },

  { nome: "Inteligência Comercial", href: "/inteligencia" },

  { nome: "Metas", href: "/metas" },

  { nome: "Pipeline Comercial", href: "/pipeline" },

  { nome: "Dashboard Representadas", href: "/representadas/dashboard" },

  { nome: "IA Comercial", href: "/ia-comercial" },

  { nome: "Relatórios Comerciais", href: "/relatorios-comerciais" },

  { nome: "Central de Alertas", href: "/alertas" },

  { nome: "Roteirizador", href: "/rotas" },
];

export function Sidebar() {
  return (
    <aside className="min-h-screen w-64 bg-gradient-to-b from-slate-950 to-blue-900 text-white">
      <div className="p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
          Berbel
        </p>
        <h1 className="text-3xl font-bold">Connect</h1>
      </div>

      <nav className="space-y-1 px-5 pb-8">
        {menu.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            {item.nome}
          </a>
        ))}
      </nav>
    </aside>
  );
}