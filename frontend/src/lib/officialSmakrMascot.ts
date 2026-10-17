"use client";

import React from "react";
import type { MascotConfig } from "@/types/mascot";
import { MascotCharacter, buildMascotSVGString } from "@/components/avatar/MascotCharacter";

/**
 * Canonical, immutable Official Smakr Mascot configuration.
 *
 * Locked to the official @niwache12 / @smak brand identity:
 * - Open Peeps engine
 * - Head: Afro ('afro')
 * - Accessories: Round wire glasses ('glasses2')
 * - Face: Big warm smile ('smileBig')
 * - Skin: Warm caramel ('#D08B5B')
 * - Shirt/Top: Burnt Paprika ('#E84A27')
 * - Hair/Ink: Espresso ('#181615')
 *
 * All public brand surfaces (Weekly Drop pill & card, ✦ Smakr Pick map pin,
 * @smak / @niwache12 feed cards, and admin brand avatar) render this locked
 * identity regardless of whether the viewer is logged in or logged out.
 */
export const OFFICIAL_SMAKR_MASCOT_STORAGE_KEY = "smakr_official_brand_mascot_v1";

export const OFFICIAL_SMAKR_MASCOT_CONFIG: Readonly<MascotConfig> = Object.freeze({
  engine: "open-peeps",
  seed: "smakr-oslo-official-mascot",
  skinColor: "d08b5b",
  hairColor: "181615",
  topColor: "e84a27",
  bottomColor: "1f2937",
  hatColor: "e84a27",
  accessoryColor: "181615",
  peepsHead: "afro",
  peepsFace: "smileBig",
  peepsBody: "sweater",
  peepsFacialHair: "none",
  peepsAccessories: "glasses",
  micahHair: "fonze",
  micahEyes: "smiling",
  micahEyebrows: "up",
  micahMouth: "laughing",
  micahEars: "attached",
  micahGlasses: "round",
  micahShirt: "crew",
  prop: "none",
  animation: "gentle-float",
  showBeacon: false,
});

/**
 * Resolves the official Smakr brand mascot config.
 * Never depends on `currentUser` auth session or random seeds — strictly
 * returns any saved official brand customization or `OFFICIAL_SMAKR_MASCOT_CONFIG`.
 */
export function getOfficialSmakrMascotConfig(): MascotConfig {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(OFFICIAL_SMAKR_MASCOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MascotConfig>;
        if (parsed && typeof parsed === "object" && parsed.peepsHead) {
          return {
            ...OFFICIAL_SMAKR_MASCOT_CONFIG,
            ...parsed,
          };
        }
      }
    } catch {
      // Ignore storage errors and return the immutable default
    }
  }
  return { ...OFFICIAL_SMAKR_MASCOT_CONFIG };
}

/**
 * Allows an authenticated admin to persist an official brand mascot override
 * without ever clearing it on sign-out.
 */
export function saveOfficialSmakrMascotConfig(patch: Partial<MascotConfig>): MascotConfig {
  const next: MascotConfig = {
    ...OFFICIAL_SMAKR_MASCOT_CONFIG,
    ...patch,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(OFFICIAL_SMAKR_MASCOT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}

/**
 * Generates a standalone SVG string for the Official Smakr Mascot (used by MapLibre pins).
 */
export function buildOfficialSmakrMascotSvg(
  width = 48,
  height = 48,
  animated = false
): string {
  return buildMascotSVGString(OFFICIAL_SMAKR_MASCOT_CONFIG, animated, width, height);
}

/**
 * Reusable `<OfficialSmakrMascot />` component for all public brand surfaces.
 */
export const OfficialSmakrMascot = React.memo(function OfficialSmakrMascot({
  size = 32,
  className = "",
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return React.createElement(MascotCharacter, {
    config: OFFICIAL_SMAKR_MASCOT_CONFIG,
    size,
    className,
    animated,
  });
});

