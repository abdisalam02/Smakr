/**
 * Smakr onboarding avatar engine — **DiceBear Open Peeps**.
 *
 * Pablo Stanley's Open Peeps provides hand-drawn hair for all ethnicities
 * (afros, dreads, cornrows, twists, fades, waves, buns), real headwear
 * (beanies, hip caps, hijabs, turbans), 30 facial expressions and a wide
 * inclusive skin palette.
 *
 * Every UI option below maps **1:1** to an authentic Open Peeps enum, enforced
 * at compile time via `satisfies` against `@dicebear/open-peeps` `Options`.
 * No fake strings.
 *
 * This module is the single source of truth for the schema, enums, the four
 * base presets, the URL generator and the local renderers. It deliberately does
 * NOT import from `@/types` (the types layer re-exports from here instead), so
 * there is no import cycle.
 */

import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";
import type { StyleOptions } from "@dicebear/core";
import type { Options as OpenPeepsOptions } from "@dicebear/open-peeps";

const HEX_RE = /^[0-9a-fA-F]{6}$/;

function normHex(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.replace(/^#/, "").trim() : "";
  return HEX_RE.test(raw) ? raw.toLowerCase() : fallback;
}

/* ------------------------------------------------------------------ */
/* Enum value types (derived from the installed Open Peeps package)    */
/* ------------------------------------------------------------------ */

type HeadValue = NonNullable<OpenPeepsOptions["head"]>[number];
type FaceValue = NonNullable<OpenPeepsOptions["face"]>[number];
type FacialHairEnum = NonNullable<OpenPeepsOptions["facialHair"]>[number];
type AccessoryEnum = NonNullable<OpenPeepsOptions["accessories"]>[number];

/* ------------------------------------------------------------------ */
/* Canonical schema                                                    */
/* ------------------------------------------------------------------ */

export type OpenPeepsPresetId = "male1" | "male2" | "female1" | "female2";

export interface OpenPeepsConfig {
  genderPreset: OpenPeepsPresetId;
  /** Specific hair or headwear enum. */
  headType: string;
  /** 'none' | 'hatBeanie' | 'hatHip' | 'hijab' | 'turban' */
  headwear: string;
  /** Hair / contrast colour (hex without '#'). */
  headColor: string;
  /** Skin colour (hex without '#'). */
  skinColor: string;
  /** Expression enum. */
  faceExpression: string;
  /** Eyewear enum or 'none'. */
  accessories: string;
  /** Beard / moustache enum or 'none'. */
  facialHair: string;
  /** Clothing colour (hex without '#'). */
  clothingColor: string;
}

/* ------------------------------------------------------------------ */
/* 1. Textured, Black & diverse hair (official Open Peeps enums)       */
/* ------------------------------------------------------------------ */

export const TEXTURED_HAIR_OPTIONS = [
  { label: "Curly Afro", value: "afro" },
  { label: "Long Afro", value: "longAfro" },
  { label: "Short Dreads", value: "dreads1" },
  { label: "Long Dreads", value: "dreads2" },
  { label: "Cornrows Classic", value: "cornrows" },
  { label: "Cornrows Fade", value: "cornrows2" },
  { label: "Twists", value: "twists" },
  { label: "Bantu Knots", value: "bantuKnots" },
  { label: "Flat Top", value: "flatTop" },
  { label: "Flat Top Long", value: "flatTopLong" },
] as const satisfies readonly { label: string; value: HeadValue }[];

/* ------------------------------------------------------------------ */
/* 2. Short, fades & crops                                             */
/* ------------------------------------------------------------------ */

export const SHORT_HAIR_OPTIONS = [
  { label: "Clean Buzz / Short", value: "short1" },
  { label: "Textured Crop", value: "short2" },
  { label: "Side Part Fade", value: "short3" },
  { label: "Wavy Short", value: "short4" },
  { label: "Clean Fade", value: "short5" },
  { label: "Shaved Sides", value: "shaved1" },
  { label: "Pompadour", value: "pomp" },
  { label: "Clean Shaved / Bald", value: "noHair1" },
] as const satisfies readonly { label: string; value: HeadValue }[];

/* ------------------------------------------------------------------ */
/* 3. Medium & long styles                                             */
/* ------------------------------------------------------------------ */

export const LONG_HAIR_OPTIONS = [
  { label: "Topknot Bun", value: "bun" },
  { label: "Double Buns", value: "buns" },
  { label: "Messy Bun", value: "bun2" },
  { label: "Long Curly", value: "longCurly" },
  { label: "Classic Long", value: "long" },
  { label: "Medium Straight", value: "mediumStraight" },
  { label: "Medium with Bangs", value: "mediumBangs" },
  { label: "Curtain Bangs", value: "bangs" },
  { label: "Classic Bob", value: "medium1" },
] as const satisfies readonly { label: string; value: HeadValue }[];

/** Every selectable hairstyle, grouped exactly as the builder renders them. */
export const HAIR_GROUPS: readonly {
  title: string;
  options: readonly { label: string; value: HeadValue }[];
}[] = [
  { title: "Textured & Afro", options: TEXTURED_HAIR_OPTIONS },
  { title: "Short & Fades", options: SHORT_HAIR_OPTIONS },
  { title: "Medium & Long", options: LONG_HAIR_OPTIONS },
];

export const HAIR_OPTIONS = [
  ...TEXTURED_HAIR_OPTIONS,
  ...SHORT_HAIR_OPTIONS,
  ...LONG_HAIR_OPTIONS,
] as const;

/* ---- Men's hairstyle categories (valid DiceBear Open Peeps enums) ---- */

export type MensHairCategoryKey = "fades" | "wavyVolume" | "flowLong" | "braidsAfro";

export const MENS_HAIR_CATEGORIES: Record<
  MensHairCategoryKey,
  readonly { label: string; value: HeadValue }[]
> = {
  fades: [
    { label: "Clean Fade", value: "short5" },
    { label: "Side Part / Comb-Over", value: "short3" },
    { label: "Classic Crew Cut", value: "short1" },
    { label: "Textured Crop", value: "short2" },
    { label: "Buzz Cut", value: "shaved2" },
    { label: "Shaved Crop", value: "shaved3" },
    { label: "Bald / Shaved", value: "noHair1" },
  ],
  wavyVolume: [
    { label: "Messy Waves", value: "short4" },
    { label: "Pompadour / Quiff", value: "pomp" },
    { label: "Undercut Taper", value: "shaved1" },
    { label: "Mohawk", value: "mohawk" },
    { label: "Faux Hawk", value: "mohawk2" },
    { label: "Layered Shag", value: "medium3" },
  ],
  flowLong: [
    { label: "Surfer Flow", value: "medium2" },
    { label: "Skater Side-Sweep", value: "medium1" },
    { label: "Shoulder-Length", value: "mediumStraight" },
    { label: "Topknot / Man Bun", value: "bun" },
  ],
  braidsAfro: [
    { label: "Short Dreads", value: "dreads1" },
    { label: "Long Dreads", value: "dreads2" },
    { label: "Cornrows", value: "cornrows" },
    { label: "Twists", value: "twists" },
    { label: "Flat Top Fade", value: "flatTop" },
    { label: "Full Rounded Afro", value: "afro" },
  ],
};

/** Combined men's list for flat lookups and validation. */
export const ALL_MENS_HAIR: readonly { label: string; value: HeadValue }[] = [
  ...MENS_HAIR_CATEGORIES.fades,
  ...MENS_HAIR_CATEGORIES.wavyVolume,
  ...MENS_HAIR_CATEGORIES.flowLong,
  ...MENS_HAIR_CATEGORIES.braidsAfro,
];

/* ---- Women's hairstyle categories (valid DiceBear Open Peeps enums) ---- */

export type WomensHairCategoryKey = "bobBangs" | "longWavy" | "bunsUpdos" | "afroBraids";

export const WOMENS_HAIR_CATEGORIES: Record<
  WomensHairCategoryKey,
  readonly { label: string; value: HeadValue }[]
> = {
  bobBangs: [
    { label: "Classic Bob", value: "medium1" },
    { label: "Medium with Bangs", value: "mediumBangs" },
    { label: "Layered Bangs", value: "mediumBangs2" },
    { label: "Soft Bangs", value: "mediumBangs3" },
    { label: "Curtain Bangs", value: "bangs" },
    { label: "Full Fringe", value: "bangs2" },
  ],
  longWavy: [
    { label: "Classic Long", value: "long" },
    { label: "Long with Bangs", value: "longBangs" },
    { label: "Long Curly", value: "longCurly" },
    { label: "Medium Straight", value: "mediumStraight" },
    { label: "Shoulder Waves", value: "medium2" },
  ],
  bunsUpdos: [
    { label: "Topknot Bun", value: "bun" },
    { label: "Messy Bun", value: "bun2" },
    { label: "Double Buns", value: "buns" },
    { label: "Silver Bun", value: "grayBun" },
  ],
  afroBraids: [
    { label: "Curly Afro", value: "afro" },
    { label: "Long Afro", value: "longAfro" },
    { label: "Twists", value: "twists" },
    { label: "Long Twists", value: "twists2" },
    { label: "Cornrows Fade", value: "cornrows2" },
    { label: "Bantu Knots", value: "bantuKnots" },
  ],
};

/** Combined women's list for flat lookups and validation. */
export const ALL_WOMENS_HAIR: readonly { label: string; value: HeadValue }[] = [
  ...WOMENS_HAIR_CATEGORIES.bobBangs,
  ...WOMENS_HAIR_CATEGORIES.longWavy,
  ...WOMENS_HAIR_CATEGORIES.bunsUpdos,
  ...WOMENS_HAIR_CATEGORIES.afroBraids,
];

/* ------------------------------------------------------------------ */
/* 4. Dedicated headwear (Pablo Stanley's hand-drawn hats)             */
/* ------------------------------------------------------------------ */

export const HEADWEAR_OPTIONS = [
  { label: "No Hat", value: "none" },
  { label: "Winter Beanie", value: "hatBeanie" },
  { label: "Barista / Hip Cap", value: "hatHip" },
  { label: "Hijab", value: "hijab" },
  { label: "Turban", value: "turban" },
] as const satisfies readonly { label: string; value: HeadValue | "none" }[];

export type HeadwearValue = (typeof HEADWEAR_OPTIONS)[number]["value"];

/* ------------------------------------------------------------------ */
/* 5. Inclusive skin tones (exact Open Peeps recommended palette)      */
/* ------------------------------------------------------------------ */

export const SKIN_TONES = [
  { label: "Porcelain", value: "ffdbb4", hex: "#FFDBB4" },
  { label: "Warm Light", value: "edb98a", hex: "#EDB98A" },
  { label: "Honey / Tan", value: "d08b5b", hex: "#D08B5B" },
  { label: "Caramel Brown", value: "ae5d29", hex: "#AE5D29" },
  { label: "Espresso", value: "694d3d", hex: "#694D3D" },
  { label: "Deep Black", value: "3b2219", hex: "#3B2219" },
] as const;

/* ------------------------------------------------------------------ */
/* 6. Hair / contrast colours (passed to headContrastColor)            */
/* ------------------------------------------------------------------ */

/** Natural hair palette (used by the colour swatches). */
export const NATURAL_HAIR_COLORS = [
  { label: "Golden Blonde", value: "d6b370", hex: "#D6B370" },
  { label: "Platinum Blonde", value: "ecdcbf", hex: "#ECDCBF" },
  { label: "Auburn / Ginger", value: "a55728", hex: "#A55728" },
  { label: "Warm Brown", value: "724133", hex: "#724133" },
  { label: "Dark Espresso", value: "4a312c", hex: "#4A312C" },
  { label: "Jet Black", value: "2c1b18", hex: "#2C1B18" },
  { label: "Silver Grey", value: "e8e1e1", hex: "#E8E1E1" },
  { label: "Paprika Red", value: "c93305", hex: "#C93305" },
] as const;

/** Back-compat alias. */
export const HAIR_COLORS = NATURAL_HAIR_COLORS;

/* ------------------------------------------------------------------ */
/* 7. Expressions                                                      */
/* ------------------------------------------------------------------ */

export const EXPRESSION_OPTIONS = [
  { label: "Friendly Smile", value: "smile" },
  { label: "Big Smile", value: "smileBig" },
  { label: "Loving Grin", value: "lovingGrin1" },
  { label: "Calm / Chill", value: "calm" },
  { label: "Cheeky", value: "cheeky" },
  { label: "Driven / Foodie", value: "driven" },
  { label: "Delighted Eater", value: "eatingHappy" },
] as const satisfies readonly { label: string; value: FaceValue }[];

/* ------------------------------------------------------------------ */
/* 8. Eyewear & accessories                                            */
/* ------------------------------------------------------------------ */

export const ACCESSORIES_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Round Glasses", value: "glasses" },
  { label: "Modern Frames", value: "glasses2" },
  { label: "Classic Glasses", value: "glasses3" },
  { label: "Retro Frames", value: "glasses4" },
  { label: "Dark Sunglasses", value: "sunglasses" },
  { label: "Cool Shades", value: "sunglasses2" },
  { label: "Eyepatch", value: "eyepatch" },
] as const satisfies readonly { label: string; value: AccessoryEnum | "none" }[];

