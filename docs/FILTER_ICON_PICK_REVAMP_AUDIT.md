# Filter, Icon System and Smakr Pick Revamp: Audit and Brief

Purpose: one self-contained brief to hand to another AI that will write the detailed implementation plan.
Status: audit and requirements only. No code was changed for this document.
Audit date: 2026-11-05. Line numbers refer to the repo at commit `dc779f4`.
Read first for context: `docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`. Hard rules: `GEMINI.md`.

---

## 1. What the owner wants (every request, restated)

### 1.1 Top filter strip (the horizontal pill row)
- W1. Show only filters that currently have items. No empty pills.
- W2. Order pills by item count, highest first, then descending.
- W3. Stop the "endless scroll" feel. The row should be short and honest.

### 1.2 Filter dropdown (drawer)
- W4. Replace the current spot-type and diet rows with a drawer that shows the custom food icons, bigger.
- W5. Open it by tapping the Filters pill or by swiping/yanking the strip to the left edge (existing gesture, see 3.1).
- W6. Opening animation: the pills from the top strip descend and grow into a horizontal slider of larger icon tiles.
- W7. Under the slider: dietary preferences, each with its own custom icon.
- W8. Dietary icons must be custom too, not generic.

### 1.3 Scroll behaviour regression
- W9. The filter drawer and the Smakr Pick card used to close neatly when the user scrolled the feed. That no longer works. Restore it.

### 1.4 Icon system audit and redesign
- W10. Audit the icon system. It is getting complicated: spots have icons, dishes have icons, categories have icons.
- W11. A spot must have its own icon, separate from the dish icon. Example: a restaurant that sells an iced coffee must not become a cafe pin.
- W12. The map card (the popup shown when a pin is tapped) must show the spot icon and state the spot type (restaurant, cafe, bakery, bar, food truck, pop-up).
- W13. Introduce category grouping. Example: cinnamon bun belongs under Pastries. So filters need sub-categories.
- W14. Decide where Banh Mi sits, and whether nationality/cuisine becomes a filter.
- W15. Map the staple filters the product needs, so custom icons can be made for every one of them.

### 1.5 Smakr Pick on the map
- W16. Change the look. The mascot bust should point at the picked restaurant, sitting next to its icon.
- W17. Size the bust relative to the spot pin and place it right beside the picked location.
- W18. Find a bust avatar variant that points. Do not fake it badly.

---

## 2. Audit: how the icon system works today

### 2.1 The three overlapping icon layers
| Layer | Where defined | Key used | Notes |
|---|---|---|---|
| A. SVG bodies | `frontend/src/components/food/FoodIcons.tsx` `SMAKR_ICON_SVG_BODIES` (lines 25-149) | category id or icon name | Hand-drawn 24px duotone icons for ~35 keys plus 13 custom WebP `<image>` entries added at lines 129-141 |
| B. Custom raster set | `frontend/public/icons/food/*.webp` + `frontend/public/food-svgs/*.svg` | `CUSTOM_VECTOR_ICONS` set (FoodIcons.tsx line 151) | 192px WebP, referenced from layer A as `<image href>` |
| C. Emoji | `venue.icon` (DB `vibe_signals.icon`), `FoodCategoryDef.emoji` in `lib/foodSeeds.ts` lines 3-35, `lib/foodIconsCatalog.ts` | emoji string | Still the default for most venues |

`resolveCustomIconKey` (added in `dc779f4`) maps a few emojis to custom keys, so layer C leaks into layer A/B at render time.

### 2.2 One field is doing three jobs
`Venue` (`types/index.ts` lines 225-235) carries:
- `food_category: FoodCategory` single value. Used for filters, pin icon, card label, and category bar.
- `icon?: string` admin-picked emoji or custom key. Overrides the pin glyph.
- `place_type: "cafe" | "library" | "coworking" | "hotel_lobby"`. Legacy from the old CityPulse workspace product. Still hard-coded to `"cafe"` in seeds and several components (`foodSeeds.ts`, `MapRadarView.tsx:695`, `SmakrCardStudio.tsx`, `AdminPopupWizardModal.tsx:171`). `components/map/RadarPin.tsx:42` still reads it. It is not a real restaurant-kind field.
- `spot_type?: "restaurant" | "food_truck" | "popup" | "pop_up" | "standard"`. Describes format, not what kind of place it is. Note the duplicate `popup` / `pop_up` values.

