# DESIGN_SYSTEM.md — Smakr Visual Standards

> Single source of truth for color, typography, card, and avatar rules. Never introduce a new palette or font.

## 1. Color
| Token | Hex | Use |
|---|---|---|
| Burnt Paprika (primary) | `#e84a27` | Brand accent, CTAs, active states, ratings, "FEED" label |
| Paprika hover | `#d23e1d` | Hover / pressed state on primary |
| Seville Orange | `#FF5416` | Secondary highlight |
| Warm Oat | `#F7F2E8` | Oat-espresso canvas (`--background`) |
| Espresso Roast | `#2B1810` | Dark text |
| Warm Oat surface | `#FAF7F2` | Light card / modal surface (`--surface` family) |
| Porcelain | `#f5f2eb` | Secondary light surface |

- **Surfaces:** `#FAF7F2` / `#f5f2eb` (Warm Oat / Porcelain). At runtime these map to the CSS variables in `frontend/src/app/globals.css` (`--background`, `--surface`, `--surface-raised`, `--surface-border`; e.g. Oat-espresso `--background:#F7F2E8`, `--surface:#FFFCF6`).
- **Borders:** `border-black/[0.08]` on light surfaces, `dark:border-white/10` in dark themes.
- Tokens are declared in `frontend/tailwind.config.ts` under `colors.smakr`.

## 2. Typography
- **Display / brand:** `font-comico` (`--font-comico`, loaded via `frontend/src/lib/fonts.ts` with `localFont`). Used for wordmark, headings, ratings.
- **Body / metadata:** **Plus Jakarta Sans** (`--font-jakarta`, wired in `frontend/src/app/layout.tsx`).
- Complementary body fonts (DM Sans, Space Grotesk, Geist) are switchable at runtime — do not add more.

## 3. Cards & photo-forward layout
- Hero food cards are **full-bleed, 16:10 or 4:3 photo-forward** with a **dark bottom scrim overlay** and legible white typography (title, meta, price sticker).
- Borderless imagery; rounded `rounded-[26px]` hero cards on a `border-black/[0.08]` hairline.
- Ratings/labels use `font-comico`. Keep at most one compact review quote so photos stay unblocked.
- Mobile: bottom sheet at ~35% peek / ~80% browse snap points; translucent floating chrome over the full-bleed MapLibre canvas.

## 4. Avatar engine
- **Open Peeps via the DiceBear API:** `https://api.dicebear.com/10.x/open-peeps/svg`
  (The current code pins `9.x` in `frontend/src/lib/onboardingAvatar.ts` and also builds avatars locally with `@dicebear/core` + `@dicebear/open-peeps`.)
- Deterministic seed: `smakr-open-peeps`. The mascot base may also use the `micah` style — see `frontend/src/types/mascot.ts` and `frontend/src/components/avatar/MascotCharacter.tsx`.
- Never render a generic emoji/placeholder avatar where the mascot engine is available.

## 5. Banned tropes
- No purple/indigo SaaS gradients, glassmorphism orbs, or generic bento grids.
- No unapproved palettes — Burnt Paprika `#e84a27` is the only primary accent.
- No fixed-pixel-width containers that overflow small viewports (`w-[400px]` is banned; use `w-full max-w-*`).
