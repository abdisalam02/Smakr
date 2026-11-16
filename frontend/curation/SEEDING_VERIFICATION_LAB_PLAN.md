# Smakr Seeding Verification Lab — Architecture & Implementation Plan

**Target System**: Gemini Argon / Core Engineering  
**Objective**: Build a clean, lightweight manual verification studio at `/admin/seeding-lab` where curators visually vet candidate venues and dishes, swap photos, adjust prices/text, and verify map icons before database insertion.  
**UX Paradigm**: Non-bloated, card-first interface modeled after `food-icon-studio`, rendering candidate items exactly as they appear in the live feed (`FoodPostCard.tsx`).

---

## 1. Context & Root Problem

During the previous automated seeding attempt, the live discovery feed suffered from two critical curation breakdowns:
1. **Storefront Pollution in Food Feed**: Google Places photo indices (`places.photos[0]`) defaulted to building facades, parking lots, and dining room chairs, which were mistakenly assigned as dish thumbnails in `food_posts`.
2. **Placeholder Blowup**: Dishes lacking a photo fell back to 32px map icons (`/icons/food/*.webp`), which appeared blurry and broken when rendered full-bleed.

### The Invariant
* **`venues.cover_image_url`**: Street facade, counter, or indoor ambiance.
* **`food_posts.dish_image`**: Strictly plated, appetizing, macro food photography.
* **Zero Seeding Without Visual Approval**: No spot or dish enters the production Supabase database until a curator visually confirms it in the Seeding Verification Lab.

---

## 2. File Manifest & References

### Files to Inspect & Reuse
| File Path | Role / Reusable Assets |
|---|---|
| `frontend/src/components/food/FoodPostCard.tsx` | The production feed hero card (lines 433–600). The lab's cards must mirror this layout, aspect ratio, gradient overlays, and typography. |
| `frontend/src/components/admin/IconPickerModal.tsx` | Modal for picking custom food pin icons (`croissant`, `ramen`, `cheesesteak`, etc.). |
| `frontend/src/components/food/FoodIcons.tsx` | Vector food icons and WebP catalog mappings (`DISH_ICON_WEBP`). |
| `frontend/src/lib/taxonomy.ts` | Food group definitions, cuisine matching, and badge logic. |
| `frontend/src/app/food-icon-studio/page.tsx` | Reference for clean, non-bloated, focused UI style (dark canvas `#181615` / warm oat `#FAF7F2`, zero cluttered sidebars). |
| `frontend/curation/CANDIDATE_DISH_IMAGE_AUDIT.md` | The verified candidate dataset (20 spots, verified dishes, NOK prices, and public photo receipts). |

### Files to Create
| File Path | Purpose |
|---|---|
| `frontend/src/app/admin/seeding-lab/page.tsx` | Main studio route for manual seeding verification. |
| `frontend/src/app/api/admin/seeding-lab/route.ts` | API route to load staged candidate seeds (`GET`), save modifications (`PATCH`), and commit approved spots to Supabase (`POST`). |
| `frontend/src/components/admin/SeedingCandidateCard.tsx` | Clean visual card combining venue metadata, map pin selector, and interactive dish feed preview. |
| `frontend/src/components/admin/QuickDishEditModal.tsx` | Lightweight popover/modal to swap photo URL, tweak dish title, price, and tags. |
| `frontend/curation/staged_candidates.json` | Persistent staging JSON containing candidate spots awaiting curator verification. |

---

## 3. Data Schema & Staging Contract

Candidates are stored in `frontend/curation/staged_candidates.json` using the following TypeScript interfaces:

```typescript
export type VerificationStatus = "pending" | "approved" | "needs_photo" | "rejected";

export interface StagedDishHighlight {
  id: string; // unique candidate dish id
  dish_name: string;
  category: string; // e.g. "bakery", "ramen", "tacos"
  price_nok: number | null;
  dish_image: string; // direct photo URL (Wolt, Foodora, CDN, or uploaded WebP)
  is_verified_food_photo: boolean; // MUST be true to approve
  review_text: string;
  taste_tags: string[];
}

export interface StagedCandidateSpot {
  id: string; // unique slug e.g. "pele-pele-gronland"
  name: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  food_category: string;
  icon: string; // key matching FoodIcons (e.g. "k_chicken", "ramen")
  spot_type: "restaurant" | "cafe" | "food_truck" | "popup";
  cover_image_url: string; // facade / interior photo
  why_curated: string;
  verification_status: VerificationStatus;
  notes?: string;
  dish_highlights: StagedDishHighlight[];
}
```

---

## 4. UI/UX Architecture (`/admin/seeding-lab`)