`FoodPost` has its own `category` (dish level) and `spot_type`. So the dish and the venue each have a category, and the venue pin follows the venue category or the admin emoji, not a spot-kind icon.

### 2.3 Where each icon is rendered today
| Surface | File | Icon source |
|---|---|---|
| Map pin | `MapRadarView.tsx` ~237-253 | `venue.icon` if custom, else `food_category`, else emoji glyph |
| Map popup card | `MapRadarView.tsx` ~1215-1330 | no icon at all, only name, price, photo, badges |
| Feed card (spots) | `FoodSpotCard.tsx` lines 25-98, 278 | `resolveFoodCategoryAndIcon` text sniffing, then `SmakrFoodIcon` |
| Venue detail pane | `VenueDetailPane.tsx` ~247, ~307 | `venue.icon` or category emoji |
| Top pill strip | `FeedFilterBar.tsx` lines 19-48 | `SmakrFoodIcon name={pill.id}` |
| Category bar (unused in main sheet) | `FoodCategoryBar.tsx` | `CATEGORY_ICON_MAP` in a second file, duplicating the pill list |
| Admin picker | `IconPickerModal.tsx` + `foodIconsCatalog.ts` | emoji catalog plus custom keys |
| Studio | `app/food-icon-studio/page.tsx` | SVG presets |

### 2.4 Duplication and drift found
1. Three separate category lists that disagree: `FOOD_CATEGORIES` (`foodSeeds.ts`, 31 ids), `PILLS` (`FeedFilterBar.tsx`, 27 entries, missing `k_chicken`, `naan`, `cinnamon_roll`, `bao`, `mandi_rice`, `middle_eastern`), and `CATEGORY_ICON_MAP` (`FoodCategoryBar.tsx`).
2. `CUISINES` const in `FeedFilterBar.tsx` (lines 50-75) is declared and never used.
3. `FoodSpotCard.tsx` re-implements category detection by sniffing text (lines 25-98) in parallel with `lib/categoryResolver.ts`. Two resolvers, different results.
4. `pho` is aliased to `vietnamese` and `vietnamese` renders the Banh Mi image (`FoodIcons.tsx` lines 139-142). Pho venues therefore show a sandwich.
5. `croissant` and `bakery` share one WebP; `cinnamon_roll` and `kanelbolle` share one WebP; `bakery` is both a category and a dish.
6. `mandi_rice` and `indian` and `curry` all resolve to the same bowl icon.
7. `FoodCategory` has no `croissant`, `banh_mi`, `kanelbolle`, `flatbread`, `pho` ids, yet `resolveFoodCategoryAndIcon` now returns `croissant` / `banh_mi` as icon keys. Icon keys and category ids are different namespaces that look the same.
8. Dish-level and venue-level filters share one store field. `feedCategory` filters posts by `post.category` in dish mode and venues by `venue.food_category` in spots mode (`FoodFeed.tsx` lines 32 and 95). Map uses a separate `mapCategory`.
9. Dietary filter exists for posts (`dietary_tags`) but the venue pins never filter by diet. `spicy` is a valid `DietaryTag` and has an icon, but is not offered in the UI.
10. The weekly pick venue pin is deliberately suppressed (`MapRadarView.tsx` lines 545-551), so the picked restaurant has no spot icon on the map at all. This blocks W16 and W17.

---

## 3. Audit: filters and scroll behaviour today

