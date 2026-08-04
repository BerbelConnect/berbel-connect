import { describe, expect, it } from "vitest";
import { diasEntre, montarAcompanhamento, prioridadeCobranca } from "./acompanhamento";

describe("acompanhamento de cobranças", () => {
  it("calcula dias de atraso sem valores negativos", () => {
    expect(diasEntre("2026-07-01", "2026-07-11")).toBe(10);
    expect(diasEntre("2026-07-20", "2026-07-11")).toBe(0);
  });
  it("prioriza prazo e valor", () => {
    expect(prioridadeCobranca(35, 100)).toBe("Crítica");
    expect(prioridadeCobranca(16, 200)).toBe("Alta");
    expect(prioridadeCobranca(8, 100)).toBe("Média");
    expect(prioridadeCobranca(2, 100)).toBe("Baixa");
  });
  it("exclui recebidas e associa o último contato", () => {
    const comissoes = [
      { id: "1", empresa: "R&E", cliente: "Cliente A", pedido: "1", valor: 300, previsao: "2026-07-01", status: "Pendente" },
      { id: "2", empresa: "Fibrart", cliente: "Cliente B", pedido: "2", valor: 100, previsao: "2026-07-10", status: "Recebida" },
    ];
    const registros = [{ id: "c1", comissao_id: "1", contato_em: "2026-07-05T10:00:00Z", canal: "WhatsApp", resultado: "Sem retorno", promessa_data: null, promessa_valor: null, observacoes: "Mensagem enviada" }];
    const resultado = montarAcompanhamento(comissoes, registros, "2026-07-11");
    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].ultimoContato?.canal).toBe("WhatsApp");
    expect(resultado.totalPendente).toBe(300);
    expect(resultado.semContato).toBe(0);
  });
});
