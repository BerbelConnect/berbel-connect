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

function numeroEhOffline(numero?: string | null) {
  return String(numero || "").startsWith("OFF-");
}

function tipoGeraFinanceiroVenda(tipo?: string | null) {
  return tipo === "Revenda" || tipo === "Venda direta";
}

function statusGeraFinanceiro(status?: string | null) {
  return status !== "Orçamento" && status !== "Cancelado";
}

async function gerarProximoNumeroPedido() {
  const { data, error } = await supabase
    .from("pedidos")
    .select("numero")
    .like("numero", "PED-%")
    .order("numero", { ascending: false })
    .limit(1);

  if (error) throw error;

  const ultimoNumero = data?.[0]?.numero || "PED-000000";
  const somenteNumero = Number(String(ultimoNumero).replace("PED-", "")) || 0;
  const proximo = String(somenteNumero + 1).padStart(6, "0");

  return `PED-${proximo}`;
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

  if (numero && !numeroEhOffline(numero)) {
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

function agruparCustoPorFornecedor(itens: any[]) {
  const mapa = new Map<string, { fornecedor_id: string | null; valor: number }>();

  for (const item of itens || []) {
    const fornecedorId = item.fornecedor_id || null;
    const chave = fornecedorId || "sem-fornecedor";
    const valorAtual = mapa.get(chave)?.valor || 0;
    const valorItem = Number(item.valor_custo_total || 0);

    mapa.set(chave, {
      fornecedor_id: fornecedorId,
      valor: valorAtual + valorItem,
    });
  }

  return Array.from(mapa.values()).filter((grupo) => grupo.valor > 0);
}

async function recriarFinanceiro(pedidoCriado: any, pedido: any, itens: any[]) {
  const dataBase =
    pedido.data_entrega_prevista || pedido.data_pedido || hojeISO();

  await supabase
    .from("contas_receber")
    .delete()
    .eq("pedido_id", pedidoCriado.id);

  await supabase
    .from("contas_pagar")
    .delete()
    .eq("pedido_id", pedidoCriado.id);

  await supabase
    .from("comissoes_financeiro")
    .delete()
    .eq("pedido_id", pedidoCriado.id);

  if (!statusGeraFinanceiro(pedido.status)) {
    return;
  }

  if (tipoGeraFinanceiroVenda(pedido.tipo)) {
    if (Number(pedido.valor_total || 0) > 0) {
      await supabase.from("contas_receber").insert({
        pedido_id: pedidoCriado.id,
        cliente_id: pedido.cliente_id,
        descricao: `Recebimento do pedido ${pedidoCriado.numero || pedido.numero}`,
        valor: Number(pedido.valor_total || 0),
        data_vencimento: dataBase,
        status: "Em aberto",
      });
    }

    const custosPorFornecedor = agruparCustoPorFornecedor(itens);

    for (const grupo of custosPorFornecedor) {
      await supabase.from("contas_pagar").insert({
        pedido_id: pedidoCriado.id,
        fornecedor_id: grupo.fornecedor_id,
        descricao: `Custo de mercadoria do pedido ${
          pedidoCriado.numero || pedido.numero
        }`,
        valor: Number(grupo.valor || 0),
        data_vencimento: dataBase,
        status: "Em aberto",
      });
    }

    return;
  }

  if (pedido.tipo === "Representação") {
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
    const origemOfflineId = item.pedido?.origem_offline_id || item.id_local;

    try {
      atualizarPedidoOffline(item.id_local, {
        status: "sincronizando",
        erro: "",
        tentativas: Number(item.tentativas || 0) + 1,
      });

      let pedidoPayload = {
        ...item.pedido,
        origem_offline_id: origemOfflineId,
      };

      let pedidoCriado = await buscarPedidoExistente(
        origemOfflineId,
        pedidoPayload.numero
      );

      if (!pedidoCriado) {
        if (!pedidoPayload.numero || numeroEhOffline(pedidoPayload.numero)) {
          pedidoPayload = {
            ...pedidoPayload,
            numero: await gerarProximoNumeroPedido(),
          };
        }

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
        throw new Error(
          "Pedido não foi localizado após tentativa de sincronização."
        );
      }

      await recriarItensPedido(pedidoCriado.id, item.itens || []);

      try {
        await recriarFinanceiro(
          pedidoCriado,
          {
            ...pedidoPayload,
            numero: pedidoCriado.numero || pedidoPayload.numero,
          },
          item.itens || []
        );
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