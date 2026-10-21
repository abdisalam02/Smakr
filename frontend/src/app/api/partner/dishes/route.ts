import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DISH_FIELDS =
  "id,venue_id,author_id,dish_name,dish_image,price_nok,review_text,rating," +
  "category,dietary_tags,taste_tags,item_availability,is_official_pick," +
  "is_published,is_archived,created_at,updated_at";

const AVAILABILITY = [
  "Available Now",
  "Sold Out Today",
  "Fresh From Oven",
  "Weekend Only",
] as const;

const rateMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateMap.get(ip);
  if (current && current.expiresAt > now) {
    if (current.count >= 30) return false;
    current.count++;
    return true;
  }
  rateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
  return true;
}

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function timingSafeTokenMatch(provided: string, actual: string): boolean {
  if (!provided || !actual || provided.length !== actual.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(actual));
}

async function authorizeVenue(
  supabase: SupabaseClient,
  venueId: string,
  token: string
): Promise<boolean> {
  if (!token) return false;
  const { data } = await supabase
    .from("venue_kitchen_tokens")
    .select("kitchen_token")
    .eq("venue_id", venueId)
    .maybeSingle();
  return Boolean(data?.kitchen_token && timingSafeTokenMatch(token, data.kitchen_token));
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/places/photos")) return true;
  if (!url.startsWith("https://")) return false;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return (
      (hostname.includes("supabase.co") &&
        parsed.pathname.includes("/storage/v1/object/public/dish-photos")) ||
      hostname.includes("places.googleapis.com") ||
      hostname.includes("googleusercontent.com") ||
      hostname.includes("unsplash.com")
    );
  } catch {
    return false;
  }
}

function normalizeDish(body: any) {
  const dishName = String(body.dishName ?? body.dish_name ?? "").trim().slice(0, 80);
  const dishImage = String(body.imageUrl ?? body.dishImage ?? body.dish_image ?? "").trim();
  const reviewText = String(body.tasteNote ?? body.reviewText ?? body.review_text ?? "")
    .trim()
    .slice(0, 240);
  const rawPrice = body.priceNok ?? body.price_nok;
  const parsedPrice =
    rawPrice === "" || rawPrice === null || rawPrice === undefined
      ? null
      : parseInt(String(rawPrice), 10);
  const priceNok =
    parsedPrice && parsedPrice >= 1 ? Math.min(parsedPrice, 2000) : null;
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim().slice(0, 40)
      : null;
  const dietaryTags = Array.isArray(body.dietaryTags)
    ? body.dietaryTags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];
  const tasteTags = Array.isArray(body.tasteTags)
    ? body.tasteTags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];
  const rawAvailability = body.itemAvailability ?? body.item_availability;
  const itemAvailability = (AVAILABILITY as readonly string[]).includes(rawAvailability)
    ? (rawAvailability as (typeof AVAILABILITY)[number])
    : null;

  return {
    dishName,
    dishImage,
    reviewText,
    priceNok,
    category,
    dietaryTags,
    tasteTags,
    itemAvailability,
  };
}