export type AccessoryValue = (typeof ACCESSORIES_OPTIONS)[number]["value"];

/* ------------------------------------------------------------------ */
/* 9. Facial hair                                                      */
/* ------------------------------------------------------------------ */

export const FACIAL_HAIR_OPTIONS = [
  { label: "Clean Shaven", value: "none" },
  { label: "Full Beard", value: "full" },
  { label: "Lumberjack Beard", value: "full2" },
  { label: "Trimmed Beard", value: "full3" },
  { label: "Goatee", value: "goatee1" },
  { label: "Chin Strap", value: "chin" },
  { label: "Classic Moustache", value: "moustache1" },
  { label: "Handlebar Moustache", value: "moustache3" },
] as const satisfies readonly { label: string; value: FacialHairEnum | "none" }[];

export type FacialHairValue = (typeof FACIAL_HAIR_OPTIONS)[number]["value"];

/* ------------------------------------------------------------------ */
/* Clothing colours (official Open Peeps palette + brand paprika)      */
/* ------------------------------------------------------------------ */

export const CLOTHING_COLORS = [
  { label: "Paprika", value: "e84a27", hex: "#E84A27" },
  { label: "Blush", value: "e78276", hex: "#E78276" },
  { label: "Sun Yellow", value: "fdea6b", hex: "#FDEA6B" },
  { label: "Mint", value: "78e185", hex: "#78E185" },
  { label: "Sky", value: "9ddadb", hex: "#9DDADB" },
  { label: "Periwinkle", value: "8fa7df", hex: "#8FA7DF" },
  { label: "Orchid", value: "e279c7", hex: "#E279C7" },
  { label: "Charcoal", value: "262e33", hex: "#262E33" },
] as const;

