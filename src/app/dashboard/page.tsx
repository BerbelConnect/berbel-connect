import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Dashboard Comercial" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card titulo="Clientes" valor="2" />
              <Card titulo="Pedidos" valor="18" />
              <Card titulo="Visitas Hoje" valor="5" />
              <Card titulo="Comissão" valor="R$ 1.250" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-slate-500">{titulo}</p>
      <h2 className="mt-2 text-3xl font-bold">{valor}</h2>
    </div>
  );
}