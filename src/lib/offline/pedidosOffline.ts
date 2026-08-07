import type {
  ContaPagarPedidoCompleto,
  CriarPedidoCompletoInput,
  ItemPedidoCompleto,
  ParcelaPedidoCompleto,
} from "@/lib/pedidos/criarPedidoCompleto";

export type PedidoOfflineStatus = "pendente" | "sincronizando" | "erro";

export type PedidoOffline = {
  versao: 2;
  id_local: string;
  criado_em: string;
  atualizado_em: string;
  status: PedidoOfflineStatus;
  erro?: string;
  tentativas?: number;
  pedido: CriarPedidoCompletoInput["pedido"];
  itens: ItemPedidoCompleto[];
  contas_receber: ParcelaPedidoCompleto[];
  contas_pagar: ContaPagarPedidoCompleto[];
};

const CHAVE_PEDIDOS_OFFLINE = "berbel_connect_pedidos_offline";
const CHAVE_BACKUP_PEDIDOS_OFFLINE = "berbel_connect_pedidos_offline_backup";

function gerarIdLocal() {
  return `offline-${globalThis.crypto.randomUUID()}`;
}

function notificarAtualizacao() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("berbel:pedidos-offline-atualizados"));
}

function listaValida(valor: unknown): valor is PedidoOffline[] {
  return (
    Array.isArray(valor) &&
    valor.every(
      (item) =>
        item &&
        item.versao === 2 &&
        typeof item.id_local === "string" &&
        item.pedido &&
        Array.isArray(item.itens) &&
        Array.isArray(item.contas_receber) &&
        Array.isArray(item.contas_pagar)
    )
  );
}

function lerLista(chave: string): PedidoOffline[] | null {
  const bruto = localStorage.getItem(chave);
  if (!bruto) return [];

  try {
    const lista = JSON.parse(bruto);
    return listaValida(lista) ? lista : null;
  } catch {
    return null;
  }
}

function gravarFila(fila: PedidoOffline[]) {
  const serializada = JSON.stringify(fila);
  // Mantém duas cópias idênticas da fila mais recente. Assim, a recuperação
  // nunca ressuscita um pedido que já foi sincronizado e removido.
  localStorage.setItem(CHAVE_BACKUP_PEDIDOS_OFFLINE, serializada);
  localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, serializada);
  notificarAtualizacao();
}

export function listarPedidosOffline(): PedidoOffline[] {
  if (typeof window === "undefined") return [];

  const principal = lerLista(CHAVE_PEDIDOS_OFFLINE);
  if (principal !== null) return principal;

  const backup = lerLista(CHAVE_BACKUP_PEDIDOS_OFFLINE);
  if (backup !== null) {
    localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, JSON.stringify(backup));
    return backup;
  }

  return [];
}

export function contarPedidosOffline() {
  return listarPedidosOffline().length;
}

export function salvarPedidoOffline(input: CriarPedidoCompletoInput) {
  const fila = listarPedidosOffline();
  const idLocal = input.idempotencyKey || gerarIdLocal();
  const agora = new Date().toISOString();

  const novoPedido: PedidoOffline = {
    versao: 2,
    id_local: idLocal,
    criado_em: agora,
    atualizado_em: agora,
    status: "pendente",
    erro: "",
    tentativas: 0,
    pedido: input.pedido,
    itens: input.itens,
    contas_receber: input.contasReceber,
    contas_pagar: input.contasPagar,
  };

  const semDuplicata = fila.filter((item) => item.id_local !== idLocal);
  gravarFila([novoPedido, ...semDuplicata]);
  return novoPedido;
}

export function atualizarPedidoOffline(idLocal: string, dados: Partial<PedidoOffline>) {
  const novaFila = listarPedidosOffline().map((item) =>
    item.id_local === idLocal
      ? { ...item, ...dados, atualizado_em: new Date().toISOString() }
      : item
  );
  gravarFila(novaFila);
}

export function removerPedidoOffline(idLocal: string) {
  gravarFila(listarPedidosOffline().filter((item) => item.id_local !== idLocal));
}

export function limparPedidosOffline() {
  if (typeof window === "undefined") return;
  const atual = localStorage.getItem(CHAVE_PEDIDOS_OFFLINE);
  if (atual) localStorage.setItem(CHAVE_BACKUP_PEDIDOS_OFFLINE, atual);
  localStorage.removeItem(CHAVE_PEDIDOS_OFFLINE);
  notificarAtualizacao();
}

export function navegadorOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
