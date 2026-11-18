import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_auth";
import { curatedDishPhotos } from "@/lib/places/curatedPhotos";

export const dynamic = "force-dynamic";

/**
 * Complementary dish-image search.
 *
 * GET /api/places/dish?q=Spicy+Miso+Ramen&count=6
 *
 * Admin-only: used by the admin photo picker (`VenueImporter`) to offer curated
 * category-matched dish images.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const count = Math.min(12, Math.max(1, Number.parseInt(searchParams.get("count") || "6", 10) || 6));

  if (!q) {
    return NextResponse.json({ images: [] });
  }

  return NextResponse.json({ query: q, images: curatedDishPhotos(q, count) });
}
