import fs from "fs";
import path from "path";

// Read Supabase credentials safely
const envFile = fs.existsSync(".env.local") ? ".env.local" : "frontend/.env.local";
const envContent = fs.readFileSync(envFile, "utf8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in env");
  process.exit(1);
}

const curationDir = path.resolve("curation");
if (!fs.existsSync(curationDir)) {
  fs.mkdirSync(curationDir, { recursive: true });
}

async function fetchAll() {
  console.log("Fetching venues from Supabase REST API...");
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json"
  };

  // 1. Fetch Venues
  const venuesRes = await fetch(`${supabaseUrl}/rest/v1/venues?select=*`, { headers });
  if (!venuesRes.ok) {
    throw new Error(`Failed to fetch venues: ${venuesRes.status} ${await venuesRes.text()}`);
  }
  const venues = await venuesRes.json();
  console.log(`Fetched ${venues.length} venues.`);
  if (venues[0]) console.log("Columns:", Object.keys(venues[0]));

  // 2. Fetch Food Posts / Dishes to enrich spots with main dishes
  const postsRes = await fetch(`${supabaseUrl}/rest/v1/food_posts?select=id,spot_id,spot_name,dish_name,category,price_nok,rating,taste_tags`, { headers });
  const posts = postsRes.ok ? await postsRes.json() : [];
  console.log(`Fetched ${posts.length} food posts.`);

  // Group dishes by venue
  const dishesByVenue = {};
  for (const p of posts) {
    if (!p.spot_id) continue;
    if (!dishesByVenue[p.spot_id]) dishesByVenue[p.spot_id] = [];
    dishesByVenue[p.spot_id].push({
      dish_name: p.dish_name,
      category: p.category,
      price_nok: p.price_nok,
      taste_tags: p.taste_tags || []
    });
  }

  // Create lightweight list
  const currentSpots = venues.map((v) => {
    const dishes = dishesByVenue[v.id] || [];
    const signatureDishes = v.signature_dishes || [];
    const allDishes = Array.from(new Set([...signatureDishes, ...dishes.map((d) => d.dish_name)]));

    return {
      id: v.id,
      name: v.name,
      spot_type: v.spot_type || "restaurant",
      category: v.category || v.food_category || "all",
      neighborhood: v.neighborhood || "sentrum",
      address: v.address,
      coords: [v.longitude, v.latitude],
      price_level: v.price_level || "$$",
      google_rating: v.google_rating || null,
      google_reviews: v.google_reviews_count || null,
      dishes: allDishes,
      website: v.website_uri || null
    };
  });

  // Calculate Distribution Statistics
  const catCounts = {};
  const neighCounts = {};
  const typeCounts = {};

  for (const s of currentSpots) {
    catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    neighCounts[s.neighborhood] = (neighCounts[s.neighborhood] || 0) + 1;
    typeCounts[s.spot_type] = (typeCounts[s.spot_type] || 0) + 1;
  }

  // Generate CURATION_BRIEF.md
  const briefMarkdown = `# Smakr Oslo — Food Spot Curation Brief & Schema

> **Mission**: Scout, verify, and curate high-craft, culinary-forward, and unique food spots across Oslo for Smakr (the live food discovery radar).

---

## 1. Database Distribution (As of November 2026)

**Total Curated Venues in DB**: **${currentSpots.length}**

### Neighborhood Breakdown
${Object.entries(neighCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([n, count]) => `- **${n}**: ${count} spots`)
  .join("\n")}

### Category Breakdown
${Object.entries(catCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([c, count]) => `- **${c}**: ${count} spots`)
  .join("\n")}

### Spot Types
${Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([t, count]) => `- **${t}**: ${count} spots`)
  .join("\n")}

### 🎯 Under-Represented Priorities (Target These First)
- **High-Demand Gaps**:
  - **Specialty Artisanal Bakeries & Sourdough**: Tøyen, Kampen, Bislett, Frogner.
  - **Authentic Regional Gems**: Oaxacan street tacos, authentic Thai street wok, Sichuan/Xi'an hand-pulled noodles, Levantine charcoal grill.
  - **Matcha & Japanese Specialty Cafés**: Dedicated ceremonial matcha bars, Japanese kissaten, tea houses.
  - **Chef-Driven Pop-Ups & Residencies**: Emerging kitchen takeovers, rotating chef residencies at wine bars.
  - **Natural & Low-Intervention Wine Bars**: Micro-bars with serious seasonal small plates.
  - **Mobile Food Trucks & Yard Stalls**: Vippa, Salt, Oslo Street Food, and roving specialty trucks with cult followings.

---

## 2. Strict Taste & Exclusion Filter

We are building Oslo's most trusted, taste-driven food radar. **Do not dilute the database.**

### ✅ WHAT WE WANT (Green Light):
- **High Culinary Craft**: Places obsessed with technique (fermentation, sourdough, wood-fire, heirloom ingredients, handmade noodles/pasta).
- **Authentic Regional Heritage**: Independent immigrant-run gems serving unapologetic, uncompromised flavors (e.g. Yemeni mandi, authentic bánh mì, Sichuan chili oil noodles).
- **Specialty Focus**: Spots that do 1 to 3 items with obsessive perfection (e.g., dedicated smash burger craft, single-origin espresso, specialty matcha, natural wine + small plates).
- **Cult Local Following**: Secret spots Oslo foodies travel across town for; places with queues before opening; intimate chef residencies.

### 🚫 STRICTLY BANNED (Do NOT Curate):
- **Generic Kebab & "Nattmat" Shops**: Standard rotisserie doner, frozen fries, generic pita roll-ups with factory sauces.
- **Fast Food Chains & Franchises**: McDonald's, Burger King, Subway, Espresso House, generic pizza chains.
- **Basic Commercial Burger Joints**: Generic frozen beef patties, industrial brioche buns with zero identity.
- **Tourist Traps & Generic Brasseries**: Overpriced, soulless dining with 80-item menus catering to Karl Johan crowds.
- **Generic Sports Bars & Pub Grub**: Frozen wings, microwave nachos, mass-market lager dispensers.

---

## 3. Candidate Spot Output Schema (JSON)

When submitting newly scouted spots, output a valid JSON array matching this exact schema:

\`\`\`json
[
  {
    "name": "Spot Name (e.g. Talor Made, Koie Ramen, Focacceria)",
    "spot_type": "restaurant | food_truck | popup | pop_up",
    "food_category": "bakery | ramen | pizza | coffee | matcha | pasta | street_food | sushi | dessert | drinks | dumplings | tacos | fried_chicken | k_chicken | naan | cinnamon_roll | kebab | vietnamese | indian | mandi_rice | natural_wine | brunch",
    "neighborhood": "grunerlokka | torggata | toyen | gronland | sentrum | frogner | kampen | majorstuen | bislett",
    "address": "Full Street Address, 0180 Oslo",
    "coords": [10.7522, 59.9139],
    "price_level": "$ | $$ | $$$",
    "icon": "Dedicated dish key matching catalog (e.g. matcha, ramen, croissant, mandi_rice, cheesesteak, pizza, burger, tacos)",
    "signature_dishes": [
      "Exact Dish Name 1",
      "Exact Dish Name 2"
    ],
    "dish_highlights": [
      {
        "dish_name": "Signature Dish Name",
        "category": "FoodCategory matching above",
        "price_nok": 185,
        "taste_tags": ["crispy", "spicy", "artisan"],
        "review_text": "One-line punchy description of why this specific dish is iconic."
      }
    ],
    "why_curated": "2-3 sentences explaining why this spot passes our craft & authenticity test.",
    "google_rating": 4.6,
    "google_reviews_count": 340,
    "website_uri": "https://...",
    "instagram_url": "https://instagram.com/...",
    "opening_hours_text": "Tue–Sat 11:00–21:00, Sun 12:00–18:00, Mon Closed",
    "popup_meta": {
      "residency_status": "active | next_confirmed | between_residencies",
      "host_venue_name": "Optional host name if pop-up",
      "dates_label": "Optional e.g. Oct 24 – Nov 12"
    }
  }
]
\`\`\`

---

## 4. Deduplication Rules
Before curating a spot, check \`curation/current_spots.json\`:
1. Check \`name\` case-insensitively (including Norwegian characters like *æ, ø, å*).
2. Check \`coords\` or street address proximity (do not submit duplicate branches unless it's a completely distinct flagship concept).
`;

  const targetDirs = [path.resolve("curation"), path.resolve("../curation")];
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "current_spots.json"), JSON.stringify(currentSpots, null, 2));
    fs.writeFileSync(path.join(dir, "CURATION_BRIEF.md"), briefMarkdown);
  }
  console.log(`Saved CURATION_BRIEF.md and current_spots.json to root and frontend curation dirs!`);
}

fetchAll().catch(console.error);
