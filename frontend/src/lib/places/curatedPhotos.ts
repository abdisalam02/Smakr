import {
  CULINARY_PHOTO_LIBRARY as C,
  getCulinaryImageForDish,
} from "@/lib/culinaryImages";

/**
 * Curated high-resolution photography used whenever Google Places is not
 * configured (or a photo request fails), so the importer UI is always fully
 * functional during the beta.
 */

const GENERIC_FOOD: string[] = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1428515613728-6b4607e44363?auto=format&fit=crop&w=1200&q=80",
];

export const VENUE_PHOTO_POOL: Record<string, string[]> = {
  ramen: [C.spicy_tonkotsu_ramen, C.shoyu_ramen_chashu, C.katsu_sando],
  coffee: [C.vietnamese_coconut_coffee, C.artisan_latte_art, C.pour_over_chemex],
  bakery: [C.cardamom_knot_bun, C.sourdough_loaf, C.croissant_pain_au_chocolat],
  burger: [C.truffle_smash_burger, C.classic_double_cheeseburger, C.truffle_loaded_fries],
  pizza: [C.woodfired_margherita_pizza, C.nduja_sourdough_pizza, C.smoked_pastrami_focaccia],
  sushi: [C.fresh_salmon_nigiri_sushi, C.crispy_fish_chips, C.katsu_sando],
  dessert: [C.artisan_pistachio_gelato, C.donuts_gourmet, C.norwegian_brown_cheese_waffle],
  street_food: [C.crispy_pork_sandwich, C.street_tacos_carnitas, C.banh_mi_thit_nuong],
  drinks: [C.vietnamese_coconut_coffee, C.artisan_latte_art, C.pour_over_chemex],
  all: [C.spicy_tonkotsu_ramen, C.cardamom_knot_bun, C.crispy_pork_sandwich, C.truffle_smash_burger],
};

/** Deterministic 32-bit hash so photo picks are stable per reference. */
export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** A stable, type-matched list of curated venue photos (min. `count`). */
export function curatedVenuePhotos(category?: string | null, count = 8): string[] {
  const key = (category || "all").toLowerCase();
  const specific = VENUE_PHOTO_POOL[key] ?? VENUE_PHOTO_POOL.all;
  const out = [...specific];
  for (const url of GENERIC_FOOD) {
    if (out.length >= count) break;
    if (!out.includes(url)) out.push(url);
  }
  return out.slice(0, count);
}

/** Resolve one curated photo for a (ref, category, index) triple. */
export function curatedPhotoFor(ref: string, category: string | null, index: number): string {
  const pool = curatedVenuePhotos(category, 10);
  const offset = (hashString(ref || "x") + index) % pool.length;
  return pool[offset] ?? pool[0];
}

/** Curated dish images for the "search complementary dish images" input. */
export function curatedDishPhotos(query: string, count = 6): string[] {
  const q = query.trim();
  if (!q) return [];
  const primary = getCulinaryImageForDish(q);
  const related = Object.values(C).filter((url) => url !== primary);
  const start = hashString(q) % related.length;
  const rotated = [...related.slice(start), ...related.slice(0, start)];
  return [primary, ...rotated].slice(0, Math.max(1, count));
}
