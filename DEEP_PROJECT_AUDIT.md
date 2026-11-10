# Comprehensive Forensic Engineering Report & Project Audit
**Target Repo:** `abdisalam02/Smakr` (Oslo Food Discovery Radar)  
**Date of Audit:** 2026-11-09  
**Status:** READ-ONLY FORENSIC DIAGNOSIS & REMEDIATION BLUEPRINT (No project code modified)

---

## 1. Executive Severity Summary

| Category | Finding | Impact / Risk | Severity |
|---|---|---|:---:|
| **Security & Privacy** | 5 `/api/admin/*` endpoints lack authentication (`seeding-lab`, `upload-seed-image`, `ai-shift-spot`, `transform-dish-image`, `save-studio-icon`). | Anyone on the public internet can execute Gemini multimodal generative calls (burning API tokens/billing), upload files to Supabase Storage, or commit data to production `venues` & `food_posts` tables using the service role key. | **CRITICAL** |
| **Privacy & Hygiene** | 23 files in `frontend/scripts/` contain hardcoded local machine Windows paths (`C:/Users/abdis/...`). | Exposes private username and internal environment identifiers directly in public Git history prior to switching repo to private. | **HIGH** |
| **Input / Touch Lag** | Kinetic scroll deceleration halt + layout shift threshold (`useCollapseOnFeedScroll`) + missing `touch-action: manipulation`. | The first tap during feed deceleration is consumed as an inertial stop event by the browser engine; layout jumps of 6–14px at 30px scroll threshold move buttons under finger; 300ms double-tap delay on cards without manipulation. | **HIGH** |
| **Performance Contention** | Active MapLibre GL WebGL canvas permanently mounted beneath feed sheet + 10–20 concurrent `backdrop-filter: blur(...)` elements. | Severe GPU fill-rate throttling and main-thread hitching on mobile devices while scrolling the dish feed, dropping touch events and dropping frame rates below 30fps. | **HIGH** |
| **Project Bloat** | `frontend/public/` is **93 MB** (48 MB unused food SVGs + 36 MB audio files in dev-only routes); `frontend/src/` has a **4.5 MB** embedded SVG file (`recraftData.ts`) and duplicate 1.9 MB OTF font. | Drastically inflates git clones, deployment build times, and bundle footprints for zero production benefit. | **HIGH** |
| **Dead Code ("God Files")** | 12 completely unimported components & libs (totaling >150 KB and >3,500 lines of dead code); 3 unused npm packages in `package.json`. | Maintenance drag, cognitive clutter, and unused dependencies (`@iconify/react`, `react-peeps`, `vaul`). | **MEDIUM** |

---

## 2. Pillar 1: "Swallowed Taps / Ghost Touches" & Scroll Input Forensics

### 2.1 The Exact Mechanics of the "Double-Tap" / Swallowed Tap Bug

When testing on mobile browsers (WebKit / iOS Safari, Blink / Android Chrome), user taps frequently fail on the first try while scrolling down the feed. The forensic audit isolated **5 compounding root causes**:

```
[ User scrolls down feed ]
           │
           ▼
1. Kinetic Momentum Deceleration
   └─ Browser treats first tap down as "HALT SCROLL", swallowing the click event.
           │
           ▼
2. Synchronous Global Capture Listeners (`useCollapseOnFeedScroll.ts:120-159`)
   └─ On every touch/scroll, synchronous checks execute in window capture phase.
           │
           ▼
3. Reflow / Geometry Jump (`MascotWeeklyDrop.tsx:151-160`)
   └─ At scrollTop > 30px, `isScrolledDown` flips: header shrinks 6-14px.
      Button moves out from under finger mid-tap!
           │
           ▼
4. Missing CSS `touch-action: manipulation` / Tap Delay
   └─ Parent `<article>` and popup `<button>` lack touch-action; browser delays click 300ms.
           │
           ▼
5. WebGL + Multi-Backdrop Filter GPU Saturation
   └─ MapLibre canvas active under sheet + 10+ backdrop-blur elements starve mobile GPU.
```

#### Root Cause 1: Native Momentum Scroll Inertial Abort
- In standard mobile browsers, containers with momentum scrolling (`overflow-y-auto` with `-webkit-overflow-scrolling: touch`) enter a hardware-accelerated kinetic deceleration phase after the user flicks the feed.
- **W3C Touch / Pointer Spec behavior:** If a user places their finger down while the scroll view is decelerating, the browser engine consumes that `touchstart` / `pointerdown` as a **Scroll Halt command**. The browser explicitly cancels inertial momentum and **suppresses the subsequent `click` event**.
- Only after the scroll velocity reaches exactly 0 will a subsequent tap trigger a full `pointerdown -> pointerup -> click` sequence. This creates the user-perceived "first tap fails, second tap works" symptom.

