import { describe, expect, it } from "vitest";
import { diasDoCalendarioMes, filtrarPorPeriodo, intervaloAgenda } from "./agendaPeriodo";
import type { AgendaVisita } from "@/types/agenda";

describe("períodos da agenda", () => {
  it("calcula o período diário", () => {
    expect(intervaloAgenda("2026-08-06", "dia")).toEqual({
      inicio: "2026-08-06",
      fim: "2026-08-06",
    });
  });

  it("calcula uma semana de segunda a domingo", () => {
    expect(intervaloAgenda("2026-08-06", "semana")).toEqual({
      inicio: "2026-08-03",
      fim: "2026-08-09",
    });
  });

  it("mantém o domingo na semana que termina nesse dia", () => {
    expect(intervaloAgenda("2026-08-09", "semana")).toEqual({
      inicio: "2026-08-03",
      fim: "2026-08-09",
    });
  });

  it("calcula os limites de fevereiro em ano comum e bissexto", () => {
    expect(intervaloAgenda("2026-02-10", "mes")).toEqual({
      inicio: "2026-02-01",
      fim: "2026-02-28",
    });
    expect(intervaloAgenda("2028-02-10", "mes")).toEqual({
      inicio: "2028-02-01",
      fim: "2028-02-29",
    });
  });

  it("filtra visitas dentro do período selecionado", () => {
    const visitas = [
      { id: "anterior", data_visita: "2026-08-02" },
      { id: "inicio", data_visita: "2026-08-03" },
      { id: "fim", data_visita: "2026-08-09" },
      { id: "seguinte", data_visita: "2026-08-10" },
    ] as AgendaVisita[];

    expect(filtrarPorPeriodo(visitas, "2026-08-06", "semana").map((visita) => visita.id)).toEqual([
      "inicio",
      "fim",
    ]);
  });

  it("gera seis semanas para o calendário mensal", () => {
    const dias = diasDoCalendarioMes("2026-08-06");
    expect(dias).toHaveLength(42);
    expect(dias[0]).toEqual({ data: "2026-07-26", pertenceAoMes: false });
    expect(dias[41]).toEqual({ data: "2026-09-05", pertenceAoMes: false });
  });
});
