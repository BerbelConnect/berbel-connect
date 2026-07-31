import { supabase } from "@/lib/supabase";
import type {
  DashboardAnalytics,
  DashboardFinancialStatusAnalytics,
  DashboardPeriodKey,
  DashboardPeriodRange,
  DashboardRepresentadaAnalytics,
  DashboardSalesEvolutionPoint,
  DashboardVisitsAnalytics,
} from "@/types/dashboard";
import { obterPerfilAtual } from "./perfilService";

type ClienteRelation = {
  responsavel_perfil_id?: string | null;
};

type PedidoAnalyticsRow = {
  id: string;
  created_at?: string | null;
  valor_total?: string | number | null;
  clientes?: ClienteRelation | ClienteRelation[] | null;
};

type ComissaoAnalyticsRow = {
  id: string;
  created_at?: string | null;
  valor_comissao?: string | number | null;
  status?: string | null;
  empresa?: string | null;
  clientes?: ClienteRelation | ClienteRelation[] | null;
};

type VisitaAnalyticsRow = {
  id: string;
  data_visita?: string | null;
  status?: string | null;
  clientes?: ClienteRelation | ClienteRelation[] | null;
};

type ContaAnalyticsRow = {
  id: string;
  valor?: string | number | null;
  status?: string | null;
  clientes?: ClienteRelation | ClienteRelation[] | null;
};

function parseNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function periodKeyToRange(
  key: DashboardPeriodKey,
  referenceDate = new Date()
): DashboardPeriodRange {
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const start = new Date(end);

  switch (key) {
    case "today":
      break;
    case "7d":
      start.setDate(start.getDate() - 6);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      break;
    case "90d":
      start.setDate(start.getDate() - 89);
      break;
    case "year":
      start.setMonth(0, 1);
      break;
    case "12m":
      start.setDate(1);
      start.setMonth(start.getMonth() - 11);
      break;
  }

  return {
    start: toDateOnly(start),
    end: toDateOnly(end),
  };
}

function nextDay(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return `${toDateOnly(date)}T00:00:00`;
}

function startTimestamp(dateIso: string) {
  return `${dateIso}T00:00:00`;
}

function monthKey(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function fillMonthKeys(range: DashboardPeriodRange) {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const keys: string[] = [];

  while (current <= end) {
    keys.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
    );
    current.setMonth(current.getMonth() + 1);
  }

  return keys;
}

function getResponsavelId(
  relation: ClienteRelation | ClienteRelation[] | null | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0]?.responsavel_perfil_id ?? null;
  }

  return relation?.responsavel_perfil_id ?? null;
}

function belongsToProfile(
  relation: ClienteRelation | ClienteRelation[] | null | undefined,
  perfilId: string | null
) {
  if (!perfilId) {
    return false;
  }

  return getResponsavelId(relation) === perfilId;
}

function filterByProfile<T extends { clientes?: ClienteRelation | ClienteRelation[] | null }>(
  rows: T[],
  isAdministrator: boolean,
  perfilId: string | null
) {
  if (isAdministrator) {
    return rows;
  }

  return rows.filter((row) => belongsToProfile(row.clientes, perfilId));
}

