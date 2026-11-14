import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminClient } from "@/app/api/admin/_auth";
import type { PendingSubmission } from "@/lib/pendingQueue";

export const runtime = "nodejs";

const MAKR_RATE_MAP = new Map<string, { count: number; expiresAt: number }>();

function checkMakrRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = MAKR_RATE_MAP.get(ip);
  if (entry && entry.expiresAt > now) {
    if (entry.count >= 12) return false;
    entry.count++;
    return true;
  }
  MAKR_RATE_MAP.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
  return true;
}

async function getAnchorVenue(supabase: ReturnType<typeof getAdminClient>, preferredVenueId?: string) {
  if (!supabase) return null;
  if (preferredVenueId && !preferredVenueId.startsWith("custom-")) {
    const { data } = await supabase
      .from("venues")
      .select("id, name, address, neighborhood, latitude, longitude, image_url, vibe_signals")
      .eq("id", preferredVenueId)
      .maybeSingle();
    if (data) return data;
  }
  const { data: firstRows } = await supabase
    .from("venues")
    .select("id, name, address, neighborhood, latitude, longitude, image_url, vibe_signals")
    .order("id", { ascending: true })
    .limit(1);
  return firstRows?.[0] ?? null;
}

/** Public submission endpoint for Smakr Foodie pending picks and no-login /makr drops. */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkMakrRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many submissions. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ success: true, persisted: "ignored" });
    }

    const raw = (body.submission || body) as Partial<PendingSubmission>;
    const venueName = String(raw.venue_name || "").trim().slice(0, 120);
    if (!venueName) {
      return NextResponse.json({ success: false, error: "Venue or pop-up name is required." }, { status: 400 });
    }

    const kind =
      raw.kind === "foodie_dish" || raw.kind === "makr_popup" || raw.kind === "makr_photos"
        ? raw.kind
        : "makr_popup";

    const submission: PendingSubmission = {
      id: raw.id && typeof raw.id === "string" ? raw.id : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      status: "pending",
      created_at: raw.created_at || new Date().toISOString(),
      author_id: raw.author_id ? String(raw.author_id).slice(0, 80) : undefined,
      author_name: raw.author_name ? String(raw.author_name).slice(0, 80) : undefined,
      author_handle: raw.author_handle ? String(raw.author_handle).slice(0, 50) : undefined,
      author_avatar_url: raw.author_avatar_url ? String(raw.author_avatar_url).slice(0, 4000) : undefined,
      venue_id: raw.venue_id ? String(raw.venue_id).slice(0, 80) : undefined,
      venue_name: venueName,
      neighborhood: String(raw.neighborhood || "Sentrum").slice(0, 60),
      address: raw.address ? String(raw.address).slice(0, 140) : undefined,
      latitude: typeof raw.latitude === "number" ? raw.latitude : 59.9139,
      longitude: typeof raw.longitude === "number" ? raw.longitude : 10.7522,
      is_location_tba: Boolean(raw.is_location_tba),
      instagram_handle: raw.instagram_handle ? String(raw.instagram_handle).replace(/^@/, "").slice(0, 60) : undefined,
      contact_email: raw.contact_email ? String(raw.contact_email).slice(0, 120) : undefined,
      drop_dates: raw.drop_dates ? String(raw.drop_dates).slice(0, 120) : undefined,
      drop_hours: raw.drop_hours ? String(raw.drop_hours).slice(0, 80) : undefined,
      dish_name: raw.dish_name ? String(raw.dish_name).slice(0, 100) : undefined,
      price_nok: typeof raw.price_nok === "number" && raw.price_nok > 0 ? Math.round(raw.price_nok) : null,
      category: raw.category || "street_food",
      icon_key: raw.icon_key ? String(raw.icon_key).slice(0, 40) : undefined,
      dietary_tags: Array.isArray(raw.dietary_tags) ? raw.dietary_tags.slice(0, 8) : [],
      photo_url: raw.photo_url ? String(raw.photo_url) : undefined,
      extra_photos: Array.isArray(raw.extra_photos) ? raw.extra_photos.slice(0, 3).map(String) : [],
      review_text: raw.review_text ? String(raw.review_text).slice(0, 300) : undefined,
      vibe_note: raw.vibe_note ? String(raw.vibe_note).slice(0, 300) : undefined,
      is_local_pick: kind === "foodie_dish" || Boolean(raw.is_local_pick),
    };

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: true, persisted: "client", submission });
    }

    const anchor = await getAnchorVenue(supabase, submission.venue_id);
    if (anchor) {
      const sig = ((anchor.vibe_signals || {}) as Record<string, unknown>) || {};
      const existing = Array.isArray(sig.pending_makr_queue) ? (sig.pending_makr_queue as PendingSubmission[]) : [];
      const nextQueue = [submission, ...existing.filter((x) => x.id !== submission.id)].slice(0, 50);

      await supabase
        .from("venues")
        .update({
          vibe_signals: {
            ...sig,
            pending_makr_queue: nextQueue,
          },
        })
        .eq("id", anchor.id);
    }

    return NextResponse.json({ success: true, persisted: anchor ? "supabase" : "client", submission });
  } catch (err) {
    console.error("[api/makr/submit POST]", err);
    return NextResponse.json({ success: false, error: "Could not record submission." }, { status: 500 });
  }
}

