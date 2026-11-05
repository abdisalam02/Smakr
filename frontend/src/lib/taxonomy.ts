/**
 * Smakr Gastronomy Taxonomy (Oslo Food Radar)
 *
 * 4 Orthogonal Axes:
 * 1. SpotKind: What kind of venue is this? (restaurant, cafe, bakery, bar, food_truck, popup, street_stall, food_hall, dessert_shop)
 * 2. FoodGroup & DishCategory: What is the food? (13 parent groups, deterministic 1:1 child categories)
 * 3. Cuisine: Where is the culinary style from? (12 starter regional styles, flag-free glyphs)
 * 4. Diet: Who can eat it? (halal, vegan, vegetarian, gluten_free, spicy)
 */

import type { Venue, FoodPost, DietaryTag } from "@/types";

export type SpotKind =
  | "restaurant"
  | "cafe"
  | "bakery"
  | "bar"
  | "food_truck"
  | "popup"
  | "street_stall"
  | "food_hall"
  | "dessert_shop";

export interface SpotKindDef {
  id: SpotKind;
  label: string;
  shortLabel: string;
  description: string;
}

export const SPOT_KINDS: readonly SpotKindDef[] = [
  { id: "restaurant", label: "Restaurant", shortLabel: "Sit-down", description: "Sit-down dining & eatery" },
  { id: "cafe", label: "Coffee Bar", shortLabel: "Cafe", description: "Specialty coffee & cafe" },
  { id: "bakery", label: "Bakery", shortLabel: "Bakery", description: "Bakeries & pastry shops" },
  { id: "bar", label: "Bar & Wine", shortLabel: "Bar", description: "Wine bars, craft cocktails & pubs" },
  { id: "food_truck", label: "Food Truck", shortLabel: "Food Truck", description: "Mobile kitchen & trucks" },
  { id: "popup", label: "Pop-up", shortLabel: "Pop-up", description: "Guest residencies & temporary drops" },
  { id: "street_stall", label: "Restaurant", shortLabel: "Restaurant", description: "Sit-down dining & eatery" },
  { id: "food_hall", label: "Food Hall", shortLabel: "Food Hall", description: "Indoor market & multi-kitchen hall" },
  { id: "dessert_shop", label: "Gelato & Sweets", shortLabel: "Dessert", description: "Artisan gelato, soft-serve & desserts" },
] as const;

export type FoodGroupId =
  | "pastries_bakery"
  | "breads"
  | "coffee_tea"
  | "noodles_soup"
  | "sandwiches_handhelds"
  | "pizza_pasta"
  | "chicken_grill"
  | "rice_bowls"
  | "dumplings_buns"
  | "seafood"
  | "sweets_frozen"
  | "drinks_bars"
  | "brunch";

export interface FoodGroupDef {
  id: FoodGroupId;
  label: string;
  shortLabel: string;
  heroIcon: string;
  childCategories: readonly string[];
}

export const FOOD_GROUPS: readonly FoodGroupDef[] = [
  {
    id: "pastries_bakery",
    label: "Pastries & Bakery",
    shortLabel: "Pastries",
    heroIcon: "croissant",
    childCategories: ["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough_loaf"],
  },
  {
    id: "breads",
    label: "Breads & Flatbreads",
    shortLabel: "Breads",
    heroIcon: "naan",
    childCategories: ["naan", "flatbread", "sourdough"],
  },
  {
    id: "coffee_tea",
    label: "Coffee & Tea",
    shortLabel: "Coffee",
    heroIcon: "coffee",
    childCategories: ["coffee", "specialty_coffee", "iced_coffee", "matcha", "boba"],
  },
  {
    id: "noodles_soup",
    label: "Noodles & Soup",
    shortLabel: "Noodles",
    heroIcon: "ramen",
    childCategories: ["ramen", "pho", "udon", "noodle_soup"],
  },
  {
    id: "sandwiches_handhelds",
    label: "Sandwiches & Handhelds",
    shortLabel: "Sandwiches",
    heroIcon: "banh_mi",
    childCategories: ["banh_mi", "burger", "tacos", "kebab_wrap", "street_sandwich", "street_food"],
  },
  {
    id: "pizza_pasta",
    label: "Pizza & Pasta",
    shortLabel: "Pizza & Pasta",
    heroIcon: "pizza",
    childCategories: ["pizza", "pasta"],
  },
  {
    id: "chicken_grill",
    label: "Chicken & Grill",
    shortLabel: "Grill",
    heroIcon: "k_chicken",
    childCategories: ["k_chicken", "fried_chicken", "kbbq", "kebab", "shawarma"],
  },
  {
    id: "rice_bowls",
    label: "Rice & Bowls",
    shortLabel: "Rice",
    heroIcon: "indian",
    childCategories: ["mandi_rice", "curry", "indian", "bibimbap", "poke"],
  },
  {
    id: "dumplings_buns",
    label: "Dumplings & Buns",
    shortLabel: "Dumplings",
    heroIcon: "dumplings",
    childCategories: ["dumplings", "bao"],
  },
  {
    id: "seafood",
    label: "Seafood & Raw Bar",
    shortLabel: "Seafood",
    heroIcon: "sushi",
    childCategories: ["sushi", "nordic_seafood"],
  },
  {
    id: "sweets_frozen",
    label: "Sweets & Frozen",
    shortLabel: "Sweets",
    heroIcon: "gelato",
    childCategories: ["gelato", "dessert"],
  },
  {
    id: "drinks_bars",
    label: "Drinks & Wine",
    shortLabel: "Drinks",
    heroIcon: "natural_wine",
    childCategories: ["drinks", "natural_wine", "cocktail"],
  },
  {
    id: "brunch",
    label: "Brunch & Toast",
    shortLabel: "Brunch",
    heroIcon: "brunch",
    childCategories: ["brunch", "avocado_toast", "eggs"],
  },
] as const;

