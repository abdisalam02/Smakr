"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

export type BodyFontId =
  | "jakarta"
  | "dmsans"
  | "space"
  | "geist"
  | "outfit"
  | "syne"
  | "inter"
  | "cormorant";

interface FontOption {
  id: BodyFontId;
  name: string;
  sub: string;
  family: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    sub: "Editorial & contemporary",
    family: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  {
    id: "dmsans",
    name: "DM Sans",
    sub: "Ultra-clean geometric",
    family: "'DM Sans', system-ui, sans-serif",
  },
  {
    id: "space",
    name: "Space Grotesk",
    sub: "Tactile zine aesthetic",
    family: "'Space Grotesk', system-ui, sans-serif",
  },
  {
    id: "geist",
    name: "Geist Sans",
    sub: "Razor-sharp Swiss precision",
    family: "var(--font-geist, 'Geist', system-ui, sans-serif)",
  },
  {
    id: "outfit",
    name: "Outfit",
    sub: "Nordic punchy minimalism",
    family: "'Outfit', system-ui, sans-serif",
  },
  {
    id: "syne",
    name: "Syne",
    sub: "Avant-garde editorial display",
    family: "'Syne', system-ui, sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    sub: "Hyper-crisp functional sans",
    family: "'Inter', system-ui, sans-serif",
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    sub: "Classic Oslo food critic serif",
    family: "'Cormorant Garamond', Georgia, serif",
  },
];

/** The current app body font (admin-controlled). Syne for the beta run. */
export const DEFAULT_BODY_FONT: BodyFontId = "syne";

const STORAGE_KEY = "smakr_body_font";

/** Applies a body font to the document (CSS variables + data attribute). */
export function applyBodyFont(id: BodyFontId): void {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-body-font", id);
  document.documentElement.style.setProperty("--font-body", opt.family);
  document.documentElement.style.setProperty("--font-main", opt.family);
  if (document.body) document.body.style.fontFamily = opt.family;
}

/**
 * Inline body-font picker. Moved out of the public floating pill and into the
 * Admin → Settings tab, so testers can't change the app typeface.
 */
export function BodyFontPicker() {
  const [activeFont, setActiveFont] = useState<BodyFontId>(DEFAULT_BODY_FONT);

  useEffect(() => {
    let next: BodyFontId = DEFAULT_BODY_FONT;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as BodyFontId | null;
      if (saved && FONT_OPTIONS.some((f) => f.id === saved)) next = saved;
    } catch {
      // Ignore — fall back to the default.
    }
    setActiveFont(next);
    applyBodyFont(next);
  }, []);

  const handleSelect = (id: BodyFontId) => {
    setActiveFont(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore
    }
    applyBodyFont(id);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {FONT_OPTIONS.map((font) => {
        const isSelected = font.id === activeFont;
        return (
          <button
            key={font.id}
            type="button"
            onClick={() => handleSelect(font.id)}
            aria-pressed={isSelected}
            className={`relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
              isSelected
                ? "border-[#e84a27] bg-[#e84a27]/10"
                : "border-zinc-200 bg-white hover:border-[#e84a27]/40"
            }`}
          >
            <span
              className="text-sm font-bold text-zinc-900 leading-tight"
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </span>
            <span className="text-[10px] text-zinc-500 leading-tight">{font.sub}</span>
            {isSelected && (
              <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-[#e84a27]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
