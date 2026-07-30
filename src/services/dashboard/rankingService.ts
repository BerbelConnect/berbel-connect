import { supabase } from "@/lib/supabase";
import type { DashboardRankingItem } from "@/types/dashboard";
import { obterPerfilAtual } from "./perfilService";

type PedidoRow = {
  valor_total?: string | number | null;
  clientes?: { razao_social?: string | null; responsavel_perfil_id?: string | null } | null;
};

type ComissaoRow = {
  valor_comissao?: string | number | null;
  empresa?: string | null;
  clientes?: { responsavel_perfil_id?: string | null } | null;
};

function parseNumber(value: unknown) {
  return Number(value || 0);
}

export async function carregarTopClientes(): Promise<DashboardRankingItem[]> {
  const perfil = await obterPerfilAtual();

  const pedidosQuery = supabase
    .from("pedidos")
    .select("valor_total, clientes(razao_social, responsavel_perfil_id)");

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    pedidosQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
  }

  const { data, error } = await pedidosQuery.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const pedidos = (data || []) as PedidoRow[];
  const mapa = new Map<string, number>();

  pedidos.forEach((pedido) => {
    const nome = pedido.clientes?.razao_social ?? "Cliente não informado";
    mapa.set(nome, (mapa.get(nome) || 0) + parseNumber(pedido.valor_total));
  });

  return Array.from(mapa.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export async function carregarTopRepresentadas(): Promise<DashboardRankingItem[]> {
  const perfil = await obterPerfilAtual();

  const comissoesQuery = supabase
    .from("comissoes_financeiro")
    .select("valor_comissao, empresa, clientes(responsavel_perfil_id)");

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    comissoesQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
  }

  const { data, error } = await comissoesQuery.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const comissoes = (data || []) as ComissaoRow[];
  const mapa = new Map<string, number>();

  comissoes.forEach((item) => {
    const nome = item.empresa ?? "Sem representada";
    mapa.set(nome, (mapa.get(nome) || 0) + parseNumber(item.valor_comissao));
  });

  return Array.from(mapa.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}