### 3.1 Top strip and drawer (`frontend/src/components/filter/FeedFilterBar.tsx`, 429 lines)
- The strip renders every entry of the hard-coded `PILLS` array plus Saved and Pop-ups pills, regardless of data. 27 category pills, 3 of which are dietary, in an arbitrary order. That is the "endless scroll".
- No counts exist anywhere. Order is source order, not popularity.
- Drawer (lines 288-426) has: Open Now, Smakr Picks, price tier, Spot (All / Sit-down / Food Truck / Pop-ups), Diet (Halal / Vegan / Vegetarian / Gluten-Free). Icons are 12px (`w-3 h-3`). The custom icons are invisible at that size.
- Opening gestures: tap on the Filters pill, or at `scrollLeft <= 5` a rightward drag of more than 30px (`handleTouchMove`, lines 99-108) or a scroll event at the left edge during touch (`handleFilterScroll`). The owner calls this "yoinking to the left". Keep the gesture, confirm direction wording with the owner (the code reacts to a drag toward the right that reveals the left edge).
- The drawer uses a height spring (stiffness 380, damping 32). No layout animation links the strip pills to anything.

### 3.2 Why scroll-to-close is broken (facts from code and history)
- `MascotWeeklyDrop.tsx` line 113 has `const isScrolledDown = false;`. The flag is hard-coded, so every `isScrolledDown ? ... : ...` branch (lines 144-268) is dead.
- Commit `5c51314` replaced the original behaviour ("any feed container that scrolls down by more than 30px closes the card", using `document.querySelectorAll("[data-feed-scroll]")` with a start offset) with a shrink-only variant, and the listener effect was later removed. No scroll listener exists in the file now. The doc comment at line 57 still claims "Auto-collapses when the user scrolls a feed container down by >35px". The comment is stale.
- `FeedFilterBar.tsx` has no vertical scroll listener at all. It never closed on scroll through its own code. It only closed because the feed rebuild remounted it or the owner remembers an earlier build. Treat "closes on scroll" as a new requirement for the drawer, not a bug fix.
- Scroll containers are marked `data-feed-scroll` in `HomeView.tsx` lines 700 and 968. Those mount late (animated, behind `mobileSheet` and `feedMode` branches), so a one-time `querySelectorAll` at mount can miss them. A ref or an event-delegation capture listener on the sheet root is more reliable.
- The sheet also has a pull-to-minimise gesture on the same container (`HomeView.tsx` lines 541-580). The close-on-scroll logic must not fight it.

### 3.3 Data available for counts
- Spots mode: `venues[].food_category`, `dietary_tags`, `spot_type`.
- Dish mode: `foodPosts[].category`, `dietary_tags`.
- Store: `useCityPulseStore.ts` lines 116-121, 256-261, 333-354. Counts do not exist; they must be derived with a memoised selector.

---

## 4. Audit: Smakr Pick today

- Feed header: `MascotWeeklyDrop.tsx`. Collapsed pill (36px mascot, week chip, headline) and an expandable card.
- Map marker: `MapRadarView.tsx` `renderWeeklyMarker` (lines 732-823). A 44px circle with the mascot head, a floating "Smakr Pick" badge above it, anchored `bottom` on the coordinates. It replaces the venue pin.
- Map popup shows a "Smakr Pick" chip and price (lines 1224-1326).
- Avatar sources: `weeklyPick.mascot_avatar_url`, else `buildMascotSVGString(getOfficialSmakrMascotConfig(), ...)` cropped with viewBox `32 10 212 212`. Mascot engine is Open Peeps.
- Asset search for a pointing bust: the only pointing asset is `frontend/public/mascot/blush-pointing-up.svg` (catalog id `preset-pointing-up`, body `pointing-up`, `lib/blushMascotCatalog.ts` lines 90-98, 269). It points upward, not sideways. No horizontal-pointing bust exists in the repo.
- Duplicate duplication risk: the marker DOM is built twice in one function (create vs update branch, lines 742-773 and 791-820).

---

## 5. Proposed model: separate the four axes

The core fix is to stop using one field for four different questions.

| Axis | Question it answers | Drives | Stored on |
|---|---|---|---|
| 1. Spot kind | What kind of place is this? | Map pin icon, card header, spot filter | venue |
| 2. Dish category (with parent group) | What is this food? | Dish icon, dish feed, category filter | dish (post), derived group |
| 3. Cuisine / origin | Where is it from? | Optional secondary filter, label | venue and/or dish |
| 4. Diet | Who can eat it? | Diet filter chips | venue and dish |

