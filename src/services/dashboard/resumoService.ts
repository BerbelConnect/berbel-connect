import { carregarAgendaResumo, carregarVisitasHoje } from "./agendaService";
import {
  carregarClientesCount,
  carregarResumoComercial,
  carregarPedidosRecentes,
  carregarPipelineAberto,
  carregarAlertasClientes,
} from "./comercialService";
import {
  carregarResumoFinanceiro,
  carregarContasReceberPendentes,
  carregarComissoesPendentes,
} from "./financeiroService";
import { carregarTopClientes, carregarTopRepresentadas } from "./rankingService";
import type { DashboardResumo } from "@/types/dashboard";

export async function carregarResumoExecutivo(): Promise<DashboardResumo> {
  const [
    financeiroResumo,
    comercialResumo,
    agendaResumo,
    clientesCount,
    visitasHoje,
    pedidosRecentes,
    pipelineAberto,
    contasReceberPendentes,
    comissoesPendentes,
    alertas,
    topClientes,
    topRepresentadas,
  ] = await Promise.all([
    carregarResumoFinanceiro(),
    carregarResumoComercial(),
    carregarAgendaResumo(),
    carregarClientesCount(),
    carregarVisitasHoje(),
    carregarPedidosRecentes(),
    carregarPipelineAberto(),
    carregarContasReceberPendentes(),
    carregarComissoesPendentes(),
    carregarAlertasClientes(),
    carregarTopClientes(),
    carregarTopRepresentadas(),
  ]);

  return {
    ...financeiroResumo,
    ...comercialResumo,
    ...agendaResumo,
    clientesCount,
    visitasHoje,
    pedidosRecentes,
    pipelineAberto,
    contasReceberPendentes,
    comissoesPendentes,
    clientesSemVisita: alertas.clientesSemVisita,
    clientesSemCompra: alertas.clientesSemCompra,
    topClientes,
    topRepresentadas,
  };
}
