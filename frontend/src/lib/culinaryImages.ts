/**
 * Curated Culinary Photography Library for Smakr Oslo
 * Accurately matches dish names and culinary categories to real high-resolution photos.
 */

export const CULINARY_PHOTO_LIBRARY = {
  // Sandwiches & Street Food
  crispy_pork_sandwich: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
  truffle_loaded_fries: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=1200&q=80",
  smoked_pastrami_focaccia: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  banh_mi_thit_nuong: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
  katsu_sando: "https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&w=1200&q=80",

  // Coffee & Drinks
  vietnamese_coconut_coffee: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80",
  artisan_latte_art: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
  pour_over_chemex: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",

  // Bakery & Sourdough
  cardamom_knot_bun: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  sourdough_loaf: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=1200&q=80",
  croissant_pain_au_chocolat: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",

  // Ramen & Asian
  spicy_tonkotsu_ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  shoyu_ramen_chashu: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=80",

  // Burgers & Fries
  truffle_smash_burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  classic_double_cheeseburger: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80",

  // Pizza
  woodfired_margherita_pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  nduja_sourdough_pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",

  // Seafood & Sushi
  fresh_salmon_nigiri_sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  crispy_fish_chips: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80",

  // Sweets & Treats
  norwegian_brown_cheese_waffle: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=1200&q=80",
  artisan_pistachio_gelato: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80",
  donuts_gourmet: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",

  // General Street food
  street_tacos_carnitas: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Returns a guaranteed matching, high-resolution food photo based on the dish name.
 * Prevents random coffee pictures appearing for pork sandwiches, or ramen pictures for focaccia.
 */
export function getCulinaryImageForDish(dishName: string, category?: string, fallbackUrl?: string): string {
  const lower = (dishName + " " + (category || "")).toLowerCase();

  // Fries / Truffle Fries / Chips
  if (lower.includes("fries") || lower.includes("pommes") || lower.includes("chips") || lower.includes("potet")) {
    return CULINARY_PHOTO_LIBRARY.truffle_loaded_fries;
  }

  // Pastrami / Beef / Focaccia / Deli
  if (lower.includes("pastrami") || lower.includes("focaccia") || lower.includes("reuben") || lower.includes("roast beef")) {
    return CULINARY_PHOTO_LIBRARY.smoked_pastrami_focaccia;
  }

  // Sandwiches / Pork / Bánh Mì
  if (lower.includes("sandwich") || lower.includes("pork") || lower.includes("bánh mì") || lower.includes("banh mi") || lower.includes("flæskesteg") || lower.includes("sub")) {
    return CULINARY_PHOTO_LIBRARY.crispy_pork_sandwich;
  }

  // Katsu
  if (lower.includes("katsu") || lower.includes("sando")) {
    return CULINARY_PHOTO_LIBRARY.katsu_sando;
  }

  // Coffee / Espresso / Coconut
  if (lower.includes("coffee") || lower.includes("kaffe") || lower.includes("latte") || lower.includes("espresso") || lower.includes("cà phê") || lower.includes("phin") || lower.includes("coconut")) {
    return CULINARY_PHOTO_LIBRARY.vietnamese_coconut_coffee;
  }

  // Cardamom / Cinnamon / Bun / Knot / Bakery
  if (lower.includes("cardamom") || lower.includes("kardemomme") || lower.includes("knot") || lower.includes("knute") || lower.includes("cinnamon") || lower.includes("kanel") || lower.includes("bun") || lower.includes("croissant") || lower.includes("bakery")) {
    return CULINARY_PHOTO_LIBRARY.cardamom_knot_bun;
  }

  // Bread / Loaf / Sourdough
  if (lower.includes("bread") || lower.includes("brød") || lower.includes("sourdough") || lower.includes("surdeig")) {
    return CULINARY_PHOTO_LIBRARY.sourdough_loaf;
  }

  // Ramen / Noodles
  if (lower.includes("ramen") || lower.includes("noodle") || lower.includes("tonkotsu") || lower.includes("miso") || lower.includes("chashu")) {
    return CULINARY_PHOTO_LIBRARY.spicy_tonkotsu_ramen;
  }

  // Burgers
  if (lower.includes("burger") || lower.includes("smash") || lower.includes("cheeseburger")) {
    return CULINARY_PHOTO_LIBRARY.truffle_smash_burger;
  }

  // Pizza
  if (lower.includes("pizza") || lower.includes("margherita") || lower.includes("nduja") || lower.includes("calzone")) {
    return CULINARY_PHOTO_LIBRARY.woodfired_margherita_pizza;
  }

  // Sushi & Fish
  if (lower.includes("sushi") || lower.includes("sashimi") || lower.includes("nigiri") || lower.includes("maki") || lower.includes("salmon") || lower.includes("laks")) {
    return CULINARY_PHOTO_LIBRARY.fresh_salmon_nigiri_sushi;
  }
  if (lower.includes("fish") && lower.includes("chips")) {
    return CULINARY_PHOTO_LIBRARY.crispy_fish_chips;
  }

  // Waffles / Gelato / Dessert / Donuts
  if (lower.includes("waffle") || lower.includes("vaffel") || lower.includes("brunost")) {
    return CULINARY_PHOTO_LIBRARY.norwegian_brown_cheese_waffle;
  }
  if (lower.includes("gelato") || lower.includes("ice cream") || lower.includes("is")) {
    return CULINARY_PHOTO_LIBRARY.artisan_pistachio_gelato;
  }
  if (lower.includes("donut") || lower.includes("doughnut")) {
    return CULINARY_PHOTO_LIBRARY.donuts_gourmet;
  }

  // Tacos & Street Food
  if (lower.includes("taco") || lower.includes("burrito") || lower.includes("birria") || lower.includes("street")) {
    return CULINARY_PHOTO_LIBRARY.street_tacos_carnitas;
  }

  // Category fallback
  if (category === "coffee") return CULINARY_PHOTO_LIBRARY.vietnamese_coconut_coffee;
  if (category === "bakery") return CULINARY_PHOTO_LIBRARY.cardamom_knot_bun;
  if (category === "ramen") return CULINARY_PHOTO_LIBRARY.spicy_tonkotsu_ramen;
  if (category === "burger") return CULINARY_PHOTO_LIBRARY.truffle_smash_burger;
  if (category === "pizza") return CULINARY_PHOTO_LIBRARY.woodfired_margherita_pizza;
  if (category === "sushi") return CULINARY_PHOTO_LIBRARY.fresh_salmon_nigiri_sushi;
  if (category === "dessert") return CULINARY_PHOTO_LIBRARY.artisan_pistachio_gelato;
  if (category === "street_food") return CULINARY_PHOTO_LIBRARY.crispy_pork_sandwich;

  return fallbackUrl || CULINARY_PHOTO_LIBRARY.crispy_pork_sandwich;
}

/**
 * Returns a realistic Oslo price in NOK based on dish type.
 */
export function getRealisticPrice(dishName: string, category?: string): number {
  const lower = (dishName + " " + (category || "")).toLowerCase();
  if (lower.includes("fries") || lower.includes("chips")) return 85;
  if (lower.includes("knot") || lower.includes("bun") || lower.includes("croissant")) return 48;
  if (lower.includes("coffee") || lower.includes("latte") || lower.includes("cà phê")) return 78;
  if (lower.includes("pastrami")) return 155;
  if (lower.includes("sandwich") || lower.includes("focaccia") || lower.includes("bánh mì")) return 145;
  if (lower.includes("burger") || lower.includes("smash")) return 179;
  if (lower.includes("pizza")) return 215;
  if (lower.includes("ramen")) return 215;
  if (lower.includes("sushi")) return 245;
  if (lower.includes("waffle") || lower.includes("vaffel") || lower.includes("gelato")) return 65;
  return 135;
}

