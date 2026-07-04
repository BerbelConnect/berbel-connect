type PageHeaderProps = {
  titulo: string;
  subtitulo?: string;
};

export function PageHeader({ titulo, subtitulo }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-10 py-7">
      <div>
        <p className="text-sm font-medium text-slate-500">
          {subtitulo || "CRM Comercial"}
        </p>
        <h2 className="text-3xl font-bold text-slate-900">{titulo}</h2>
      </div>

      <a
        href="/"
        className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
      >
        Voltar ao painel
      </a>
    </header>
  );
}