Rule: the map pin shows the **spot kind** icon. The dish icon appears on the dish card and inside the map popup next to the signature dish. An iced coffee at a restaurant gives a restaurant pin and a coffee dish chip.

### 5.1 Axis 1: Spot kinds (staple set, each needs a custom icon)
Proposed ids: `restaurant` (sit-down), `cafe` (coffee bar), `bakery`, `bar` (cocktail / wine bar), `food_truck`, `popup`, `street_stall` (takeaway window / kiosk), `food_hall` (market / hall), `dessert_shop` (gelato, sweets).
Needs a new `venue_kind` field. Do not reuse `place_type` (legacy CityPulse values) or `spot_type` (format). Migrate `popup` / `pop_up` into one value. Backfill rule: from Google Places types, then `food_category`, then admin override. Admin can always override. Database migrations are a stop gate, see section 9.

### 5.2 Axis 2: Dish categories with parent groups
Parent groups are what the top strip shows. Children appear in the drawer after a group is tapped.

| Group (parent) | Children (dish categories) |
|---|---|
| Pastries and Bakery | croissant, cinnamon roll / kanelbolle, cardamom bun, bagel, waffle, sourdough loaf |
| Breads | naan, flatbread, sourdough |
| Coffee and Tea | specialty coffee, iced coffee, matcha, boba |
| Noodles and Soup | ramen, pho, udon, noodle soup |
| Sandwiches and Handhelds | banh mi, burger, taco, kebab wrap, street sandwich |
| Pizza and Pasta | pizza, pasta |
| Chicken and Grill | k-chicken, fried chicken, korean bbq, kebab, shawarma |
| Rice and Bowls | mandi, biryani and curry, bibimbap, poke |
| Dumplings and Buns | dumplings, bao |
| Seafood | sushi, nordic seafood |
| Sweets and Frozen | gelato, dessert |
| Drinks and Bars | cocktails, natural wine |
| Brunch | brunch plate, avocado toast, eggs |

Note naan appears in both Breads and (via the Indian cuisine) Rice and Bowls context. Rule: a dish category has exactly one parent group. Cuisine (axis 3) handles cross-links.

**Answer to "where does Banh Mi go":** dish category `banh_mi`, parent group Sandwiches and Handhelds, cuisine Vietnamese. It is never a cuisine pill itself. `vietnamese` today is both a category and a cuisine and shows a sandwich image, which is the drift seen in 2.4 item 4. Split them.

### 5.3 Axis 3: Cuisine / origin
Yes, add it, but as a secondary filter row in the drawer, not top-strip pills. Reason: group pills answer "what do I want to eat", cuisine answers "what style". Mixing them in one strip is what caused 27 pills.
Proposed starter set for Oslo (owner to confirm): Vietnamese, Korean, Japanese, Chinese, Indian and Pakistani, Middle Eastern and Levant, Yemeni and Somali, Italian, Mexican, Nordic, French, American. Each gets a small flag-free glyph (no national flags, to avoid politics and licence issues): a simple shape or a representative ingredient icon.
Store as `cuisines: string[]` on venue (a venue can be Vietnamese and Korean).

### 5.4 Axis 4: Diet (custom icons required)
Current `DietaryTag`: vegan, vegetarian, halal, gluten_free, spicy. UI today offers four (spicy missing).
Staple set to design icons for: halal, vegan, vegetarian, gluten free, spicy. Candidates to ask the owner about: pescatarian, dairy free, nut free. Do not add more than the data can fill; the hide-empty rule from W1 applies to diet chips too.

### 5.5 Quick toggles (not categories)
Open now, Price tier ($, $$, $$$), Smakr Picks, Saved, Pop-ups. Keep them as a separate small row. Pop-ups is both a toggle today and a spot kind; after the split it is only the `popup` spot-kind filter.

---

## 6. Filter system spec

### 6.1 Top strip
- Source of truth: derived list of groups with `count > 0`, sorted by count desc, ties alphabetical.
- Fixed leading items: `Filters` button, then `All`. Saved appears only if the user has saved items. Pop-ups appears only if an active pop-up exists.
- Each pill shows its custom icon (16px), the label, and the count.
- Counts are computed on the full dataset, not on the current filter result, so pills do not reorder while the user taps. Decide and record: spots mode counts venues, dish mode counts posts. The active pill stays visible even at 0.
- Remove the dead `CUISINES` const and the second pill list in `FoodCategoryBar.tsx`. One config module feeds both.

