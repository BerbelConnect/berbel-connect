import { supabase } from "@/lib/supabase";
import type { ReportsDashboardData } from "@/types/reports";

export async function carregarReportsDashboard(): Promise<ReportsDashboardData> {
  const [
    pedidosResp,
    itensResp,
    comissoesResp,
    clientesResp,
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, clientes(razao_social)")
      .order("created_at", { ascending: false }),

    supabase
      .from("pedido_itens")
      .select("*"),

    supabase
      .from("comissoes_financeiro")
      .select("*, clientes(razao_social)"),

    supabase
      .from("clientes")
      .select("id, razao_social")
      .order("razao_social"),
  ]);

  if (pedidosResp.error) throw pedidosResp.error;
  if (itensResp.error) throw itensResp.error;
  if (comissoesResp.error) throw comissoesResp.error;
  if (clientesResp.error) throw clientesResp.error;

  const representadas = Array.from(
    new Set(
      (comissoesResp.data ?? [])
        .map((item) => item.empresa)
        .filter(Boolean)
    )
  )
    .sort()
    .map((nome) => ({ nome }));

  return {
    pedidos: pedidosResp.data ?? [],
    itens: itensResp.data ?? [],
    comissoes: comissoesResp.data ?? [],
    clientes: clientesResp.data ?? [],
    representadas,
  };
}