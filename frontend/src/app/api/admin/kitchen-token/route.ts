import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function verifyAdminAuth(): Promise<{ isAdmin: boolean; userId?: string }> {
  const ssrClient = await getSupabaseServerClient();
  if (!ssrClient) return { isAdmin: false };

  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) return { isAdmin: false };

  const supabase = getAdminClient();
  if (!supabase) return { isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return { isAdmin: true, userId: user.id };
  }

  // Never authorize by email/handle. Only public.profiles.role = 'admin'
  // grants admin capability.
  return { isAdmin: false };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin session required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const venueId = typeof body.venueId === "string" ? body.venueId.trim() : "";
    if (!venueId) {
      return NextResponse.json({ success: false, error: "Missing venueId." }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database unconfigured." }, { status: 500 });
    }

    // Check existing token
    const { data: existing } = await supabase
      .from("venue_kitchen_tokens")
      .select("kitchen_token")
      .eq("venue_id", venueId)
      .maybeSingle();

    if (existing?.kitchen_token) {
      return NextResponse.json({
        success: true,
        token: existing.kitchen_token,
        url: `/kitchen/${existing.kitchen_token}`,
      });
    }

    // Generate new secure kitchen token
    const newToken = `k_${crypto.randomBytes(24).toString("base64url")}`;
    const { error: upsertErr } = await supabase
      .from("venue_kitchen_tokens")
      .upsert(
        {
          venue_id: venueId,
          kitchen_token: newToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "venue_id" }
      );

    if (upsertErr) {
      return NextResponse.json({ success: false, error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: newToken,
      url: `/kitchen/${newToken}`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
