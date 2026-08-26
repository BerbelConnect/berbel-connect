import { describe, expect, it } from "vitest";
import type { AgendaVisita } from "@/types/agenda";
import { transferirPendenciasLocais } from "./agendaTransferencia";

const base = { id: "1", cliente_id: null, contato_avulso_nome: "Teste", data_visita: "2026-08-23", hora_visita: null, tipo_contato: "Presencial", bairro: "", status: "Agendada", resultado: "", oportunidade: "", valor_potencial: 0, observacoes: "", alerta_retorno: false } as AgendaVisita;

describe("transferência diária da agenda", () => {
  it("leva a pendência ao dia atual preservando a origem", () => {
    const [visita] = transferirPendenciasLocais([base], "2026-08-26");
    expect(visita.data_visita).toBe("2026-08-26");
    expect(visita.data_original).toBe("2026-08-23");
    expect(visita.quantidade_transferencias).toBe(3);
  });
  it("não transfere concluídas nem duplica a transferência do dia", () => {
    expect(transferirPendenciasLocais([{ ...base, status: "Concluída" }], "2026-08-26")[0].data_visita).toBe("2026-08-23");
    const atual = { ...base, data_visita: "2026-08-26", quantidade_transferencias: 3 };
    expect(transferirPendenciasLocais([atual], "2026-08-26")[0].quantidade_transferencias).toBe(3);
  });
});