/* ------------------------------------------------------------------ */
/* The four tailored base presets                                      */
/* ------------------------------------------------------------------ */

/**
 * The four tailored base presets. A preset is either:
 *   - **seed-based** — the entire look is generated from a DiceBear seed you
 *     provide (decoded into the editable options so every control still works), or
 *   - **explicit** — a hand-written option set (used when no seed is given).
 */
export interface OpenPeepsPreset {
  id: OpenPeepsPresetId;
  label: string;
  hint: string;
  /** DiceBear seed — when set, this defines the whole look. */
  seed?: string;
  /** Explicit look, used only when no `seed` is provided. */
  config?: Omit<OpenPeepsConfig, "genderPreset">;
}

export const OPEN_PEEPS_PRESETS: readonly OpenPeepsPreset[] = [
  { id: "male1", label: "Avatar 1", hint: "seed · xgeqkw0b", seed: "xgeqkw0b" },
  { id: "male2", label: "Avatar 2", hint: "seed · 77x9ehpo", seed: "77x9ehpo" },
  { id: "female1", label: "Avatar 3", hint: "seed · 34olnlwc", seed: "34olnlwc" },
  { id: "female2", label: "Avatar 4", hint: "seed · irwxl9ik", seed: "irwxl9ik" },
];

export const DEFAULT_OPEN_PEEPS_CONFIG: OpenPeepsConfig = {
  genderPreset: "male1",
  headType: "short3",
  headwear: "none",
  headColor: "2c1b18",
  skinColor: "edb98a",
  faceExpression: "smile",
  accessories: "none",
  facialHair: "none",
  clothingColor: "262e33",
};

