import type { DashboardAlertaCliente } from "@/types/dashboard";

type DashboardAlertsProps = {
  clientesSemVisita: DashboardAlertaCliente[];
  clientesSemCompra: DashboardAlertaCliente[];
};

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold text-slate-800">{titulo}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({ titulo, subtitulo, detalhe }: { titulo: string; subtitulo: string; detalhe: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-bold text-slate-800">{titulo}</p>
      <p className="text-sm text-slate-500">{subtitulo}</p>
      <p className="mt-2 text-sm font-semibold text-blue-700">{detalhe}</p>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-slate-500">{texto}</p>;
}

export function DashboardAlerts({ clientesSemVisita, clientesSemCompra }: DashboardAlertsProps) {
  return (
    <>
      <Painel titulo="Clientes sem visita">
        {clientesSemVisita.slice(0, 5).map((cliente) => (
          <Item
            key={cliente.cliente_id}
            titulo={cliente.razao_social}
            subtitulo={`${cliente.cidade || "-"}/${cliente.estado || "-"}`}
            detalhe={`Última visita há ${cliente.dias_sem_visita} dias`}
          />
        ))}
        {clientesSemVisita.length === 0 && <Vazio texto="Nenhum alerta." />}
      </Painel>

      <Painel titulo="Clientes sem compra">
        {clientesSemCompra.slice(0, 5).map((cliente) => (
          <Item
            key={cliente.cliente_id}
            titulo={cliente.razao_social}
            subtitulo={`${cliente.cidade || "-"}/${cliente.estado || "-"}`}
            detalhe={`Última compra há ${cliente.dias_sem_compra} dias`}
          />
        ))}
        {clientesSemCompra.length === 0 && <Vazio texto="Nenhum alerta." />}
      </Painel>
    </>
  );
}
