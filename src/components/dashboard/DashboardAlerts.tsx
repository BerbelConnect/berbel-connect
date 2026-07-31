import type { DashboardAlertaCliente } from "@/types/dashboard";

type DashboardAlertsProps = {
  clientesSemVisita: DashboardAlertaCliente[];
  clientesSemCompra: DashboardAlertaCliente[];
};

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-800">{titulo}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
          Alerta
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({ titulo, subtitulo, detalhe }: { titulo: string; subtitulo: string; detalhe: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
      <p className="font-semibold text-slate-900">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
      <p className="mt-3 text-sm font-semibold text-sky-700">{detalhe}</p>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
      <p className="text-lg font-semibold">Nenhum conteúdo disponível</p>
      <p className="mt-2 text-sm">{texto}</p>
    </div>
  );
}

export function DashboardAlerts({ clientesSemVisita, clientesSemCompra }: DashboardAlertsProps) {
  return (
    <>
      <Panel titulo="Clientes sem visita">
        {clientesSemVisita.slice(0, 5).map((cliente) => (
          <Item
            key={cliente.cliente_id}
            titulo={cliente.razao_social}
            subtitulo={`${cliente.cidade || "-"}/${cliente.estado || "-"}`}
            detalhe={`Última visita há ${cliente.dias_sem_visita} dias`}
          />
        ))}
        {clientesSemVisita.length === 0 && <EmptyState texto="Nenhum cliente está sem visita no momento." />}
      </Panel>

      <Panel titulo="Clientes sem compra">
        {clientesSemCompra.slice(0, 5).map((cliente) => (
          <Item
            key={cliente.cliente_id}
            titulo={cliente.razao_social}
            subtitulo={`${cliente.cidade || "-"}/${cliente.estado || "-"}`}
            detalhe={`Última compra há ${cliente.dias_sem_compra} dias`}
          />
        ))}
        {clientesSemCompra.length === 0 && <EmptyState texto="Todos os clientes compraram recentemente." />}
      </Panel>
    </>
  );
}
