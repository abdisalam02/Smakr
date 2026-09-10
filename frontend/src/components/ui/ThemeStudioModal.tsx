"use client";

import React, { useEffect } from "react";
import { X, Sparkles, Check, Palette, Type, Compass, Sliders } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { ColorTheme, TypographyStyle, LogoVariant } from "@/types";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  subtitle: string;
  accent: string;
  bgPreview: string;
  surfacePreview: string;
  borderPreview: string;
  tag: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "electric-orange",
    name: "Electric Orange",
    subtitle: "Modern high-contrast neon vibe with clean porcelain surfaces",
    accent: "#ff5500",
    bgPreview: "#f8f8fa",
    surfacePreview: "#ffffff",
    borderPreview: "#e2e2e8",
    tag: "Signature",
  },
  {
    id: "cyber-midnight",
    name: "Cyber Midnight",
    subtitle: "Deep OLED dark mode with radiant tangerine glow",
    accent: "#ff6b00",
    bgPreview: "#090b10",
    surfacePreview: "#111622",
    borderPreview: "#232f45",
    tag: "Dark Mode",
  },
  {
    id: "nordic-bakery",
    name: "Nordic Bakery & Café",
    subtitle: "Warm cardamom, dark roast espresso & craft linen",
    accent: "#c25227",
    bgPreview: "#f5eee3",
    surfacePreview: "#fdfbf7",
    borderPreview: "#decbb4",
    tag: "Warm Artisan",
  },
  {
    id: "kyoto-matcha",
    name: "Kyoto Matcha & Botanic",
    subtitle: "Organic ceremonial matcha, bamboo mist & washi paper",
    accent: "#15803d",
    bgPreview: "#ebf3ed",
    surfacePreview: "#f6faf7",
    borderPreview: "#c5d9c9",
    tag: "Organic Zen",
  },
  {
    id: "amalfi-coast",
    name: "Amalfi Coast Sea Azure",
    subtitle: "Mediterranean Capri blue waves & crisp sea breeze",
    accent: "#0284c7",
    bgPreview: "#eef6fc",
    surfacePreview: "#ffffff",
    borderPreview: "#bcd7f2",
    tag: "Coastal Riviera",
  },
  {
    id: "seoul-sunset",
    name: "Seoul Sunset K-Bistro",
    subtitle: "Vibrant hot rose magenta, strawberry cream & plum",
    accent: "#f43f5e",
    bgPreview: "#fef0f2",
    surfacePreview: "#ffffff",
    borderPreview: "#fbc7d2",
    tag: "Vibrant Punch",
  },
  {
    id: "oslo-brutalist",
    name: "Oslo Brutalist Monolith",
    subtitle: "Architectural raw concrete, ink grid & safety orange",
    accent: "#ff3700",
    bgPreview: "#e5e7eb",
    surfacePreview: "#ffffff",
    borderPreview: "#111827",
    tag: "High-Fashion",
  },
  {
    id: "retro-diner",
    name: "Retro Synth Diner",
    subtitle: "Arcade midnight violet & electric synthwave fuchsia",
    accent: "#d946ef",
    bgPreview: "#0e0b1a",
    surfacePreview: "#18132c",
    borderPreview: "#3a2d66",
    tag: "Cyber Glow",
  },
];

interface FontOption {
  id: TypographyStyle;
  name: string;
  styleDesc: string;
  previewSample: string;
  tag: string;
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: "modern-sans",
    name: "Modern Sans (Inter / Geist)",
    styleDesc: "Razor-sharp, technical, modern Oslo startup feel",
    previewSample: "Cà Phê · Bánh Mì · Tonkotsu",
    tag: "Crisp & Clean",
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif Accent",
    styleDesc: "Michelin Guide & culinary magazine elegance",
    previewSample: "Artisanal Bakeries of Oslo",
    tag: "High-End",
  },
  {
    id: "street-grotesk",
    name: "Street Grotesk",
    subtitleDesc: "Bold European street food & café typography",
    previewSample: "SMASH BURGERS & CARDAMOM",
    tag: "Trendy & Bold",
  } as any,
  {
    id: "rounded-modern",
    name: "Soft Rounded Modern",
    styleDesc: "Warm, friendly, approachable culinary community",
    previewSample: "Discover Delicious Oslo B換え",
    tag: "Cozy & Welcoming",
  },
];

interface LogoOption {
  id: LogoVariant;
  name: string;
  description: string;
  tag: string;
}

const LOGO_OPTIONS: LogoOption[] = [
  {
    id: "fluid",
    name: "Fluid Curve S",
    description: "Organic continuous curved stroke with soft endpoints",
    tag: "Signature",
  },
  {
    id: "geometric",
    name: "Architectural S",
    description: "Crisp Scandinavian geometry and structured balance",
    tag: "Modernist",
  },
  {
    id: "ribbon",
    name: "Infinity Ribbon S",
    description: "Flowing dynamic ribbon fold evoking steam & taste ribbons",
    tag: "Artisanal",
  },
  {
    id: "block",
    name: "Editorial Block S",
    description: "Punchy architectural neo-grotesk cut with clean square terminal",
    tag: "Brutalist",
  },
];

const normalizeTheme = (theme: string): ColorTheme => {
  if (theme === "nordic-amber") return "nordic-bakery";
  if (theme === "midnight-gastro") return "cyber-midnight";
  if (theme === "matcha-botanic") return "kyoto-matcha";
  if (theme === "oslo-monolith") return "oslo-brutalist";
  return theme as ColorTheme;
};

