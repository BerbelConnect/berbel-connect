"use client";

import { useEffect, useRef, useState } from "react";
import { adicionarFotosVisita, listarFotosVisita, removerFotoVisita } from "@/services/agenda/agendaFotosService";
import type { AgendaFoto } from "@/types/agendaFotos";

type Props = { visitaId: string; somenteLeitura?: boolean };

export function AgendaFotos({ visitaId, somenteLeitura = false }: Props) {
  const [fotos, setFotos] = useState<AgendaFoto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const urlsLocais = useRef<string[]>([]);

  async function carregar() {
    urlsLocais.current.forEach((url) => URL.revokeObjectURL(url));
    const novas = await listarFotosVisita(visitaId);
    urlsLocais.current = novas.filter((foto) => foto.pendente).map((foto) => foto.url);
    setFotos(novas);
  }

  useEffect(() => {
    carregar();
    return () => urlsLocais.current.forEach((url) => URL.revokeObjectURL(url));
  }, [visitaId]);

  async function selecionar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    setCarregando(true);
    try {
      await adicionarFotosVisita(visitaId, Array.from(arquivos));
      await carregar();
    } catch (error) {
      alert((error as Error).message || "Não foi possível adicionar a foto.");
    } finally {
      setCarregando(false);
    }
  }

  async function remover(foto: AgendaFoto) {
    if (!confirm("Remover esta foto da visita?")) return;
    try {
      await removerFotoVisita(foto);
      await carregar();
    } catch (error) {
      alert((error as Error).message || "Não foi possível remover a foto.");
    }
  }

  return (
    <div className="rounded-xl border bg-slate-50 p-4 md:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Fotos da visita</p><p className="text-xs text-slate-500">As fotos ficam protegidas no aparelho até serem enviadas.</p></div>
        {!somenteLeitura && <label className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
          {carregando ? "Preparando..." : "Tirar ou escolher fotos"}
          <input type="file" accept="image/*" capture="environment" multiple disabled={carregando} onChange={(e) => { selecionar(e.target.files); e.target.value = ""; }} className="hidden" />
        </label>}
      </div>
      {fotos.length === 0 && <p className="text-sm text-slate-500">Nenhuma foto adicionada.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((foto) => (
          <div key={foto.id} className="overflow-hidden rounded-xl border bg-white">
            <img src={foto.url} alt={foto.nome_arquivo} className="h-32 w-full object-cover" />
            <div className="p-2">
              <p className="truncate text-xs" title={foto.nome_arquivo}>{foto.nome_arquivo}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${foto.pendente ? "text-amber-700" : "text-green-700"}`}>{foto.pendente ? "Aguardando envio" : "Sincronizada"}</span>
                {!somenteLeitura && <button type="button" onClick={() => remover(foto)} className="text-xs font-semibold text-red-600">Remover</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
