export type RegraComissao = "venda" | "pagamento_cliente" | "padrao";

function normalizar(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function regraDaEmpresa(empresa: string): RegraComissao {
  const nome = normalizar(empresa);
  if (nome.includes("r&e") || nome.includes("r & e")) return "venda";
  if (nome.includes("solucao") || nome.includes("fibrart")) return "pagamento_cliente";
  return "padrao";
}

export function descricaoRegraComissao(empresa: string) {
  const nome = normalizar(empresa);
  if (nome.includes("r&e") || nome.includes("r & e")) return "Dia 15 do mês seguinte à venda";
  if (nome.includes("solucao")) return "Dia 1 do mês seguinte ao pagamento do cliente";
  if (nome.includes("fibrart")) return "Dia 10 do mês seguinte ao pagamento do cliente";
  return "Regra padrão cadastrada";
}

export function aguardaPagamentoCliente(empresa: string, pagamento: string | null) {
  return regraDaEmpresa(empresa) === "pagamento_cliente" && !pagamento;
}
