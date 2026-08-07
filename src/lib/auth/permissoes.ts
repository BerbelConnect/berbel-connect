export const PERFIS = [
  "Administrador",
  "Representante",
  "Financeiro",
  "Assistente",
] as const;

export type PerfilUsuario = (typeof PERFIS)[number];

export type PerfilAcesso = {
  perfil: string;
  ativo: boolean;
} | null;

export const ROTAS_PUBLICAS = [
  "/login",
  "/recuperar-senha",
  "/atualizar-senha",
] as const;

export const PERMISSOES_ROTAS: ReadonlyArray<{
  prefixo: string;
  perfis: readonly PerfilUsuario[];
}> = [
  { prefixo: "/dashboard", perfis: PERFIS },
  { prefixo: "/clientes", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/fornecedores", perfis: ["Administrador", "Assistente"] },
  { prefixo: "/representadas", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/produtos", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/pedidos", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/agenda", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/visitas", perfis: ["Administrador", "Representante", "Assistente"] },
  { prefixo: "/rotas", perfis: ["Administrador", "Representante"] },
  { prefixo: "/pipeline", perfis: ["Administrador", "Representante"] },
  { prefixo: "/ia-comercial", perfis: ["Administrador", "Representante"] },
  { prefixo: "/previsao-comercial", perfis: ["Administrador", "Representante"] },
  { prefixo: "/alertas", perfis: ["Administrador", "Representante", "Financeiro"] },
  { prefixo: "/financeiro", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/comissoes", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/relatorios-comerciais", perfis: ["Administrador", "Representante"] },
  { prefixo: "/exportacoes", perfis: ["Administrador", "Financeiro"] },
  { prefixo: "/usuarios", perfis: ["Administrador"] },
  { prefixo: "/metas", perfis: ["Administrador", "Representante"] },
];

export type DecisaoAcesso =
  | "permitir"
  | "redirecionar-login"
  | "redirecionar-dashboard"
  | "encerrar-sessao";

export function rotaCorresponde(pathname: string, prefixo: string): boolean {
  return pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

export function rotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => rotaCorresponde(pathname, rota));
}

export function perfilPodeAcessar(pathname: string, perfil: string): boolean {
  const regra = PERMISSOES_ROTAS.find((item) =>
    rotaCorresponde(pathname, item.prefixo)
  );

  return !regra || regra.perfis.some((permitido) => permitido === perfil);
}

export function decidirAcesso({
  pathname,
  temUsuario,
  perfil,
}: {
  pathname: string;
  temUsuario: boolean;
  perfil: PerfilAcesso;
}): DecisaoAcesso {
  if (!temUsuario) {
    return rotaPublica(pathname) ? "permitir" : "redirecionar-login";
  }

  if (pathname === "/login") return "redirecionar-dashboard";
  if (rotaPublica(pathname)) return "permitir";
  if (!perfil?.ativo) return "encerrar-sessao";

  return perfilPodeAcessar(pathname, perfil.perfil)
    ? "permitir"
    : "redirecionar-dashboard";
}