export type CuisineId =
  | "vietnamese"
  | "korean"
  | "japanese"
  | "chinese"
  | "indian_pakistani"
  | "middle_eastern"
  | "yemeni_somali"
  | "italian"
  | "mexican"
  | "nordic"
  | "french"
  | "american";

export interface CuisineDef {
  id: CuisineId;
  label: string;
  glyph: string;
}

export const CUISINES: readonly CuisineDef[] = [
  { id: "vietnamese", label: "Vietnamese", glyph: "cuisine_vietnamese" },
  { id: "korean", label: "Korean", glyph: "cuisine_korean" },
  { id: "japanese", label: "Japanese", glyph: "cuisine_japanese" },
  { id: "chinese", label: "Chinese", glyph: "cuisine_chinese" },
  { id: "indian_pakistani", label: "Indian & Pakistani", glyph: "cuisine_indian" },
  { id: "middle_eastern", label: "Middle Eastern", glyph: "cuisine_middle_eastern" },
  { id: "yemeni_somali", label: "Yemeni & Somali", glyph: "cuisine_yemeni" },
  { id: "italian", label: "Italian", glyph: "cuisine_italian" },
  { id: "mexican", label: "Mexican", glyph: "cuisine_mexican" },
  { id: "nordic", label: "Nordic", glyph: "cuisine_nordic" },
  { id: "french", label: "French", glyph: "cuisine_french" },
  { id: "american", label: "American", glyph: "cuisine_american" },
] as const;

/** Child category -> Parent FoodGroup mapping */
const CATEGORY_TO_GROUP: Record<string, FoodGroupId> = {};
for (const group of FOOD_GROUPS) {
  for (const child of group.childCategories) {
    CATEGORY_TO_GROUP[child] = group.id;
  }
}

export function getParentFoodGroup(categoryOrKey?: string | null): FoodGroupDef | null {
  if (!categoryOrKey) return null;
  const normalized = categoryOrKey.toLowerCase().trim();
  const directGroupId = CATEGORY_TO_GROUP[normalized];
  if (directGroupId) {
    return FOOD_GROUPS.find((g) => g.id === directGroupId) || null;
  }
  const matchingGroup = FOOD_GROUPS.find((g) => g.id === normalized);
  return matchingGroup || null;
}

export interface ResolvedTaxonomy {
  spotKind: SpotKind;
  spotLabel: string;
  group: FoodGroupDef;
  dishCategory: string;
  dishLabel: string;
  cuisines: CuisineId[];
  diets: DietaryTag[];
}

/**
 * Deterministic 4-Axis Taxonomy Resolver.
 * Maps venue and/or post data to orthogonal spot kind, parent group, dish category, cuisines, and diets.
 */