### Core Philosophy: "No Clutter, Just Cards"
Instead of a giant table with dozens of form inputs, the lab presents a **visual inspection gallery**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  SMAKR SEEDING LAB                              [ 14 Approved / 20 ]   │
│  Vetting candidate spots before database seed   [ Commit Approved 🚀 ]  │
├────────────────────────────────────────────────────────────────────────┤
│  Filter: [ All (20) ]  [ 🟢 Approved (14) ]  [ 🟡 Needs Photo (5) ]     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  Candidate 1: PELE PELE (Grønland · Smalgangen 31)   [ Status: 🟢 ]    │
│  Pin Icon: [ 🍗 k_chicken (Change) ]  Cover: [ View Facade (Change) ]   │
├────────────────────────────────────────────────────────────────────────┤
│  DISH FEED PREVIEW (Exact FoodPostCard Layout):                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [ PHOTO HERO ] Flame-charred peri-peri chicken close-up          │  │
│  │                                                                  │  │
│  │ 🏷️ 189 NOK · Peri-Peri Chicken                                  │  │
│  │ "Charred over open coals with spicy bird's eye chili marinade"   │  │
│  │ [✏️ Edit Dish]  [🖼️ Swap Image URL]  [👁️ Full Feed Preview]        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Card Feature Checklist
1. **Venue Header**:
   - Spot name, address, neighborhood, and food category badge.
   - **Active Pin Icon Preview**: Shows the actual map pin icon. Clicking opens `IconPickerModal` to swap the pin icon instantly.
   - **Cover Photo Preview**: Small 60x60 thumbnail of the venue exterior/interior. Clicking lets the user paste a new storefront photo URL.
2. **Dish Hero Preview**:
   - Renders a live `FoodPostCard` clone with full-bleed aspect ratio (`aspect-[4/3]`).
   - Warning overlay if `dish_image` contains keywords like `streetview`, `facade`, `building`, or `/icons/food/`.
   - **"Swap Photo" button**: Instant modal allowing direct URL paste (Wolt, Foodora, Instagram) with live preview.
   - **"Edit Details" button**: Inline editing for Dish Name, Price (NOK), Taste Tags, and Review Text.
3. **Curator Action Bar**:
   - **🟢 Approve**: Ready for production database seed.
   - **🟡 Needs Dish Photo**: Stays in staging; alerts that only facade is available.
   - **🔴 Reject**: Spot removed from candidate queue.

---

## 5. Safe Seeding Pipeline (`POST /api/admin/seeding-lab`)

When the curator clicks **"Commit Approved to Database"**:
1. Filter only candidates where `verification_status === "approved"`.
2. **Pre-flight Validation**: Ensure every approved dish has a valid HTTP image URL (no icon fallbacks).
3. **Sharp Ingest Pipeline**:
   - Fetch remote photo buffer (Wolt, Foodora, etc.).
   - Process with `sharp(buffer).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 })`.
   - Upload to Supabase Storage bucket `dish-photos/` with deterministic hash key (`sha256(url).slice(0, 24).webp`).
   - Store public CDN URL in database row.
4. **Database Transaction**:
   - Insert venue into `venues` table.
   - Insert dishes into `food_posts` table with `author_id = OFFICIAL_AUTHOR_ID` and `is_published = true`.
5. Update `curation/staged_candidates.json` to mark items as `"seeded"`.

---

## 6. Implementation Steps for Gemini Argon

1. **Step 1: Create Staging Store**
   - Populate `frontend/curation/staged_candidates.json` with the 20 audited spots from `frontend/curation/CANDIDATE_DISH_IMAGE_AUDIT.md`.
2. **Step 2: Build API Route (`/api/admin/seeding-lab`)**
   - `GET`: Returns JSON of staged spots.
   - `PATCH`: Updates a candidate spot or dish (photo swap, price update, status change).
   - `POST`: Triggers the Sharp WebP ingest pipeline and Supabase insertion for approved spots.
3. **Step 3: Build `SeedingCandidateCard.tsx`**
   - Integrate `FoodIcons` for map pin preview.
   - Embed `FoodPostCard` layout for realistic feed verification.
4. **Step 4: Build `QuickDishEditModal.tsx`**
   - Support image URL paste with instant visual thumbnail verification.
   - Simple inputs for price NOK and dish title.
5. **Step 5: Assemble `/admin/seeding-lab/page.tsx`**
   - Use clean, dark background (`#181615` canvas with `#FAF7F2` cards), identical to the aesthetic of `food-icon-studio`.
   - Add status filter pills: "All", "Approved", "Needs Photo", "Seeded".
   - Add "Commit Approved" header action button with loading spinner and success banner.
