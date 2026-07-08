"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function diasDesde(data?: string | null) {
  if (!data) return null;

  const hoje = new Date();
  const alvo = new Date(data);

  return Math.floor(
    (hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function IAComercialPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);

  async function carregarDados() {
    const clientesResp = await supabase
      .from("vw_alertas_comerciais")
      .select("*")
      .order("total_comprado", { ascending: false });

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*")
      .neq("status", "Recebida");

    setClientes(clientesResp.data || []);
    setComissoes(comissoesResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const clientesSemCompra = clientes.filter((cliente) => {
    const dias = diasDesde(cliente.ultima_compra);
    return dias === null || dias >= 45;
  });

  const clientesSemVisita = clientes.filter((cliente) => {
    const dias = diasDesde(cliente.ultima_visita);
    return dias === null || dias >= 30;
  });

  const totalComissoesPendentes = comissoes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="IA Comercial" subtitulo="Alertas Inteligentes" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Sem compra 45+ dias" valor={clientesSemCompra.length} />
              <Card titulo="Sem visita 30+ dias" valor={clientesSemVisita.length} />
              <Card titulo="Comissões pendentes" valor={moeda(totalComissoesPendentes)} />
              <Card titulo="Clientes analisados" valor={clientes.length} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Clientes para retomar compra
                </h3>

                <div className="space-y-3">
                  {clientesSemCompra.slice(0, 10).map((cliente) => (
                    <div key={cliente.cliente_id} className="rounded-xl border p-4">
                      <p className="font-bold text-slate-800">
                        {cliente.razao_social}
                      </p>

                      <p className="text-sm text-slate-500">
                        {cliente.cidade || "-"}/{cliente.estado || "-"}
                      </p>

                      <p className="mt-2 text-sm">
                        {cliente.ultima_compra
                          ? `Última compra há ${diasDesde(cliente.ultima_compra)} dias.`
                          : "Cliente ainda não possui compra registrada."}
                      </p>

                      <p className="mt-2 font-semibold text-blue-700">
                        Total comprado: {moeda(cliente.total_comprado)}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Sugestão: entrar em contato e oferecer produtos das
                        representadas mais aderentes ao histórico do cliente.
                      </p>
                    </div>
                  ))}

                  {clientesSemCompra.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum alerta de compra encontrado.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-800">
                  Clientes para visitar
                </h3>

                <div className="space-y-3">
                  {clientesSemVisita.slice(0, 10).map((cliente) => (
                    <div key={cliente.cliente_id} className="rounded-xl border p-4">
                      <p className="font-bold text-slate-800">
                        {cliente.razao_social}
                      </p>

                      <p className="text-sm text-slate-500">
                        {cliente.cidade || "-"}/{cliente.estado || "-"}
                      </p>

                      <p className="mt-2 text-sm">
                        {cliente.ultima_visita
                          ? `Última visita há ${diasDesde(cliente.ultima_visita)} dias.`
                          : "Cliente ainda não possui visita registrada."}
                      </p>

                      <p className="mt-2 font-semibold text-green-700">
                        Comissão gerada: {moeda(cliente.comissao_gerada)}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Sugestão: agendar visita ou contato por WhatsApp.
                      </p>
                    </div>
                  ))}

                  {clientesSemVisita.length === 0 && (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum alerta de visita encontrado.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-2xl text-slate-900">{valor}</strong>
    </div>
  );
}