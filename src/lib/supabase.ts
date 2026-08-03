import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * O Next.js avalia os componentes durante o build para gerar páginas internas,
 * como /_not-found. O fallback evita que o build seja interrompido quando esse
 * ambiente de validação ainda não recebeu as variáveis públicas do Supabase.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey,
);

export const supabase = createClient(
  supabaseUrl || "https://build-placeholder.invalid",
  supabaseAnonKey || "build-placeholder-anon-key",
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  },
);
