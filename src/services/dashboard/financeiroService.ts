import { supabase } from "@/lib/supabase";
import type {
  DashboardContaReceberResumo,
  DashboardComissaoPendenteResumo,
} from "@/types/dashboard";
import { obterPerfilAtual } from "./perfilService";

type ContaReceberRow = {
  id: string;
  descricao?: string | null;
  valor?: string | number | null;
  clientes?: { razao_social?: string | null } | null;
};

type ComissaoRow = {
  id: string;
  empresa?: string | null;
  valor_comissao?: string | number | null;
  status?: string | null;
  clientes?: { razao_social?: string | null } | null;
};

type FinanceiroResumoRow = {
  valor?: string | number | null;
  status?: string | null;
  valor_comissao?: string | number | null;
};

type UltimaConciliacaoRow = {
  saldo_banco?: string | number | null;
};

function parseNumber(value: unknown) {
  return Number(value || 0);
}

function inicioMesIso(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

function inicioProximoMesIso(data = new Date()) {
  const proximoMes = new Date(data.getFullYear(), data.getMonth() + 1, 1);
  return inicioMesIso(proximoMes);
}

export async function carregarResumoFinanceiro() {
  const perfil = await obterPerfilAtual();
  const inicioMes = inicioMesIso();
  const inicioProximoMes = inicioProximoMesIso();

  const receberQuery = supabase
    .from("contas_receber")
    .select("valor, status, clientes(razao_social, responsavel_perfil_id)")
    .eq("status", "Pendente")
    .gte("vencimento", inicioMes)
    .lt("vencimento", inicioProximoMes);

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    receberQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
  }

  const [receberResp, pagarResp, comissoesResp, conciliacaoResp] = await Promise.all([
    receberQuery,
    supabase
      .from("contas_pagar")
      .select("valor, status")
      .eq("status", "Pendente")
      .gte("vencimento", inicioMes)
      .lt("vencimento", inicioProximoMes),
    supabase.from("comissoes_financeiro").select("valor_comissao, status, clientes(razao_social, responsavel_perfil_id)"),
    supabase
      .from("ajustes_financeiros")
      .select("saldo_banco")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (receberResp.error) throw receberResp.error;
  if (pagarResp.error) throw pagarResp.error;
  if (comissoesResp.error) throw comissoesResp.error;
  if (conciliacaoResp.error) throw conciliacaoResp.error;

  const receberRows = (receberResp.data || []) as FinanceiroResumoRow[];
  const pagarRows = (pagarResp.data || []) as FinanceiroResumoRow[];
  const comissoesRows = (comissoesResp.data || []) as FinanceiroResumoRow[];
  const ultimaConciliacao = conciliacaoResp.data as UltimaConciliacaoRow | null;

  const totalReceber = receberRows.reduce(
    (soma, item) => soma + parseNumber(item.valor),
    0
  );

  const totalPagar = pagarRows.reduce(
    (soma, item) => soma + parseNumber(item.valor),
    0
  );

  const totalComissao = comissoesRows.reduce(
    (soma, item) => soma + parseNumber(item.valor_comissao),
    0
  );

  const comissaoRecebida = comissoesRows
    .filter((item) => item.status === "Recebida")
    .reduce((soma, item) => soma + parseNumber(item.valor_comissao), 0);

  const comissaoPendente = totalComissao - comissaoRecebida;

  return {
    totalReceber,
    totalPagar,
    saldoRealBanco: ultimaConciliacao?.saldo_banco == null
      ? null
      : parseNumber(ultimaConciliacao.saldo_banco),
    totalComissao,
    comissaoRecebida,
    comissaoPendente,
  };
}

export async function carregarContasReceberPendentes(): Promise<DashboardContaReceberResumo[]> {
  const { data, error } = await supabase
    .from("contas_receber")
    .select("id, descricao, valor, clientes(razao_social)")
    .neq("status", "Recebido")
    .order("vencimento", { ascending: true })
    .limit(5);

  if (error) {
    throw error;
  }

  const rows = (data || []) as ContaReceberRow[];

  return rows.map((item) => ({
    id: item.id,
    descricao: item.descricao ?? null,
    valor: parseNumber(item.valor),
    cliente_nome: item.clientes?.razao_social ?? null,
  }));
}

export async function carregarComissoesPendentes(): Promise<DashboardComissaoPendenteResumo[]> {
  const { data, error } = await supabase
    .from("comissoes_financeiro")
    .select("id, empresa, valor_comissao, status, clientes(razao_social)")
    .neq("status", "Recebida")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  const rows = (data || []) as ComissaoRow[];

  return rows.map((item) => ({
    id: item.id,
    empresa: item.empresa ?? null,
    valor_comissao: parseNumber(item.valor_comissao),
    status: item.status ?? null,
    cliente_nome: item.clientes?.razao_social ?? null,
  }));
}
