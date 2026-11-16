import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const venueId = typeof body.venueId === "string" ? body.venueId.trim() : "";
    if (!venueId) {
      return NextResponse.json({ success: false, error: "Missing venueId." }, { status: 400 });
    }

    const supabase = auth.adminClient;

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
