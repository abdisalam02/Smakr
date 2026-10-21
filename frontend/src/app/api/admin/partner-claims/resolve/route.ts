import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  return { isAdmin: false };
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("https://") && !url.startsWith("/api/places/photos")) return false;
  try {
    if (url.startsWith("/api/places/photos")) return true;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
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
    const auth = await verifyAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database unconfigured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const claimId = typeof body.claimId === "string" ? body.claimId.trim() : "";
    const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!claimId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing claimId or action (approve | reject)." },
        { status: 400 }
      );
    }

    // 1. Fetch claim details
    let claimData: any = null;
    let isFallback = false;

    if (claimId.startsWith("fallback_")) {
      isFallback = true;
      const venueId = claimId.replace("fallback_", "");
      const { data: v } = await supabase.from("venues").select("*").eq("id", venueId).single();
      if (v) {
        const sig = v.vibe_signals || {};
        claimData = {
          venue_id: v.id,
          venue_name: v.name,
          applicant_name: sig.pending_partner_claim?.applicant?.name || "Partner",
          applicant_email: sig.pending_partner_claim?.applicant?.email || "",
          proposed: sig.pending_partner_claim?.proposed || {},
        };
      }
    } else {
      const { data: c, error: cErr } = await supabase
        .from("partner_claims")
        .select("*, venue:venues(*)")
        .eq("id", claimId)
        .single();

      if (cErr || !c) {
        return NextResponse.json({ success: false, error: "Claim not found." }, { status: 404 });
      }
      claimData = {
        ...c,
        venue_name: c.venue?.name || "Restaurant",
      };
    }

    if (!claimData) {
      return NextResponse.json({ success: false, error: "Claim data not found." }, { status: 404 });
    }

    const venueId = claimData.venue_id;

    // -------------------------------------------------------------------------
    // ACTION: REJECT
    // -------------------------------------------------------------------------
    if (action === "reject") {
      if (!isFallback) {
        await supabase
          .from("partner_claims")
          .update({
            status: "rejected",
            review_note: note || "Claim rejected by editorial team.",
            reviewed_at: new Date().toISOString(),
            reviewed_by: auth.userId,
          })
          .eq("id", claimId);
      } else {
        const { data: v } = await supabase.from("venues").select("vibe_signals").eq("id", venueId).single();
        const sig = { ...(v?.vibe_signals || {}) };
        delete sig.pending_partner_claim;
        sig.rejected_partner_claim = {
          rejected_at: new Date().toISOString(),
          note,
        };
        await supabase.from("venues").update({ vibe_signals: sig }).eq("id", venueId);
      }

      return NextResponse.json({
        success: true,
        message: "Partner claim rejected.",
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: APPROVE
    // -------------------------------------------------------------------------
    const proposed = claimData.proposed || {};

    // 1. Fetch current venue signals
    const { data: currentVenue, error: vFetchErr } = await supabase
      .from("venues")
      .select("id, name, vibe_signals, image_url, signature_dishes")
      .eq("id", venueId)
      .single();

    if (vFetchErr || !currentVenue) {
      return NextResponse.json({ success: false, error: "Venue record not found." }, { status: 404 });
    }

    const currentSignals = (currentVenue.vibe_signals || {}) as Record<string, unknown>;
    const currentKStatus = (currentSignals.kitchen_status || {}) as Record<string, unknown>;

    // Generate or preserve kitchen token in secret venue_kitchen_tokens table only
    let existingToken = "";
    const { data: tRow } = await supabase
      .from("venue_kitchen_tokens")
      .select("kitchen_token")
      .eq("venue_id", venueId)
      .maybeSingle();
    if (tRow?.kitchen_token) {
      existingToken = tRow.kitchen_token;
    } else if (typeof currentKStatus.kitchen_token === "string") {
      existingToken = currentKStatus.kitchen_token;
    }
    const secureToken = existingToken || `k_${crypto.randomBytes(24).toString("base64url")}`;

    // Omit kitchen_token from public JSONB!
    const updatedKitchenStatus = {
      status: "normal",
      verified_kitchen: true,
      dish_highlight: proposed.dish_name || (currentKStatus.dish_highlight as string) || undefined,
      batch_note: proposed.taste_note || undefined,
      updated_at: new Date().toISOString(),
    };

    const newSignals: Record<string, unknown> = {
      ...currentSignals,
      kitchen_status: updatedKitchenStatus,
      partner_verified: true,
      partner_updated_at: new Date().toISOString(),
      ...(proposed.popup_meta ? { popup_meta: proposed.popup_meta } : {}),
    };
    if (isFallback) {
      delete newSignals.pending_partner_claim;
    }

    const venuePatch: Record<string, unknown> = {
      vibe_signals: newSignals,
    };

    if (proposed.image_url && isValidImageUrl(proposed.image_url)) {
      venuePatch.image_url = proposed.image_url;
    }
    if (proposed.cover_image_url && isValidImageUrl(proposed.cover_image_url)) {
      venuePatch.image_url = proposed.cover_image_url;
    }
    if (proposed.description) {
      venuePatch.description = proposed.description;
    }
    if (typeof proposed.opening_hours === "string" && proposed.opening_hours.trim()) {
      venuePatch.current_opening_hours_text = proposed.opening_hours;
    } else if (proposed.opening_hours && typeof proposed.opening_hours === "object") {
      venuePatch.opening_hours = proposed.opening_hours;
    }
    if (proposed.spot_type) {
      venuePatch.spot_type = proposed.spot_type;
    }
    if (proposed.location_schedule) {
      venuePatch.location_schedule = proposed.location_schedule;
    }
    const proposedDishNames = Array.isArray(proposed.dishes)
      ? proposed.dishes
          .map((d: any) => String(d?.dishName || d?.dish_name || "").trim())
          .filter(Boolean)
      : [];
    if (proposed.dish_name) {
      proposedDishNames.unshift(String(proposed.dish_name).trim());
    }
    if (proposedDishNames.length > 0) {
      const existingSignatures = Array.isArray(currentVenue.signature_dishes)
        ? currentVenue.signature_dishes
        : [];
      venuePatch.signature_dishes = Array.from(
        new Set([...existingSignatures, ...proposedDishNames])
      );
    }
    if (proposed.category) {
      venuePatch.category = proposed.category;
    }

    // Update venue record
    const { error: vUpdateErr } = await supabase
      .from("venues")
      .update(venuePatch)
      .eq("id", venueId);

    if (vUpdateErr) {
      return NextResponse.json({ success: false, error: vUpdateErr.message }, { status: 500 });
    }

    // Upsert into venue_kitchen_tokens table for secure token isolation
    try {
      await supabase.from("venue_kitchen_tokens").upsert({
        venue_id: venueId,
        kitchen_token: secureToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: "venue_id" });
    } catch {
      // Graceful fallback if table is not yet migrated
    }

    // 2. Update or insert featured food posts
    if (Array.isArray(proposed.dishes) && proposed.dishes.length > 0) {
      for (const d of proposed.dishes) {
        if (!d.dishName && !d.dish_name) continue;
        const dName = String(d.dishName || d.dish_name || "").trim();
        const dImg = String(d.imageUrl || d.image_url || d.dish_image || "");
        const dPriceRaw = d.priceNok ?? d.price_nok ?? null;
        const dPrice =
          dPriceRaw === null || dPriceRaw === "" || dPriceRaw === undefined
            ? null
            : Number(dPriceRaw);
        const dNote = String(d.tasteNote || d.taste_note || d.review_text || "").trim();
        const dCat = d.category || proposed.category || "street_food";
        const dDietary = Array.isArray(d.dietaryTags) ? d.dietaryTags : (Array.isArray(d.dietary_tags) ? d.dietary_tags : []);
        const dTasteTags = Array.isArray(d.tasteTags) ? d.tasteTags : (Array.isArray(d.taste_tags) ? d.taste_tags : []);
        const dAvailability = typeof (d.itemAvailability ?? d.item_availability) === "string"
          ? (d.itemAvailability ?? d.item_availability)
          : null;
        const safeDImg = dImg && isValidImageUrl(dImg) ? dImg : currentVenue.image_url || "";

        let postMatch: { id: string } | null = null;
        if (d.id && !String(d.id).startsWith("dish_")) {
          const { data } = await supabase.from("food_posts").select("id").eq("id", d.id).maybeSingle();
          postMatch = data;
        }
        if (!postMatch) {
          const { data } = await supabase.from("food_posts").select("id").eq("venue_id", venueId).ilike("dish_name", dName).maybeSingle();
          postMatch = data;
        }

        if (postMatch) {
          await supabase.from("food_posts").update({
            dish_name: dName,
            ...(dImg && isValidImageUrl(dImg) ? { dish_image: dImg } : {}),
            price_nok: dPrice,
            review_text: dNote,
            category: dCat,
            dietary_tags: dDietary,
            taste_tags: dTasteTags,
            item_availability: dAvailability,
            is_published: true,
            is_archived: false,
          }).eq("id", postMatch.id);
        } else {
          await supabase.from("food_posts").insert({
            venue_id: venueId,
            author_id: auth.userId,
            dish_name: dName,
            dish_image: safeDImg,
            price_nok: dPrice,
            review_text: dNote,
            category: dCat,
            dietary_tags: dDietary,
            taste_tags: dTasteTags,
            item_availability: dAvailability,
            rating: 9,
            is_official_pick: true,
            is_published: true,
            is_archived: false,
            likes_count: 0,
            saves_count: 0,
            craving_count: 0,
            must_try_count: 0,
            tried_count: 0,
            diner_quotes: [],
          });
        }
      }
    } else {
      const { data: existingPosts } = await supabase
        .from("food_posts")
        .select("id")
        .eq("venue_id", venueId)
        .limit(1);

      if (existingPosts && existingPosts.length > 0) {
        const postPatch: Record<string, unknown> = {};
        if (proposed.dish_name) postPatch.dish_name = proposed.dish_name;
        if (proposed.image_url && isValidImageUrl(proposed.image_url)) {
          postPatch.dish_image = proposed.image_url;
        }
        if (proposed.price_nok !== undefined) postPatch.price_nok = proposed.price_nok;
        if (proposed.taste_note) postPatch.review_text = proposed.taste_note;
        if (proposed.category) postPatch.category = proposed.category;
        if (proposed.dietary_tags) postPatch.dietary_tags = proposed.dietary_tags;
        if (proposed.taste_tags) postPatch.taste_tags = proposed.taste_tags;
        if (proposed.item_availability) postPatch.item_availability = proposed.item_availability;
        postPatch.is_published = true;
        postPatch.is_archived = false;

        await supabase
          .from("food_posts")
          .update(postPatch)
          .eq("id", existingPosts[0].id);
      } else {
        const postImage = proposed.image_url && isValidImageUrl(proposed.image_url)
          ? proposed.image_url
          : currentVenue.image_url || "";
        await supabase.from("food_posts").insert({
          venue_id: venueId,
          author_id: auth.userId,
          dish_name: proposed.dish_name || currentVenue.name,
          price_nok: proposed.price_nok || null,
          dish_image: postImage,
          review_text: proposed.taste_note || "",
          category: proposed.category || "all",
          dietary_tags: proposed.dietary_tags || [],
          taste_tags: proposed.taste_tags || [],
          item_availability: proposed.item_availability || null,
          rating: 9,
          is_official_pick: true,
          is_published: true,
          is_archived: false,
          likes_count: 0,
          saves_count: 0,
          craving_count: 0,
          must_try_count: 0,
          tried_count: 0,
          diner_quotes: [],
        });
      }
    }

    // 3. Mark claim approved in database
    if (!isFallback) {
      await supabase
        .from("partner_claims")
        .update({
          status: "approved",
          review_note: note || "Approved and published to live radar.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.userId,
        })
        .eq("id", claimId);
    }

    // 4. Generate Mailto link
    const host = req.headers.get("host") || "smakr.no";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fullKitchenUrl = `${protocol}://${host}/kitchen/${secureToken}`;

    const applicantEmail = claimData.applicant_email || "";
    const applicantName = claimData.applicant_name || "Partner";
    const venueName = claimData.venue_name || currentVenue.name;

    const emailSubject = `Smakr Oslo: Your Restaurant Card is Live (${venueName})!`;
    const emailBody = `Hei ${applicantName},

Your restaurant card for ${venueName} is now live on the Smakr radar!

Here is your private, zero-password Kitchen Remote link. Pin this link to your smartphone or kitchen iPad to broadcast live batches directly to Oslo foodies:

${fullKitchenUrl}

Features:
- Tap "🔥 Fresh Batch" when a fresh tray leaves the oven or kitchen
- Tap "⚡ Few Left Today" or "Sold Out" to update status in real time
- Update your daily in-house specials and closing times

Velkommen til Smakr Partner!
Smakr Editorial Team`;

    const mailtoLink = applicantEmail
      ? `mailto:${applicantEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      : "";

    return NextResponse.json({
      success: true,
      kitchenUrl: `/kitchen/${secureToken}`,
      kitchenToken: secureToken,
      fullKitchenUrl,
      mailtoLink,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Resolve error" },
      { status: 500 }
    );
  }
}
