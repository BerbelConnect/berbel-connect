export type PedidoOfflineStatus = "pendente" | "sincronizando" | "erro";

export type PedidoOffline = {
  id_local: string;
  criado_em: string;
  atualizado_em: string;
  status: PedidoOfflineStatus;
  erro?: string;
  tentativas?: number;
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

function mesmoPedido(a: PedidoOffline, pedido: any) {
  const numeroA = String(a?.pedido?.numero || "");
  const numeroB = String(pedido?.numero || "");

  if (numeroA && numeroB && numeroA === numeroB) return true;

  return (
    a?.pedido?.cliente_id === pedido?.cliente_id &&
    a?.pedido?.data_pedido === pedido?.data_pedido &&
    Number(a?.pedido?.valor_total || 0) === Number(pedido?.valor_total || 0)
  );
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
  const fila = listarPedidosOffline();

  const existente = fila.find((item) => mesmoPedido(item, pedido));

  if (existente) {
    const pedidoAtualizado: PedidoOffline = {
      ...existente,
      atualizado_em: new Date().toISOString(),
      status: "pendente",
      erro: "",
      pedido: {
        ...pedido,
        origem_offline_id:
          pedido?.origem_offline_id ||
          existente.pedido?.origem_offline_id ||
          existente.id_local,
      },
      itens,
    };

    const novaFila = fila.map((item) =>
      item.id_local === existente.id_local ? pedidoAtualizado : item
    );

    localStorage.setItem(CHAVE_PEDIDOS_OFFLINE, JSON.stringify(novaFila));
    notificarAtualizacao();

    return pedidoAtualizado;
  }

  const idLocal = gerarIdLocal();

  const novoPedido: PedidoOffline = {
    id_local: idLocal,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    status: "pendente",
    erro: "",
    tentativas: 0,
    pedido: {
      ...pedido,
      origem_offline_id: pedido?.origem_offline_id || idLocal,
    },
    itens,
  };

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