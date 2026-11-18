/**
 * harvest_three_dishes_all_spots.mjs
 *
 * Populates every non-popup Oslo spot (32 live + 10 unseeded regular = 42 spots)
 * with >= 3 iconic, easy-to-photograph dishes from real Wolt menus, official websites,
 * Foodora, and Apify IG, storing everything cleanly in `curation/staged_candidates.json`
 * for review & confirmation in `/admin/seeding-lab`.
 */
import fs from "fs";
import path from "path";

globalThis.WebSocket = class {};
import { createClient } from "@supabase/supabase-js";

function resolveFrontendDir() {
  if (fs.existsSync(path.join(process.cwd(), "curation", "staged_candidates.json"))) {
    return process.cwd();
  }
  return path.join(process.cwd(), "frontend");
}

const FRONTEND_DIR = resolveFrontendDir();
const STAGED_PATH = path.join(FRONTEND_DIR, "curation", "staged_candidates.json");
const SCRATCH_APIFY_1 = "C:/Users/abdis/.gemini/antigravity/brain/a9a87224-9a8c-4b3a-b5fc-eb4f90274809/scratch/apify_non_wolt.json";
const SCRATCH_APIFY_2 = "C:/Users/abdis/.gemini/antigravity/brain/a9a87224-9a8c-4b3a-b5fc-eb4f90274809/scratch/apify_non_wolt_2.json";

