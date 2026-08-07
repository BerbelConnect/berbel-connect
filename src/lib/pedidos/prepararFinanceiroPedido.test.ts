import { describe, expect, it } from "vitest";
import { gerarPlanoPagamento } from "./condicaoPagamento";
import {
  agruparCustosPorFornecedor,
  prepararFinanceiroPedido,
} from "./prepararFinanceiroPedido";

const itens = [
  {
    produto_id: "produto-1",
    produto_nome: "Produto A",
    fornecedor_id: "fornecedor-1",
    quantidade: 2,
    valor_unitario: 50,
    valor_total: 100,
    comissao_percentual: 5,
    valor_comissao: 5,
    valor_custo_unitario: 20,
    valor_custo_total: 40,
    lucro_unitario: 30,
    lucro_total: 60,
  },
  {
    produto_id: "produto-2",
    produto_nome: "Produto B",
    fornecedor_id: "fornecedor-1",
    quantidade: 1,
    valor_unitario: 20,
    valor_total: 20,
    comissao_percentual: 5,
    valor_comissao: 1,
    valor_custo_unitario: 10,
    valor_custo_total: 10,
    lucro_unitario: 10,
    lucro_total: 10,
  },
];

const produtos = [
  { id: "produto-1", fornecedor_id: "fornecedor-1", fornecedor_nome: "Fábrica A" },
  { id: "produto-2", fornecedor_id: "fornecedor-1", fornecedor_nome: "Fábrica A" },
];

describe("preparação financeira do pedido", () => {
  it("não gera lançamentos para orçamento", () => {
    const resultado = prepararFinanceiroPedido({
      status: "Orçamento",
      tipo: "Revenda",
      itens,
      produtos,
      planoPagamento: gerarPlanoPagamento(120, "2026-08-06", "30/60"),
    });

    expect(resultado).toMatchObject({
      geraMovimentos: false,
      geraContas: false,
      geraComissao: false,
      contasReceber: [],
      contasPagar: [],
    });
  });

  it("gera parcelas e uma conta de custo agrupada para revenda", () => {
    const resultado = prepararFinanceiroPedido({
      status: "Pedido",
      tipo: "Revenda Própria",
      itens,
      produtos,
      planoPagamento: gerarPlanoPagamento(120, "2026-08-06", "30/60"),
    });

    expect(resultado.geraContas).toBe(true);
    expect(resultado.geraComissao).toBe(false);
    expect(resultado.contasReceber.map((parcela) => parcela.valor)).toEqual([60, 60]);
    expect(resultado.contasPagar).toEqual([
      { fornecedor_id: "fornecedor-1", fornecedor_nome: "Fábrica A", valor: 50 },
    ]);
  });

  it("deixa a comissão para o banco em pedidos de representação", () => {
    const resultado = prepararFinanceiroPedido({
      status: "Pedido",
      tipo: "Representação",
      itens,
      produtos,
      planoPagamento: gerarPlanoPagamento(120, "2026-08-06", "À vista"),
    });

    expect(resultado.geraComissao).toBe(true);
    expect(resultado.geraContas).toBe(false);
    expect(resultado.contasReceber).toEqual([]);
    expect(resultado.contasPagar).toEqual([]);
  });

  it("ignora grupos sem custo", () => {
    expect(
      agruparCustosPorFornecedor(
        [{ ...itens[0], valor_custo_total: 0, fornecedor_id: null }],
        []
      )
    ).toEqual([]);
  });
});
