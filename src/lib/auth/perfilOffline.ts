import type { PerfilAcesso } from "./permissoes";

const PREFIXO = "berbel-connect:perfil-validado:";
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

type PerfilOffline = {
  perfil: string;
  ativo: boolean;
  validadoEm: number;
};

function chave(email: string): string {
  return `${PREFIXO}${email.trim().toLowerCase()}`;
}

export function salvarPerfilOffline(email: string, perfil: NonNullable<PerfilAcesso>): void {
  if (typeof window === "undefined") return;

  const registro: PerfilOffline = {
    perfil: perfil.perfil,
    ativo: perfil.ativo,
    validadoEm: Date.now(),
  };

  window.localStorage.setItem(chave(email), JSON.stringify(registro));
}

export function carregarPerfilOffline(email: string, agora = Date.now()): PerfilAcesso {
  if (typeof window === "undefined") return null;

  try {
    const valor = window.localStorage.getItem(chave(email));
    if (!valor) return null;

    const registro = JSON.parse(valor) as Partial<PerfilOffline>;
    const valido =
      typeof registro.perfil === "string" &&
      typeof registro.ativo === "boolean" &&
      typeof registro.validadoEm === "number" &&
      agora - registro.validadoEm <= VALIDADE_MS;

    if (!valido) {
      window.localStorage.removeItem(chave(email));
      return null;
    }

    return { perfil: registro.perfil as string, ativo: registro.ativo as boolean };
  } catch {
    window.localStorage.removeItem(chave(email));
    return null;
  }
}

export function limparPerfilOffline(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(chave(email));
}
