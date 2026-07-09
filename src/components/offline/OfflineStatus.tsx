"use client";

import { useEffect, useState } from "react";
import { contarPedidosOffline } from "@/lib/offline/pedidosOffline";
import { sincronizarPedidosOffline } from "@/lib/offline/sincronizarPedidosOffline";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  function atualizarStatus() {
    setOnline(navigator.onLine);
    setPendentes(contarPedidosOffline());
  }

  useEffect(() => {
    atualizarStatus();

    window.addEventListener("online", atualizarStatus);
    window.addEventListener("offline", atualizarStatus);
    window.addEventListener("storage", atualizarStatus);
    window.addEventListener(
      "berbel:pedidos-offline-atualizados",
      atualizarStatus
    );

    return () => {
      window.removeEventListener("online", atualizarStatus);
      window.removeEventListener("offline", atualizarStatus);
      window.removeEventListener("storage", atualizarStatus);
      window.removeEventListener(
        "berbel:pedidos-offline-atualizados",
        atualizarStatus
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
    atualizarStatus();

    alert(resultado.mensagem);

    window.dispatchEvent(new Event("berbel:pedidos-offline-atualizados"));
  }

  if (online && pendentes === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[90vw] rounded-2xl bg-slate-900 p-4 text-sm text-white shadow-2xl">
      {!online && (
        <p className="font-semibold text-red-300">
          Sem internet. O sistema está em modo offline.
        </p>
      )}

      {pendentes > 0 && (
        <p className="mt-1 text-yellow-300">
          {pendentes} pedido(s) aguardando sincronização.
        </p>
      )}

      {online && pendentes > 0 && (
        <div className="mt-3">
          <p className="mb-3 text-slate-300">
            Internet voltou. Você já pode enviar os pedidos para o sistema.
          </p>

          <button
            onClick={sincronizarAgora}
            disabled={sincronizando}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        </div>
      )}
    </div>
  );
}