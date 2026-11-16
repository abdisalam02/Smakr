# Smakr Dish Imagery: Wolt/Foodora Copyright, Legal Safeguards & Category-Aware AI Transformation Architecture

**Target**: `Smakr` (Oslo Food Radar)  
**Location**: `frontend/curation/AI_IMAGE_REMIX_AND_COPYRIGHT_AUDIT.md`  
**Date**: November 2026  
**Auditor**: AntiGravity Senior Systems Architect & IP Compliance  

---

## 1. Executive Summary & Core Rule

Smakr's curated discovery feed depends strictly on **dish-only macro photography** rather than venue facades or generic branding. When sourcing reference imagery from delivery platforms (Wolt, Foodora) or press kits, two traps must be avoided:
1. **Legal Infringement (Åndsverkloven § 23 & § 6)**: Direct scraping, minor cropping, or color filtering remains an infringing derivative work (*bearbeidelse*) detectable by perceptual hashes (`pHash`, `dHash`, Google Lens).
2. **The "Generic Ceramic Plate" Trap**: Running every dish through a single hardcoded prompt ("Plated on modern Scandinavian ceramic tableware, 45° angle") destroys the **Culinary Truth** of street food (e.g., unwrapping a King Falafel roll, taking an iced matcha out of its clear cup, or putting a Kveitemjøl cube croissant on dinner stoneware) and makes the entire feed look AI-cloned.

### The Golden Rule for Åndsverkloven § 4 (*Selvstendige nye verk*)
> **Lock the Edible Geometry (85% fidelity), Mutate the Context & Micro-Physics (100% replacement).**

---

## 2. The Legal & Visual Line: "What Stays" vs. "What Changes"

Under Norway's Copyright Act (*Åndsverkloven* § 23), the photographer owns the specific photographic expression (exact pixel arrangement, lighting setup, background props, camera angle, and accidental details like the exact swirl of crema or coordinate of a sesame seed). They do **not** own the recipe, dish concept, or ingredient combination.

| Layer | Rule | Concrete Examples |
|---|---|---|
| **1. Core Culinary DNA** | **LOCKED 100%** — Never alter ingredient list, bread/noodle gauge, cook level, sauce color, or portion structure. | • Keep exact laminated layers on a cube croissant.<br>• Keep exact thick Sanuki udon vs. thin ramen noodle gauge.<br>• Keep exact layering of mango puree -> milk -> green matcha. |
| **2. Micro-Stochastics** | **ORGANIC SHUFFLE** — Re-seed chaotic micro-physics so pixel-matching crawlers fail while human eyes see the exact same dish. | • **Drinks**: Change latte art pattern (Rosetta -> Tulip/Heart swirl) or ice cube arrangement.<br>• **Garnishes**: Shift scatter of chopped scallions, sesame seeds, cilantro, chili oil droplets.<br>• **Cheese/Crumb**: Vary melt drip angle or blister coordinates on pizza crust. |
| **3. Vessel & Packaging** | **CATEGORY-AWARE SWAP** — Swap plate, bowl, tray, or wrapper for an equivalent vessel of a different material/glaze. | • **Sit-down bowls**: White melamine -> charcoal stoneware or earthy ceramic.<br>• **Street food**: Branded wrapper -> unbranded brown kraft butcher paper & brushed steel tray.<br>• **Iced drinks**: Branded plastic cup -> clean unbranded crystal-clear cup or ribbed glass. |
| **4. Camera Angle** | **15°–30° SHIFT** — Shift virtual camera enough to alter 2D projection geometry without hiding hero ingredients. | • **90° Flat-lay** (Wolt default) -> **45° Diner's Eye View** or **60° Bowl Angle**.<br>• **45° Angle** -> **25° Low Hero Macro** (mandatory for tall burgers, stacked sandwiches, layered drinks). |
| **5. Surface & Lighting** | **TOTAL REPLACEMENT** — Strip studio flash/lightboxes and replace with realistic Oslo cafe/bistro ambient lighting. | • **Surfaces**: Brushed stainless steel counter, warm oak, dark honed slate, cream terrazzo.<br>• **Lighting**: Soft overcast Nordic window light, warm tungsten bistro glow, morning bakery sunbeams. |

---

## 3. The 6 Dish Archetypes & Transformation Matrix (`dishImageRemixConfig.ts`)

### Archetype A: Coffee, Matcha & Specialty Drinks (`coffee`, `matcha`, `drinks`)
* **Integrity Lock**: Cup/glass form factor (hot ceramic vs. iced clear cup), drink color layers (e.g., Ochaya Mango Matcha gradient or Em Oi! whipped egg/ube foam).
* **Mutations**:
  - *Swirls & Foam*: Change exact latte art swirl (multi-leaf rosetta -> heart, tulip, or micro-foam wave). For iced drinks, re-randomize milk-cloud marbling and ice cube geometry.
  - *Vessel*: Speckled oat stoneware for hot drinks; unbranded crystal-clear cup or fluted glass for iced drinks. Zero printed cafe logos.
  - *Angle & Surface*: 25°–35° profile (iced layers) or 45°–60° cafe table angle (hot foam) on cream terrazzo or warm oak.