/** Admin-only queue list. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data: venues } = await auth.adminClient
    .from("venues")
    .select("id, vibe_signals")
    .not("vibe_signals", "is", null);

  const items: PendingSubmission[] = [];
  const seen = new Set<string>();

  for (const v of venues || []) {
    const sig = (v.vibe_signals || {}) as Record<string, unknown>;
    const queue = Array.isArray(sig.pending_makr_queue) ? (sig.pending_makr_queue as PendingSubmission[]) : [];
    for (const item of queue) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
  }

  items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return NextResponse.json({ success: true, items });
}

/** Admin-only approve/reject action for Foodie picks & Makr studio drops. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : "";
    const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
    const iconKeyOverride = typeof body.icon_key === "string" ? body.icon_key : undefined;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "Missing id or action." }, { status: 400 });
    }

    const { data: venues } = await auth.adminClient
      .from("venues")
      .select("id, vibe_signals")
      .not("vibe_signals", "is", null);

    let matchedItem: PendingSubmission | null = null;
    let hostVenueId: string | null = null;
    let hostSig: Record<string, unknown> = {};

    for (const v of venues || []) {
      const sig = (v.vibe_signals || {}) as Record<string, unknown>;
      const queue = Array.isArray(sig.pending_makr_queue) ? (sig.pending_makr_queue as PendingSubmission[]) : [];
      const found = queue.find((item) => item.id === id);
      if (found) {
        matchedItem = { ...found, icon_key: iconKeyOverride || found.icon_key };
        hostVenueId = v.id;
        hostSig = sig;
        break;
      }
    }

    if (!matchedItem || !hostVenueId) {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }

    const updatedQueue = ((hostSig.pending_makr_queue as PendingSubmission[]) || []).map((item) =>
      item.id === id ? { ...item, status: action === "approve" ? "approved" : "rejected", icon_key: matchedItem?.icon_key } : item
    );

    await auth.adminClient
      .from("venues")
      .update({
        vibe_signals: {
          ...hostSig,
          pending_makr_queue: updatedQueue,
        },
      })
      .eq("id", hostVenueId);

    if (action === "approve") {
      if (matchedItem.kind === "foodie_dish" && matchedItem.venue_id && matchedItem.dish_name) {
        const catTag = matchedItem.icon_key ? `cat_${matchedItem.icon_key}` : `cat_${matchedItem.category || "street_food"}`;
        const tags = Array.from(new Set([...(matchedItem.dietary_tags || []), catTag, "local_pick"]));
        await auth.adminClient.from("food_posts").insert({
          venue_id: matchedItem.venue_id,
          author_id: matchedItem.author_id || auth.userId,
          dish_name: matchedItem.dish_name,
          category: matchedItem.category || "street_food",
          dish_image: matchedItem.photo_url || "",
          review_text: matchedItem.review_text || "Approved from Oslo Locals' Picks.",
          price_nok: matchedItem.price_nok ?? null,
          rating: 0,
          dietary_tags: tags,
          is_official_pick: false,
          is_published: true,
        });
      } else if (matchedItem.kind === "makr_popup") {
        const slug = matchedItem.venue_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 48);
        const newVenueId = `${slug || "popup"}-${Date.now().toString(36)}`;
        await auth.adminClient.from("venues").insert({
          id: newVenueId,
          name: matchedItem.venue_name,
          address: matchedItem.is_location_tba ? "Oslo" : matchedItem.address || String(matchedItem.neighborhood || "Oslo"),
          neighborhood: String(matchedItem.neighborhood || "Sentrum"),
          category: matchedItem.category || "street_food",
          icon: matchedItem.icon_key || matchedItem.category || "popup",
          latitude: matchedItem.latitude ?? 59.9139,
          longitude: matchedItem.longitude ?? 10.7522,
          image_url: matchedItem.photo_url || null,
          spot_type: "popup",
          open_now: !matchedItem.is_location_tba,
          current_opening_hours_text: matchedItem.drop_dates || matchedItem.drop_hours || "Pop-Up Drop",
          dietary_tags: matchedItem.dietary_tags || [],
          signature_dishes: matchedItem.dish_name ? [matchedItem.dish_name] : [],
          vibe_signals: {
            popup_meta: {
              instagram: matchedItem.instagram_handle ? `@${matchedItem.instagram_handle}` : undefined,
              dates: matchedItem.drop_dates,
              hours: matchedItem.drop_hours,
              tba: matchedItem.is_location_tba,
            },
          },
        });
      } else if (matchedItem.kind === "makr_photos" && matchedItem.venue_id && matchedItem.photo_url) {
        if (matchedItem.dish_name) {
          await auth.adminClient.from("food_posts").insert({
            venue_id: matchedItem.venue_id,
            author_id: auth.userId,
            dish_name: matchedItem.dish_name,
            category: matchedItem.category || "street_food",
            dish_image: matchedItem.photo_url,
            review_text: matchedItem.review_text || `${matchedItem.venue_name} gallery drop.`,
            price_nok: matchedItem.price_nok ?? null,
            rating: 0,
            dietary_tags: matchedItem.dietary_tags || [],
            is_official_pick: true,
            is_published: true,
          });
        } else {
          await auth.adminClient
            .from("venues")
            .update({ image_url: matchedItem.photo_url })
            .eq("id", matchedItem.venue_id);
        }
      }
    }

    return NextResponse.json({ success: true, item: matchedItem, status: action === "approve" ? "approved" : "rejected" });
  } catch (err) {
    console.error("[api/makr/submit PATCH]", err);
    return NextResponse.json({ success: false, error: "Could not process moderation action." }, { status: 500 });
  }
}
