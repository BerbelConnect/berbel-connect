export type ContaExecutiva = {
  id: string;
  valor: number;
  vencimento?: string | null;
  status?: string | null;
  descricao?: string | null;
};

export type ComissaoExecutiva = {
  id: string;
  valor: number;
  previsao?: string | null;
  status?: string | null;
  empresa?: string | null;
  cliente?: string | null;
};

export type PromessaExecutiva = {
  id: string;
  promessaData?: string | null;
  resultado?: string | null;
};

export type ResumoPainelExecutivo = {
  receberPendente: number;
  receberVencido: number;
  pagarPendente: number;
  pagarVencido: number;
  saldoPrevisto: number;
  comissaoPendente: number;
  comissaoVencida: number;
  promessasProximas: number;
};

const dia = (valor?: string | null) => valor?.slice(0, 10) || "";
const pendente = (status?: string | null, concluido = "recebido") =>
  (status || "pendente").toLowerCase() !== concluido;

export function calcularResumoPainelExecutivo(
  receber: ContaExecutiva[],
  pagar: ContaExecutiva[],
  comissoes: ComissaoExecutiva[],
  promessas: PromessaExecutiva[],
  hoje: string
): ResumoPainelExecutivo {
  const receberAberto = receber.filter((item) => pendente(item.status));
  const pagarAberto = pagar.filter((item) => pendente(item.status, "pago"));
  const comissoesAbertas = comissoes.filter((item) => pendente(item.status));
  const limite = new Date(`${hoje}T12:00:00`);
  limite.setDate(limite.getDate() + 7);
  const fim = limite.toISOString().slice(0, 10);
  const soma = <T extends { valor: number }>(itens: T[]) =>
    itens.reduce((total, item) => total + Number(item.valor || 0), 0);

  const receberPendente = soma(receberAberto);
  const pagarPendente = soma(pagarAberto);

  return {
    receberPendente,
    receberVencido: soma(receberAberto.filter((item) => dia(item.vencimento) < hoje)),
    pagarPendente,
    pagarVencido: soma(pagarAberto.filter((item) => dia(item.vencimento) < hoje)),
    saldoPrevisto: receberPendente - pagarPendente,
    comissaoPendente: soma(comissoesAbertas),
    comissaoVencida: soma(comissoesAbertas.filter((item) => dia(item.previsao) < hoje)),
    promessasProximas: promessas.filter(
      (item) => item.resultado === "Promessa de pagamento" && dia(item.promessaData) >= hoje && dia(item.promessaData) <= fim
    ).length,
  };
}

export function ordenarPrioridades(comissoes: ComissaoExecutiva[], hoje: string) {
  return comissoes
    .filter((item) => pendente(item.status))
    .sort((a, b) => dia(a.previsao).localeCompare(dia(b.previsao)) || b.valor - a.valor)
    .slice(0, 6)
    .map((item) => ({ ...item, vencida: Boolean(dia(item.previsao) && dia(item.previsao) < hoje) }));
}
