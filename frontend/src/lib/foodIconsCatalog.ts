import {
  DISH_ICON_WEBP,
  GROUP_FILTER_WEBP,
  SMAKR_ICON_SVG_BODIES,
} from "@/components/food/FoodIcons";
import { ICON_REGISTRY } from "@/lib/iconRegistry";

export interface FoodIconEntry {
  id: string;
  emoji: string;
  name: string;
  tags: string[];
  category: string;
  isCustomArt?: boolean;
}

const CUSTOM_ART_CATALOG_ENTRIES: FoodIconEntry[] = [
  // ── Primary Custom Dish WebP & Vector Artwork ──
  { id: "k_chicken", emoji: "🍗", name: "K-Chicken / Crispy Wings", tags: ["k_chicken", "k-chicken", "fried_chicken", "korean", "chicken", "wings", "crispy", "yangnyeom", "kfc", "custom"], category: "k_chicken", isCustomArt: true },
  { id: "pizza", emoji: "🍕", name: "Wood-Fired Sourdough Pizza", tags: ["pizza", "slice", "neapolitan", "sourdough", "margherita", "custom"], category: "pizza", isCustomArt: true },
  { id: "pasta", emoji: "🍝", name: "Fresh Handmade Pasta", tags: ["pasta", "spaghetti", "rigatoni", "carbonara", "italian", "custom"], category: "pasta", isCustomArt: true },
  { id: "ramen", emoji: "🍜", name: "Tonkotsu Ramen Bowl", tags: ["ramen", "noodles", "soup", "broth", "japanese", "custom"], category: "ramen", isCustomArt: true },
  { id: "coffee", emoji: "☕", name: "Specialty Coffee / Cortado", tags: ["coffee", "espresso", "latte", "cortado", "kaffe", "custom"], category: "coffee", isCustomArt: true },
  { id: "iced_coffee", emoji: "🧋", name: "Iced Coffee / Cold Brew", tags: ["iced_coffee", "iced coffee", "cold brew", "coffee", "custom"], category: "coffee", isCustomArt: true },
  { id: "croissant", emoji: "🥐", name: "Butter Croissant", tags: ["croissant", "bakery", "pastry", "french", "viennoiserie", "custom"], category: "bakery", isCustomArt: true },
  { id: "cinnamon_roll", emoji: "🥮", name: "Cinnamon Roll / Kanelbolle", tags: ["cinnamon_roll", "cinnamon roll", "kanelbolle", "swirl", "bakery", "custom"], category: "cinnamon_roll", isCustomArt: true },
  { id: "cardamom_bun", emoji: "🥨", name: "Cardamom Bun (Kardemommebolle)", tags: ["cardamom_bun", "cardamom", "bun", "bolle", "bakery", "custom"], category: "bakery", isCustomArt: true },
  { id: "naan", emoji: "🫓", name: "Garlic Naan / Flatbread", tags: ["naan", "flatbread", "garlic naan", "indian", "bread", "custom"], category: "naan", isCustomArt: true },
  { id: "sourdough", emoji: "🍞", name: "Artisan Sourdough Loaf", tags: ["sourdough", "bread", "surdeig", "bakery", "loaf", "custom"], category: "bakery", isCustomArt: true },
  { id: "banh_mi", emoji: "🥖", name: "Crispy Bánh Mì Sandwich", tags: ["banh_mi", "banh mi", "vietnamese", "sandwich", "baguette", "custom"], category: "vietnamese", isCustomArt: true },
  { id: "vietnamese", emoji: "🍜", name: "Vietnamese Pho & Herbs", tags: ["vietnamese", "pho", "banh mi", "noodles", "custom"], category: "vietnamese", isCustomArt: true },
  { id: "pho", emoji: "🍜", name: "Steaming Beef Pho", tags: ["pho", "vietnamese", "noodle soup", "broth", "custom"], category: "vietnamese", isCustomArt: true },
  { id: "udon", emoji: "🍜", name: "Thick Udon Noodle Bowl", tags: ["udon", "noodles", "japanese", "soup", "custom"], category: "ramen", isCustomArt: true },
  { id: "burger", emoji: "🍔", name: "Double Smash Burger", tags: ["burger", "smash burger", "cheeseburger", "beef", "custom"], category: "burger", isCustomArt: true },
  { id: "tacos", emoji: "🌮", name: "Birria & Street Tacos", tags: ["tacos", "taco", "birria", "mexican", "corn", "custom"], category: "tacos", isCustomArt: true },
  { id: "sushi", emoji: "🍣", name: "Omakase Sushi & Nigiri", tags: ["sushi", "nigiri", "sashimi", "salmon", "japanese", "custom"], category: "sushi", isCustomArt: true },
  { id: "nordic_seafood", emoji: "🦀", name: "Nordic Seafood & Shellfish", tags: ["nordic_seafood", "seafood", "crab", "oysters", "fish", "custom"], category: "sushi", isCustomArt: true },
  { id: "curry", emoji: "🍛", name: "Rich Masala Curry Bowl", tags: ["curry", "indian", "tikka masala", "butter chicken", "custom"], category: "indian", isCustomArt: true },
  { id: "indian", emoji: "🍛", name: "Indian Thali & Spice", tags: ["indian", "curry", "biryani", "masala", "custom"], category: "indian", isCustomArt: true },
  { id: "mandi_rice", emoji: "🍚", name: "Aromatic Mandi Rice Platter", tags: ["mandi_rice", "mandi", "rice", "yemeni", "lamb", "custom"], category: "mandi_rice", isCustomArt: true },
  { id: "bibimbap", emoji: "🍲", name: "Dolsot Bibimbap Rice Bowl", tags: ["bibimbap", "korean", "rice bowl", "kimchi", "egg", "custom"], category: "k_chicken", isCustomArt: true },
  { id: "poke", emoji: "🥗", name: "Fresh Salmon Poke Bowl", tags: ["poke", "bowl", "salmon", "rice", "healthy", "custom"], category: "sushi", isCustomArt: true },
  { id: "dumplings", emoji: "🥟", name: "Pan-Seared Gyoza & Dumplings", tags: ["dumplings", "gyoza", "dim sum", "wonton", "custom"], category: "dumplings", isCustomArt: true },
  { id: "bao", emoji: "🥠", name: "Fluffy Steamed Gua Bao", tags: ["bao", "steamed bun", "pork belly", "taiwanese", "custom"], category: "dumplings", isCustomArt: true },
  { id: "kebab", emoji: "🥙", name: "Charcoal Shawarma & Kebab", tags: ["kebab", "shawarma", "doner", "pita", "grill", "custom"], category: "kebab", isCustomArt: true },
  { id: "shawarma", emoji: "🌯", name: "Levantine Shawarma Wrap", tags: ["shawarma", "kebab", "wrap", "middle eastern", "custom"], category: "kebab", isCustomArt: true },
  { id: "kbbq", emoji: "🥩", name: "Korean BBQ Charcoal Grill", tags: ["kbbq", "korean bbq", "galbi", "grill", "meat", "custom"], category: "k_chicken", isCustomArt: true },
  { id: "cheesesteak", emoji: "🥩", name: "Philly Cheesesteak Hoagie", tags: ["cheesesteak", "philly", "steak", "sandwich", "zamzam", "hoagie", "custom"], category: "cheesesteak", isCustomArt: true },
  { id: "pancakes", emoji: "🥞", name: "Japanese Soufflé Pancakes", tags: ["pancakes", "souffle", "fluffy", "dessert", "crave", "sweet", "custom"], category: "pancakes", isCustomArt: true },
  { id: "matcha", emoji: "🍵", name: "Ceremonial Whisked Matcha", tags: ["matcha", "green tea", "latte", "japanese", "custom"], category: "matcha", isCustomArt: true },
  { id: "boba", emoji: "🧋", name: "Brown Sugar Boba Milk Tea", tags: ["boba", "bubble tea", "milk tea", "pearls", "custom"], category: "matcha", isCustomArt: true },
  { id: "gelato", emoji: "🍦", name: "Artisan Pistachio Gelato", tags: ["gelato", "ice cream", "sorbet", "sweet", "custom"], category: "dessert", isCustomArt: true },
  { id: "dessert", emoji: "🍰", name: "Patisserie Tart & Dessert", tags: ["dessert", "cake", "sweet", "pastry", "custom"], category: "dessert", isCustomArt: true },
  { id: "waffle", emoji: "🧇", name: "Norwegian Heart Waffle", tags: ["waffle", "vaffel", "brunost", "sweet", "bakery", "custom"], category: "bakery", isCustomArt: true },
  { id: "bagel", emoji: "🥯", name: "Hand-Rolled Sourdough Bagel", tags: ["bagel", "cream cheese", "lox", "bakery", "brunch", "custom"], category: "bakery", isCustomArt: true },
  { id: "breakfast", emoji: "🍳", name: "Morning Eggs & Brunch Plate", tags: ["breakfast", "brunch", "eggs", "morning", "custom"], category: "bakery", isCustomArt: true },
  { id: "natural_wine", emoji: "🍷", name: "Natural & Orange Wine Glass", tags: ["natural_wine", "wine", "orange wine", "pet nat", "bar", "custom"], category: "drinks", isCustomArt: true },
  { id: "drinks", emoji: "🍸", name: "Craft Cocktail & Aperitivo", tags: ["drinks", "cocktail", "bar", "spritz", "custom"], category: "drinks", isCustomArt: true },
  { id: "street_food", emoji: "🎪", name: "Oslo Street Food Stall", tags: ["street_food", "street food", "market", "stall", "custom"], category: "street_food", isCustomArt: true },
  { id: "popup", emoji: "🎟️", name: "Pop-Up Kitchen Ticket", tags: ["popup", "pop-up", "residency", "ticket", "event", "custom"], category: "spots", isCustomArt: true },
  { id: "food_truck", emoji: "🚚", name: "Mobile Street Food Truck", tags: ["food_truck", "truck", "wagon", "street", "custom"], category: "spots", isCustomArt: true },

  // ── All 13 Hand-Painted Group Filter Icons (/icons/filters/*.webp) ──
  { id: "pastries_bakery", emoji: "🥐", name: "Pastries & Bakery (Group Art)", tags: ["pastries_bakery", "bakery", "pastries", "croissant", "group"], category: "filter_group", isCustomArt: true },
  { id: "breads", emoji: "🍞", name: "Artisan Breads (Group Art)", tags: ["breads", "sourdough", "naan", "flatbread", "group"], category: "filter_group", isCustomArt: true },
  { id: "coffee_tea", emoji: "☕", name: "Coffee, Matcha & Tea (Group Art)", tags: ["coffee_tea", "coffee", "matcha", "tea", "group"], category: "filter_group", isCustomArt: true },
  { id: "noodles_soup", emoji: "🍜", name: "Noodles & Ramen (Group Art)", tags: ["noodles_soup", "ramen", "pho", "noodles", "group"], category: "filter_group", isCustomArt: true },
  { id: "dumplings_buns", emoji: "🥟", name: "Dumplings & Bao (Group Art)", tags: ["dumplings_buns", "dumplings", "bao", "gyoza", "group"], category: "filter_group", isCustomArt: true },
  { id: "sandwiches_handhelds", emoji: "🥪", name: "Burgers, Tacos & Handhelds (Group Art)", tags: ["sandwiches_handhelds", "burger", "tacos", "banh_mi", "sandwich", "group"], category: "filter_group", isCustomArt: true },
  { id: "pizza_pasta", emoji: "🍕", name: "Pizza & Pasta (Group Art)", tags: ["pizza_pasta", "pizza", "pasta", "italian", "group"], category: "filter_group", isCustomArt: true },
  { id: "chicken_grill", emoji: "🍗", name: "Chicken, BBQ & Grill (Group Art)", tags: ["chicken_grill", "k_chicken", "fried_chicken", "kebab", "grill", "group"], category: "filter_group", isCustomArt: true },
  { id: "rice_bowls", emoji: "🍛", name: "Curry & Rice Bowls (Group Art)", tags: ["rice_bowls", "curry", "indian", "mandi_rice", "bibimbap", "group"], category: "filter_group", isCustomArt: true },
  { id: "seafood", emoji: "🍣", name: "Sushi & Nordic Seafood (Group Art)", tags: ["seafood", "sushi", "nordic_seafood", "poke", "group"], category: "filter_group", isCustomArt: true },
  { id: "sweets_frozen", emoji: "🍦", name: "Gelato & Desserts (Group Art)", tags: ["sweets_frozen", "gelato", "dessert", "ice cream", "group"], category: "filter_group", isCustomArt: true },
  { id: "drinks_bars", emoji: "🍷", name: "Wine & Cocktail Bars (Group Art)", tags: ["drinks_bars", "natural_wine", "drinks", "wine", "bar", "group"], category: "filter_group", isCustomArt: true },
  { id: "brunch", emoji: "🍳", name: "All-Day Brunch (Group Art)", tags: ["brunch", "breakfast", "eggs", "waffle", "group"], category: "filter_group", isCustomArt: true },
];