/**
 * Fresh config for a base preset. Seeded presets are decoded from their seed so
 * the rendered avatar matches DiceBear exactly while every control stays editable.
 */
export function openPeepsConfigFromPreset(id: OpenPeepsPresetId): OpenPeepsConfig {
  const found = OPEN_PEEPS_PRESETS.find((p) => p.id === id) ?? OPEN_PEEPS_PRESETS[0];
  if (found.seed) return seedToOpenPeepsConfig(found.seed, found.id);
  return { ...(found.config ?? DEFAULT_OPEN_PEEPS_CONFIG), genderPreset: found.id };
}

/* ------------------------------------------------------------------ */
/* Value guards (runtime validation against the authentic enums)       */
/* ------------------------------------------------------------------ */

function isPresetId(value: unknown): value is OpenPeepsPresetId {
  return OPEN_PEEPS_PRESETS.some((p) => p.id === value);
}

/**
 * The authoritative Open Peeps `head` enum (48 variants), read from the package
 * schema with a fallback to every option array we expose. This is what lets the
 * newer men's / women's styles resolve correctly instead of silently falling
 * back to a default cut.
 */
const ALL_HEAD_VALUES: ReadonlySet<string> = (() => {
  const schemaHeads = (openPeeps as unknown as {
    schema?: { properties?: { head?: { default?: unknown } } };
  }).schema?.properties?.head?.default;
  const fromSchema = Array.isArray(schemaHeads)
    ? schemaHeads.filter((v): v is string => typeof v === "string")
    : [];
  return new Set<string>([
    ...fromSchema,
    ...HAIR_OPTIONS.map((o) => o.value),
    ...ALL_MENS_HAIR.map((o) => o.value),
    ...ALL_WOMENS_HAIR.map((o) => o.value),
    ...HEADWEAR_OPTIONS.map((o) => o.value).filter((v) => v !== "none"),
  ]);
})();

