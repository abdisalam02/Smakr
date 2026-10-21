import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { KitchenLiveStatus } from "@/types";

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

function timingSafeTokenMatch(provided: string, actual: string): boolean {
  if (!provided || !actual) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(actual);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token." }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database unconfigured." }, { status: 500 });
    }

    let matchedVenueId: string | null = null;
    const { data: tokenRow } = await supabase
      .from("venue_kitchen_tokens")
      .select("venue_id, kitchen_token")
      .eq("kitchen_token", token)
      .maybeSingle();

    if (!tokenRow?.venue_id) {
      return NextResponse.json({ success: false, error: "Invalid kitchen token." }, { status: 404 });
    }

    const { data: matched, error: vErr } = await supabase
      .from("venues")
      .select("id, name, address, category, vibe_signals")
      .eq("id", tokenRow.venue_id)
      .maybeSingle();

    if (vErr || !matched) {
      return NextResponse.json({ success: false, error: "Venue not found." }, { status: 404 });
    }

    const signals = (matched.vibe_signals || {}) as Record<string, unknown>;
    const kStatus = signals.kitchen_status as Record<string, unknown> | undefined;

    return NextResponse.json({
      success: true,
      venue: {
        id: matched.id,
        name: matched.name,
        address: matched.address,
        kitchen_status: {
          status: (kStatus?.status as KitchenLiveStatus["status"]) || "normal",
          batch_note: (kStatus?.batch_note as string) || undefined,
          dish_highlight: (kStatus?.dish_highlight as string) || undefined,
          updated_at: (kStatus?.updated_at as string) || new Date().toISOString(),
          kitchen_token: token,
          verified_kitchen: true,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error reading kitchen status." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.kitchenToken || body.token || "").trim();
    const venueId = (body.venueId || "").trim();
    const status = body.status as KitchenLiveStatus["status"];
    const batchNote = typeof body.batchNote === "string" ? body.batchNote.trim().slice(0, 60) : "";
    const dishHighlight =
      typeof body.dishHighlight === "string" ? body.dishHighlight.trim().slice(0, 60) : "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing required kitchen token." },
        { status: 400 }
      );
    }

    if (!["normal", "fresh_batch", "low_stock", "sold_out"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database client is not configured." },
        { status: 500 }
      );
    }

    // 1. Locate the venue matching this token via secure venue_kitchen_tokens table
    const { data: tokenRow } = await supabase
      .from("venue_kitchen_tokens")
      .select("venue_id, kitchen_token")
      .eq("kitchen_token", token)
      .maybeSingle();

    if (!tokenRow?.venue_id || (venueId && tokenRow.venue_id !== venueId)) {
      return NextResponse.json(
        { success: false, error: "Invalid kitchen token for this venue." },
        { status: 403 }
      );
    }

    const { data: matchedVenue, error: fetchError } = await supabase
      .from("venues")
      .select("id, name, vibe_signals")
      .eq("id", tokenRow.venue_id)
      .maybeSingle();

    if (fetchError || !matchedVenue) {
      return NextResponse.json(
        { success: false, error: "Venue not found." },
        { status: 404 }
      );
    }

    const currentSignals = (matchedVenue.vibe_signals || {}) as Record<string, unknown>;
    const currentKStatus = (currentSignals.kitchen_status || {}) as Record<string, unknown>;

    // OMIT kitchen_token completely from public JSONB!
    const updatedKitchenStatus: Omit<KitchenLiveStatus, "kitchen_token"> = {
      status,
      batch_note: batchNote || (status === "normal" ? undefined : (currentKStatus.batch_note as string)),
      dish_highlight:
        dishHighlight ||
        (status === "normal" ? undefined : (currentKStatus.dish_highlight as string)),
      updated_at: new Date().toISOString(),
      verified_kitchen: true,
    };

    const updatedSignals = {
      ...currentSignals,
      kitchen_status: updatedKitchenStatus,
    };

    const { error: updateError } = await supabase
      .from("venues")
      .update({ vibe_signals: updatedSignals })
      .eq("id", matchedVenue.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      venue: {
        id: matchedVenue.id,
        name: matchedVenue.name,
        kitchen_status: {
          ...updatedKitchenStatus,
          kitchen_token: token,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
