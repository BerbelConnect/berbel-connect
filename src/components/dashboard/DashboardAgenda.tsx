import type { DashboardPedidoResumo, DashboardVisitaResumo } from "@/types/dashboard";

type DashboardAgendaProps = {
  visitasHoje: DashboardVisitaResumo[];
  pedidosRecentes: DashboardPedidoResumo[];
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

export function DashboardAgenda({ visitasHoje, pedidosRecentes }: DashboardAgendaProps) {
  return (
    <>
      <Painel titulo="Agenda de hoje">
        {visitasHoje.map((visita) => (
          <Item
            key={visita.id}
            titulo={visita.cliente_nome || "-"}
            subtitulo={`${visita.hora_visita || "--:--"} • ${visita.tipo_contato || "Visita"}`}
            detalhe={visita.status || "Agendada"}
          />
        ))}
        {visitasHoje.length === 0 && <Vazio texto="Nenhuma visita para hoje." />}
      </Painel>

      <Painel titulo="Pedidos recentes">
        {pedidosRecentes.map((pedido) => (
          <Item
            key={pedido.id}
            titulo={pedido.numero || pedido.id}
            subtitulo={pedido.cliente_nome || "-"}
            detalhe={`R$ ${pedido.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • ${pedido.status || "-"}`}
          />
        ))}
        {pedidosRecentes.length === 0 && <Vazio texto="Nenhum pedido cadastrado." />}
      </Painel>
    </>
  );
}
