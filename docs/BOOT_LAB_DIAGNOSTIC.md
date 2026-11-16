# BOOT_LAB_DIAGNOSTIC.md — Avatar Asset Audit & Boot Lab Diagnosis

**Date:** 2026-11-09  
**Status:** Complete Read-Only Audit & Diagnosis  
**Target:** Smakr Boot Screen & `/boot-lab` Sandbox

---

## EXECUTIVE SUMMARY

1. **Authentic Pablo Stanley Assets Already In Codebase:**  
   The codebase already contains official hand-drawn Pablo Stanley Open Peeps/Blush assets in `frontend/public/mascot/` and `frontend/src/lib/blushMascotCatalog.ts`.
   - The **"SMAKR PICK" mascot** is defined in `smakr-pick-pointing.svg` (`Body/Jacket 2` with pointing hand `#Skin`, Burnt Paprika jacket `#Jacket`, charcoal tee `#Top`, and white dashed seams `#Seams`).
   - We already have **authentic hand-drawn full standing/walking bodies** (`blush-standing-walking-3.svg` and `blush-standing-doctor-nurse-3.svg`), eliminating any need for unnatural geometric legs.
   - `@dicebear/open-peeps` in `node_modules` only provides heads, faces, hair, and accessories; it contains **zero body/leg paths**.

2. **Why `/boot-lab` Animation Was Not Visible / Broken:**  
   - **The Offscreen Spawn Distance Bug ("Ghost Walk"):** Characters spawn up to 560px offscreen with a walking speed of ~102px/sec. It takes 4–5.5 seconds for them to enter view. When auto-dismissing at 2.4s, they never reach the screen.
   - **State Dependency Render Restart Loop:** In `PeepsBootScreen.tsx`, `showLogo` is in the animation loop's `useEffect` dependency array. At `t = 950ms`, calling `setShowLogo(true)` cancels the animation frame and tears down the loop mid-stride.
   - **`groundY` Anchor Coordinate Push:** Adding `+baseYOffset` (up to +55px) pushes the character's feet below `window.innerHeight`.

---

# PART 1: AUDIT OF EXISTING HAND-DRAWN UPPER BODIES, TORSOS & POSES

