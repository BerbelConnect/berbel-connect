import { diasDoCalendarioMes } from "@/lib/agendaPeriodo";
import type { AgendaVisita } from "@/types/agenda";

export function AgendaCalendar({ referencia, visitas }: { referencia: string; visitas: AgendaVisita[] }) {
  const dias = diasDoCalendarioMes(referencia);
  const porDia = new Map<string, AgendaVisita[]>();
  visitas.forEach((visita) => porDia.set(visita.data_visita, [...(porDia.get(visita.data_visita) || []), visita]));

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 text-center text-xs font-bold uppercase text-slate-500">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((dia) => <div key={dia} className="p-2">{dia}</div>)}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">
          {dias.map((dia) => (
            <div key={dia.data} className={`min-h-24 border-b border-r p-2 ${dia.pertenceAoMes ? "bg-white" : "bg-slate-50 text-slate-400"}`}>
              <span className="text-xs font-bold">{Number(dia.data.slice(-2))}</span>
              {(porDia.get(dia.data) || []).slice(0, 3).map((visita) => (
                <div key={visita.id} className="mt-1 truncate rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
                  {visita.hora_visita?.slice(0, 5) || "--:--"} {visita.clientes?.razao_social || "Visita"}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
