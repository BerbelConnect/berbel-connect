import type { ClienteStatus } from "@/types/cliente";

const statusStyles: Record<ClienteStatus, string> = {
  Ativo: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Inativo: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Prospecto: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function StatusBadge({ status }: { status: ClienteStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
