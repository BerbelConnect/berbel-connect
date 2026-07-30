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

function parseNumber(value: unknown) {
  return Number(value || 0);
}

export async function carregarResumoFinanceiro() {
  const perfil = await obterPerfilAtual();

  const receberQuery = supabase
    .from("contas_receber")
    .select("valor, status, clientes(razao_social, responsavel_perfil_id)");

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    receberQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
  }

  const [receberResp, pagarResp, comissoesResp] = await Promise.all([
    receberQuery.neq("status", "Recebido"),
    supabase.from("contas_pagar").select("valor, status"),
    supabase.from("comissoes_financeiro").select("valor_comissao, status, clientes(razao_social, responsavel_perfil_id)"),
  ]);

  if (receberResp.error) throw receberResp.error;
  if (pagarResp.error) throw pagarResp.error;
  if (comissoesResp.error) throw comissoesResp.error;

  const receberRows = (receberResp.data || []) as FinanceiroResumoRow[];
  const pagarRows = (pagarResp.data || []) as FinanceiroResumoRow[];
  const comissoesRows = (comissoesResp.data || []) as FinanceiroResumoRow[];

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
    saldoPrevisto: totalReceber - totalPagar,
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
