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
    label: "Bakery & Sourdough",
    shortLabel: "Bakery",
    heroIcon: "croissant",
    childCategories: ["croissant", "cinnamon_roll", "kanelbolle", "cardamom_bun", "bagel", "waffle", "bakery", "sourdough", "sourdough_loaf", "bread", "breads"],
  },
  {
    id: "breads",
    label: "Breads & Flatbreads",
    shortLabel: "Breads",
    heroIcon: "naan",
    childCategories: [],
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
    childCategories: ["ramen", "pho", "udon", "noodle_soup", "noodles"],
  },
  {
    id: "sandwiches_handhelds",
    label: "Sandwiches & Handhelds",
    shortLabel: "Sandwiches",
    heroIcon: "banh_mi",
    childCategories: ["banh_mi", "burger", "tacos", "taco", "birria", "cheesesteak", "kebab_wrap", "street_sandwich", "street_food"],
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
    label: "Rice & Curry",
    shortLabel: "Rice & Curry",
    heroIcon: "indian",
    childCategories: ["mandi_rice", "curry", "indian", "naan", "flatbread", "bibimbap", "poke"],
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
    childCategories: ["gelato", "dessert", "pancakes", "cheesecake", "basque_cheesecake"],
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
  const venueCat = (v.food_category || (v as any).category) ? String(v.food_category || (v as any).category).toLowerCase().trim() : "";
  const venueIcon = v.icon ? String(v.icon).toLowerCase().trim() : "";

  // Prioritize post category if available, then venue category or venue icon
  const candidateCat = postCat || venueCat || venueIcon;

  // Decouple Pho from Banh Mi: check textual clues in post title or venue signature dishes
  const allText = `${v.name || ""} ${p.dish_name || ""} ${(v.signature_dishes || []).join(" ")}`.toLowerCase();

  // 1. Specific Spot & Signature Dish overrides
  if (
    allText.includes("zam zam") ||
    allText.includes("zamzam") ||
    allText.includes("cheesesteak") ||
    candidateCat === "cheesesteak"
  ) {
    dishCategory = "cheesesteak";
  } else if (
    allText.includes("lai zai") ||
    allText.includes("laizai") ||
    allText.includes("em oi") ||
    allText.includes("êm ôi") ||
    candidateCat === "banh_mi" ||
    allText.includes("banh mi") ||
    allText.includes("bánh mì")
  ) {
    dishCategory = "banh_mi";
  } else if (
    allText.includes("pho") ||
    allText.includes("phở") ||
    allText.includes("noodle") ||
    allText.includes("udon") ||
    candidateCat === "pho"
  ) {
    dishCategory = "pho";
  } else if (candidateCat === "ramen" || allText.includes("ramen")) {
    dishCategory = "ramen";
  } else if (candidateCat === "pizza" || allText.includes("pizza") || allText.includes("margherita")) {
    dishCategory = "pizza";
  } else if (candidateCat === "pasta" || allText.includes("pasta") || allText.includes("carbonara")) {
    dishCategory = "pasta";
  } else if (candidateCat === "k_chicken" || candidateCat === "fried_chicken" || allText.includes("k-chicken") || allText.includes("yangnyeom")) {
    dishCategory = "k_chicken";
  } else if (allText.includes("masala politics")) {
    dishCategory = "curry";
  } else if (candidateCat === "naan" || candidateCat === "flatbread" || allText.includes("naan") || allText.includes("garlic naan")) {
    dishCategory = "naan";
  } else if (
    candidateCat === "cinnamon_roll" ||
    candidateCat === "kanelbolle" ||
    allText.includes("kanelbolle") ||
    allText.includes("cinnamon") ||
    allText.includes("kveitemjøl")
  ) {
    dishCategory = "kanelbolle";
  } else if (
    candidateCat === "croissant" ||
    candidateCat === "bakery" ||
    allText.includes("croissant") ||
    allText.includes("bakeri") ||
    allText.includes("bakst") ||
    allText.includes("håndbakt") ||
    allText.includes("brød")
  ) {
    dishCategory = "croissant";
  } else if (candidateCat === "coffee" || allText.includes("kaffe") || allText.includes("latte") || allText.includes("cappuccino")) {
    dishCategory = "coffee";
  } else if (candidateCat === "matcha" || allText.includes("matcha") || allText.includes("ochaya")) {
    dishCategory = "matcha";
  } else if (candidateCat === "tacos" || allText.includes("taco") || allText.includes("birria")) {
    dishCategory = "tacos";
  } else if (candidateCat === "burger" || allText.includes("burger") || allText.includes("smash")) {
    dishCategory = "burger";
  } else if (candidateCat === "pancakes" || allText.includes("pancake") || allText.includes("pannekake") || allText.includes("crave")) {
    dishCategory = "pancakes";
  } else if (candidateCat === "dumplings" || allText.includes("dumpling") || allText.includes("gyoza") || allText.includes("dim sum") || allText.includes("yum cha")) {
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

  // 3. Resolve Cuisines (Only for authentic cultural cuisines, never inferred merely from generic items like pizza or croissants)
  const cuisines: CuisineId[] = [];
  if (allText.includes("vietnam") || allText.includes("em oi") || allText.includes("êm ôi") || allText.includes("lai zai") || (allText.includes("banh mi") && !allText.includes("burger"))) {
    cuisines.push("vietnamese");
  }
  if (allText.includes("korean") || allText.includes("k-fried") || candidateCat === "kbbq" || allText.includes("175°c") || allText.includes("175 c")) {
    cuisines.push("korean");
  }
  if (allText.includes("japan") || allText.includes("miso ramen") || allText.includes("ochaya") || dishCategory === "ramen" || dishCategory === "matcha") {
    if (!allText.includes("crave")) {
      cuisines.push("japanese");
    }
  }
  if (allText.includes("china") || allText.includes("chinese") || allText.includes("canton") || allText.includes("dim sum") || allText.includes("yum cha") || allText.includes("szechuan") || allText.includes("chengdu")) {
    cuisines.push("chinese");
  }
  if (allText.includes("india") || allText.includes("pakistan") || allText.includes("masala") || dishCategory === "curry" || dishCategory === "indian") {
    cuisines.push("indian_pakistani");
  }
  if (allText.includes("italy") || allText.includes("italian") || allText.includes("trattoria") || allText.includes("osteria")) {
    cuisines.push("italian");
  }
  if (allText.includes("mexic") || allText.includes("taqueria") || allText.includes("birria")) {
    cuisines.push("mexican");
  }
  if (allText.includes("yemen") || allText.includes("somali") || dishCategory === "mandi_rice" || allText.includes("mandi house")) {
    cuisines.push("yemeni_somali");
  }
  if (allText.includes("nordic seafood") || candidateCat === "nordic_seafood") {
    cuisines.push("nordic");
  }
  if (allText.includes("french bistro") || allText.includes("creperie") || candidateCat === "french") {
    cuisines.push("french");
  }
  if (allText.includes("middle eastern") || candidateCat === "middle_eastern" || allText.includes("levantine")) {
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

export interface VenueDisplayBadge {
  flag?: string;
  mainTag: string;
  pinIcon: string;
  filterTags: string[];
}

/**
 * Deterministic Venue Display Badge Resolver (1 Main Tag Only for Card Header).
 * Provides clean Flag + 1 Short Main Tag (e.g. "🇮🇳 INDIAN", "🇻🇳 VIETNAMESE", "🇯🇵 MATCHA")
 * while preserving the specific pinIcon for map markers.
 * FLAGS are strictly reserved for authentic cultural/origin kitchens; bakeries, pizza spots,
 * coffee bars, and local comfort joints display clean uppercase category tags without flags.
 */
export function resolveVenueDisplayBadge(venue?: Partial<Venue> | null): VenueDisplayBadge {
  if (!venue) {
    return { mainTag: "FOOD", pinIcon: "all", filterTags: ["food"] };
  }

  const nameLower = (venue.name || "").toLowerCase().trim();
  const catLower = (venue.food_category || (venue as any).category || "").toLowerCase().trim();
  const iconLower = (venue.icon || "").toLowerCase().trim();

  // 1. Specific Curated Spot Matches (Oslo Core DB)
  if (nameLower.includes("masala politics") || catLower === "naan") {
    return { flag: "🇮🇳", mainTag: "INDIAN", pinIcon: "naan", filterTags: ["indian", "curry", "halal", "dinner"] };
  }
  if (nameLower.includes("em oi") || nameLower.includes("êm ôi")) {
    return { flag: "🇻🇳", mainTag: "VIETNAMESE", pinIcon: "banh_mi", filterTags: ["vietnamese", "banh_mi", "coffee", "street_food", "lunch"] };
  }
  if (nameLower.includes("lai zai")) {
    return { flag: "🇻🇳", mainTag: "VIETNAMESE", pinIcon: "banh_mi", filterTags: ["vietnamese", "street_food", "lunch"] };
  }
  if (nameLower.includes("ochaya")) {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "japanese", "drinks"] };
  }
  if (nameLower.includes("miso ramen")) {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "noodles", "japanese", "dinner"] };
  }
  if (nameLower.includes("kuro")) {
    return { mainTag: "COFFEE & TEA", pinIcon: "coffee", filterTags: ["coffee", "tea", "minimalist", "drinks"] };
  }
  if (nameLower.includes("daglig brød") || nameLower.includes("daglig brod")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "bread", "pastries"] };
  }
  if (nameLower.includes("håndbakt") || nameLower.includes("handbakt")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "brunch", "organic", "pastries"] };
  }
  if (nameLower.includes("kveitemjøl") || nameLower.includes("kveitemjol")) {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "pastries", "croissant"] };
  }
  if (nameLower.includes("fuglen")) {
    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee", "roastery"] };
  }
  if (nameLower.includes("mandi house") || nameLower.includes("mandi") || nameLower.includes("madi")) {
    return { flag: "🇾🇪", mainTag: "YEMENI", pinIcon: "mandi_rice", filterTags: ["mandi_rice", "yemeni", "halal", "dinner"] };
  }
  if (nameLower.includes("yum cha")) {
    return { flag: "🇭🇰", mainTag: "DIM SUM", pinIcon: "dumplings", filterTags: ["dim_sum", "dumplings", "cantonese", "asian"] };
  }
  if (nameLower.includes("175°c") || nameLower.includes("175 c") || nameLower.includes("k-fried")) {
    return { flag: "🇰🇷", mainTag: "K-CHICKEN", pinIcon: "k_chicken", filterTags: ["k_chicken", "fried_chicken", "korean", "halal"] };
  }
  if (nameLower.includes("zam zam") || nameLower.includes("zamzam")) {
    return { mainTag: "CHEESESTEAK", pinIcon: "cheesesteak", filterTags: ["cheesesteak", "halal", "street_food"] };
  }
  if (nameLower.includes("dirty taco") || nameLower.includes("corral")) {
    return { flag: "🇲🇽", mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "mexican", "street_food"] };
  }
  if (nameLower.includes("hernández") || nameLower.includes("hernandez")) {
    return { flag: "🇪🇸", mainTag: "CHEESECAKE", pinIcon: "basque_cheesecake", filterTags: ["cheesecake", "basque_cheesecake", "dessert", "sweets"] };
  }
  if (nameLower.includes("silin")) {
    return { flag: "🇸🇾", mainTag: "MANAKISH", pinIcon: "manakish", filterTags: ["bakery", "manakish", "flatbread", "middle_eastern"] };
  }
  if (nameLower.includes("digg pizza")) {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "dinner"] };
  }
  if (nameLower.includes("stykke")) {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "roman_pizza", "slices"] };
  }
  if (nameLower.includes("cocoa")) {
    return { mainTag: "COCOA BAR", pinIcon: "hot_cocoa", filterTags: ["dessert", "cocoa", "chocolate", "drinks"] };
  }
  if (nameLower.includes("crave")) {
    return { mainTag: "PANCAKES", pinIcon: "pancakes", filterTags: ["dessert", "pancakes", "toast", "sweet"] };
  }
  if (nameLower.includes("u wan sum")) {
    return { mainTag: "DRINKS POP-UP", pinIcon: "drinks", filterTags: ["popup", "coffee", "matcha", "drinks"] };
  }

  // 2. Additional Known Candidates & Pop-Ups
  if (nameLower.includes("farine")) {
    return { mainTag: "BAKERY", pinIcon: "cinnamon_roll", filterTags: ["bakery", "cinnamon_roll", "sourdough", "pastries"] };
  }
  if (nameLower.includes("tomodomo")) {
    return { flag: "🇯🇵", mainTag: "RAMEN & UDON", pinIcon: "ramen", filterTags: ["ramen", "udon", "noodle", "japanese", "popup"] };
  }
  if (nameLower.includes("waaj")) {
    return { flag: "🇲🇽", mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "mexican", "street_food", "food_truck"] };
  }
  if (nameLower.includes("aleppo bahebek")) {
    return { flag: "🇸🇾", mainTag: "SHAWARMA", pinIcon: "kebab", filterTags: ["syrian", "middle_eastern", "halal", "street_food"] };
  }
  if (nameLower.includes("crantz cookies") || nameLower.includes("sukkerbakeriet")) {
    return { mainTag: "COOKIES", pinIcon: "croissant", filterTags: ["dessert", "cookies", "bakery", "popup"] };
  }
  if (nameLower.includes("mint on wheels")) {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "popup", "drinks"] };
  }
  if (nameLower.includes("dæsj") || nameLower.includes("daesj")) {
    return { mainTag: "GELATO", pinIcon: "gelato", filterTags: ["gelato", "dessert", "popup"] };
  }
  if (nameLower.includes("koie ramen")) {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "japanese", "noodles", "asian"] };
  }
  if (nameLower.includes("vinoteket")) {
    return { mainTag: "PIZZA & WINE", pinIcon: "pizza", filterTags: ["pizza", "natural_wine"] };
  }
  if (nameLower.includes("king falafel")) {
    return { flag: "🇵🇸", mainTag: "FALAFEL", pinIcon: "falafel", filterTags: ["falafel", "vegan", "street_food"] };
  }
  if (nameLower.includes("chaiwala")) {
    return { flag: "🇵🇰", mainTag: "MASALA CHAI", pinIcon: "masala_chai", filterTags: ["chai", "tea", "street_food", "coffee_tea"] };
  }
  if (nameLower.includes("pele pele")) {
    return { flag: "🇬🇭", mainTag: "WEST AFRICAN", pinIcon: "k_chicken", filterTags: ["african", "street_food", "grill", "spicy", "halal"] };
  }
  if (nameLower.includes("noods")) {
    return { flag: "🇨🇳", mainTag: "NOODLES", pinIcon: "noodles", filterTags: ["noodles", "chinese", "asian", "spicy"] };
  }
  if (nameLower.includes("doga") || nameLower.includes("smash")) {
    return { mainTag: "SMASH BURGER", pinIcon: "burger", filterTags: ["burger", "smash", "street_food"] };
  }
  if (nameLower.includes("szechuan chengdu")) {
    return { flag: "🇨🇳", mainTag: "SICHUAN", pinIcon: "curry", filterTags: ["chinese", "sichuan", "spicy", "asian"] };
  }
  if (nameLower.includes("izakaya")) {
    return { flag: "🇯🇵", mainTag: "IZAKAYA", pinIcon: "dumplings", filterTags: ["japanese", "izakaya", "asian", "drinks", "dinner"] };
  }
  if (nameLower.includes("syverkiosken")) {
    return { mainTag: "STREET FOOD", pinIcon: "street_food", filterTags: ["street_food", "heritage", "sausage", "kiosk"] };
  }
  if (nameLower.includes("the little pickle")) {
    return { mainTag: "BISTRO", pinIcon: "natural_wine", filterTags: ["natural_wine", "bistro", "seasonal", "dinner"] };
  }
  if (nameLower.includes("marani")) {
    return { flag: "🇬🇪", mainTag: "GEORGIAN", pinIcon: "dumplings", filterTags: ["georgian", "khinkali", "khachapuri", "wine"] };
  }
  if (nameLower.includes("gazakjøkken") || nameLower.includes("gazakjokken")) {
    return { flag: "🇵🇸", mainTag: "MIDDLE EASTERN", pinIcon: "kebab", filterTags: ["palestinian", "middle_eastern", "halal", "shawarma"] };
  }
  if (nameLower.includes("becco")) {
    return { mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "drinks"] };
  }
  if (nameLower.includes("lasarett")) {
    return { mainTag: "WINE & BITES", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine_bar", "popup", "guest_chef"] };
  }

  // 3. Fallbacks Based on food_category and icon (Clean tags; flags ONLY for authentic cultural cuisines)
  if (catLower === "ramen" || iconLower === "ramen") {
    return { flag: "🇯🇵", mainTag: "RAMEN", pinIcon: "ramen", filterTags: ["ramen", "noodles", "japanese"] };
  }
  if (catLower === "matcha" || iconLower === "matcha") {
    return { flag: "🇯🇵", mainTag: "MATCHA", pinIcon: "matcha", filterTags: ["matcha", "tea", "japanese", "drinks"] };
  }
  if (catLower === "pizza" || iconLower === "pizza") {
    return { mainTag: "PIZZA", pinIcon: "pizza", filterTags: ["pizza", "dinner"] };
  }
  if (catLower === "pasta" || iconLower === "pasta") {
    return { mainTag: "PASTA", pinIcon: "pasta", filterTags: ["pasta", "dinner"] };
  }
  if (catLower === "tacos" || iconLower === "tacos") {
    return { mainTag: "TACOS", pinIcon: "tacos", filterTags: ["tacos", "street_food"] };
  }
  if (catLower === "k_chicken" || iconLower === "k_chicken") {
    return { flag: "🇰🇷", mainTag: "K-CHICKEN", pinIcon: "k_chicken", filterTags: ["k_chicken", "korean", "chicken"] };
  }
  if (catLower === "dumplings" || iconLower === "dumplings" || catLower === "bao") {
    return { flag: "🇭🇰", mainTag: "DUMPLINGS", pinIcon: "dumplings", filterTags: ["dumplings", "dim_sum", "asian"] };
  }
  if (catLower === "bakery" || catLower === "cinnamon_roll" || iconLower === "croissant") {
    return { mainTag: "BAKERY", pinIcon: "croissant", filterTags: ["bakery", "sourdough", "pastries"] };
  }
  if (catLower === "coffee" || iconLower === "coffee") {
    return { mainTag: "COFFEE", pinIcon: "coffee", filterTags: ["coffee", "specialty_coffee", "drinks"] };
  }
  if (catLower === "natural_wine" || catLower === "drinks" || iconLower === "natural_wine" || iconLower === "drinks") {
    return { mainTag: "NATURAL WINE", pinIcon: "natural_wine", filterTags: ["natural_wine", "wine", "drinks"] };
  }
  if (catLower === "gelato" || catLower === "dessert" || iconLower === "gelato") {
    return { mainTag: "DESSERT", pinIcon: "gelato", filterTags: ["dessert", "gelato", "sweets"] };
  }
  if (venue.spot_type === "popup") {
    return { mainTag: "POP-UP", pinIcon: "drinks", filterTags: ["popup", "seasonal"] };
  }
  if (venue.spot_type === "food_truck") {
    return { mainTag: "FOOD TRUCK", pinIcon: "street_food", filterTags: ["food_truck", "street_food"] };
  }

  return {
    mainTag: (venue.food_category || (venue as any).category || "FOOD").toUpperCase(),
    pinIcon: venue.icon || "all",
    filterTags: ["food"],
  };
}

