import { describe, expect, it } from "vitest";
import {
  filtrarBaixasAtivas,
  LinhaExtrato,
  sugerirCorrespondencias,
} from "./extrato";

const linha: LinhaExtrato = {
  numeroLinha: 2,
  data: "2026-08-03",
  descricao: "PIX RECEBIDO CLIENTE ALFA",
  referencia: "PIX-123",
  valor: 100,
  valido: true,
};

const movimento = {
  id: "movimento-1",
  entidade: "contas_receber",
  data_movimento: "2026-08-05",
  valor: 102,
  motivo: "Recebimento confirmado",
};

const regra = {
  id: "regra-1",
  nome: "PIX de clientes",
  termo_descricao: "pix recebido",
  tipo_movimento: "contas_receber" as const,
  tolerancia_valor: 5,
  tolerancia_dias: 3,
  prioridade: 100,
  ativo: true,
};

describe("sugerirCorrespondencias", () => {
  it("aplica uma regra compatível e informa sua confiança", () => {
    const [resultado] = sugerirCorrespondencias([linha], [movimento], [regra]);

    expect(resultado.movimentoSugeridoId).toBe("movimento-1");
    expect(resultado.regraSugeridaId).toBe("regra-1");
    expect(resultado.regraSugeridaNome).toBe("PIX de clientes");
    expect(resultado.confiancaSugestao).toBeGreaterThanOrEqual(70);
  });

  it("não aplica regra quando o termo da descrição não corresponde", () => {
    const [resultado] = sugerirCorrespondencias(
      [linha],
      [movimento],
      [{ ...regra, termo_descricao: "boleto" }],
    );

    expect(resultado.movimentoSugeridoId).toBeUndefined();
  });

  it("prioriza a regra de maior prioridade", () => {
    const [resultado] = sugerirCorrespondencias(
      [linha],
      [movimento],
      [
        { ...regra, id: "baixa", nome: "Baixa", prioridade: 10 },
        { ...regra, id: "alta", nome: "Alta", prioridade: 200 },
      ],
    );

    expect(resultado.regraSugeridaId).toBe("alta");
  });

  it("preserva o fallback exato de valor e data", () => {
    const [resultado] = sugerirCorrespondencias(
      [linha],
      [{ ...movimento, valor: 100 }],
    );

    expect(resultado.movimentoSugeridoId).toBe("movimento-1");
    expect(resultado.regraSugeridaId).toBeUndefined();
    expect(resultado.criterioSugestao).toContain("Valor exato");
  });
});

describe("filtrarBaixasAtivas", () => {
  it("exclui uma baixa quando existe estorno posterior", () => {
    const baixa = {
      ...movimento,
      registro_id: "conta-1",
      operacao: "Baixa",
      created_at: "2026-07-24T10:00:00Z",
    };
    const estorno = {
      ...baixa,
      id: "estorno-1",
      operacao: "Estorno",
      created_at: "2026-07-25T10:00:00Z",
    };

    expect(filtrarBaixasAtivas([baixa, estorno])).toEqual([]);
  });

  it("mantém uma nova baixa feita depois do estorno", () => {
    const estorno = {
      ...movimento,
      id: "estorno-1",
      registro_id: "conta-1",
      operacao: "Estorno",
      created_at: "2026-07-25T10:00:00Z",
    };
    const novaBaixa = {
      ...estorno,
      id: "baixa-2",
      operacao: "Baixa",
      created_at: "2026-07-26T10:00:00Z",
    };

    expect(filtrarBaixasAtivas([estorno, novaBaixa])).toEqual([novaBaixa]);
  });
});
