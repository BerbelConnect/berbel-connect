type AgendaFiltersProps = {
  busca: string;
  onBuscaChange: (value: string) => void;
};

export function AgendaFilters({ busca, onBuscaChange }: AgendaFiltersProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h3 className="text-xl font-bold text-slate-800">Visitas cadastradas</h3>

      <input
        placeholder="Pesquisar agenda..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-3"
      />
    </div>
  );
}
