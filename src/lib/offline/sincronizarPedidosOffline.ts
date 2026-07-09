import { supabase } from "@/lib/supabase";
import {
  atualizarPedidoOffline,
  listarPedidosOffline,
  removerPedidoOffline,
} from "@/lib/offline/pedidosOffline";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function sincronizarPedidosOffline() {
  const fila = listarPedidosOffline();

  if (fila.length === 0) {
    return {
      sucesso: true,
      sincronizados: 0,
      erros: 0,
      mensagem: "Nenhum pedido offline para sincronizar.",
    };
  }

  let sincronizados = 0;
  let erros = 0;

  for (const item of fila) {
    try {
      atualizarPedidoOffline(item.id_local, {
        status: "sincronizando",
        erro: "",
      });

      const { data: pedidoCriado, error: erroPedido } = await supabase
        .from("pedidos")
        .insert(item.pedido)
        .select()
        .single();

      if (erroPedido) {
        throw erroPedido;
      }

      const itensBanco = item.itens.map((produto: any) => ({
        ...produto,
        pedido_id: pedidoCriado.id,
      }));

      const { error: erroItens } = await supabase
        .from("pedido_itens")
        .insert(itensBanco);

      if (erroItens) {
        throw erroItens;
      }

      const dataBase =
        item.pedido.data_entrega_prevista ||
        item.pedido.data_pedido ||
        hojeISO();

      if (Number(item.pedido.valor_total || 0) > 0) {
        await supabase.from("contas_receber").insert({
          pedido_id: pedidoCriado.id,
          cliente_id: item.pedido.cliente_id,
          descricao: `Pedido ${pedidoCriado.numero || item.pedido.numero}`,
          valor: Number(item.pedido.valor_total || 0),
          data_vencimento: dataBase,
          status: "Em aberto",
        });
      }

      if (Number(item.pedido.valor_comissao || 0) > 0) {
        await supabase.from("comissoes_financeiro").insert({
          pedido_id: pedidoCriado.id,
          cliente_id: item.pedido.cliente_id,
          empresa: item.pedido.tipo || "Representação",
          valor_base: Number(item.pedido.valor_total || 0),
          valor_comissao: Number(item.pedido.valor_comissao || 0),
          data_previsao: dataBase,
          status: "Pendente",
        });
      }

      removerPedidoOffline(item.id_local);
      sincronizados++;
    } catch (error: any) {
      erros++;

      atualizarPedidoOffline(item.id_local, {
        status: "erro",
        erro: error?.message || "Erro ao sincronizar pedido.",
      });
    }
  }

  return {
    sucesso: erros === 0,
    sincronizados,
    erros,
    mensagem:
      erros === 0
        ? `${sincronizados} pedido(s) sincronizado(s) com sucesso.`
        : `${sincronizados} pedido(s) sincronizado(s), ${erros} com erro.`,
  };
}