function isHeadValue(value: unknown): value is HeadValue {
  return typeof value === "string" && ALL_HEAD_VALUES.has(value);
}

function isHeadwearValue(value: unknown): value is HeadwearValue {
  return HEADWEAR_OPTIONS.some((o) => o.value === value);
}

function isFaceValue(value: unknown): value is FaceValue {
  return EXPRESSION_OPTIONS.some((o) => o.value === value);
}

function isAccessoryValue(value: unknown): value is AccessoryValue {
  return ACCESSORIES_OPTIONS.some((o) => o.value === value);
}

function isFacialHairValue(value: unknown): value is FacialHairValue {
  return FACIAL_HAIR_OPTIONS.some((o) => o.value === value);
}

/* ------------------------------------------------------------------ */
/* Micah → Open Peeps migration maps (for previously persisted blobs)  */
/* ------------------------------------------------------------------ */

const LEGACY_PRESET: Record<string, OpenPeepsPresetId> = {
  "male-classic": "male1",
  "male-urban": "male2",
  "female-chic": "female1",
  "female-bold": "female2",
  masculine: "male1",
  feminine: "female1",
  male1: "male1",
  male2: "male2",
  female1: "female1",
  female2: "female2",
};

const LEGACY_HAIR_TO_HEAD: Record<string, HeadValue> = {
  // Current Micah-era ids
  "clean-fade": "short5",
  "buzz-cut": "short1",
  "short-waves": "short4",
  "curly-top": "short2",
  "side-part": "short3",
  "textured-crop": "short2",
  dreadlocks: "dreads1",
  "long-waves": "long",
  "french-bob": "medium1",
  "top-knot": "bun",
  pixie: "short1",
  "curly-afro": "afro",
  braids: "cornrows",
  "curtain-bangs": "bangs",
  // Even older ids
  "clean-short": "short5",
  "wavy-bob": "medium1",
  curls: "afro",
  bun: "bun",
  beanie: "short5",
  "barista-cap": "short5",
};

const LEGACY_HEADWEAR: Record<string, HeadwearValue> = {
  none: "none",
  beanie: "hatBeanie",
  "barista-cap": "hatHip",
  "bucket-hat": "hatHip",
  beret: "hatHip",
  turban: "turban",
  hatBeanie: "hatBeanie",
  hatHip: "hatHip",
  hijab: "hijab",
};

const LEGACY_ACCESSORY: Record<string, AccessoryValue> = {
  "round-glasses": "glasses",
  "dark-shades": "sunglasses",
};

type RawConfig = Record<string, unknown>;

/**
 * Coerce any persisted (possibly Micah-era) blob into a valid Open Peeps config.
 * Unknown / missing fields fall back to the matching base preset.
 */
