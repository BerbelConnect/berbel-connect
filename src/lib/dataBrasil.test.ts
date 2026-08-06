import { describe, expect, it } from "vitest";
import {
  adicionarDiasDataIso,
  adicionarMesesDataIso,
  dataIsoBrasil,
  fimMesBrasil,
  inicioMesBrasil,
  mesIsoBrasil,
} from "./dataBrasil";

describe("datas no fuso do Brasil", () => {
  it("mantém o dia brasileiro quando UTC já está no dia seguinte", () => {
    const instante = new Date("2026-08-07T01:30:00.000Z");
    expect(dataIsoBrasil(instante)).toBe("2026-08-06");
  });

  it("retorna o dia anterior no Brasil antes das três da manhã UTC", () => {
    const instante = new Date("2026-08-06T02:30:00.000Z");
    expect(dataIsoBrasil(instante)).toBe("2026-08-05");
    expect(mesIsoBrasil(instante)).toBe("2026-08");
  });

  it("calcula início e fim do mês civil brasileiro", () => {
    const instante = new Date("2028-02-15T12:00:00.000Z");
    expect(inicioMesBrasil(instante)).toBe("2028-02-01");
    expect(fimMesBrasil(instante)).toBe("2028-02-29");
  });

  it("faz aritmética civil sem deslocamento de fuso", () => {
    expect(adicionarDiasDataIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(adicionarMesesDataIso("2028-02-29", 12)).toBe("2029-02-28");
  });
});
