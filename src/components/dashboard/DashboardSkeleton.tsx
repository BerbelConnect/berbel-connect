export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="h-10 w-72 rounded-full bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-[30px] bg-slate-200" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-slate-100 p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 rounded-full bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-3xl bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="rounded-[30px] border border-slate-200 bg-slate-100 p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 rounded-full bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-8 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-52 rounded-[30px] bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
