import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaResultadoFormData, AgendaVisita } from "@/types/agenda";

const { rpc, from, update, eq } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc, from },
}));

vi.mock("@/services/arquivamentoComercial", () => ({
  alterarArquivamentoComercial: vi.fn(),
}));

import { registrarResultadoVisita, salvarProgressoVisitaOnline } from "./agendaCrudService";

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
    prioridade_retorno: "Alta",
    checklist: [],
    ...parcial,
  };
}

describe("resultado e retorno da agenda", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    eq.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    from.mockReturnValue({ update });
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
      p_prioridade_retorno: "Alta",
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

  it("salva o progresso do checklist sem concluir a visita", async () => {
    await expect(salvarProgressoVisitaOnline(visita, resultado({
      resultado: "Atendimento em andamento",
      checklist: [{ id: "etapa-1", texto: "Apresentar catálogo", concluido: true }],
    }))).resolves.toBeNull();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      status: "Em andamento",
      resultado: "Atendimento em andamento",
      checklist: [{ id: "etapa-1", texto: "Apresentar catálogo", concluido: true }],
    }));
  });
});
