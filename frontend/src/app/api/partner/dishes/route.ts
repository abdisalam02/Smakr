import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * GET /api/partner/dishes?venue_id=...
 * Fetch published dishes for a partner venue.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venue_id")?.trim();

  if (!venueId) {
    return NextResponse.json({ success: false, error: "Missing venue_id" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("food_posts")
      .select("id, dish_name, price_nok, dish_image, image_url, review_text, category, dietary_tags, taste_tags, is_official_pick, status")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      dishName: p.dish_name,
      priceNok: p.price_nok,
      imageUrl: p.dish_image || p.image_url || "",
      tasteNote: p.review_text || "",
      category: p.category,
      dietaryTags: p.dietary_tags || [],
      tasteTags: p.taste_tags || [],
      isOfficialPick: Boolean(p.is_official_pick),
    }));

    return NextResponse.json({ success: true, dishes: mapped });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/partner/dishes
 * Create a new dish for a venue.
 */
export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { venueId, dishName, priceNok, imageUrl, tasteNote, category, dietaryTags } = body;

    if (!venueId || !dishName || !dishName.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: venueId and dishName" },
        { status: 400 }
      );
    }

    // Verify venue
    const { data: venue, error: vErr } = await supabase
      .from("venues")
      .select("id, name, category, signature_dishes")
      .eq("id", venueId)
      .maybeSingle();

    if (vErr || !venue) {
      return NextResponse.json({ success: false, error: "Venue not found" }, { status: 404 });
    }

    const parsedPrice = priceNok != null && !Number.isNaN(Number(priceNok)) ? Number(priceNok) : null;
    const cleanDishName = dishName.trim();

    const insertPayload: Record<string, any> = {
      venue_id: venue.id,
      dish_name: cleanDishName,
      price_nok: parsedPrice,
      dish_image: imageUrl || null,
      review_text: tasteNote?.trim() || `Standout ${cleanDishName.toLowerCase()} prepared fresh at ${venue.name}.`,
      category: category || venue.category || "street_food",
      dietary_tags: Array.isArray(dietaryTags) ? dietaryTags : [],
      status: "published",
      is_curated: true,
      rating: 5,
    };

    const { data: newDish, error: postErr } = await supabase
      .from("food_posts")
      .insert(insertPayload)
      .select()
      .single();

    if (postErr) {
      return NextResponse.json({ success: false, error: postErr.message }, { status: 500 });
    }

    // Append to signature_dishes if not present
    const existingDishes: string[] = Array.isArray(venue.signature_dishes) ? venue.signature_dishes : [];
    if (!existingDishes.includes(cleanDishName)) {
      await supabase
        .from("venues")
        .update({ signature_dishes: [...existingDishes, cleanDishName] })
        .eq("id", venue.id);
    }

    return NextResponse.json({
      success: true,
      dish: {
        id: newDish.id,
        dishName: newDish.dish_name,
        priceNok: newDish.price_nok,
        imageUrl: newDish.dish_image || "",
        tasteNote: newDish.review_text || "",
        category: newDish.category,
        dietaryTags: newDish.dietary_tags || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/partner/dishes
 * Update an existing dish.
 */
export async function PATCH(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, dishName, priceNok, imageUrl, tasteNote, category, dietaryTags } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing dish id" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dishName !== undefined && dishName.trim()) {
      updates.dish_name = dishName.trim();
    }
    if (priceNok !== undefined) {
      updates.price_nok = priceNok != null && !Number.isNaN(Number(priceNok)) ? Number(priceNok) : null;
    }
    if (imageUrl !== undefined) {
      updates.dish_image = imageUrl;
    }
    if (tasteNote !== undefined) {
      updates.review_text = tasteNote.trim();
    }
    if (category !== undefined) {
      updates.category = category;
    }
    if (dietaryTags !== undefined && Array.isArray(dietaryTags)) {
      updates.dietary_tags = dietaryTags;
    }

    const { data: updatedDish, error } = await supabase
      .from("food_posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dish: {
        id: updatedDish.id,
        dishName: updatedDish.dish_name,
        priceNok: updatedDish.price_nok,
        imageUrl: updatedDish.dish_image || "",
        tasteNote: updatedDish.review_text || "",
        category: updatedDish.category,
        dietaryTags: updatedDish.dietary_tags || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
