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
    id: "oat-espresso",
    name: "Oat & Espresso",
    subtitle:
      "Warm oat canvas, espresso ink & burnt paprika — the signature day mode",
    accent: "#E84A27",
    bgPreview: "#F7F2E8",
    surfacePreview: "#FFFCF6",
    borderPreview: "#E4D9C8",
    tag: "Signature",
  },
  {
    id: "warm-bakery",
    name: "Warm Bakery",
    subtitle: "Golden morning light, cardamom & fresh pastry warmth",
    accent: "#E84A27",
    bgPreview: "#FBF4E6",
    surfacePreview: "#FFFBF2",
    borderPreview: "#E6D6B8",
    tag: "Morning",
  },
  {
    id: "late-night",
    name: "Late Night",
    subtitle: "Espresso ink dark mode with a lifted paprika glow",
    accent: "#FF5A38",
    bgPreview: "#17120F",
    surfacePreview: "#211A16",
    borderPreview: "#3A2F27",
    tag: "Dark Mode",
  },
  {
    id: "nordic-minimal",
    name: "Nordic Minimal",
    subtitle: "Clean gallery white, quiet structure & crisp paprika accent",
    accent: "#E84A27",
    bgPreview: "#FAFAF8",
    surfacePreview: "#FFFFFF",
    borderPreview: "#E3E3DE",
    tag: "Gallery",
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
    id: "comico",
    name: "Comico (Brand Display)",
    styleDesc: "Hand-drawn marker headings over crisp Inter body text",
    previewSample: "Smakr · Oslo Food Guide",
    tag: "Brand Voice",
  },
  {
    id: "modern-sans",
    name: "Inter / Modern Swiss",
    styleDesc: "Razor-sharp, technical, modern Oslo digital feel",
    previewSample: "Cà Phê · Bánh Mì · Tonkotsu",
    tag: "Crisp & Clean",
  },
  {
    id: "jakarta-sans",
    name: "Plus Jakarta Sans",
    styleDesc: "Humanist geometric sans with warm approachable rhythm",
    previewSample: "Artisanal Bakeries of Oslo",
    tag: "Modern Warm",
  },
  {
    id: "editorial-serif",
    name: "Playfair Display",
    styleDesc: "Michelin Guide & culinary magazine elegance",
    previewSample: "Grand Café & Wine Library",
    tag: "Editorial",
  },
  {
    id: "classic-garamond",
    name: "Cormorant Garamond",
    styleDesc: "Classical luxury French bistro & wine list serif",
    previewSample: "Degustation & Terroir Selection",
    tag: "Luxury Bistro",
  },
  {
    id: "street-grotesk",
    name: "Space Grotesk",
    styleDesc: "Bold Scandinavian modernist & architectural design",
    previewSample: "SMASH BURGERS & SOURDOUGH",
    tag: "Architectural",
  },
  {
    id: "rounded-modern",
    name: "Outfit",
    styleDesc: "Balanced contemporary Scandinavian sans",
    previewSample: "Discover Delicious Oslo Food",
    tag: "Contemporary",
  },
  {
    id: "fashion-syne",
    name: "Syne Display",
    styleDesc: "Avant-garde European high-fashion culinary branding",
    previewSample: "NEO-NORDIC EXPERIMENTAL",
    tag: "Avant-Garde",
  },
  {
    id: "clean-dm",
    name: "DM Sans",
    styleDesc: "Subtle, sleek, understated geometric elegance",
    previewSample: "Specialty Pour-Over & Pastry",
    tag: "Understated",
  },
];

interface LogoOption {
  id: LogoVariant;
  name: string;
  description: string;
  tag: string;
  category: "signature" | "architectural";
  bestWithComico?: boolean;
}

const LOGO_OPTIONS: LogoOption[] = [
  {
    id: "fluid",
    name: "Fluid Curve S",
    description: "Organic continuous curved stroke with soft endpoints",
    tag: "Signature",
    category: "signature",
    bestWithComico: true,
  },
  {
    id: "ribbon",
    name: "Infinity Ribbon S",
    description: "Flowing dynamic ribbon fold evoking steam ribbons",
    tag: "Artisanal",
    category: "signature",
    bestWithComico: true,
  },
  {
    id: "monoline",
    name: "Precision Monoline S",
    description: "Ultra-thin single-weight hand-drawn marker cut",
    tag: "Hand-Drawn",
    category: "signature",
  },
  {
    id: "stencil",
    name: "Modernist Stencil S",
    description: "Playful negative-space disconnected culinary cut",
    tag: "Retro Poster",
    category: "signature",
  },
  {
    id: "dual-blade",
    name: "Dual Blade S",
    description: "Two sleek parallel curved blades with dynamic sweep",
    tag: "Aerodynamic",
    category: "architectural",
  },
  {
    id: "geometric",
    name: "Architectural S",
    description: "Crisp Scandinavian geometry and structured balance",
    tag: "Modernist",
    category: "architectural",
  },
  {
    id: "block",
    name: "Editorial Block S",
    description: "Punchy architectural neo-grotesk cut with clean square terminal",
    tag: "Brutalist",
    category: "architectural",
  },
  {
    id: "serif",
    name: "Serif Monogram S",
    description: "High-fashion luxury Michelin editorial monogram with serif foot",
    tag: "Luxury Monogram",
    category: "architectural",
  },
];

