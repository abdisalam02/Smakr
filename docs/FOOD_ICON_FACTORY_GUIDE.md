# Smakr Food Icon Factory — Standard Go-To Pipeline

This document defines Smakr's standard, zero-cost, high-craft food icon generation pipeline. Every custom dish icon must follow this exact **Zero-AI-Slop Real-Photo Vectorization Pipeline** so every icon matches the crisp optical realism of `k-chicken` and `naan`.

---

## 1. Core Rules (Why AI-Art Prompts & Heavy Blur Fail)

| Rule | What Fails | Smakr Real-Photo Vector Pipeline (Wins) |
|---|---|---|
| **Rule 1: Banned Prompt Words** | `"illustration"`, `"gouache"`, `"painted"`, `"vector"`, `"cartoon"`, `"cel-shaded"`, `"2D"`, `"art"` | **100% Real Optical Photography** (or raw unedited 85mm f/2.8 DSLR macro photography with chaotic natural crumbs & real reflections) |
| **Rule 2: De-Identification** | Unmodified 1:1 cutout of a reference photo | **Structural Transform in `sharp`**: horizontal flip (`.flop()`), rotation (`-9deg` to `+12deg`), vessel/saucer stripping & hue shift, and micro-contrast sharpening (`.sharpen({ sigma: 1.4, m1: 1.5, m2: 3.0 }).linear(1.18, -14).modulate({ saturation: 1.15 })`) |
| **Rule 3: High-Detail Vectorizer** | `.median(4)` blur + 12-color quantization (creates muddy camouflage puddles) | **Zero `.median()` blur + 44 real photo colors (`dither: 0`) + VTracer (`color_precision: 7`, `layer_difference: 12`, `filter_speckle: 4`, `mode: 'spline'`)** |
| **Rule 4: Vectorized WebP Export** | Exporting `.webp` before vectorization (looks like a raw pasted photo) | **Rasterize `192×192` `.webp` (`< 12 KB`) directly from the vectorized `.svg`** so `.webp` and `.svg` share the exact stylized Recraft paint-block look |

---

## 2. Automated CLI Usage

Run from `frontend/`:
```bash
node scripts/generate-food-icon.mjs <path-to-real-photo> <category-name> [rotate-deg]
```

What `scripts/generate-food-icon.mjs` executes automatically:
1. **Alpha Cutout & Defringe**: Flood-fills outer `#FFFFFF` background to transparent alpha and strips 1px edge halos.
2. **De-Identification & Transform**: Applies `.flop()`, category rotation (`-9deg` to `+12deg`), vessel/hue adjustments, trim, and 14% safe padding.
3. **Micro-Contrast & Crispness Boost**: Runs `.sharpen({ sigma: 1.4, m1: 1.5, m2: 3.0 }).linear(1.18, -14).modulate({ saturation: 1.15 })` with **zero `.median()` blur**.
4. **44-Color Zero-Dither Quantization + VTracer**: Quantizes at `384×384` (`palette: true, colors: 44, dither: 0`) and traces splines with `color_precision=7`, `layer_difference=12`, `filter_speckle=4` to `frontend/public/food-svgs/{category}.svg`.
5. **Vector-Rasterized WebP (`< 12 KB`)**: Rasterizes `frontend/public/icons/food/{category}.webp` at `192×192` directly from the vectorized `.svg`.

---

## 3. Studio & App Registration Checklist

When a new food icon is created:
1. Export SVG to `frontend/public/food-svgs/{name}.svg` and WebP to `frontend/public/icons/food/{name}.webp`.
2. Register in `frontend/src/app/food-icon-studio/page.tsx` under `PRESETS`.
3. Register in `frontend/src/components/food/FoodIcons.tsx` (`SMAKR_ICON_SVG_BODIES` + `CUSTOM_VECTOR_ICONS`).
4. Register in `frontend/src/lib/foodIconsCatalog.ts` and `frontend/src/components/admin/IconPickerModal.tsx`.
5. Verify with `npx tsc --noEmit`.
