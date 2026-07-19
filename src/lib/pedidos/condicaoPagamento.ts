export type ParcelaFinanceira = {
  numero: number;
  totalParcelas: number;
  prazoDias: number;
  vencimento: string;
  valor: number;
};

export type PlanoPagamento = {
  parcelas: ParcelaFinanceira[];
  automatico: boolean;
  aviso: string | null;
};

const CONDICOES_MANUAIS = new Set(["", "a combinar", "combinar"]);
const CONDICOES_A_VISTA = new Set([
  "a vista",
  "avista",
  "pix",
  "dinheiro",
  "cartao a vista",
]);

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function validarDataISO(data: string) {
  const resultado = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);

  if (!resultado) {
    throw new Error("A data-base do pagamento deve estar no formato AAAA-MM-DD.");
  }

  const ano = Number(resultado[1]);
  const mes = Number(resultado[2]);
  const dia = Number(resultado[3]);
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataUTC.getUTCFullYear() !== ano ||
    dataUTC.getUTCMonth() !== mes - 1 ||
    dataUTC.getUTCDate() !== dia
  ) {
    throw new Error("A data-base do pagamento é inválida.");
  }

  return dataUTC;
}

export function adicionarDiasISO(data: string, dias: number) {
  const dataUTC = validarDataISO(data);
  dataUTC.setUTCDate(dataUTC.getUTCDate() + dias);
  return dataUTC.toISOString().slice(0, 10);
}

export function extrairPrazosPagamento(condicao: string): {
  prazos: number[];
  automatico: boolean;
  aviso: string | null;
} {
  const condicaoNormalizada = normalizar(condicao);

  if (CONDICOES_A_VISTA.has(condicaoNormalizada)) {
    return { prazos: [0], automatico: true, aviso: null };
  }

  if (CONDICOES_MANUAIS.has(condicaoNormalizada)) {
    return {
      prazos: [0],
      automatico: false,
      aviso: "Condição a combinar: será criado um vencimento único na data-base.",
    };
  }

  const numeros = condicaoNormalizada.match(/\d+/g)?.map(Number) || [];
  const prazos = numeros.filter(
    (prazo, indice) =>
      Number.isInteger(prazo) &&
      prazo >= 0 &&
      prazo <= 3650 &&
      numeros.indexOf(prazo) === indice
  );

  if (prazos.length === 0) {
    return {
      prazos: [0],
      automatico: false,
      aviso:
        "Condição não reconhecida: será criado um vencimento único na data-base.",
    };
  }

  if (prazos.length > 24) {
    return {
      prazos: [0],
      automatico: false,
      aviso:
        "Condição com mais de 24 prazos: será criado um vencimento único na data-base.",
    };
  }

  return { prazos, automatico: true, aviso: null };
}

export function gerarPlanoPagamento(
  valorTotal: number,
  dataBase: string,
  condicao: string
): PlanoPagamento {
  if (!Number.isFinite(valorTotal) || valorTotal < 0) {
    throw new Error("O valor total do pedido é inválido.");
  }

  const { prazos, automatico, aviso } = extrairPrazosPagamento(condicao);
  const totalCentavos = Math.round(valorTotal * 100);
  const valorBaseCentavos = Math.floor(totalCentavos / prazos.length);
  const diferencaCentavos = totalCentavos - valorBaseCentavos * prazos.length;

  const parcelas = prazos.map((prazoDias, indice) => {
    const ultimaParcela = indice === prazos.length - 1;
    const valorCentavos =
      valorBaseCentavos + (ultimaParcela ? diferencaCentavos : 0);

    return {
      numero: indice + 1,
      totalParcelas: prazos.length,
      prazoDias,
      vencimento: adicionarDiasISO(dataBase, prazoDias),
      valor: valorCentavos / 100,
    };
  });

  return { parcelas, automatico, aviso };
}
