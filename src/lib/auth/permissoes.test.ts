import { describe, expect, it } from "vitest";
import {
  decidirAcesso,
  PERMISSOES_ROTAS,
  perfilPodeAcessar,
  rotaCorresponde,
  rotaPublica,
} from "./permissoes";

describe("política de autenticação", () => {
  it("permite páginas públicas sem sessão", () => {
    expect(decidirAcesso({ pathname: "/login", temUsuario: false, perfil: null })).toBe("permitir");
    expect(decidirAcesso({ pathname: "/recuperar-senha", temUsuario: false, perfil: null })).toBe("permitir");
  });

  it("envia usuário sem sessão para o login", () => {
    expect(decidirAcesso({ pathname: "/clientes", temUsuario: false, perfil: null })).toBe("redirecionar-login");
  });

  it("envia usuário autenticado para o dashboard ao abrir o login", () => {
    expect(decidirAcesso({ pathname: "/login", temUsuario: true, perfil: null })).toBe("redirecionar-dashboard");
  });

  it("encerra a sessão de perfil ausente ou inativo", () => {
    expect(decidirAcesso({ pathname: "/dashboard", temUsuario: true, perfil: null })).toBe("encerrar-sessao");
    expect(decidirAcesso({ pathname: "/dashboard", temUsuario: true, perfil: { perfil: "Representante", ativo: false } })).toBe("encerrar-sessao");
  });
});

describe("permissões por perfil", () => {
  it("permite ao Administrador todas as rotas cadastradas", () => {
    for (const regra of PERMISSOES_ROTAS) {
      expect(perfilPodeAcessar(regra.prefixo, "Administrador")).toBe(true);
    }
  });

  it("reserva usuários ao Administrador", () => {
    expect(perfilPodeAcessar("/usuarios", "Administrador")).toBe(true);
    expect(perfilPodeAcessar("/usuarios", "Representante")).toBe(false);
  });

  it("reserva o financeiro ao Administrador e Financeiro", () => {
    expect(perfilPodeAcessar("/financeiro/contas-pagar", "Financeiro")).toBe(true);
    expect(perfilPodeAcessar("/financeiro/contas-pagar", "Assistente")).toBe(false);
  });

  it("libera clientes ao Assistente, mas não ao Financeiro", () => {
    expect(perfilPodeAcessar("/clientes/historico-360", "Assistente")).toBe(true);
    expect(perfilPodeAcessar("/clientes", "Financeiro")).toBe(false);
  });

  it("libera rotas e previsão somente ao Administrador e Representante", () => {
    expect(perfilPodeAcessar("/rotas", "Representante")).toBe(true);
    expect(perfilPodeAcessar("/previsao-comercial", "Representante")).toBe(true);
    expect(perfilPodeAcessar("/rotas", "Assistente")).toBe(false);
  });

  it("redireciona um perfil autenticado quando a rota não é permitida", () => {
    expect(decidirAcesso({
      pathname: "/financeiro/contas-pagar",
      temUsuario: true,
      perfil: { perfil: "Representante", ativo: true },
    })).toBe("redirecionar-dashboard");
  });

  it("permite a rota protegida quando o perfil está ativo e autorizado", () => {
    expect(decidirAcesso({
      pathname: "/agenda",
      temUsuario: true,
      perfil: { perfil: "Assistente", ativo: true },
    })).toBe("permitir");
  });

  it("não confunde prefixos apenas parecidos", () => {
    expect(rotaCorresponde("/financeiro/contas", "/financeiro")).toBe(true);
    expect(rotaCorresponde("/financeiro-malicioso", "/financeiro")).toBe(false);
  });

  it("reconhece somente páginas públicas exatas e seus segmentos", () => {
    expect(rotaPublica("/login")).toBe(true);
    expect(rotaPublica("/login-falso")).toBe(false);
  });
});