export async function carregarAnalytics(
  period: DashboardPeriodKey
): Promise<DashboardAnalytics> {
  const range = periodKeyToRange(period);
  const perfil = await obterPerfilAtual();
  const isAdministrator = perfil.perfil === "Administrador";

  const [pedidosResp, comissoesResp, visitasResp, receberResp, pagarResp] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select("id, created_at, valor_total, clientes(responsavel_perfil_id)")
        .gte("created_at", startTimestamp(range.start))
        .lt("created_at", nextDay(range.end))
        .order("created_at", { ascending: true }),

      supabase
        .from("comissoes_financeiro")
        .select(
          "id, created_at, valor_comissao, status, empresa, clientes(responsavel_perfil_id)"
        )
        .gte("created_at", startTimestamp(range.start))
        .lt("created_at", nextDay(range.end))
        .order("created_at", { ascending: true }),

      supabase
        .from("visitas")
        .select("id, data_visita, status, clientes(responsavel_perfil_id)")
        .gte("data_visita", range.start)
        .lte("data_visita", range.end)
        .order("data_visita", { ascending: true }),

      supabase
        .from("contas_receber")
        .select("id, valor, status, clientes(responsavel_perfil_id)")
        .gte("vencimento", range.start)
        .lte("vencimento", range.end),

      supabase
        .from("contas_pagar")
        .select("id, valor, status")
        .gte("vencimento", range.start)
        .lte("vencimento", range.end),
    ]);

  if (pedidosResp.error) throw pedidosResp.error;
  if (comissoesResp.error) throw comissoesResp.error;
  if (visitasResp.error) throw visitasResp.error;
  if (receberResp.error) throw receberResp.error;
  if (pagarResp.error) throw pagarResp.error;

  const pedidos = filterByProfile(
    (pedidosResp.data ?? []) as PedidoAnalyticsRow[],
    isAdministrator,
    perfil.perfilId
  );
  const comissoes = filterByProfile(
    (comissoesResp.data ?? []) as ComissaoAnalyticsRow[],
    isAdministrator,
    perfil.perfilId
  );
  const visitas = filterByProfile(
    (visitasResp.data ?? []) as VisitaAnalyticsRow[],
    isAdministrator,
    perfil.perfilId
  );
  const contasReceber = filterByProfile(
    (receberResp.data ?? []) as ContaAnalyticsRow[],
    isAdministrator,
    perfil.perfilId
  );
  const contasPagar = (pagarResp.data ?? []) as ContaAnalyticsRow[];

  const monthKeys = fillMonthKeys(range);
  const salesMap = new Map<
    string,
    {
      valor_vendido: number;
      comissao_prevista: number;
      comissao_recebida: number;
    }
  >();

  monthKeys.forEach((key) => {
    salesMap.set(key, {
      valor_vendido: 0,
      comissao_prevista: 0,
      comissao_recebida: 0,
    });
  });

  pedidos.forEach((pedido) => {
    if (!pedido.created_at) return;
    const key = monthKey(pedido.created_at);
    if (!key) return;

    const item = salesMap.get(key);
    if (item) {
      item.valor_vendido += parseNumber(pedido.valor_total);
    }
  });

  comissoes.forEach((comissao) => {
    if (!comissao.created_at) return;
    const key = monthKey(comissao.created_at);
    if (!key) return;

    const item = salesMap.get(key);
    if (!item) return;

    const value = parseNumber(comissao.valor_comissao);
    item.comissao_prevista += value;

    if (normalizeText(comissao.status) === "recebida") {
      item.comissao_recebida += value;
    }
  });

  const salesEvolution: DashboardSalesEvolutionPoint[] = monthKeys.map(
    (periodKey) => ({
      period: periodKey,
      valor_vendido: salesMap.get(periodKey)?.valor_vendido ?? 0,
      comissao_prevista: salesMap.get(periodKey)?.comissao_prevista ?? 0,
      comissao_recebida: salesMap.get(periodKey)?.comissao_recebida ?? 0,
    })
  );

  const representedMap = new Map<
    string,
    { faturamento: number; pedidos: number; comissao: number }
  >();

  comissoes.forEach((comissao) => {
    const empresa = comissao.empresa?.trim() || "Sem representada";
    const current = representedMap.get(empresa) ?? {
      faturamento: 0,
      pedidos: 0,
      comissao: 0,
    };

    current.pedidos += 1;
    current.comissao += parseNumber(comissao.valor_comissao);
    representedMap.set(empresa, current);
  });

  const representadas: DashboardRepresentadaAnalytics[] = Array.from(
    representedMap.entries()
  )
    .map(([empresa, values]) => ({
      empresa,
      ...values,
    }))
    .sort((a, b) => b.comissao - a.comissao);

  const today = toDateOnly(new Date());
  const visits: DashboardVisitsAnalytics = {
    realizadas: 0,
    atrasadas: 0,
    futuras: 0,
  };

  visitas.forEach((visita) => {
    if (!visita.data_visita) return;

    const status = normalizeText(visita.status);
    const isCompleted = status.includes("concluid");

    if (isCompleted) {
      visits.realizadas += 1;
      return;
    }

    if (visita.data_visita < today) {
      visits.atrasadas += 1;
    } else {
      visits.futuras += 1;
    }
  });

  const financialMap = new Map<string, number>();

  contasReceber.forEach((conta) => {
    const status = conta.status?.trim() || "Sem status";
    const key = `receber:${status}`;
    financialMap.set(key, (financialMap.get(key) ?? 0) + parseNumber(conta.valor));
  });

  contasPagar.forEach((conta) => {
    const status = conta.status?.trim() || "Sem status";
    const key = `pagar:${status}`;
    financialMap.set(key, (financialMap.get(key) ?? 0) + parseNumber(conta.valor));
  });

  const financialStatus: DashboardFinancialStatusAnalytics[] = Array.from(
    financialMap.entries()
  ).map(([status, total]) => ({
    status,
    total,
  }));

  return {
    salesEvolution,
    representadas,
    visits,
    financialStatus,
  };
}
