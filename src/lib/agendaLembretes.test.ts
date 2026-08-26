import { describe, expect, it } from "vitest";
import type { AgendaVisita } from "@/types/agenda";
import { dataLembreteVisita, lembretePendente, podeRepetirNotificacao } from "./agendaLembretes";

const visita = { id: "1", cliente_id: null, contato_avulso_nome: "Teste", data_visita: "2026-08-26", hora_visita: "10:00", tipo_contato: "Presencial", bairro: "", status: "Agendada", resultado: "", oportunidade: "", valor_potencial: 0, observacoes: "", alerta_retorno: false, lembrete_antecedencia_minutos: 30, lembrete_repetir: true, lembrete_intervalo_minutos: 15 } as AgendaVisita;

describe("lembretes da agenda", () => {
  it("calcula o aviso antes do compromisso", () => {
    const data = dataLembreteVisita(visita);
    expect(data?.getHours()).toBe(9);
    expect(data?.getMinutes()).toBe(30);
  });
  it("mantém o aviso pendente até concluir", () => {
    expect(lembretePendente(visita, new Date("2026-08-26T10:00:00"))).toBe(true);
    expect(lembretePendente({ ...visita, status: "Concluída" }, new Date("2026-08-26T10:00:00"))).toBe(false);
  });
  it("respeita o intervalo de repetição", () => {
    expect(podeRepetirNotificacao(visita, "2026-08-26T09:50:00", new Date("2026-08-26T10:00:00"))).toBe(false);
    expect(podeRepetirNotificacao(visita, "2026-08-26T09:40:00", new Date("2026-08-26T10:00:00"))).toBe(true);
  });
});
