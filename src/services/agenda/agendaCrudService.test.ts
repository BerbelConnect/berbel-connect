import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaResultadoFormData, AgendaVisita } from "@/types/agenda";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc },
}));

vi.mock("@/services/arquivamentoComercial", () => ({
  alterarArquivamentoComercial: vi.fn(),
}));

import { registrarResultadoVisita } from "./agendaCrudService";

const visita = { id: "visita-1" } as AgendaVisita;

function resultado(parcial: Partial<AgendaResultadoFormData> = {}): AgendaResultadoFormData {
  return {
    pessoa_atendida: "Maria",
    resultado: "Cliente aprovou a proposta",
    proxima_acao: "Enviar amostras",
    data_retorno: "2026-08-20",
    hora_retorno: "09:30",
    lembrete_em: "",
    agendar_retorno: false,
    ...parcial,
  };
}

describe("resultado e retorno da agenda", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("conclui a visita sem criar retorno quando a opção não está marcada", async () => {
    await expect(registrarResultadoVisita(visita, resultado())).resolves.toBeNull();

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("concluir_visita_com_retorno", expect.objectContaining({
      p_visita_id: "visita-1",
      p_resultado: "Cliente aprovou a proposta",
      p_data_retorno: "2026-08-20",
      p_hora_retorno: "09:30",
      p_agendar_retorno: false,
    }));
  });

  it("solicita a criação do retorno somente quando a opção está marcada", async () => {
    await registrarResultadoVisita(visita, resultado({ agendar_retorno: true }));

    expect(rpc).toHaveBeenCalledWith("concluir_visita_com_retorno", expect.objectContaining({
      p_visita_id: "visita-1",
      p_agendar_retorno: true,
    }));
  });

  it("normaliza campos opcionais vazios para null", async () => {
    await registrarResultadoVisita(visita, resultado({
      pessoa_atendida: "",
      proxima_acao: "",
      data_retorno: "",
      hora_retorno: "",
    }));

    expect(rpc).toHaveBeenCalledWith("concluir_visita_com_retorno", expect.objectContaining({
      p_pessoa_atendida: null,
      p_proxima_acao: null,
      p_data_retorno: null,
      p_hora_retorno: null,
      p_lembrete_em: null,
    }));
  });

  it("devolve o erro recebido do banco", async () => {
    const error = { message: "Falha ao concluir visita" };
    rpc.mockResolvedValueOnce({ error });

    await expect(registrarResultadoVisita(visita, resultado())).resolves.toBe(error);
  });
});
