/**
 * True Multimodal Image-to-Image Camera & Background Shift Configuration
 *
 * Strict Culinary & Local Authenticity Mandate:
 * - LOCK THE VESSEL & UTENSILS 100%: Keep the exact same bowl, plate, wrapper, or cup from the
 *   reference photo (exact same ceramic glaze, rim pattern, colors, and shape).
 * - NO PHANTOM PROPS: Never add chopsticks, spoons, napkins, fake steam clouds, or garnishes
 *   that are not in the original photo.
 * - ANTI-SLOP REALISM: Unedited iPhone 16 Pro (24mm main lens, f/4 deep focus) diner table photo
 *   with flat, natural indoor lighting matching the original food's color temperature.
 * - ONLY MUTATE:
 *   1. Camera viewing angle (`anglePreset`)
 *   2. Background table surface underneath the original vessel (`environmentPreset`)
 */

export type AnglePresetId = "hero_25" | "diner_45" | "bowl_60" | "editorial_top_75";

export type EnvironmentPresetId =
  | "neutral_original"
  | "matte_dark"
  | "warm_wood"
  | "brushed_steel"
  | "clean_stone";

export interface PresetOption<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  promptInstruction: string;
}

export const ANGLE_PRESETS: Record<AnglePresetId, PresetOption<AnglePresetId>> = {
  hero_25: {
    id: "hero_25",
    label: "25° Low Hero Angle",
    shortLabel: "25° Hero",
    promptInstruction:
      "a 25-degree low hero angle looking across the dish and its original vessel",
  },
  diner_45: {
    id: "diner_45",
    label: "45° Diner's Eye View",
    shortLabel: "45° Diner",
    promptInstruction:
      "a 45-degree natural diner's eye-level perspective sitting at the table",
  },
  bowl_60: {
    id: "bowl_60",
    label: "60° Bowl Angle",
    shortLabel: "60° Bowl",
    promptInstruction:
      "a 60-degree three-quarter diner perspective showing the full inside layout of the original bowl/plate and its depth",
  },
  editorial_top_75: {
    id: "editorial_top_75",
    label: "75° High Overhead",
    shortLabel: "75° Overhead",
    promptInstruction:
      "a 75-degree high angled overhead perspective (tilted 15-20 degrees away from a flat 90-degree top-down view)",
  },
};

export const ENVIRONMENT_PRESETS: Record<EnvironmentPresetId, PresetOption<EnvironmentPresetId>> = {
  neutral_original: {
    id: "neutral_original",
    label: "Original / Neutral Table",
    shortLabel: "Original / Neutral",
    promptInstruction:
      "a clean, understated neutral restaurant table surface with natural indoor ambient light",
  },
  matte_dark: {
    id: "matte_dark",
    label: "Matte Dark Table",
    shortLabel: "Matte Dark Table",
    promptInstruction:
      "a clean, non-reflective matte dark charcoal restaurant table surface",
  },
  warm_wood: {
    id: "warm_wood",
    label: "Warm Wood Table",
    shortLabel: "Warm Wood Table",
    promptInstruction:
      "a clean, natural unvarnished Scandinavian oak or birch wood table surface",
  },
  brushed_steel: {
    id: "brushed_steel",
    label: "Brushed Steel Counter",
    shortLabel: "Brushed Steel",
    promptInstruction:
      "a clean, matte brushed stainless steel counter surface",
  },
  clean_stone: {
    id: "clean_stone",
    label: "Clean Stone Counter",
    shortLabel: "Clean Stone",
    promptInstruction:
      "a smooth, matte light grey stone or pale terrazzo cafe table surface",
  },
};

export function resolveCategoryRemixDefaults(
  category: string,
  dishName = ""
): {
  defaultAngle: AnglePresetId;
  defaultEnvironment: EnvironmentPresetId;
} {
  const combined = `${category} ${dishName}`.toLowerCase();

  if (/ramen|pho|vietnamese|noodle|curry|mandi|bowl|soup|dumpling/i.test(combined)) {
    return {
      defaultAngle: "bowl_60",
      defaultEnvironment: "matte_dark",
    };
  }

  if (/burger|sandwich|banh_mi|cheesesteak|kebab|wrap|taco|iced|matcha|pancake/i.test(combined)) {
    return {
      defaultAngle: "hero_25",
      defaultEnvironment: "warm_wood",
    };
  }

  return {
    defaultAngle: "diner_45",
    defaultEnvironment: "warm_wood",
  };
}

/**
 * Builds the direct multimodal image-to-image prompt that locks 100% of the
 * reference image's vessel, utensils, and food textures while shifting ONLY
 * the camera viewing angle and background surface.
 */
export function buildDishSynthesisPrompt(params: {
  dishName: string;
  category: string;
  anglePreset: AnglePresetId;
  environmentPreset: EnvironmentPresetId;
  variationSeed?: number;
}): {
  prompt: string;
  selectedAngleLabel: string;
  selectedSurfaceLabel: string;
} {
  const { dishName, category, anglePreset, environmentPreset, variationSeed } = params;
  const defaults = resolveCategoryRemixDefaults(category, dishName);

  const angleSpec = ANGLE_PRESETS[anglePreset] || ANGLE_PRESETS[defaults.defaultAngle];
  const envSpec =
    ENVIRONMENT_PRESETS[environmentPreset] || ENVIRONMENT_PRESETS[defaults.defaultEnvironment];

  const prompt = [
    `Photorealistic camera angle shift of the exact dish ("${dishName}") and exact bowl/plate/vessel in the attached reference image.`,
    ``,
    `First, write a 2-sentence visual receipt describing the exact vessel color/rim pattern and exact food ingredients visible in the reference photo.`,
    `Second, generate the re-angled image following these CRITICAL REALISM RULES:`,
    `- Must look like an authentic, unedited smartphone photo (iPhone 16 Pro, 24mm main lens, f/4 deep focus) taken by a real diner at the restaurant table.`,
    `- Keep the exact same bowl/plate/wrapper/cup design (exact same colors, ceramic rim pattern, glaze, and shape), exact same meat/noodle/pastry/broth colors, and exact same ingredient textures as the reference image.`,
    `- Flat, natural indoor restaurant lighting (match the exact cool/neutral color temperature of the original food—NO warm orange AI glow, NO cinematic lighting, NO fake steam clouds, NO oversaturated colors, NO plastic sheen).`,
    `- Do NOT add chopsticks, spoons, bowls, napkins, or garnishes that are not present in the reference image.`,
    `- Only change the camera viewing angle to ${angleSpec.promptInstruction} and place the original bowl/plate/vessel on ${envSpec.promptInstruction}.`,
    variationSeed ? `- Variation seed: ${variationSeed}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    prompt,
    selectedAngleLabel: angleSpec.label,
    selectedSurfaceLabel: envSpec.label,
  };
}
