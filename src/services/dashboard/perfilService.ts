import { supabase } from "@/lib/supabase";

type PerfilInfo = {
  perfil: string;
  perfilId: string | null;
};

export async function obterPerfilAtual(): Promise<PerfilInfo> {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email;

  if (!email) {
    return { perfil: "Representante", perfilId: null };
  }

  const { data, error } = await supabase
    .from("perfis_usuarios")
    .select("perfil,id")
    .eq("email", email)
    .eq("ativo", true)
    .single();

  if (error) {
    return { perfil: "Representante", perfilId: null };
  }

  return {
    perfil: data?.perfil ?? "Representante",
    perfilId: data?.id ?? null,
  };
}
