# Filter Icon Sketchbook Set — Dual-Reference Regeneration Plan

Owner decision (2026-11-05): **The code-based pixel humanizer is dropped permanently.**
Shifting/blurring an already-rendered image in code only produces a blurry double-vision
ghost with jagged edges; scripts cannot turn fine-liner art into bold brush strokes.
`scripts/humanize-icon.mjs`, `scripts/generate-icon.mjs`, `scripts/compare-icons.mjs` and
all their outputs (`sweets_frozen_humanized.webp`, `-compare.png`, `debug/`) were deleted.
The 13 originals in `frontend/public/icons/filters/` are untouched.

The filter set is now regenerated with **dual-reference image generation**:
Image 1 = style lock (`frontend/public/filters/inspo-for-style.jpg`),
Image 2 = subject & angle lock (a real food photo, chosen per category below).

This file plans the work only. Nothing app-code in here gets built by the asset agent —
see §1 for the ownership split.

---

## 1. Ownership split (do not cross lines)

| Owner | Scope |
|---|---|
| **Qwen Max / Kimi (code)** | Everything in `FILTER_ICON_PICK_REVAMP_AUDIT.md` §11 items 1–8 + 10–11: 4-axis taxonomy module, icon registry consolidation, counts selector + count-sorted top strip, close-on-scroll hook, `motion/react` drawer redesign, map popup/pin work, pointing Smakr Pick marker, asset-cleanup and migration proposals. **Not built by this plan.** |
| **Owner + image generator** (Gemini / AI Studio) | Run §4 master prompt with both reference images; deliver one PNG per icon. |
| **Asset pipeline** (this plan, only after a PNG is delivered) | Prepare the PNG (white → alpha, trim, scale, WebP), verify at small sizes, replace `public/icons/filters/<name>.webp` at the same path. No component code changes needed — `FILTER_CATEGORY_WEBP` in `FoodIcons.tsx` is static-path based. |

Note: `FOOD_ICON_FACTORY_GUIDE.md` (real-photo → VTracer) governs **dish icons** in
`public/icons/food/`. The sketchbook **filter set** in `public/icons/filters/` follows
this dual-reference spec instead — per owner decision, do not "fix" one with the other's
pipeline.

---

## 2. Why the buns worked and the cake/cone didn't (the two traps)

1. **Micro-grid trap.** Big smooth chunky subjects (cardamom bun, bánh mì) make the model
   reach for a fat gouache brush. Fine-mesh subjects (waffle cross-hatch, a 4-layer sponge
   with 12 individual berries) make it switch to a 0.2 mm fine-liner and draw 60 hatch
   strokes + specular dots = clip-art.
2. **Camera mismatch trap.** `inspo-for-style.jpg` shows one sandwich, two halves, single
   ~65° tabletop angle, shapes touching in a tight triangle. The failed `sweets_frozen`
   paired an isometric 3D cake with a flat side-view cone floating apart in dead space.

**Subject photo selection rules (Image 2):**
- 45°–70° overhead tabletop angle; a single cohesive subject, or two overlapping pieces
  photographed at the same angle (never two objects floating apart).
- Big chunky shapes; no fine mesh textures (wire grates, cross-hatch cones, seed fields,
  scale patterns, dozens of tiny berries).
- One dominant color story so flat slabs read at 20px.

---

## 3. Per-icon pipeline

1. Pick the subject photo for the category (§5 brief; owner sources from Pinterest/Google).
2. Generate in the image tool: attach `inspo-for-style.jpg` + subject photo, paste §4 verbatim.
3. Drop the result into `frontend/public/icons/filters/incoming/<name>.png` (folder created
   on first use).
4. Run `scripts/prepare-filter-icon.mjs <name>` (built **once the first PNG arrives** —
   asset tooling only, spec below).
5. Review the contact sheet it writes (`incoming/<name>-check.png`: 192/96/44/20 on paper
   + side-by-side with the current webp) against the §6 acceptance checklist.
6. Replace `public/icons/filters/<name>.webp` in place; verify pills, drawer and map card
   headers at 375px on `localhost:3001`. Rollback = `git checkout --` on the one file.
7. Owner approves deploy (stop gate). If the CDN caches the old bytes hard, bump a `?v=`
   query on the paths in `FILTER_CATEGORY_WEBP` — one-line change, owner/Qwen Max call.

