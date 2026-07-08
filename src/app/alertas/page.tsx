"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function diasDesde(data?: string | null) {
  if (!data) return null;

  const hoje = new Date();
  const alvo = new Date(data);

  return Math.floor(
    (hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function moeda(valor: any) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<any[]>([]);

  async function carregar() {
    const novosAlertas: any[] = [];

    const clientesResp = await supabase
      .from("vw_alertas_comerciais")
      .select("*");

    const visitasHojeResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .eq("data_visita", new Date().toISOString().slice(0, 10));

    const contasResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)")
      .neq("status", "Recebido");

    const pipelineResp = await supabase
      .from("pipeline_comercial")
      .select("*, clientes(razao_social)")
      .eq("status", "Aberto");

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*")
      .neq("status", "Recebida");

    clientesResp.data?.forEach((cliente) => {
      const diasCompra = diasDesde(cliente.ultima_compra);
      const diasVisita = diasDesde(cliente.ultima_visita);

      if (diasCompra && diasCompra > 45) {
        novosAlertas.push({
          tipo: "compra",
          titulo: `${cliente.razao_social} sem comprar há ${diasCompra} dias`,
          detalhe: `Última compra em ${cliente.ultima_compra}`,
        });
      }

      if (diasVisita && diasVisita > 30) {
        novosAlertas.push({
          tipo: "visita",
          titulo: `${cliente.razao_social} sem visita há ${diasVisita} dias`,
          detalhe: `Última visita em ${cliente.ultima_visita}`,
        });
      }
    });

    visitasHojeResp.data?.forEach((visita) => {
      novosAlertas.push({
        tipo: "agenda",
        titulo: `Visita agendada hoje`,
        detalhe: visita.clientes?.razao_social || "-",
      });
    });

    contasResp.data?.forEach((conta) => {
      novosAlertas.push({
        tipo: "financeiro",
        titulo: `Conta pendente`,
        detalhe: `${conta.clientes?.razao_social || "-"} • ${moeda(
          conta.valor
        )}`,
      });
    });

    pipelineResp.data?.forEach((item) => {
      if (item.proximo_contato) {
        const dias = diasDesde(item.proximo_contato);

        if (dias !== null && dias > 0) {
          novosAlertas.push({
            tipo: "pipeline",
            titulo: `Contato atrasado`,
            detalhe: `${item.oportunidade} • ${item.clientes?.razao_social}`,
          });
        }
      }
    });

    const totalComissao = comissoesResp.data?.reduce(
      (soma, item) => soma + Number(item.valor_comissao || 0),
      0
    );

    if (totalComissao) {
      novosAlertas.push({
        tipo: "comissao",
        titulo: "Comissões pendentes",
        detalhe: moeda(totalComissao),
      });
    }

    setAlertas(novosAlertas);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Central de Alertas"
            subtitulo="Berbel Connect IA"
          />

          <div className="p-8">
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800">
                {alertas.length} alertas encontrados
              </h2>
            </div>

            <div className="space-y-4">
              {alertas.map((alerta, index) => (
                <div
                  key={index}
                  className="rounded-2xl border-l-4 border-amber-500 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-slate-800">
                    {alerta.titulo}
                  </h3>

                  <p className="mt-2 text-slate-600">
                    {alerta.detalhe}
                  </p>
                </div>
              ))}

              {alertas.length === 0 && (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
                  Nenhum alerta encontrado.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}