### 1. The "SMAKR PICK" Official Mascot Rig
- **File Location:** [`frontend/public/mascot/smakr-pick-pointing.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/smakr-pick-pointing.svg) (and companion `.webp`)
- **Brand Definition:** [`frontend/src/lib/officialSmakrMascot.ts`](file:///c:/xampp/htdocs/CityPulse/frontend/src/lib/officialSmakrMascot.ts) (`OFFICIAL_SMAKR_MASCOT_CONFIG`)
- **Catalog Entry:** [`frontend/src/lib/blushMascotCatalog.ts`](file:///c:/xampp/htdocs/CityPulse/frontend/src/lib/blushMascotCatalog.ts) (ID: `preset-pointing-up`, Body ID: `pointing-up` / `Body/Jacket 2`)

#### Exact SVG Structure & Layer Hierarchy
```xml
<svg viewBox="124.216 112.462 1060.270 1288.913" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <!-- White Vinyl Sticker Die-Cut drop shadow filter -->
    <filter id="white-sticker-glow"> ... </filter>
  </defs>
  <g id="Master/Character/Bust" filter="url(#white-sticker-glow)">
    
    <!-- 1. Body: Layered Jacket with Pointing Arm -->
    <g id="Body" transform="translate(147.000000, 639.000000) scale(1 1)">
      <g id="Body/Jacket 2">
        <defs>
          <clipPath id="clip-j2-tee"> ... </clipPath>
        </defs>
        <!-- Pointing Hand & Arm Skin -->
        <path id="Skin" fill="#ae5d29" d="M456.906... Z" />
        <!-- Burnt Paprika Outer Jacket -->
        <path id="Jacket" fill="#e84a27" d="M341.937... Z" />
        <!-- Pablo Stanley Comic Outline Ink -->
        <path id="Ink" fill="#181615" d="M376.870... Z" />
        <!-- Inner Crewneck T-Shirt -->
        <path id="Top" fill="#27272a" d="M350.393... Z" />
        <!-- Collar & Hem Contours -->
        <g clip-path="url(#clip-j2-tee)">
          <path id="OutlineStroke" stroke="#181615" stroke-width="24" stroke-linejoin="round" ... />
        </g>
        <!-- Distinct White Dashed Dot Pattern Seams -->
        <path id="Seams" fill="#FFFFFF" d="M341.593... M162.902... M630.662... Z" />
      </g>
    </g>

    <!-- 2. Head: Afro Silhouette -->
    <g id="Head" transform="translate(372.000000, 180.000000) scale(0.99789 1)">
      <g id="Head/Afro">
        <path id="Skin" fill="#ae5d29" ... />
        <path id="Ink" fill="#181615" ... />
      </g>
    </g>

    <!-- 3. Face: Big Smile Expression -->
    <g id="Face" transform="translate(531.000000, 366.000000)">
      <g id="Face/Smile Big">
        <path id="teeth" fill="#FFFFFF" ... />
        <path id="Ink" fill="#181615" ... />
      </g>
    </g>

    <!-- 4. Accessories: Wire Glasses -->
    <g id="Accessories" transform="translate(419.000000, 421.000000)">
      <g id="Accessories/Glasses 2">
        <path id="Ink" fill="#181615" ... />
      </g>
    </g>
  </g>
</svg>
```

---

### 2. Comprehensive Inventory of Existing Avatar/Mascot Assets

| Asset / File | Type | Key Features |
|---|---|---|
| [`smakr-pick-pointing.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/smakr-pick-pointing.svg) | Full Bust | Official brand mascot. Pointing hand, `#e84a27` jacket, white dashed dot seams, `#27272a` tee. |
| [`blush-standing-walking-3.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-standing-walking-3.svg) | **Full Standing Body** | **Authentic Pablo Stanley walking stride!** Full trousers (`#Clothes`), walking legs/stride (`#Skin`), shoes (`#Shoes`), coat, hands. `viewBox="57.312 164.55 1064.375 2920.7625"`. |
| [`blush-standing-doctor-nurse-3.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-standing-doctor-nurse-3.svg) | **Full Standing Body** | Upright standing pose with trousers, shoes, scrub pockets, coat. `viewBox="139.18 164.55 982.5 3003.03"`. |
| [`blush-coffee.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-coffee.svg) | Bust + Prop | Holding takeaway coffee cup (`#Cup`), coat, hand. |
| [`blush-hoodie.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-hoodie.svg) | Bust | Authentic streetwear hoodie with drawstrings and kangaroo pocket seams. |
| [`blush-jacket-1.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-jacket-1.svg) | Bust | Layered jacket with open collar. |
| [`blush-jacket-2.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-jacket-2.svg) | Bust | Pointing jacket without sticker filter. |
| [`blush-macbook.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-macbook.svg) | Bust + Prop | Arms holding open laptop. |
| [`blush-shrug.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-shrug.svg) | Bust | Expressive shrugging shoulders and raised hands. |
| [`blush-sitting-mid-1.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-sitting-mid-1.svg) | Sitting Body | Relaxed seated posture with legs. |
| [`blush-sitting-one-leg-up-2.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-sitting-one-leg-up-2.svg) | Sitting Body | Seated with one leg raised onto stool. |
| [`blush-striped-pocket-tee.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-striped-pocket-tee.svg) | Bust | Striped tee with breast pocket detail. |
| [`blush-sweater.svg`](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/blush-sweater.svg) | Bust | Knitted crewneck sweater with ribbed collar. |
| `frontend/src/lib/onboardingAvatar.ts` (`injectBustTorso`) | Code Generator | Injects sweater bust (`viewBox="64 20 576 710"`) into DiceBear head avatars. |
| `frontend/src/components/avatar/MascotCharacter.tsx` | Component | Renders DiceBear head + injected bust + 5 food props (`kanelbolle`, `coffee-cup`, `ramen-bowl`, `natural-wine`, `smash-burger`). |

#### Verified DiceBear `@dicebear/open-peeps` Schema
Inspection of `node_modules/@dicebear/open-peeps` confirms that its schema **only exposes head components**:
`['accessories', 'accessoriesProbability', 'clothingColor', 'face', 'facialHair', 'facialHairProbability', 'head', 'headContrastColor', 'mask', 'maskProbability', 'skinColor']`.
**DiceBear does not contain bodies or legs.** All authentic bodies in our codebase originate from Pablo Stanley's Blush library stored in `frontend/public/mascot/` and indexed in `blushMascotCatalog.ts`.

---

### 3. Structural Comparison of Existing Avatar Generators

#### A. `buildOpenPeepsSvg()` in `onboardingAvatar.ts`
- **Output:** Bust avatar (head + sweater torso).
- **ViewBox:** `64 20 576 710`.
- **Dimensions:** Inherits container CSS or 100%.
- **Structure:**
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="64 20 576 710">
    <g data-layer="open-peeps-bust" transform="translate(0 0)">
      <path d="M168 725 C176 620 232 574 300 568 L404 568 C472 574 528 620 536 725 Z" fill="#..." stroke="#181615" stroke-width="12"/>
      <path d="M294 566 C318 604 386 604 410 566" fill="#..." stroke="#181615" stroke-width="10"/>
      <path d="M254 624 L254 720 M450 624 L450 720" stroke="#181615" stroke-width="8" opacity="0.55"/>
    </g>
    <!-- DiceBear Head, Face, Hair, Glasses Layers -->
    <g transform="matrix(.99789 0 0 1 156 62)"> ... </g>
  </svg>
  ```

#### B. `MascotCharacter.tsx`
- **Output:** Composite bust with optional floating food props.
- **ViewBox:** `0 0 320 280` with explicit `width="320" height="280"`.
- **Structure:**
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 280" width="320" height="280" fill="none">
    <g class="mascot-float">
      <g data-layer="avatar" data-engine="open-peeps" transform="translate(...) scale(...)">
        <!-- Injected Peeps Bust + DiceBear Head -->
      </g>
      <!-- Optional Prop (e.g., Kanelbolle or Coffee Cup) -->
      <g id="prop-coffee-cup" transform="translate(268 186)"> ... </g>
    </g>
  </svg>
  ```

---

# PART 2: DIAGNOSIS OF WHY `/boot-lab` ANIMATION FAILED

### Root Cause 1: Offscreen Spawn Distance ("The Ghost Walk")
In `PeepsBootScreen.tsx` (lines 140–143):
```ts
const stagger = Math.random() * 380;
const x = enterFromLeft ? -CELL_W * scale - stagger : width + stagger;
```
- With `CELL_W * scale ≈ 180px` and `stagger` up to `380px`, initial `x` coordinates start between **-180px and -560px** offscreen left, and **width + 0px to width + 380px** offscreen right.
- The average character speed is `1.35 + rand * 0.7 ≈ 1.7px / frame` (approx **102px per second** at 60fps).
- **Result:** It takes **3.5 to 5.5 seconds** of animation before the characters even cross into the visible canvas! When testing with `testTransition=true` (which auto-dismisses at 2.4s), the boot screen closes before 80% of the crowd ever touches the visible screen.

### Root Cause 2: React State Dependency Cycle in `requestAnimationFrame`
In `PeepsBootScreen.tsx` (lines 169–283):
```ts
useEffect(() => {
  if (!atlasReady) return;
  ...
  const render = (now: number) => {
    ...
    if (!showLogo && elapsed >= 0.95) {
      setShowLogo(true); // <-- Triggers state update!
    }
    animId = requestAnimationFrame(render);
  };
  animId = requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", handleResize);
  };
}, [atlasReady, showLogo, speedMultiplier, persistent, dismissing, onComplete]);
```
- `showLogo` is inside the `useEffect` dependency array.
- At `elapsed = 0.95s`, `setShowLogo(true)` fires.
- React immediately unmounts the effect, calls `cancelAnimationFrame(animId)`, clears the resize listener, and remounts a fresh effect.
- This creates frame stutter and resets animation phase timings mid-stride.

### Root Cause 3: `groundY` Anchor Coordinate Math Pushes Sprites Offscreen
In `PeepsBootScreen.tsx` (lines 241–244):
```ts
const groundY = h - drawH + peep.baseYOffset + bobY;
const centerX = peep.x + drawW / 2;
const centerY = groundY + drawH / 2;
```
- For front-row characters, `baseYOffset = +55px`.
- `h - drawH + 55` places the bottom of the 380px sprite at `h + 55px` (55px below the screen).
- On mobile viewports (where `h ≈ 667px` or `844px`), a 380px sprite with scale `1.0` takes up more than half the screen, and the positive offset chops off their shoes and shins.

### Root Cause 4: SVG Data URI Encoding in Chromium
In `PeepsBootScreen.tsx` (line 82):
```ts
img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(peep.svg);
```
- `buildFullBodyCrowdPeepSvg` produces `<svg viewBox="0 0 280 480" width="280" height="480">`.
- While numeric `width` and `height` exist, loading 16 complex multi-path SVG data URIs simultaneously into `new Image()` can experience slight decoding latency.
- In `PeepsBootScreen.tsx`, if any image encounters an issue, `img.onerror` resolves silently, meaning blank cells could be drawn into the atlas.

### Root Cause 5: Unnatural Robotic Silhouette (Aesthetic Disconnect)
- The manual procedural vector rigs in `fullBodyCrowdPeep.ts` (Rig 0 to 4) were assembled using rigid geometric SVG primitives (`<rect>`, `<path d="M108 270 L96 428...">`).
- They lack the organic comic line-weight variation, relaxed hand-drawn slouch, and whimsical proportions of Pablo Stanley's Open Peeps illustrations.
- Since we already have authentic hand-drawn Blush standing walking rigs (`blush-standing-walking-3.svg`), we should harvest their genuine paths for the crowd!

---

# ACTIONABLE REMEDIATION PLAN

1. **Adopt Authentic Pablo Stanley Standing Rigs:**
   Extract and vectorize the authentic Pablo Stanley standing walking paths from `blush-standing-walking-3.svg` and `blush-standing-doctor-nurse-3.svg` (with customizable color slots: `#Skin`, `#Clothes`, `#Shoes`, and `#Ink`), replacing the robotic geometric limbs.

2. **Fix Spawn & Speed Timing in `PeepsBootScreen.tsx`:**
   - Pre-distribute 40% of the crowd across the visible canvas on mount so the screen is immediately bustling with life upon boot.
   - Spawn the remaining 60% with modest offscreen offsets (-60px to -140px) and a snappy entrance burst (e.g., initial 3.5x speed decaying over 800ms) so they briskly walk into frame immediately.

3. **Decouple `showLogo` from the Canvas Loop Dependency Array:**
   Use a `useRef<boolean>` or uncouple the logo state from the `useEffect` dependencies so the `requestAnimationFrame` loop runs uninterrupted without effect teardown.

4. **Correct `groundY` Anchor Coordinate Math:**
   Anchor character feet precisely to `h - 12px` (grounded bottom margin) and offset depth layers upward (`baseYOffset = -25px` for back row, `0px` for mid row, `+10px` for front row) so feet are always cleanly grounded on the floor.
