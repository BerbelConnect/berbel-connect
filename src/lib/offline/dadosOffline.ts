export type ClienteOffline = {
  id: string;
  razao_social: string;
};

export type ProdutoOffline = {
  id: string;
  nome: string;
  preco: number;
  preco_custo?: number;
  fornecedor_id?: string | null;
  comissao_percentual: number;
};

const CHAVE_CLIENTES = "berbel_connect_clientes_cache";
const CHAVE_PRODUTOS = "berbel_connect_produtos_cache";
const CHAVE_ATUALIZACAO = "berbel_connect_dados_cache_atualizado_em";

function salvar(chave: string, dados: any[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(chave, JSON.stringify(dados || []));
  localStorage.setItem(CHAVE_ATUALIZACAO, new Date().toISOString());

  window.dispatchEvent(new Event("berbel:dados-offline-atualizados"));
}

function listar<T>(chave: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return [];

    const dados = JSON.parse(bruto);

    if (!Array.isArray(dados)) return [];

    return dados;
  } catch {
    return [];
  }
}

export function salvarClientesOffline(clientes: ClienteOffline[]) {
  salvar(CHAVE_CLIENTES, clientes);
}

export function salvarProdutosOffline(produtos: ProdutoOffline[]) {
  salvar(CHAVE_PRODUTOS, produtos);
}

export function listarClientesOffline() {
  return listar<ClienteOffline>(CHAVE_CLIENTES);
}

export function listarProdutosOffline() {
  return listar<ProdutoOffline>(CHAVE_PRODUTOS);
}

export function obterDataAtualizacaoCache() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(CHAVE_ATUALIZACAO);
}

export function limparDadosOffline() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CHAVE_CLIENTES);
  localStorage.removeItem(CHAVE_PRODUTOS);
  localStorage.removeItem(CHAVE_ATUALIZACAO);

  window.dispatchEvent(new Event("berbel:dados-offline-atualizados"));
}