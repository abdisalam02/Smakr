import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; adminClient: SupabaseClient }
  | { ok: false; response: NextResponse }
> {
  const ssrClient = await getSupabaseServerClient();
  if (!ssrClient) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 }),
    };
  }

  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 }),
    };
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin database client unavailable." }, { status: 500 }),
    };
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden. Admin role required." }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, adminClient };
}