### Archetype B: Bakeries, Viennoiserie & Cookies (`bakery`, `cinnamon_roll`, `dessert`)
* **Integrity Lock**: Pastry geometry (Kveitemjøl cube croissant, twisted cardamom knot vs. spiraled snurr, molten cookie core), honeycomb lamination flakiness, and toppings (pistachio crumble, pearl sugar, cardamom specs).
* **Mutations**:
  - *Presentation*: Unbleached crinkled parchment paper, wire cooling rack, or minimalist stoneware side plate.
  - *Micro-details*: Vary scatter of stray flaky pastry crumbs and cardamom sugar crystals on the paper.
  - *Angle & Lighting*: 30°–45° macro at f/2.2 with crisp morning directional sunbeams.

### Archetype C: Handheld Street Food, Wraps, Tacos & Burgers (`street_food`, `tacos`, `kebab`, `burrito_wrap`, `cheesesteak`, `banh_mi`)
* **Integrity Lock**: Bread/tortilla type (crusty Vietnamese baguette, blistered saj flatbread, double corn tortilla, toasted hoagie), protein sear, sauce drizzle, pickled toppings.
* **Mutations**:
  - *Strictly No Dinner Plates*: Swap container to brushed stainless steel street-food tray lined with unbranded brown kraft butcher paper, checkered deli liner, or rustic wooden board.
  - *Cross-Section Arrangement*: If cut in half, stack one half at a 45° diagonal lean against the other so the melted cheese / pâté / cilantro cross-section faces the lens.
  - *Angle*: 25° low hero macro looking across the filling.

### Archetype D: Bowls, Ramen, Pho & Curries (`ramen`, `vietnamese`, `noodles`, `curry`, `mandi_rice`)
* **Integrity Lock**: Broth color and opacity (clear Phở vs. milky Paitan vs. fiery Tantanmen), noodle gauge, protein cut (chashu, roasted chicken on basmati, cubed tofu), core toppings (jammy egg half, wood-ear mushrooms, lime wedge).
* **Mutations**:
  - *Bowl & Utensils*: Swap melamine -> matte charcoal ceramic, earth-toned stoneware, or dark cast-iron/hammered brass karahi. Reposition chopsticks/spoon to 7 o'clock.
  - *Micro-physics*: Re-randomize floating chili oil droplets, scallion ring scatter, sesame seeds, and rising steam wisps.
  - *Angle*: 60° high three-quarter diner perspective showing both bowl layout and broth depth.

### Archetype E: Pizza & Flatbreads (`pizza`, `naan`)
* **Integrity Lock**: Crust style (thick Roman pan slice at Digg vs. thin NY slice at Stykke vs. blistered Neapolitan vs. garlic naan), cheese melt, exact toppings (cupped pepperoni, whipped ricotta, nduja).
* **Mutations**:
  - *Plating*: Swap delivery cardboard box -> perforated metal pizza peel or rustic wooden board with parchment.
  - *Micro-details*: Shift coordinate positions of leopard-spotted char blisters, fresh basil leaves, and hot-honey/chili-oil drizzle lines.
  - *Angle*: 45° slice-focus perspective emphasizing airy crust cornicione and melted cheese pull.

### Archetype F: Shared Platters, Dim Sum & Small Plates (`dumplings`, `k_chicken`, `natural_wine`)
* **Integrity Lock**: Dumpling fold geometry (pleated translucent Har Gow vs. open-top Siu Mai vs. pan-fried Gyoza), sticky glaze on Korean fried chicken, dipping sauces.
* **Mutations**:
  - *Rotation & Arrangement*: Rotate bamboo steamer basket or izakaya platter by 45°–90° and move the small dipping sauce dish to a new corner.
  - *Micro-details*: Vary sesame seed scatter, crushed peanut distribution, and chili crisp pools.

---

## 4. Two-Pass Vision + Synthesis Pipeline (`POST /api/admin/transform-dish-image`)

1. **Pass 1 — Forensic Culinary Extraction (`gemini-2.5-flash` Vision)**:
   - Fetches the source reference image and extracts ONLY the non-copyrightable culinary DNA (exact bread/noodle/pastry geometry, protein sear, sauce viscosity/color, drink layers, garnish cuts) while stripping out the original photographer's background, plate, watermark, and lighting.
2. **Pass 2 — Controlled Re-Synthesis (`gemini-2.5-flash-image` / `gemini-3.1-flash-image`)**:
   - Combines the extracted culinary DNA with the category-specific `anglePreset`, `vesselPreset`, `environmentPreset`, and `Micro-Stochastic Mutation Instructions`.
   - Post-processes via `sharp(buffer).resize({ width: 1080, height: 810, fit: 'cover' }).webp({ quality: 84 })` and uploads directly to Supabase Storage (`dish-photos/`).