const SIGNATURE_LOGOS = LOGO_OPTIONS.filter((l) => l.category === "signature");
const ARCHITECTURAL_LOGOS = LOGO_OPTIONS.filter(
  (l) => l.category === "architectural"
);

function LogoCard({
  logo,
  isSelected,
  onSelect,
}: {
  logo: LogoOption;
  isSelected: boolean;
  onSelect: (logo: LogoOption) => void;
}) {
  return (
    <button
      onClick={() => onSelect(logo)}
      className={`relative p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all ${
        isSelected
          ? "border-[#e84a27] bg-orange-50/40 ring-2 ring-[#e84a27]/20 shadow-xs"
          : "border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60"
      }`}
    >
      {logo.bestWithComico && (
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-[#e84a27] text-white text-[8px] font-bold uppercase tracking-wide shadow-xs">
          ✦ Best with Comico
        </span>
      )}

      {/* Visual Icon Preview — locked to brand paprika so it never shifts with theme */}
      <div className="p-2 flex items-center justify-center">
        <SmakrSIcon
          variant={logo.id}
          color="#e84a27"
          className="w-9 h-9 transition-transform hover:scale-110"
        />
      </div>

      <div>
        <div className="font-bold text-zinc-900 text-xs">{logo.name}</div>
        <span className="text-[10px] text-zinc-400 font-mono">{logo.tag}</span>
      </div>

      {isSelected && (
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#e84a27] text-white mx-auto">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      )}
    </button>
  );
}

const normalizeTheme = (theme: string): ColorTheme => {
  switch (theme) {
    case "oat-espresso":
    case "oslo-minimalist":
    case "electric-orange":
      return "oat-espresso";
    case "warm-bakery":
    case "nordic-linen":
    case "nordic-bakery":
    case "nordic-amber":
    case "copenhagen-clay":
    case "alabaster-bronze":
    case "retro-diner":
    case "bordeaux-chalk":
    case "seoul-sunset":
      return "warm-bakery";
    case "late-night":
    case "smoked-espresso":
    case "obsidian-slate":
    case "cyber-midnight":
    case "midnight-gastro":
      return "late-night";
    case "nordic-minimal":
    case "swiss-monolith":
    case "oslo-brutalist":
    case "oslo-monolith":
    case "stockholm-sage":
    case "kyoto-matcha":
    case "matcha-botanic":
    case "bistro-navy":
    case "amalfi-coast":
      return "nordic-minimal";
    default:
      return theme as ColorTheme;
  }
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
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-orange-50 text-[#e84a27] border border-orange-200/50 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Smakr Style &amp; Theme Studio</span>
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
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-full hover:bg-zinc-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 overflow-y-auto overflow-x-hidden space-y-7 no-scrollbar text-xs">
          {/* Section 1: Color Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                <Palette className="w-4 h-4 text-[#e84a27]" />
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
                        ? "border-[#e84a27] bg-orange-50/40 ring-2 ring-[#e84a27]/20 shadow-xs"
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
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#e84a27] text-white">
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
                <Type className="w-4 h-4 text-[#e84a27]" />
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
                      font.id === "comico" ? "sm:col-span-2 " : ""
                    }${
                      isSelected
                        ? "border-[#e84a27] bg-orange-50/40 ring-2 ring-[#e84a27]/20 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-zinc-900 text-xs truncate">
                        {font.name}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#e84a27] text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {font.tag}
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-800">
                      <div
                        className={`font-semibold tracking-tight truncate ${
                          font.id === "comico"
                            ? "font-comico text-lg"
                            : "text-xs"
                        }`}
                      >
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
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                <Compass className="w-4 h-4 text-[#e84a27]" />
                <span>3. Freestanding 'S' Logo Variants</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {LOGO_OPTIONS.find((l) => l.id === activeLogoVariant)?.name}
              </span>
            </div>

            {/* Signature variants — matched to Comico's hand-drawn voice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e84a27]">
                  Signature — Comico Match
                </span>
                <span className="flex-1 h-px bg-zinc-100" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5">
                {SIGNATURE_LOGOS.map((logo) => (
                  <LogoCard
                    key={logo.id}
                    logo={logo}
                    isSelected={activeLogoVariant === logo.id}
                    onSelect={(selected) => {
                      setActiveLogoVariant(selected.id);
                      showToast(`Applied "${selected.name}" logo`);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Architectural variants — secondary / legacy shapes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Architectural — Secondary
                </span>
                <span className="flex-1 h-px bg-zinc-100" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 opacity-80">
                {ARCHITECTURAL_LOGOS.map((logo) => (
                  <LogoCard
                    key={logo.id}
                    logo={logo}
                    isSelected={activeLogoVariant === logo.id}
                    onSelect={(selected) => {
                      setActiveLogoVariant(selected.id);
                      showToast(`Applied "${selected.name}" logo`);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/60 flex flex-wrap items-center justify-between gap-2">
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
        <Palette className="w-3.5 h-3.5 text-[#e84a27] group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#e84a27] animate-pulse" />
      </div>
      <span>Style Studio</span>
    </button>
  );
}
