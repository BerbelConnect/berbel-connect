import { describe, expect, it } from "vitest";
import { listarVisitasQuePrecisamAtencao } from "./agendaAtencao";
import type { AgendaVisita } from "@/types/agenda";

const base = { id: "1", cliente_id: null, contato_avulso_nome: "Teste", data_visita: "2026-08-20", hora_visita: null, tipo_contato: "Presencial", bairro: "", status: "Agendada", resultado: "", oportunidade: "", valor_potencial: 0, observacoes: "", alerta_retorno: false } as AgendaVisita;

describe("central precisa de atenção", () => {
  it("inclui visita atrasada com checklist incompleto", () => {
    const itens = listarVisitasQuePrecisamAtencao([{ ...base, checklist: [{ id: "a", texto: "Enviar proposta", concluido: false }] }], "2026-08-25");
    expect(itens[0].motivos).toContain("Compromisso atrasado");
    expect(itens[0].motivos).toContain("Checklist incompleto");
  });
  it("ignora visita cancelada", () => expect(listarVisitasQuePrecisamAtencao([{ ...base, status: "Cancelada" }], "2026-08-25")).toEqual([]));
});
