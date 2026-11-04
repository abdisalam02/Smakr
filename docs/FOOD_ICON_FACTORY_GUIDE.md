# Smakr Food Icon Factory — Standard Go-To Pipeline

This document defines Smakr's standard, zero-cost, high-craft food icon generation pipeline. Every custom dish icon must follow this exact methodology to avoid generic "AI clipart / mobile cooking game" aesthetics.

---

## 1. The Core Philosophy (Why Standard AI Prompts Fail)

| Feature | Standard AI Prompt (Fails) | Smakr Lineless Pipeline (Wins) |
|---|---|---|
| **Outlines** | Dark brown/black cartoon pen outlines | **100% Lineless** (edges formed purely by light against dark contrast) |
| **Color Palette** | Flat cartoon yellow (`#F3BC56`) | **Photographic RGB Palette** (toasted brioche `#B8733E`, mahogany `#4A200E`, golden butter `#DFB17B`) |
| **Icing / Glaze** | Thick, opaque flat white plastic | **Semi-Translucent Glaze** (warm undertones bleed through sheer areas) |
| **Surface** | Smooth balloon-like shading | **Faceted Crumb & Granules** (sugar dust, crispy pastry flakes, sesame seeds) |
| **Geometry** | Symmetrical mathematical curves | **Organic Gravity & Squish** (natural weight, uneven hand-baked swirl) |

---

## 2. The Two Proven Paths

### Path A: Direct Photo-Pixel Recraft Pipeline (Zero AI Redraw)
*Use when the hero food piece in the reference photo is complete and not heavily blocked.*
1. **Crop Hero Subject**: Crop tightly around the single food piece from the reference photo.
2. **Alpha Cutout**: Isolate from the plate/background using OpenCV / Sharp (contour mask or GrabCut).
3. **Edge-Preserving Smoothing**: Run `cv2.edgePreservingFilter(flags=1, sigma_s=25, sigma_r=0.25)` to melt camera sensor grain into silky vector paint zones without dulling edges.
4. **Photo-Pixel Quantization**: Run K-Means (`k=24..32`) sampled strictly from the real photo pixels.
5. **Dual Export**: Export 192×192 WebP (< 10 KB) + VTracer Spline SVG (< 25 KB, < 25 paths).

### Path B: Color-Locked Lineless Gouache (AI Edge Completion)
*Use when food is partially overlapping or cut off in the reference photo and needs complete edges.*
1. **Strict Anti-Clipart Prompt Template**:
   > `"Isolate ONLY the single hero [DISH NAME] in the center on a pure solid #FFFFFF background. Maintain 100% fidelity to the reference photo's exact colors, organic proportions, and warm directional lighting: deep roasted mahogany-brown crevices ([HEX]), warm toasted crust ([HEX]), and [KEY TEXTURE / GLAZE DETAILS]. STYLE: Lineless realistic editorial food illustration / tight digital gouache. STRICT NEGATIVES: NO outlines, NO dark contour lines, NO cartoon yellow dough, NO plastic gloss, NO comic book line art, NO plate, NO background props, NO symmetry."`
2. **GrabCut Alpha Strip**: Isolate `#FFFFFF` background to transparent alpha without leaking into light glaze.
3. **Dual Export**: Export 192×192 WebP (< 10 KB) + VTracer Spline SVG (< 30 KB, < 35 paths).

---

## 3. Dual Asset Export Standards

Every dish icon produces two companion files:
1. **Mobile WebP Icon**: `frontend/public/icons/food/{category}.webp`
   - Size: `192×192px` transparent canvas (inner content ~`176×176px` with 8px safe margin).
   - Format: WebP (`quality: 88-90`, `effort: 6`).
   - Budget: strictly `< 12 KB` (typically 7–10 KB). Instant 0-waterfall first paint on mobile maps & cards.
2. **Vector SVG Master**: `frontend/public/food-svgs/{category}.svg`
   - Mode: VTracer spline tracing (`filter_speckle: 16`, `color_precision: 5`, `layer_difference: 32`, `path_precision: 2`).
   - Budget: strictly `< 40 KB` with `< 40 clean paths` (no noisy 10 MB / 20,000 path dumps).

---

## 4. Studio & App Registration Checklist

When a new food icon is created:
1. Add SVG to `frontend/public/food-svgs/{name}.svg` and WebP to `frontend/public/icons/food/{name}.webp`.
2. Register in `frontend/src/app/food-icon-studio/page.tsx` under `PRESETS` for viewing, positioning, and stacking.
3. Register in `frontend/src/components/food/FoodIcons.tsx` (`SMAKR_ICON_SVG_BODIES` + exported component).
4. Register in `frontend/src/components/food/FoodCategoryBar.tsx` (`CATEGORY_ICON_MAP`).
5. Register in `frontend/src/components/admin/IconPickerModal.tsx` (`isNewRecraftIcon`).
6. Verify with `npx tsc --noEmit`.
