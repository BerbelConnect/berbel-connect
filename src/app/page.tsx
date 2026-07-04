"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [totalClientes, setTotalClientes] = useState(0);

  async function carregarDashboard() {
    const { count } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true });

    setTotalClientes(count || 0);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <AppLayout titulo="Dashboard Comercial" subtitulo="Olá, Marcelo">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card titulo="Clientes cadastrados" valor={totalClientes} />
        <Card titulo="Fornecedores" valor="5" />
        <Card titulo="Visitas do mês" valor="0" />
        <Card titulo="Comissão prevista" valor="R$ 0,00" />
      </div>
    </AppLayout>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}