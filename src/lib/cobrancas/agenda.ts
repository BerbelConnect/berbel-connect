import type { ItemCobranca, RegistroCobranca } from "./acompanhamento";

export type CompromissoCobranca = {
  chave: string;
  comissaoId: string;
  empresa: string;
  cliente: string;
  pedido: string;
  valor: number;
  data: string;
  tipo: "Promessa" | "Cobrança";
  urgencia: "Atrasada" | "Hoje" | "Próxima";
  mensagem: string;
};

const dataIso = (data: Date) => data.toISOString().slice(0, 10);
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (valor: string) => new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR");

export function mensagemCobranca(empresa: string, valor: number, data: string, promessa = false) {
  return promessa
    ? `Olá! Tudo bem? Estou acompanhando a comissão de ${moeda(valor)} referente à ${empresa}. Conforme nosso contato, o pagamento ficou previsto para ${dataBr(data)}. Poderia confirmar, por favor?`
    : `Olá! Tudo bem? Estou entrando em contato para acompanhar a comissão de ${moeda(valor)} referente à ${empresa}, com previsão em ${dataBr(data)}. Poderia verificar, por favor?`;
}

export function montarAgendaCobrancas(itens: ItemCobranca[], registros: RegistroCobranca[], hoje = dataIso(new Date())) {
  const limite = new Date(`${hoje}T12:00:00`); limite.setDate(limite.getDate() + 7);
  const fim = dataIso(limite);
  const porId = new Map(itens.map((item) => [item.id, item]));
  const compromissos: CompromissoCobranca[] = [];

  registros.filter((registro) => registro.resultado === "Promessa de pagamento" && registro.promessa_data && registro.promessa_data <= fim)
    .forEach((registro) => {
      const item = porId.get(registro.comissao_id); if (!item || !registro.promessa_data) return;
      const valor = registro.promessa_valor || item.valor;
      compromissos.push({
        chave: `promessa:${registro.id}`, comissaoId: item.id, empresa: item.empresa, cliente: item.cliente,
        pedido: item.pedido, valor, data: registro.promessa_data, tipo: "Promessa",
        urgencia: registro.promessa_data < hoje ? "Atrasada" : registro.promessa_data === hoje ? "Hoje" : "Próxima",
        mensagem: mensagemCobranca(item.empresa, valor, registro.promessa_data, true),
      });
    });

  itens.filter((item) => item.diasAtraso > 0 && !item.ultimoContato).slice(0, 10).forEach((item) => {
    const data = item.previsao?.slice(0, 10) || hoje;
    compromissos.push({
      chave: `cobranca:${item.id}`, comissaoId: item.id, empresa: item.empresa, cliente: item.cliente,
      pedido: item.pedido, valor: item.valor, data, tipo: "Cobrança", urgencia: "Atrasada",
      mensagem: mensagemCobranca(item.empresa, item.valor, data),
    });
  });

  const peso = { Atrasada: 0, Hoje: 1, Próxima: 2 };
  return compromissos.sort((a, b) => peso[a.urgencia] - peso[b.urgencia] || a.data.localeCompare(b.data));
}
