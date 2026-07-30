import type {
  HistoricoClienteDados,
  ProdutoMaisComprado,
} from "@/types/historicoCliente";

export function selecionarProdutosMaisComprados(
  historico: HistoricoClienteDados
): ProdutoMaisComprado[] {
  return historico.produtosMaisComprados;
}
