import { exportToExcel } from "./exportExcel";

import type {
  ClientRankingItem,
  ProductRankingItem,
  RepresentadaRankingItem,
} from "@/types/reports";

type Summary = {
  pedidos: number;
  vendas: number;
  comissoes: number;
  ticket: number;
};

export function exportarRelatorioComercialExcel(
  summary: Summary,
  clientes: ClientRankingItem[],
  produtos: ProductRankingItem[],
  representadas: RepresentadaRankingItem[]
) {
  exportToExcel("Relatorio Comercial", [
    {
      name: "Resumo",
      data: [
        {
          Pedidos: summary.pedidos,
          Vendas: summary.vendas,
          Comissões: summary.comissoes,
          "Ticket Médio": summary.ticket,
        },
      ],
    },
    {
      name: "Top Clientes",
      data: clientes.map((item) => ({
        Cliente: item.nome,
        Pedidos: item.pedidos,
        Total: item.total,
      })),
    },
    {
      name: "Top Produtos",
      data: produtos.map((item) => ({
        Produto: item.nome,
        Quantidade: item.quantidade,
        Total: item.total,
      })),
    },
    {
      name: "Top Representadas",
      data: representadas.map((item) => ({
        Representada: item.nome,
        "Valor Base": item.total,
        Comissão: item.comissao,
      })),
    },
  ]);
}