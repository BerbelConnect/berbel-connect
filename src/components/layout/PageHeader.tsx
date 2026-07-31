import Link from "next/link";

type PageHeaderProps = {
  titulo: string;
  subtitulo?: string;
  saudacao?: string;
  ultimaAtualizacao?: string | null;
};

export function PageHeader({ titulo, subtitulo, saudacao, ultimaAtualizacao }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-10 py-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {saudacao && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {saudacao}
            </span>
          )}
          <p className="text-sm font-medium text-slate-500">{subtitulo || "CRM Comercial"}</p>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
          {ultimaAtualizacao && (
            <p className="mt-2 text-sm text-slate-500">
              Última atualização em {ultimaAtualizacao}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Voltar ao painel
      </Link>
    </header>
  );
}
