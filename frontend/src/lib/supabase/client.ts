"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client.
 *
 * Gracefully degrades to `null` when the project env vars are absent, so the
 * app keeps working (via the local "beta dev" auth bypass) before Supabase is
 * provisioned. Callers must therefore NULL-CHECK the result.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  }
  return browserClient;
}

/** Alias kept for convention / discoverability. */
export const createClient = getSupabaseBrowserClient;
