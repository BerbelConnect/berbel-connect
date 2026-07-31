export function DashboardInsights() {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Insights</p>
          <h2 className="text-xl font-bold text-slate-900">O que observar</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['Taxa de contatos', 'Tempo de resposta', 'Oportunidades quentes'].map((insight) => (
          <div key={insight} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">{insight}</p>
            <p className="mt-3 text-sm text-slate-500">Análises e próximos passos ainda não configurados.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
