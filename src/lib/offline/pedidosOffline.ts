export type PedidoOfflineStatus = "pendente" | "sincronizando" | "erro";

export type PedidoOffline = {
  id_local: string;
  criado_em: string;
  atualizado_em: string;
  status: PedidoOfflineStatus;
  erro?: string;
  pedido: any;
  itens: any[];
};

const CHAVE_PEDIDOS_OFFLINE = "berbel_connect_pedidos_offline";

function gerarIdLocal() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function notificarAtualizacao() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("berbel:pedidos-offline-atualizados"));
}

export function listarPedidosOffline(): PedidoOffline[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = localStorage.getItem(CHAVE_PEDIDOS_OFFLINE);
    if (!bruto) return [];

    const lista = JSON.parse(bruto);

    if (!Array.isArray(lista)) return [];

    return lista;
  } catch {
    return [];
  }
}

export function contarPedidosOffline() {
  return listarPedidosOffline().length;
}

export function salvarPedidoOffline({
  pedido,
  itens,
}: {
  pedido: any;
  itens: any[];
}) {
  const novoPedido: PedidoOffline = {
    id_local: gerarIdLocal(),
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    status: "pendente",
    pedido,
    itens,
  };

  const fila = listarPedidosOffline();
  const novaFila = [novoPedido, ...fila];

  localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, JSON.stringify(novaFila));
  notificarAtualizacao();

  return novoPedido;
}

export function atualizarPedidoOffline(
  idLocal: string,
  dados: Partial<PedidoOffline>
) {
  const fila = listarPedidosOffline();

  const novaFila = fila.map((item) =>
    item.id_local === idLocal
      ? {
          ...item,
          ...dados,
          atualizado_em: new Date().toISOString(),
        }
      : item
  );

  localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, JSON.stringify(novaFila));
  notificarAtualizacao();
}

export function removerPedidoOffline(idLocal: string) {
  const fila = listarPedidosOffline();
  const novaFila = fila.filter((item) => item.id_local !== idLocal);

  localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, JSON.stringify(novaFila));
  notificarAtualizacao();
}

export function limparPedidosOffline() {
  localStorage.removeItem(CHAVE_PEDIDOS_OFFLINE);
  notificarAtualizacao();
}

export function navegadorOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}