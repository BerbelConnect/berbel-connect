export type LinhaExtrato = {
  numeroLinha: number;
  data: string;
  descricao: string;
  referencia: string;
  valor: number;
  valido: boolean;
  erro?: string;
  movimentoSugeridoId?: string;
  movimentoSugeridoTexto?: string;
  regraSugeridaId?: string;
  regraSugeridaNome?: string;
  criterioSugestao?: string;
  confiancaSugestao?: number;
};

type MovimentoCandidato = {
  id: string;
  entidade: string;
  data_movimento: string;
  valor: number | null;
  motivo: string;
};

type MovimentoAuditavel = MovimentoCandidato & {
  registro_id: string;
  operacao: string;
  created_at: string;
};

type RegraCandidata = {
  id: string;
  nome: string;
  termo_descricao: string | null;
  tipo_movimento: "qualquer" | "contas_pagar" | "contas_receber";
  tolerancia_valor: number;
  tolerancia_dias: number;
  prioridade: number;
  ativo: boolean;
};

const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function separar(linha: string, delimitador: string) {
  const campos: string[] = [];
  let atual = "";
  let aspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i];
    if (caractere === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        aspas = !aspas;
      }
    } else if (caractere === delimitador && !aspas) {
      campos.push(atual.trim());
      atual = "";
    } else {
      atual += caractere;
    }
  }
  campos.push(atual.trim());
  return campos;
}

function valorNumerico(valor: string) {
  const limpo = valor.replace(/[R$\s]/g, "");
  const negativo = limpo.startsWith("(") || limpo.endsWith("-");
  const semSinal = limpo.replace(/[()]/g, "").replace(/-$/, "");
  const ultimaVirgula = semSinal.lastIndexOf(",");
  const ultimoPonto = semSinal.lastIndexOf(".");
  let normalizado = semSinal;

  if (ultimaVirgula > ultimoPonto) {
    normalizado = semSinal.replace(/\./g, "").replace(",", ".");
  } else if (ultimoPonto > ultimaVirgula && ultimaVirgula >= 0) {
    normalizado = semSinal.replace(/,/g, "");
  } else if (ultimaVirgula >= 0) {
    normalizado = semSinal.replace(",", ".");
  }

  const numero = Number(normalizado);
  return negativo ? -Math.abs(numero) : numero;
}

function dataIso(valor: string) {
  const texto = valor.trim();
  const brasileira = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brasileira) {
    const [, dia, mes, ano] = brasileira;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
}

function indice(cabecalhos: string[], alternativas: string[]) {
  return cabecalhos.findIndex((item) =>
    alternativas.some((nome) => item === nome || item.includes(nome)),
  );
}

