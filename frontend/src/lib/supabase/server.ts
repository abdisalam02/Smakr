import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase server client for server actions, route handlers and middleware.
 * Returns `null` when the project env vars are absent so server code can fall
 * back to mock data instead of throwing during beta.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseServerConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseServerConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // is responsible for refreshing the session cookies.
        }
      },
    },
  });
}

/** Alias kept for convention / discoverability. */
export const createClient = getSupabaseServerClient;
