import { criarPedidoCompleto } from "@/lib/pedidos/criarPedidoCompleto";
import {
  atualizarPedidoOffline,
  listarPedidosOffline,
  removerPedidoOffline,
} from "@/lib/offline/pedidosOffline";

const CHAVE_TRAVA = "berbel_connect_sincronizacao_offline";
const DURACAO_TRAVA_MS = 60_000;

type Trava = { dono: string; expira_em: number };

function adquirirTrava() {
  const dono = globalThis.crypto.randomUUID();
  const agora = Date.now();

  try {
    const atual = JSON.parse(localStorage.getItem(CHAVE_TRAVA) || "null") as Trava | null;
    if (atual?.expira_em && atual.expira_em > agora) return null;
  } catch {
    // Uma trava inválida ou expirada pode ser substituída com segurança.
  }

  localStorage.setItem(
    CHAVE_TRAVA,
    JSON.stringify({ dono, expira_em: agora + DURACAO_TRAVA_MS })
  );

  try {
    const confirmacao = JSON.parse(localStorage.getItem(CHAVE_TRAVA) || "null") as Trava | null;
    return confirmacao?.dono === dono ? dono : null;
  } catch {
    return null;
  }
}

function liberarTrava(dono: string) {
  try {
    const atual = JSON.parse(localStorage.getItem(CHAVE_TRAVA) || "null") as Trava | null;
    if (atual?.dono === dono) localStorage.removeItem(CHAVE_TRAVA);
  } catch {
    localStorage.removeItem(CHAVE_TRAVA);
  }
}

export async function sincronizarPedidosOffline() {
  const donoTrava = adquirirTrava();
  if (!donoTrava) {
    return {
      sucesso: false,
      sincronizados: 0,
      erros: 0,
      mensagem: "A sincronização já está em andamento em outra aba.",
    };
  }

  try {
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
          tentativas: Number(item.tentativas || 0) + 1,
        });

        await criarPedidoCompleto({
          idempotencyKey: item.id_local,
          pedido: item.pedido,
          itens: item.itens,
          contasReceber: item.contas_receber,
          contasPagar: item.contas_pagar,
        });

        // O RPC confirma pedido, itens e financeiro na mesma transação.
        // Só depois dessa confirmação o rascunho local pode ser removido.
        removerPedidoOffline(item.id_local);
        sincronizados++;
      } catch (error: unknown) {
        erros++;
        atualizarPedidoOffline(item.id_local, {
          status: "erro",
          erro: error instanceof Error ? error.message : "Erro ao sincronizar pedido.",
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
          : `${sincronizados} pedido(s) sincronizado(s), ${erros} mantido(s) na fila para nova tentativa.`,
    };
  } finally {
    liberarTrava(donoTrava);
  }
}
