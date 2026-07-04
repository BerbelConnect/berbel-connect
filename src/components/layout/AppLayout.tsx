type AppLayoutProps = {
  children: React.ReactNode;
  titulo: string;
  subtitulo?: string;
};

export default function AppLayout({ children, titulo, subtitulo }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-blue-950 text-white">
          <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-blue-300">Berbel</p>
            <h1 className="text-2xl font-bold">Connect</h1>
          </div>

          <nav className="space-y-2 px-4">
            <a href="/" className="block rounded-xl px-4 py-3 hover:bg-blue-900">Painel</a>
            <a href="/clientes" className="block rounded-xl px-4 py-3 hover:bg-blue-900">Clientes</a>
            <a href="/fornecedores" className="block rounded-xl px-4 py-3 hover:bg-blue-900">Fornecedores</a>
            <a href="/produtos" className="block rounded-xl px-4 py-3 hover:bg-blue-900">Produtos</a>
            <span className="block rounded-xl px-4 py-3 text-blue-200">Agenda</span>
            <span className="block rounded-xl px-4 py-3 text-blue-200">Visitas</span>
            <span className="block rounded-xl px-4 py-3 text-blue-200">Pedidos</span>
            <span className="block rounded-xl px-4 py-3 text-blue-200">Comissões</span>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b bg-white px-8 py-5">
            <p className="text-sm text-slate-500">{subtitulo || "Berbel Connect"}</p>
            <h2 className="text-2xl font-bold text-slate-900">{titulo}</h2>
          </header>

          <div className="p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}