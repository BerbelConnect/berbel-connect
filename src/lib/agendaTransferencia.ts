import type { AgendaVisita } from "@/types/agenda";

function diferencaDias(inicio: string, fim: string) {
  const [ai, mi, di] = inicio.split("-").map(Number);
  const [af, mf, df] = fim.split("-").map(Number);
  return Math.max(1, Math.round((Date.UTC(af, mf - 1, df) - Date.UTC(ai, mi - 1, di)) / 86_400_000));
}

export function transferirPendenciasLocais(visitas: AgendaVisita[], hoje: string): AgendaVisita[] {
  return visitas.map((visita) => {
    if (["Concluída", "Cancelada"].includes(visita.status) || visita.data_visita >= hoje) return visita;
    const dias = diferencaDias(visita.data_visita, hoje);
    return {
      ...visita,
      data_original: visita.data_original || visita.data_visita,
      data_visita: hoje,
      quantidade_transferencias: (visita.quantidade_transferencias || 0) + dias,
      ultima_transferencia_data: hoje,
      transferido_em: new Date().toISOString(),
    };
  });
}
