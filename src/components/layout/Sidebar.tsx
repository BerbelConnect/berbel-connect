const menu = [
  { nome: "Painel", href: "/" },
  { nome: "Dashboard", href: "/dashboard" },
  { nome: "Clientes", href: "/clientes" },
  { nome: "Fornecedores", href: "/fornecedores" },
  { nome: "Produtos", href: "/produtos" },
  { nome: "Visitas", href: "/visitas" },
  { nome: "Pedidos", href: "/pedidos" },
  { nome: "Comissões", href: "/comissoes" },
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

      <nav className="space-y-2 px-5">
        {menu.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 hover:bg-white/10"
          >
            {item.nome}
          </a>
        ))}
      </nav>
    </aside>
  );
}