import { describe, expect, it } from "vitest";
import { enderecoVisita, ordenarVisitasRota, urlRotaGoogleMaps, type RotaVisita } from "./agendaRota";

describe("integração entre agenda e roteirizador", () => {
  it("prioriza o endereço informado no contato avulso", () => {
    expect(enderecoVisita({ id: "1", data_visita: "2026-08-27", contato_avulso_endereco: "Rua A, 10" })).toBe("Rua A, 10");
  });

  it("monta o endereço completo do cliente", () => {
    expect(enderecoVisita({ id: "1", data_visita: "2026-08-27", clientes: { endereco: "Rua B", numero: "20", cidade: "São Paulo", estado: "SP" } })).toBe("Rua B, 20, São Paulo, SP");
  });

  it("ordena primeiro pela ordem salva e depois pelo horário", () => {
    const visitas = [
      { id: "b", data_visita: "2026-08-27", hora_visita: "10:00", ordem_rota: 2 },
      { id: "a", data_visita: "2026-08-27", hora_visita: "09:00", ordem_rota: 1 },
    ] as RotaVisita[];
    expect(ordenarVisitasRota(visitas).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("gera uma rota com origem, paradas e destino", () => {
    const url = urlRotaGoogleMaps(["Rua A", "Rua B", "Rua C"]);
    expect(url).toContain("origin=Rua%20A");
    expect(url).toContain("waypoints=Rua%20B");
    expect(url).toContain("destination=Rua%20C");
  });
});
