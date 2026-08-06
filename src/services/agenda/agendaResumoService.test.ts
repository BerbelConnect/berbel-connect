import { describe, expect, it } from "vitest";
import type { AgendaVisita } from "../../types/agenda";
import { gerarResumo } from "./agendaResumoService";

const base: AgendaVisita = { id:"1", cliente_id:"cliente", data_visita:"2099-01-01", hora_visita:null, tipo_contato:"Presencial", bairro:"Centro", status:"Agendada", resultado:"", oportunidade:"", valor_potencial:100, observacoes:"", alerta_retorno:false };
describe("gerarResumo", () => { it("não inclui visitas canceladas", () => { const r=gerarResumo([{...base,status:"Cancelada"}]); expect(r.proximasCount).toBe(0); expect(r.potencialTotal).toBe(0); }); });