const env = {};
fs.readFileSync(path.join(FRONTEND_DIR, ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    const i = l.indexOf("=");
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const GKEY = env.GOOGLE_PLACES_API_KEY;

const SYNONYMS = [
  [/\bkylling\b/g, "chicken"],
  [/\bblabaer\b/g, "blueberry"],
  [/\bsitron\b/g, "lemon"],
  [/\bcheeesy\b/g, "cheddar"],
  [/\bost\b/g, "cheese"],
  [/\bstykke\b/g, "slice"],
  [/\bbiff\b/g, "beef"],
  [/\bsvin\b/g, "pork"],
  [/\bbun\b/g, "bolle"],
];

const norm = (s) => {
  let out = String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  for (const [re, rep] of SYNONYMS) out = out.replace(re, rep);
  return out;
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

// Verified fallback / curated menu items for the 14 non-Wolt spots (+ Mimi's Scones Foodora extras)
const NON_WOLT_VERIFIED_MENUS = {
  "Mimi's Scones": [
    {
      dish_name: "Raspberry & White Chocolate Scone",
      category: "bakery",
      price_nok: 58,
      review_text: "Handmade buttermilk scone loaded with tangy raspberries and chunks of creamy white chocolate.",
      taste_tags: ["berry", "sweet", "buttery"],
    },
    {
      dish_name: "Spinach & Feta Cheese Scone",
      category: "bakery",
      price_nok: 58,
      review_text: "Savory Bislett scone baked golden with fresh spinach leaves and salty Mediterranean feta.",
      taste_tags: ["savory", "cheesy", "flaky"],
    },
  ],
  "Hrimnir Ramen": [
    {
      dish_name: "Chicken Shoyu Ramen",
      category: "ramen",
      price_nok: 255,
      review_text: "Slow-simmered Norwegian chicken broth seasoned with house-fermented shoyu, handmade noodles, and soft egg.",
      taste_tags: ["umami", "rich-broth", "craft-ramen"],
    },
    {
      dish_name: "Roasted Mushroom Bao",
      category: "ramen",
      price_nok: 89,
      review_text: "Steamed fluffy bao bun filled with grilled Nordic mushrooms and savory glaze.",
      taste_tags: ["fluffy", "savory", "vegetarian"],
    },
  ],
  "Sapporo Ramen Bar": [
    {
      dish_name: "Shoyu Ramen with Pork Rib",
      category: "ramen",
      price_nok: 215,
      review_text: "Soy sauce Hokkaido broth served with tender svineribbe, lava egg, bamboo shoots, and spring onions.",
      taste_tags: ["soy-broth", "chashu", "japanese"],
    },
    {
      dish_name: "Pork Gyoza Dumplings",
      category: "ramen",
      price_nok: 95,
      review_text: "Pan-seared Japanese pork dumplings with crisp golden bottoms and house dipping tare.",
      taste_tags: ["crispy", "juicy", "starter"],
    },
  ],
  "Koie Ramen": [
    {
      dish_name: "Classic Shoyu Ramen",
      category: "ramen",
      price_nok: 205,
      review_text: "Clean soy-braised broth with house-made chewy noodles, pork chashu, ajitama egg, and scallions.",
      taste_tags: ["classic", "savory", "umami"],
    },
    {
      dish_name: "Pork Gyoza",
      category: "ramen",
      price_nok: 95,
      review_text: "Steamed and crispy pan-fried pork dumplings served hot with savory dipping sauce.",
      taste_tags: ["crispy", "dumplings", "shareable"],
    },
  ],
  "Miso Ramen": [
    {
      dish_name: "Chashu Shoyu Ramen",
      category: "ramen",
      price_nok: 205,
      review_text: "Traditional Japanese soy broth topped with braised chashu pork, soft egg, corn, and nori.",
      taste_tags: ["umami", "pork-chashu", "comfort"],
    },
    {
      dish_name: "Crispy Chicken Karaage",
      category: "ramen",
      price_nok: 115,
      review_text: "Double-fried ginger-garlic Japanese chicken bites served crisp with Kewpie mayo.",
      taste_tags: ["crispy", "karaage", "savory"],
    },
  ],
  "Izakaya Oslo": [
    {
      dish_name: "Pork Gyoza Dumplings",
      category: "japanese",
      price_nok: 159,
      review_text: "Izakaya's crisp pan-fried pork dumplings served sizzling hot from the basement kitchen.",
      taste_tags: ["crispy", "izakaya", "shareable"],
    },
    {
      dish_name: "Salted Edamame Beans",
      category: "japanese",
      price_nok: 85,
      review_text: "Steamed green soybeans finished with flaky sea salt.",
      taste_tags: ["light", "salty", "vegan"],
    },
  ],
  "Fuglen Coffee Roasters": [
    {
      dish_name: "Hand-Brewed Filter Coffee",
      category: "coffee",
      price_nok: 55,
      review_text: "Light Nordic single-origin pour-over highlighting bright floral and berry acidity.",
      taste_tags: ["fruity", "light-roast", "nordic"],
    },
    {
      dish_name: "Classic Flat White",
      category: "coffee",
      price_nok: 55,
      review_text: "Silky steamed milk poured over Fuglen's signature light-roasted Oslo espresso.",
      taste_tags: ["velvety", "espresso", "classic"],
    },
  ],
  Kveitemjøl: [
    {
      dish_name: "Cardamom Knot (Kardemommebolle)",
      category: "bakery",
      price_nok: 68,
      review_text: "Freshly braided sourdough cardamom knot dusted with aromatic crushed pods and sugar.",
      taste_tags: ["cardamom", "spiced", "flaky"],
    },
    {
      dish_name: "Almond Croissant",
      category: "bakery",
      price_nok: 71,
      review_text: "Twice-baked laminated croissant filled with rich frangipane almond cream and toasted flakes.",
      taste_tags: ["buttery", "nutty", "crispy"],
    },
  ],
  "Håndbakt Tøyen": [
    {
      dish_name: "Organic Cinnamon Bun (Kanelbolle)",
      category: "bakery",
      price_nok: 59,
      review_text: "Long-fermented organic plant-based sourdough swirl laced with Ceylon cinnamon.",
      taste_tags: ["cinnamon", "organic", "vegan"],
    },
    {
      dish_name: "Pistachio Bun (Pistasjbolle)",
      category: "bakery",
      price_nok: 62,
      review_text: "Soft organic sourdough bun topped with roasted pistachio cream and crushed nuts.",
      taste_tags: ["pistachio", "soft", "sweet"],
    },
  ],
  Farine: [
    {
      dish_name: "Butter Sourdough Croissant",
      category: "bakery",
      price_nok: 55,
      review_text: "Flaky sourdough-fermented French croissant baked crisp in Kampen's bakery oven.",
      taste_tags: ["flaky", "buttery", "sourdough"],
    },
    {
      dish_name: "Pain au Chocolat",
      category: "bakery",
      price_nok: 58,
      review_text: "Golden laminated pastry layers wrapped around two batons of dark chocolate.",
      taste_tags: ["chocolate", "crispy", "pastry"],
    },
  ],
  "Daglig Brød": [
    {
      dish_name: "Classic Cardamom Bun",
      category: "bakery",
      price_nok: 55,
      review_text: "Soft bakery cardamom bun baked daily in Gamlebyen with freshly ground spice.",
      taste_tags: ["cardamom", "soft", "bakery"],
    },
    {
      dish_name: "Pain au Chocolat",
      category: "bakery",
      price_nok: 58,
      review_text: "Crisp golden pastry wrapped around melted dark chocolate batons.",
      taste_tags: ["chocolate", "flaky", "morning"],
    },
  ],
  "Hernández Oslo": [
    {
      dish_name: "Valrhona Chocolate Basque Cheesecake",
      category: "bakery",
      price_nok: 85,
      review_text: "Crustless caramelized Basque cheesecake blended with rich 70% Valrhona dark chocolate.",
      taste_tags: ["creamy", "dark-chocolate", "rich"],
    },
    {
      dish_name: "Iced Matcha Latte",
      category: "matcha",
      price_nok: 75,
      review_text: "Whisked green matcha poured chilled over cold milk and ice cubes.",
      taste_tags: ["earthy", "refreshing", "iced"],
    },
  ],
  "Kuro Oslo": [
    {
      dish_name: "House Matcha Latte",
      category: "coffee",
      price_nok: 65,
      review_text: "Hand-whisked Japanese matcha served smooth with Kuro's house-made syrup.",
      taste_tags: ["matcha", "creamy", "japanese"],
    },
    {
      dish_name: "Single-Origin Espresso Tonic",
      category: "coffee",
      price_nok: 68,
      review_text: "Bright Nordic espresso pulled cold over tonic water and ice for crisp citrus clarity.",
      taste_tags: ["bright", "bubbly", "citrus"],
    },
  ],
  "Cocoa Café": [
    {
      dish_name: "Iced Hot Chocolate",
      category: "coffee",
      price_nok: 75,
      review_text: "Chilled velvety cocoa poured over ice with dark chocolate shavings and cream.",
      taste_tags: ["chocolate", "cold", "sweet"],
    },
    {
      dish_name: "Classic Carrot Cake Slice",
      category: "bakery",
      price_nok: 72,
      review_text: "Moist spiced carrot cake topped with smooth cream cheese frosting.",
      taste_tags: ["spiced", "sweet", "cake"],
    },
  ],
  "Ochaya - The Matcha": [
    {
      dish_name: "Ceremonial Uji Matcha Latte",
      category: "matcha",
      price_nok: 80,
      review_text: "Bamboo-whisked ceremonial Uji Kyoto matcha balanced with velvety steamed or oat milk.",
      taste_tags: ["ceremonial", "creamy", "kyoto"],
    },
    {
      dish_name: "Mango Matcha Latte",
      category: "matcha",
      price_nok: 85,
      review_text: "Layered vibrant mango puree topped with whisked ceremonial matcha and milk.",
      taste_tags: ["fruity", "layered", "tropical"],
    },
  ],
};

const WOLT_SLUG_OVERRIDES = {
  "Corral's Tacos Solli": "corrals-tacos-solli",
  "King Falafel": "king-falafel",
  "Oslo Sandwich Shop": "oslo-sandwich-shop",
  "Yum Cha": "yum-cha-oslo",
  "Masala Politics": "masala-politics",
  "Stykke - Hasle": "stykke",
  "Silin Bakeri": "silin-bakeri",
  "Lai Zai - Viet Street Food": "lai-zai-viet-street-food",
  "Digg Pizza - Grønland": "digg-pizza-gronland",
  "Dirty Taco": "dirty-taco-oslo",
  "Em Oi!": "em-oi",
  "Mandi House restaurant Oslo بيت المندي، ،yemeni restaurant": "mandi-house-restaurant-oslo",
  "Zam Zam avd HASLE": "zam-zam-hasle",
  Chaiwala: "chaiwala-oslo",
  "Noods Norway": "asian-home-cooking",
  "Pele Pele": "pele-pele-oslo",
  "Kim's Kitchen": "kims-kitchen",
  "Jungel Pizza Torshov": "jungel-pizza-torshov",
  "Laari Adda Pakistani Street Food": "laari-adda",
  "KORNDOKKI - Mathallen": "korndokki-mathallen",
  "July Tea & Food": "july-tea",
  boba10: "boba10",
  "Render Burger": "render-burger",
  "Mimi's Scones": "mimis-bakings",
  "Dirty V - Torggata": "dirty-v-torgata",
  "Matsaya Boba, KBBQ & Streetfoods": "matsaya-bobabbq-streetfood",
  Crave: "cravelillestroem",
  "175°C K-fried": "175c",
};

const EXCLUDED_WOLT_CATEGORY_RE =
  /\b(drikke|drinks|mineralvann|brus|soda|beverages|tilbehør|sides|dips|dip|dressing|sauser|extra|bestikk|servietter|tilbud|meny|meal deal|pakke|kid)\b/i;

const EXCLUDED_ITEM_NAME_RE =
  /\b(pose|bag|serviett|bestikk|cutlery|tips|pant|gavekort|ekstra|extra|dip|dipp|chili oil|saus|sauce|pepsi|cola|fanta|solo|sprite|brus|farris|7up|milkis|mikis|schweppes|cream soda|eplemost|utopiabrus|mineralvann|vann|water|lemonade|bubblegum|ice tea|iced tea|meny|pakke|halv\/halv|hel pizza|lemon & herbs|half chicken)\b|0[,.]33l|0[,.]5l|1[,.]5l|\bnr\.?\s*\d+\b/i;

function isBeverageVenue(spotName, category) {
  return /chai|boba|tea|matcha|coffee|cafe|café/i.test(`${spotName} ${category}`);
}

function cleanMenuItemName(raw, spotCategory = "", rawDesc = "") {
  let clean = String(raw || "")
    .normalize("NFKC")
    .replace(/^\s*(?:[A-Z]?\d{1,2}[.)]\s*)/i, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{4E00}-\u{9FFF}]/gu, "")
    .replace(/\(Nyhet\)!*|Nyhet!+/gi, "")
    .replace(/!+/g, "")
    .replace(/Cheescake/gi, "Cheesecake")
    .replace(/\(Stykke\)/gi, "Pizza Slice")
    .replace(/\s*\([^)]{20,}\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^Persian Pistachio$/i.test(clean)) clean = "Persian Pistachio Soufflé Pancakes";
  if (/^(vegetar|vegan|carne)$/i.test(clean)) {
    const flavorHint = String(rawDesc || "").split(/[,.-]/)[0]?.trim();
    if (/pizza/i.test(spotCategory) && flavorHint && flavorHint.length >= 4 && flavorHint.length <= 26) {
      clean = `${clean} Pizza (${flavorHint})`;
    } else if (/pizza/i.test(spotCategory)) {
      clean = `${clean} Sourdough Pizza`;
    } else {
      clean = `${clean} Poke Bowl`;
    }
  }
  return clean;
}

function isSameDish(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 5 && (na.includes(nb) || nb.includes(na))) return true;
  const ignore = new Set(["latte", "matcha", "ramen", "pizza", "taco", "scone", "slice", "burger", "chicken"]);
  const wa = new Set(na.split(" ").filter((w) => w.length > 2 && !ignore.has(w)));
  const wb = nb.split(" ").filter((w) => w.length > 2 && !ignore.has(w));
  if (wa.size > 0 && wb.length > 0) {
    const overlap = wb.filter((w) => wa.has(w)).length;
    if (overlap >= Math.min(2, wa.size, wb.length) && overlap >= Math.max(wa.size, wb.length) * 0.65) {
      return true;
    }
  }
  return false;
}

