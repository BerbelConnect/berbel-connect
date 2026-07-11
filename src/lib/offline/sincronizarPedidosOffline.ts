import { supabase } from "@/lib/supabase";
import {
  atualizarPedidoOffline,
  listarPedidosOffline,
  removerPedidoOffline,
} from "@/lib/offline/pedidosOffline";

let sincronizacaoEmAndamento = false;

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

async function buscarPedidoExistente(origemOfflineId: string, numero?: string) {
  if (origemOfflineId) {
    const { data } = await supabase
      .from("pedidos")
      .select("id, numero, origem_offline_id")
      .eq("origem_offline_id", origemOfflineId)
      .maybeSingle();

    if (data) return data;
  }

  if (numero) {
    const { data } = await supabase
      .from("pedidos")
      .select("id, numero, origem_offline_id")
      .eq("numero", numero)
      .limit(1);

    if (data && data.length > 0) return data[0];
  }

  return null;
}

async function recriarItensPedido(pedidoId: string, itens: any[]) {
  await supabase.from("pedido_itens").delete().eq("pedido_id", pedidoId);

  if (!itens || itens.length === 0) return;

  const itensBanco = itens.map((produto: any) => ({
    ...produto,
    pedido_id: pedidoId,
  }));

  const { error } = await supabase.from("pedido_itens").insert(itensBanco);

  if (error) throw error;
}

async function recriarFinanceiro(pedidoCriado: any, pedido: any) {
  const dataBase =
    pedido.data_entrega_prevista || pedido.data_pedido || hojeISO();

  await supabase.from("contas_receber").delete().eq("pedido_id", pedidoCriado.id);
  await supabase
    .from("comissoes_financeiro")
    .delete()
    .eq("pedido_id", pedidoCriado.id);

  if (Number(pedido.valor_total || 0) > 0) {
    await supabase.from("contas_receber").insert({
      pedido_id: pedidoCriado.id,
      cliente_id: pedido.cliente_id,
      descricao: `Pedido ${pedidoCriado.numero || pedido.numero}`,
      valor: Number(pedido.valor_total || 0),
      data_vencimento: dataBase,
      status: "Em aberto",
    });
  }

  if (Number(pedido.valor_comissao || 0) > 0) {
    await supabase.from("comissoes_financeiro").insert({
      pedido_id: pedidoCriado.id,
      cliente_id: pedido.cliente_id,
      empresa: pedido.tipo || "Representação",
      valor_base: Number(pedido.valor_total || 0),
      valor_comissao: Number(pedido.valor_comissao || 0),
      data_previsao: dataBase,
      status: "Pendente",
    });
  }
}

export async function sincronizarPedidosOffline() {
  if (sincronizacaoEmAndamento) {
    return {
      sucesso: false,
      sincronizados: 0,
      erros: 0,
      mensagem: "A sincronização já está em andamento. Aguarde finalizar.",
    };
  }

  sincronizacaoEmAndamento = true;

  const fila = listarPedidosOffline();

  if (fila.length === 0) {
    sincronizacaoEmAndamento = false;

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
    const origemOfflineId =
      item.pedido?.origem_offline_id || item.id_local;

    const pedidoPayload = {
      ...item.pedido,
      origem_offline_id: origemOfflineId,
    };

    try {
      atualizarPedidoOffline(item.id_local, {
        status: "sincronizando",
        erro: "",
        tentativas: Number(item.tentativas || 0) + 1,
      });

      let pedidoCriado = await buscarPedidoExistente(
        origemOfflineId,
        pedidoPayload.numero
      );

      if (!pedidoCriado) {
        const { data, error } = await supabase
          .from("pedidos")
          .insert(pedidoPayload)
          .select()
          .single();

        if (error) {
          const mensagem = String(error.message || "").toLowerCase();

          if (
            mensagem.includes("duplicate") ||
            mensagem.includes("unique") ||
            mensagem.includes("23505")
          ) {
            pedidoCriado = await buscarPedidoExistente(
              origemOfflineId,
              pedidoPayload.numero
            );
          } else {
            throw error;
          }
        } else {
          pedidoCriado = data;
        }
      }

      if (!pedidoCriado?.id) {
        throw new Error("Pedido não foi localizado após tentativa de sincronização.");
      }

      await recriarItensPedido(pedidoCriado.id, item.itens || []);

      try {
        await recriarFinanceiro(pedidoCriado, pedidoPayload);
      } catch (financeiroError) {
        console.warn(
          "Pedido sincronizado, mas houve falha ao recriar financeiro:",
          financeiroError
        );
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

  sincronizacaoEmAndamento = false;

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