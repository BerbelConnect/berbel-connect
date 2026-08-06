export function normalizarMotivoArquivamento(motivo: string) {
  const normalizado = motivo.trim();
  if (normalizado.length < 5) throw new Error("Informe um motivo com pelo menos 5 caracteres.");
  return normalizado;
}
