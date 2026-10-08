import { NextResponse } from "next/server";
import { curatedDishPhotos } from "@/lib/places/curatedPhotos";

export const dynamic = "force-dynamic";

/**
 * Complementary dish-image search.
 *
 * GET /api/places/dish?q=Spicy+Miso+Ramen&count=6
 *
 * Returns category-matched curated dish photography so the admin photo picker
 * can offer dish images even when a venue listing has no suitable dish shot.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const count = Math.min(12, Math.max(1, Number.parseInt(searchParams.get("count") || "6", 10) || 6));

  if (!q) {
    return NextResponse.json({ images: [] });
  }

  return NextResponse.json({ query: q, images: curatedDishPhotos(q, count) });
}
