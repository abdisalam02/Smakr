# Smakr Oslo — Food Spot Curation Brief & Schema

> **Mission**: Scout, verify, and curate high-craft, culinary-forward, and unique food spots across Oslo for Smakr (the live food discovery radar).

---

## 1. Database Distribution (As of November 2026)

**Total Curated Venues in DB**: **20**

### Neighborhood Breakdown
- **sentrum**: 12 spots
- **Bjørvika**: 2 spots
- **grunerlokka**: 2 spots
- **Grønland**: 1 spots
- **Majorstuen**: 1 spots
- **toyen**: 1 spots
- **Lillestrøm**: 1 spots

### Category Breakdown
- **Coffee**: 4 spots
- **Pizza**: 2 spots
- **Bakery**: 2 spots
- **Food**: 2 spots
- **Matcha**: 1 spots
- **Ramen**: 1 spots
- **vietnamese**: 1 spots
- **Street Food**: 1 spots
- **dumplings**: 1 spots
- **burrito_wrap**: 1 spots
- **rice_bowls**: 1 spots
- **naan**: 1 spots
- **k_chicken**: 1 spots
- **cinnamon_roll**: 1 spots

### Spot Types
- **restaurant**: 19 spots
- **popup**: 1 spots

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

```json
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
```

---

## 4. Deduplication Rules
Before curating a spot, check `curation/current_spots.json`:
1. Check `name` case-insensitively (including Norwegian characters like *æ, ø, å*).
2. Check `coords` or street address proximity (do not submit duplicate branches unless it's a completely distinct flagship concept).