export function ThemeStudioModal() {
  const isThemeStudioOpen = useCityPulseStore((state) => state.isThemeStudioOpen);
  const setIsThemeStudioOpen = useCityPulseStore((state) => state.setIsThemeStudioOpen);
  const activeTheme = useCityPulseStore((state) => state.activeTheme);
  const setActiveTheme = useCityPulseStore((state) => state.setActiveTheme);
  const activeFont = useCityPulseStore((state) => state.activeFont);
  const setActiveFont = useCityPulseStore((state) => state.setActiveFont);
  const activeLogoVariant = useCityPulseStore((state) => state.activeLogoVariant);
  const setActiveLogoVariant = useCityPulseStore((state) => state.setActiveLogoVariant);
  const showToast = useCityPulseStore((state) => state.showToast);

  const normalizedCurrentTheme = normalizeTheme(activeTheme);

  // Restore saved choices from localStorage on initial client mount
  useEffect(() => {
    try {
      const rawTheme = localStorage.getItem("smakr_theme");
      if (rawTheme) {
        const savedTheme = normalizeTheme(rawTheme);
        if (THEME_OPTIONS.some((t) => t.id === savedTheme)) {
          setActiveTheme(savedTheme);
        }
      }
      const savedFont = localStorage.getItem("smakr_font") as TypographyStyle;
      if (savedFont && FONT_OPTIONS.some((f) => f.id === savedFont)) {
        setActiveFont(savedFont);
      }
      const savedLogo = localStorage.getItem("smakr_logo") as LogoVariant;
      if (savedLogo && LOGO_OPTIONS.some((l) => l.id === savedLogo)) {
        setActiveLogoVariant(savedLogo);
      }
    } catch {}
  }, [setActiveTheme, setActiveFont, setActiveLogoVariant]);

  if (!isThemeStudioOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-[#ff5500] border border-orange-200/50">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>Smakr Style & Theme Studio</span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  Live Preview
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Switch color themes, typography pairings, and logo shapes in real-time
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsThemeStudioOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="p-6 overflow-y-auto space-y-7 no-scrollbar text-xs">
          {/* Section 1: Color Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                <Palette className="w-4 h-4 text-[#ff5500]" />
                <span>1. Color Palette</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {THEME_OPTIONS.find((t) => t.id === normalizedCurrentTheme)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = normalizedCurrentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setActiveTheme(theme.id);
                      showToast(`Applied "${theme.name}" theme`);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                      isSelected
                        ? "border-[#ff5500] bg-orange-50/40 ring-2 ring-[#ff5500]/20 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span className="font-bold text-zinc-900 text-xs truncate">
                          {theme.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-snug">
                        {theme.subtitle}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 p-1 rounded-md bg-zinc-100/80 border border-zinc-200/60">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.surfacePreview }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.bgPreview }}
                        />
                      </div>
                      {isSelected && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#ff5500] text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Typography Styles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                <Type className="w-4 h-4 text-[#ff5500]" />
                <span>2. Typography & Font Style</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {FONT_OPTIONS.find((f) => f.id === activeFont)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FONT_OPTIONS.map((font) => {
                const isSelected = activeFont === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => {
                      setActiveFont(font.id);
                      showToast(`Applied "${font.name}" typography`);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all ${
                      isSelected
                        ? "border-[#ff5500] bg-orange-50/40 ring-2 ring-[#ff5500]/20 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-zinc-900 text-xs truncate">
                        {font.name}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#ff5500] text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {font.tag}
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-800">
                      <div className="font-semibold text-xs tracking-tight truncate">
                        {font.previewSample}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-tight">
                      {font.styleDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Minimalist Logo S Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                <Compass className="w-4 h-4 text-[#ff5500]" />
                <span>3. Freestanding 'S' Logo Variants</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {LOGO_OPTIONS.find((l) => l.id === activeLogoVariant)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LOGO_OPTIONS.map((logo) => {
                const isSelected = activeLogoVariant === logo.id;
                return (
                  <button
                    key={logo.id}
                    onClick={() => {
                      setActiveLogoVariant(logo.id);
                      showToast(`Applied "${logo.name}" logo`);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? "border-[#ff5500] bg-orange-50/40 ring-2 ring-[#ff5500]/20 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60"
                    }`}
                  >
                    {/* Visual Icon Preview */}
                    <div className="p-2 flex items-center justify-center">
                      <SmakrSIcon
                        variant={logo.id}
                        className="w-9 h-9 text-[#ff5500] transition-transform hover:scale-110"
                      />
                    </div>

                    <div>
                      <div className="font-bold text-zinc-900 text-xs">
                        {logo.name}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {logo.tag}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#ff5500] text-white mx-auto">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">
            Changes apply instantly across headers, feeds, cards, and markers.
          </p>
          <button
            onClick={() => setIsThemeStudioOpen(false)}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating Studio Trigger Button (Pill in bottom-left)
 */
export function ThemeStudioTrigger() {
  const setIsThemeStudioOpen = useCityPulseStore((state) => state.setIsThemeStudioOpen);
  const activeTheme = useCityPulseStore((state) => state.activeTheme);

  return (
    <button
      onClick={() => setIsThemeStudioOpen(true)}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-zinc-800 hover:text-zinc-950 font-bold text-xs shadow-xl border border-zinc-200/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
      title="Customize Theme, Fonts & Logo"
    >
      <div className="relative">
        <Palette className="w-3.5 h-3.5 text-[#ff5500] group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#ff5500] animate-pulse" />
      </div>
      <span>Style Studio</span>
    </button>
  );
}
