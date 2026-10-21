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

/** Timing-safe token comparison */
function timingSafeTokenMatch(provided: string, actual: string): boolean {
  if (!provided || !actual) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(actual);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Validate image URL: must be HTTPS and originate from /api/places/photos or Supabase dish-photos bucket */
function isValidImageUrl(url: string): boolean {
  if (!url) return true;
  if (!url.startsWith("https://") && !url.startsWith("/api/places/photos")) return false;
  try {
    if (url.startsWith("/api/places/photos")) return true;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    // Allow Google Place photo proxies, Supabase storage (dish-photos), or trusted image hosts
    const hostname = parsed.hostname.toLowerCase();
    const isSupabaseStorage = hostname.includes("supabase.co") && parsed.pathname.includes("/storage/v1/object/public/dish-photos");
    const isGooglePlaces = hostname.includes("places.googleapis.com") || hostname.includes("googleusercontent.com");
    const isUnsplash = hostname.includes("unsplash.com");
    return isSupabaseStorage || isGooglePlaces || isUnsplash;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Server storage configuration error." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const venueId = typeof body.venueId === "string" ? body.venueId.trim() : "";
    const token = typeof body.kitchenToken === "string" ? body.kitchenToken.trim() : "";

    if (!venueId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing venueId or kitchenToken" },
        { status: 403 }
      );
    }

    // 1. Fetch current venue
    const { data: venue, error: fetchErr } = await supabase
      .from("venues")
      .select("id, name, image_url, vibe_signals, address, neighborhood")
      .eq("id", venueId)
      .single();

    if (fetchErr || !venue) {
      return NextResponse.json({ success: false, error: "Venue not found" }, { status: 404 });
    }

    // STRICT CHECK: Token must match secret venue_kitchen_tokens table via timingSafeEqual. No auto-issue!
    const { data: tokenRow } = await supabase
      .from("venue_kitchen_tokens")
      .select("kitchen_token")
      .eq("venue_id", venueId)
      .maybeSingle();

    const storedToken = tokenRow?.kitchen_token || "";
    if (!storedToken || !timingSafeTokenMatch(token, storedToken)) {
      return NextResponse.json({ success: false, error: "Forbidden: invalid kitchen token" }, { status: 403 });
    }

    const currentSignals = (venue.vibe_signals || {}) as Record<string, unknown>;
    const currentKStatus = (currentSignals.kitchen_status || {}) as Record<string, unknown>;

    // 2. Validate and clamp fields
    // Dish name: trimmed, max 80 chars
    const rawDishName = typeof body.dishName === "string" ? body.dishName.trim().slice(0, 80) : "";
    // Price NOK: integer between 1 and 2000
    let priceNok: number | undefined;
    if (body.priceNok !== undefined && body.priceNok !== null && body.priceNok !== "") {
      const parsedPrice = parseInt(String(body.priceNok), 10);
      if (Number.isFinite(parsedPrice) && parsedPrice >= 1 && parsedPrice <= 2000) {
        priceNok = parsedPrice;
      }
    }
    // Image URL: must be valid HTTPS or place photo proxy
    const rawImageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (rawImageUrl && !isValidImageUrl(rawImageUrl)) {
      return NextResponse.json({ success: false, error: "Invalid image URL. Must be HTTPS and from an allowed photo source." }, { status: 400 });
    }
    // Opening hours: trimmed, max 100 chars
    const rawHours = typeof body.openingHours === "string" ? body.openingHours.trim().slice(0, 100) : "";
    // Batch note: trimmed, max 60 chars
    const rawBatchNote = typeof body.batchNote === "string" ? body.batchNote.trim().slice(0, 60) : "";

    // OMIT kitchen_token from public vibe_signals!
    const updatedKitchenStatus: Omit<KitchenLiveStatus, "kitchen_token"> = {
      status: (currentKStatus.status as KitchenLiveStatus["status"]) || "normal",
      batch_note: rawBatchNote || (currentKStatus.batch_note as string) || undefined,
      dish_highlight: rawDishName || (currentKStatus.dish_highlight as string) || undefined,
      updated_at: new Date().toISOString(),
      verified_kitchen: true,
    };

    const updatedSignals = {
      ...currentSignals,
      kitchen_status: updatedKitchenStatus,
      partner_verified: true,
      partner_updated_at: new Date().toISOString(),
    };

    const venuePatch: Record<string, unknown> = {
      vibe_signals: updatedSignals,
    };

    if (rawImageUrl) {
      venuePatch.image_url = rawImageUrl;
    }
    if (rawHours) {
      venuePatch.current_opening_hours_text = rawHours;
    }

    const { error: vUpdateErr } = await supabase
      .from("venues")
      .update(venuePatch)
      .eq("id", venueId);

    if (vUpdateErr) {
      return NextResponse.json({ success: false, error: vUpdateErr.message }, { status: 500 });
    }

    // 3. Update existing food post if dishName, priceNok or imageUrl is provided
    if (rawDishName || rawImageUrl || priceNok !== undefined) {
      const postPatch: Record<string, unknown> = {};
      if (rawDishName) postPatch.dish_name = rawDishName;
      if (rawImageUrl) {
        postPatch.dish_image = rawImageUrl;
      }
      if (priceNok !== undefined) postPatch.price_nok = priceNok;

      await supabase
        .from("food_posts")
        .update(postPatch)
        .eq("venue_id", venueId);
    }

    return NextResponse.json({
      success: true,
      message: "Venue updated successfully by partner.",
      kitchenToken: storedToken,
      kitchenUrl: `/kitchen/${storedToken}`,
      venue: {
        id: venue.id,
        name: venue.name,
        cover_image_url: rawImageUrl || venue.image_url || null,
        kitchen_status: updatedKitchenStatus,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
