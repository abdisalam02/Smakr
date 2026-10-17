# Blush Pro / Open Peeps SVG Anatomy & Multi-Layer Color Engine Runbook

> **Purpose**: This guide is written specifically so any engineer or AI model (including **Gemini 3.8 Flash**) can add, audit, split, and fix new **Blush Pro Open Peeps SVGs** (`Bust`, `Sitting`, `Standing`) in `frontend/public/mascot/` with **zero color bleeding**, **zero shifted eyewear**, and **100% accurate facial expressions**.

---

## 1. File Map (Where Everything Lives)

| File | Role |
| :--- | :--- |
| `frontend/public/mascot/*.svg` | Raw Blush Pro Open Peeps SVG files dropped by the user. |
| `frontend/scripts/buildBlushCatalog.mjs` | Harvester & topological path builder script. Run `node frontend/scripts/buildBlushCatalog.mjs` to regenerate the catalog. |
| `frontend/src/lib/blushMascotCatalog.ts` | Generated TypeScript dictionary exporting `BLUSH_BODIES`, `BLUSH_HEADS`, `BLUSH_FACES`, `BLUSH_MASKS`, `BLUSH_ACCESSORIES`, `BLUSH_BEARDS`, `BLUSH_PRESETS`. |
| `frontend/src/components/studio/SmakrMascotRig.tsx` | Live SVG renderer & strict ID whitelist colorizer (`colorizeBodyMarkup`, `colorizeHeadMarkup`). |
| `frontend/src/components/studio/StudioControls.tsx` | UI pickers for Presets, Body Poses, Faces, Eyewear/Masks/Hair, and Dynamic Color Swatches. |
| `frontend/src/types/studio.ts` | Default config (`DEFAULT_MASCOT_CONFIG`) and swatch palettes. |

---

## 2. How Blush Pro Open Peeps SVGs Actually Work (Critical Theory)

Pablo Stanley's Open Peeps / Blush Pro SVGs do **NOT** draw separate closed polygons for every garment with strokes around them. Instead, they use **two-layer or three-layer `fill-rule="evenodd"` stencils**:

1. **Backing Color Layers (`id="Skin"`, `id="Shoes"`, `id="Top"`, `id="Pants"`, `id="Clothes"`)**:
   - Often, `<path id="Skin">` or `<path id="Clothes">` is a **rough polygon** whose edges intentionally spike or overlap behind the black ink layer because the artist relied on `<path id="Ink">` sitting on top to hide the rough edges.
   - In some poses (like `Sitting/One Leg Up 2` or `Standing/Walking 3`), `<path id="Skin">` is a **single monolithic full-body silhouette** covering neck + arms + torso + legs + ankles all in one `M...Z` path!
2. **The Master `<path id="Ink" fill="#000">` Stencil Layer**:
   - `<path id="Ink">` is a compound path (`M...Z M...Z ...`) rendered with `fill-rule="evenodd"`.
   - It contains:
     - **One giant outer silhouette subpath** (usually the largest bbox subpath in `Ink`, e.g. `Ink[16]` in `One Leg Up 2` or `Ink[11]` in `Walking 3`) that covers the entire body from neck to shoes.
     - **Interior cutout hole subpaths** (for bare arms, hands, neck, ankles, shoes, or shirt/pants). Because of `fill-rule="evenodd"`, any closed subpath inside the giant outer silhouette punches a **transparent hole** through the black `Ink` fill, letting the backing color (`Skin`, `Top`, `Shoes`) show through!
     - **Solid black garment regions**: If a garment (like black pants in `One Leg Up 2`, a black T-shirt in `Sitting Mid 1`, or both shirt & pants in `Walking 3`) was originally black in Blush, it simply has **NO cutout hole** inside `Ink`!
     - **Thin seam slits**: Inside solid black garments, the artist drew thin closed slit subpaths (e.g. trouser creases or waistlines) so the background color (`#FAF7F2`) would peek through as a white/cream line against the black garment.

---

## 3. THE 4 GOLDEN RULES (Never Violate These)

### Rule 1: NEVER Slice a Body Path with a `<rect>` Y-Threshold Across Arms or Hands
- If you clip `Ink` or `Clothes` with `<rect y="0" height="980" />` for the shirt and `<rect y="980" height="1500" />` for the pants, any **hanging hand** or **forearm** that crosses `y=980` will get painted half shirt-color and half pants-color, or shoes at `y=1800` will get painted pants-color.
- **Instead**: Always use `<polygon points="..." />` that routes around the exact waist seam coordinates, or layer `<path id="Skin">` and `<path id="Shoes">` in the proper z-order so hands and shoes are never overwritten.

