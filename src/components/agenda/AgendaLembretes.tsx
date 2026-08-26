"use client";

import { useEffect, useMemo, useState } from "react";
import { dataLembreteVisita, lembretePendente, podeRepetirNotificacao } from "@/lib/agendaLembretes";
import { nomeExibicaoVisita, type AgendaVisita } from "@/types/agenda";

type Props = { visitas: AgendaVisita[]; onAbrir: (visita: AgendaVisita) => void };

export function AgendaLembretes({ visitas, onAbrir }: Props) {
  const [agora, setAgora] = useState(() => new Date());
  const [permissao, setPermissao] = useState<NotificationPermission | "indisponivel">("indisponivel");
  const pendentes = useMemo(() => visitas.filter((visita) => lembretePendente(visita, agora)), [visitas, agora]);

  useEffect(() => {
    if ("Notification" in window) setPermissao(Notification.permission);
    const timer = window.setInterval(() => setAgora(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (permissao !== "granted") return;
    async function avisar() {
      const registro = await navigator.serviceWorker?.ready;
      for (const visita of pendentes) {
        const chave = `berbel_agenda_notificado_${visita.id}`;
        const ultimo = localStorage.getItem(chave);
        if (!podeRepetirNotificacao(visita, ultimo, agora)) continue;
        await registro?.showNotification(`Compromisso: ${nomeExibicaoVisita(visita)}`, {
          body: `${visita.hora_visita?.slice(0, 5) || "Sem horário"} — ${visita.tipo_contato}. Abra a agenda para resolver.`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `agenda-${visita.id}`,
          requireInteraction: visita.lembrete_repetir !== false,
          data: { url: "/agenda" },
        });
        localStorage.setItem(chave, agora.toISOString());
      }
    }
    avisar();
  }, [pendentes, permissao, agora]);

  async function ativar() {
    if (!("Notification" in window)) return alert("Este navegador não oferece notificações.");
    const resultado = await Notification.requestPermission();
    setPermissao(resultado);
    if (resultado !== "granted") alert("A permissão não foi concedida. Os avisos continuarão aparecendo dentro da agenda.");
  }

  return (
    <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-bold text-blue-950">Lembretes</h3><p className="text-sm text-blue-800">{pendentes.length ? `${pendentes.length} compromisso(s) aguardando ação` : "Nenhum lembrete vencido agora."}</p></div>
        {permissao !== "granted" && permissao !== "indisponivel" && <button onClick={ativar} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white">Ativar notificações no celular</button>}
        {permissao === "granted" && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Notificações ativadas</span>}
      </div>
      {pendentes.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2">
        {pendentes.map((visita) => <div key={visita.id} className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{nomeExibicaoVisita(visita)}</p><p className="text-sm text-slate-600">Aviso desde {dataLembreteVisita(visita)?.toLocaleString("pt-BR")}</p></div><span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">Pendente</span></div>
          <button onClick={() => onAbrir(visita)} className="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Abrir compromisso</button>
        </div>)}
      </div>}
    </section>
  );
}
