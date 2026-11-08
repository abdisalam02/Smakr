import os

blueprint_content = """# Smakr Oslo — Filter, Taxonomy & Identity Architecture Blueprint

**Document Version**: 2.0  
**Status**: Architecture & Research Mode Only (No database or code modifications executed)  
**Date**: November 2026  
**Audience**: Engineering, Product & Design  

---

## Executive Summary

Smakr's current user interface suffers from an entangled taxonomy where **a single database field (`food_category` or `icon`) is forced to do four conflicting jobs simultaneously**:
1. Choose the map pin SVG illustration.
2. Determine the parent filter grouping in the top filter bar.
3. Generate the venue card header label and icon.
4. Dictate the icon placed next to featured signature dishes.

This overloading produces jarring user-facing errors:
- **Masala Politics**: Had `category: "naan"` so its map pin displays a naan flatbread. Because `naan` maps to parent group `breads`, the Venue Card header announces **`BREADS`** with a French baguette basket icon instead of **`🇮🇳 INDIAN · STREET FOOD`**.
- **Em Oi!**: A Vietnamese street food spot with signature *Bánh Mì* and *Coconut Coffee*. Text sniffing in `taxonomy.ts` catches `"em oi"` and forces `dishCategory = "pho"`. Because `pho` belongs to `noodles_soup`, the card header displays **`NOODLES`** with a noodle bowl, and the signature dish pill places a noodle bowl directly beside **`Coconut Coffee`**.
- **Ochaya - The Matcha**: A dedicated Japanese matcha bar with `category: "Coffee"`, causing its venue card header to display **`COFFEE`** instead of **`🇯🇵 MATCHA`** or **`JAPANESE TEA BAR`**.
- **Opening Hours**: Hardcodes **`Closed · Opens 08:00`** in `openingHours.ts` for any user browsing before 07:00, regardless of whether the restaurant opens at 16:00.

This blueprint documents the root causes in the codebase and presents a **4-Part Decoupled Taxonomy System** that separates **Venue Identity**, **Map Pin Graphics**, **Multi-Tag Filtering**, and **Dish-Level Metadata**.

---

## PART 1: Codebase Trace & Bug Diagnostics

### 1.1 Where Categories, Parent Groups, and Icons Are Defined

| File Path | Lines | Responsibilities & Observed Flaws |
| :--- | :--- | :--- |
| `frontend/src/lib/taxonomy.ts` | 43–64, 66–158 | **`FOOD_GROUPS`**: Defines 13 parent groups (`breads`, `noodles_soup`, `coffee_tea`, etc.) with `shortLabel` strings (`"Breads"`, `"Noodles"`, `"Coffee"`) and deterministic `childCategories[]`. |
| `frontend/src/lib/taxonomy.ts` | 195–212 | **`CATEGORY_TO_GROUP`**: Strictly maps child categories 1:1 to parent groups. Precludes multi-category concepts. |
| `frontend/src/lib/taxonomy.ts` | 273–373 | **`resolveEntityTaxonomy()`**: Hardcoded text-sniffing ladder. Intercepts venue names/dishes and forcefully overrides categories (e.g. `allText.includes("em oi") => "pho"`). |
| `frontend/src/components/food/FoodIcons.tsx` | 38–39 | **`FILTER_CATEGORY_WEBP`**: Maps parent group IDs to raster WebP icons (`breads` -> `breads.webp` [baguette basket], `noodles_soup` -> `noodles_soup.webp` [ramen bowl]). |
| `frontend/src/components/food/FoodIcons.tsx` | 25–155 | **`FOOD_PIN_SVG_MAP`**: Dictionary of 35+ custom vector pin SVGs. |
| `frontend/src/components/map/MapRadarView.tsx` | 285–301 | **Pin Icon Calculation**: Conflates `venue.icon`, `taxonomy.dishCategory`, and `venue.food_category`. |
| `frontend/src/components/map/MapRadarView.tsx` | 1581–1584, 1644–1649 | **Map Popup Card Header**: Injects `taxonomy.group.shortLabel` (`"BREADS"`, `"NOODLES"`) and `FILTER_CATEGORY_WEBP[taxonomy.group.id]` directly into the card header. |
| `frontend/src/components/map/MapRadarView.tsx` | 1746–1751 | **Signature Dish Chip**: Reuses `filterWebp` (the venue's parent group WebP) instead of resolving the dish's own category. |
| `frontend/src/components/home/HomeView.tsx` | 332–351 | **Feed Filter Engine**: Enforces strict single-equality checks against `venueTax.group.id` or `venueTax.dishCategory`. |
| `frontend/src/components/map/MapRadarView.tsx` | 669–704 | **Map Marker Filter Engine**: Duplicates the strict single-group filter check across map pins. |
| `frontend/src/lib/openingHours.ts` | 142–154, 166–196 | **`getVenueLiveOpenStatus()`**: Hardcodes `"Closed · Opens 08:00"` before 07:00 Oslo time and applies generic guessing heuristics. |

---

### 1.2 Bug 1: Why "Em Oi!" and "Coconut Coffee" Fall Back to "NOODLES" & Noodle Bowl

#### The Exact Code Chain:
1. In `frontend/src/lib/taxonomy.ts` (lines 302–311):
   ```typescript
   } else if (
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
   ```
2. Because the venue name contains `"Em Oi"`, `resolveEntityTaxonomy()` sets `dishCategory = "pho"`.
3. In `taxonomy.ts` (line 93), `"pho"` is registered under the parent group `noodles_soup`:
   ```typescript
   {
     id: "noodles_soup",
     label: "Noodles & Soup",
     shortLabel: "Noodles",
     heroIcon: "ramen",
     childCategories: ["ramen", "pho", "udon", "noodle_soup"],
   }
   ```
4. In `frontend/src/components/map/MapRadarView.tsx` (lines 1581–1584):
   ```typescript
   const filterWebp = FILTER_CATEGORY_WEBP[taxonomy.group.id] || FILTER_CATEGORY_WEBP[taxonomy.dishCategory];
   ```
   `taxonomy.group.id` is `"noodles_soup"`. `filterWebp` resolves to `/icons/food/ramen.webp`.
5. In `MapRadarView.tsx` (line 1648), the card header displays:
   ```html
   <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#e84a27;">
     ${taxonomy.group.shortLabel || taxonomy.dishLabel}
   </span>
   ```
   This outputs **`NOODLES`**.
6. In `MapRadarView.tsx` (lines 1746–1751), the signature dish pill displays:
   ```html
   <span style="display:inline-flex;align-items:center;flex-shrink:0;">
     ${filterWebp ? `<img src="${filterWebp}" width="16" height="16" .../>` : dishIconHtml}
   </span>
   <span style="font-size:10px;font-weight:700;color:#181615;">
     ${signatureDishName}
   </span>
   ```
   Because `filterWebp` exists on the venue taxonomy scope, the code blindly reuses `filterWebp` (the ramen bowl) inside the signature dish chip, placing a noodle bowl icon directly beside `Coconut Coffee`!

---

### 1.3 Bug 2: Why "Masala Politics" Shows "BREADS" and Baguette Basket

1. In `current_spots.json`, Masala Politics was seeded with `"category": "naan"` (to force the map pin to render a naan flatbread SVG).
2. In `taxonomy.ts` (lines 74–80):
   ```typescript
   {
     id: "breads",
     label: "Breads & Flatbreads",
     shortLabel: "Breads",
     heroIcon: "naan",
     childCategories: ["naan", "flatbread", "sourdough"],
   }
   ```
   `naan` is assigned to parent group `"breads"`.
3. In `FoodIcons.tsx` (line 38):
   ```typescript
   FILTER_CATEGORY_WEBP["breads"] = "/icons/food/breads.webp"; // Raster illustration of a French artisan bread basket with baguettes
   ```
4. In `MapRadarView.tsx`, `taxonomy.group.shortLabel` is `"BREADS"`.
5. Result: The venue card displays a French bread basket and shouts **`BREADS`**, completely erasing the restaurant's identity as a premier Karl Johans gate Indian street eatery.

---

### 1.4 Bug 3: Why Map Filter Bars Overwrite Card Display Labels

The Map Filter Bar uses a 13-bucket parent taxonomy (`FOOD_GROUPS`). When a venue is loaded into `MapRadarView`:
1. `resolveEntityTaxonomy()` computes `taxonomy.group` as an internal grouping for filtering.
2. But the UI rendering layer reuses `taxonomy.group.shortLabel` as the visual title of the venue card (line 1648).
3. Result: Broad filter abstractions (`BREADS`, `NOODLES`, `COFFEE`, `SANDWICHES`) leak into the presentation tier, replacing specific, culturally accurate cuisine badges.

---

### 1.5 Bug 4: Where "Closed · Opens 08:00" Is Hardcoded

File: `frontend/src/lib/openingHours.ts` (lines 142–154):
```typescript
  // 4. Time-of-day sanity check in Oslo:
  const isEarlyMorning = currentMinutes < 7 * 60; // Before 07:00
  const isLateNight = currentMinutes >= 23 * 60 + 30; // After 23:30

  if (isEarlyMorning) {
    return {
      isOpen: false,
      statusText: "Closed · Opens 08:00",
      detailText: "Opens later today",
      badgeText: "● Closed · Opens 08:00",
      color: "zinc",
    };
  }
```
Whenever a user views any spot before 07:00 Oslo time, the function bypasses all venue data and returns a hardcoded `"Closed · Opens 08:00"` string. Furthermore, lines 167–187 apply fallback assumptions (`open 07:30 to 18:00` for coffee/bakery, `11:30 to 22:30` for restaurants) when hours are missing, instead of declaring hours unverified.

---

## PART 2: The 4-Part Decoupled Taxonomy System

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SMAKR 4-PART TAXONOMY                                │
├─────────────────────────┬──────────────────────┬───────────────────┬─────────────┤
│ 1. CARD HEADER          │ 2. MAP PIN           │ 3. FILTER ENGINE  │ 4. DISH PILL│
│ (Venue Identity)        │ (Hero Graphic)       │ (Discovery Radar) │ (Dish Item) │
├─────────────────────────┼──────────────────────┼───────────────────┼─────────────┤
│ Flag + Cuisine + Concept│ Dedicated Vector SVG │ Multi-Token Array │ Dish-Own    │
│ 🇮🇳 INDIAN · STREET FOOD│ [Naan Flatbread]     │ ["indian","halal",│ Vector Icon │
│ 🇻🇳 VIETNAMESE · BANH MI │ [Banh Mi Baguette]   │  "street_food"]   │ ☕ Coffee   │
│ 🇯🇵 JAPANESE · MATCHA BAR│ [Matcha Bowl]        │ Matches multi-tags│ 🥐 Croissant│
└─────────────────────────┴──────────────────────┴───────────────────┴─────────────┘
```

### 2.1 Component 1: Cuisine & Flag Header (Card Top-Left)

Instead of generic bucket strings (`BREADS`, `NOODLES`), the header is rendered from three explicit properties:
1. `country_flag`: Unicode flag emoji (e.g. `🇮🇳`, `🇻🇳`, `🇯🇵`, `🇾🇪`, `🇳🇴`, `🇲🇽`, `🇺🇸`, `🇰🇷`, `🇭🇰`, `🇫🇷`, `🇮🇹`) or concept badge (`✦`) for modern fusion.
2. `cuisine_label`: Concise, uppercase cultural origin (e.g. `INDIAN`, `VIETNAMESE`, `JAPANESE`, `YEMENI`, `NORDIC`).
3. `concept_subtitle`: The specialized culinary focus (e.g. `STREET FOOD`, `BANH MI & COFFEE`, `SOURDOUGH BAKERY`, `MATCHA BAR`, `CHEESESTEAKS & SMASH`).

#### Handling Spots Without a Single Foreign Flag:
- **Artisan Norwegian bakeries**: `🇳🇴 NORDIC BAKERY · SOURDOUGH & BUNS` (e.g. Daglig Brød, Håndbakt, Farine) or `🇳🇴 ARTISAN BAKERY · VIENNOISERIE` (Kveitemjøl).
- **American Halal Street Food**: `🇺🇸 AMERICAN-HALAL · CHEESESTEAKS & SMASH` (Zam Zam).
- **Global Fusion / Modern Street Food**: `✦ FUSION · STREET TACOS` (Dirty Taco).
- **Roving Beverage Pop-ups**: `✦ SPECIALTY DRINKS · ROVING POP-UP` (U WAN SUM).

---

### 2.2 Component 2: Map Pin Illustration (`pin_icon`)

- The map pin SVG illustration is decoupled from the card header text.
- Stored as `pin_icon: string` (e.g. `"naan"`, `"banh_mi"`, `"matcha"`, `"ramen"`, `"croissant"`, `"k_chicken"`, `"pizza"`, `"tacos"`, `"cheesesteak"`, `"mandi_rice"`).
- The map renderer reads `FOOD_PIN_SVG_MAP[venue.pin_icon]` directly.
- **Independence Guarantee**: Masala Politics renders the `naan` SVG pin on the map, while its card header displays `🇮🇳 INDIAN · STREET FOOD`.

---

### 2.3 Component 3: Multi-Tag Map & Feed Filtering Engine

Venues are no longer pigeonholed into a single deterministic parent bucket. Instead, each venue carries a rich array of `filter_tags: string[]`.

```typescript
// Multi-Tag Filter Matching Algorithm
function venueMatchesFilter(venue: Venue, activeFilter: string): boolean {
  if (activeFilter === "all") return true;
  
  const filter = activeFilter.toLowerCase().trim();
  
  // 1. Direct tag match (multi-concept tags)
  if (venue.filter_tags?.some(tag => tag.toLowerCase() === filter)) return true;
  
  // 2. Cuisine identifier match
  if (venue.cuisine_id?.toLowerCase() === filter) return true;
  
  // 3. Spot type match (restaurant, food_truck, popup)
  if (venue.spot_type?.toLowerCase() === filter) return true;
  
  // 4. Dietary tag match
  if (venue.dietary_tags?.some(d => d.toLowerCase() === filter)) return true;
  
  // 5. Dish catalog match (matches if venue serves a dish in that category)
  if (venue.dishes?.some(dish => 
    dish.category?.toLowerCase() === filter || 
    dish.dish_name.toLowerCase().includes(filter)
  )) return true;
  
  return false;
}
```

#### Real-World Filter Behaviors:
- User clicks **`Coffee`**: Matches *Fuglen* (specialty roastery), *Kuro* (Japanese coffee/tea), *Em Oi!* (Vietnamese coffee), *Cocoa Café* (cocoa/coffee), *U WAN SUM* (beverage pop-up).
- User clicks **`Asian`**: Matches *Masala Politics*, *Em Oi!*, *Lai Zai*, *Yum Cha*, *Miso Ramen*, *Kuro*, *Ochaya*, *175°C*, *Tomodomo*.
- User clicks **`Halal`**: Matches *Mandi House*, *Zam Zam*, *Aleppo Bahebek*, *Masala Politics*, *175°C*.
- User clicks **`Bakery`**: Matches *Håndbakt*, *Kveitemjøl*, *Daglig Brød*, *Farine*, *Sukkerbakeriet*, *Crantz Cookies*.

---

### 2.4 Component 4: Dish-Level Icons (Decoupled from Venue)

The signature dish chip on the card resolves its icon from the **dish object itself**:
```typescript
// Dish Icon Resolver
function getDishIconKey(dishName: string, dishCategory?: string): string {
  if (dishCategory && FOOD_PIN_SVG_MAP[dishCategory]) {
    return dishCategory;
  }
  const name = dishName.toLowerCase();
  if (name.includes("coffee") || name.includes("kaffe") || name.includes("latte")) return "coffee";
  if (name.includes("matcha")) return "matcha";
  if (name.includes("banh mi") || name.includes("sandwich")) return "banh_mi";
  if (name.includes("croissant")) return "croissant";
  if (name.includes("bolle") || name.includes("bun") || name.includes("roll")) return "cinnamon_roll";
  if (name.includes("taco")) return "tacos";
  if (name.includes("ramen") || name.includes("noodle") || name.includes("pho")) return "ramen";
  if (name.includes("dumpling") || name.includes("wonton") || name.includes("gow") || name.includes("mai")) return "dumplings";
  if (name.includes("curry") || name.includes("butter chicken") || name.includes("makhani")) return "curry";
  if (name.includes("cheesesteak")) return "cheesesteak";
  if (name.includes("pancake")) return "pancakes";
  return "food";
}
```
- For **Em Oi!**'s featured dish `Coconut Coffee`: Resolves to `"coffee"` (renders coffee cup SVG), **never** `"ramen"`.
- For **Håndbakt**'s featured dish `Turkish Eggs`: Resolves to `"brunch"` (renders egg/skillet SVG), while Håndbakt's map pin remains `"croissant"`.

---

## PART 3: Complete Mapping Table for All 20 Existing Spots

| # | Venue Name (`current_spots.json`) | New Header (`flag` + `cuisine` · `concept`) | `pin_icon` (Map Pin SVG) | Multi-Tags (`filter_tags[]`) | Verified Signature Dish & Icon | Primary Filter Matches |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Digg Pizza - Grønland** | `🇮🇹 ITALIAN · ROMAN PAN PIZZA` | `pizza` | `["pizza", "italian", "sourdough", "dinner", "casual"]` | `Cheeesy` (`pizza`) | `Pizza`, `Italian`, `Dinner` |
| 2 | **Ochaya - The Matcha** | `🇯🇵 JAPANESE · MATCHA BAR` | `matcha` | `["matcha", "tea", "japanese", "asian", "drinks", "dessert"]` | `Matcha Latte` (`matcha`) | `Matcha`, `Tea`, `Asian`, `Drinks` |
| 3 | **Daglig Brød** | `🇳🇴 NABOLAGSBAKERI · SOURDOUGH` | `croissant` | `["bakery", "sourdough", "bread", "pastries", "nordic", "morning"]` | `Surdeigsbrød` (`breads`) | `Bakery`, `Breads`, `Breakfast` |
| 4 | **Miso Ramen** | `🇯🇵 JAPANESE · RAMEN BAR` | `ramen` | `["ramen", "noodles", "japanese", "asian", "soup", "dinner"]` | `Shio Paitan` (`ramen`) | `Ramen`, `Noodles`, `Asian`, `Dinner` |
| 5 | **Lai Zai - Viet Street Food** | `🇻🇳 VIETNAMESE · STREET FOOD` | `banh_mi` | `["vietnamese", "street_food", "asian", "noodles", "rolls", "lunch"]` | `Gỏi Cuốn` (`vietnamese`) | `Vietnamese`, `Street Food`, `Asian` |
| 6 | **Em Oi!** | `🇻🇳 VIETNAMESE · BANH MI & COFFEE` | `banh_mi` | `["vietnamese", "banh_mi", "coffee", "street_food", "asian", "lunch"]` | `Cà phê sữa Ube Foam` (`coffee`) | `Vietnamese`, `Coffee`, `Street Food`, `Asian` |
| 7 | **Cocoa Café** | `🍫 SPECIALTY · ARTISAN COCOA BAR` | `coffee` | `["dessert", "cocoa", "chocolate", "drinks", "sweet", "cozy"]` | `Hot Chocolate Chili` (`dessert`) | `Dessert`, `Drinks`, `Coffee` |
| 8 | **Kuro Oslo** | `🇯🇵 JAPANESE · COFFEE & TEA` | `coffee` | `["coffee", "tea", "matcha", "japanese", "minimalist", "drinks"]` | `Kabusecha Green Tea` (`tea`) | `Coffee`, `Matcha`, `Tea`, `Asian` |
| 9 | **Yum Cha** | `🇭🇰 CANTONESE · DIM SUM PARLOR` | `dumplings` | `["dim_sum", "dumplings", "cantonese", "chinese", "asian", "tea"]` | `Har Gow 蝦餃` (`dumplings`) | `Dumplings`, `Asian`, `Lunch`, `Dinner` |
| 10 | **Zam Zam avd HASLE** | `🇺🇸 AMERICAN-HALAL · CHEESESTEAK` | `cheesesteak` | `["cheesesteak", "halal", "street_food", "burger", "comfort_food"]` | `Beef Cheesesteak` (`cheesesteak`) | `Halal`, `Street Food`, `Burgers` |
| 11 | **Mandi House restaurant Oslo** | `🇾🇪 YEMENI · MANDI RICE` | `mandi_rice` | `["mandi_rice", "yemeni", "middle_eastern", "halal", "rice", "lamb"]` | `Madbi Kylling` (`mandi_rice`) | `Halal`, `Middle Eastern`, `Rice`, `Dinner` |
| 12 | **U WAN SUM** | `✦ SPECIALTY DRINKS · POP-UP` | `drinks` | `["popup", "coffee", "matcha", "drinks", "seasonal"]` | *(Seasonal drop via IG)* (`coffee`) | `Pop-ups`, `Coffee`, `Drinks` |
| 13 | **Dirty Taco** | `🇲🇽 FUSION · STREET TACOS` | `tacos` | `["tacos", "mexican", "fusion", "street_food", "casual", "late_night"]` | `Dirty Pig` (`tacos`) | `Tacos`, `Street Food`, `Late Night` |
| 14 | **Fuglen Coffee Roasters** | `🇳🇴 NORDIC ROASTERY · COFFEE` | `coffee` | `["coffee", "specialty_coffee", "roastery", "nordic", "morning"]` | `Hand Pour-Over Single Origin` (`coffee`) | `Coffee`, `Breakfast` |
| 15 | **Masala Politics** | `🇮🇳 INDIAN · STREET FOOD` | `naan` | `["indian", "curry", "halal", "street_food", "asian", "dinner"]` | `Moti Mahal's Butter Chicken` (`curry`) | `Indian`, `Halal`, `Asian`, `Dinner` |
| 16 | **175°C K-fried** | `🇰🇷 KOREAN · FRIED CHICKEN` | `k_chicken` | `["k_chicken", "fried_chicken", "korean", "asian", "halal", "street_food"]` | `Crispy K-Fried Wings` (`k_chicken`) | `Korean`, `Chicken`, `Halal`, `Asian` |
| 17 | **Håndbakt Tøyen** | `🇳🇴 NORDIC · SOURDOUGH & BRUNCH` | `croissant` | `["bakery", "sourdough", "brunch", "organic", "nordic", "pastries"]` | `Turkish Eggs Chipotle Style` (`brunch`) | `Bakery`, `Brunch`, `Breakfast` |
| 18 | **Crave** | `🇯🇵 JAPANESE · SOUFFLÉ PANCAKES` | `pancakes` | `["dessert", "pancakes", "japanese", "toast", "sweet", "brunch"]` | `Pistella Supreme` (`pancakes`) | `Dessert`, `Brunch`, `Japanese` |
| 19 | **Kveitemjøl** | `🇳🇴 ARTISAN BAKERY · VIENNOISERIE` | `croissant` | `["bakery", "pastries", "croissant", "sourdough", "nordic", "butter"]` | `Croissant` (`croissant`) | `Bakery`, `Pastries`, `Breakfast` |
| 20 | **Stykke - Hasle** | `🇮🇹 ROMAN PIZZA · SLICE SHOP` | `pizza` | `["pizza", "roman_pizza", "italian", "slices", "casual", "lunch"]` | `Spicy nduja (Stykke)` (`pizza`) | `Pizza`, `Italian`, `Lunch` |

---

## PART 4: Mapping Table for the 20 New Candidates

| # | Candidate Name (`new_oslo_candidates.json`) | New Header (`flag` + `cuisine` · `concept`) | `pin_icon` (Map Pin SVG) | Multi-Tags (`filter_tags[]`) | Verified Signature Dish & Icon | Primary Filter Matches |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Pele Pele** | `🇬🇭 WEST AFRICAN · GRILLED SUYA` | `k_chicken` | `["african", "street_food", "grill", "spicy", "halal"]` | `Suya Beef Skewers` (`k_chicken`) | `Street Food`, `Halal`, `Spicy` |
| 2 | **Chaiwala** | `🇵🇰 PAKISTANI · STREET KARAHI` | `curry` | `["pakistani", "karahi", "halal", "street_food", "chai", "asian"]` | `Chicken Shinwari Karahi` (`curry`) | `Indian & Pakistani`, `Halal`, `Asian` |
| 3 | **King Falafel** | `🇵🇸 PALESTINIAN · FALAFEL TRUCK` | `kebab` | `["falafel", "vegan", "vegetarian", "street_food", "food_truck"]` | `Spesial Falafel Rull` (`kebab`) | `Food Truck`, `Street Food`, `Vegan` |
| 4 | **Hernández Oslo** | `🇲🇽 MEXICAN · ARTISAN PALETAS` | `gelato` | `["dessert", "paletas", "mexican", "ice_cream", "sweet"]` | `Mango Chamoy Paleta` (`gelato`) | `Dessert`, `Mexican`, `Sweets` |
| 5 | **Oslo Sandwich Shop** | `🇺🇸 AMERICAN · DELI SANDWICHES` | `banh_mi` | `["sandwiches", "deli", "pastrami", "street_food", "lunch"]` | `Reuben on Rye` (`banh_mi`) | `Sandwiches`, `Street Food`, `Lunch` |
| 6 | **Ahaan** | `🇹🇭 THAI · STREET FOOD & CURRY` | `curry` | `["thai", "street_food", "asian", "spicy", "curry", "dinner"]` | `Northern Thai Khao Soi` (`noodles`) | `Thai`, `Asian`, `Spicy`, `Noodles` |
| 7 | **Gioia AS** | `🇮🇹 ITALIAN · ARTISAN GELATO` | `gelato` | `["gelato", "dessert", "italian", "crepes", "sweet"]` | `Pistachio di Bronte Gelato` (`gelato`) | `Dessert`, `Italian`, `Sweets` |
| 8 | **Corral's Tacos Solli** | `🇲🇽 MEXICAN · TAQUERIA & BIRRIA` | `tacos` | `["tacos", "birria", "mexican", "street_food", "casual"]` | `Quesabirria con Consomé` (`tacos`) | `Tacos`, `Mexican`, `Street Food` |
| 9 | **Farine** | `🇳🇴 NABOLAGSBAKERI · SOURDOUGH` | `croissant` | `["bakery", "sourdough", "pastries", "nordic", "morning"]` | `Cardamom Bun` (`cinnamon_roll`) | `Bakery`, `Breakfast`, `Pastries` |
| 10 | **Mesob Restaurant** | `🇪🇹 ETHIOPIAN · INJERA PLATTERS` | `mandi_rice` | `["ethiopian", "african", "injera", "vegan", "halal", "sharing"]` | `Mesob Beyaynetu Platter` (`mandi_rice`) | `African`, `Vegan`, `Halal`, `Dinner` |
| 11 | **Noods Norway** | `🇨🇳 CHINESE · HAND-PULLED BIANG BIANG` | `ramen` | `["noodles", "biang_biang", "chinese", "asian", "spicy", "casual"]` | `Chili Oil Biang Biang Noodles` (`ramen`) | `Noodles`, `Asian`, `Spicy` |
| 12 | **Szechuan Chengdu** | `🇨🇳 SICHUAN · SPICY SPECIALTIES` | `curry` | `["chinese", "sichuan", "spicy", "asian", "dumplings", "dinner"]` | `Mapo Tofu Traditional` (`curry`) | `Asian`, `Chinese`, `Spicy`, `Dinner` |
| 13 | **Izakaya Oslo** | `🇯🇵 JAPANESE · TRADITIONAL IZAKAYA` | `dumplings` | `["japanese", "izakaya", "asian", "tapas", "drinks", "dinner"]` | `Homemade Pork Gyoza` (`dumplings`) | `Japanese`, `Asian`, `Drinks`, `Dinner` |
| 14 | **Syverkiosken** | `🇳🇴 OSLO HERITAGE · ARTISAN PØLSER` | `street_food` | `["street_food", "heritage", "sausage", "kiosk", "lunch"]` | `Spesialpølse i Lompe` (`street_food`) | `Street Food`, `Lunch`, `Oslo Heritage` |
| 15 | **The Little Pickle** | `🇬🇧 MODERN BISTRO · NATURAL WINE` | `natural_wine` | `["natural_wine", "bistro", "seasonal", "dinner", "drinks"]` | `House Terrine & Sourdough` (`breads`) | `Drinks & Wine`, `Dinner` |
| 16 | **Marani** | `🇬🇪 GEORGIAN · KHINKALI & KHACAPURI` | `dumplings` | `["georgian", "khinkali", "khachapuri", "cheese", "wine", "dinner"]` | `Khinkali with Spiced Beef` (`dumplings`) | `Dumplings`, `Dinner`, `Wine` |
| 17 | **Gazakjøkken** | `🇵🇸 PALESTINIAN · AUTHENTIC GRILL` | `kebab` | `["palestinian", "middle_eastern", "halal", "shawarma", "grill"]` | `Gaza Mixed Grill Platter` (`kebab`) | `Middle Eastern`, `Halal`, `Grill` |
| 18 | **Silin Bakeri** | `🇸🇾 SYRIAN · TRADITIONAL SWEETS` | `dessert` | `["bakery", "syrian", "baklava", "knafeh", "halal", "sweet"]` | `Handmade Pistachio Baklava` (`dessert`) | `Bakery`, `Dessert`, `Halal` |
| 19 | **Koie Ramen** | `🇯🇵 JAPANESE · CRAFT TONKOTSU` | `ramen` | `["ramen", "japanese", "noodles", "craft_broth", "asian", "dinner"]` | `Spicy Miso Tonkotsu Ramen` (`ramen`) | `Ramen`, `Noodles`, `Asian`, `Dinner` |
| 20 | **Vinoteket** | `🇮🇹 ARTISAN PIZZA · NATURAL WINE` | `pizza` | `["pizza", "gourmet_pizza", "natural_wine", "italian", "dinner"]` | `Løyrom Pizza (White Base)` (`pizza`) | `Pizza`, `Drinks & Wine`, `Dinner` |

---

## PART 5: Proposed TypeScript & Supabase Schema Updates

### 5.1 Updated TypeScript Interfaces (`types/index.ts`)

```typescript
// 1. Identity & Presentation Metadata
export interface VenueIdentity {
  cuisine_id: string;          // e.g. 'indian', 'vietnamese', 'japanese', 'yemeni', 'nordic'
  country_flag: string;        // e.g. '🇮🇳', '🇻🇳', '🇯🇵', '🇾🇪', '🇳🇴', '✦'
  cuisine_label: string;       // e.g. 'INDIAN', 'VIETNAMESE', 'JAPANESE', 'NORDIC BAKERY'
  concept_subtitle: string;    // e.g. 'STREET FOOD', 'BANH MI & COFFEE', 'MATCHA BAR'
}

// 2. Dish Definition with Dedicated Icon
export interface VenueDishItem {
  id?: string;
  dish_name: string;
  category: FoodCategory | string; // e.g. 'coffee', 'banh_mi', 'curry', 'ramen'
  icon_key?: string;               // Dedicated vector SVG key (e.g. 'coffee', 'croissant')
  price_nok: number | null;
  taste_tags: string[];
  review_text: string;
  verification_source: string;
  image_url?: string;
}

// 3. Modern Venue Interface
export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  spot_type: SpotType;         // 'restaurant' | 'food_truck' | 'popup'

  // Decoupled Taxonomy Fields
  identity: VenueIdentity;     // Flag + Cuisine + Concept Header
  pin_icon: string;            // Key for FOOD_PIN_SVG_MAP (e.g. 'naan', 'banh_mi', 'matcha')
  filter_tags: string[];       // Multi-category search tokens (['asian', 'halal', 'coffee'])
  dietary_tags?: DietaryTag[]; // ['halal', 'vegan', 'vegetarian', 'gluten_free', 'spicy']
  dishes?: VenueDishItem[];    // Rich verified dishes with individual categories

  // Metadata & Commercials
  price_level?: "$" | "$$" | "$$$";
  opening_hours_text?: string;
  website_uri?: string | null;
  menu_url?: string | null;
  instagram_url?: string | null;
  is_official_pick?: boolean;
}
```

### 5.2 Supabase SQL Schema Migration (DDL)

```sql
-- Migration: Decouple Venue Taxonomy and Multi-Tagging System

-- 1. Add modern taxonomy columns to public.venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS cuisine_id TEXT,
  ADD COLUMN IF NOT EXISTS country_flag TEXT,
  ADD COLUMN IF NOT EXISTS cuisine_label TEXT,
  ADD COLUMN IF NOT EXISTS concept_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS pin_icon TEXT,
  ADD COLUMN IF NOT EXISTS filter_tags TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS opening_hours_text TEXT;

-- 2. Create GIN index for ultra-fast multi-tag radar queries
CREATE INDEX IF NOT EXISTS idx_venues_filter_tags 
  ON public.venues USING GIN (filter_tags);

CREATE INDEX IF NOT EXISTS idx_venues_cuisine_id 
  ON public.venues (cuisine_id);

-- 3. Document columns
COMMENT ON COLUMN public.venues.country_flag IS 'Emoji flag or glyph (e.g. 🇮🇳, 🇻🇳, ✦)';
COMMENT ON COLUMN public.venues.cuisine_label IS 'Primary cuisine brand label (e.g. INDIAN, VIETNAMESE)';
COMMENT ON COLUMN public.venues.concept_subtitle IS 'Specialty subtitle (e.g. STREET FOOD, BANH MI & COFFEE)';
COMMENT ON COLUMN public.venues.pin_icon IS 'Direct key into FOOD_PIN_SVG_MAP for map pin graphic';
COMMENT ON COLUMN public.venues.filter_tags IS 'Multi-concept tokens for multi-axis map and feed filtering';
```

---

## PART 6: Step-by-Step Implementation & Migration Plan

### Step 1: Types & Schema Preparation (Zero Breaking Changes)
- Add `VenueIdentity` and optional fields (`identity`, `pin_icon`, `filter_tags`) to `types/index.ts`.
- Ensure backwards compatibility: fallback to `resolveEntityTaxonomy()` if `identity` is null on legacy venues.

### Step 2: Fix `openingHours.ts`
- Remove lines 142–154 in `openingHours.ts` (`isEarlyMorning => "Closed · Opens 08:00"`).
- Replace with a parser for `opening_hours_text` when available.
- Fallback to neutral status: `"Hours unverified · See Instagram / Wolt"` rather than hardcoding fake morning hours.

### Step 3: Decouple Map Card Header in `MapRadarView.tsx`
- Replace line 1648 in `MapRadarView.tsx`:
  ```typescript
  // Before:
  // ${taxonomy.group.shortLabel || taxonomy.dishLabel}

  // After:
  // ${venue.identity 
  //   ? `${venue.identity.country_flag} ${venue.identity.cuisine_label} · ${venue.identity.concept_subtitle}`
  //   : (taxonomy.group.shortLabel || taxonomy.dishLabel)}
  ```
- Replace line 1581 (header icon) to render the cuisine badge or `pin_icon`, completely freeing Masala Politics from the baguette basket.

### Step 4: Fix Signature Dish Chip in `MapRadarView.tsx`
- In lines 1746–1751, replace the reuse of `filterWebp` with `getDishIconKey(signatureDishName, dish.category)`.
- Guarantees that `Coconut Coffee` at Em Oi! displays a coffee cup icon and never the ramen bowl.

### Step 5: Upgrade Map & Feed Filter Engine
- In `HomeView.tsx` (lines 332–351) and `MapRadarView.tsx` (lines 669–704), replace the single-value equality checks with `venueMatchesFilter()`.
- Enables multi-concept discovery: filtering by `Coffee` immediately discovers Fuglen, Kuro, Em Oi!, Ochaya, and Cocoa Café.

### Step 6: Review & Final Acceptance
- Verify live UI cards for Masala Politics (`🇮🇳 INDIAN · STREET FOOD`), Em Oi! (`🇻🇳 VIETNAMESE · BANH MI & COFFEE`), and Ochaya (`🇯🇵 JAPANESE · MATCHA BAR`).
- Verify early morning browsing displays honest status instead of `"Closed · Opens 08:00"`.
"""

with open('FILTER_AND_TAXONOMY_BLUEPRINT.md', 'w') as f:
    f.write(blueprint_content)

print("Saved FILTER_AND_TAXONOMY_BLUEPRINT.md successfully!")