async function fetchWoltAssortment(slug) {
  try {
    const res = await fetch(
      `https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/${slug}/assortment`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchGooglePlacesGallery(placeId) {
  if (!GKEY || !placeId) return [];
  try {
    const r = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      { headers: { "X-Goog-Api-Key": GKEY, "X-Goog-FieldMask": "id,photos" } }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.photos || [])
      .slice(0, 8)
      .map((p) => {
        const ref = p.name;
        return typeof ref === "string" && ref.startsWith("places/")
          ? `/api/places/photos?ref=${encodeURIComponent(ref)}&w=640`
          : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function buildDescriptionFromWolt(item, spotName, cleanName) {
  const raw = String(item.description || "")
    .normalize("NFKC")
    .replace(/allergen[^\n.]*/gi, "")
    .replace(/inneholder[^\n.]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length >= 18) {
    const trimmed = raw.slice(0, 140).trim();
    return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  }
  return `Signature ${cleanName} prepared fresh at ${spotName}.`;
}

function inferTags(name, category) {
  const text = `${name} ${category}`.toLowerCase();
  const tags = [];
  if (/spicy|chili|hot|vindaloo|szechuan|madras|nduja|diavola/.test(text)) tags.push("spicy");
  if (/crispy|fried|karaage|katsu|gyoza|tempura|wings|corndog/.test(text)) tags.push("crispy");
  if (/cheese|cheddar|mozzarella|halloumi|feta|paneer|ost/.test(text)) tags.push("cheesy");
  if (/birria|beef|wagyu|steak|lamb|pork|chicken|kylling|duck|biff/.test(text)) tags.push("savory");
  if (/matcha|biscoff|chocolate|nutella|berry|mango|scone|bun|bolle|croissant|halo|pancake/.test(text))
    tags.push("sweet");
  if (/vegan|veggie|vegetar|falafel|tofu|edamame/.test(text)) tags.push("plant-based");
  if (tags.length === 0) tags.push(category || "signature", "oslo-favorite");
  return [...new Set(tags)].slice(0, 3);
}

async function run() {
  const apifyData = {};
  for (const p of [SCRATCH_APIFY_1, SCRATCH_APIFY_2]) {
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      for (const [spotName, info] of Object.entries(parsed)) {
        if (spotName === "Sapporo Ramen Bar") continue;
        if (info?.downloaded?.length || info?.handle) apifyData[spotName] = info;
      }
    }
  }

  const [{ data: liveVenues, error: vErr }, { data: livePosts, error: pErr }] = await Promise.all([
    supabase
      .from("venues")
      .select(
        "id,name,slug,address,neighborhood,latitude,longitude,category,price_level,google_rating,google_reviews_count,google_place_id,spot_type,description,image_url,website_uri,current_opening_hours_text,opening_hours,vibe_signals"
      ),
    supabase
      .from("food_posts")
      .select("id,venue_id,dish_name,price_nok,category,dish_image,review_text,taste_tags,is_published,is_archived"),
  ]);

  if (vErr || pErr) throw new Error(vErr?.message || pErr?.message || "Supabase read failed");

  const postsByVenue = new Map();
  for (const post of livePosts || []) {
    if (post.is_published === false || post.is_archived) continue;
    const arr = postsByVenue.get(post.venue_id) || [];
    arr.push(post);
    postsByVenue.set(post.venue_id, arr);
  }

  const staged = JSON.parse(fs.readFileSync(STAGED_PATH, "utf8"));
  const stagedBySlugOrName = new Map(staged.map((s) => [norm(s.name), s]));

  const liveNonPopups = (liveVenues || []).filter(
    (v) => v.spot_type !== "popup" && v.spot_type !== "pop_up" && v.vibe_signals?.spot_type !== "popup"
  );

  for (const lv of liveNonPopups) {
    const existingStaged = stagedBySlugOrName.get(norm(lv.name));
    const vPosts = postsByVenue.get(lv.id) || [];
    const existingPlacePhotos = Array.isArray(lv.vibe_signals?.place_photos) ? lv.vibe_signals.place_photos : [];

    if (!existingStaged) {
      const created = {
        id: lv.slug || slugify(lv.name),
        name: lv.name,
        address: lv.address || "Oslo",
        neighborhood: lv.neighborhood || "sentrum",
        latitude: Number(lv.latitude) || 59.9139,
        longitude: Number(lv.longitude) || 10.7522,
        food_category: lv.category || "restaurant",
        icon: lv.vibe_signals?.icon || lv.category || "restaurant",
        spot_type: lv.spot_type || "restaurant",
        cover_image_url: lv.image_url || vPosts[0]?.dish_image || "",
        place_photos: existingPlacePhotos,
        candidate_photos: [...existingPlacePhotos],
        google_place_id: lv.google_place_id || undefined,
        google_reviews_count: lv.google_reviews_count ?? undefined,
        price_level: lv.price_level || "$$",
        google_rating: lv.google_rating ?? 4.7,
        signature_dish: vPosts[0]?.dish_name || undefined,
        why_curated: lv.description || "",
        verification_status: "seeded",
        website_uri: lv.website_uri || undefined,
        opening_hours_text: lv.current_opening_hours_text || undefined,
        opening_hours: lv.opening_hours || undefined,
        dish_highlights: vPosts.map((p, idx) => ({
          id: `${lv.slug || slugify(lv.name)}-dish-${idx + 1}`,
          dish_name: p.dish_name,
          category: p.category || lv.category || "restaurant",
          price_nok: p.price_nok ?? null,
          dish_image: p.dish_image || "",
          is_verified_food_photo: Boolean(p.dish_image),
          review_text: p.review_text || lv.description || "",
          taste_tags: Array.isArray(p.taste_tags) ? p.taste_tags : [],
        })),
      };
      staged.push(created);
      stagedBySlugOrName.set(norm(lv.name), created);
    } else if (existingStaged.verification_status === "seeded") {
      // Reset back to verified live dishes before re-running so cleanup is idempotent
      const verifiedLive = existingStaged.dish_highlights.filter((d) => d.is_verified_food_photo);
      existingStaged.dish_highlights = verifiedLive;
      if (existingPlacePhotos.length > 0 && (!existingStaged.place_photos || existingStaged.place_photos.length === 0)) {
        existingStaged.place_photos = existingPlacePhotos;
      }
      if (!existingStaged.google_place_id && lv.google_place_id) existingStaged.google_place_id = lv.google_place_id;
    } else {
      // For unseeded needs_photo spots, keep ONLY their original Dish #1 before re-running cleanly
      existingStaged.dish_highlights = existingStaged.dish_highlights.slice(0, 1);
    }
  }

  let woltAdded = 0;
  let curatedAdded = 0;

  for (const spot of staged) {
    if (spot.spot_type === "popup" || spot.spot_type === "pop_up") continue;
    if (spot.verification_status === "rejected") continue;

    // Reset unseeded dishes back to verified ones if script is re-run
    const currentDishes =
      spot.verification_status === "seeded"
        ? spot.dish_highlights.filter((d) => d.is_verified_food_photo)
        : spot.dish_highlights.slice(0, 1);

    const candidatePhotoPool = new Set([...(spot.place_photos || []), ...(spot.candidate_photos || [])]);
    const igInfo = apifyData[spot.name];
    if (igInfo) {
      if (igInfo.handle && !spot.instagram_url) spot.instagram_url = `https://www.instagram.com/${igInfo.handle}`;
      for (const localImg of igInfo.downloaded || []) candidatePhotoPool.add(localImg);
    }

    const woltSlug = WOLT_SLUG_OVERRIDES[spot.name];
    let woltItems = [];
    if (woltSlug) {
      const assortment = await fetchWoltAssortment(woltSlug);
      if (assortment?.items?.length) {
        const allowDrinks = isBeverageVenue(spot.name, spot.food_category);
        const allowCafes = /bakery|boba|tea|matcha|coffee|cafe|crave/i.test(`${spot.name} ${spot.food_category}`);
        const minPriceNok = allowCafes ? 50 : 72;

        // Build item_id -> categories lookup
        const itemCats = new Map();
        for (const c of assortment.categories || []) {
          for (const id of c.item_ids || []) {
            const arr = itemCats.get(id) || [];
            arr.push(c.name || "");
            itemCats.set(id, arr);
          }
        }

        woltItems = assortment.items
          .map((item) => {
            const imgUrl = item.image || item.images?.[0]?.url || "";
            const priceNok =
              typeof item.price === "number"
                ? Math.round(item.price / 100)
                : typeof item.baseprice === "number"
                ? Math.round(item.baseprice / 100)
                : null;
            const cats = itemCats.get(item.id) || [];
            const catText = cats.join(" ");
            const isPopular = /popul|bestsel|signatur|favorit|recommended/i.test(catText);
            const isExcludedCat = cats.length > 0 && cats.every((cn) => EXCLUDED_WOLT_CATEGORY_RE.test(cn));
            const cleanName = cleanMenuItemName(item.name, spot.food_category, item.description);
            return { raw: item, cleanName, priceNok, imgUrl, cats, catText, isPopular, isExcludedCat };
          })
          .filter((entry) => {
            if (!entry.cleanName || entry.cleanName.length < 3 || entry.cleanName.length > 48) return false;
            if (!entry.priceNok || entry.priceNok < minPriceNok || entry.priceNok > 495) return false;
            if (entry.isExcludedCat) return false;
            if (!allowDrinks && /matcha|kaffe|te|coffee|tea|soda|lemonade|boba/i.test(entry.catText)) return false;
            if (EXCLUDED_ITEM_NAME_RE.test(entry.cleanName)) return false;
            if (spot.name === "Crave" && !/pancake|souffle|toast|cheescake|cheesecake|croissant/i.test(entry.catText + " " + entry.cleanName)) {
              return false;
            }
            if (/\b(2\s*person|combo\s*for|familie|menypakke|drikke|basmati rice)\b/i.test(entry.cleanName)) return false;
            return true;
          })
          .sort((a, b) => {
            const scoreA = (a.imgUrl ? 8 : 0) + (a.isPopular ? 3 : 0) + (a.cleanName.length <= 30 ? 1 : 0);
            const scoreB = (b.imgUrl ? 8 : 0) + (b.isPopular ? 3 : 0) + (b.cleanName.length <= 30 ? 1 : 0);
            return scoreB - scoreA;
          });

        for (const w of woltItems) {
          if (w.imgUrl && candidatePhotoPool.size < 12) candidatePhotoPool.add(w.imgUrl);
        }
      }
    }

    if (candidatePhotoPool.size < 5 && spot.google_place_id) {
      const gPhotos = await fetchGooglePlacesGallery(spot.google_place_id);
      for (const gp of gPhotos) candidatePhotoPool.add(gp);
    }

    const needed = Math.max(0, 3 - currentDishes.length);
    let addedForSpot = 0;

    for (const w of woltItems) {
      if (addedForSpot >= needed) break;
      if (currentDishes.some((existing) => isSameDish(existing.dish_name, w.cleanName))) continue;

      currentDishes.push({
        id: `${spot.id}-dish-${currentDishes.length + 1}`,
        dish_name: w.cleanName,
        category: spot.food_category || "restaurant",
        price_nok: w.priceNok,
        dish_image: w.imgUrl || "",
        is_verified_food_photo: false,
        review_text: buildDescriptionFromWolt(w.raw, spot.name, w.cleanName),
        taste_tags: inferTags(w.cleanName, spot.food_category),
      });
      addedForSpot++;
      woltAdded++;
    }

    const curatedMenu = NON_WOLT_VERIFIED_MENUS[spot.name] || [];
    for (const cm of curatedMenu) {
      if (addedForSpot >= needed) break;
      if (currentDishes.some((existing) => isSameDish(existing.dish_name, cm.dish_name))) continue;

      currentDishes.push({
        id: `${spot.id}-dish-${currentDishes.length + 1}`,
        dish_name: cm.dish_name,
        category: cm.category || spot.food_category || "restaurant",
        price_nok: cm.price_nok,
        dish_image: "",
        is_verified_food_photo: false,
        review_text: cm.review_text,
        taste_tags: cm.taste_tags || inferTags(cm.dish_name, spot.food_category),
      });
      addedForSpot++;
      curatedAdded++;
    }

    spot.dish_highlights = currentDishes;
    spot.candidate_photos = [...candidatePhotoPool].slice(0, 12);
    if (!spot.signature_dish && currentDishes[0]?.dish_name) {
      spot.signature_dish = currentDishes[0].dish_name;
    }

    console.log(
      `✓ ${spot.name.padEnd(36)} | ${currentDishes.length}/3 dishes | ${currentDishes
        .map((d) => `${d.dish_name} (${d.price_nok}kr)`)
        .join(" / ")}`
    );
  }

  fs.writeFileSync(STAGED_PATH, JSON.stringify(staged, null, 2), "utf8");
  console.log(`\nDone! Wolt dishes: +${woltAdded}, Curated non-Wolt: +${curatedAdded}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