export function normalizeOpenPeepsConfig(raw?: unknown): OpenPeepsConfig {
  const base = { ...DEFAULT_OPEN_PEEPS_CONFIG };
  if (!raw || typeof raw !== "object") return base;
  const r = raw as RawConfig;

  // Resolve the gender preset first (drives every other fallback).
  let genderPreset: OpenPeepsPresetId = "male1";
  if (isPresetId(r.genderPreset)) {
    genderPreset = r.genderPreset;
  } else if (typeof r.preset === "string" && LEGACY_PRESET[r.preset]) {
    genderPreset = LEGACY_PRESET[r.preset];
  } else if (typeof r.presentation === "string" && LEGACY_PRESET[r.presentation]) {
    genderPreset = LEGACY_PRESET[r.presentation];
  }
  const presetBase = openPeepsConfigFromPreset(genderPreset);

  // Head type — explicit Open Peeps value, else legacy hairstyle id, else preset.
  let headType: string = presetBase.headType;
  if (typeof r.headType === "string" && isHeadValue(r.headType)) {
    headType = r.headType;
  } else if (typeof r.hairStyle === "string" && LEGACY_HAIR_TO_HEAD[r.hairStyle]) {
    headType = LEGACY_HAIR_TO_HEAD[r.hairStyle];
  }

  // Headwear — explicit value, else legacy headwear id, else preset.
  let headwear: string = presetBase.headwear;
  if (typeof r.headwear === "string" && isHeadwearValue(r.headwear)) {
    headwear = r.headwear;
  } else if (typeof r.headwear === "string" && LEGACY_HEADWEAR[r.headwear]) {
    headwear = LEGACY_HEADWEAR[r.headwear];
  }

  // Accessories — single Open Peeps value, or a legacy multi-select array.
  let accessories: string = presetBase.accessories;
  let facialHair: string = presetBase.facialHair;
  if (typeof r.accessories === "string" && isAccessoryValue(r.accessories)) {
    accessories = r.accessories;
  } else if (Array.isArray(r.accessories)) {
    const mapped = r.accessories
      .map((a) => (typeof a === "string" ? LEGACY_ACCESSORY[a] : undefined))
      .filter((a): a is AccessoryValue => Boolean(a));
    if (mapped.length > 0) accessories = mapped[0];
    if ((r.accessories as unknown[]).includes("beard-scruff")) facialHair = "full3";
  }
  if (typeof r.facialHair === "string" && isFacialHairValue(r.facialHair)) {
    facialHair = r.facialHair;
  }

  return {
    genderPreset,
    headType,
    headwear,
    headColor: normHex(r.headColor ?? r.hairColor, presetBase.headColor),
    skinColor: normHex(r.skinColor ?? r.skinTone, presetBase.skinColor),
    faceExpression:
      typeof r.faceExpression === "string" && isFaceValue(r.faceExpression)
        ? r.faceExpression
        : presetBase.faceExpression,
    accessories,
    facialHair,
    clothingColor: normHex(r.clothingColor, presetBase.clothingColor),
  };
}

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */

/** Which `head` variant is actually drawn (headwear always wins over hair). */
export function resolveActiveHead(config: OpenPeepsConfig): HeadValue {
  const hasHat = Boolean(config.headwear) && config.headwear !== "none";
  const candidate = hasHat ? config.headwear : config.headType;
  return isHeadValue(candidate) ? candidate : "short5";
}

