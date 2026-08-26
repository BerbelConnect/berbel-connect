import { supabase } from "@/lib/supabase";
import { navegadorOnline } from "@/lib/offline/agendaOffline";
import { listarFotosAgendaOffline, removerFotoAgendaOffline, salvarFotoAgendaOffline } from "@/lib/offline/agendaFotosOffline";
import type { AgendaFoto, AgendaFotoLocal } from "@/types/agendaFotos";

const BUCKET = "visita-fotos";

export function normalizarNomeArquivo(nome: string) {
  const limpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  return limpo.replace(/-+/g, "-").replace(/^-|-$/g, "") || "foto.jpg";
}

async function comprimirFoto(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Selecione somente arquivos de imagem.");
  const bitmap = await createImageBitmap(arquivo);
  const limite = 1600;
  const escala = Math.min(1, limite / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível preparar a foto.");
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível reduzir a foto.")), "image/jpeg", 0.82));
}

export async function adicionarFotosVisita(visitaId: string, arquivos: File[]) {
  for (const arquivo of arquivos) {
    const blob = await comprimirFoto(arquivo);
    const foto: AgendaFotoLocal = {
      id: crypto.randomUUID(),
      visita_id: visitaId,
      nome_arquivo: normalizarNomeArquivo(arquivo.name.replace(/\.[^.]+$/, "")) + ".jpg",
      mime_type: "image/jpeg",
      tamanho: blob.size,
      criado_em: new Date().toISOString(),
      blob,
    };
    await salvarFotoAgendaOffline(foto);
  }
  if (navegadorOnline()) await sincronizarFotosAgendaOffline();
}

export async function sincronizarFotosAgendaOffline() {
  if (!navegadorOnline()) return { sincronizados: 0, mensagem: "Fotos mantidas no celular até a internet voltar." };
  const pendentes = await listarFotosAgendaOffline();
  if (!pendentes.length) return { sincronizados: 0, mensagem: "Nenhuma foto da agenda para sincronizar." };
  const { data: authData } = await supabase.auth.getUser();
  const usuarioId = authData.user?.id;
  if (!usuarioId) return { sincronizados: 0, mensagem: "Faça login novamente para enviar as fotos." };

  let sincronizados = 0;
  for (const foto of pendentes) {
    const caminho = `visitas/${usuarioId}/${foto.visita_id}/${foto.id}-${normalizarNomeArquivo(foto.nome_arquivo)}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(caminho, foto.blob, { contentType: foto.mime_type, upsert: false });
    if (uploadError) break;
    const { error: insertError } = await supabase.from("visita_fotos").insert({
      id: foto.id,
      visita_id: foto.visita_id,
      storage_path: caminho,
      nome_arquivo: foto.nome_arquivo,
      mime_type: foto.mime_type,
      tamanho: foto.tamanho,
      criado_por: usuarioId,
      criado_em: foto.criado_em,
    });
    if (insertError) {
      await supabase.storage.from(BUCKET).remove([caminho]);
      break;
    }
    await removerFotoAgendaOffline(foto.id);
    sincronizados += 1;
  }
  return { sincronizados, mensagem: sincronizados ? `${sincronizados} foto(s) da agenda sincronizada(s).` : "Não foi possível sincronizar as fotos agora." };
}

export async function listarFotosVisita(visitaId: string): Promise<AgendaFoto[]> {
  const locais = await listarFotosAgendaOffline(visitaId);
  const fotosLocais: AgendaFoto[] = locais.map((foto) => ({
    id: foto.id,
    visita_id: foto.visita_id,
    nome_arquivo: foto.nome_arquivo,
    mime_type: foto.mime_type,
    tamanho: foto.tamanho,
    criado_em: foto.criado_em,
    url: URL.createObjectURL(foto.blob),
    pendente: true,
  }));
  if (!navegadorOnline()) return fotosLocais;

  const { data, error } = await supabase.from("visita_fotos").select("id, visita_id, storage_path, nome_arquivo, mime_type, tamanho, criado_em").eq("visita_id", visitaId).order("criado_em", { ascending: true });
  if (error) return fotosLocais;
  const remotas = await Promise.all((data || []).map(async (foto) => {
    const { data: assinatura } = await supabase.storage.from(BUCKET).createSignedUrl(foto.storage_path, 3600);
    return { ...foto, url: assinatura?.signedUrl || "", pendente: false } as AgendaFoto;
  }));
  return [...remotas.filter((foto) => foto.url), ...fotosLocais];
}

export async function removerFotoVisita(foto: AgendaFoto) {
  if (foto.pendente) return removerFotoAgendaOffline(foto.id);
  if (!navegadorOnline()) throw new Error("Fotos já enviadas só podem ser removidas com internet.");
  if (foto.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([foto.storage_path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("visita_fotos").delete().eq("id", foto.id);
  if (error) throw error;
}
