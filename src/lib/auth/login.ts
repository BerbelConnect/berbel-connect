export function prepararCredenciaisLogin(email: string, senha: string) {
  const emailNormalizado = email.trim().toLowerCase();

  if (!emailNormalizado || !senha) {
    return { erro: "Informe e-mail e senha.", email: emailNormalizado, senha };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    return { erro: "Informe um e-mail válido.", email: emailNormalizado, senha };
  }

  return { erro: null, email: emailNormalizado, senha };
}
