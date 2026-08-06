import { describe, expect, it } from "vitest";
import { normalizarMotivoArquivamento } from "./arquivamentoComercial";

describe("normalizarMotivoArquivamento", () => {
  it("remove espaços externos", () => expect(normalizarMotivoArquivamento("  cadastro duplicado  ")).toBe("cadastro duplicado"));
  it("rejeita motivo vazio", () => expect(() => normalizarMotivoArquivamento("   ")).toThrow("pelo menos 5 caracteres"));
  it("rejeita motivo curto", () => expect(() => normalizarMotivoArquivamento("erro")).toThrow("pelo menos 5 caracteres"));
});