/** Maps a config onto the authentic DiceBear Open Peeps option set. */
export function openPeepsStyleOptions(
  config: OpenPeepsConfig
): StyleOptions<OpenPeepsOptions> {
  const hasAccessories = Boolean(config.accessories) && config.accessories !== "none";
  const hasFacialHair = Boolean(config.facialHair) && config.facialHair !== "none";

  return {
    seed: "smakr-open-peeps",
    head: [resolveActiveHead(config)],
    face: [isFaceValue(config.faceExpression) ? config.faceExpression : "smile"],
    skinColor: [normHex(config.skinColor, "ffdbb4")],
    headContrastColor: [normHex(config.headColor, "2c1b18")],
    clothingColor: [normHex(config.clothingColor, "e84a27")],
    accessories: isAccessoryValue(config.accessories) && config.accessories !== "none"
      ? [config.accessories]
      : [],
    accessoriesProbability: hasAccessories ? 100 : 0,
    facialHair:
      isFacialHairValue(config.facialHair) && config.facialHair !== "none"
        ? [config.facialHair]
        : [],
    facialHairProbability: hasFacialHair ? 100 : 0,
    maskProbability: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Hair-colour patch                                                   */
/*                                                                     */
/* DiceBear's Open Peeps build bakes the hair fill as a literal `#000`  */
/* for ~38 of the 48 head variants — only 10 honour `headContrastColor`.*/
/* We therefore recolour the baked hair inside the head component so the*/
/* hair-colour swatches work for EVERY style. The head component is     */
/* always wrapped in a fixed group, so the patch is surgical (it never  */
/* touches the face/eyes) and works for local + SSR rendering alike.    */
/* ------------------------------------------------------------------ */

const HEAD_GROUP_OPEN = '<g transform="matrix(.99789 0 0 1 156 62)">';
const FACE_GROUP_OPEN = '<g transform="translate(315 248)">';

/** Headwear / bald variants: no hair fill to recolour. */
const NON_HAIR_HEADS = new Set<string>([
  "hatBeanie",
  "hatHip",
  "hijab",
  "turban",
  "bear",
  "noHair1",
  "noHair2",
  "noHair3",
]);

function headSegmentRange(svg: string): { from: number; to: number } | null {
  const start = svg.indexOf(HEAD_GROUP_OPEN);
  if (start < 0) return null;
  const from = start + HEAD_GROUP_OPEN.length;
  const to = svg.indexOf(FACE_GROUP_OPEN, from);
  if (to < 0) return null;
  return { from, to };
}

function probeHeadSvg(head: HeadValue, contrast: string): string {
  return createAvatar(openPeeps, {
    seed: "smakr-hair-probe",
    head: [head],
    face: ["smile"],
    skinColor: ["edb98a"],
    clothingColor: ["e84a27"],
    headContrastColor: [contrast],
    accessories: [],
    accessoriesProbability: 0,
    facialHair: [],
    facialHairProbability: 0,
    maskProbability: 0,
  }).toString();
}

const contrastAwareCache = new Map<string, boolean>();

/** True when a head variant actually honours `headContrastColor`. */
function headHonorsContrast(head: HeadValue): boolean {
  const cached = contrastAwareCache.get(head);
  if (cached !== undefined) return cached;
  const svgA = probeHeadSvg(head, "000000");
  const svgB = probeHeadSvg(head, "ffffff");
  const ra = headSegmentRange(svgA);
  const rb = headSegmentRange(svgB);
  const aware =
    ra !== null && rb !== null && svgA.slice(ra.from, ra.to) !== svgB.slice(rb.from, rb.to);
  contrastAwareCache.set(head, aware);
  return aware;
}

function recolorHeadHair(svg: string, hair: string): string {
  const range = headSegmentRange(svg);
  if (!range) return svg;
  const patched = svg.slice(range.from, range.to).replaceAll('#000"', `#${hair}"`);
  return svg.slice(0, range.from) + patched + svg.slice(range.to);
}

/** Self-contained DiceBear Open Peeps `<svg>` string. */
export function buildOpenPeepsSvg(config: OpenPeepsConfig): string {
  const svg = createAvatar(openPeeps, openPeepsStyleOptions(config)).toString();
  const head = resolveActiveHead(config);
  // Contrast-aware heads already use the hair colour; hats/bald have no hair.
  if (NON_HAIR_HEADS.has(head) || headHonorsContrast(head)) return svg;
  return recolorHeadHair(svg, normHex(config.headColor, "2c1b18"));
}

/** `data:` URI suitable for an `<img src>` / persisted `avatar_url`. */
export function buildOpenPeepsDataUri(config: OpenPeepsConfig): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildOpenPeepsSvg(config));
}

/**
 * Official DiceBear Open Peeps HTTP endpoint for a config.
 *
 * Used for shareable / OpenGraph avatars and as the canonical, portable
 * representation of a look. The app renders locally via {@link buildOpenPeepsSvg}
 * (offline-safe, SSR-safe) and persists a data URI, but this URL stays in sync
 * with the exact same enums.
 */
