import type {
  ContaPagarPedidoCompleto,
  ItemPedidoCompleto,
  ParcelaPedidoCompleto,
} from "./criarPedidoCompleto";
import type { PlanoPagamento } from "./condicaoPagamento";

export type FornecedorProduto = {
  id: string;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  fornecedores?: { nome?: string | null } | null;
};

export type FinanceiroPedidoPreparado = {
  geraMovimentos: boolean;
  geraContas: boolean;
  geraComissao: boolean;
  contasReceber: ParcelaPedidoCompleto[];
  contasPagar: ContaPagarPedidoCompleto[];
};

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function statusGeraMovimentos(status?: string | null) {
  const normalizado = normalizarTexto(status);
  return normalizado !== "orcamento" && normalizado !== "cancelado";
}

export function tipoGeraContas(tipo?: string | null) {
  return new Set([
    "revenda",
    "revenda propria",
    "venda direta",
    "venda propria",
    "compra propria",
  ]).has(normalizarTexto(tipo));
}

export function tipoGeraComissao(tipo?: string | null) {
  return normalizarTexto(tipo) === "representacao";
}

export function agruparCustosPorFornecedor(
  itens: ItemPedidoCompleto[],
  produtos: FornecedorProduto[]
): ContaPagarPedidoCompleto[] {
  const grupos = new Map<string, ContaPagarPedidoCompleto>();

  for (const item of itens) {
    const produto = produtos.find((registro) => registro.id === item.produto_id);
    const fornecedorId = item.fornecedor_id || produto?.fornecedor_id || null;
    const fornecedorNome =
      produto?.fornecedor_nome ||
      produto?.fornecedores?.nome ||
      (fornecedorId ? "Fornecedor vinculado" : "Compra própria");
    const chave = fornecedorId || fornecedorNome;
    const grupo = grupos.get(chave);

    grupos.set(chave, {
      fornecedor_id: fornecedorId,
      fornecedor_nome: fornecedorNome,
      valor: Number(((grupo?.valor || 0) + item.valor_custo_total).toFixed(2)),
    });
  }

  return Array.from(grupos.values()).filter((grupo) => grupo.valor > 0);
}

export function prepararFinanceiroPedido(input: {
  status: string;
  tipo: string;
  itens: ItemPedidoCompleto[];
  produtos: FornecedorProduto[];
  planoPagamento: PlanoPagamento;
}): FinanceiroPedidoPreparado {
  const geraMovimentos = statusGeraMovimentos(input.status);
  const geraContas = geraMovimentos && tipoGeraContas(input.tipo);
  const geraComissao = geraMovimentos && tipoGeraComissao(input.tipo);

  return {
    geraMovimentos,
    geraContas,
    geraComissao,
    contasReceber: geraContas
      ? input.planoPagamento.parcelas.map((parcela) => ({
          numero: parcela.numero,
          total_parcelas: parcela.totalParcelas,
          prazo_dias: parcela.prazoDias,
          vencimento: parcela.vencimento,
          valor: parcela.valor,
        }))
      : [],
    contasPagar: geraContas
      ? agruparCustosPorFornecedor(input.itens, input.produtos)
      : [],
  };
}