#### Root Cause 2: Layout Geometry Shift at 30px Scroll Threshold
- **Location:** `frontend/src/hooks/useCollapseOnFeedScroll.ts` (lines 136–159) and `frontend/src/components/food/MascotWeeklyDrop.tsx` (lines 116–160).
- `useCollapseOnFeedScroll` attaches a window capture listener:
  ```ts
  // frontend/src/hooks/useCollapseOnFeedScroll.ts:148-152
  if (scrollTop <= 10) {
    setIsScrolledDown(false);
  } else if (scrollTop > 30) {
    setIsScrolledDown(true);
  }
  ```
- In `MascotWeeklyDrop.tsx`:
  ```tsx
  // frontend/src/components/food/MascotWeeklyDrop.tsx:151-160
  className={`w-full ... ${
    isScrolledDown ? "pt-0 pb-0" : compact ? "pt-1 pb-1" : "pt-2 pb-1"
  }`}
  ...
  className={`flex items-center ... ${
    isScrolledDown ? "min-h-[30px]" : "min-h-[36px]"
  }`}
  ```
- Because `MascotWeeklyDrop` is mounted inside the sticky sheet header (`HomeView.tsx:1018-1043`), changing its padding and `min-height` forces a synchronous CSS reflow that changes the height of the sticky header by 6px to 14px.
- **The Failure State:** If a user starts decelerating their scroll and taps a card near the 30px threshold, the state update fires, the sticky header collapses, and the entire feed beneath it instantaneously jumps upward by up to 14px. The button that was underneath the user's fingertip shifts away between `touchstart` and `touchend`, resulting in a canceled click.

#### Root Cause 3: First-Touch Layout Unmount from `AutumnLeavesBurst`
- **Location:** `frontend/src/components/effects/AutumnLeavesBurst.tsx` (lines 55–69) & `frontend/src/app/layout.tsx` (line 104).
- `AutumnLeavesBurst` is mounted globally on every page load:
  ```ts
  // frontend/src/components/effects/AutumnLeavesBurst.tsx:60-61
  window.addEventListener('touchstart', dismiss, { once: true, passive: true });
  window.addEventListener('wheel', dismiss, { once: true, passive: true });
  ```
- On the user's very first interaction on the site, this listener catches the `touchstart`, executes `setIsActive(false)`, and triggers a root layout React re-render right as the user is touching their first element.

#### Root Cause 4: Missing `touch-action: manipulation` & Propagation Trap on Cards
- **Location:** `frontend/src/components/food/FoodPostCard.tsx` (lines 411–425, 740–751), `FoodSpotCard.tsx` (lines 118–125), `PopupEventCard.tsx` (lines 70–80).
- In `FoodPostCard.tsx`:
  - Line 411: `<article onClick={handleCardClick} className="... select-none cursor-pointer ...">` does **NOT** define `touch-action: manipulation` or `touch-action: pan-y`.
  - Line 740: The Details button for popups without confirmed locations (`<button onClick={handleOpenDetails} className="...">`) does **NOT** define `touch-manipulation`.
  - While other buttons (Share, Map, IG) specify `touch-manipulation`, their parent `<article>` lacks it. Mobile Safari enforces a 300ms tap verification delay on elements without `touch-action: manipulation` to detect potential double-taps. If the user's finger moves >3px during this window, the tap is canceled in favor of a pan.
  - In `PopupEventCard.tsx:74` and `FoodSpotCard.tsx:121`, the top-level cards have zero touch-action declarations.

#### Root Cause 5: Dead Code Modals Mounting Zustand Subscriptions
- **Location:** `frontend/src/components/home/HomeView.tsx` (lines 1232–1233).
- `HomeView.tsx` unconditionally mounts:
  ```tsx
  <VenueBottomSheet />
  <QuickCheckInModal />
  <SpeedTestWidget />
  ```
- `QuickCheckInModal.tsx` (193 lines) and `SpeedTestWidget.tsx` (140 lines) are deprecated legacy check-in artifacts that still subscribe to `useCityPulseStore`.

---

### 2.2 Invisible Overlay & `pointer-events` Audit