export function lerCsv(conteudo: string): LinhaExtrato[] {
  const linhas = conteudo
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((linha) => linha.trim());
  if (linhas.length < 2) throw new Error("O CSV não possui lançamentos.");

  const delimitador =
    (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length
      ? ";"
      : ",";
  const cabecalhos = separar(linhas[0], delimitador).map(normalizar);
  const dataIdx = indice(cabecalhos, ["data", "date"]);
  const descricaoIdx = indice(cabecalhos, [
    "descricao",
    "historico",
    "lancamento",
    "memo",
  ]);
  const referenciaIdx = indice(cabecalhos, [
    "referencia",
    "documento",
    "numero",
    "id",
  ]);
  const valorIdx = indice(cabecalhos, ["valor", "amount"]);

  if (dataIdx < 0 || descricaoIdx < 0 || valorIdx < 0) {
    throw new Error(
      "O CSV precisa ter colunas de data, descrição/histórico e valor.",
    );
  }

  return linhas.slice(1).map((linha, posicao) => {
    const campos = separar(linha, delimitador);
    const data = dataIso(campos[dataIdx] || "");
    const descricao = (campos[descricaoIdx] || "").trim();
    const referencia =
      referenciaIdx >= 0 ? (campos[referenciaIdx] || "").trim() : "";
    const valor = valorNumerico(campos[valorIdx] || "");
    const erros = [
      !data && "data inválida",
      !descricao && "descrição vazia",
      !Number.isFinite(valor) && "valor inválido",
      valor === 0 && "valor zerado",
    ].filter(Boolean);

    return {
      numeroLinha: posicao + 2,
      data,
      descricao,
      referencia,
      valor,
      valido: erros.length === 0,
      erro: erros.length ? erros.join(", ") : undefined,
    };
  });
}

const dias = (a: string, b: string) =>
  Math.abs(
    new Date(`${a}T12:00:00`).getTime() - new Date(`${b}T12:00:00`).getTime(),
  ) / 86400000;

export function filtrarBaixasAtivas(movimentos: MovimentoAuditavel[]) {
  const estornos = movimentos.filter((item) => item.operacao === "Estorno");

  return movimentos.filter(
    (movimento) =>
      movimento.operacao === "Baixa" &&
      !estornos.some(
        (estorno) =>
          estorno.entidade === movimento.entidade &&
          estorno.registro_id === movimento.registro_id &&
          new Date(estorno.created_at).getTime() >
            new Date(movimento.created_at).getTime(),
      ),
  );
}

export function sugerirCorrespondencias(
  linhas: LinhaExtrato[],
  movimentos: MovimentoCandidato[],
  regras: RegraCandidata[] = [],
) {
  const usados = new Set<string>();
  return linhas.map((linha) => {
    if (!linha.valido) return linha;
    const candidatos = movimentos
      .filter((movimento) => !usados.has(movimento.id))
      .map((movimento) => {
        const diferencaValor = Math.abs(
          Math.abs(Number(movimento.valor || 0)) - Math.abs(linha.valor),
        );
        const diferencaDias = dias(movimento.data_movimento, linha.data);
        const regra = regras
          .filter(
            (item) =>
              item.ativo &&
              (item.tipo_movimento === "qualquer" ||
                item.tipo_movimento === movimento.entidade) &&
              (!item.termo_descricao ||
                normalizar(linha.descricao).includes(
                  normalizar(item.termo_descricao),
                )) &&
              diferencaValor <= Number(item.tolerancia_valor) + 0.0001 &&
              diferencaDias <= Number(item.tolerancia_dias),
          )
          .sort((a, b) => b.prioridade - a.prioridade)[0];

        if (regra) {
          const proporcaoValor =
            Number(regra.tolerancia_valor) > 0
              ? diferencaValor / Number(regra.tolerancia_valor)
              : 0;
          const proporcaoDias =
            Number(regra.tolerancia_dias) > 0
              ? diferencaDias / Number(regra.tolerancia_dias)
              : 0;
          const confianca = Math.max(
            70,
            Math.round(100 - proporcaoValor * 15 - proporcaoDias * 15),
          );
          return {
            movimento,
            regra,
            diferencaValor,
            diferencaDias,
            confianca,
          };
        }

        if (diferencaValor < 0.005 && diferencaDias <= 3) {
          return {
            movimento,
            regra: undefined,
            diferencaValor,
            diferencaDias,
            confianca: Math.max(75, 90 - diferencaDias * 5),
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) =>
          Number(Boolean(b.regra)) - Number(Boolean(a.regra)) ||
          (b.regra?.prioridade || 0) - (a.regra?.prioridade || 0) ||
          b.confianca - a.confianca ||
          a.diferencaValor - b.diferencaValor ||
          a.diferencaDias - b.diferencaDias,
      );
    const escolhido = candidatos[0];
    if (!escolhido) return linha;
    usados.add(escolhido.movimento.id);
    return {
      ...linha,
      movimentoSugeridoId: escolhido.movimento.id,
      movimentoSugeridoTexto: `${escolhido.movimento.entidade} · ${escolhido.movimento.data_movimento} · ${escolhido.movimento.motivo}`,
      regraSugeridaId: escolhido.regra?.id,
      regraSugeridaNome: escolhido.regra?.nome,
      criterioSugestao: escolhido.regra
        ? `Regra: ${escolhido.regra.nome}`
        : "Valor exato e data em até 3 dias",
      confiancaSugestao: escolhido.confianca,
    };
  });
}

export async function hashArquivo(conteudo: string) {
  const bytes = new TextEncoder().encode(conteudo);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}
