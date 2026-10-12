export interface FoodIconEntry {
  id: string;
  emoji: string;
  name: string;
  tags: string[];
  category: string;
}

export const FOOD_ICONS_CATALOG: FoodIconEntry[] = [
  // Dumplings & Asian Specialties
  { id: "dumpling", emoji: "🥟", name: "Dumpling / Gyoza", tags: ["dumpling", "gyoza", "dim sum", "wonton", "momo"], category: "dumplings" },
  { id: "fortune_cookie", emoji: "🥠", name: "Bao / Bun", tags: ["bao", "bun", "steamed", "cookie"], category: "bao" },
  { id: "ramen", emoji: "🍜", name: "Ramen / Noodles", tags: ["ramen", "noodles", "soup", "broth", "udon", "soba"], category: "ramen" },
  { id: "sushi", emoji: "🍣", name: "Sushi / Nigiri", tags: ["sushi", "fish", "salmon", "raw", "nigiri"], category: "sushi" },
  { id: "bento", emoji: "🍱", name: "Bento Box", tags: ["bento", "japanese", "lunch", "box"], category: "asian" },
  { id: "curry", emoji: "🍛", name: "Curry & Rice", tags: ["curry", "rice", "spicy", "indian", "japanese"], category: "asian" },
  { id: "rice_ball", emoji: "🍙", name: "Onigiri / Rice Ball", tags: ["onigiri", "rice", "seaweed"], category: "asian" },
  { id: "dango", emoji: "🍡", name: "Dango", tags: ["dango", "skewer", "sweet"], category: "dessert" },

  // Street Food, Tacos & Sandwiches
  { id: "taco", emoji: "🌮", name: "Taco", tags: ["taco", "mexican", "birria", "carnitas", "street food"], category: "tacos" },
  { id: "burrito", emoji: "🌯", name: "Burrito / Wrap", tags: ["burrito", "wrap", "shawarma", "kebab"], category: "tacos" },
  { id: "sandwich", emoji: "🥪", name: "Artisan Sandwich / Bánh Mì", tags: ["sandwich", "banh mi", "focaccia", "lunch"], category: "street_food" },
  { id: "falafel", emoji: "🧆", name: "Falafel", tags: ["falafel", "middle eastern", "vegan", "chickpea"], category: "street_food" },
  { id: "hotdog", emoji: "🌭", name: "Pølse / Hot Dog", tags: ["hotdog", "polse", "sausage"], category: "street_food" },
  { id: "food_truck", emoji: "🚚", name: "Food Truck", tags: ["truck", "food truck", "mobile", "street"], category: "spots" },
  { id: "popup_circus", emoji: "🎪", name: "Pop-up / Residency", tags: ["popup", "pop-up", "tent", "temporary", "event"], category: "spots" },
  { id: "fire_popup", emoji: "🔥", name: "Trending Drop / Pop-up", tags: ["fire", "hot", "drop", "trending"], category: "spots" },

  // Burgers & Pizza
  { id: "pizza", emoji: "🍕", name: "Wood-fired Pizza", tags: ["pizza", "slice", "cheese", "sourdough", "crust"], category: "pizza" },
  { id: "burger", emoji: "🍔", name: "Smash Burger", tags: ["burger", "smash", "cheeseburger", "beef"], category: "burger" },
  { id: "fries", emoji: "🍟", name: "Truffle Fries", tags: ["fries", "pommes", "chips", "potatoes"], category: "burger" },

  // Italian & European
  { id: "pasta", emoji: "🍝", name: "Spaghetti / Pasta", tags: ["pasta", "spaghetti", "carbonara", "italian"], category: "pasta" },
  { id: "cheese", emoji: "🧀", name: "Artisan Cheese", tags: ["cheese", "ost", "brunost", "parmesan"], category: "bakery" },
  { id: "meat_cut", emoji: "🥩", name: "Steak / Grill", tags: ["steak", "meat", "bbq", "beef"], category: "restaurant" },
  { id: "poultry", emoji: "🍗", name: "Crispy Chicken", tags: ["chicken", "wings", "crispy", "fried"], category: "street_food" },

  // Bakery & Sourdough
  { id: "croissant", emoji: "🥐", name: "Croissant / Pastry", tags: ["croissant", "pastry", "french", "butter"], category: "bakery" },
  { id: "bread", emoji: "🍞", name: "Sourdough Loaf", tags: ["bread", "sourdough", "surdeig", "loaf"], category: "bakery" },
  { id: "bagel", emoji: "🥯", name: "Bagel", tags: ["bagel", "cream cheese", "salmon", "breakfast"], category: "bakery" },
  { id: "pretzel", emoji: "🥨", name: "Pretzel", tags: ["pretzel", "kringle", "baked"], category: "bakery" },
  { id: "waffle", emoji: "🧇", name: "Norwegian Waffle", tags: ["waffle", "vaffel", "brunost", "brown cheese"], category: "bakery" },
  { id: "pancake", emoji: "🥞", name: "Pancakes", tags: ["pancake", "crepe", "breakfast", "syrup"], category: "bakery" },

  // Coffee, Matcha & Teas
  { id: "coffee", emoji: "☕", name: "Specialty Coffee / Espresso", tags: ["coffee", "espresso", "latte", "cappuccino", "brew", "kaffe"], category: "coffee" },
  { id: "matcha", emoji: "🍵", name: "Matcha / Green Tea", tags: ["matcha", "tea", "te", "hojicha", "sencha"], category: "matcha" },
  { id: "boba", emoji: "🧋", name: "Boba / Bubble Tea", tags: ["boba", "bubble tea", "milk tea", "tapioca"], category: "matcha" },
  { id: "mate", emoji: "🧉", name: "Maté / Herbal Brew", tags: ["mate", "herbal", "infusion"], category: "coffee" },
  { id: "teapot", emoji: "🫖", name: "Teapot", tags: ["teapot", "tea", "pot", "brew"], category: "matcha" },

  // Sweets & Desserts
  { id: "ice_cream", emoji: "🍦", name: "Soft Serve / Gelato", tags: ["ice cream", "soft serve", "gelato", "iskrem"], category: "dessert" },
  { id: "shaved_ice", emoji: "🍧", name: "Gelato Scoop", tags: ["gelato", "sorbet", "scoop"], category: "dessert" },
  { id: "donut", emoji: "🍩", name: "Donut / Doughnut", tags: ["donut", "doughnut", "glazed"], category: "dessert" },
  { id: "cookie", emoji: "🍪", name: "Chunky Cookie", tags: ["cookie", "chocolate chip", "bake"], category: "dessert" },
  { id: "cake", emoji: "🍰", name: "Shortcake / Pastry", tags: ["cake", "kake", "pastry", "strawberry"], category: "dessert" },
  { id: "pie", emoji: "🥧", name: "Pie / Tart", tags: ["pie", "tart", "apple pie"], category: "dessert" },
  { id: "cupcake", emoji: "🧁", name: "Cupcake", tags: ["cupcake", "frosting", "muffin"], category: "dessert" },
  { id: "chocolate", emoji: "🍫", name: "Bean-to-Bar Chocolate", tags: ["chocolate", "sjokolade", "cacao"], category: "dessert" },

  // Drinks & Bars
  { id: "cocktail", emoji: "🍸", name: "Craft Cocktail", tags: ["cocktail", "martini", "bar", "drinks"], category: "drinks" },
  { id: "tropical_drink", emoji: "🍹", name: "Tropical / Spritz", tags: ["spritz", "tropical", "punch", "aperol"], category: "drinks" },
  { id: "wine", emoji: "🍷", name: "Natural Wine", tags: ["wine", "vin", "red wine", "orange wine"], category: "drinks" },
  { id: "champagne", emoji: "🥂", name: "Sparkling / Pet-Nat", tags: ["champagne", "prosecco", "sparkling", "cheers"], category: "drinks" },
  { id: "beer", emoji: "🍺", name: "Craft Beer / Brygg", tags: ["beer", "ol", "ipa", "pilsner", "brewery"], category: "drinks" },
  { id: "clinking_beers", emoji: "🍻", name: "Beer Stein", tags: ["beers", "pub", "bar"], category: "drinks" },

  // Healthy & Fresh
  { id: "salad", emoji: "🥗", name: "Green Salad / Bowl", tags: ["salad", "greens", "healthy", "vegan"], category: "healthy" },
  { id: "avocado", emoji: "🥑", name: "Avocado Toast", tags: ["avocado", "toast", "brunch"], category: "healthy" },
  { id: "bowl", emoji: "🥣", name: "Acai / Porridge Bowl", tags: ["acai", "porridge", "granola", "breakfast"], category: "healthy" },
  { id: "mushroom", emoji: "🍄", name: "Foraged Mushroom", tags: ["mushroom", "sopp", "foraged", "nordic"], category: "healthy" },

  // Icons for Venue Types
  { id: "restaurant", emoji: "🍽️", name: "Fine / Casual Dining", tags: ["restaurant", "dining", "eatery"], category: "spots" },
  { id: "star", emoji: "⭐", name: "Michelin / Star Pick", tags: ["star", "michelin", "award", "best"], category: "spots" },
  { id: "gem", emoji: "💎", name: "Hidden Gem", tags: ["gem", "secret", "underrated", "hidden"], category: "spots" },
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