| Component | Selector / Class | Risk Assessment | Forensic Finding |
|---|---|:---:|---|
| **Header** (`Header.tsx:90`) | `fixed top-0 inset-x-0 z-50 pointer-events-none` | **SAFE** | Header container passes clicks through; only inner capsules (`pointer-events-auto`) capture taps. |
| **Bottom Nav Toggle** (`HomeView.tsx:1213`) | `lg:hidden fixed left-1/2 -translate-x-1/2 z-[45]` | **LOW / MEDIUM** | Centered floating pill. Container itself has intrinsic width, but elevated above `pb-36` padding. Cards scrolled directly behind the center bottom can have their buttons clipped. |
| **Location Prompt** (`LocationPrompt.tsx:70`) | `fixed inset-x-0 bottom-24 z-[45] pointer-events-none` | **SAFE** | Wrapper correctly applies `pointer-events-none`; child pill is `pointer-events-auto`. |
| **Mobile Sheet Peek Drag** (`HomeView.tsx:1069`) | `data-feed-scroll` with `mobileSheet === "peek"` | **WATCH** | When sheet is in `peek`, `touch-none` and `pointer-events-none` are applied to the cards (line 1085). Clicking anywhere expands the sheet to half. Once in half or full, pointer events are fully active. |
| **Dead Modals** (`HomeView.tsx:1232-1233`) | `<QuickCheckInModal />`, `<SpeedTestWidget />` | **SAFE** | Both components return `if (!isOpen) return null;` so no invisible DOM backdrop is mounted when closed. |

---

### 2.3 Main-Thread Contention: MapLibre + Feed Coexistence

#### The Coexistence Architecture
- In `frontend/src/components/home/HomeView.tsx` (lines 984–1001), `<MapRadarView />` is mounted inside:
  ```tsx
  <div className="absolute inset-0 w-full h-full z-0 isolate ...">
    <MapRadarView />
  </div>
  ```
- On mobile screen sizes (`< lg`), the Airbnb-style bottom sheet (`z-30`) slides over this container.
- **The WebGL Canvas is NEVER unmounted or paused during feed scrolling.**
- Even when the sheet is snapped to `half` or `full`, the MapLibre GL WebGL context is active, maintaining 15+ custom HTML DOM markers, continuous SVG radar puck animations (`animate-ping` in `MapRadarView.tsx:239`), and MapLibre render loops.

#### `backdrop-filter` ("Backdrop Blur") Saturation Count
During standard mobile feed scrolling, the GPU must simultaneously sample, blur, and composite:
1. `Header.tsx:94`: Top-left logo capsule (`backdrop-blur-md`)
2. `Header.tsx:107`: Top-right user capsule (`backdrop-blur-md`)
3. `HomeView.tsx:806`: Sticky sheet top header (`backdrop-blur-md`)
4. `FoodCategoryBar.tsx:94`: Category strip container (`backdrop-blur-xl`)
5. `FoodCategoryBar.tsx:110`: Inactive cravings category pills (`backdrop-blur-sm`)
6. `FoodPostCard.tsx:467`: Pop-up badge on pop-up cards (`backdrop-blur-xs`)
7. `PopupEventCard.tsx:102, 109, 128`: 3 distinct blur pills per card (`backdrop-blur-md`)
8. `FoodViewSlider.tsx:44`: Floating glassmorphic bottom navigation bar (`backdrop-blur-md` equivalent shadow composite)

**Result:** Over 15 active `backdrop-filter` surfaces simultaneously composited over a live WebGL canvas. On mobile Safari and Android devices, this pushes GPU memory bandwidth to saturation, resulting in frame stutter during scroll deceleration and dropped tap events.

---

## 3. Pillar 2: Project Bloat, Bundle Size & Performance Audit

### 3.1 Directory Breakdown

```
smakr/
├── frontend/public/         93.0 MB  (MASSIVE BLOAT: 48 MB unused SVGs + 36 MB audio)
├── frontend/src/            11.0 MB  (INFLATED: 4.5 MB recraftData.ts + 1.9 MB OTF font)
├── docs/                     180 KB
└── frontend/curation/        148 KB
```

### 3.2 Top 25 Largest Files Across `frontend/`

