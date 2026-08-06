import { describe, expect, it } from "vitest";
import { diasDoCalendarioMes, intervaloAgenda } from "./agendaPeriodo";

describe("períodos da agenda", () => {
  it("calcula uma semana de segunda a domingo", () => {
    expect(intervaloAgenda("2026-08-06", "semana")).toEqual({
      inicio: "2026-08-03",
      fim: "2026-08-09",
    });
  });

  it("calcula os limites do mês", () => {
    expect(intervaloAgenda("2026-02-10", "mes")).toEqual({
      inicio: "2026-02-01",
      fim: "2026-02-28",
    });
  });

  it("gera seis semanas para o calendário mensal", () => {
    expect(diasDoCalendarioMes("2026-08-06")).toHaveLength(42);
  });
});
