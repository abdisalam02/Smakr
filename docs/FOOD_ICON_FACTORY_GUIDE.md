# Smakr Food Icon Factory — Standard Go-To Pipeline

This document defines Smakr's standard high-fidelity food icon generation pipeline. Every custom dish and spot icon follows this **Zero-Shadow Commercial Photo & High-Fidelity Alpha Cutout Pipeline** to produce sharp, un-pixelated, transparent icons for both the map radar and feed cards.

---

## 1. Core Rules (Why Vectorizing & Heavy Shadows Failed)

| Rule | What Fails | Smakr High-Fidelity Cutout Pipeline (Wins) |
|---|---|---|
| **Rule 1: Background & Shadows** | Prompts asking for "soft contact shadow" or "tabletop reflection" — shadows get trapped as dirty grey/white puddles | **Strict Zero-Shadow Prompt**: Isolated floating food on pure flat `#FFFFFF` background with ABSOLUTELY ZERO contact shadow, floor shadow, or gradient. |
| **Rule 2: Plate-Free Hero Food** | Heavy ceramic plates, boards, or baskets — crowd the canvas and distract from the dish | **Floating Hero Food Only**: The dish itself floats cleanly (cheesecake slice, single taco, flatbread, burger). Cups/mugs are only kept for drinks (chai glass, cocoa mug, ramen bowl). |
| **Rule 3: Cutout Engine** | 44-color palette quantization + VTracer at 192px — creates grainy, pixelated posterized edges and eats light food parts (whipped cream, glass) | **Direct High-Resolution Sharp Cutout (`cutout-food-icon.mjs`)**: Retains 100% of photographic texture, runs neutral shadow flood-fill, clears enclosed holes (mug handles), and applies soft-distance alpha edge feathering. |
| **Rule 4: WebP Export Spec** | Tiny 192px lossy webp (< 12 KB) | **512×512 WebP (`quality: 92, alphaQuality: 100, effort: 6`)**: 40–85 KB, razor-sharp on 3x Retina displays and MapLibre GL radar pucks. |

---

## 2. Automated CLI Usage

Run from `frontend/`:
```bash
node scripts/cutout-food-icon.mjs <path-to-raw-image> <category-name> [tolerance=26] [size=512]
```

### What `scripts/cutout-food-icon.mjs` executes:
1. **Corner Background Sampling**: Averages RGB of the 4 outer corner patches to find true background baseline.
2. **Perimeter Flood-Fill**: Flood-fills border-connected pixels within `TOL` distance to alpha = 0.
3. **Neutral Shadow Clearance**: Clears border-adjacent achromatic grey pixels (`r,g,b > 172 && max - min <= 17`) so faint contact shadows dissolve completely without eroding colored food crusts.
4. **Enclosed Hole Clearing**: Detects enclosed background regions (e.g. inside mug handles) and clears them to transparent.
5. **Soft Alpha Feathering**: Smooths the 1px boundary using color-distance alpha gradient so zero white halo remains.
6. **Tight Trim & 8% Safe Margin**: Trims transparent dead space and fits the food into a centered 512×512 canvas.

---

## 3. Visual Contact Sheet Verification

To review newly cut icons on neutral grey:
```bash
node scripts/icon-contact-sheet.mjs
```
Generates `frontend/public/test-icons/contact_sheet.png` and updates [Prompt Research Lab](http://localhost:3001/MATCHA_PROMPT_LAB.html).

---

## 4. Registration Checklist

When a new food icon is created:
1. Output WebP to `frontend/public/icons/food/{name}.webp`.
2. Register in `frontend/src/components/food/FoodIcons.tsx` under `DISH_ICON_WEBP` and `CUSTOM_VECTOR_ICONS`.
3. Register in `frontend/src/lib/taxonomy.ts` in `resolveVenueDisplayBadge` and corresponding `FOOD_GROUPS` child categories.
4. Verify with `npx tsc --noEmit`.
