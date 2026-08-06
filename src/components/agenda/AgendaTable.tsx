import Link from "next/link";
import type { AgendaVisita } from "@/types/agenda";
import { moeda } from "@/lib/agendaHelpers";

type AgendaTableProps = {
  visitas: AgendaVisita[];
  hoje: string;
  onEdit: (visita: AgendaVisita) => void;
  onConcluir: (visita: AgendaVisita) => void;
  onArchive: (visita: AgendaVisita) => void;
};

export function AgendaTable({
  visitas,
  hoje,
  onEdit,
  onConcluir,
  onArchive,
}: AgendaTableProps) {
  return (
    <div className="space-y-4">
      {visitas.map((visita) => (
        <div key={visita.id} className="rounded-xl border p-5">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-slate-800">
                {visita.clientes?.razao_social || "-"}
              </p>

              <p className="text-sm text-slate-500">
                {visita.data_visita || "-"} às {visita.hora_visita || "--:--"}
              </p>

              <p className="text-sm text-slate-500">
                {visita.tipo_contato || "-"} • Bairro: {visita.bairro || "-"}
              </p>

              <p className="mt-2 text-sm">
                Oportunidade: {visita.oportunidade || "-"}
              </p>

              <p className="text-sm">Resultado: {visita.resultado || "-"}</p>
            </div>

            <div className="text-right">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  visita.status === "Concluída"
                    ? "bg-green-100 text-green-700"
                    : visita.data_visita < hoje
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {visita.status || "Agendada"}
              </span>

              <p className="mt-3 font-bold text-green-700">
                {moeda(visita.valor_potencial)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onEdit(visita)}
              className="rounded-lg border px-3 py-2"
            >
              Editar
            </button>

            {visita.status !== "Concluída" && visita.status !== "Cancelada" && (
              <button
                onClick={() => onConcluir(visita)}
                className="rounded-lg bg-green-100 px-3 py-2 text-green-700"
              >
                Abrir e registrar resultado
              </button>
            )}

            <button
              onClick={() => onArchive(visita)}
              className={visita.status === "Cancelada" ? "rounded-lg bg-green-100 px-3 py-2 text-green-700" : "rounded-lg bg-red-100 px-3 py-2 text-red-700"}
            >
              {visita.status === "Cancelada" ? "Reabrir" : "Cancelar"}
            </button>
            <Link href={`/pedidos?cliente_id=${encodeURIComponent(visita.cliente_id)}`} className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700">Criar pedido</Link>
          </div>
        </div>
      ))}

      {visitas.length === 0 && (
        <p className="py-8 text-center text-slate-500">
          Nenhuma visita encontrada.
        </p>
      )}
    </div>
  );
}