export function generateOpenPeepsUrl(config: OpenPeepsConfig): string {
  const activeHead =
    config.headwear && config.headwear !== "none" ? config.headwear : config.headType;

  const params = new URLSearchParams({
    head: activeHead,
    face: config.faceExpression || "smile",
    skinColor: config.skinColor || "ffdbb4",
    headContrastColor: config.headColor || "2c1b18",
    clothingColor: config.clothingColor || "e84a27",
    maskProbability: "0",
  });

  if (config.accessories && config.accessories !== "none") {
    params.set("accessories", config.accessories);
    params.set("accessoriesProbability", "100");
  } else {
    params.set("accessoriesProbability", "0");
  }

  if (config.facialHair && config.facialHair !== "none") {
    params.set("facialHair", config.facialHair);
    params.set("facialHairProbability", "100");
  } else {
    params.set("facialHairProbability", "0");
  }

  return `https://api.dicebear.com/9.x/open-peeps/svg?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/* "Surprise Me"                                                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Seed → config (DiceBear seed → editable look)                       */
/* ------------------------------------------------------------------ */

/**
 * Decodes a DiceBear **seed** into an editable Open Peeps config by reading the
 * components the PRNG actually picked (`toJson().extra`). Heads that bake their
 * hair (i.e. ignore `headContrastColor`) fall back to black, so our render
 * matches DiceBear's output for that seed while every control stays editable.
 */
export function seedToOpenPeepsConfig(
  seed: string,
  genderPreset: OpenPeepsPresetId = "male1"
): OpenPeepsConfig {
  const extra = createAvatar(openPeeps, { seed: seed || "smakr" }).toJson()
    .extra as Record<string, unknown>;
  const asHex = (value: unknown) => (typeof value === "string" ? value.replace(/^#/, "") : undefined);

  const head: HeadValue =
    typeof extra.head === "string" && isHeadValue(extra.head)
      ? extra.head
      : resolveActiveHead(DEFAULT_OPEN_PEEPS_CONFIG);

  return {
    genderPreset,
    headType: head,
    headwear: "none",
    headColor: headHonorsContrast(head)
      ? normHex(asHex(extra.headContrastColor), DEFAULT_OPEN_PEEPS_CONFIG.headColor)
      : "2c1b18",
    skinColor: normHex(asHex(extra.skinColor), DEFAULT_OPEN_PEEPS_CONFIG.skinColor),
    faceExpression:
      typeof extra.face === "string" && isFaceValue(extra.face)
        ? extra.face
        : DEFAULT_OPEN_PEEPS_CONFIG.faceExpression,
    accessories:
      typeof extra.accessories === "string" && isAccessoryValue(extra.accessories)
        ? extra.accessories
        : "none",
    facialHair:
      typeof extra.facialHair === "string" && isFacialHairValue(extra.facialHair)
        ? extra.facialHair
        : "none",
    clothingColor: normHex(asHex(extra.clothingColor), DEFAULT_OPEN_PEEPS_CONFIG.clothingColor),
  };
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** A fresh, randomized-but-valid Open Peeps look. */
export function surpriseOpenPeepsConfig(): OpenPeepsConfig {
  const genderPreset = pick(OPEN_PEEPS_PRESETS).id;
  const isMale = genderPreset.startsWith("male");
  return {
    genderPreset,
    headType: pick(isMale ? ALL_MENS_HAIR : ALL_WOMENS_HAIR).value,
    headwear: "none",
    headColor: pick(NATURAL_HAIR_COLORS).value,
    skinColor: pick(SKIN_TONES).value,
    faceExpression: pick(EXPRESSION_OPTIONS).value,
    accessories: pick(ACCESSORIES_OPTIONS).value,
    facialHair: isMale ? pick(FACIAL_HAIR_OPTIONS).value : "none",
    clothingColor: pick(CLOTHING_COLORS).value,
  };
}

let cachedGuestAvatar: OpenPeepsConfig | null = null;

/**
 * Returns a stable randomized Open Peeps configuration for guest / logged-out users,
 * cached in memory and localStorage so it remains consistent during the session.
 */
export function getOrCreateGuestOpenPeepsConfig(): OpenPeepsConfig {
  if (cachedGuestAvatar) return cachedGuestAvatar;

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("smakr_guest_peep_avatar");
      if (stored) {
        cachedGuestAvatar = normalizeOpenPeepsConfig(JSON.parse(stored));
        return cachedGuestAvatar;
      }
    } catch {
      // ignore localStorage errors (e.g. private browsing)
    }
  }

  const fresh = surpriseOpenPeepsConfig();
  cachedGuestAvatar = fresh;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("smakr_guest_peep_avatar", JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }
  return fresh;
}

