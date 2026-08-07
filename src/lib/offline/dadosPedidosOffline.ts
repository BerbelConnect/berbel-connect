const PREFIXO = "berbel-connect:dados-pedidos:";
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

export type DadosPedidosOffline<TCliente = unknown, TProduto = unknown, TPedido = unknown> = {
  clientes: TCliente[];
  produtos: TProduto[];
  pedidos: TPedido[];
  atualizadoEm: number;
};

function chave(email: string) {
  return `${PREFIXO}${email.trim().toLowerCase()}`;
}

export function salvarDadosPedidosOffline<TCliente, TProduto, TPedido>(
  email: string,
  dados: Omit<DadosPedidosOffline<TCliente, TProduto, TPedido>, "atualizadoEm">
) {
  if (typeof window === "undefined" || !email) return;
  window.localStorage.setItem(chave(email), JSON.stringify({ ...dados, atualizadoEm: Date.now() }));
}

export function carregarDadosPedidosOffline<TCliente, TProduto, TPedido>(
  email: string,
  agora = Date.now()
): DadosPedidosOffline<TCliente, TProduto, TPedido> | null {
  if (typeof window === "undefined" || !email) return null;

  try {
    const bruto = window.localStorage.getItem(chave(email));
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<DadosPedidosOffline<TCliente, TProduto, TPedido>>;
    const valido =
      Array.isArray(dados.clientes) &&
      Array.isArray(dados.produtos) &&
      Array.isArray(dados.pedidos) &&
      typeof dados.atualizadoEm === "number" &&
      agora - dados.atualizadoEm <= VALIDADE_MS;

    if (!valido) {
      window.localStorage.removeItem(chave(email));
      return null;
    }
    return dados as DadosPedidosOffline<TCliente, TProduto, TPedido>;
  } catch {
    window.localStorage.removeItem(chave(email));
    return null;
  }
}
