import { moeda } from "@/lib/agendaHelpers";

type AgendaCardsProps = {
  hojeCount: number;
  atrasadasCount: number;
  proximasCount: number;
  concluidasCount: number;
  potencialTotal: number;
};

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}

export function AgendaCards({
  hojeCount,
  atrasadasCount,
  proximasCount,
  concluidasCount,
  potencialTotal,
}: AgendaCardsProps) {
  return (
    <>
      <Card titulo="Hoje" valor={hojeCount} />
      <Card titulo="Atrasadas" valor={atrasadasCount} />
      <Card titulo="Próximas" valor={proximasCount} />
      <Card titulo="Concluídas" valor={concluidasCount} />
      <Card titulo="Potencial" valor={moeda(potencialTotal)} />
    </>
  );
}
