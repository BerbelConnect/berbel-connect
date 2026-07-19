import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resposta(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return resposta({ ok: false, erro: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL") || "https://berbel-connect.vercel.app";
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return resposta({ ok: false, erro: "Acesso não autorizado." }, 401);
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  const authClient = createClient(supabaseUrl, anonKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: autenticacao, error: erroAutenticacao } = await authClient.auth.getUser(token);
  const emailAdministrador = autenticacao.user?.email;
  if (erroAutenticacao || !emailAdministrador) {
    return resposta({ ok: false, erro: "Sessão inválida." }, 401);
  }

  const { data: administrador } = await adminClient
    .from("perfis_usuarios")
    .select("id")
    .ilike("email", emailAdministrador)
    .ilike("perfil", "Administrador")
    .eq("ativo", true)
    .maybeSingle();

  if (!administrador) {
    return resposta({ ok: false, erro: "Somente Administradores podem convidar usuários." }, 403);
  }

  let entrada: { email?: string; nome?: string };
  try {
    entrada = await req.json();
  } catch {
    return resposta({ ok: false, erro: "Dados inválidos." }, 400);
  }

  const email = entrada.email?.trim().toLowerCase();
  const nome = entrada.nome?.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !nome) {
    return resposta({ ok: false, erro: "Informe nome e e-mail válidos." }, 400);
  }

  const { data: perfilExistente } = await adminClient
    .from("perfis_usuarios")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (perfilExistente) {
    return resposta({ ok: false, erro: "Já existe um perfil com este e-mail." }, 409);
  }

  const { data: convite, error: erroConvite } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/atualizar-senha`,
    data: { nome, perfil: "Representante" },
  });

  if (erroConvite || !convite.user) {
    return resposta({ ok: false, erro: "Não foi possível criar o convite." }, 400);
  }

  const { error: erroPerfil } = await adminClient.from("perfis_usuarios").insert({
    id: convite.user.id,
    email,
    nome,
    perfil: "Representante",
    ativo: true,
  });

  if (erroPerfil) {
    await adminClient.auth.admin.deleteUser(convite.user.id);
    return resposta({ ok: false, erro: "O convite foi desfeito porque o perfil não pôde ser criado." }, 500);
  }

  return resposta({ ok: true });
});
