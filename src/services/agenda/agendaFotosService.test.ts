import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/lib/offline/agendaOffline", () => ({ navegadorOnline: vi.fn(() => true) }));
vi.mock("@/lib/offline/agendaFotosOffline", () => ({
  listarFotosAgendaOffline: vi.fn(),
  removerFotoAgendaOffline: vi.fn(),
  salvarFotoAgendaOffline: vi.fn(),
}));

import { normalizarNomeArquivo } from "./agendaFotosService";

describe("fotos da agenda", () => {
  it("normaliza o nome antes de enviar ao armazenamento", () => {
    expect(normalizarNomeArquivo("Visita São José 01.jpg")).toBe("Visita-Sao-Jose-01.jpg");
  });

  it("usa um nome seguro quando o original não tem caracteres válidos", () => {
    expect(normalizarNomeArquivo("###")).toBe("foto.jpg");
  });
});