### 6.2 Drawer ("filter sheet")
Layout top to bottom:
1. Header row: title, active count, Reset.
2. Group slider: horizontal scroll-snap row of icon tiles. Tile 64-72px wide, icon 40-44px, label under, count badge. Tapping a group selects it and reveals its children in a second row (smaller tiles, 52px) directly beneath, animated height.
3. Spot kind row (axis 1) with large icons.
4. Cuisine row (axis 3), text chips with small glyphs.
5. Diet row (axis 4) with custom icons, 44px tiles.
6. Quick toggles row.

Opening animation (W6): use Motion shared layout (`layoutId`) so each strip pill morphs into its slider tile: pills translate down, scale to tile size, icon scales up, labels fade in. Spring close to the existing one (stiffness 380, damping 32). Honour `prefers-reduced-motion` by cross-fading only.
Triggers: tap Filters, leftward-edge pull gesture (keep thresholds, add a velocity check so a normal fling does not open it), and keyboard (Enter/Space on the button).

Close triggers: tap Filters again, tap outside, selecting a final filter (optional), and **vertical scroll of the feed** (see 6.3).

### 6.3 Close on scroll (W9)
- One shared hook, for example `useCollapseOnFeedScroll({ threshold: 30 })`, that attaches one passive scroll listener to the sheet's active scroll container via ref (not `document.querySelectorAll` at mount).
- On scroll down beyond the threshold: close the filter drawer and collapse the Smakr Pick card. On scroll back to top (under 10px): allow them to reopen but do not auto-reopen.
- Remove the hard-coded `isScrolledDown = false` in `MascotWeeklyDrop.tsx` and either wire the compact (shrunk) state to the hook or delete the dead branches. Update the stale doc comment at line 57.
- Must coexist with pull-to-minimise in `HomeView.tsx` 541-580 (it only acts at `scrollTop <= 1`).
- Test in peek, half and full sheet states, and in popups / food / places feed modes.

### 6.4 Accessibility and layout rules
- Buttons have `aria-pressed` / `aria-expanded`, 44px minimum touch targets in the drawer.
- Nothing wider than 375px viewport forces horizontal page scroll. Use `dvh`, not `vh`.
- Colour: Burnt Paprika `#e84a27` only accent, Warm Oat canvas, Espresso text (`docs/DESIGN.md`). Matcha green `#4E8752` is used by the existing diet chips; confirm it stays allowed.
- No glassmorphism on the new tiles; the existing popup uses blur, flag for review.
- Radii: choose two (one for tiles, one for pills) and record them.

---

## 7. Icon system spec

### 7.1 One registry
Create a single typed registry (for example `lib/iconRegistry.ts`) as the only place that maps ids to artwork:
```
type IconEntry = {
  id: string;              // stable key, never an emoji
  kind: "spotKind" | "dish" | "group" | "diet" | "cuisine" | "ui";
  label: string;
  svg?: string;            // 24px duotone body
  webp?: string;           // custom raster, 192px
  svgSource?: string;      // vector master
  parent?: string;         // group id for dishes
  aliases?: string[];      // old keys and emojis, for migration only
};
```
Everything else (pins, cards, drawer, picker, studio) reads the registry. Delete `CATEGORY_ICON_MAP`, the second `PILLS` list, and the emoji sniffing in `FoodSpotCard.tsx`; fold `categoryResolver.ts` into one resolver that returns `{ spotKind, dishCategory, group, cuisines, diet }`.

### 7.2 Rendering rules
- Map pin: `spotKind` icon. If a venue has no kind, fall back to a neutral storefront, never to a dish icon.
- Map popup card (W12): header row with spot-kind icon (28px) plus the kind label ("Restaurant", "Cafe", "Bakery", "Bar", "Food truck", "Pop-up"), then neighbourhood and price. Signature dish chip row below, using the dish icon (20px). Add `aria-label` and text, not icon alone.
- Feed card: kind icon plus label on line 1, dish chips on the card body.
- Dish card: dish icon.
- Pin appearance may need two sizes (map pin 22px, drawer tile 44px). The 192px WebP covers both; confirm the SVG masters are small enough (many current SVGs exceed 700 KB, see 7.4).

