export type ItemAuditavel = {
  quantidade: number;
  valor_unitario: number;
  valor_custo_unitario?: number;
  comissao_percentual?: number;
};

export function calcularTotaisItens(itens: ItemAuditavel[]) {
  return itens.reduce(
    (total, item) => {
      const venda = Number(item.quantidade || 0) * Number(item.valor_unitario || 0);
      const custo = Number(item.quantidade || 0) * Number(item.valor_custo_unitario || 0);
      const comissao = venda * (Number(item.comissao_percentual || 0) / 100);
      return {
        valorTotal: Number((total.valorTotal + venda).toFixed(2)),
        valorCustoTotal: Number((total.valorCustoTotal + custo).toFixed(2)),
        valorComissao: Number((total.valorComissao + comissao).toFixed(2)),
        lucroTotal: Number((total.lucroTotal + venda - custo).toFixed(2)),
      };
    },
    { valorTotal: 0, valorCustoTotal: 0, valorComissao: 0, lucroTotal: 0 }
  );
}

export function motivoValido(motivo: string, minimo = 5) {
  return motivo.trim().length >= minimo;
}
