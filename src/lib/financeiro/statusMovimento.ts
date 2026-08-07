export type MovimentoFinanceiro = {
  status?: string | null;
  vencimento?: string | null;
};

function normalizarStatus(status?: string | null) {
  return String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function movimentoCancelado(movimento: MovimentoFinanceiro) {
  return normalizarStatus(movimento.status) === "cancelado";
}

export function movimentoPendente(movimento: MovimentoFinanceiro) {
  return normalizarStatus(movimento.status) === "pendente";
}

export function situacaoContaReceber(
  conta: MovimentoFinanceiro,
  hoje: string
) {
  const status = normalizarStatus(conta.status);

  if (status === "cancelado") return "Cancelado";
  if (status === "recebido") return "Recebido";
  if (!conta.vencimento) return "Sem vencimento";
  if (conta.vencimento < hoje) return "Vencido";
  if (conta.vencimento === hoje) return "Vence hoje";
  return "A vencer";
}
