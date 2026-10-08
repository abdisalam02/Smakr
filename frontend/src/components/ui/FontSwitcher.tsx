"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

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

const FONT_OPTIONS: FontOption[] = [
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

function applyFont(id: BodyFontId) {
  const opt = FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-body-font", id);
    document.documentElement.style.setProperty("--font-body", opt.family);
    document.documentElement.style.setProperty("--font-main", opt.family);
    if (document.body) {
      document.body.style.fontFamily = opt.family;
    }
  }
}

export function FontSwitcher() {
  const [activeFont, setActiveFont] = useState<BodyFontId>("jakarta");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("smakr_body_font") as BodyFontId | null;
      if (saved && FONT_OPTIONS.some((f) => f.id === saved)) {
        setActiveFont(saved);
        applyFont(saved);
      } else {
        applyFont("jakarta");
      }
    } catch {
      applyFont("jakarta");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: BodyFontId) => {
    setActiveFont(id);
    setIsOpen(false);
    try {
      localStorage.setItem("smakr_body_font", id);
    } catch {
      // Ignore
    }
    applyFont(id);
  };

  const currentOption = FONT_OPTIONS.find((f) => f.id === activeFont) || FONT_OPTIONS[0];

  return (
    <div ref={menuRef} className="fixed bottom-24 left-4 z-50 pointer-events-auto select-none">
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 max-h-80 overflow-y-auto no-scrollbar rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-2 border-b border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Pairing Font Roster
            </span>
          </div>
          <div className="space-y-0.5 mt-1">
            {FONT_OPTIONS.map((font) => {
              const isSelected = font.id === activeFont;
              return (
                <button
                  key={font.id}
                  onClick={() => handleSelect(font.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-[#e84a27] text-white"
                      : "hover:bg-zinc-100 dark:hover:bg-stone-800 text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p
                      className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : ""}`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </p>
                    <p
                      className={`text-[10px] leading-tight mt-0.5 ${
                        isSelected ? "text-white/80" : "text-zinc-400"
                      }`}
                    >
                      {font.sub}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        type="button"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-md hover:bg-white dark:hover:bg-stone-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all active:scale-95"
      >
        <span className="text-[11px] font-mono font-bold text-[#e84a27]">Aa</span>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Font</span>
        <span
          className="text-xs font-bold text-zinc-900 dark:text-zinc-100"
          style={{ fontFamily: currentOption.family }}
        >
          {currentOption.name.replace(" Sans", "").replace(" Grotesk", "").replace(" Garamond", "")}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