export function resolveDishIconKey(dishName?: string | null, dishCategory?: string | null): string {
  if (!dishName && !dishCategory) return "food";
  const name = (dishName || "").toLowerCase().trim();
  const cat = (dishCategory || "").toLowerCase().trim();

  // 1. Exact beverage detection
  if (
    name.includes("coffee") ||
    name.includes("kaffe") ||
    name.includes("latte") ||
    name.includes("cà phê") ||
    name.includes("espresso") ||
    name.includes("pour-over")
  ) {
    return "coffee";
  }
  if (name.includes("matcha") || name.includes("hojicha") || name.includes("usucha") || name.includes("tea") || name.includes("te")) {
    return "matcha";
  }
  if (name.includes("cocoa") || name.includes("chocolate") || name.includes("sjokolade")) {
    return "dessert";
  }

  // 2. Bakery items
  if (name.includes("croissant")) return "croissant";
  if (name.includes("bolle") || name.includes("bun") || name.includes("snurr") || name.includes("knot") || name.includes("roll")) {
    return "cinnamon_roll";
  }
  if (name.includes("brød") || name.includes("bread") || name.includes("landhvete") || name.includes("loaf") || name.includes("sourdough")) {
    return "breads";
  }
  if (name.includes("banh mi") || name.includes("bánh mì") || name.includes("sandwich") || name.includes("blings") || name.includes("melt")) {
    return "banh_mi";
  }

  // 3. Savory street foods
  if (name.includes("taco") || name.includes("quesadilla") || name.includes("totopo") || name.includes("nacho")) {
    return "tacos";
  }
  if (name.includes("pizza") || name.includes("stykke") || name.includes("cheeesy") || name.includes("diavola") || name.includes("pepperoni")) {
    return "pizza";
  }
  if (name.includes("cheesesteak") || name.includes("chikano") || name.includes("snadder")) {
    return "cheesesteak";
  }
  if (name.includes("pancake") || name.includes("soufflé") || name.includes("pannekake") || name.includes("pistella")) {
    return "pancakes";
  }
  if (name.includes("ramen") || name.includes("udon") || name.includes("noodle") || name.includes("bún") || name.includes("pho") || name.includes("phở")) {
    return "ramen";
  }
  if (name.includes("dumpling") || name.includes("wonton") || name.includes("har gow") || name.includes("siu mai") || name.includes("gyoza") || name.includes("bao") || name.includes("dim sum")) {
    return "dumplings";
  }
  if (name.includes("chicken") || name.includes("wings") || name.includes("k-fried") || name.includes("kylling") || name.includes("yangnyeom")) {
    return "k_chicken";
  }
  if (name.includes("mandi") || name.includes("madbi") || name.includes("biryani") || name.includes("rice")) {
    return "mandi_rice";
  }
  if (name.includes("curry") || name.includes("butter chicken") || name.includes("tikka") || name.includes("rogan josh") || name.includes("masala") || name.includes("karahi")) {
    return "curry";
  }
  if (name.includes("naan")) {
    return "naan";
  }
  if (name.includes("egg") || name.includes("brunch") || name.includes("labneh") || name.includes("turkish")) {
    return "brunch";
  }
  if (name.includes("gelato") || name.includes("is") || name.includes("ice cream") || name.includes("paleta")) {
    return "gelato";
  }
  if (name.includes("cookie") || name.includes("cake") || name.includes("cheesecake") || name.includes("dessert")) {
    return "dessert";
  }
  if (name.includes("falafel") || name.includes("shawarma") || name.includes("kebab")) {
    return "kebab";
  }
  if (name.includes("burger")) {
    return "burger";
  }

  // 4. Fallback to category or generic food
  if (cat && cat !== "food" && cat !== "all") {
    return cat;
  }
  return "food";
}

