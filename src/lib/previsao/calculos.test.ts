import { describe, expect, it } from "vitest";
import { calcularPrevisaoComercial } from "./calculos";

describe("previsão comercial", () => {
  it("projeta o mês pelo ritmo e pelo pipeline ponderado", () => {
    const resultado = calcularPrevisaoComercial({
      vendas: [{ data: "2026-08-03T12:00:00", valor: 900 }],
      comissoes: [{ data: "2026-08-03T12:00:00", valor: 27 }],
      pipeline: [{ valor: 10_000, probabilidade: 50, status: "Aberto" }],
      metas: [{ tipo: "Vendas", valor: 15_000, mes: 8, ano: 2026, periodo: "Mensal" }],
      referencia: new Date(2026, 7, 3),
    });
    expect(resultado.cenarioProvavel).toBeCloseTo(14_300);
    expect(resultado.pipelinePonderado).toBe(5_000);
    expect(resultado.necessarioPorDiaVendas).toBeCloseTo(503.57, 1);
  });

  it("ignora oportunidades fechadas", () => {
    const resultado = calcularPrevisaoComercial({
      vendas: [], comissoes: [], metas: [], referencia: new Date(2026, 7, 3),
      pipeline: [{ valor: 50_000, probabilidade: 100, status: "Fechado" }],
    });
    expect(resultado.pipelinePonderado).toBe(0);
  });

  it("compara o ritmo diário com o mês anterior", () => {
    const resultado = calcularPrevisaoComercial({
      vendas: [
        { data: "2026-08-10T12:00:00", valor: 10_000 },
        { data: "2026-07-15T12:00:00", valor: 15_500 },
      ],
      comissoes: [], pipeline: [], metas: [], referencia: new Date(2026, 7, 10),
    });
    expect(resultado.tendenciaPercentual).toBe(100);
  });
});
