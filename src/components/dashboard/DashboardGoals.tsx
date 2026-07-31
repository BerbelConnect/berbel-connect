export function DashboardGoals() {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Metas</p>
          <h2 className="text-xl font-bold text-slate-900">Principais objetivos</h2>
        </div>
      </div>

      <div className="space-y-4">
        {['Aumentar conversão', 'Reduzir pendências', 'Melhorar captação'].map((meta) => (
          <div key={meta} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{meta}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Em andamento</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: '62%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
