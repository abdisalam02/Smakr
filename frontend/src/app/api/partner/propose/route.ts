import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { curatedVenuePhotos } from "@/lib/places/curatedPhotos";

export const runtime = "nodejs";

const VENUE_FIELDS =
  "id, name, address, image_url, opening_hours, current_opening_hours_text, " +
  "spot_type, location_schedule, category, google_rating, google_reviews_count, " +
  "vibe_signals, description, signature_dishes";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// In-memory rate limiting: 5 claims per 10 mins per IP
// Note: In distributed serverless deployments, each container holds its own window; consider Redis for multi-region enforcement.
const proposeRateMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rateData = proposeRateMap.get(ip);
  if (rateData && rateData.expiresAt > now) {
    if (rateData.count >= 5) {
      return false;
    }
    rateData.count++;
    return true;
  }
  proposeRateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_NORWAY_REGEX = /^(?:(?:\+|00)47)?[2-9]\d{7}$/;
const ORG_NUMBER_REGEX = /^\d{9}$/;

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many proposal requests. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Honeypot check: bot protection
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ success: true, claimId: "ok" });
    }

    const venueId = typeof body.venueId === "string" ? body.venueId.trim() : "";
    if (!venueId) {
      return NextResponse.json({ success: false, error: "Missing venueId" }, { status: 400 });
    }

    const applicant = body.applicant || {};
    const name = typeof applicant.name === "string" ? applicant.name.trim().slice(0, 100) : "";
    const role = typeof applicant.role === "string" && applicant.role.trim()
      ? applicant.role.trim().toLowerCase()
      : "owner";
    const email = typeof applicant.email === "string" ? applicant.email.trim().toLowerCase() : "";
    const phone = typeof applicant.phone === "string" ? applicant.phone.trim().replace(/\s+/g, "") : "";
    const instagram = typeof applicant.instagram === "string" ? applicant.instagram.trim().slice(0, 50) : "";
    const orgNumber = typeof applicant.orgNumber === "string" ? applicant.orgNumber.trim().replace(/\s+/g, "") : "";

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "Please enter your full name." }, { status: 400 });
    }

    const validRoles = ["owner", "chef", "manager", "staff"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Please select your role at this venue." }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid business email." }, { status: 400 });
    }

    if (phone && !PHONE_NORWAY_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Norwegian phone number must be 8 digits (e.g. 91234567 or +4791234567)." },
        { status: 400 }
      );
    }

    if (orgNumber && !ORG_NUMBER_REGEX.test(orgNumber)) {
      return NextResponse.json(
        { success: false, error: "Norwegian organisation number must be 9 digits." },
        { status: 400 }
      );
    }

    const proposedCard = body.proposedCard || {};
    const dishName = typeof proposedCard.dishName === "string" ? proposedCard.dishName.trim().slice(0, 80) : "";
    const imageUrl = typeof proposedCard.imageUrl === "string" ? proposedCard.imageUrl.trim() : "";
    const tasteNote = typeof proposedCard.tasteNote === "string" ? proposedCard.tasteNote.trim().slice(0, 240) : "";
    const openingHours = typeof proposedCard.openingHours === "string" ? proposedCard.openingHours.trim().slice(0, 120) : "";
    const locationSchedule = typeof proposedCard.locationSchedule === "string" ? proposedCard.locationSchedule.trim().slice(0, 120) : "";
    const spotType = typeof proposedCard.spotType === "string" ? proposedCard.spotType.trim() : undefined;
    const category = typeof proposedCard.category === "string" ? proposedCard.category.trim() : undefined;
    const dietaryTags = Array.isArray(proposedCard.dietaryTags) ? proposedCard.dietaryTags.slice(0, 6) : [];

    // Description, Cover Photo, Multi-dish menu, and Pop-up metadata enrichment
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 500)
        : typeof body.proposedChanges?.description === "string"
        ? body.proposedChanges.description.trim().slice(0, 500)
        : undefined;
    const coverImageUrl =
      typeof body.coverImageUrl === "string"
        ? body.coverImageUrl.trim()
        : typeof body.proposedChanges?.coverImageUrl === "string"
        ? body.proposedChanges.coverImageUrl.trim()
        : undefined;
    const menuDishes = Array.isArray(body.dishes)
      ? body.dishes
      : Array.isArray(body.proposedChanges?.menuDishes)
      ? body.proposedChanges.menuDishes
      : undefined;
    const popupMeta = body.popupMeta || body.proposedChanges?.popupMeta;
    const googlePlaceId =
      typeof body.googlePlaceId === "string"
        ? body.googlePlaceId.trim()
        : typeof body.proposedChanges?.googlePlaceId === "string"
        ? body.proposedChanges.googlePlaceId.trim()
        : null;
    const fallbackLat = Number(body.latitude ?? body.proposedChanges?.latitude);
    const fallbackLng = Number(body.longitude ?? body.proposedChanges?.longitude);

    let priceNok: number | null = null;
    if (proposedCard.priceNok !== undefined && proposedCard.priceNok !== null && proposedCard.priceNok !== "") {
      const parsed = parseInt(String(proposedCard.priceNok), 10);
      if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 2000) {
        priceNok = parsed;
      }
    }

    if (!dishName) {
      return NextResponse.json({ success: false, error: "Please specify your signature dish name." }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Please select or upload a dish photo." }, { status: 400 });
    }

    if (!isValidImageUrl(imageUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid image URL. Must be HTTPS and from an allowed photo source." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 500 });
    }

    // 1. Fetch current venue or create stub if custom/unlisted
    let venue: any = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(venueId);

    if (isUuid) {
      const { data } = await supabase
        .from("venues")
        .select(VENUE_FIELDS)
        .eq("id", venueId)
        .maybeSingle();
      venue = data;
    }

    if (!venue && googlePlaceId) {
      const { data } = await supabase
        .from("venues")
        .select(VENUE_FIELDS)
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();
      venue = data;
    }

    if (!venue) {
      // It's a custom venue or unlisted spot created in Smakr Partner Studio
      const fallbackName = typeof body.venueName === "string" && body.venueName.trim()
        ? body.venueName.trim().slice(0, 100)
        : "Oslo Restaurant";
      const fallbackAddress = typeof body.venueAddress === "string" && body.venueAddress.trim()
        ? body.venueAddress.trim().slice(0, 150)
        : "Oslo, Norway";
      const fallbackNeighborhood = typeof body.neighborhood === "string" && body.neighborhood.trim()
        ? body.neighborhood.trim().slice(0, 50)
        : "sentrum";

      const fallbackSlug = `${slugify(fallbackName) || "venue"}-${Date.now()
        .toString(36)
        .slice(-5)}`;
      const parsedLat = Number.isFinite(fallbackLat) ? fallbackLat : 59.9139;
      const parsedLng = Number.isFinite(fallbackLng) ? fallbackLng : 10.7522;
      const fallbackImage =
        coverImageUrl ||
        (isValidImageUrl(imageUrl) ? imageUrl : null) ||
        curatedVenuePhotos(category || "all", 1)[0];
      const openingHoursJson = openingHours ? { summary: openingHours } : {};
      const googleRatingRaw = Number(
        body.googleRating ?? body.proposedChanges?.googleRating
      );
      const googleReviewsRaw = Number(
        body.googleReviewsCount ?? body.proposedChanges?.googleReviewsCount
      );

      const { data: createdVenue, error: insertErr } = await supabase
        .from("venues")
        .insert({
          name: fallbackName,
          slug: fallbackSlug,
          address: fallbackAddress,
          neighborhood: fallbackNeighborhood,
          latitude: parsedLat,
          longitude: parsedLng,
          image_url: fallbackImage,
          price_level: typeof body.priceLevel === "string" ? body.priceLevel : "$$",
          open_now: typeof body.openNow === "boolean" ? body.openNow : true,
          google_place_id: googlePlaceId,
          google_rating: Number.isFinite(googleRatingRaw) ? googleRatingRaw : null,
          google_reviews_count: Number.isFinite(googleReviewsRaw) ? googleReviewsRaw : 0,
          google_maps_url:
            typeof body.googleMapsUrl === "string" ? body.googleMapsUrl : null,
          website_uri: typeof body.websiteUri === "string" ? body.websiteUri : null,
          phone_number: typeof body.phoneNumber === "string" ? body.phoneNumber : null,
          spot_type: spotType || "restaurant",
          current_opening_hours_text: openingHours || null,
          opening_hours: openingHoursJson,
          location_schedule: locationSchedule || null,
          category: category || "all",
          description: description || null,
          curated_reviews: Array.isArray(body.curatedReviews) ? body.curatedReviews : [],
          dietary_tags: Array.isArray(dietaryTags) ? dietaryTags : [],
          vibe_signals: {
            partner_verified: false,
            ...(popupMeta ? { popup_meta: popupMeta } : {}),
          },
        })
        .select(VENUE_FIELDS)
        .single();

      if (insertErr || !createdVenue) {
        console.error("Failed to register custom venue for partner claim:", insertErr);
        return NextResponse.json({ success: false, error: "Failed to register custom venue in Smakr directory." }, { status: 500 });
      }
      venue = createdVenue;
    }

    // 2. Fetch current top food post for this venue
    const { data: posts } = await supabase
      .from("food_posts")
      .select("id, dish_name, price_nok, dish_image, review_text, category, dietary_tags")
      .eq("venue_id", venueId)
      .limit(1);

    const livePost = posts && posts.length > 0 ? posts[0] : null;

    const liveSnapshot = {
      venue_id: venue.id,
      venue_name: venue.name,
      address: venue.address,
      cover_image_url: venue.image_url || null,
      opening_hours: venue.current_opening_hours_text || venue.opening_hours || null,
      description: venue.description || null,
      spot_type: venue.spot_type,
      location_schedule: venue.location_schedule,
      dish_name: livePost?.dish_name || venue.name,
      price_nok: livePost?.price_nok ?? null,
      dish_image_url: livePost?.dish_image || venue.image_url || null,
      taste_note: livePost?.review_text || "",
      category: livePost?.category || venue.category,
      dietary_tags: livePost?.dietary_tags || [],
    };

    const proposedPayload: Record<string, unknown> = {
      dish_name: dishName,
      price_nok: priceNok,
      image_url: imageUrl,
      taste_note: tasteNote,
      category,
      dietary_tags: dietaryTags,
      opening_hours: openingHours,
      location_schedule: locationSchedule,
      spot_type: spotType,
      description: description || undefined,
      cover_image_url: coverImageUrl || undefined,
      dishes: menuDishes || undefined,
      popup_meta: popupMeta || undefined,
      taste_tags: Array.isArray(proposedCard.tasteTags)
        ? proposedCard.tasteTags.slice(0, 6)
        : undefined,
      item_availability:
        typeof proposedCard.itemAvailability === "string"
          ? proposedCard.itemAvailability
          : undefined,
    };

    // 3. Insert into partner_claims table
    const { data: claimInsert, error: claimErr } = await supabase
      .from("partner_claims")
      .insert({
        venue_id: venue.id,
        status: "pending",
        applicant_name: name,
        applicant_role: role,
        applicant_email: email,
        applicant_phone: phone || null,
        applicant_instagram: instagram || null,
        org_number: orgNumber || null,
        proposed: proposedPayload,
        snapshot: liveSnapshot,
      })
      .select("id")
      .single();

    if (claimErr) {
      // Graceful fallback if table is not yet migrated
      if (claimErr.code === "42P01" || claimErr.message.includes("does not exist")) {
        const fallbackSignals = {
          ...((venue.vibe_signals || {}) as Record<string, unknown>),
          pending_partner_claim: {
            applicant: { name, role, email, phone, instagram, org_number: orgNumber },
            proposed: proposedPayload,
            snapshot: liveSnapshot,
            submitted_at: new Date().toISOString(),
          },
        };
        await supabase
          .from("venues")
          .update({ vibe_signals: fallbackSignals })
          .eq("id", venue.id);

        return NextResponse.json({
          success: true,
          claimId: `claim_fallback_${Date.now()}`,
          referenceCode: String(Date.now()).slice(-14).toUpperCase(),
          note: "Recorded via fallback pending table migration.",
        });
      }

      if (claimErr.code === "23505" || claimErr.message.includes("duplicate key")) {
        return NextResponse.json(
          {
            success: false,
            error: "You already have a pending claim for this restaurant. Our editorial team will review it shortly.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: false, error: claimErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claimId: claimInsert.id,
      referenceCode: String(claimInsert.id).replace(/-/g, "").slice(0, 14).toUpperCase(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Proposal error" },
      { status: 500 }
    );
  }
}
