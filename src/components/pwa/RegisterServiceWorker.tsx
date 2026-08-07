"use client";

import { useEffect, useState } from "react";

export function RegisterServiceWorker() {
  const [aguardando, setAguardando] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") return;

    let recarregando = false;
    let intervalo: number | undefined;

    const aoTrocarControlador = () => {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", aoTrocarControlador);

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registro) => {
        if (registro.waiting && navigator.serviceWorker.controller) {
          setAguardando(registro.waiting);
        }

        registro.addEventListener("updatefound", () => {
          const instalando = registro.installing;
          instalando?.addEventListener("statechange", () => {
            if (instalando.state === "installed" && navigator.serviceWorker.controller) {
              setAguardando(instalando);
            }
          });
        });

        const verificarAtualizacao = () => {
          if (navigator.onLine) registro.update().catch(() => undefined);
        };

        verificarAtualizacao();
        intervalo = window.setInterval(verificarAtualizacao, 60 * 60 * 1000);
        document.addEventListener("visibilitychange", verificarAtualizacao);
      })
      .catch((error) => console.error("Erro ao registrar service worker:", error));

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", aoTrocarControlador);
      if (intervalo) window.clearInterval(intervalo);
    };
  }, []);

  if (!aguardando) return null;

  return (
    <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl bg-slate-950 p-4 text-white shadow-2xl">
      <div>
        <p className="font-semibold">Nova versão disponível</p>
        <p className="text-sm text-slate-300">Atualize para usar as últimas melhorias.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => setAguardando(null)} className="rounded-lg px-3 py-2 text-sm">
          Depois
        </button>
        <button
          type="button"
          onClick={() => aguardando.postMessage({ type: "SKIP_WAITING" })}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold"
        >
          Atualizar agora
        </button>
      </div>
    </aside>
  );
}
