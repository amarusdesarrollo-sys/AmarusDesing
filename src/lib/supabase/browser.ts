import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

/** Cliente anon para subidas firmadas desde el admin (Firebase Auth + API firmada). */
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = getSupabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      "Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  browserClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}