### 7.3 Icon inventory: what exists and what must be created
Existing custom artwork (13 keys, 8 distinct images): k_chicken / fried_chicken, naan / flatbread, croissant / bakery, cinnamon_roll / kanelbolle, pizza, coffee, banh_mi / vietnamese, ramen.

Still missing as custom art, grouped by axis (each is a distinct image the owner can generate with the existing pipeline in `docs/FOOD_ICON_FACTORY_GUIDE.md`):
- Spot kinds (9): restaurant, cafe, bakery storefront, bar, food truck, pop-up, street stall, food hall, dessert shop. These are architecture-style icons, different from the photographic food set; decide whether they should use the same real-photo pipeline or a flat pictogram style (owner decision, see section 10).
- Dish categories: pho, udon, burger, taco, kebab, shawarma, korean bbq, fried chicken (separate from k-chicken), biryani/curry, mandi, bibimbap, poke, dumplings, bao, pasta, sushi, nordic seafood, gelato, dessert, cocktail, natural wine, matcha, boba, iced coffee, brunch, cardamom bun, bagel, waffle, sourdough.
- Group icons (13): one hero icon per parent group. Prefer reusing an existing hero dish icon (croissant for Pastries, coffee for Coffee and Tea, ramen for Noodles and Soup, banh mi for Sandwiches, pizza for Pizza and Pasta, k-chicken for Chicken and Grill, naan for Breads). Six groups still need a hero: Rice and Bowls, Dumplings and Buns, Seafood, Sweets and Frozen, Drinks and Bars, Brunch.
- Diet (5): halal, vegan, vegetarian, gluten free, spicy. These are badges, not food photos; a flat custom pictogram set is the realistic route.
- Cuisine glyphs (about 12).

Total new artwork is large. Recommend the implementation plan phases icons by what the filter strip will actually show first (groups with data), not all at once.

### 7.4 Asset hygiene problems to fix in the same pass
- `frontend/public/food-svgs/` holds many multi-megabyte SVGs (for example `vtracer-high.svg` 10.9 MB, `recraft-stack-*.svg` about 4.6 MB each, `image.svg` 4.6 MB) and the new icon SVGs are 0.7 to 1.2 MB each. They are served from `public/`, so they are downloadable by any visitor. Only the 192px WebPs are needed at runtime. Decide which SVGs remain public (studio only) and which move out of `public/`.
- Deleting files is a stop gate. The plan must list candidates for the owner to approve, not delete silently.
- Several `*-quant.png` intermediates are written into `public/food-svgs/` by the generator. They are untracked clutter; route them to a scratch folder.
- 17 inspection scripts were added to `frontend/scripts/` during the last icon pass and are not committed. Decide which to keep.

---

## 8. Smakr Pick on the map: spec (W16-W18)

Goal: the mascot bust stands beside the picked restaurant's own spot icon and points at it. No longer a replacement pin.

1. Restore the picked venue's pin. Remove the suppression at `MapRadarView.tsx` lines 551-552 so the venue shows its spot-kind icon.
2. Place the bust beside that pin, not on top. Offset and flip by screen side: default to the left of the pin pointing right; if the pin is within a threshold of the left edge, place right and mirror. Re-evaluate on `moveend` and resize, with a single cached placement per zoom bucket to avoid jitter.
3. Size relative to the pin: bust height about 2.2x the pin diameter at the default zoom, with a min 56px and max 96px, scaling mildly with zoom (a clamp function of `map.getZoom()`).
4. Keep the "Smakr Pick" chip, anchored to the bust, not floating over the pin.
5. Tap targets: bust opens the Smakr Pick card, pin opens the venue popup. Z-order so the bust never covers neighbouring pins' tap targets (use `pointer-events` on the bust image only).
6. The popup for the picked venue keeps the "Smakr Pick" chip and price.
7. Dedupe the marker builder that currently exists twice (create and update branches).

