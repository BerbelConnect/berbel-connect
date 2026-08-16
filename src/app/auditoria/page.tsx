"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import { conciliarSaldoBanco } from "@/lib/auditoria/service";
import { motivoValido } from "@/lib/auditoria/calculos";

type EventoAuditoria = { id: string; entidade: string; operacao: string; motivo: string; usuario_email: string; created_at: string; valores_antes: unknown; valores_depois: unknown };
type AjusteFinanceiro = { id: string; created_at: string; usuario_email: string; saldo_sistema_antes: number; saldo_banco: number; valor_ajuste: number; motivo: string };

function moeda(valor: unknown) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AuditoriaPage() {
  const [saldoSistema, setSaldoSistema] = useState(0);
  const [saldoBanco, setSaldoBanco] = useState("");
  const [motivo, setMotivo] = useState("");
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [ajustes, setAjustes] = useState<AjusteFinanceiro[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const [saldo, historico, conciliacoes] = await Promise.all([
      supabase.rpc("saldo_financeiro_auditado"),
      supabase.from("auditoria_eventos").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ajustes_financeiros").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    const erro = saldo.error || historico.error || conciliacoes.error;
    if (erro) return setMensagem(erro.message);
    setSaldoSistema(Number(saldo.data || 0));
    setEventos(historico.data || []);
    setAjustes(conciliacoes.data || []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);

  async function conciliar() {
    const valor = Number(saldoBanco.replace(",", "."));
    if (!Number.isFinite(valor)) return setMensagem("Informe um saldo bancário válido.");
    if (!motivoValido(motivo)) return setMensagem("Informe um motivo com pelo menos 5 caracteres.");
    setSalvando(true);
    try {
      const resultado = await conciliarSaldoBanco(valor, motivo);
      setMensagem(`Conciliação registrada. Ajuste: ${moeda(resultado.valor_ajuste)}.`);
      setSaldoBanco(""); setMotivo(""); await carregar();
    } catch (error) { setMensagem((error as Error).message); }
    finally { setSalvando(false); }
  }

  return (
    <main className="min-h-screen bg-slate-100"><div className="flex"><Sidebar />
      <section className="min-w-0 flex-1"><PageHeader titulo="Auditoria Administrativa" subtitulo="Acesso exclusivo do Administrador" />
        <div className="space-y-6 p-8">
          {mensagem && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">{mensagem}</div>}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Conciliação com o saldo real do banco</h2>
            <p className="mt-2 text-sm text-slate-600">O ajuste não altera nem apaga lançamentos anteriores. Ele cria um registro permanente com saldo anterior, diferença, usuário e motivo.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-900 p-5 text-white"><span className="text-sm text-slate-300">Saldo atual do sistema</span><strong className="mt-2 block text-2xl">{moeda(saldoSistema)}</strong></div>
              <input value={saldoBanco} onChange={(e) => setSaldoBanco(e.target.value)} inputMode="decimal" placeholder="Saldo real do banco" className="rounded-xl border px-4 py-3" />
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo obrigatório" className="rounded-xl border px-4 py-3" />
            </div>
            <button type="button" disabled={salvando} onClick={conciliar} className="mt-4 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{salvando ? "Registrando..." : "Registrar conciliação"}</button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Ajustes financeiros</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Data e hora</th><th className="p-3">Usuário</th><th className="p-3">Antes</th><th className="p-3">Banco</th><th className="p-3">Ajuste</th><th className="p-3">Motivo</th></tr></thead>
              <tbody className="divide-y">{ajustes.map((item) => <tr key={item.id}><td className="p-3">{new Date(item.created_at).toLocaleString("pt-BR")}</td><td className="p-3">{item.usuario_email}</td><td className="p-3">{moeda(item.saldo_sistema_antes)}</td><td className="p-3">{moeda(item.saldo_banco)}</td><td className="p-3 font-semibold">{moeda(item.valor_ajuste)}</td><td className="p-3">{item.motivo}</td></tr>)}</tbody>
            </table></div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Histórico completo de auditoria</h2>
            <div className="space-y-3">{eventos.map((evento) => <details key={evento.id} className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">{evento.operacao} · {evento.entidade} · {new Date(evento.created_at).toLocaleString("pt-BR")}</summary><p className="mt-3 text-sm"><strong>Usuário:</strong> {evento.usuario_email}<br/><strong>Motivo:</strong> {evento.motivo}</p><div className="mt-3 grid gap-3 md:grid-cols-2"><pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">Antes: {JSON.stringify(evento.valores_antes, null, 2)}</pre><pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">Depois: {JSON.stringify(evento.valores_depois, null, 2)}</pre></div></details>)}</div>
          </section>
        </div>
      </section></div></main>
  );
}
