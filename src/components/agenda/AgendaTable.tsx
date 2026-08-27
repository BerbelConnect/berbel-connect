import Link from "next/link";
import { nomeExibicaoVisita, type AgendaVisita } from "@/types/agenda";
import { moeda } from "@/lib/agendaHelpers";

type AgendaTableProps = {
  visitas: AgendaVisita[];
  hoje: string;
  onEdit: (visita: AgendaVisita) => void;
  onConcluir: (visita: AgendaVisita) => void;
  onIniciar: (visita: AgendaVisita) => void;
  onArchive: (visita: AgendaVisita) => void;
};

export function AgendaTable({
  visitas,
  hoje,
  onEdit,
  onConcluir,
  onIniciar,
  onArchive,
}: AgendaTableProps) {
  return (
    <div className="space-y-4">
      {visitas.map((visita) => (
        <div key={visita.id} className="rounded-xl border p-5">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-slate-800">
                {nomeExibicaoVisita(visita)}
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
              {(visita.checklist?.length || 0) > 0 && <p className="mt-2 text-sm font-semibold text-slate-600">Checklist: {visita.checklist?.filter((item) => item.concluido).length}/{visita.checklist?.length}</p>}
              <p className="text-sm text-slate-500">Prioridade: {visita.prioridade || "Normal"}{visita.prazo_resolucao ? ` • Prazo: ${visita.prazo_resolucao}` : ""}</p>
              {visita.visita_origem_id && <p className="mt-2 text-sm font-semibold text-blue-700">Retorno vinculado a uma visita anterior</p>}
              {visita.retorno_criado_id && <p className="mt-2 text-sm font-semibold text-green-700">Próxima ação agendada</p>}
              {(visita.quantidade_transferencias || 0) > 0 && <p className="mt-2 text-sm font-semibold text-amber-700">Transferida {visita.quantidade_transferencias}x • Data original: {visita.data_original || "-"}</p>}
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
            {visita.status === "Agendada" && <button onClick={() => onIniciar(visita)} className="rounded-lg bg-amber-100 px-3 py-2 font-semibold text-amber-800">Iniciar visita</button>}
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
            {visita.status === "Concluída" && (
              <button
                onClick={() => onConcluir(visita)}
                className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700"
              >
                Ver registro
              </button>
            )}

            <button
              onClick={() => onArchive(visita)}
              className={visita.status === "Cancelada" ? "rounded-lg bg-green-100 px-3 py-2 text-green-700" : "rounded-lg bg-red-100 px-3 py-2 text-red-700"}
            >
              {visita.status === "Cancelada" ? "Reabrir" : "Cancelar"}
            </button>
            {visita.cliente_id && <Link href={`/pedidos?cliente_id=${encodeURIComponent(visita.cliente_id)}`} className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700">Criar pedido</Link>}
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
