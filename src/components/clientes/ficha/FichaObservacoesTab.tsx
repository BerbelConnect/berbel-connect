import { formatarTexto } from "./fichaHelpers";

export function FichaObservacoesTab({ observacoes }: { observacoes?: string | null }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Observações</h3>
        <p className="text-sm text-slate-500">Notas livres do cliente armazenadas no histórico.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
        {formatarTexto(observacoes)}
      </div>
    </div>
  );
}
