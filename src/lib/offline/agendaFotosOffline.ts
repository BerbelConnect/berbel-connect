import type { AgendaFotoLocal } from "@/types/agendaFotos";

const BANCO = "berbel_connect_offline";
const VERSAO = 1;
const STORE = "agenda_fotos";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BANCO, VERSAO);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("visita_id", "visita_id", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir o armazenamento de fotos."));
  });
}

function eventoAtualizacao() {
  window.dispatchEvent(new Event("berbel:agenda-fotos-atualizadas"));
}

export async function salvarFotoAgendaOffline(foto: AgendaFotoLocal) {
  const db = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(foto);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  eventoAtualizacao();
}

export async function listarFotosAgendaOffline(visitaId?: string): Promise<AgendaFotoLocal[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await abrirBanco();
  const fotos = await new Promise<AgendaFotoLocal[]>((resolve, reject) => {
    const store = db.transaction(STORE, "readonly").objectStore(STORE);
    const request = visitaId ? store.index("visita_id").getAll(visitaId) : store.getAll();
    request.onsuccess = () => resolve(request.result as AgendaFotoLocal[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return fotos;
}

export async function removerFotoAgendaOffline(id: string) {
  const db = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  eventoAtualizacao();
}

export async function contarFotosAgendaOffline() {
  return (await listarFotosAgendaOffline()).length;
}