export function resolveEntityTaxonomy(
  venue?: Partial<Venue> | null,
  post?: Partial<FoodPost> | null
): ResolvedTaxonomy {
  const v = venue || {};
  const p = post || {};

  // 1. Resolve SpotKind
  let spotKind: SpotKind = "restaurant";
  const rawSpotType = String(v.spot_type || "").toLowerCase();

  if (rawSpotType === "popup" || rawSpotType === "pop_up") {
    spotKind = "popup";
  } else if (rawSpotType === "food_truck") {
    spotKind = "food_truck";
  } else if (v.place_type === "cafe" && (v.food_category === "coffee" || v.food_category === "bakery")) {
    spotKind = v.food_category === "bakery" ? "bakery" : "cafe";
  } else if (v.food_category === "bakery" || v.food_category === "cinnamon_roll" || v.icon === "croissant") {
    spotKind = "bakery";
  } else if (v.food_category === "coffee" || v.icon === "coffee") {
    spotKind = "cafe";
  } else if (v.food_category === "drinks" || v.food_category === "natural_wine" || v.icon === "drinks") {
    spotKind = "bar";
  } else if (v.food_category === "gelato" || v.icon === "gelato") {
    spotKind = "dessert_shop";
  } else if (v.food_category === "street_food") {
    spotKind = "restaurant";
  } else {
    // Text inspection fallback on venue name
    const nameLower = (v.name || "").toLowerCase();
    if (nameLower.includes("bakeri") || nameLower.includes("bakery") || nameLower.includes("boulangerie")) {
      spotKind = "bakery";
    } else if (nameLower.includes("kaffe") || nameLower.includes("coffee") || nameLower.includes("espresso") || nameLower.includes("roaster")) {
      spotKind = "cafe";
    } else if (nameLower.includes("bar") || nameLower.includes("vin") || nameLower.includes("wine")) {
      spotKind = "bar";
    } else if (nameLower.includes("truck") || nameLower.includes("vogn")) {
      spotKind = "food_truck";
    } else if (nameLower.includes("gelato") || nameLower.includes("isbar") || nameLower.includes("ice cream")) {
      spotKind = "dessert_shop";
    }
  }

  const spotDef = SPOT_KINDS.find((s) => s.id === spotKind) || SPOT_KINDS[0];

  // 2. Resolve Dish Category & Food Group
  let dishCategory = "food";
  const postCat = p.category ? String(p.category).toLowerCase().trim() : "";
  const venueCat = v.food_category ? String(v.food_category).toLowerCase().trim() : "";
  const venueIcon = v.icon ? String(v.icon).toLowerCase().trim() : "";

  // Prioritize post category if available, then venue category or venue icon
  const candidateCat = postCat || venueCat || venueIcon;

  // Decouple Pho from Banh Mi: check textual clues in post title or venue signature dishes
  const allText = `${v.name || ""} ${p.dish_name || ""} ${(v.signature_dishes || []).join(" ")}`.toLowerCase();

  // Em Oi and Vietnamese noodle eateries resolve to Noodles (noodles_soup)
  if (
    allText.includes("em oi") ||
    allText.includes("êm ôi") ||
    allText.includes("pho") ||
    allText.includes("phở") ||
    allText.includes("noodle") ||
    allText.includes("udon") ||
    candidateCat === "pho" ||
    (candidateCat === "vietnamese" && !allText.includes("banh mi") && !allText.includes("bánh mì"))
  ) {
    dishCategory = "pho";
  } else if (candidateCat === "ramen" || allText.includes("ramen")) {
    dishCategory = "ramen";
  } else if (candidateCat === "banh_mi" || candidateCat === "vietnamese" || allText.includes("banh mi") || allText.includes("bánh mì")) {
    dishCategory = "banh_mi";
  } else if (candidateCat === "pizza" || allText.includes("pizza") || allText.includes("margherita")) {
    dishCategory = "pizza";
  } else if (candidateCat === "pasta" || allText.includes("pasta") || allText.includes("carbonara")) {
    dishCategory = "pasta";
  } else if (candidateCat === "k_chicken" || candidateCat === "fried_chicken" || allText.includes("k-chicken") || allText.includes("yangnyeom")) {
    dishCategory = "k_chicken";
  } else if (candidateCat === "naan" || candidateCat === "flatbread" || allText.includes("naan") || allText.includes("garlic naan")) {
    dishCategory = "naan";
  } else if (candidateCat === "croissant" || (candidateCat === "bakery" && allText.includes("croissant"))) {
    dishCategory = "croissant";
  } else if (candidateCat === "cinnamon_roll" || candidateCat === "kanelbolle" || allText.includes("kanelbolle") || allText.includes("cinnamon")) {
    dishCategory = "kanelbolle";
  } else if (candidateCat === "coffee" || allText.includes("kaffe") || allText.includes("latte") || allText.includes("cappuccino")) {
    dishCategory = "coffee";
  } else if (candidateCat === "matcha" || allText.includes("matcha")) {
    dishCategory = "matcha";
  } else if (candidateCat === "tacos" || allText.includes("taco") || allText.includes("birria")) {
    dishCategory = "tacos";
  } else if (candidateCat === "burger" || allText.includes("burger") || allText.includes("smash")) {
    dishCategory = "burger";
  } else if (candidateCat === "dumplings" || allText.includes("dumpling") || allText.includes("gyoza") || allText.includes("dim sum")) {
    dishCategory = "dumplings";
  } else if (candidateCat === "bao" || allText.includes("bao")) {
    dishCategory = "bao";
  } else if (candidateCat === "sushi" || allText.includes("sushi") || allText.includes("sashimi")) {
    dishCategory = "sushi";
  } else if (candidateCat === "gelato" || allText.includes("gelato")) {
    dishCategory = "gelato";
  } else if (candidateCat === "mandi_rice" || allText.includes("mandi")) {
    dishCategory = "mandi_rice";
  } else if (candidateCat === "indian" || allText.includes("curry") || allText.includes("tikka")) {
    dishCategory = "indian";
  } else if (candidateCat === "kebab" || allText.includes("kebab") || allText.includes("shawarma")) {
    dishCategory = "kebab";
  } else if (candidateCat === "boba" || allText.includes("boba") || allText.includes("bubble tea")) {
    dishCategory = "boba";
  } else if (candidateCat === "natural_wine" || allText.includes("wine") || allText.includes("naturvin")) {
    dishCategory = "natural_wine";
  } else if (candidateCat && CATEGORY_TO_GROUP[candidateCat]) {
    dishCategory = candidateCat;
  } else {
    dishCategory = "street_food";
  }

  // Derive parent group
  const parentGroup = getParentFoodGroup(dishCategory) || FOOD_GROUPS[4]; // fallback to Sandwiches & Handhelds

  // 3. Resolve Cuisines
  const cuisines: CuisineId[] = [];
  if (allText.includes("vietnam") || dishCategory === "pho" || dishCategory === "banh_mi" || allText.includes("em oi") || allText.includes("êm ôi")) {
    cuisines.push("vietnamese");
  }
  if (allText.includes("korean") || dishCategory === "k_chicken" || candidateCat === "kbbq") {
    cuisines.push("korean");
  }
  if (allText.includes("japan") || dishCategory === "ramen" || dishCategory === "sushi" || dishCategory === "matcha") {
    cuisines.push("japanese");
  }
  if (allText.includes("china") || allText.includes("chinese") || dishCategory === "dumplings" || dishCategory === "bao") {
    cuisines.push("chinese");
  }
  if (allText.includes("india") || allText.includes("pakistan") || dishCategory === "naan" || dishCategory === "indian") {
    cuisines.push("indian_pakistani");
  }
  if (allText.includes("italy") || allText.includes("italian") || dishCategory === "pizza" || dishCategory === "pasta" || dishCategory === "gelato") {
    cuisines.push("italian");
  }
  if (allText.includes("mexic") || dishCategory === "tacos") {
    cuisines.push("mexican");
  }
  if (allText.includes("yemen") || allText.includes("somali") || dishCategory === "mandi_rice") {
    cuisines.push("yemeni_somali");
  }
  if (allText.includes("nordic") || candidateCat === "nordic_seafood" || dishCategory === "kanelbolle") {
    cuisines.push("nordic");
  }
  if (allText.includes("france") || allText.includes("french") || dishCategory === "croissant") {
    cuisines.push("french");
  }
  if (allText.includes("middle eastern") || dishCategory === "kebab" || candidateCat === "middle_eastern") {
    cuisines.push("middle_eastern");
  }

  // 4. Resolve Diets
  const diets: DietaryTag[] = Array.isArray(v.dietary_tags)
    ? (v.dietary_tags as DietaryTag[])
    : Array.isArray(p.dietary_tags)
    ? (p.dietary_tags as DietaryTag[])
    : [];

  // Human-readable labels
  const dishLabel = dishCategory
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    spotKind,
    spotLabel: spotDef.label,
    group: parentGroup,
    dishCategory,
    dishLabel,
    cuisines,
    diets,
  };
}
