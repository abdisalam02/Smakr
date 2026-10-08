"use client";

import { useEffect } from "react";
import {
  DEFAULT_MASCOT_CONFIG,
  MascotConfig,
  MASCOT_STORAGE_KEY,
} from "@/types/mascot";
import { useCityPulseStore } from "@/store/useCityPulseStore";

/**
 * Restores the persisted mascot configuration from localStorage once the app
 * mounts. Mounted globally in the root layout so the MapLibre marker reflects
 * the saved customization on every route, not just the studio.
 *
 * Only keys that exist in the current schema are merged, so configs saved by
 * older mascot versions can never leak invalid fields into the new pipeline.
 */
export function MascotConfigHydrator() {
  const updateMascotConfig = useCityPulseStore((state) => state.updateMascotConfig);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MASCOT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const known: Partial<MascotConfig> = {};
      (Object.keys(DEFAULT_MASCOT_CONFIG) as (keyof MascotConfig)[]).forEach((key) => {
        const value = parsed[key];
        if (value !== undefined && typeof value === typeof DEFAULT_MASCOT_CONFIG[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (known as any)[key] = value;
        }
      });

      updateMascotConfig(known);
    } catch {}
  }, [updateMascotConfig]);

  return null;
}
