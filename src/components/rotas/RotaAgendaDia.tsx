"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { enderecoVisita, ordenarVisitasRota, urlRotaGoogleMaps, type RotaVisita } from "@/lib/agendaRota";

type Props = { visitas: RotaVisita[]; data: string; onDataChange: (data: string) => void };

function nomeVisita(visita: RotaVisita) {
  return visita.clientes?.razao_social || visita.contato_avulso_empresa || visita.contato_avulso_nome || "Cliente cadastrado";
}

export function RotaAgendaDia({ visitas, data, onDataChange }: Props) {
  const visitasDoDia = useMemo(() => ordenarVisitasRota(visitas.filter((visita) => visita.data_visita === data && !["Concluída", "Cancelada"].includes(visita.status || ""))), [visitas, data]);
  const [ordem, setOrdem] = useState<RotaVisita[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setOrdem(visitasDoDia);
    setSelecionadas(visitasDoDia.filter((visita) => enderecoVisita(visita)).map((visita) => visita.id));
  }, [visitasDoDia]);

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= ordem.length) return;
    setOrdem((atual) => { const nova = [...atual]; [nova[indice], nova[destino]] = [nova[destino], nova[indice]]; return nova; });
  }

  async function salvarOrdem() {
    setSalvando(true);
    for (let index = 0; index < ordem.length; index += 1) {
      const { error } = await supabase.from("visitas").update({ ordem_rota: index + 1, origem_rota: "Agenda" }).eq("id", ordem[index].id);
      if (error) { setSalvando(false); return alert(error.message); }
    }
    setSalvando(false);
    alert("Ordem da rota salva na agenda.");
  }

  function abrirRota() {
    const enderecos = ordem.filter((visita) => selecionadas.includes(visita.id)).map(enderecoVisita).filter(Boolean);
    const url = urlRotaGoogleMaps(enderecos);
    if (!url) return alert("Selecione pelo menos uma visita com endereço cadastrado.");
    window.open(url, "_blank");
  }

  return <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-bold text-slate-800">Rota das visitas agendadas</h2><p className="mt-1 text-sm text-slate-500">Organize os compromissos da agenda e abra o percurso no celular.</p></div>
      <label className="text-sm font-semibold text-slate-600">Data da rota<input type="date" value={data} onChange={(e) => onDataChange(e.target.value)} className="ml-3 rounded-xl border px-4 py-2" /></label>
    </div>
    <div className="mt-5 space-y-3">
      {ordem.map((visita, indice) => { const endereco = enderecoVisita(visita); return <div key={visita.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <input type="checkbox" checked={selecionadas.includes(visita.id)} disabled={!endereco} onChange={() => setSelecionadas((atual) => atual.includes(visita.id) ? atual.filter((id) => id !== visita.id) : [...atual, visita.id])} />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{indice + 1}</span>
        <div className="min-w-0 flex-1"><p className="font-bold">{nomeVisita(visita)} <span className="font-normal text-slate-500">{visita.hora_visita?.slice(0, 5) || "sem horário"}</span></p><p className={`text-sm ${endereco ? "text-slate-500" : "font-semibold text-red-600"}`}>{endereco || "Endereço não cadastrado — não será enviado ao Maps"}</p></div>
        <button onClick={() => mover(indice, -1)} disabled={indice === 0} className="rounded-lg border px-3 py-2 disabled:opacity-30">↑</button><button onClick={() => mover(indice, 1)} disabled={indice === ordem.length - 1} className="rounded-lg border px-3 py-2 disabled:opacity-30">↓</button>
      </div>; })}
      {!ordem.length && <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">Nenhuma visita pendente nessa data.</p>}
    </div>
    <div className="mt-5 flex flex-wrap gap-3"><button onClick={salvarOrdem} disabled={!ordem.length || salvando} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{salvando ? "Salvando..." : "Salvar ordem"}</button><button onClick={abrirRota} disabled={!ordem.length} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Abrir no Google Maps</button></div>
  </section>;
}