const BASE_EMOJI_CATALOG: FoodIconEntry[] = [
  // Dumplings, Dim Sum & Bao
  { id: "dumpling", emoji: "🥟", name: "Dumpling / Gyoza", tags: ["dumpling", "gyoza", "dim sum", "wonton", "momo", "potsticker"], category: "dumplings" },
  { id: "fortune_cookie", emoji: "🥠", name: "Bao / Steamed Bun", tags: ["bao", "bun", "steamed", "gua bao"], category: "bao" },
  { id: "takeout_box", emoji: "🥡", name: "Dim Sum / Wok Box", tags: ["wok", "takeout", "dim sum", "noodles", "asian"], category: "dumplings" },

  // Korean & Fried Chicken
  { id: "korean_bbq", emoji: "🥩", name: "Korean BBQ / Galbi / Steak", tags: ["bbq", "korean", "galbi", "bulgogi", "steak", "meat", "grill"], category: "fried_chicken" },
  { id: "corn_dog", emoji: "🌭", name: "Korean Corn Dog / Pølse", tags: ["corndog", "hotdog", "polse", "sausage", "street food"], category: "street_food" },
  { id: "spicy_pepper", emoji: "🌶️", name: "Gochujang / Spicy Dish", tags: ["spicy", "chili", "gochujang", "hot", "sichuan"], category: "fried_chicken" },

  // Middle Eastern, Kebab & Shawarma
  { id: "kebab_pita", emoji: "🥙", name: "Kebab / Shawarma / Pita", tags: ["kebab", "shawarma", "gyros", "pita", "doner", "döner", "middle eastern"], category: "kebab" },
  { id: "falafel", emoji: "🧆", name: "Falafel / Hummus / Mezze", tags: ["falafel", "hummus", "mezze", "vegan", "chickpea", "lebanese"], category: "kebab" },
  { id: "burrito_wrap", emoji: "🌯", name: "Dürüm / Rullekebab / Burrito", tags: ["durum", "rullekebab", "wrap", "burrito", "shawarma"], category: "kebab" },
  { id: "shish_skewer", emoji: "🍢", name: "Shish Skewer / Yakitori / Satay", tags: ["shish", "skewer", "yakitori", "satay", "grill", "kebab"], category: "kebab" },

  // Vietnamese, Thai & Southeast Asian
  { id: "spring_roll", emoji: "🥬", name: "Fresh Summer Rolls / Gỏi Cuốn", tags: ["summer roll", "spring roll", "vietnamese", "herbs", "fresh"], category: "vietnamese" },
  { id: "pad_thai", emoji: "🥘", name: "Pad Thai / Wok / Paella", tags: ["pad thai", "thai", "wok", "paella", "pan", "stir fry"], category: "vietnamese" },
  { id: "coconut_drink", emoji: "🥥", name: "Coconut Coffee / Thai Coconut", tags: ["coconut", "ca phe", "vietnamese coffee", "tropical"], category: "vietnamese" },

  // Indian & Curry
  { id: "samosa", emoji: "🥟", name: "Samosa / Pakora / Chaat", tags: ["samosa", "pakora", "chaat", "indian", "street food"], category: "indian" },
  { id: "tandoori_pot", emoji: "🏺", name: "Tandoori / Clay Oven / Handi", tags: ["tandoori", "clay pot", "handi", "biryani", "indian"], category: "indian" },

  // Ramen, Sushi & Japanese
  { id: "bento", emoji: "🍱", name: "Bento Box / Donburi", tags: ["bento", "japanese", "lunch", "donburi", "poke"], category: "sushi" },
  { id: "rice_ball", emoji: "🍙", name: "Onigiri / Hand Roll", tags: ["onigiri", "rice", "seaweed", "temaki"], category: "sushi" },
  { id: "shrimp", emoji: "🍤", name: "Tempura / Crispy Ebi", tags: ["tempura", "shrimp", "prawn", "ebi", "fried"], category: "sushi" },
  { id: "oyster", emoji: "🦪", name: "Oysters / Raw Bar / Shellfish", tags: ["oyster", "shellfish", "seafood", "raw bar"], category: "sushi" },
  { id: "crab", emoji: "🦀", name: "Nordic King Crab / Seafood", tags: ["crab", "seafood", "nordic", "shellfish"], category: "sushi" },
  { id: "lobster", emoji: "🦞", name: "Lobster Roll / Langoustine", tags: ["lobster", "langoustine", "seafood", "roll"], category: "sushi" },
  { id: "fish_cake", emoji: "🍥", name: "Narutomaki / Ramen Topping", tags: ["narutomaki", "ramen", "fish cake"], category: "ramen" },
  { id: "dango", emoji: "🍡", name: "Mochi / Dango Skewer", tags: ["dango", "mochi", "skewer", "sweet", "japanese"], category: "dessert" },

  // Tacos & Mexican
  { id: "tamale", emoji: "🫔", name: "Tamale / Enchilada", tags: ["tamale", "enchilada", "mexican", "corn"], category: "tacos" },
  { id: "avocado_guac", emoji: "🥑", name: "Guacamole / Avocado Toast", tags: ["guacamole", "avocado", "mexican", "brunch"], category: "tacos" },
  { id: "corn", emoji: "🌽", name: "Elote / Grilled Street Corn", tags: ["elote", "corn", "mexican", "street food"], category: "tacos" },

  // Burgers, Pizza & Sandwiches
  { id: "fries", emoji: "🍟", name: "Truffle / Loaded Fries", tags: ["fries", "pommes", "chips", "potatoes", "truffle"], category: "burger" },
  { id: "bacon", emoji: "🥓", name: "Crispy Bacon / Smokehouse", tags: ["bacon", "pork", "breakfast", "bbq"], category: "burger" },

  // Pasta, Italian & European
  { id: "cheese", emoji: "🧀", name: "Artisan Cheese / Brunost / Burrata", tags: ["cheese", "ost", "brunost", "burrata", "parmesan", "raclette"], category: "pasta" },
  { id: "fondue", emoji: "🫕", name: "Fondue / Melted Raclette / Dip", tags: ["fondue", "raclette", "melted", "cheese", "shakshuka"], category: "pasta" },
  { id: "olive", emoji: "🫒", name: "Olives / Tapas / Aperitivo", tags: ["olive", "tapas", "aperitivo", "mediterranean"], category: "drinks" },

  // Nordic, Bakery & Sourdough
  { id: "baguette", emoji: "🥖", name: "French Baguette / Sub", tags: ["baguette", "french", "crusty", "bread"], category: "bakery" },
  { id: "pancake", emoji: "🥞", name: "Pancakes / Crêpes / Svele", tags: ["pancake", "crepe", "svele", "breakfast", "syrup"], category: "bakery" },
  { id: "butter", emoji: "🧈", name: "Whipped Brown Butter", tags: ["butter", "smor", "bakery", "sourdough"], category: "bakery" },
  { id: "egg_brunch", emoji: "🍳", name: "Eggs Benedict / Shakshuka / Brunch", tags: ["egg", "brunch", "breakfast", "omelette", "benedict"], category: "bakery" },

  // Coffee, Matcha & Specialty Drinks
  { id: "teapot", emoji: "🫖", name: "Loose-Leaf Teapot / Chai", tags: ["teapot", "tea", "chai", "oolong", "brew"], category: "matcha" },
  { id: "mate", emoji: "🧉", name: "Yerba Maté / Kombucha", tags: ["mate", "kombucha", "herbal", "infusion"], category: "coffee" },
  { id: "ice_cube", emoji: "🧊", name: "Cold Brew / Iced Tonic", tags: ["cold brew", "iced", "espresso tonic", "summer"], category: "coffee" },

  // Sweets, Gelato & Desserts
  { id: "shaved_ice", emoji: "🍧", name: "Sorbet / Kakigori / Gelato Cup", tags: ["gelato", "sorbet", "kakigori", "bingsu", "scoop"], category: "dessert" },
  { id: "sundae", emoji: "🍨", name: "Affogato / Sundae / Tiramisu", tags: ["affogato", "tiramisu", "sundae", "dessert"], category: "dessert" },
  { id: "donut", emoji: "🍩", name: "Artisan Donut / Berlinerbolle", tags: ["donut", "doughnut", "berlinerbolle", "glazed", "brioche"], category: "dessert" },
  { id: "cookie", emoji: "🍪", name: "Levain Cookie / Biscoff", tags: ["cookie", "biscoff", "chocolate chip", "bake"], category: "dessert" },
  { id: "birthday_cake", emoji: "🎂", name: "Celebration Cake / Bakery Torta", tags: ["cake", "torta", "bakery", "celebration"], category: "dessert" },
  { id: "pie", emoji: "🥧", name: "Fruit Tart / Pecan Pie", tags: ["pie", "tart", "apple pie", "galette"], category: "dessert" },
  { id: "cupcake", emoji: "🧁", name: "Cupcake / Krembolle / Fastelavnsbolle", tags: ["cupcake", "krembolle", "fastelavnsbolle", "muffin", "cream"], category: "dessert" },
  { id: "flan", emoji: "🍮", name: "Crème Brûlée / Flan / Panna Cotta", tags: ["creme brulee", "flan", "panna cotta", "custard", "pudding"], category: "dessert" },
  { id: "chocolate", emoji: "🍫", name: "Bean-to-Bar Chocolate / Brownie", tags: ["chocolate", "sjokolade", "brownie", "cacao"], category: "dessert" },
  { id: "honey", emoji: "🍯", name: "Wild Honey / Baklava", tags: ["honey", "baklava", "sweet", "glaze"], category: "dessert" },
  { id: "strawberry", emoji: "🍓", name: "Norwegian Summer Strawberries", tags: ["strawberry", "jordbaer", "berry", "fruit"], category: "dessert" },

  // Bars, Natural Wine & Cocktails
  { id: "tropical_drink", emoji: "🍹", name: "Aperol Spritz / Negroni / Yuzu", tags: ["spritz", "negroni", "tropical", "punch", "aperol"], category: "drinks" },
  { id: "champagne", emoji: "🥂", name: "Pet-Nat / Bubbles / Cava", tags: ["champagne", "pet-nat", "prosecco", "sparkling", "cheers"], category: "drinks" },
  { id: "whisky", emoji: "🥃", name: "Whisky / Old Fashioned / Mezcal", tags: ["whisky", "bourbon", "mezcal", "old fashioned", "rocks"], category: "drinks" },
  { id: "beer", emoji: "🍺", name: "Oslo Craft Beer / Microbrewery", tags: ["beer", "ol", "ipa", "pilsner", "brewery", "sour"], category: "drinks" },
  { id: "clinking_beers", emoji: "🍻", name: "Beer Garden / Biergarten", tags: ["beers", "pub", "bar", "uteservering"], category: "drinks" },

  // Healthy, Bowls & Plant-Based
  { id: "salad", emoji: "🥗", name: "Seasonal Salad / Grain Bowl", tags: ["salad", "greens", "healthy", "vegan", "bowl"], category: "healthy" },
  { id: "bowl", emoji: "🥣", name: "Açaí / Smoothie / Porridge Bowl", tags: ["acai", "porridge", "granola", "grøt", "breakfast"], category: "healthy" },
  { id: "mushroom", emoji: "🍄", name: "Foraged Chanterelle / Nordic Bistro", tags: ["mushroom", "sopp", "foraged", "nordic", "bistro"], category: "healthy" },

  // Spot Badges & Venue Markers
  { id: "fire_popup", emoji: "🔥", name: "Viral Drop / Wood-Fired", tags: ["fire", "hot", "drop", "trending", "viral"], category: "spots" },
  { id: "restaurant", emoji: "🍽️", name: "Neighborhood Bistro / Dining", tags: ["restaurant", "dining", "bistro", "eatery"], category: "spots" },
  { id: "chef_hat", emoji: "👨‍🍳", name: "Chef's Table / Tasting Menu", tags: ["chef", "tasting", "omakase", "fine dining"], category: "spots" },
  { id: "star", emoji: "⭐", name: "Smakr Top Rated / Michelin", tags: ["star", "michelin", "award", "best"], category: "spots" },
  { id: "gem", emoji: "💎", name: "Underrated Hidden Gem", tags: ["gem", "secret", "underrated", "hidden"], category: "spots" },
  { id: "heart_fire", emoji: "❤️‍🔥", name: "Must-Try Obsession", tags: ["love", "obsession", "favorite", "must try"], category: "spots" },
  { id: "crown", emoji: "👑", name: "Oslo Legend / Hall of Fame", tags: ["crown", "king", "legend", "best"], category: "spots" },
];

