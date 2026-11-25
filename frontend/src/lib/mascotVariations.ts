export interface SavedMascotVariation {
  id:
    | "pointing-sherpa"
    | "pointing-scarf"
    | "pointing-puffer"
    | "thinking-tee"
    | "norwegian-sweater"
    | "thinking-sweater"
    | "cable-sweater";
  label: string;
  shortLabel: string;
  pose: "Pointing" | "Thinking" | "Crossed Arms";
  outfit: string;
  svgUrl: string;
  filename: string;
}

/**
 * Preserved standalone Smakr mascot SVG library.
 * Stored outside `blushMascotCatalog.ts` so `scripts/buildBlushCatalog.mjs`
 * never overwrites hand-authored poses, knitwear, or custom winter outfits.
 */
export const SAVED_MASCOT_VARIATIONS: readonly SavedMascotVariation[] = [
  {
    id: "pointing-sherpa",
    label: "Navy Sherpa Work Jacket",
    shortLabel: "Sherpa Pointing",
    pose: "Pointing",
    outfit: "Canonical Navy Sherpa + Warm Oat Tee",
    svgUrl: "/mascot/smakr-pick-pointing.svg",
    filename: "smakr-pick-pointing.svg",
  },
  {
    id: "pointing-scarf",
    label: "Navy Sherpa + Winter Scarf",
    shortLabel: "Sherpa + Scarf",
    pose: "Pointing",
    outfit: "Burnt Paprika Fringe Scarf over Sherpa",
    svgUrl: "/mascot/smakr-jacket-scarf.svg",
    filename: "smakr-jacket-scarf.svg",
  },
  {
    id: "pointing-puffer",
    label: "Hooded Matte Puffer Jacket",
    shortLabel: "Slate Puffer",
    pose: "Pointing",
    outfit: "Slate-Blue Baffle Puffer + Charcoal Tee",
    svgUrl: "/mascot/smakr-puffer.svg",
    filename: "smakr-puffer.svg",
  },
  {
    id: "thinking-tee",
    label: "Thinking Stance · Crewneck Tee",
    shortLabel: "Thinking Tee",
    pose: "Thinking",
    outfit: "Burnt Paprika Tee + Open-V Chin Hand",
    svgUrl: "/mascot/smakr-thinking-tee.svg",
    filename: "smakr-thinking-tee.svg",
  },
  {
    id: "norwegian-sweater",
    label: "Norwegian Wool Sweater",
    shortLabel: "Norwegian Wool",
    pose: "Crossed Arms",
    outfit: "Marius / Setesdal Knit Yoke + Wool Fuzz",
    svgUrl: "/mascot/smakr-norwegian-sweater.svg",
    filename: "smakr-norwegian-sweater.svg",
  },
  {
    id: "thinking-sweater",
    label: "Thinking · Norwegian Wool Sweater",
    shortLabel: "Thinking Wool",
    pose: "Thinking",
    outfit: "Marius / Setesdal Long-Sleeve + Chin Hand",
    svgUrl: "/mascot/smakr-thinking-sweater.svg",
    filename: "smakr-thinking-sweater.svg",
  },
  {
    id: "cable-sweater",
    label: "Chestnut Fisherman Cable Sweater",
    shortLabel: "Cable Sweater",
    pose: "Crossed Arms",
    outfit: "Roasted Chestnut Aran Cables + Dropped Shoulders",
    svgUrl: "/mascot/smakr-cable-sweater.svg",
    filename: "smakr-cable-sweater.svg",
  },
] as const;
