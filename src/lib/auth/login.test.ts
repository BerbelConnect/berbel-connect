import { describe, expect, it } from "vitest";
import { prepararCredenciaisLogin } from "./login";

describe("preparar credenciais de login", () => {
  it("exige e-mail e senha", () => {
    expect(prepararCredenciaisLogin("", "").erro).toBe("Informe e-mail e senha.");
    expect(prepararCredenciaisLogin("usuario@empresa.com", "").erro).toBe("Informe e-mail e senha.");
  });

  it("rejeita e-mail inválido antes de consultar a autenticação", () => {
    expect(prepararCredenciaisLogin("usuario-sem-dominio", "senha").erro).toBe("Informe um e-mail válido.");
  });

  it("normaliza espaços e letras maiúsculas do e-mail sem alterar a senha", () => {
    expect(prepararCredenciaisLogin(" Usuario@Empresa.COM ", " senha secreta ")).toEqual({
      erro: null,
      email: "usuario@empresa.com",
      senha: " senha secreta ",
    });
  });
});