// Dynamically ensure every key in DISH_ICON_WEBP, GROUP_FILTER_WEBP, and ICON_REGISTRY (dish/group) is present
function buildCompleteFoodIconsCatalog(): FoodIconEntry[] {
  const seen = new Set<string>();
  const out: FoodIconEntry[] = [];

  for (const item of CUSTOM_ART_CATALOG_ENTRIES) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }

  const allWebpAndRegistryKeys = new Set<string>([
    ...Object.keys(DISH_ICON_WEBP),
    ...Object.keys(GROUP_FILTER_WEBP),
    ...Object.keys(SMAKR_ICON_SVG_BODIES),
    ...Object.keys(ICON_REGISTRY),
  ]);

  for (const key of allWebpAndRegistryKeys) {
    if (seen.has(key) || key === "all") continue;
    const reg = ICON_REGISTRY[key];
    if (reg && (reg.kind === "cuisine" || reg.kind === "diet")) continue;
    seen.add(key);
    const label =
      reg?.label ||
      key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    out.push({
      id: key,
      emoji: "✨",
      name: label,
      tags: [key, label.toLowerCase(), ...(reg?.aliases ?? []), "custom"],
      category: reg?.parent || key,
      isCustomArt: true,
    });
  }

  for (const item of BASE_EMOJI_CATALOG) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }

  return out;
}

export const FOOD_ICONS_CATALOG: FoodIconEntry[] = buildCompleteFoodIconsCatalog();

/** Search helper for filtering the catalog by free text query */
export function searchFoodIcons(query: string): FoodIconEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_ICONS_CATALOG;
  return FOOD_ICONS_CATALOG.filter((item) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
