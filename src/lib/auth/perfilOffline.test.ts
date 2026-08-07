import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarPerfilOffline, limparPerfilOffline, salvarPerfilOffline } from "./perfilOffline";

const armazenamento = new Map<string, string>();

beforeEach(() => {
  vi.restoreAllMocks();
  armazenamento.clear();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (chave: string) => armazenamento.get(chave) ?? null,
      setItem: (chave: string, valor: string) => armazenamento.set(chave, valor),
      removeItem: (chave: string) => armazenamento.delete(chave),
    },
  });
});

describe("perfil validado para uso offline", () => {
  it("recupera o último perfil validado usando e-mail normalizado", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    salvarPerfilOffline(" Usuario@Empresa.COM ", { perfil: "Representante", ativo: true });
    expect(carregarPerfilOffline("usuario@empresa.com", 2_000)).toEqual({
      perfil: "Representante",
      ativo: true,
    });
  });

  it("recusa um perfil validado há mais de 30 dias", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    salvarPerfilOffline("usuario@empresa.com", { perfil: "Administrador", ativo: true });
    expect(carregarPerfilOffline("usuario@empresa.com", 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("permite remover o perfil ao encerrar a sessão", () => {
    salvarPerfilOffline("usuario@empresa.com", { perfil: "Financeiro", ativo: true });
    limparPerfilOffline("usuario@empresa.com");
    expect(carregarPerfilOffline("usuario@empresa.com")).toBeNull();
  });
});