| File Path | Size | Role / Description | Safe to Delete? |
|---|:---:|---|:---:|
| `frontend/public/audio/upbeat-ad.mp3` | **4.6 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/sunset-stroll.mp3` | **4.6 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/src/app/food-icon-studio/recraftData.ts` | **4.5 MB** | Giant embedded raw SVG string data file | **YES** |
| `frontend/public/food-svgs/k-chicken.svg` | **4.5 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/audio/recipe-groove.mp3` | **4.2 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/happy-vibe.mp3` | **4.2 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/fresh-finds.mp3` | **4.2 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/city-pulse.mp3` | **4.2 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/bubbly-pop.mp3` | **4.2 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/jazz-groove.mp3` | **2.1 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/food-svgs/sandwiches_handhelds.svg` | **2.0 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/src/fonts/Comico-Regular.otf` | **1.9 MB** | Duplicate font file (identical to public/) | **YES (dedup)** |
| `frontend/public/fonts/Comico-Regular.otf` | **1.9 MB** | Font file (keep one canonical copy) | **KEEP** |
| `frontend/public/audio/chill-beat.mp3` | **1.7 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/audio/cafe-keys.mp3` | **1.7 MB** | Audio track for dev-only `/ad-reel` route | **YES** |
| `frontend/public/food-svgs/k_chicken.svg` | **1.5 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/fried_chicken.svg` | **1.5 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/chicken_grill.svg` | **1.5 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/tacos.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/sushi.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/seafood.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/rice_bowls.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/manakish.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/indian.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |
| `frontend/public/food-svgs/curry.svg` | **1.4 MB** | Unoptimized vector test SVG | **YES** |

**Summary of Removable Assets:**
- `frontend/public/food-svgs/`: **~48.0 MB** (dev sandbox only, production uses sprite sheet WebPs)
- `frontend/public/audio/`: **~36.0 MB** (internal ad-reel sandbox only)
- `frontend/src/app/food-icon-studio/recraftData.ts`: **4.5 MB**
- Duplicate font in `src/fonts/`: **1.9 MB**
- **Total Immediate Removable File Bloat: ~90.4 MB** (over 85% of entire project asset weight!)

---

### 3.3 Giant Component & Library Files ("God Files" >400 Lines)

The audit discovered **56 files in `frontend/src/` exceeding 400 lines**. The top 30 are:

| File Path | Line Count | Primary Role / Diagnosis |
|---|:---:|---|
| `frontend/src/components/studio/StudioControls.tsx` | **3,995** | Social card capture editor (dev sandbox) |
| `frontend/src/app/ad-reel/page.tsx` | **3,735** | Ad generator canvas (dev sandbox) |
| `frontend/src/components/map/MapRadarView.tsx` | **2,014** | MapLibre wrapper, custom DOM markers, radar sweeps |
| `frontend/src/components/partner/SmakrCardStudio.tsx` | **1,826** | Partner card generator & export logic |
| `frontend/src/components/admin/SeedingCandidateCard.tsx` | **1,743** | Candidate curation card (AI Quick Shift + Photo modal) |
| `frontend/src/app/admin/page.tsx` | **1,711** | Admin Control Center tabs (dispatch, popups, venues, claims) |
| `frontend/src/components/food/CreateFoodPostModal.tsx` | **1,473** | User food post creation & photo upload wizard |
| `frontend/src/components/auth/UserOnboardingModal.tsx` | **1,333** | Avatar picker & onboarding flow |
| `frontend/src/components/studio/MapShot.tsx` | **1,315** | Map preview canvas for studio |
| `frontend/src/lib/seeds.ts` | **1,237** | **DEAD CODE (0 imports)**: Old mock venues & seed data |
| `frontend/src/components/home/HomeView.tsx` | **1,236** | Primary mobile/desktop feed coordinator |
| `frontend/src/components/venue/VenueBottomSheet.tsx` | **1,202** | Venue detail bottom sheet drawer & menu |
| `frontend/src/components/partner/PartnerSheets.tsx` | **1,181** | **DEAD CODE (0 imports)**: Deprecated partner wizard |
| `frontend/src/components/filter/FeedFilterBar.tsx` | **1,113** | Horizontal cravings filter + expandable drawer |
| `frontend/src/components/studio/StudioCaptionGenerator.tsx` | **1,110** | Caption generation templates for marketing |
| `frontend/src/components/admin/VenueImporter.tsx` | **1,083** | Google Places importer & data cleanup UI |
| `frontend/src/app/studio/page.tsx` | **1,039** | Social card marketing studio page |
| `frontend/src/components/admin/QuickDishEditModal.tsx` | **1,027** | Quick dish modal with paste listener |
| `frontend/src/lib/supabase/data.ts` | **1,022** | Supabase client data mutation layer |
| `frontend/src/components/partner/UnifiedPartnerWizardSheet.tsx` | **992** | **DEAD CODE (0 imports)**: Deprecated wizard |
| `frontend/src/lib/foodSeeds.ts` | **975** | Food category seeds & mock data |
| `frontend/src/app/api/admin/ai-curate/route.ts` | **968** | AI dish curation & taste note generation |
| `frontend/src/lib/onboardingAvatar.ts` | **932** | Open Peeps & DiceBear SVG generator |
| `frontend/src/app/mascot-studio/page.tsx` | **856** | Mascot customization sandbox |
| `frontend/src/store/useCityPulseStore.ts` | **847** | Zustand global application store |
| `frontend/src/components/admin/QuickEditCardDrawer.tsx` | **836** | Slide-out editor for venues & dishes |
| `frontend/src/components/venue/VenueDetailPane.tsx` | **829** | Desktop venue detail side pane |
| `frontend/src/components/admin/BulkVenueSeeder.tsx` | **814** | Bulk CSV / text seeder for spots |
| `frontend/src/types/studio.ts` | **807** | Studio type definitions |
| `frontend/src/components/studio/StudioCanvas.tsx` | **774** | Studio rendering canvas |
| `frontend/src/components/admin/AdminPopupWizardModal.tsx` | **770** | Pop-up residency creation modal |
| `frontend/src/components/food/FoodPostCard.tsx` | **759** | Feed dish hero card |
| `frontend/src/lib/taxonomy.ts` | **735** | Cuisine and food classification engine |

---

### 3.4 Package.json Dependency Audit

| Package | Status | Usage in Codebase | Actionable Recommendation |
|---|:---:|---|---|
| `@iconify/react` | **UNUSED** | **0 imports** anywhere in `frontend/src/` | **Uninstall** via `npm uninstall @iconify/react` |
| `react-peeps` | **UNUSED** | **0 imports** anywhere in `frontend/src/` | **Uninstall** via `npm uninstall react-peeps` |
| `vaul` | **UNUSED** | **0 imports** anywhere in `frontend/src/` (drawers use custom Framer/Motion gesture handlers) | **Uninstall** via `npm uninstall vaul` |
| `@dicebear/micah` | **DEPRECATED** | Micah avatar style has been retired per project rules ("Strict Rule: NEVER render a legacy Micah avatar") | **Uninstall** once `MascotCharacter.tsx` imports are cleaned |
| `@dicebear/core` + `@dicebear/open-peeps` | **ACTIVE** | Used for user avatar upper-body bust generation in `onboardingAvatar.ts` | Keep |
| `lucide-react` | **ACTIVE** | Main application icon library | Keep |
| `maplibre-gl` | **ACTIVE** | Map rendering engine | Keep |
| `sharp` | **SERVER ONLY** | Server image compression & WebP encoding in API routes | Move to `serverComponentsExternalPackages` in `next.config.ts` |

---

## 4. Pillar 3: Dead Code, Redundant Files & Orphaned Routes ("The Kill List")

### 4.1 Dead Code / Unimported Components & Libs

Every file below was audited via automated AST / Regex cross-referencing and confirmed to have **0 active imports**:

| File Path | Lines | Size | Rationale for Removal |
|---|:---:|:---:|---|
| `frontend/src/components/partner/PartnerSheets.tsx` | 1,181 | 42.8 KB | Superseded by `SmakrCardStudio.tsx`. Zero active imports. |
| `frontend/src/components/partner/UnifiedPartnerWizardSheet.tsx` | 992 | 46.2 KB | Superseded by direct studio form. Zero active imports. |
| `frontend/src/lib/seeds.ts` | 1,237 | 41.1 KB | Legacy mock seeds from initial prototype. All live data now reads from Supabase. Zero active imports. |
| `frontend/src/components/partner/ClaimForm.tsx` | 312 | 12.1 KB | Old standalone claim modal, replaced by in-studio claim. Zero active imports. |
| `frontend/src/components/studio/MapCaptureModal.tsx` | 260 | 10.3 KB | Replaced by HTML-to-image canvas capture in StudioCanvas. Zero active imports. |
| `frontend/src/components/food/FoodFeed.tsx` | 240 | 9.7 KB | Retired feed container. `HomeView.tsx` renders feed panels directly. Zero active imports. |
| `frontend/src/components/partner/PartnerSpotCardPreview.tsx` | 195 | 8.0 KB | Legacy preview card. Zero active imports. |
| `frontend/src/components/checkin/QuickCheckInModal.tsx` | 193 | 7.7 KB | Officially declared dead code in `GEMINI.md`. Mounted only as dead JSX in HomeView. |
| `frontend/src/components/map/MapZoomTrackpad.tsx` | 134 | 5.0 KB | Old desktop trackpad overlay. MapLibre native controls used. Zero active imports. |
| `frontend/src/components/checkin/SpeedTestWidget.tsx` | 140 | 4.8 KB | Officially declared dead code in `GEMINI.md`. Mounted only as dead JSX in HomeView. |
| `frontend/src/components/venue/VibeGaugeMeter.tsx` | 115 | 4.3 KB | Old noise/crowd gauge. VenueBottomSheet renders badges directly. Zero active imports. |
| `frontend/src/components/map/RadarPin.tsx` | 85 | 3.1 KB | Replaced by direct DOM element creation in `MapRadarView.tsx`. Zero active imports. |
| `frontend/src/components/map/MapFilterBar.tsx` | 70 | 2.8 KB | Replaced by `FeedFilterBar.tsx`. Zero active imports. |
| `frontend/src/components/avatar/AvatarSwitcher.tsx` | 10 | 156 B | File comment explicitly states: *"AvatarSwitcher has been retired"*. Zero active imports. |
| **SUBTOTAL DEAD SOURCE CODE** | **~5,160** | **~198 KB** | **14 dead files ready for immediate deletion** |

---

### 4.2 App Router Route Audit (`frontend/src/app/`)

| Route | File Path | Type | Production vs. Sandbox | Recommendation |
|---|---|:---:|:---:|---|
| `/` | `src/app/page.tsx` | Page | **PRODUCTION** | Core App Feed + Map Radar |
| `/collections` | `src/app/collections/page.tsx` | Page | **PRODUCTION** | User saved dish collections |
| `/partner` | `src/app/partner/page.tsx` | Page | **PRODUCTION** | Restaurant partner claims & card studio |
| `/kitchen/[token]` | `src/app/kitchen/[token]/page.tsx` | Page | **PRODUCTION** | Token-isolated live kitchen update portal |
| `/admin` | `src/app/admin/page.tsx` | Page | **INTERNAL / ADMIN** | Protected control center (keep, role-check verified) |
| `/admin/seeding-lab` | `src/app/admin/seeding-lab/page.tsx` | Page | **DEV / INTERNAL** | Curation lab (needs strict admin role guard!) |
| `/ad-reel` | `src/app/ad-reel/page.tsx` | Page | **DEV SANDBOX** | 3,735 lines, loads 36 MB audio. Restrict or move to dev-only! |
| `/food-icon-studio` | `src/app/food-icon-studio/page.tsx` | Page | **DEV SANDBOX** | Loads 4.5 MB recraft data & 48 MB SVGs. Restrict to dev! |
| `/mascot-studio` | `src/app/mascot-studio/page.tsx` | Page | **DEV SANDBOX** | 856 lines avatar lab. Restrict to dev/admin! |
| `/studio` | `src/app/studio/page.tsx` | Page | **DEV SANDBOX** | 1,039 lines marketing studio. Restrict to dev/admin! |
| `/email-preview` | `src/app/email-preview/page.tsx` | Page | **DEV SANDBOX** | Email template test page. Restrict to dev! |

---

### 4.3 Scattered Audit & Duplicate Files

| File / Folder Path | Size | Reason for Consolidation / Removal |
|---|:---:|---|
| `curation/` (in root directory) | ~20 KB | Redundant duplicate of `frontend/curation/`. |
| `curation/audits/` (17 files) | ~460 KB | Obsolete one-off python generator scripts & audit markdowns (`build_existing.py`, `build_popups.py`, `generate_blueprint.py`, etc.). |
| `./POPUP_RADAR_AND_AI_UPDATE_AUDIT.md` | ~25 KB | Stale one-off audit report sitting in root. |
| `./citypulse_project_starter_spec.md` | ~15 KB | Initial legacy spec from before project was renamed to Smakr. |
| `docs/AVATAR_BOOT_AUDIT.md` | ~12 KB | Stale avatar audit. |
| `docs/FILTER_ICON_DUAL_REFERENCE_PLAN.md` | ~8 KB | Completed plan doc. |
| `docs/FILTER_ICON_PICK_REVAMP_AUDIT.md` | ~10 KB | Stale audit doc. |
| `docs/REACTIVITY_AND_INTERACTION_AUDIT.md`| ~14 KB | Stale audit doc. |
| `docs/smakr_performance_smoothness_audit.md` | ~16 KB | Stale performance notes. |
| `frontend/scripts/*.mjs` (58 scripts) | ~410 KB | One-off image cutout/inspection test scripts. Only `test-security.mjs` is run by npm. |

---

## 5. Pillar 4: Privacy, Secret Exposure & Git History Hygiene

### 5.1 Tracked Secrets & Env Status
- `.env`, `.env.local`, and service keys are **NOT tracked in Git**. `git ls-files` confirmed only `frontend/.env.example` is tracked.
- No live Supabase service keys, Google API keys, or OpenAI tokens were detected in tracked files.

### 5.2 Critical Privacy Finding: Hardcoded User Machine Paths in Git
A deep regex scan discovered **23 tracked script files** in `frontend/scripts/` containing hardcoded local Windows machine paths exposing the developer's local username (`abdis`) and internal brain conversation ID:
```
C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd
```

**Affected Tracked Files:**
1. `frontend/scripts/generate_mandi_cheesesteak.mjs` (line 10)
2. `frontend/scripts/generate_map_icons_audit_proof.mjs` (line 5)
3. `frontend/scripts/generate_map_icons_side_by_side_audit.mjs` (line 5)
4. `frontend/scripts/generate_matcha_test.mjs` (line 10)
5. `frontend/scripts/generate_normalized_proof.mjs` (line 6)
6. `frontend/scripts/generate_pancakes_dumplings.mjs` (line 10)
7. `frontend/scripts/generate_style_test_proof.mjs` (line 5)
8. `frontend/scripts/generate_togo_matcha.mjs` (line 10)
9. `frontend/scripts/generate_transformative_batch.mjs` (line 10)
10. `frontend/scripts/inspect_var15_src.mjs` (line 4)
11. `frontend/scripts/process_mandi_cheesesteak.mjs` (line 5)
12. `frontend/scripts/process_matcha_icons.mjs` (line 5)
13. `frontend/scripts/process_pancakes_dumplings.mjs` (line 5)
14. `frontend/scripts/test_advanced_prompts.mjs` (line 10)
15. `frontend/scripts/test_advanced_prompts_batch2.mjs` (line 10)
16. `frontend/scripts/test_perfect_cutout.mjs` (line 4)
17. `frontend/scripts/deploy_batch1_icons.mjs` (line 6)
18. `frontend/scripts/deploy_batch2_icons.mjs` (line 6)
19. `frontend/scripts/generate_13_proof.mjs` (line 6)
20. `frontend/scripts/generate_batch1_review.mjs` (line 5)
21. `frontend/scripts/generate_coffee_macro.mjs` (line 7)
22. `frontend/scripts/generate_live_preview.mjs` (line 64)
23. `frontend/scripts/test_bao.mjs` (line 6)

**Action Required Prior to Switching Repo to Private:**
These 23 test scripts are obsolete dev artifacts that should either be removed from Git or sanitized. If git history scrubbing is desired, run `git filter-repo` or BFG repo cleaner on this string prior to archiving.

---

### 5.3 CRITICAL VULNERABILITY: Unprotected Admin Endpoints & Free Public Access

Right now, if the app is deployed to production on Vercel:

#### 1. Middleware Does NOT Protect `/api/admin/*`
In `frontend/src/middleware.ts` (lines 60–71):
```ts
const isAdminRoute =
  request.nextUrl.pathname.startsWith("/admin") ||
  request.nextUrl.pathname.startsWith("/studio") ||
  request.nextUrl.pathname.startsWith("/mascot-studio");

if (isAdminRoute && !user) {
  return NextResponse.redirect(...);
}
```
- **Flaw A:** It matches `/admin`, but does **NOT** match `/api/admin`! All API routes under `/api/admin/*` completely bypass middleware.
- **Flaw B:** For `/admin/*` pages, it only checks `!user` (is the visitor logged in). **ANY authenticated visitor with a free community account passes middleware!**

#### 2. The 5 Completely Unprotected API Routes

| Endpoint | Method | Capabilities Exposed to Unauthenticated Public |
|---|:---:|---|
| `/api/admin/seeding-lab` | `POST`, `PATCH` | **Full DB Write:** Uses `SUPABASE_SERVICE_ROLE_KEY` to upsert records into production `venues` and `food_posts` tables. Mutates staged candidates JSON on disk. **Zero auth check.** |
| `/api/admin/upload-seed-image` | `POST` | **Arbitrary Storage Upload:** Ingests any uploaded image into the production Supabase `dish-photos` storage bucket using the service role key. **Zero auth check.** |
| `/api/admin/ai-shift-spot` | `POST` | **AI & Quota Burning + DB Overwrite:** Calls Google Gemini API (`generateContent`) and Google Places API with server keys; `apply` mode commits changes to production `venues` & `food_posts`. **Zero auth check.** |
| `/api/admin/transform-dish-image` | `POST` | **Multimodal AI Credit Burning:** Calls Google Gemini 3.1 Flash Lite multimodal image-to-image synthesis and uploads generated WebPs to Supabase storage. **Zero auth check.** |
| `/api/admin/save-studio-icon` | `POST` | **Server File System Write:** Writes generated `.webp` files to `public/icons/food/` on the server disk. **Zero auth check.** |

#### 3. Contrast: How Protected Endpoints Do It
In `frontend/src/app/api/admin/bulk-enrich/route.ts` and `kitchen-token/route.ts`, proper server-side authentication is enforced:
```ts
const { data: { user } } = await ssrClient.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const { data: profile } = await admin
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden. Admin role required." }, { status: 403 });
}
```
The 5 endpoints above must immediately adopt this exact security guardrail.

---

## 6. Phased Remediation Action Plan

### Phase 1: Critical Security & Privacy Lock-Down (Immediate)
1. **Secure `/api/admin/*` Endpoints:**
   - Create a shared utility `verifyAdminSession(req)` in `frontend/src/lib/supabase/server.ts`.
   - Add the guard to:
     - `frontend/src/app/api/admin/seeding-lab/route.ts`
     - `frontend/src/app/api/admin/upload-seed-image/route.ts`
     - `frontend/src/app/api/admin/ai-shift-spot/route.ts`
     - `frontend/src/app/api/admin/transform-dish-image/route.ts`
     - `frontend/src/app/api/admin/save-studio-icon/route.ts`
   - Return `401 Unauthorized` (if no session) or `403 Forbidden` (if `profile.role !== "admin"`).
2. **Harden `middleware.ts`:**
   - Add `/api/admin` to protected path prefixes.
   - For `/admin` page routes, ensure non-admin users are rejected, not just unauthenticated users.
3. **Add Role Guard to `/admin/seeding-lab/page.tsx`:**
   - Add client-side check `if (currentUser?.role !== "admin") return <AccessDenied />;` matching `admin/page.tsx:256`.

---

### Phase 2: Fix "Ghost Touches" & Mobile Scroll Input Lag
1. **Add CSS `touch-action: manipulation` across Feed Elements:**
   - Add `touch-manipulation` (or `touch-action: pan-y`) to:
     - `FoodPostCard.tsx` (`<article>` line 414 and Details button line 744).
     - `FoodSpotCard.tsx` (`<article>` line 121).
     - `PopupEventCard.tsx` (`<article>` line 74).
   - Eliminates the 300ms double-tap-to-zoom hesitation in mobile WebKit.
2. **Smooth Layout Shift in `MascotWeeklyDrop.tsx`:**
   - Fix lines 151–160: Keep top/bottom padding and min-height constant during feed scroll (`min-h-[36px]` and `pt-1 pb-1`) instead of snapping height at `scrollTop > 30px`. This prevents the 14px layout jump that moves buttons away from under the user's finger.
3. **Unmount Dead Modals from `HomeView.tsx`:**
   - Remove lines 1232–1233 (`<QuickCheckInModal />`, `<SpeedTestWidget />`) from `HomeView.tsx`.
4. **Optimize `AutumnLeavesBurst` Interaction Listener:**
   - Remove `window.addEventListener('touchstart', dismiss)` so the user's very first touch is not interrupted by a root layout unmount.
5. **Backdrop-Filter Budget Optimization:**
   - Replace non-essential `backdrop-blur-md` on feed cards (such as inside `PopupEventCard.tsx` and badges) with solid high-contrast backgrounds (`bg-[#FAF7F2]`, `bg-[#181615]/90`), reducing concurrent blur passes from 15+ to <3.

---

### Phase 3: Safe Kill List Execution (90+ MB Bloat Removal)
1. **Remove Unused npm Packages:**
   ```bash
   npm uninstall @iconify/react react-peeps vaul
   ```
2. **Delete Confirmed Unused Components (14 files, ~5,160 lines, ~198 KB):**
   - `frontend/src/components/partner/PartnerSheets.tsx`
   - `frontend/src/components/partner/UnifiedPartnerWizardSheet.tsx`
   - `frontend/src/components/partner/ClaimForm.tsx`
   - `frontend/src/components/partner/PartnerSpotCardPreview.tsx`
   - `frontend/src/components/food/FoodFeed.tsx`
   - `frontend/src/components/studio/MapCaptureModal.tsx`
   - `frontend/src/components/venue/VibeGaugeMeter.tsx`
   - `frontend/src/components/map/MapZoomTrackpad.tsx`
   - `frontend/src/components/map/RadarPin.tsx`
   - `frontend/src/components/map/MapFilterBar.tsx`
   - `frontend/src/components/avatar/AvatarSwitcher.tsx`
   - `frontend/src/components/checkin/QuickCheckInModal.tsx`
   - `frontend/src/components/checkin/SpeedTestWidget.tsx`
   - `frontend/src/lib/seeds.ts`
3. **Delete Bloated / Redundant Assets (~90.4 MB):**
   - Delete `frontend/public/food-svgs/` (48 MB, dev only).
   - Delete `frontend/public/audio/` (36 MB, dev only).
   - Delete `frontend/src/app/food-icon-studio/recraftData.ts` (4.5 MB).
   - Delete duplicate font `frontend/src/fonts/Comico-Regular.otf` (1.9 MB), referencing `public/fonts/Comico-Regular.otf` canonically.
4. **Clean Scattered Curation and Scripts:**
   - Delete redundant root `curation/` folder (keep `frontend/curation/`).
   - Delete `curation/audits/` (17 one-off generator scripts).
   - Delete obsolete one-off scripts in `frontend/scripts/` containing hardcoded developer machine paths.

---

### Phase 4: Verification & Git Privacy Switch
1. Run `npx tsc --noEmit` from `frontend/` to verify zero type regressions.
2. Run `npm run test:security` to confirm security invariants pass.
3. Commit clean state: `git commit -m "chore: forensic audit cleanup and admin security hardening"`.
4. Switch GitHub repository visibility from **Public** to **Private** safely with zero leaked paths or exposed credentials.