### Rule 2: NEVER Recolor `<path id="Skin">` with Shirt or Pants Colors
- `<path id="Skin">` must ALWAYS keep `id="Skin"` so the neck, bare forearms, wrists, hands, and bare ankles stay skin-colored (`#D08B5B`).

### Rule 3: How to Turn a Solid Black Garment Inside `id="Ink"` Into a Recolorable Layer (`id="Top"` or `id="Bottom"`)
When a garment is solid black inside `<path id="Ink">` (because `Ink` has cutout holes for the arms, neck, and shoes, leaving the garment region filled):
1. **Do NOT strip the cutout holes from `Ink`!** The cutout holes inside `Ink` are what protect the bare arms, hands, neck, and ankles from being painted by the garment!
2. Use the full `inkD` (with `fill-rule="evenodd"`) as `<path id="Top" fill-rule="evenodd" d="${inkD}" />` or `<path id="Bottom" fill-rule="evenodd" d="${inkD}" />`. Because `inkD` already has cutout holes for every bare skin and shoe region, `fill-rule="evenodd"` automatically leaves the arms, hands, neck, and ankles 100% untouched!
3. **Restore the Black Outlines**: Since turning `inkD` into a colored garment replaces the black fill with shirt/pants color, restore the black linework around the body and cutouts by rendering:
   ```xml
   <defs>
     <clipPath id="clip-pose-ink">
       <path clip-rule="evenodd" d="${inkD}" />
     </clipPath>
   </defs>
   <g clip-path="url(#clip-pose-ink)">
     <path id="OutlineStroke" d="${inkD}" fill="none" stroke="#181615" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" />
   </g>
   ```
   Because `OutlineStroke` is clipped by `clip-rule="evenodd"` of `inkD`, half of the `26px` stroke (`13px`) draws cleanly inside the garment boundary, recreating the exact hand-drawn `#181615` outline around every arm, neck, waist, and leg without thickening the exterior!
