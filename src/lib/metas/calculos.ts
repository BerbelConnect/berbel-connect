export type MetaComercial = {
  id: string;
  titulo: string;
  tipo: "Vendas" | "Comissões";
  valor_meta: number;
  periodo: "Mensal" | "Anual";
  mes: number | null;
  ano: number;
  cliente_id: string | null;
  representada: string | null;
  observacoes: string | null;
  created_at?: string;
};

export type RegistroMeta = {
  created_at: string | null;
  valor: number | null;
  cliente_id: string | null;
  representada?: string | null;
  pedido_id?: string | null;
};

export type ProgressoMeta = {
  realizado: number;
  percentual: number;
  restante: number;
  esperado: number;
  situacao: "Atingida" | "No ritmo" | "Atenção" | "Atrasada" | "Futura";
};

export function dentroDoPeriodo(
  value: string | null,
  meta: Pick<MetaComercial, "periodo" | "mes" | "ano">,
) {
  if (!value) return false;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return false;

  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  return ano === Number(meta.ano) &&
    (meta.periodo === "Anual" || mes === Number(meta.mes));
}

export function calcularProgressoMeta(
  meta: MetaComercial,
  registros: RegistroMeta[],
  pedidoIdsDaRepresentada: Set<string> | null = null,
  hoje = new Date(),
): ProgressoMeta {
  const filtrados = registros.filter((registro) => {
    if (!dentroDoPeriodo(registro.created_at, meta)) return false;
    if (meta.cliente_id && registro.cliente_id !== meta.cliente_id) return false;
    if (meta.representada) {
      if (registro.representada !== undefined) {
        return registro.representada === meta.representada;
      }
      return Boolean(registro.pedido_id && pedidoIdsDaRepresentada?.has(registro.pedido_id));
    }
    return true;
  });

  const realizado = filtrados.reduce((total, item) => total + Number(item.valor || 0), 0);
  const valorMeta = Number(meta.valor_meta || 0);
  const percentual = valorMeta > 0 ? (realizado / valorMeta) * 100 : 0;
  const restante = Math.max(valorMeta - realizado, 0);

  const inicio = meta.periodo === "Anual"
    ? new Date(meta.ano, 0, 1)
    : new Date(meta.ano, Number(meta.mes || 1) - 1, 1);
  const fim = meta.periodo === "Anual"
    ? new Date(meta.ano, 11, 31, 23, 59, 59)
    : new Date(meta.ano, Number(meta.mes || 1), 0, 23, 59, 59);

  let esperado = 0;
  if (hoje > fim) esperado = 100;
  else if (hoje >= inicio) {
    esperado = ((hoje.getTime() - inicio.getTime()) / (fim.getTime() - inicio.getTime())) * 100;
  }

  let situacao: ProgressoMeta["situacao"];
  if (percentual >= 100) situacao = "Atingida";
  else if (hoje < inicio) situacao = "Futura";
  else if (hoje > fim) situacao = "Atrasada";
  else if (percentual + 10 >= esperado) situacao = "No ritmo";
  else if (percentual + 25 >= esperado) situacao = "Atenção";
  else situacao = "Atrasada";

  return { realizado, percentual, restante, esperado, situacao };
}
