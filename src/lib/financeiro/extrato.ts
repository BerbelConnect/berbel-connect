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
};

type MovimentoCandidato = {
  id: string;
  entidade: string;
  data_movimento: string;
  valor: number | null;
  motivo: string;
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

export function sugerirCorrespondencias(
  linhas: LinhaExtrato[],
  movimentos: MovimentoCandidato[],
) {
  const usados = new Set<string>();
  return linhas.map((linha) => {
    if (!linha.valido) return linha;
    const candidatos = movimentos
      .filter(
        (movimento) =>
          !usados.has(movimento.id) &&
          Math.abs(
            Math.abs(Number(movimento.valor || 0)) - Math.abs(linha.valor),
          ) < 0.005 &&
          dias(movimento.data_movimento, linha.data) <= 3,
      )
      .sort(
        (a, b) =>
          dias(a.data_movimento, linha.data) -
          dias(b.data_movimento, linha.data),
      );
    const escolhido = candidatos[0];
    if (!escolhido) return linha;
    usados.add(escolhido.id);
    return {
      ...linha,
      movimentoSugeridoId: escolhido.id,
      movimentoSugeridoTexto: `${escolhido.entidade} · ${escolhido.data_movimento} · ${escolhido.motivo}`,
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