async function resolveAuthorId(
  supabase: SupabaseClient,
  venueId: string
): Promise<string | null> {
  // food_posts.author_id is NOT NULL. Reuse the venue's existing author, then
  // fall back to the editorial admin profile.
  const { data: existing } = await supabase
    .from("food_posts")
    .select("author_id")
    .eq("venue_id", venueId)
    .not("author_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (existing?.author_id) return existing.author_id as string;

  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  return (admin?.id as string) ?? null;
}

function mapDish(row: any) {
  return {
    id: row.id,
    dishName: row.dish_name,
    priceNok: row.price_nok,
    imageUrl: row.dish_image || "",
    tasteNote: row.review_text || "",
    category: row.category,
    dietaryTags: row.dietary_tags || [],
    tasteTags: row.taste_tags || [],
    itemAvailability: row.item_availability,
    isOfficialPick: Boolean(row.is_official_pick),
    isPublished: row.is_published !== false,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/partner/dishes?venue_id=...
 * Public menu read: published, non-archived dishes only.
 */
export async function GET(req: NextRequest) {
  const venueId = (new URL(req.url).searchParams.get("venue_id") || "").trim();
  if (!UUID_RE.test(venueId)) {
    return NextResponse.json({ success: false, error: "Invalid venue_id" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("food_posts")
    .select(DISH_FIELDS)
    .eq("venue_id", venueId)
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dishes: (data ?? []).map(mapDish),
  });
}

/**
 * POST /api/partner/dishes
 * Create a dish. Requires the venue's Kitchen Remote token.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: "Too many dish updates." }, { status: 429 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const venueId = String(body.venueId ?? body.venue_id ?? "").trim();
    const token = String(body.kitchenToken ?? body.token ?? "").trim();

    if (!UUID_RE.test(venueId) || !token) {
      return NextResponse.json(
        { success: false, error: "Missing venueId or kitchenToken." },
        { status: 403 }
      );
    }
    if (!(await authorizeVenue(supabase, venueId, token))) {
      return NextResponse.json({ success: false, error: "Invalid kitchen token." }, { status: 403 });
    }

    const dish = normalizeDish(body);
    if (!dish.dishName) {
      return NextResponse.json({ success: false, error: "Dish name is required." }, { status: 400 });
    }
    if (!dish.dishImage || !isValidImageUrl(dish.dishImage)) {
      return NextResponse.json(
        { success: false, error: "A valid dish photo is required." },
        { status: 400 }
      );
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id,name,category,signature_dishes")
      .eq("id", venueId)
      .maybeSingle();
    if (venueError || !venue) {
      return NextResponse.json({ success: false, error: "Venue not found." }, { status: 404 });
    }

    const authorId = await resolveAuthorId(supabase, venueId);
    if (!authorId) {
      return NextResponse.json(
        { success: false, error: "No author profile available for this venue." },
        { status: 500 }
      );
    }

    const category = dish.category || venue.category || "all";
    const dietaryTags = [...dish.dietaryTags];
    if (category && !dietaryTags.includes(`cat_${category}`)) {
      dietaryTags.push(`cat_${category}`);
    }

    const { data, error } = await supabase
      .from("food_posts")
      .insert({
        venue_id: venueId,
        author_id: authorId,
        dish_name: dish.dishName,
        dish_image: dish.dishImage,
        review_text: dish.reviewText,
        price_nok: dish.priceNok,
        rating: 0,
        category,
        dietary_tags: dietaryTags,
        taste_tags: dish.tasteTags,
        item_availability: dish.itemAvailability,
        is_official_pick: false,
        is_published: true,
        is_archived: false,
        likes_count: 0,
        saves_count: 0,
        craving_count: 0,
        must_try_count: 0,
        tried_count: 0,
        diner_quotes: [],
      })
      .select(DISH_FIELDS)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || "Insert failed." }, { status: 500 });
    }

    const existingSignatures: string[] = Array.isArray(venue.signature_dishes)
      ? venue.signature_dishes
      : [];
    if (!existingSignatures.includes(dish.dishName)) {
      await supabase
        .from("venues")
        .update({ signature_dishes: [...existingSignatures, dish.dishName] })
        .eq("id", venueId);
    }

    return NextResponse.json({ success: true, dish: mapDish(data) });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Insert failed." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partner/dishes
 * Update one dish belonging to the token's venue.
 */
export async function PATCH(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: "Too many dish updates." }, { status: 429 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const venueId = String(body.venueId ?? body.venue_id ?? "").trim();
    const token = String(body.kitchenToken ?? body.token ?? "").trim();
    const dishId = String(body.dishId ?? body.id ?? "").trim();

    if (!UUID_RE.test(venueId) || !UUID_RE.test(dishId) || !token) {
      return NextResponse.json(
        { success: false, error: "Missing venueId, dishId or kitchenToken." },
        { status: 400 }
      );
    }
    if (!(await authorizeVenue(supabase, venueId, token))) {
      return NextResponse.json({ success: false, error: "Invalid kitchen token." }, { status: 403 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("food_posts")
      .select(DISH_FIELDS)
      .eq("id", dishId)
      .eq("venue_id", venueId)
      .maybeSingle();
    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, error: "Dish not found for this venue." },
        { status: 404 }
      );
    }

    const dish = normalizeDish(body);
    const patch: Record<string, unknown> = {};

    if (body.dishName !== undefined || body.dish_name !== undefined) {
      if (!dish.dishName) {
        return NextResponse.json({ success: false, error: "Dish name cannot be empty." }, { status: 400 });
      }
      patch.dish_name = dish.dishName;
    }
    if (
      body.imageUrl !== undefined ||
      body.dishImage !== undefined ||
      body.dish_image !== undefined
    ) {
      if (!dish.dishImage || !isValidImageUrl(dish.dishImage)) {
        return NextResponse.json({ success: false, error: "Invalid dish photo." }, { status: 400 });
      }
      patch.dish_image = dish.dishImage;
    }
    if (
      body.tasteNote !== undefined ||
      body.reviewText !== undefined ||
      body.review_text !== undefined
    ) {
      patch.review_text = dish.reviewText;
    }
    if (body.priceNok !== undefined || body.price_nok !== undefined) {
      patch.price_nok = dish.priceNok;
    }
    if (body.category !== undefined) {
      patch.category = dish.category;
    }
    if (body.dietaryTags !== undefined) {
      patch.dietary_tags = dish.dietaryTags;
    }
    if (body.tasteTags !== undefined) {
      patch.taste_tags = dish.tasteTags;
    }
    if (body.itemAvailability !== undefined || body.item_availability !== undefined) {
      patch.item_availability = dish.itemAvailability;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("food_posts")
      .update(patch)
      .eq("id", dishId)
      .eq("venue_id", venueId)
      .select(DISH_FIELDS)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || "Update failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, dish: mapDish(data) });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed." },
      { status: 500 }
    );
  }
}