4. **Extract Seam Slits**: If `inkD` had thin crease/seam holes inside the black garment (like subpaths `[1, 9, 11]` in `One Leg Up 2`), remove those indices from `inkD` before filling `Bottom` (so they don't get outlined in black by `OutlineStroke`), and render those seam subpaths on top as:
   ```xml
   <path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${seamsD}" />
   ```

### Rule 4: Step-by-Step Diagnostic Script for Any New Body SVG
Before writing a builder for any new `.svg` file in `frontend/public/mascot/`, run this Node snippet to list every `<path>` and every `M...Z` subpath index with its `[minX, minY, maxX, maxY]` bounding box:

```js
function getSubpaths(d) {
  return d.split(/(?=[M]\s*[0-9.-])/i).filter(s => s.trim().length > 0);
}
function getBBox(d) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of d.matchAll(/([MLCQZ])\s*([^MLCQZ]*)/gi)) {
    const vals = [...c[2].matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);
    for (let i = 0; i + 1 < vals.length; i += 2) {
      minX = Math.min(minX, vals[i]); maxX = Math.max(maxX, vals[i]);
      minY = Math.min(minY, vals[i+1]); maxY = Math.max(maxY, vals[i+1]);
    }
  }
  return [Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)];
}
```
Render a visual decomposition grid (each subpath index `[0..N]` drawn in red on top of a light gray silhouette) and inspect it with `view_file` so you know with 100% certainty which subpath index is which anatomical part.

---

## 4. Exact Architecture of the 4 Full-Body Pose Builders (`buildBlushCatalog.mjs`)

### A. `sitting-mid-1` (`blush-sitting-mid-1.svg` — Cross-Legged Sitting)
- **Raw SVG Anatomy**:
  - `paths[0]` (`Skin`): Neck + left hand + right hand.
  - `paths[1]` (`Shoes`): Left + right shoes.
  - `paths[2]` (`Pants`): Crossed trousers (`#534457`), with rough top polygon spikes meant to be hidden under the shirt.
  - `paths[3]` (`Ink`): `evenodd` stencil where `Ink[24]` (neck), `Ink[19]` (left arm/hand), `Ink[13]` (right arm/hand), `Ink[8,9]` (pant legs), `Ink[11]` (right bare ankle), and `Ink[2,3]` (shoes) are cutout holes, leaving **ONLY the T-shirt** solid!
- **Exact Layer Stack**:
  1. `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`
  2. `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />`
  3. `<path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${pantsD}" />`
  4. `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${inkD}" />` *(sits ON TOP OF `Bottom`, masking the rough top edge of `pantsD` 100% natively!)*
  5. `<g clip-path="url(#clip-mid-ink)"><path id="OutlineStroke" d="${inkD}" fill="none" stroke="#181615" stroke-width="26" ... /></g>`
  6. `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${detailInkD}" />` where `detailIndices = [1, 4, 5, 6, 7, 10, 12, 14, 15, 16, 17, 18, 20, 21]` (**never include `11`**, because `Ink[11]` is the bare right ankle cutout hole).

### B. `sitting-one-leg-up-2` (`blush-sitting-one-leg-up-2.svg` — Sitting One Leg Up)
- **Raw SVG Anatomy**:
  - `paths[0]` (`Skin`): Monolithic full-body backing silhouette.
  - `paths[1]` (`Shoes`): Both shoes.
  - `paths[2]` (`Top`): Shirt backing polygon.
  - `paths[3]` (`Ink`): `evenodd` stencil where `Ink[14]` (shirt + neck), `Ink[8]` (left shirt hem), `Ink[12]` (left arm/hand), `Ink[0]` (right forearm), `Ink[4,10]` (ankles), and `Ink[2,3,6,7]` (shoes) are cutout holes inside `Ink[16]`, leaving **ONLY the trousers** solid! `Ink[1, 9, 11]` are the 3 thin trouser-crease slits.
- **Exact Layer Stack**:
  1. Remove `[1, 9, 11]` from `inkD` → `inkNoSeamsD`.
  2. `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />`
  3. `<path id="Top" fill="#FFCF77" fill-rule="evenodd" d="${topD}" />` *(sits UNDER `Bottom` so `inkNoSeamsD` masks `topD`'s rough edges)*
  4. `<path id="Bottom" fill="#8FA7DF" fill-rule="evenodd" d="${inkNoSeamsD}" />`
  5. `<g clip-path="url(#clip-oneleg-ink)"><path id="OutlineStroke" d="${inkNoSeamsD}" fill="none" stroke="#181615" stroke-width="26" ... /></g>`
  6. `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />` *(placed AFTER `OutlineStroke` so shoe interior details don't blot out the white shoes)*
  7. `<path id="OutlineStroke" d="${shoesD} ${inkSubs[3]} ${inkSubs[7]}" fill="none" stroke="#181615" stroke-width="14" ... />`
  8. `<path id="Seams" fill="#FAF7F2" fill-rule="evenodd" d="${seamsD}" />` + `<path id="Ink" fill="#181615" d="${inkSubs[15]}" />`

### C. `standing-doctor-nurse-3` (`blush-standing-doctor-nurse-3.svg` — Standing Half-Zip Pose)
- **Raw SVG Anatomy**:
  - `paths[0]` (`Clothes`): Single compound fill covering both the half-zip sweater and trousers.
  - `paths[1]` (`Skin`): Neck (`Skin[2]`), left hand (`Skin[1]`), right hand (`Skin[0]`).
  - `paths[2]` (`Shoes`): Left shoe (`Shoes[1]`), right shoe (`Shoes[0]`).
  - `paths[3]` (`Ink`): Pure outlines (already 100% linework!).
- **Why Hands & Shoes bled previously**: Because `Skin` and `Shoes` were placed *under* `Clothes`, and `Clothes` was split by a flat horizontal line `y=980` that cut above the sleeve cuffs (`y=1035`).
- **Exact Layer Stack**:
  1. `<path id="Bottom" fill="#3B82F6" fill-rule="evenodd" d="${clothesD}" />`
  2. `<g clip-path="url(#clip-doc-top)"><path id="Top" fill="#8FA7DF" fill-rule="evenodd" d="${clothesD}" /></g>` where `clip-doc-top` is `<polygon points="0,-60 1300,-60 1300,1030 1091,1035 1083,995 1071,928 1005,926 928,913 867,950 767,958 675,965 596,930 581,985 558,1035 0,1055" />` (tracing the exact waist hem `y=913..965` and both sleeve cuffs `y=1035`).
  3. `<path id="Skin" fill="#d08b5b" fill-rule="evenodd" d="${skinD}" />` *(ON TOP OF `Bottom`/`Top` so hands are 100% skin-colored)*
  4. `<path id="Shoes" fill="#FFFFFF" fill-rule="evenodd" d="${shoesD}" />` *(ON TOP OF `Bottom` so shoes are 100% shoe-colored)*
  5. `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${inkD}" />`

### D. `standing-walking-3` (`blush-standing-walking-3.svg` — Walking Pose)
- **Raw SVG Anatomy**:
  - `paths[0]` (`Skin`): Monolithic full-body skin backing.
  - `paths[1]` (`Shoes`): Both shoes.
  - `paths[2]` (`Ink`): `evenodd` stencil where `Ink[5]` (right bare arm & hand crossing waist), `Ink[4]` (left bare arm & hand), `Ink[2,9]` (ankles), and `Ink[0,1,7,8]` (both shoes) are cutout holes inside `Ink[11]`, leaving both shirt and pants solid inside `Ink`! `Ink[3]` and `Ink[6]` are the waist seam slits.
- **Exact Layer Stack**:
  1. Remove `[3, 6]` from `inkD` → `inkSolidD`.
  2. Split `Top` and `Bottom` along the polygon line `0,1004 -> 486,989 -> 775,985 -> 832,952 -> 1500,957`, which passes through the waist seam slits `[3, 6]` and through the middle of the bare right forearm hole `Ink[5]` (which is a transparent hole in `inkSolidD`, so neither `Top` nor `Bottom` paints a single pixel on the bare arm/hand!).
  3. Clip the shoe ink details strictly to `<clipPath id="clip-walk-shoes"><path fill-rule="evenodd" d="${shoesD}" /></clipPath>` so both shoes have identical `#FFFFFF` bodies and `#181615` soles/laces without turning the lower pant legs black.

---

## 5. Eyewear & Facial Expressions Rules

### Eyewear (`BLUSH_ACCESSORIES`)
- **NEVER** import eyewear paths from `react-peeps/lib/peeps/accessories/*.js` directly into Blush's `translate(headX + 47, headY + 241)` slot without coordinate conversion—`react-peeps` accessories use a different local origin (`x=21..235` vs Blush's `x=140..400`), which shifts them ~140px left like a floating monocle!
- **NEVER** use a face expression that has spectacles baked into the face path (`Awe.js` subpaths `[2,3,4,5]` or `Fear.js` in `react-peeps`) without stripping those spectacle frame subpaths first, or it will double-stack two pairs of glasses when `Round Glasses` (`glasses-2`) is active.

### Facial Expressions (`BLUSH_FACES`)
- Every face in `react-peeps/lib/peeps/face/*.js` is rendered with `fill-rule="evenodd"`.
- For open-mouth expressions (`SmileLol`, `Explaining`, `Hectic`, `Monster`, `LoveGrin`), the teeth, tongue, and tears are **already encoded as inner cutout subpaths** inside the face's `d` attribute!
- **NEVER** hand-guess approximate Bézier ovals for teeth or tongues—extract the exact subpath index from `d` (e.g., `SmileLol.subs[10]` for teeth and `subs[7,8]` for tears; `Explaining.subs[7]` for teeth and `subs[8]` for tongue; `Hectic.subs.slice(10,18)` for the 8 teeth; `LoveGrin.subs[6]` for tongue) and place them as `<path id="teeth" fill="#FFFFFF" />` / `<path id="tongue" fill="#E84A27" />` directly before `<path id="Ink" fill="#181615" fill-rule="evenodd" d="${d}" />`.

---

## 6. Mandatory Visual Verification Command
After any edit to `frontend/scripts/buildBlushCatalog.mjs`:
1. Run `node frontend/scripts/buildBlushCatalog.mjs`
2. Run `npx tsc --noEmit` in `frontend/`
3. Run `node --experimental-websocket frontend/scratch/verify_all_13_poses_complete.mjs` and inspect the output PNG with `view_file` before finishing.

---

## 7. Bust Pose Multi-Layer Garments & Static Black Removal Runbook

When an Open Peeps bust SVG has garments or patterns rendered in solid black inside `<path id="Ink">`:

### 1. `Jacket 1` (`blush-jacket-1.svg`):
- **Raw Structure**: `paths[0]` = `Skin`, `paths[1]` = white lapel collar (`fill="#FFF"`), `paths[2]` = inner tee (`Top`), `paths[3]` = `Ink` with outer coat inside `Ink[6]`.
- **Decomposition**:
  - `Jacket` (`clothingColor`): `Ink[6]` with clipped 26px black outline stroke (`clipPath id="clip-j1-coat"`).
  - `Top` (`innerClothingColor`): `paths[2]` (inner T-shirt).
  - `Seams` (`#FAF7F2`): `paths[1]` (crisp cream lapel collar).
  - `Ink` (`#181615`): `Ink[0..5]` (zipper and pocket linework).

#### 2. `Jacket 2` (`blush-jacket-2.svg`):
- **Raw Structure**: `paths[0]` = `Skin`, `paths[1]` = cardigan (`Jacket`), `paths[2]` = `Ink` (`Ink[0]` has cardigan outlines, solid black inner tee, and 9 fused border half-dots; `Ink[1]` is left sleeve seam with 1 fused half-dot; `Ink[15]` & `Ink[29]` are hand/finger skin cutout holes; `Ink[20]` is palm crease).
- **Topological Decomposition**:
  - `Skin` (`skinColor`): Native `paths[0]` (`skinD`) revealed through native `Ink[15]` & `Ink[29]` hand holes (zero rect clips, zero `stroke-width` on hand).
  - `Jacket` (`clothingColor`): Native `paths[1]` (`cardiganD`).
  - `Ink` (`#181615`): Native `Ink[0, 1, 15, 20, 29]` with the 10 fused border half-dot bump commands bridged smoothly via `L` segments.
  - `Top` (`innerClothingColor`): Exact closed inner T-shirt contour extracted from `Ink[0]` commands (`cmds[4..6]` collar + `cmds[76..83]` lapel inner edges and bottom hem), with 24px clipped stroke on the collar and bottom hem only.
  - `Seams` (`#FAF7F2`): The 29 interior polka dots (`Ink` excluding `[0, 1, 15, 20, 29]`).

### 3. `Sweater` (`blush-sweater.svg`):
- **Raw Structure**: `paths[0]` = `Skin`, `paths[1]` = sweater body (`Top`), `paths[2]` = `Ink` (45 subpaths).
- **Topological Decomposition**:
  - `Top` (`clothingColor`): `paths[1]` (sweater base with native hand cutout holes).
  - `Ink` (`#181615`): Must preserve ALL 17 structural cutout subpaths `[0, 4, 9, 10, 14, 15, 16, 18, 19, 20, 22, 24, 38, 39, 40, 41, 43]` (collar rib holes `38..41, 43`, right cuff rib holes `15, 16, 20`, left cuff/forearm holes `18, 19, 22, 24`, hand holes `10, 14`). Removing rib holes turns collar/cuffs solid black under `evenodd`.
  - `Squiggles` (`safeInnerClothing || '#FAF7F2'`): Remaining 28 confetti subpaths.

### 4. `Pointing Up` (`blush-pointing-up.svg`):
- **Raw Structure**: `paths[0]` = `Skin`, `paths[1]` = `Top`, `paths[2]` = `Ink` where Sketch Boolean Subtract merged the bottom-edge squiggle (`cmds[33..57]`) and left sleeve seam (`cmds[60..63]`) into `Ink[0]`, and `Ink[12, 15, 16]` are the exact closed hand/knuckle/finger skin cutout holes.
- **Topological Decomposition**:
  - Un-merge `bottomSquiggleD` (`cmds[33..57]`) into `Squiggles` and `leftSeamD` (`cmds[60..63]`) into `Ink` alongside `Ink[5]`.
  - `Top` (`clothingColor`): Closed `sweaterD` contour (`cmds[16..32, 58..59, 64..101]` bridged across the bottom squiggle, left seam, and wrist cuff) with 26px inward-clipped outline stroke.
  - `Skin` & `Ink` for Hand: Native closed `Ink[12] + Ink[15] + Ink[16]` for `Skin` and `handOuterD + handSkinD` with `fill-rule="evenodd"` for `Ink` (zero `stroke-width` bloating, zero wrist leak).
  - Neck `Skin`: `paths[0]` clipped to neck (`rect x="250" y="-80" width="350" height="250"`).

### 5. `Striped Pocket Tee` (`blush-striped-pocket-tee.svg`):
- **Raw Structure**: `paths[0]` = `Skin` (neck `Skin[0]`, arms `Skin[1]`, pocket backing `Skin[2]`), `paths[1]` = `Ink` (arm outline `Ink[0]`, tee outline `Ink[1]`, pocket stripes `Ink[2..9]`).
- **Decomposition**:
  - `Top` (`clothingColor`): `Ink[1]` (T-shirt body) with 26px clipped stroke.
  - `Bottom` (`innerClothingColor`): `Skin[2]` (pocket backing).
  - `Seams` (`#FAF7F2`): `Ink[2..9]` (pocket stripes).
  - `Skin` (`skinColor`): `Skin[0, 1]` clipped at `y=695` to prevent spikes below waist hem.
  - `Ink` (`#181615`): `Ink[0]` (arm outlines).

