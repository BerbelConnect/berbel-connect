"use client";

import Link from "next/link";
import { useState } from "react";
import { nomeExibicaoVisita, type AgendaResultadoFormData, type AgendaVisita } from "@/types/agenda";

type Props = {
  visita: AgendaVisita;
  salvando: boolean;
  onClose: () => void;
  onSave: (form: AgendaResultadoFormData) => void;
  onContinue: (form: AgendaResultadoFormData) => void;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
};

export function AgendaResultadoPanel({ visita, salvando, onClose, onSave, onContinue }: Props) {
  const chaveRascunho = `berbel_agenda_rascunho_${visita.id}`;
  const [form, setForm] = useState<AgendaResultadoFormData>(() => {
    const inicial = { pessoa_atendida: visita.pessoa_atendida || "", resultado: visita.resultado || "", proxima_acao: visita.proxima_acao || "", data_retorno: visita.data_retorno || "", hora_retorno: visita.hora_visita?.slice(0, 5) || "", lembrete_em: visita.lembrete_em?.slice(0, 16) || "", agendar_retorno: false, checklist: visita.checklist || [] };
    if (typeof window === "undefined") return inicial;
    try { const salvo = JSON.parse(localStorage.getItem(chaveRascunho) || "") as Partial<AgendaResultadoFormData>; return { ...inicial, ...salvo, checklist: Array.isArray(salvo.checklist) ? salvo.checklist : inicial.checklist }; } catch { return inicial; }
  });
  const [ouvindo, setOuvindo] = useState(false);

  function atualizar(novo: AgendaResultadoFormData) {
    setForm(novo);
    localStorage.setItem(chaveRascunho, JSON.stringify(novo));
  }

  function ditarResultado() {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return alert("O reconhecimento de voz não está disponível neste navegador.");
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const texto = event.results[0]?.[0]?.transcript || "";
      setForm((atual) => { const novo = { ...atual, resultado: [atual.resultado, texto].filter(Boolean).join(" ") }; localStorage.setItem(chaveRascunho, JSON.stringify(novo)); return novo; });
    };
    recognition.onerror = () => setOuvindo(false);
    recognition.onend = () => setOuvindo(false);
    setOuvindo(true);
    recognition.start();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section onBlur={() => localStorage.setItem(chaveRascunho, JSON.stringify(form))} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-sm text-slate-500">Registrar atendimento — rascunho salvo neste celular</p><h3 className="text-xl font-bold">{nomeExibicaoVisita(visita)}</h3></div>
          <button onClick={onClose} className="rounded-lg border px-3 py-2">Fechar</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-slate-50 p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between"><p className="font-semibold">Checklist</p><span className="text-sm text-slate-500">{form.checklist.filter((item) => item.concluido).length}/{form.checklist.length}</span></div>
            <div className="space-y-2">
              {form.checklist.map((etapa) => <label key={etapa.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2"><input type="checkbox" checked={etapa.concluido} onChange={(e) => atualizar({ ...form, checklist: form.checklist.map((item) => item.id === etapa.id ? { ...item, concluido: e.target.checked } : item) })} /><span className={etapa.concluido ? "text-slate-400 line-through" : ""}>{etapa.texto}</span></label>)}
              {form.checklist.length === 0 && <p className="text-sm text-slate-500">Esta visita não possui etapas.</p>}
            </div>
          </div>
          <input placeholder="Pessoa atendida" value={form.pessoa_atendida} onChange={(e) => setForm({ ...form, pessoa_atendida: e.target.value })} className="rounded-xl border px-4 py-3" />
          <input placeholder="Próxima ação" value={form.proxima_acao} onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })} className="rounded-xl border px-4 py-3" />
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between"><label className="font-semibold">Resultado da visita</label><button type="button" onClick={ditarResultado} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">{ouvindo ? "Ouvindo..." : "🎤 Ditar"}</button></div>
            <textarea rows={5} value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} className="w-full rounded-xl border px-4 py-3" placeholder="Registre o que foi conversado e decidido" />
          </div>
          <label className="text-sm font-semibold">Data do retorno<input type="date" value={form.data_retorno} onChange={(e) => setForm({ ...form, data_retorno: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
          <label className="text-sm font-semibold">Horário do retorno<input type="time" value={form.hora_retorno} onChange={(e) => setForm({ ...form, hora_retorno: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
          <label className="text-sm font-semibold md:col-span-2">Lembrete<input type="datetime-local" value={form.lembrete_em} onChange={(e) => setForm({ ...form, lembrete_em: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
          <label className="flex items-center gap-3 rounded-xl border bg-blue-50 px-4 py-3 md:col-span-2"><input type="checkbox" checked={form.agendar_retorno} disabled={!form.data_retorno} onChange={(e) => setForm({ ...form, agendar_retorno: e.target.checked })} />Criar automaticamente um novo compromisso para a data de retorno</label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={salvando || !form.resultado.trim()} onClick={() => onSave(form)} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : "Concluir e salvar"}</button>
          {visita.cliente_id && <Link href={`/pedidos?cliente_id=${encodeURIComponent(visita.cliente_id)}`} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">Criar pedido</Link>}
          <button disabled={salvando} onClick={() => onContinue(form)} className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50">{salvando ? "Salvando..." : "Continuar depois"}</button>
        </div>
      </section>
    </div>
  );
}