**Pointing bust asset (W18).** Findings: only `blush-pointing-up.svg` exists, pointing up. Options for the plan to compare:
- A. Source a Blush Open Peeps bust with a horizontal point (the repo already uses Blush Pro Open Peeps assets via `lib/blushMascotCatalog.ts`). Needs the Blush licence recorded in docs before use (global rule: no external assets without a recorded licence).
- B. Compose the existing Open Peeps bust (mascot engine already renders it) with a separate pointing-hand layer drawn in the same style, rotated toward the pin.
- C. Reuse `pointing-up` rotated about 70 degrees. Likely looks wrong (shoulders and hand break). Test first, probably reject.
Whichever wins must work mirrored (left and right facing) and keep the official mascot look (`lib/officialSmakrMascot.ts`).

---

## 9. Constraints and stop gates for the implementer
- Changing the DB (`venue_kind`, `cuisines`, `parent group`) means a migration under `frontend/supabase/migrations`. That is a stop gate in `GEMINI.md`; the plan must mark it and wait for approval. Prefer deriving group and cuisine in code first and persisting later.
- No new dependencies. Motion (`motion/react`) is already installed; use it for layout animations.
- No CDN fonts, no trackers.
- Never read or touch `backend/`.
- Deleting files requires approval (7.4).
- Verify from `frontend/` with `npx tsc --noEmit`. UI work needs a check at 375px width.
- Design rules in `docs/DESIGN.md` apply; icons must follow the real-photo remix pipeline in `docs/FOOD_ICON_FACTORY_GUIDE.md` for food art. No illustration-style prompt words.

---

## 10. Decisions the owner still needs to make
1. Spot-kind icon style: photographic remix like the food set, or flat pictograms. (Recommendation: flat pictograms for spot kinds and diet badges, photo-remix for dishes.)
2. Final parent groups and which dish goes under which (table in 5.2).
3. Cuisine list and whether a venue can have several.
4. Diet extras beyond the five existing tags.
5. Whether counts come from venues or dishes per mode, and whether pills reorder live.
6. Swipe direction wording for opening the drawer (current code reacts to a rightward drag at the left edge).
7. Pointing bust: source a new asset (licence) or compose one.
8. Which public SVG files can leave `public/`.

---

## 11. Suggested work breakdown (for the planning AI to refine)
1. Taxonomy module: one config for spot kinds, groups, dish categories, cuisines, diet, with aliases for old keys. Pure data plus resolver, no UI.
2. Icon registry and resolver consolidation. Replace layer A/B/C lookups behind one function. Keep emoji only as an alias input.
3. Counts selector and top strip rewrite (hide empty, sort by count).
4. Close-on-scroll hook, wire Smakr Pick and the drawer, delete dead `isScrolledDown` code.
5. Drawer redesign with layout animation, group slider, sub-categories, diet row.
6. Map popup: spot-kind icon and type label, dish chips.
7. Pin switch to spot-kind icons, restore picked venue pin.
8. Smakr Pick marker: pointing bust, relative sizing, side flip.
9. Icon production in priority order (groups with data, spot kinds, diet), then the rest.
10. Asset cleanup proposal and owner approval.
11. DB migration proposal (only after code-derived version proves out).

## 12. Acceptance checks
- Strip shows only non-empty groups, highest count first. Zero-count pills are absent.
- Drawer opens by tap and by edge pull; pills visibly descend and enlarge into tiles; diet row uses custom icons.
- Scrolling the feed down more than 30px closes the drawer and collapses the Smakr Pick card in peek, half and full sheet states.
- A restaurant with an iced coffee dish shows a restaurant pin; its popup shows the restaurant icon and the type label, and the coffee as a dish chip.
- Cinnamon roll appears under Pastries and Bakery; Banh Mi appears under Sandwiches and Handhelds with Vietnamese as its cuisine.
- Smakr Pick bust stands beside the picked venue's own icon, points at it, flips near screen edges, and does not cover other pins.
- `npx tsc --noEmit` passes. Layout holds at 375px.
