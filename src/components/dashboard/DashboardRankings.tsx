import type { DashboardRankingItem } from "@/types/dashboard";

type DashboardRankingsProps = {
  topClientes: DashboardRankingItem[];
  topRepresentadas: DashboardRankingItem[];
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

export function DashboardRankings({ topClientes, topRepresentadas }: DashboardRankingsProps) {
  return (
    <>
      <Painel titulo="Top clientes">
        {topClientes.map((item, index) => (
          <Item
            key={item.nome}
            titulo={`${index + 1}. ${item.nome}`}
            subtitulo="Total comprado"
            detalhe={`R$ ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          />
        ))}
        {topClientes.length === 0 && <Vazio texto="Sem dados." />}
      </Painel>

      <Painel titulo="Top representadas">
        {topRepresentadas.map((item, index) => (
          <Item
            key={item.nome}
            titulo={`${index + 1}. ${item.nome}`}
            subtitulo="Comissão gerada"
            detalhe={`R$ ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          />
        ))}
        {topRepresentadas.length === 0 && <Vazio texto="Sem dados." />}
      </Painel>
    </>
  );
}
