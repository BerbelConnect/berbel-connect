import { listarOperacoesAgendaOffline, navegadorOnline, removerOperacaoAgenda } from "./agendaOffline";
import { iniciarVisitaOnline, registrarResultadoVisitaOnline, salvarVisitaOnline } from "../../services/agenda/agendaCrudService";
let executando = false;
export async function sincronizarAgendaOffline() {
  if (!navegadorOnline()) return { sincronizados: 0, mensagem: "Ainda está sem internet." };
  if (executando) return { sincronizados: 0, mensagem: "A agenda já está sincronizando." };
  executando = true; let sincronizados = 0;
  try {
    for (const item of listarOperacoesAgendaOffline()) {
      const erro = item.tipo === "salvar" ? await salvarVisitaOnline(item.form) : item.tipo === "resultado" ? await registrarResultadoVisitaOnline(item.visita, item.resultado) : await iniciarVisitaOnline(item.visita_id);
      if (erro) break;
      removerOperacaoAgenda(item.id); sincronizados += 1;
    }
    return { sincronizados, mensagem: sincronizados ? `${sincronizados} registro(s) da agenda sincronizado(s).` : "Nenhum registro da agenda para sincronizar." };
  } finally { executando = false; }
}
