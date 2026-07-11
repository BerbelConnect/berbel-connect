"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { contarPedidosOffline } from "@/lib/offline/pedidosOffline";
import { sincronizarPedidosOffline } from "@/lib/offline/sincronizarPedidosOffline";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaMensagem, setUltimaMensagem] = useState("");

  function atualizarStatus() {
    setOnline(navigator.onLine);
    setPendentes(contarPedidosOffline());
  }

  useEffect(() => {
    atualizarStatus();

    function aoVoltarInternet() {
      atualizarStatus();
      setUltimaMensagem(
        "Internet voltou. Entre em Pedidos Offline e clique em Sincronizar todos."
      );
    }

    function aoPerderInternet() {
      atualizarStatus();
      setUltimaMensagem("Sem internet. Os pedidos serão salvos offline.");
    }

    function aoAtualizarFila() {
      atualizarStatus();
    }

    window.addEventListener("online", aoVoltarInternet);
    window.addEventListener("offline", aoPerderInternet);
    window.addEventListener("storage", atualizarStatus);
    window.addEventListener(
      "berbel:pedidos-offline-atualizados",
      aoAtualizarFila
    );

    return () => {
      window.removeEventListener("online", aoVoltarInternet);
      window.removeEventListener("offline", aoPerderInternet);
      window.removeEventListener("storage", atualizarStatus);
      window.removeEventListener(
        "berbel:pedidos-offline-atualizados",
        aoAtualizarFila
      );
    };
  }, []);

  async function sincronizarAgora() {
    if (!navigator.onLine) {
      alert("Ainda está sem internet. Conecte novamente para sincronizar.");
      return;
    }

    if (pendentes === 0) {
      alert("Não há pedidos offline para sincronizar.");
      return;
    }

    setSincronizando(true);

    const resultado = await sincronizarPedidosOffline();

    setSincronizando(false);
    setUltimaMensagem(resultado.mensagem);
    atualizarStatus();

    alert(resultado.mensagem);

    window.dispatchEvent(new Event("berbel:pedidos-offline-atualizados"));
  }

  if (online && pendentes === 0 && !ultimaMensagem) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[90vw] rounded-2xl bg-slate-900 p-4 text-sm text-white shadow-2xl">
      {!online && (
        <p className="font-semibold text-red-300">
          Sem internet. O sistema está em modo offline.
        </p>
      )}

      {sincronizando && (
        <p className="font-semibold text-green-300">
          Sincronizando pedidos offline...
        </p>
      )}

      {pendentes > 0 && (
        <p className="mt-1 text-yellow-300">
          {pendentes} pedido(s) aguardando sincronização.
        </p>
      )}

      {ultimaMensagem && <p className="mt-1 text-slate-300">{ultimaMensagem}</p>}

      {online && pendentes > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={sincronizarAgora}
              disabled={sincronizando}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
            </button>

            <Link
              href="/pedidos/offline"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Ver offline
            </Link>
          </div>
        </div>
      )}

      {online && pendentes === 0 && ultimaMensagem && (
        <button
          onClick={() => setUltimaMensagem("")}
          className="mt-3 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-600"
        >
          Fechar aviso
        </button>
      )}
    </div>
  );
}