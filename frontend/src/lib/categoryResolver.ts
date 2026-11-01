import type { FoodCategory } from "@/types";

export interface ResolvedCategoryAndIcon {
  category: FoodCategory;
  icon: string;
  label: string;
}

/**
 * Intelligent Auto-Resolver for Smakr Oslo
 * Dynamically resolves category and food emoji/icon based on dish keywords,
 * venue names, and Google Places types.
 */
export function resolveFoodCategoryAndIcon(
  dishName: string,
  venueName = "",
  googleTypes: string[] = []
): ResolvedCategoryAndIcon {
  const combined = `${dishName} ${venueName} ${googleTypes.join(" ")}`.toLowerCase();

  // 1. Dumplings & Dim Sum
  if (
    combined.includes("dumpling") ||
    combined.includes("gyoza") ||
    combined.includes("dim sum") ||
    combined.includes("dimsum") ||
    combined.includes("momo") ||
    combined.includes("wonton") ||
    combined.includes("potsticker")
  ) {
    return { category: "dumplings", icon: "🥟", label: "Dumplings" };
  }

  // 2. Bao & Steamed Buns
  if (
    combined.includes("bao") ||
    (combined.includes("steamed bun") && !combined.includes("burger"))
  ) {
    return { category: "bao", icon: "🥠", label: "Bao Buns" };
  }

  // 3. Tacos & Mexican
  if (
    combined.includes("taco") ||
    combined.includes("burrito") ||
    combined.includes("birria") ||
    combined.includes("quesadilla") ||
    combined.includes("carnitas") ||
    googleTypes.includes("mexican_restaurant")
  ) {
    return { category: "tacos", icon: "🌮", label: "Tacos" };
  }

  // 4. Ramen & Japanese Noodles
  if (
    combined.includes("ramen") ||
    combined.includes("tonkotsu") ||
    combined.includes("shoyu") ||
    combined.includes("miso") ||
    combined.includes("udon") ||
    combined.includes("soba") ||
    googleTypes.includes("ramen_restaurant")
  ) {
    return { category: "ramen", icon: "🍜", label: "Ramen" };
  }

  // 5. Pizza & Calzone
  if (
    combined.includes("pizza") ||
    combined.includes("calzone") ||
    combined.includes("woodfired") ||
    googleTypes.includes("pizza_restaurant")
  ) {
    return { category: "pizza", icon: "🍕", label: "Pizza" };
  }

  // 6. Burgers & Smash
  if (
    combined.includes("burger") ||
    combined.includes("smash") ||
    combined.includes("cheeseburger") ||
    googleTypes.includes("hamburger_restaurant")
  ) {
    return { category: "burger", icon: "🍔", label: "Burgers" };
  }

  // 6b. Korean BBQ & Grill
  if (
    combined.includes("kbbq") ||
    combined.includes("korean bbq") ||
    combined.includes("bulgogi") ||
    combined.includes("samgyeopsal") ||
    combined.includes("galbi")
  ) {
    return { category: "kbbq", icon: "🥓", label: "Korean BBQ" };
  }

  // 6c. Fried Chicken & Korean
  if (
    combined.includes("fried chicken") ||
    combined.includes("korean") ||
    combined.includes("wings") ||
    combined.includes("yangnyeom") ||
    combined.includes("bibimbap") ||
    combined.includes("tteokbokki") ||
    googleTypes.includes("korean_restaurant")
  ) {
    return { category: "fried_chicken", icon: "🍗", label: "Fried Chicken & Korean" };
  }

  // 6c. Mandi, Spiced Rice & Yemeni / Somali Specialties
  if (
    combined.includes("mandi") ||
    combined.includes("yemeni") ||
    combined.includes("yemen") ||
    combined.includes("kabsa") ||
    combined.includes("majboos") ||
    combined.includes("somali") ||
    combined.includes("bariis") ||
    combined.includes("spiced rice") ||
    combined.includes("lamb rice") ||
    combined.includes("chicken rice")
  ) {
    const isYemeni = combined.includes("yemen") || combined.includes("yemeni");
    const isChicken = combined.includes("chicken");
    const isLamb = combined.includes("lamb") || combined.includes("kjøtt");
    const icon = isYemeni ? "🇾🇪" : isLamb ? "🍖" : isChicken ? "🍗" : "🍚";
    return { category: "mandi_rice", icon, label: "Mandi & Spiced Rice" };
  }

  // 6d. Middle Eastern, Levant & Persian Specialties
  if (
    combined.includes("middle eastern") ||
    combined.includes("lebanese") ||
    combined.includes("syrian") ||
    combined.includes("persian") ||
    combined.includes("iranian") ||
    combined.includes("turkish") ||
    combined.includes("hummus")
  ) {
    return { category: "middle_eastern", icon: "🫓", label: "Middle Eastern" };
  }

  // 6e. Kebab, Shawarma & Falafel
  if (
    combined.includes("kebab") ||
    combined.includes("shawarma") ||
    combined.includes("falafel") ||
    combined.includes("gyros") ||
    combined.includes("döner") ||
    combined.includes("doner") ||
    googleTypes.includes("middle_eastern_restaurant")
  ) {
    return { category: "kebab", icon: "🥙", label: "Kebab & Shawarma" };
  }

  // 6f. Pho & Vietnamese
  if (
    combined.includes("pho") ||
    combined.includes("phở") ||
    combined.includes("bánh mì") ||
    combined.includes("banh mi") ||
    combined.includes("vietnamese") ||
    combined.includes("summer roll") ||
    googleTypes.includes("vietnamese_restaurant")
  ) {
    return { category: "vietnamese", icon: "🍲", label: "Pho & Vietnamese" };
  }

  // 6g. Indian & Curry
  if (
    combined.includes("curry") ||
    combined.includes("masala") ||
    combined.includes("tikka") ||
    combined.includes("tandoori") ||
    combined.includes("biryani") ||
    combined.includes("naan") ||
    combined.includes("samosa") ||
    combined.includes("indian") ||
    googleTypes.includes("indian_restaurant")
  ) {
    return { category: "indian", icon: "🍛", label: "Indian & Curry" };
  }

  // 7. Pasta & Italian
  if (
    combined.includes("pasta") ||
    combined.includes("spaghetti") ||
    combined.includes("carbonara") ||
    combined.includes("rigatoni") ||
    combined.includes("lasagna") ||
    combined.includes("gnocchi") ||
    googleTypes.includes("italian_restaurant")
  ) {
    return { category: "pasta", icon: "🍝", label: "Pasta" };
  }

  // 8. Matcha & Tea
  if (
    combined.includes("matcha") ||
    combined.includes("hojicha") ||
    combined.includes("sencha") ||
    combined.includes("chai") ||
    googleTypes.includes("tea_house")
  ) {
    return { category: "matcha", icon: "🍵", label: "Matcha & Tea" };
  }

  // 8b. Boba & Bubble Tea
  if (
    combined.includes("boba") ||
    combined.includes("bubble tea") ||
    combined.includes("tapioca") ||
    combined.includes("pearl tea")
  ) {
    return { category: "boba", icon: "🧋", label: "Bubble Tea & Boba" };
  }

  // 9. Coffee & Espresso
  if (
    combined.includes("coffee") ||
    combined.includes("kaffe") ||
    combined.includes("espresso") ||
    combined.includes("latte") ||
    combined.includes("cappuccino") ||
    combined.includes("cà phê") ||
    combined.includes("cortado") ||
    googleTypes.includes("cafe") ||
    googleTypes.includes("coffee_shop")
  ) {
    return { category: "coffee", icon: "☕", label: "Specialty Coffee" };
  }

  // 9b. Artisan Sourdough
  if (
    combined.includes("sourdough") ||
    combined.includes("surdeig") ||
    combined.includes("landbrød") ||
    combined.includes("levain")
  ) {
    return { category: "sourdough", icon: "🍞", label: "Artisan Sourdough" };
  }

  // 10. Bakery & Pastries
  if (
    combined.includes("croissant") ||
    combined.includes("cardamom") ||
    combined.includes("cinnamon") ||
    combined.includes("bolle") ||
    combined.includes("kanelbolle") ||
    combined.includes("bakery") ||
    combined.includes("bakeri") ||
    googleTypes.includes("bakery")
  ) {
    return { category: "bakery", icon: "🥐", label: "Bakery & Pastries" };
  }

  // 10b. Nordic Seafood & Fish
  if (
    (combined.includes("salmon") ||
      combined.includes("laks") ||
      combined.includes("ørret") ||
      combined.includes("torsk") ||
      combined.includes("cod") ||
      combined.includes("herring") ||
      combined.includes("sild") ||
      combined.includes("fisk") ||
      combined.includes("seafood") ||
      combined.includes("reker") ||
      combined.includes("skalldyr")) &&
    !combined.includes("sushi") &&
    !combined.includes("sashimi") &&
    !combined.includes("nigiri")
  ) {
    return { category: "nordic_seafood", icon: "🐟", label: "Nordic Seafood" };
  }

  // 11. Sushi & Japanese Raw Bar
  if (
    combined.includes("sushi") ||
    combined.includes("sashimi") ||
    combined.includes("nigiri") ||
    googleTypes.includes("sushi_restaurant")
  ) {
    return { category: "sushi", icon: "🍣", label: "Seafood & Sushi" };
  }

  // 11b. Artisanal Gelato & Ice Cream
  if (
    combined.includes("gelato") ||
    combined.includes("isbar") ||
    combined.includes("sorbet") ||
    combined.includes("iskrem") ||
    googleTypes.includes("ice_cream_shop")
  ) {
    return { category: "gelato", icon: "🍨", label: "Artisan Gelato" };
  }

  // 12. Sweets & Desserts
  if (
    combined.includes("waffle") ||
    combined.includes("vaffel") ||
    combined.includes("donut") ||
    combined.includes("cookie") ||
    combined.includes("cake") ||
    combined.includes("kake") ||
    googleTypes.includes("dessert_shop")
  ) {
    return { category: "dessert", icon: "🍦", label: "Sweets & Desserts" };
  }

  // 12b. Low-Intervention Natural Wine & Cider
  if (
    combined.includes("natural wine") ||
    combined.includes("naturvin") ||
    combined.includes("orange wine") ||
    combined.includes("pet-nat") ||
    combined.includes("pet nat")
  ) {
    return { category: "natural_wine", icon: "🍷", label: "Natural Wine" };
  }

  // 12c. Specialty Brunch & Toast
  if (
    combined.includes("brunch") ||
    combined.includes("avocado toast") ||
    combined.includes("benedict") ||
    combined.includes("poached egg") ||
    combined.includes("toast")
  ) {
    return { category: "brunch", icon: "🥑", label: "Brunch & Toast" };
  }

  // 13. Drinks & Cocktails
  if (
    combined.includes("cocktail") ||
    combined.includes("wine") ||
    combined.includes("vin") ||
    combined.includes("beer") ||
    combined.includes("øl") ||
    combined.includes("cider") ||
    googleTypes.includes("bar") ||
    googleTypes.includes("wine_bar")
  ) {
    return { category: "drinks", icon: "🍸", label: "Bars & Drinks" };
  }

  // 14. Street Food & Sandwiches
  if (
    combined.includes("banh mi") ||
    combined.includes("bánh mì") ||
    combined.includes("sandwich") ||
    combined.includes("focaccia") ||
    combined.includes("kebab") ||
    combined.includes("falafel") ||
    combined.includes("shawarma") ||
    combined.includes("wrap")
  ) {
    return { category: "street_food", icon: "🥪", label: "Street Food" };
  }

  // Default fallback
  return { category: "street_food", icon: "🍽️", label: "Street Food" };
}
