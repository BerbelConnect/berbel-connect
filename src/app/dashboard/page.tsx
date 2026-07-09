"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (!data) return 999;

  const hoje = new Date();
  const alvo = new Date(data);

  return Math.floor(
    (hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [receber, setReceber] = useState<any[]>([]);
  const [pagar, setPagar] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [alertasClientes, setAlertasClientes] = useState<any[]>([]);

  async function carregarDados() {
    const pedidosResp = await supabase
      .from("pedidos")
      .select("*, clientes(razao_social), pedido_itens(*)")
      .order("created_at", { ascending: false });

    const receberResp = await supabase
      .from("contas_receber")
      .select("*, clientes(razao_social)");

    const pagarResp = await supabase.from("contas_pagar").select("*");

    const comissoesResp = await supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)");

    const clientesResp = await supabase.from("clientes").select("*");

    const visitasResp = await supabase
      .from("visitas")
      .select("*, clientes(razao_social)")
      .order("data_visita", { ascending: true });

    const pipelineResp = await supabase
      .from("pipeline_comercial")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false });

    const alertasResp = await supabase
      .from("vw_alertas_comerciais")
      .select("*");

    setPedidos(pedidosResp.data || []);
    setReceber(receberResp.data || []);
    setPagar(pagarResp.data || []);
    setComissoes(comissoesResp.data || []);
    setClientes(clientesResp.data || []);
    setVisitas(visitasResp.data || []);
    setPipeline(pipelineResp.data || []);
    setAlertasClientes(alertasResp.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const totalVendido = pedidos.reduce(
    (soma, pedido) => soma + Number(pedido.valor_total || 0),
    0
  );

  const totalComissao = comissoes.reduce(
    (soma, item) => soma + Number(item.valor_comissao || 0),
    0
  );

  const comissaoRecebida = comissoes
    .filter((item) => item.status === "Recebida")
    .reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0);

  const comissaoPendente = totalComissao - comissaoRecebida;

  const totalReceber = receber
    .filter((item) => item.status !== "Recebido")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalPagar = pagar
    .filter((item) => item.status !== "Pago")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const saldoPrevisto = totalReceber - totalPagar;

  const visitasHoje = visitas.filter((visita) => visita.data_visita === hoje);

  const visitasAtrasadas = visitas.filter(
    (visita) => visita.data_visita < hoje && visita.status !== "Concluída"
  );

  const pipelineAberto = pipeline.filter((item) => item.status === "Aberto");

  const valorPipeline = pipelineAberto.reduce(
    (soma, item) => soma + Number(item.valor_estimado || 0),
    0
  );

  const clientesSemCompra = alertasClientes
    .map((cliente) => ({
      ...cliente,
      dias_sem_compra: diasDesde(cliente.ultima_compra),
    }))
    .filter((cliente) => cliente.dias_sem_compra >= 45)
    .sort((a, b) => b.dias_sem_compra - a.dias_sem_compra);

  const clientesSemVisita = alertasClientes
    .map((cliente) => ({
      ...cliente,
      dias_sem_visita: diasDesde(cliente.ultima_visita),
    }))
    .filter((cliente) => cliente.dias_sem_visita >= 30)
    .sort((a, b) => b.dias_sem_visita - a.dias_sem_visita);

  const pedidosRecentes = pedidos.slice(0, 5);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, number>();

    pedidos.forEach((pedido) => {
      const nome = pedido.clientes?.razao_social || "Cliente não informado";
      mapa.set(nome, (mapa.get(nome) || 0) + Number(pedido.valor_total || 0));
    });

    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidos]);

  const topRepresentadas = useMemo(() => {
    const mapa = new Map<string, number>();

    comissoes.forEach((item) => {
      const nome = item.empresa || "Sem representada";
      mapa.set(nome, (mapa.get(nome) || 0) + Number(item.valor_comissao || 0));
    });

    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [comissoes]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader
            titulo="Dashboard Executivo V3"
            subtitulo="Centro de comando Berbel Connect"
          />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Vendas intermediadas" valor={moeda(totalVendido)} />
              <Card titulo="Comissão prevista" valor={moeda(totalComissao)} />
              <Card titulo="Comissão recebida" valor={moeda(comissaoRecebida)} />
              <Card titulo="Comissão pendente" valor={moeda(comissaoPendente)} />

              <Card titulo="A receber" valor={moeda(totalReceber)} />
              <Card titulo="A pagar" valor={moeda(totalPagar)} />
              <Card titulo="Saldo previsto" valor={moeda(saldoPrevisto)} />
              <Card titulo="Pipeline aberto" valor={moeda(valorPipeline)} />

              <Card titulo="Clientes" valor={clientes.length} />
              <Card titulo="Visitas hoje" valor={visitasHoje.length} />
              <Card titulo="Visitas atrasadas" valor={visitasAtrasadas.length} />
              <Card titulo="Oportunidades" valor={pipelineAberto.length} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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

              <Painel titulo="Agenda de hoje">
                {visitasHoje.slice(0, 5).map((visita) => (
                  <Item
                    key={visita.id}
                    titulo={visita.clientes?.razao_social || "-"}
                    subtitulo={`${visita.hora_visita || "--:--"} • ${
                      visita.tipo_contato || "Visita"
                    }`}
                    detalhe={visita.status || "Agendada"}
                  />
                ))}

                {visitasHoje.length === 0 && (
                  <Vazio texto="Nenhuma visita para hoje." />
                )}
              </Painel>

              <Painel titulo="Pedidos recentes">
                {pedidosRecentes.map((pedido) => (
                  <Item
                    key={pedido.id}
                    titulo={pedido.numero || pedido.id}
                    subtitulo={pedido.clientes?.razao_social || "-"}
                    detalhe={`${moeda(pedido.valor_total)} • ${
                      pedido.status || "-"
                    }`}
                  />
                ))}

                {pedidosRecentes.length === 0 && (
                  <Vazio texto="Nenhum pedido cadastrado." />
                )}
              </Painel>

              <Painel titulo="Top clientes">
                {topClientes.map((cliente, index) => (
                  <Item
                    key={cliente.nome}
                    titulo={`${index + 1}. ${cliente.nome}`}
                    subtitulo="Total comprado"
                    detalhe={moeda(cliente.total)}
                  />
                ))}

                {topClientes.length === 0 && <Vazio texto="Sem dados." />}
              </Painel>

              <Painel titulo="Top representadas">
                {topRepresentadas.map((rep, index) => (
                  <Item
                    key={rep.nome}
                    titulo={`${index + 1}. ${rep.nome}`}
                    subtitulo="Comissão gerada"
                    detalhe={moeda(rep.total)}
                  />
                ))}

                {topRepresentadas.length === 0 && <Vazio texto="Sem dados." />}
              </Painel>

              <Painel titulo="Pipeline comercial">
                {pipelineAberto.slice(0, 5).map((item) => (
                  <Item
                    key={item.id}
                    titulo={item.oportunidade || "-"}
                    subtitulo={item.clientes?.razao_social || "-"}
                    detalhe={`${item.etapa || "-"} • ${moeda(
                      item.valor_estimado
                    )}`}
                  />
                ))}

                {pipelineAberto.length === 0 && (
                  <Vazio texto="Nenhuma oportunidade aberta." />
                )}
              </Painel>

              <Painel titulo="Contas a receber">
                {receber
                  .filter((item) => item.status !== "Recebido")
                  .slice(0, 5)
                  .map((item) => (
                    <Item
                      key={item.id}
                      titulo={item.descricao || "Conta a receber"}
                      subtitulo={item.clientes?.razao_social || "-"}
                      detalhe={moeda(item.valor)}
                    />
                  ))}

                {receber.filter((item) => item.status !== "Recebido").length ===
                  0 && <Vazio texto="Nenhuma conta pendente." />}
              </Painel>

              <Painel titulo="Comissões pendentes">
                {comissoes
                  .filter((item) => item.status !== "Recebida")
                  .slice(0, 5)
                  .map((item) => (
                    <Item
                      key={item.id}
                      titulo={item.empresa || "Representada"}
                      subtitulo={item.clientes?.razao_social || "-"}
                      detalhe={moeda(item.valor_comissao)}
                    />
                  ))}

                {comissoes.filter((item) => item.status !== "Recebida").length ===
                  0 && <Vazio texto="Nenhuma comissão pendente." />}
              </Painel>
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

function Painel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold text-slate-800">{titulo}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({
  titulo,
  subtitulo,
  detalhe,
}: {
  titulo: string;
  subtitulo: string;
  detalhe: string;
}) {
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