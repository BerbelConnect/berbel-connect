import { describe, expect, it } from "vitest";
import { calcularProgressoMeta, dentroDoPeriodo, type MetaComercial } from "./calculos";

const meta: MetaComercial = {
  id: "1", titulo: "Agosto", tipo: "Vendas", valor_meta: 10_000,
  periodo: "Mensal", mes: 8, ano: 2026, cliente_id: null,
  representada: null, observacoes: null,
};

describe("cálculos de metas", () => {
  it("considera somente registros do período da meta", () => {
    expect(dentroDoPeriodo("2026-08-03T12:00:00", meta)).toBe(true);
    expect(dentroDoPeriodo("2026-07-31T12:00:00", meta)).toBe(false);
  });

  it("calcula realizado, restante e meta atingida", () => {
    const resultado = calcularProgressoMeta(meta, [
      { created_at: "2026-08-03T12:00:00", valor: 6_000, cliente_id: null },
      { created_at: "2026-08-10T12:00:00", valor: 5_000, cliente_id: null },
      { created_at: "2026-07-10T12:00:00", valor: 99_000, cliente_id: null },
    ], null, new Date(2026, 7, 15));

    expect(resultado.realizado).toBe(11_000);
    expect(resultado.restante).toBe(0);
    expect(resultado.situacao).toBe("Atingida");
  });

  it("respeita o cliente selecionado", () => {
    const resultado = calcularProgressoMeta({ ...meta, cliente_id: "cliente-a" }, [
      { created_at: "2026-08-03T12:00:00", valor: 2_000, cliente_id: "cliente-a" },
      { created_at: "2026-08-03T12:00:00", valor: 8_000, cliente_id: "cliente-b" },
    ], null, new Date(2026, 7, 15));
    expect(resultado.realizado).toBe(2_000);
  });
});
