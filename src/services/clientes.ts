import { supabase } from "@/lib/supabase";

export async function listarClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("razao_social", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function criarCliente(cliente: any) {
  const { data, error } = await supabase
    .from("clientes")
    .insert([cliente])
    .select();

  if (error) throw error;

  return data;
}

export async function atualizarCliente(id: string, cliente: any) {
  const { data, error } = await supabase
    .from("clientes")
    .update(cliente)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function excluirCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}