**`prepare-filter-icon.mjs` spec (not yet built):**
- Flood-fill from the canvas border only: outer `#FFFFFF` → transparent alpha. NEVER a
  global luminance threshold — the intentional raw-white paper gaps inside the art must
  stay opaque (they sit inside the artwork's own outline).
- Defringe 1px halo, trim transparent border, scale cluster to ~88% of 192 with padding.
- Encode WebP 192×192, `quality 90, alphaQuality 92, effort 6`, budget ≤ 16 KB.
- Composite the contact sheet described in step 5.

---

## 4. Master dual-reference prompt (copy-paste with both images)

```markdown
Use Image 1 (`inspo-for-style.jpg`) strictly as the **Brushwork, Ink, and Color Style Reference**, and use Image 2 strictly as the **Food Subject and Posture Reference**.

Paint the food from Image 2 on a pure solid `#FFFFFF` background following these 5 visual rules from Image 1:

1. **Rearrange Internal Toppings for Originality:** Keep the camera angle and outer posture of Image 2, but slightly rearrange the internal toppings, garnishes, or glaze drips so it is a fresh composition.
2. **Big, Flat Gouache Slabs (Zero Micro-Grids):** Paint with a wide, flat marker/gouache brush like Image 1. Block in large, unblended shapes of solid color with rough dry-brush chalk transitions on the bread/crust. Do NOT draw tiny cross-hatching, tiny seeds, or smooth 3D airbrushed gradients.
3. **Intentional Color Misregistration (Raw Paper Gaps):** Just like the top crust of the left sandwich in Image 1, let the flat color fills stop 3–5px short of the ink outline in a few spots so raw white `#FFFFFF` paper shows through, and let the paint bleed slightly outside the line on the opposite edge.
4. **Loose, Sparse Espresso-Plum (`#381820`) Marker Lines:** Do NOT draw neat closed black coloring-book outlines around every detail. Use sparse, fast, varying-pressure `#381820` dark plum-brown felt-tip strokes that skip and overshoot slightly at corners.
5. **Flat Lilac-Grey (`#B2A5B8`) Marker Puddle Shadow:** Place a single flat, hard-edged cool lavender-grey (`#B2A5B8`) marker shadow puddle underneath the bottom-right side.
```

---

## 5. Subject-photo brief for all 13 (priority order)

| # | Category | Hero subject for Image 2 | Avoid |
|---|---|---|---|
| 1 | `sweets_frozen` | Thick slice of Basque burnt cheesecake (or berry tart wedge) with **one** gelato scoop sitting on/beside it, same overhead angle | Waffle cone grid, piles of tiny berries, specular dots |
| 2 | `pizza_pasta` | One pulled-apart pizza slice with 3 big basil leaves, or overhead mini-pizza with max 6 pepperoni discs | 30 pepperoni, flour dust, individual spaghetti strands |
| 3 | `seafood` | 3 chunky king prawns + one lemon wheel on a ice slab | Fish scales, bone diagrams, tiny shells |
| 4 | `dumplings_buns` | 4 glossy smooth bao in a steamer basket, soft big folds | Sesame dot fields, pleat-count micro-detail |
| 5 | `noodles_soup` | Overhead ramen bowl; noodles as 5–6 thick ribbon bundles, 2 chashu slabs | Drawn-out individual strands, corn-kernel grids |
| 6 | `rice_bowls` | Overhead bowl, 4 quadrant toppings as big color blocks | Grain-by-grain rice texture |
| 7 | `chicken_grill` | 2 charred skewers or drumsticks with bold wide grill marks | Thin wire barbecue grate, char speckle |
| 8 | `coffee_tea` | One latte cup + saucer from 65°, single simple swirl | Fine latte-art leaf veins, foam bubbles |
| 9 | `drinks_bars` | One tall cocktail, chunky orange-wheel garnish | Condensation dots, bubble streams, ice facets |
| 10 | `pastries_bakery` | One big cardamom bun / cinnamon knot, smooth swirl (the proven winner) | Crumb streusel speckle |
| 11 | `breads` | One round scored sourdough boule, flour dusting as broad strokes | Sliced crumb-cell interiors, seed crust |
| 12 | `brunch` | One plate: 2 eggs + 2 toast soldiers + bacon, all overlapping | Cutlery clutter, sauce sprinkle |
| 13 | `sandwiches_handhelds` | Bánh mì or club cut in two halves **touching**, same angle (mirrors inspo) | Sesame bun dot fields, crumb scatter |

Regenerate the rest only if they read sterile next to the inspo; stop as soon as the strip
looks like one hand drew it.

---

## 6. Acceptance checks (per icon)

- [ ] Reads as **one bold cluster** at 20px and 44px (no dead space between objects).
- [ ] Single camera angle; shapes touch or overlap like the inspo triangle.
- [ ] Flat gouache slabs; dry-brush chalk at crust edges; **zero** micro-grids.
- [ ] Sparse `#381820` strokes that skip/overshoot — not closed coloring-book outlines.
- [ ] Visible raw-white paper gaps (3–5px) where paint stops short of ink; bleed on the
      opposite edge.
- [ ] One hard-edged `#B2A5B8` puddle at bottom-right, flat (no gradient).
- [ ] WebP 192×192 alpha ≤ 16 KB; outer background fully transparent; inner whites kept.
- [ ] Sits on the contact sheet beside 2 already-approved icons without style drift.
- [ ] Verified in pills, drawer and map card header at 375px on dev.

## 7. What is explicitly NOT built by this plan

- Any audit §11 code work (taxonomy, strip sorting, drawer animation, scroll hook,
  Smakr Pick marker, registry consolidation, migrations, asset-cleanup PRs).
- Any pixel-processing "humanizer"/procedural icon generator — permanently retired.
- No change to `FOOD_ICON_FACTORY_GUIDE.md`'s dish-icon pipeline.

## 8. Immediate next actions

1. Owner supplies a subject photo for `sweets_frozen` (or the generated PNG directly).
2. On first PNG: build `scripts/prepare-filter-icon.mjs` per §3 spec, run pipeline,
   show contact sheet.
3. On owner approval: swap webp, verify, (deploy is its own stop gate).
