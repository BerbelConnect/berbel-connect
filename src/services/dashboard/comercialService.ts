import { supabase } from "@/lib/supabase";
import type {
  DashboardPedidoResumo,
  DashboardPipelineItem,
  DashboardAlertaCliente,
} from "@/types/dashboard";
import { obterPerfilAtual } from "./perfilService";

type ResumoPedidoRow = {
  valor_total?: string | number | null;
  clientes?: {
    responsavel_perfil_id?: string | null;
  }[] | null;
};

type ResumoPipelineRow = {
  valor_estimado?: string | number | null;
  status?: string | null;
  clientes?: {
    responsavel_perfil_id?: string | null;
  }[] | null;
};

type PedidoRow = {
  id: string;
  numero?: string | null;
  valor_total?: string | number | null;
  status?: string | null;
  clientes?: {
    razao_social?: string | null;
  } | null;
};

type PipelineRow = {
  id: string;
  oportunidade?: string | null;
  etapa?: string | null;
  valor_estimado?: string | number | null;
  status?: string | null;
  clientes?: {
    razao_social?: string | null;
  } | null;
};

type AlertaRow = {
  cliente_id: string;
  razao_social?: string | null;
  cidade?: string | null;
  estado?: string | null;
  ultima_compra?: string | null;
  ultima_visita?: string | null;
};

type ClienteIdRow = {
  id: string;
};

function parseNumber(value: unknown) {
  return Number(value || 0);
}

export async function carregarClientesCount() {
  const perfil = await obterPerfilAtual();
  const query = supabase.from("clientes").select("id");

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    query.eq("responsavel_perfil_id", perfil.perfilId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).length;
}

export async function carregarResumoComercial() {
  const perfil = await obterPerfilAtual();

  const pedidosQuery = supabase
    .from("pedidos")
    .select("valor_total, clientes(responsavel_perfil_id)");

  const pipelineQuery = supabase
    .from("pipeline_comercial")
    .select("valor_estimado, status, clientes(responsavel_perfil_id)");

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    pedidosQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
    pipelineQuery.eq("clientes.responsavel_perfil_id", perfil.perfilId);
  }

  const [pedidosResp, pipelineResp] = await Promise.all([
    pedidosQuery.order("created_at", { ascending: false }),
    pipelineQuery.order("created_at", { ascending: false }),
  ]);

  if (pedidosResp.error) throw pedidosResp.error;
  if (pipelineResp.error) throw pipelineResp.error;

  const pedidos = (pedidosResp.data || []) as ResumoPedidoRow[];
  const pipeline = (pipelineResp.data || []) as ResumoPipelineRow[];

  const totalVendido = pedidos.reduce(
    (total, pedido) => total + parseNumber(pedido.valor_total),
    0
  );

  const pipelineAberto = pipeline.filter((item) => item.status === "Aberto");

  const valorPipeline = pipelineAberto.reduce(
    (total, item) => total + parseNumber(item.valor_estimado),
    0
  );

  const oportunidadesAbertasCount = pipelineAberto.length;

  return {
    totalVendido,
    valorPipeline,
    oportunidadesAbertasCount,
  };
}

export async function carregarPedidosRecentes(): Promise<DashboardPedidoResumo[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, numero, valor_total, status, clientes(razao_social)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  const pedidos = (data || []) as PedidoRow[];

  return pedidos.map((pedido) => ({
    id: pedido.id,
    numero: pedido.numero ?? null,
    valor_total: parseNumber(pedido.valor_total),
    status: pedido.status ?? null,
    cliente_nome: pedido.clientes?.razao_social ?? null,
  }));
}

export async function carregarPipelineAberto(): Promise<DashboardPipelineItem[]> {
  const { data, error } = await supabase
    .from("pipeline_comercial")
    .select("id, oportunidade, etapa, valor_estimado, status, clientes(razao_social)")
    .eq("status", "Aberto")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  const pipeline = (data || []) as PipelineRow[];

  return pipeline.map((item) => ({
    id: item.id,
    oportunidade: item.oportunidade ?? null,
    etapa: item.etapa ?? null,
    valor_estimado: parseNumber(item.valor_estimado),
    status: item.status ?? null,
    cliente_nome: item.clientes?.razao_social ?? null,
  }));
}

export async function carregarAlertasClientes() {
  const perfil = await obterPerfilAtual();

  const { data, error } = await supabase
    .from("vw_alertas_comerciais")
    .select("cliente_id, razao_social, cidade, estado, ultima_compra, ultima_visita");

  if (error) {
    throw error;
  }

  let alertas = (data || []) as AlertaRow[];

  if (perfil.perfil !== "Administrador" && perfil.perfilId) {
    const clientesResp = await supabase
      .from("clientes")
      .select("id")
      .eq("responsavel_perfil_id", perfil.perfilId);

    if (clientesResp.error) {
      throw clientesResp.error;
    }

    const clienteIds = new Set(
      ((clientesResp.data || []) as ClienteIdRow[]).map((item) => item.id)
    );

    alertas = alertas.filter((item) => clienteIds.has(item.cliente_id));
  }

  const calcularDias = (data?: string | null) => {
    if (!data) return 0;
    const hoje = new Date();
    const alvo = new Date(data);
    return Math.floor((hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24));
  };

  const clientesSemCompra: DashboardAlertaCliente[] = alertas
    .map((item) => ({
      cliente_id: item.cliente_id,
      razao_social: item.razao_social ?? "",
      cidade: item.cidade ?? null,
      estado: item.estado ?? null,
      dias_sem_compra: calcularDias(item.ultima_compra),
      dias_sem_visita: 0,
    }))
    .filter((item) => item.dias_sem_compra >= 45)
    .sort((a, b) => b.dias_sem_compra - a.dias_sem_compra);

  const clientesSemVisita: DashboardAlertaCliente[] = alertas
    .map((item) => ({
      cliente_id: item.cliente_id,
      razao_social: item.razao_social ?? "",
      cidade: item.cidade ?? null,
      estado: item.estado ?? null,
      dias_sem_compra: 0,
      dias_sem_visita: calcularDias(item.ultima_visita),
    }))
    .filter((item) => item.dias_sem_visita >= 30)
    .sort((a, b) => b.dias_sem_visita - a.dias_sem_visita);

  return {
    clientesSemCompra,
    clientesSemVisita,
  };
}
