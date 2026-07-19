import { describe, expect, it } from "vitest";
import {
  adicionarDiasISO,
  extrairPrazosPagamento,
  gerarPlanoPagamento,
} from "./condicaoPagamento";

describe("condição de pagamento", () => {
  it("reconhece pagamento à vista", () => {
    expect(extrairPrazosPagamento("À vista")).toEqual({
      prazos: [0],
      automatico: true,
      aviso: null,
    });
  });

  it("extrai uma condição simples em DDL", () => {
    expect(extrairPrazosPagamento("Boleto 28 DDL").prazos).toEqual([28]);
  });

  it("extrai vários vencimentos", () => {
    expect(
      extrairPrazosPagamento("Boleto 30/45/60 dias").prazos
    ).toEqual([30, 45, 60]);
  });

  it("remove prazos repetidos", () => {
    expect(extrairPrazosPagamento("30/30/60").prazos).toEqual([30, 60]);
  });

  it("mantém condição manual compatível com o comportamento atual", () => {
    const resultado = extrairPrazosPagamento("A combinar");

    expect(resultado.prazos).toEqual([0]);
    expect(resultado.automatico).toBe(false);
    expect(resultado.aviso).toContain("vencimento único");
  });

  it("não deixa uma condição extensa derrubar a tela", () => {
    const condicao = Array.from({ length: 25 }, (_, indice) => indice + 1).join(
      "/"
    );
    const resultado = extrairPrazosPagamento(condicao);

    expect(resultado.automatico).toBe(false);
    expect(resultado.prazos).toEqual([0]);
  });
});

describe("plano de parcelas", () => {
  it("soma exatamente o total, inclusive com centavos", () => {
    const plano = gerarPlanoPagamento(
      100,
      "2026-07-18",
      "30/60/90 dias"
    );

    expect(plano.parcelas.map((parcela) => parcela.valor)).toEqual([
      33.33,
      33.33,
      33.34,
    ]);
    expect(
      plano.parcelas.reduce((total, parcela) => total + parcela.valor, 0)
    ).toBeCloseTo(100, 2);
  });

  it("calcula os vencimentos sem depender do fuso local", () => {
    const plano = gerarPlanoPagamento(
      900,
      "2026-07-18",
      "30/60/90 dias"
    );

    expect(plano.parcelas.map((parcela) => parcela.vencimento)).toEqual([
      "2026-08-17",
      "2026-09-16",
      "2026-10-16",
    ]);
  });

  it("atravessa a virada do ano corretamente", () => {
    expect(adicionarDiasISO("2026-12-20", 30)).toBe("2027-01-19");
  });

  it("recusa data inválida", () => {
    expect(() => adicionarDiasISO("2026-02-30", 1)).toThrow(
      "data-base do pagamento é inválida"
    );
  });

  it("recusa total negativo", () => {
    expect(() =>
      gerarPlanoPagamento(-1, "2026-07-18", "À vista")
    ).toThrow("valor total do pedido é inválido");
  });
});
