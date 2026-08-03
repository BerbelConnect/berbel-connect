export type RegistroValor = { data: string | null; valor: number | null };
export type OportunidadePrevisao = { valor: number | null; probabilidade: number | null; status?: string | null };
export type MetaPrevisao = { tipo: "Vendas" | "Comissões"; valor: number; mes: number | null; ano: number; periodo: "Mensal" | "Anual" };

export type PrevisaoComercial = {
  vendasAtual: number;
  vendasMesAnterior: number;
  comissaoAtual: number;
  comissaoProjetada: number;
  pipelinePonderado: number;
  cenarioConservador: number;
  cenarioProvavel: number;
  cenarioOtimista: number;
  tendenciaPercentual: number;
  diasDecorridos: number;
  diasRestantes: number;
  metaVendas: number;
  metaComissoes: number;
  necessarioPorDiaVendas: number;
  necessarioPorDiaComissoes: number;
};

function isSameMonth(value: string | null, year: number, monthZeroBased: number) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === monthZeroBased;
}

function totalMes(registros: RegistroValor[], year: number, month: number) {
  return registros.filter((item) => isSameMonth(item.data, year, month)).reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

export function calcularPrevisaoComercial(input: {
  vendas: RegistroValor[];
  comissoes: RegistroValor[];
  pipeline: OportunidadePrevisao[];
  metas: MetaPrevisao[];
  referencia?: Date;
}): PrevisaoComercial {
  const hoje = input.referencia ?? new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasDecorridos = Math.min(hoje.getDate(), diasNoMes);
  const diasRestantes = Math.max(diasNoMes - diasDecorridos, 0);
  const mesAnteriorDate = new Date(ano, mes - 1, 1);

  const vendasAtual = totalMes(input.vendas, ano, mes);
  const vendasMesAnterior = totalMes(input.vendas, mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth());
  const comissaoAtual = totalMes(input.comissoes, ano, mes);
  const comissaoAnterior = totalMes(input.comissoes, mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth());
  const diasMesAnterior = new Date(mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth() + 1, 0).getDate();

  const ritmoAtual = vendasAtual / Math.max(diasDecorridos, 1);
  const ritmoAnterior = vendasMesAnterior / Math.max(diasMesAnterior, 1);
  const projecaoRitmo = ritmoAtual * diasNoMes;
  const tendenciaPercentual = ritmoAnterior > 0 ? ((ritmoAtual - ritmoAnterior) / ritmoAnterior) * 100 : vendasAtual > 0 ? 100 : 0;

  const pipelinePonderado = input.pipeline
    .filter((item) => (item.status || "Aberto") !== "Fechado")
    .reduce((total, item) => total + Number(item.valor || 0) * (Number(item.probabilidade || 0) / 100), 0);
  const pipelineTotal = input.pipeline
    .filter((item) => (item.status || "Aberto") !== "Fechado")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const cenarioConservador = Math.max(vendasAtual, projecaoRitmo * 0.85 + pipelinePonderado * 0.25);
  const cenarioProvavel = Math.max(vendasAtual, projecaoRitmo + pipelinePonderado);
  const cenarioOtimista = Math.max(vendasAtual, projecaoRitmo * 1.15 + pipelineTotal * 0.75);

  const taxaComissao = vendasAtual > 0
    ? comissaoAtual / vendasAtual
    : vendasMesAnterior > 0 ? comissaoAnterior / vendasMesAnterior : 0;
  const comissaoProjetada = cenarioProvavel * taxaComissao;

  const metaDoMes = (tipo: MetaPrevisao["tipo"]) => input.metas
    .filter((meta) => meta.tipo === tipo && meta.ano === ano && (meta.periodo === "Anual" || meta.mes === mes + 1))
    .reduce((total, meta) => total + Number(meta.valor || 0) / (meta.periodo === "Anual" ? 12 : 1), 0);
  const metaVendas = metaDoMes("Vendas");
  const metaComissoes = metaDoMes("Comissões");

  return {
    vendasAtual, vendasMesAnterior, comissaoAtual, comissaoProjetada, pipelinePonderado,
    cenarioConservador, cenarioProvavel, cenarioOtimista, tendenciaPercentual,
    diasDecorridos, diasRestantes, metaVendas, metaComissoes,
    necessarioPorDiaVendas: diasRestantes > 0 ? Math.max(metaVendas - vendasAtual, 0) / diasRestantes : 0,
    necessarioPorDiaComissoes: diasRestantes > 0 ? Math.max(metaComissoes - comissaoAtual, 0) / diasRestantes : 0,
  };
}
