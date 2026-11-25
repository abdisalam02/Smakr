# Smakr Mascot SVG Editing Playbook (Living Rules)

> **Purpose:** Canonical, living rulebook for designing, editing, and QA-verifying Smakr mascot SVG variations. Every time new visual or workflow feedback is received from the user, append the learned rule here and log it in Section 7 so all future sessions apply it automatically.
>
> For low-level Blush Pro `fill-rule="evenodd"` subpath math, see [MASCOT_SVG_FIX_GUIDE.md](file:///c:/xampp/htdocs/CityPulse/docs/MASCOT_SVG_FIX_GUIDE.md).

---

## 1. Canonical Base & Identity Lock
- **Always build from the canonical ad mascot:** [smakr-pick-pointing.svg](file:///c:/xampp/htdocs/CityPulse/frontend/public/mascot/smakr-pick-pointing.svg).
  - `viewBox="124.216 112.462 1060.270 1288.913"`
  - Fixed master slots: `Body` `translate(147, 639)`, `Head` `translate(372, 180) scale(0.99789 1)`, `Face` `translate(531, 366)`, `Accessories` `translate(419, 421)`.
- **NEVER use `smakr-jacket-pockets.svg` as a base** — it is an unfinished test prototype with slightly shifted glasses alignment.
- **Reuse canonical anatomy verbatim:** Copy `Head`, `Face`, `Accessories`, and (when pointing) the clipped bare pointing right hand (`Skin` + `Ink` clipped to the hand/wrist region) directly from `smakr-pick-pointing.svg` so the Afro, centered round glasses, smile, and hand linework never drift.
- **Z-order rule:** Render all garments, hoods, collars, and scarves *inside* `Body` (before `<!-- 2. Head -->`) so the Afro and dark jaw ink line naturally overlap the top edge of collars, hoods, and scarves with zero chin-clipping artifacts.

---

## 2. Reference-First Rule (Real Photos Before Vectors)
- **Real garment reference photos are mandatory** before authoring any new outfit or accessory (uploaded by the user or researched via web search). Do not rely solely on generic cartoon guesses.
- Before writing paths, break down the real photo's physical construction:
  1. **Silhouette & loft** (how bulky, boxy, or fitted it sits on shoulders/arms).
  2. **Structural joins** (how a hood folds *over* the shoulders into the zipper placket, how cuffs cinch below sleeves, how lapels/pockets sit).
  3. **Hardware & trim** (zipper tape, storm welt, zipper teeth, pull slider, velcro cuff straps, buttons, stitching, fringe).

---

## 3. Vector Authoring & Colorizer Contract
- **Prefer clean semantic layered paths over `evenodd` surgery:**
  - Outer garment contours: `stroke="#181615" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"`.
  - Internal quilt seams, folds, cuff stitches, scarf creases: `stroke-width="8.5"`–`"9.5"`.
  - Fine details (zipper teeth, dashed workwear top-stitching, inner hood lining lines): `stroke-width="3"`–`"4.5"`.
- **Respect `SmakrMascotRig.tsx` whitelisted IDs:**
  - Recolorable slots: `Skin`, `Ink` (locked `#181615`), `Jacket`, `Clothes`, `Top`, `Bottom`, `SherpaBase`, `Seams`, `Squiggles`, `Hat`, `Shoes`, `Cup`, `Computer`.
  - Fixed details (shadows, highlights, zipper tape, velcro tabs, buttons, scarf stripes): leave unwhitelisted so theme/palette recoloring never corrupts them.
- **Standalone ad SVGs:** Omit forced `<filter id="white-sticker-glow">` on standalone variation files unless explicitly requested, so sprites render cleanly on both light Warm Oat (`#F7F2E8`) and dark Espresso (`#17120F`) backgrounds.

---

## 4. Garment-Specific Craft Rules (Earned From Live Revisions)

### A. Puffer Jackets & Quilted Outerwear
- **Never look flat:** Use **3-tone flat matte modeling** inside clipped panels (base shell color + subtle 1-step lighter top-of-baffle crown highlight + deeper recessed shadow right above each horizontal quilt seam) paired with genuinely scalloped outer sleeve/shoulder silhouettes.
- **Hood-to-jacket connection:** Never leave a hood floating behind a hard shoulder line. Split the hood into:
  1. **Back Hood Bowl** (behind neck): outer shell + dark quilted inner hood lining (`#1F2227`) with subtle inner fold lines.
  2. **Front Hood Collar Lobes** (rendered *on top of* the shoulder seam with subtle cast shadows underneath): fold forward over the shoulders and merge **continuously** into the open front zipper placket.
- **Open zipper placket:** Flare both zipper tracks gently upward and outward into the inner hood collar opening (matching real jacket drape), with dark zipper tape, subtle piped storm-welt edge, fine dashed zipper teeth, and a bottom zipper slider + pull tab.
- **Puffer cuffs & velcro straps:** Keep the lower forearm baffle wide and plush right above the wrist before cinching cleanly into a dedicated stitched cuff band. Place compact black velcro adjuster tabs neatly on the **outer cuff edge** aligned to the wrist angle — never as a floating stripe across the middle of the sleeve.

### B. Winter Scarves Over Collared Jackets
- **Layer order:** Draw the hanging scarf tail *behind* the chunky two-fold neck loop, with a flat cast shadow directly beneath the loop.
- **Neck hug & collar peek:** Raise the upper neck wrap snugly under the jaw/chin so no thin bare-neck or stray upper-collar sliver peeks above the scarf; let both lower collar tips (e.g. beige Sherpa wings) peek out naturally below/beside the loop.
- **Fringe & stripes:** Clip accent stripes (`#FAF7F2`) to the hanging tail for razor-sharp edges, and draw neat rounded fringe tassels (`stroke-width="8.5"`) with slight breathing room between tassels.

### C. New Stances, Face-Touching Poses & Custom Expressions
- **Always check existing canonical SVGs first — and verify perspective match:** Reuse heads, noses, glasses, and garments verbatim whenever perspective matches. When a hand gesture changes perspective (e.g., palm-inward pointing fist vs. side-of-hand open-V chin cradle), don't force a clenched fist onto the chin; match the reference photo's open-V side-of-hand anatomy with slim tapered fingers and **lighter hand stroke hierarchy** (`11.5px` outer hand contour, `8.5px` inner finger lines — never `15px` arm strokes on fingers).
- **Natural arm posture (avoid dead-flat horizontal bars):** In crossed-arm thinking poses, slope the support forearm upward (`~12°–16°`) from a crisp lower-left elbow toward the opposite bicep (with sleek fingertips peeking over the outer upper arm) so the posture feels dynamic and exposes clean torso fabric underneath.
- **Match authentic Open Peeps body build, fuller upper arms & forearm cone taper (never draw skinny parallel-line forearms):** Calibrate directly to `blush-coffee.svg`, `blush-shrug.svg`, `blush-pointing-up.svg`, and `blush-striped-pocket-tee.svg`:
  - **Fuller upper arms / deltoid tops:** Generous `~180–200px` upper-arm & shoulder mass (`~195px` short-sleeve opening) rather than pinched shoulders.
  - **Natural sloping shoulders calibrated to `smakr-norwegian-sweater.svg` (never horizontal linebacker shelves):** Open Peeps shoulders slope gently downward from collarbone to sleeve (`~22°–26°`, spanning `x ≈ 122–132` on left and `735` on right at chest `y = 200`, max elbow span `~780–805px` — never flat shelves out to `x = -20..900`). Always run a **Back-to-Back + Ghost Overlay** against `smakr-norwegian-sweater.svg` at equal head scale to verify shoulders, torso, and forearms match naturally without muscular over-sizing.
  - **Armpit-to-elbow upper-arm taper (wider near armpit, never a straight vertical pipe):** Start the inner armpit seam slightly inward (`x ≈ 204–206` → `176–182` at inner elbow) so upper sleeves read naturally wider near the armpit than at the elbow without ballooning into bodybuilder shoulders.
  - **Authentic Open Peeps forearm cone taper (`~2.2×–2.5×` elbow → wrist on BOTH arms):** Folded support arms must visibly converge from a proportional rounded elbow (`~162–180px`) into a slim wrist/cuff (`~74–78px`), and raised chin forearms from a proportional elbow (`~158–176px`) to a slim wrist/cuff (`~70–88px`), locking fill-path Beziers to exact reversed Ink control points.
  - **Heavyweight knitwear vs. fitted tees:** Sweaters add cozy knit ease (`~15px` fuller wool drape, rolled ribbed collar, gentle below-cuff wool ease, knitted elbow folds, and a chunky ribbed bottom hem band) while staying strictly inside the `smakr-norwegian-sweater.svg` head-to-shoulder envelope. Whenever shoulder curves shift, re-seat attached outer wool fuzz sprigs onto the exact new stroke coordinates.
- **Pure flat Open Peeps skin:** Keep bare skin (`#ae5d29`) 100% crisp flat color with zero muddy brown shading strips — let bold black linework define form, matching Pablo Stanley's original Blush SVGs.
- **Z-order split for chin/face-touching poses:** Render torso, short sleeves, and crossed support arms *before* the head (`Body`), and place any raised forearm/hand touching the chin or face in a dedicated foreground `<g>` rendered *after* `HeadAssembly` so fingers genuinely rest on the front of the jaw.
- **Cohesive head tilts:** Wrap `Head`, `Face`, and `Accessories` in one `<g id="HeadAssembly" transform="rotate(-3.5 600 580)">` so glasses stay pixel-locked to the eyes and nose during expressive head tilts.
- **Short-sleeve to bare-arm joins:** When a foreground bare arm starts beneath a short sleeve, trace its upper edge strictly along the underside curve of the sleeve hem so skin never bleeds up over the fabric cuff. Always soften shoulder transitions with cubic curves instead of sharp `L` corners, and widen the neck `<path id="Skin">` to tuck cleanly behind both sloped neck ink lines with zero white slivers.
- **Custom Open Peeps facial expressions:** Keep the canonical Open Peeps nose subpath verbatim for identity lock. For a classic thinking look, pair asymmetric brows (one flat/focused, one arched/raised), upward-glancing oval pupils positioned cleanly inside the `Glasses 2` lenses, and a compact pursed "hmm" mouth positioned slightly higher (`y ≈ 218` in Face-local space) so the chin-cradling hand never collides with the mouth.

### D. Knitwear, Traditional Patterns & Wool Fiber Texture
- **Strip decorative Blush sweater blobs cleanly:** When building on `blush-sweater.svg`, keep only the verified structural `Ink` subpath indices (`[0, 4, 9, 10, 14, 15, 16, 18, 19, 20, 22, 24, 38, 39, 40, 41, 43]`) so authentic collar ribs, cuff ribs, crossed arms, and tucked hands stay 100% intact while random black blobs vanish.
- **Anchor wool fuzz directly into the outer ink outline (never float in mid-air):** Every outer wool fiber sprig must start 3–5px *inside* the exact outer black contour (`stroke-width="2.6"`–`"3.2"`). Floating detached arcs 10–20px away from the silhouette read as stray lint/bugs rather than cozy carded wool.
- **Knit grain over pattern bands & clean ribbed cuffs:** Overlay subtle V-stitch knit grain (`opacity="0.16"`–`"0.22"`) directly over colorwork yoke bands so *Marius* / *Selburose* motifs read as knitted yarn rather than flat vinyl, exclude *lusekofte* flecks from ribbed cuff zones, and bound cuff accent stripes strictly inside the forearm seam so they never spill onto an adjacent crossed arm.
- **Keep textured knit SVGs compact with compound `<path>`s:** Merge repeating yarn V-stitches, heather crimp flecks, *lusekofte* ticks, and multi-motif yoke elements into one compound `<path d="M... M...">` per color/stroke style (cuts file size roughly in half, e.g. `166 KB` → `86 KB`).
- **3-Pass Sculpted Aran Cable-Knit Rule:** Render fisherman cables via compound passes (`deep channel recess` → `dark under-shadow` → `mid yarn rope strand` → `warm ridge crown highlight`), clip chest cables cleanly above crossed arms (`y <= ~438`), add diagonal dropped-shoulder seams + 1×1 vertical rib channels, and **wrap continuous cables + curved 1×1 sleeve ribs edge-to-edge around BOTH elbows, crossed forearms, and the lower-torso triangle** (never leave plain flat wool patches around the arms).

---

## 5. Mandatory Visual Verification Loop (No Blind Ships)
Before presenting any new or edited mascot SVG to the user:
1. **Render a 100px Body-Local Coordinate Grid PNG** (fast local `sharp` script in scratch) and inspect via `read_file` to catch any protruding seam lines, wrist pinch spikes, floating armhole seams, or collar/neck gaps.
2. **Ghost-Overlay Proportion Check (Mandatory for New Stances):** Render a 3-panel comparison (`Blush Reference` | `New Draft` | `32% Ghost Overlay` in the exact same normalized `viewBox`) to verify torso width, shoulder slope, sleeve flare, arm thickness, and ink weight match authentic Open Peeps anatomy 1:1.
3. **Render a 3-Background QA Proof Sheet** (**Warm Oat `#F7F2E8`**, **Espresso Dark `#17120F`**, and **Checkerboard Alpha**) and inspect via `read_file` to verify contrast, zero halos, and silhouette balance.
4. **Never pollute the repo with scratch debug scripts or PNGs** — keep all build/grid/proof scripts inside the conversation's `scratch/` directory; only final clean SVGs live in `frontend/public/mascot/`.

---

## 6. Catalog & Studio Integration Guardrails
- **Preserved variation registry:** All approved standalone mascot SVGs live in `frontend/public/mascot/smakr-*.svg` and are registered in the dedicated module [mascotVariations.ts](file:///c:/xampp/htdocs/CityPulse/frontend/src/lib/mascotVariations.ts), wired into the Saved Mascot Variations picker in [OfficialMascotEditor.tsx](file:///c:/xampp/htdocs/CityPulse/frontend/src/components/mascot/OfficialMascotEditor.tsx) (`/mascot-studio`).
- **Pipeline hazard:** `frontend/scripts/buildBlushCatalog.mjs` only scans `blush-*.svg` and overwrites `blushMascotCatalog.ts`. Keeping custom variations in `mascotVariations.ts` guarantees they are never clobbered.

---

## 7. Living Change & Rule Log

| Date | Trigger / User Feedback | Rule Added / Updated |
|---|---|---|
| 2026-11-24 | Initial SVG dissection & workflow audit | Standardized 100px body-local coordinate grid + 3-background QA sheet loop (`sharp`) and documented `SmakrMascotRig` ID whitelist + `buildBlushCatalog.mjs` overwrite hazard. |
| 2026-11-24 | "use real reference photos, not just generated cartoons" | Made real garment reference photos mandatory before vector authoring (Section 2). |
| 2026-11-24 | "use the canonical ad mascot, not the unfinished hands-in-pockets test" | Locked `smakr-pick-pointing.svg` as canonical base and banned `smakr-jacket-pockets.svg` as a starting template (Section 1). |
| 2026-11-24 | "puffer needs to be puffier; cuff on hand too skinny and black part off" | Added 3-tone matte loft modeling, deeper scalloped sleeve baffles, wide plush forearm cinching into stitched cuff band, and compact outer-edge velcro adjuster tab rule (Section 4A). |
| 2026-11-24 | "hood in back looks off — check how it connects to jacket and zipper area" | Split hood into back bowl + front collar lobes folding *over* shoulders seamlessly into flared open zipper tracks with piped storm welt, teeth, and bottom slider (Section 4A). |
| 2026-11-24 | New thinking stance on T-shirt (finger on chin + thinking face) | Documented foreground-hand Z-order split after `HeadAssembly`, cohesive head-tilt wrapper, sleeve-hem top-edge clip rule for crossed bare arms, and thinking-face anatomy keeping canonical nose & glasses lock (Section 4C). |
| 2026-11-24 | "new thinking one is skinnier, arms/elbows look off — overlay with Blush tee" | Added mandatory **Ghost-Overlay Proportion Check** against authentic Blush SVGs (Section 5.2), locked torso width (~510–530px), flared sleeves, chunky 140–155px Open Peeps arms, 15px ink weight, and pure flat skin with zero muddy brown shading strips (Section 4C). |
| 2026-11-24 | "elbows should be sharper; fingers are off — transplant from pointing SVG, always reuse existing SVGs when possible" | Added **Transplant Existing Canonical SVG Anatomy First** rule (mirroring/rotating the real `smakr-pick-pointing.svg` hand cleanly onto the chin) and sharpened angular-curved Open Peeps elbows (Section 4C). |
| 2026-11-24 | "pointing finger too fat, others weird; support arm too flat — slope upward like guy in blue" | Refined Section 4C: verified hand perspective match (sleek open-V side-of-hand with `11.5px`/`8.5px` hand stroke hierarchy instead of bloated fist/15px finger strokes) and angled crossed support arms `~14°` upward toward the opposite bicep with fingertips peeking cleanly. |
| 2026-11-24 | Norwegian wool sweater variation (*Marius / Setesdal lusekofte* + wool fibers) | Added Section 4D: strip `blush-sweater.svg` random blobs via verified structural subpath indices, anchor outer wool fuzz directly into the black ink outline (zero floating arcs), overlay V-stitch knit grain across colorwork yokes, bound cuff accents inside the cuff seam, and merge repeating knit textures into compound `<path>`s. |
| 2026-11-24 | Thinking stance in Norwegian wool sweater + save all variations | Built `smakr-thinking-sweater.svg` (reusing `<use href="#ths-yoke-def">` and stripping bare-wrist tick where the ribbed cuff rim meets the hand), created preserved registry `frontend/src/lib/mascotVariations.ts` (all 6 standalone SVGs), and wired the Saved Mascot Variations picker into `/mascot-studio` (`OfficialMascotEditor.tsx`). |
| 2026-11-24 | "forearms too thin/parallel; should start larger and get smaller; upper arm top bigger — base on existing Open Peeps" | Upgraded Section 4C with Open Peeps arm proportions measured directly from `blush-coffee`, `blush-shrug`, `blush-pointing-up`, and `blush-striped-pocket-tee`: fuller `~180–200px` upper-arm/deltoid tops and genuine `1.7×–2.2×` convex elbow-to-wrist forearm cone taper on both `smakr-thinking-tee.svg` and `smakr-thinking-sweater.svg`. |
| 2026-11-24 | "crossed arm still has parallel lines like a block; wool sweater should be thicker, not skin-tight" | Strengthened Section 4C: crossed support forearms must taper `~2.0×–2.1×` (steep rising underside from `192–216px` elbow to `92–106px` wrist) so they never read as blocks, and heavyweight sweaters must add genuine knit ease (`+40px` torso, thicker rolled collar, gently bloused sleeves above cinched cuffs, knitted elbow folds, and chunky ribbed bottom hem). |
| 2026-11-24 | Close-up crop: "folded arm still parallel from elbow to wrist; area close to armpit should start bigger than the lower arm" | Upgraded Section 4C: angled the armpit seam inward (`x=212..214` → `172..178`) with outer upper-arm fullness peaking near the armpit (`~225–246px`), pushed folded forearm taper to `~2.7×` (`206–230px` elbow → `76–86px` slim wrist/cuff) with exact reversed Bezier lock, and cache-busted QA proof filenames (`_v2.png`) so artifact previews never show stale images. |
| 2026-11-25 | "too muscular / too big — frame against Norwegian wool sweater QA sheet back-to-back and size shoulders, arms & forearms proportionally" | Added **Back-to-Back + Ghost Overlay vs `smakr-norwegian-sweater.svg`** proportion rule (Section 4C): replaced horizontal linebacker shoulder shelves with natural sloping Open Peeps shoulders (`~780–805px` total span vs `945px`), scaled elbows/forearms proportionally (`162–180px` → `74–78px`, `~2.2–2.3×` taper), and re-seated wool fuzz onto the updated contour. |
| 2026-11-25 | Chestnut fisherman cable-knit sweater from photo (`smakr-cable-sweater.svg`) | Added **3-Pass Sculpted Aran Cable-Knit Rule** (Section 4D): render woven chest honeycomb braids & rope twists via compound recess/under-shadow/strand/ridge layers, clip upper cables cleanly above crossed arms, add dropped-shoulder seams + 1×1 rib channels, and center forearm cables along each crossed sleeve axis. |
| 2026-11-25 | "section around the arms / sleeves don't have any design" (`smakr-cable-sweater.svg`) | Expanded Section 4D: never leave plain elbow/forearm/lower-torso zones on full-knit sweaters — wrap continuous shoulder-to-elbow rope cables, curved flanking 1×1 sleeve ribs around both elbows and crossed forearms, and lower-torso vertical rib tracks cleanly down to the bottom hem. |
