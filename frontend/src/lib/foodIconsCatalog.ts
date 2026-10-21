export interface FoodIconEntry {
  id: string;
  emoji: string;
  name: string;
  tags: string[];
  category: string;
}

export const FOOD_ICONS_CATALOG: FoodIconEntry[] = [
  // Dumplings, Dim Sum & Bao
  { id: "dumpling", emoji: "🥟", name: "Dumpling / Gyoza", tags: ["dumpling", "gyoza", "dim sum", "wonton", "momo", "potsticker"], category: "dumplings" },
  { id: "fortune_cookie", emoji: "🥠", name: "Bao / Steamed Bun", tags: ["bao", "bun", "steamed", "gua bao"], category: "bao" },
  { id: "takeout_box", emoji: "🥡", name: "Dim Sum / Wok Box", tags: ["wok", "takeout", "dim sum", "noodles", "asian"], category: "dumplings" },

  // Korean & Fried Chicken
  { id: "fried_chicken", emoji: "🍗", name: "Korean Fried Chicken / Wings", tags: ["chicken", "korean", "wings", "crispy", "fried", "yangnyeom", "kfc"], category: "fried_chicken" },
  { id: "korean_bbq", emoji: "🥩", name: "Korean BBQ / Galbi / Steak", tags: ["bbq", "korean", "galbi", "bulgogi", "steak", "meat", "grill"], category: "fried_chicken" },
  { id: "bibimbap", emoji: "🍲", name: "Bibimbap / Tteokbokki / Hotpot", tags: ["bibimbap", "tteokbokki", "hotpot", "kimchi", "stew", "korean"], category: "fried_chicken" },
  { id: "corn_dog", emoji: "🌭", name: "Korean Corn Dog / Pølse", tags: ["corndog", "hotdog", "polse", "sausage", "street food"], category: "street_food" },
  { id: "spicy_pepper", emoji: "🌶️", name: "Gochujang / Spicy Dish", tags: ["spicy", "chili", "gochujang", "hot", "sichuan"], category: "fried_chicken" },

  // Middle Eastern, Kebab & Shawarma
  { id: "kebab_pita", emoji: "🥙", name: "Kebab / Shawarma / Pita", tags: ["kebab", "shawarma", "gyros", "pita", "doner", "döner", "middle eastern"], category: "kebab" },
  { id: "falafel", emoji: "🧆", name: "Falafel / Hummus / Mezze", tags: ["falafel", "hummus", "mezze", "vegan", "chickpea", "lebanese"], category: "kebab" },
  { id: "burrito_wrap", emoji: "🌯", name: "Dürüm / Rullekebab / Burrito", tags: ["durum", "rullekebab", "wrap", "burrito", "shawarma"], category: "kebab" },
  { id: "shish_skewer", emoji: "🍢", name: "Shish Skewer / Yakitori / Satay", tags: ["shish", "skewer", "yakitori", "satay", "grill", "kebab"], category: "kebab" },
  { id: "flatbread", emoji: "🫓", name: "Lahmacun / Manakish / Naan", tags: ["lahmacun", "naan", "flatbread", "pita", "zaatar"], category: "kebab" },

  // Vietnamese, Thai & Southeast Asian
  { id: "pho_bowl", emoji: "🍜", name: "Pho / Ramen / Noodle Soup", tags: ["pho", "ramen", "noodles", "soup", "broth", "udon", "bun bo hue", "vietnamese"], category: "vietnamese" },
  { id: "banh_mi", emoji: "🥪", name: "Bánh Mì / Artisan Sandwich", tags: ["banh mi", "bánh mì", "sandwich", "focaccia", "sando", "vietnamese"], category: "vietnamese" },
  { id: "spring_roll", emoji: "🥬", name: "Fresh Summer Rolls / Gỏi Cuốn", tags: ["summer roll", "spring roll", "vietnamese", "herbs", "fresh"], category: "vietnamese" },
  { id: "pad_thai", emoji: "🥘", name: "Pad Thai / Wok / Paella", tags: ["pad thai", "thai", "wok", "paella", "pan", "stir fry"], category: "vietnamese" },
  { id: "coconut_drink", emoji: "🥥", name: "Coconut Coffee / Thai Coconut", tags: ["coconut", "ca phe", "vietnamese coffee", "tropical"], category: "vietnamese" },

  // Indian & Curry
  { id: "curry_rice", emoji: "🍛", name: "Indian Curry / Tikka Masala / Biryani", tags: ["curry", "indian", "masala", "tikka", "butter chicken", "biryani", "dal", "vindaloo"], category: "indian" },
  { id: "samosa", emoji: "🥟", name: "Samosa / Pakora / Chaat", tags: ["samosa", "pakora", "chaat", "indian", "street food"], category: "indian" },
  { id: "tandoori_pot", emoji: "🏺", name: "Tandoori / Clay Oven / Handi", tags: ["tandoori", "clay pot", "handi", "biryani", "indian"], category: "indian" },

  // Ramen, Sushi & Japanese
  { id: "sushi", emoji: "🍣", name: "Sushi / Nigiri / Sashimi", tags: ["sushi", "fish", "salmon", "raw", "nigiri", "maki", "omakase"], category: "sushi" },
  { id: "bento", emoji: "🍱", name: "Bento Box / Donburi", tags: ["bento", "japanese", "lunch", "donburi", "poke"], category: "sushi" },
  { id: "rice_ball", emoji: "🍙", name: "Onigiri / Hand Roll", tags: ["onigiri", "rice", "seaweed", "temaki"], category: "sushi" },
  { id: "shrimp", emoji: "🍤", name: "Tempura / Crispy Ebi", tags: ["tempura", "shrimp", "prawn", "ebi", "fried"], category: "sushi" },
  { id: "oyster", emoji: "🦪", name: "Oysters / Raw Bar / Shellfish", tags: ["oyster", "shellfish", "seafood", "raw bar"], category: "sushi" },
  { id: "crab", emoji: "🦀", name: "Nordic King Crab / Seafood", tags: ["crab", "seafood", "nordic", "shellfish"], category: "sushi" },
  { id: "lobster", emoji: "🦞", name: "Lobster Roll / Langoustine", tags: ["lobster", "langoustine", "seafood", "roll"], category: "sushi" },
  { id: "fish_cake", emoji: "🍥", name: "Narutomaki / Ramen Topping", tags: ["narutomaki", "ramen", "fish cake"], category: "ramen" },
  { id: "dango", emoji: "🍡", name: "Mochi / Dango Skewer", tags: ["dango", "mochi", "skewer", "sweet", "japanese"], category: "dessert" },

  // Tacos & Mexican
  { id: "taco", emoji: "🌮", name: "Birria / Street Taco", tags: ["taco", "mexican", "birria", "carnitas", "al pastor"], category: "tacos" },
  { id: "tamale", emoji: "🫔", name: "Tamale / Enchilada", tags: ["tamale", "enchilada", "mexican", "corn"], category: "tacos" },
  { id: "avocado_guac", emoji: "🥑", name: "Guacamole / Avocado Toast", tags: ["guacamole", "avocado", "mexican", "brunch"], category: "tacos" },
  { id: "corn", emoji: "🌽", name: "Elote / Grilled Street Corn", tags: ["elote", "corn", "mexican", "street food"], category: "tacos" },

  // Burgers, Pizza & Sandwiches
  { id: "pizza", emoji: "🍕", name: "Wood-fired Sourdough Pizza", tags: ["pizza", "slice", "cheese", "sourdough", "nduja", "margherita"], category: "pizza" },
  { id: "burger", emoji: "🍔", name: "Smash Burger / Cheeseburger", tags: ["burger", "smash", "cheeseburger", "beef", "sliders"], category: "burger" },
  { id: "fries", emoji: "🍟", name: "Truffle / Loaded Fries", tags: ["fries", "pommes", "chips", "potatoes", "truffle"], category: "burger" },
  { id: "bacon", emoji: "🥓", name: "Crispy Bacon / Smokehouse", tags: ["bacon", "pork", "breakfast", "bbq"], category: "burger" },

  // Pasta, Italian & European
  { id: "pasta", emoji: "🍝", name: "Handmade Pasta / Rigatoni", tags: ["pasta", "spaghetti", "carbonara", "rigatoni", "italian", "truffle"], category: "pasta" },
  { id: "cheese", emoji: "🧀", name: "Artisan Cheese / Brunost / Burrata", tags: ["cheese", "ost", "brunost", "burrata", "parmesan", "raclette"], category: "pasta" },
  { id: "fondue", emoji: "🫕", name: "Fondue / Melted Raclette / Dip", tags: ["fondue", "raclette", "melted", "cheese", "shakshuka"], category: "pasta" },
  { id: "olive", emoji: "🫒", name: "Olives / Tapas / Aperitivo", tags: ["olive", "tapas", "aperitivo", "mediterranean"], category: "drinks" },

  // Nordic, Bakery & Sourdough
  { id: "croissant", emoji: "🥐", name: "Croissant / Flaky Pastry", tags: ["croissant", "pastry", "french", "butter", "viennoiserie"], category: "bakery" },
  { id: "cinnamon_bun", emoji: "🥨", name: "Cardamom / Cinnamon Knot (Kanelbolle)", tags: ["cardamom", "cinnamon", "kanelbolle", "kardemommebolle", "knot", "bun", "pretzel", "bolle"], category: "bakery" },
  { id: "bread", emoji: "🍞", name: "Sourdough Loaf (Surdeigsbrød)", tags: ["bread", "sourdough", "surdeig", "loaf", "toast"], category: "bakery" },
  { id: "baguette", emoji: "🥖", name: "French Baguette / Sub", tags: ["baguette", "french", "crusty", "bread"], category: "bakery" },
  { id: "bagel", emoji: "🥯", name: "Sourdough Bagel & Cream Cheese", tags: ["bagel", "cream cheese", "salmon", "lox", "breakfast"], category: "bakery" },
  { id: "waffle", emoji: "🧇", name: "Norwegian Heart Waffle (Vaffel)", tags: ["waffle", "vaffel", "brunost", "brown cheese", "norwegian"], category: "bakery" },
  { id: "pancake", emoji: "🥞", name: "Pancakes / Crêpes / Svele", tags: ["pancake", "crepe", "svele", "breakfast", "syrup"], category: "bakery" },
  { id: "butter", emoji: "🧈", name: "Whipped Brown Butter", tags: ["butter", "smor", "bakery", "sourdough"], category: "bakery" },
  { id: "egg_brunch", emoji: "🍳", name: "Eggs Benedict / Shakshuka / Brunch", tags: ["egg", "brunch", "breakfast", "omelette", "benedict"], category: "bakery" },

  // Coffee, Matcha & Specialty Drinks
  { id: "coffee", emoji: "☕", name: "Specialty Coffee / Cortado / V60", tags: ["coffee", "espresso", "latte", "cappuccino", "brew", "kaffe", "cortado"], category: "coffee" },
  { id: "matcha", emoji: "🍵", name: "Ceremonial Matcha / Chawan Bowl", tags: ["matcha", "tea", "te", "hojicha", "sencha", "green tea"], category: "matcha" },
  { id: "boba", emoji: "🧋", name: "Iced Matcha Latte / Boba / Milk Tea", tags: ["boba", "iced matcha", "biscoff matcha", "iced coffee", "bubble tea", "milk tea"], category: "matcha" },
  { id: "teapot", emoji: "🫖", name: "Loose-Leaf Teapot / Chai", tags: ["teapot", "tea", "chai", "oolong", "brew"], category: "matcha" },
  { id: "mate", emoji: "🧉", name: "Yerba Maté / Kombucha", tags: ["mate", "kombucha", "herbal", "infusion"], category: "coffee" },
  { id: "ice_cube", emoji: "🧊", name: "Cold Brew / Iced Tonic", tags: ["cold brew", "iced", "espresso tonic", "summer"], category: "coffee" },

  // Sweets, Gelato & Desserts
  { id: "ice_cream", emoji: "🍦", name: "Soft Serve / Artisan Gelato", tags: ["ice cream", "soft serve", "gelato", "iskrem", "pistachio"], category: "dessert" },
  { id: "shaved_ice", emoji: "🍧", name: "Sorbet / Kakigori / Gelato Cup", tags: ["gelato", "sorbet", "kakigori", "bingsu", "scoop"], category: "dessert" },
  { id: "sundae", emoji: "🍨", name: "Affogato / Sundae / Tiramisu", tags: ["affogato", "tiramisu", "sundae", "dessert"], category: "dessert" },
  { id: "donut", emoji: "🍩", name: "Artisan Donut / Berlinerbolle", tags: ["donut", "doughnut", "berlinerbolle", "glazed", "brioche"], category: "dessert" },
  { id: "cookie", emoji: "🍪", name: "Levain Cookie / Biscoff", tags: ["cookie", "biscoff", "chocolate chip", "bake"], category: "dessert" },
  { id: "cake", emoji: "🍰", name: "Basque Cheesecake / Layered Slice", tags: ["cake", "cheesecake", "kake", "pastry", "strawberry"], category: "dessert" },
  { id: "birthday_cake", emoji: "🎂", name: "Celebration Cake / Bakery Torta", tags: ["cake", "torta", "bakery", "celebration"], category: "dessert" },
  { id: "pie", emoji: "🥧", name: "Fruit Tart / Pecan Pie", tags: ["pie", "tart", "apple pie", "galette"], category: "dessert" },
  { id: "cupcake", emoji: "🧁", name: "Cupcake / Krembolle / Fastelavnsbolle", tags: ["cupcake", "krembolle", "fastelavnsbolle", "muffin", "cream"], category: "dessert" },
  { id: "flan", emoji: "🍮", name: "Crème Brûlée / Flan / Panna Cotta", tags: ["creme brulee", "flan", "panna cotta", "custard", "pudding"], category: "dessert" },
  { id: "chocolate", emoji: "🍫", name: "Bean-to-Bar Chocolate / Brownie", tags: ["chocolate", "sjokolade", "brownie", "cacao"], category: "dessert" },
  { id: "honey", emoji: "🍯", name: "Wild Honey / Baklava", tags: ["honey", "baklava", "sweet", "glaze"], category: "dessert" },
  { id: "strawberry", emoji: "🍓", name: "Norwegian Summer Strawberries", tags: ["strawberry", "jordbaer", "berry", "fruit"], category: "dessert" },

  // Bars, Natural Wine & Cocktails
  { id: "cocktail", emoji: "🍸", name: "Craft Cocktail / Martini Bar", tags: ["cocktail", "martini", "bar", "drinks", "speakeasy"], category: "drinks" },
  { id: "tropical_drink", emoji: "🍹", name: "Aperol Spritz / Negroni / Yuzu", tags: ["spritz", "negroni", "tropical", "punch", "aperol"], category: "drinks" },
  { id: "wine", emoji: "🍷", name: "Natural Wine / Orange Wine Bar", tags: ["wine", "vin", "red wine", "orange wine", "natty"], category: "drinks" },
  { id: "champagne", emoji: "🥂", name: "Pet-Nat / Bubbles / Cava", tags: ["champagne", "pet-nat", "prosecco", "sparkling", "cheers"], category: "drinks" },
  { id: "whisky", emoji: "🥃", name: "Whisky / Old Fashioned / Mezcal", tags: ["whisky", "bourbon", "mezcal", "old fashioned", "rocks"], category: "drinks" },
  { id: "beer", emoji: "🍺", name: "Oslo Craft Beer / Microbrewery", tags: ["beer", "ol", "ipa", "pilsner", "brewery", "sour"], category: "drinks" },
  { id: "clinking_beers", emoji: "🍻", name: "Beer Garden / Biergarten", tags: ["beers", "pub", "bar", "uteservering"], category: "drinks" },

  // Healthy, Bowls & Plant-Based
  { id: "salad", emoji: "🥗", name: "Seasonal Salad / Poke / Grain Bowl", tags: ["salad", "greens", "healthy", "vegan", "poke", "bowl"], category: "healthy" },
  { id: "bowl", emoji: "🥣", name: "Açaí / Smoothie / Porridge Bowl", tags: ["acai", "porridge", "granola", "grøt", "breakfast"], category: "healthy" },
  { id: "mushroom", emoji: "🍄", name: "Foraged Chanterelle / Nordic Bistro", tags: ["mushroom", "sopp", "foraged", "nordic", "bistro"], category: "healthy" },

  // Spot Badges & Venue Markers
  { id: "food_truck", emoji: "🚚", name: "Street Food Truck / Wagon", tags: ["truck", "food truck", "mobile", "street"], category: "spots" },
  { id: "popup_ticket", emoji: "🎟️", name: "Pop-up / Residency Ticket", tags: ["popup", "pop-up", "ticket", "residency", "temporary", "event"], category: "spots" },
  { id: "fire_popup", emoji: "🔥", name: "Viral Drop / Wood-Fired", tags: ["fire", "hot", "drop", "trending", "viral"], category: "spots" },
  { id: "restaurant", emoji: "🍽️", name: "Neighborhood Bistro / Dining", tags: ["restaurant", "dining", "bistro", "eatery"], category: "spots" },
  { id: "chef_hat", emoji: "👨‍🍳", name: "Chef's Table / Tasting Menu", tags: ["chef", "tasting", "omakase", "fine dining"], category: "spots" },
  { id: "star", emoji: "⭐", name: "Smakr Top Rated / Michelin", tags: ["star", "michelin", "award", "best"], category: "spots" },
  { id: "gem", emoji: "💎", name: "Underrated Hidden Gem", tags: ["gem", "secret", "underrated", "hidden"], category: "spots" },
  { id: "heart_fire", emoji: "❤️‍🔥", name: "Must-Try Obsession", tags: ["love", "obsession", "favorite", "must try"], category: "spots" },
  { id: "crown", emoji: "👑", name: "Oslo Legend / Hall of Fame", tags: ["crown", "king", "legend", "best"], category: "spots" },
];

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
