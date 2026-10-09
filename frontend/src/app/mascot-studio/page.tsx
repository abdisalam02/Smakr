"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  MapPin,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { persistMascotConfig } from "@/lib/supabase/data";
import {
  MascotCharacter,
  buildMascotSVGString,
  MASCOT_VIEWBOX_WIDTH,
  MASCOT_VIEWBOX_HEIGHT,
} from "@/components/avatar/MascotCharacter";
import {
  ACCESSORY_COLOR_SWATCHES,
  BOTTOM_COLOR_SWATCHES,
  DEFAULT_MASCOT_CONFIG,
  HAIR_COLOR_SWATCHES,
  HAT_ACCENT_SWATCHES,
  MASCOT_ANIMATION_OPTIONS,
  MASCOT_ENGINE_OPTIONS,
  MASCOT_PRESETS,
  MASCOT_PROP_OPTIONS,
  MICAH_EARS_OPTIONS,
  MICAH_EYEBROW_OPTIONS,
  MICAH_EYES_OPTIONS,
  MICAH_GLASSES_OPTIONS,
  MICAH_HAIR_OPTIONS,
  MICAH_MOUTH_OPTIONS,
  MICAH_SHIRT_OPTIONS,
  MascotConfig,
  MascotEngine,
  MascotOption,
  PEEPS_ACCESSORY_OPTIONS,
  PEEPS_FACE_OPTIONS,
  PEEPS_FACIAL_HAIR_OPTIONS,
  PEEPS_HEAD_OPTIONS,
  SKIN_TONE_SWATCHES,
  TOP_COLOR_SWATCHES,
} from "@/types/mascot";

/* ------------------------------------------------------------------ */
/* Stage backgrounds                                                   */
/* ------------------------------------------------------------------ */

type StageBg = "oat" | "espresso" | "gallery" | "map";

const STAGE_BACKGROUNDS: { id: StageBg; label: string; swatch: string }[] = [
  { id: "oat", label: "Warm Oat", swatch: "#F7F2E8" },
  { id: "espresso", label: "Espresso Ink", swatch: "#17120F" },
  { id: "gallery", label: "Clean Gallery", swatch: "#FAFAF8" },
  { id: "map", label: "Map Tile", swatch: "#DCE7EF" },
];

const mapGridStyle: React.CSSProperties = {
  backgroundColor: "#DCE7EF",
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(rgba(140,175,200,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(140,175,200,0.5) 1px, transparent 1px)",
  backgroundSize: "26px 26px, 26px 26px, 104px 104px, 104px 104px",
};

/* ------------------------------------------------------------------ */
/* PNG export — 1080×1080 transparent                                  */
/* ------------------------------------------------------------------ */

async function exportMascotPNG(config: MascotConfig, size = 1080): Promise<void> {
  const height = Math.round((size * MASCOT_VIEWBOX_HEIGHT) / MASCOT_VIEWBOX_WIDTH);
  const svg = buildMascotSVGString(config, false, size, height);
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

  const img = new Image();
  img.decoding = "sync";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load mascot SVG"));
    img.src = dataUrl;
  });
  if (typeof img.decode === "function") {
    try {
      await img.decode();
    } catch {
      // Non-fatal — Safari may reject decode() for SVG data URIs.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, Math.round((size - height) / 2), size, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG export failed");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smakr-mascot.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{title}</h3>
        {hint && <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[55%]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PillCard({
  option,
  selected,
  onSelect,
}: {
  option: MascotOption;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
        selected
          ? "border-[#e84a27] bg-orange-50/50 ring-2 ring-[#e84a27]/15"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      <span className="text-base leading-none shrink-0" aria-hidden>
        {option.emoji}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold text-zinc-900 truncate">{option.label}</span>
        {option.hint && <span className="block text-[10px] text-zinc-400 truncate">{option.hint}</span>}
      </span>
      {selected && <Check className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />}
    </button>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  cols = "grid-cols-2 sm:grid-cols-3",
}: {
  options: MascotOption[];
  value: string;
  onSelect: (id: string) => void;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-2.5`}>
      {options.map((option) => (
        <PillCard key={option.id} option={option} selected={value === option.id} onSelect={onSelect} />
      ))}
    </div>
  );
}

function SwatchRow({
  swatches,
  value,
  onSelect,
}: {
  swatches: { id: string; label: string }[];
  value: string;
  onSelect: (hex: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {swatches.map((swatch) => {
        const selected = value.toLowerCase() === swatch.id.toLowerCase();
        return (
          <button
            key={swatch.id}
            onClick={() => onSelect(swatch.id)}
            className="flex flex-col items-center gap-1.5 w-[62px]"
            title={swatch.label}
          >
            <span
              className="w-10 h-10 rounded-full border-2 transition-all"
              style={{
                backgroundColor: `#${swatch.id}`,
                borderColor: selected ? "#e84a27" : "rgba(0,0,0,0.12)",
                boxShadow: selected ? "0 0 0 3px rgba(232,74,39,0.2)" : "none",
              }}
            />
            <span
              className={`text-[10px] font-semibold text-center leading-tight ${
                selected ? "text-[#e84a27]" : "text-zinc-500"
              }`}
            >
              {swatch.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

type TabId = "anatomy" | "wardrobe" | "colors" | "map";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "anatomy", label: "Anatomy & Features", emoji: "🧑" },
  { id: "wardrobe", label: "Wardrobe & Prop", emoji: "🧣" },
  { id: "colors", label: "Colors", emoji: "🎨" },
  { id: "map", label: "Map & Motion", emoji: "✨" },
];

function randomOf<T extends { id: string }>(arr: T[]): string {
  return arr[Math.floor(Math.random() * arr.length)].id;
}

export default function MascotStudioPage() {
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);
  const updateMascotConfig = useCityPulseStore((state) => state.updateMascotConfig);
  const resetMascotConfig = useCityPulseStore((state) => state.resetMascotConfig);
  const showToast = useCityPulseStore((state) => state.showToast);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setCurrentUser = useCityPulseStore((state) => state.setCurrentUser);

  const [stage, setStage] = useState<StageBg>("oat");
  const [tab, setTab] = useState<TabId>("anatomy");
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const config = mascotConfig;
  const update = (updates: Partial<MascotConfig>) => updateMascotConfig(updates);

  const isPeeps = config.engine === "open-peeps";

  const handleSave = async () => {
    updateMascotConfig(config);
    if (currentUser?.id) {
      await persistMascotConfig(currentUser.id, config);
      setCurrentUser({
        ...currentUser,
        avatar_url: undefined,
        mascot_config: config,
      });
    }
    showToast("Mascot saved to the map! 🗺️");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMascotPNG(config, 1080);
      showToast("Exported smakr-mascot.png (1080×1080) — ready for Instagram ✨");
    } catch {
      showToast("Sorry, the PNG export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    resetMascotConfig();
    if (currentUser?.id) {
      await persistMascotConfig(currentUser.id, DEFAULT_MASCOT_CONFIG);
      setCurrentUser({
        ...currentUser,
        avatar_url: undefined,
        mascot_config: DEFAULT_MASCOT_CONFIG,
      });
    }
    showToast("Character reset to the Smakr default.");
  };

  const handleShuffle = () => {
    const engine: MascotEngine = Math.random() > 0.5 ? "micah" : "open-peeps";
    update({
      engine,
      peepsHead: randomOf(PEEPS_HEAD_OPTIONS),
      peepsFace: randomOf(PEEPS_FACE_OPTIONS),
      peepsFacialHair: randomOf(PEEPS_FACIAL_HAIR_OPTIONS),
      peepsAccessories: randomOf(PEEPS_ACCESSORY_OPTIONS),
      micahHair: randomOf(MICAH_HAIR_OPTIONS),
      micahEyes: randomOf(MICAH_EYES_OPTIONS),
      micahEyebrows: randomOf(MICAH_EYEBROW_OPTIONS),
      micahMouth: randomOf(MICAH_MOUTH_OPTIONS),
      micahEars: randomOf(MICAH_EARS_OPTIONS),
      micahGlasses: randomOf(MICAH_GLASSES_OPTIONS),
      micahShirt: randomOf(MICAH_SHIRT_OPTIONS),
      skinColor: randomOf(SKIN_TONE_SWATCHES),
      hairColor: randomOf(HAIR_COLOR_SWATCHES),
      hatColor: randomOf(HAT_ACCENT_SWATCHES),
      topColor: randomOf(TOP_COLOR_SWATCHES),
      bottomColor: randomOf(BOTTOM_COLOR_SWATCHES),
      accessoryColor: randomOf(ACCESSORY_COLOR_SWATCHES),
      prop: randomOf(MASCOT_PROP_OPTIONS) as MascotConfig["prop"],
      animation: randomOf(MASCOT_ANIMATION_OPTIONS) as MascotConfig["animation"],
    });
    showToast("Shuffled a fresh look 🎲");
  };

  const applyPreset = (presetId: string) => {
    const preset = MASCOT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    update({ ...preset.config });
    showToast(`Applied "${preset.label}" ✨`);
  };

  const stageBackgroundStyle: React.CSSProperties =
    stage === "map"
      ? mapGridStyle
      : {
          backgroundColor:
            stage === "espresso" ? "#17120F" : stage === "gallery" ? "#FAFAF8" : "#F7F2E8",
        };

  const SaveExportButtons = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            <span>Saved to Map</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Save Mascot to Map</span>
          </>
        )}
      </button>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
      >
        <Download className="w-4 h-4" />
        <span>{exporting ? "Exporting…" : "Export PNG for Instagram"}</span>
      </button>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[var(--background)]">
      <div className="pt-[70px] pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* ============ Top bar ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#e84a27] border border-zinc-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Food Radar</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] text-white border border-[#e84a27] shadow-xs text-xs font-semibold transition-all active:scale-95"
              title="Randomize a look"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 border border-zinc-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* ============ Title ============ */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#e84a27] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DiceBear dual-engine pipeline</span>
          </div>
          <h1 className="font-comico text-3xl sm:text-4xl text-zinc-900 leading-tight">
            Smakr <span className="text-[#e84a27]">Mascot</span> Studio
          </h1>
        </div>

        {/* ============ Style universe switcher ============ */}
        <div className="mb-5 p-1 rounded-2xl bg-zinc-100 border border-zinc-200 grid grid-cols-2 gap-1">
          {MASCOT_ENGINE_OPTIONS.map((engine) => {
            const active = config.engine === engine.id;
            return (
              <button
                key={engine.id}
                onClick={() => update({ engine: engine.id })}
                aria-pressed={active}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  active ? "bg-white shadow-xs ring-1 ring-zinc-200" : "hover:bg-white/60"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {engine.emoji}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs font-bold truncate ${
                      active ? "text-zinc-900" : "text-zinc-600"
                    }`}
                  >
                    {engine.label}{" "}
                    <span className="font-mono text-[10px] text-zinc-400">({engine.short})</span>
                  </span>
                  <span className="block text-[10px] text-zinc-400 truncate">{engine.tagline}</span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-[#e84a27] ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ================= LEFT: Stage ================= */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Live Preview</h2>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {config.engine} · {config.prop}
                </span>
              </div>

              <div
                className="relative rounded-2xl border border-zinc-200/80 overflow-hidden flex items-center justify-center h-[380px] sm:h-[440px] transition-colors duration-300"
                style={stageBackgroundStyle}
              >
                <MascotCharacter config={config} size={300} animated />
                {stage === "map" && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 shadow-xs text-[10px] font-semibold text-zinc-600">
                    <MapPin className="w-3 h-3 text-[#e84a27]" />
                    <span>You are here</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pr-1 shrink-0">
                  Backdrop
                </span>
                {STAGE_BACKGROUNDS.map((bg) => {
                  const active = stage === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => setStage(bg.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all select-none border ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white font-semibold"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 font-medium"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: bg.swatch }}
                      />
                      <span>{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Quick looks
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {MASCOT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-zinc-200 bg-white hover:border-[#e84a27]/50 hover:bg-orange-50/40 shadow-xs transition-all active:scale-[0.98] text-left"
                  >
                    <span className="w-12 h-14 flex items-center justify-center shrink-0">
                      <MascotCharacter
                        config={{ ...DEFAULT_MASCOT_CONFIG, ...preset.config }}
                        size={44}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold text-zinc-900 leading-tight">
                        {preset.emoji} {preset.label}
                      </span>
                      <span className="block text-[10px] text-zinc-400 mt-0.5 truncate">
                        {preset.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {SaveExportButtons}
            <p className="text-[11px] text-zinc-400 text-center">
              Export produces a 1080×1080 transparent PNG — perfect for Instagram posts, stories &
              stickers.
            </p>
          </div>

          {/* ================= RIGHT: Tabbed controls ================= */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 self-start">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-x-auto no-scrollbar">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 shrink-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      active ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    <span aria-hidden>{t.emoji}</span>
                    <span className="hidden xl:inline whitespace-nowrap">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ---------- ANATOMY & FEATURES ---------- */}
            {tab === "anatomy" && (
              <div className="space-y-5">
                {isPeeps ? (
                  <>
                    <Group title="Head / Hair" hint={config.peepsHead}>
                      <OptionGrid
                        options={PEEPS_HEAD_OPTIONS}
                        value={config.peepsHead}
                        onSelect={(id) => update({ peepsHead: id })}
                      />
                    </Group>
                    <Group title="Expression / Face" hint={config.peepsFace}>
                      <OptionGrid
                        options={PEEPS_FACE_OPTIONS}
                        value={config.peepsFace}
                        onSelect={(id) => update({ peepsFace: id })}
                      />
                    </Group>
                    <Group title="Facial Hair" hint={config.peepsFacialHair}>
                      <OptionGrid
                        options={PEEPS_FACIAL_HAIR_OPTIONS}
                        value={config.peepsFacialHair}
                        onSelect={(id) => update({ peepsFacialHair: id })}
                      />
                    </Group>
                    <Group title="Glasses" hint={config.peepsAccessories}>
                      <OptionGrid
                        options={PEEPS_ACCESSORY_OPTIONS}
                        value={config.peepsAccessories}
                        onSelect={(id) => update({ peepsAccessories: id })}
                      />
                    </Group>
                  </>
                ) : (
                  <>
                    <Group title="Hair" hint={config.micahHair}>
                      <OptionGrid
                        options={MICAH_HAIR_OPTIONS}
                        value={config.micahHair}
                        onSelect={(id) => update({ micahHair: id })}
                      />
                    </Group>
                    <Group title="Eyes" hint={config.micahEyes}>
                      <OptionGrid
                        options={MICAH_EYES_OPTIONS}
                        value={config.micahEyes}
                        onSelect={(id) => update({ micahEyes: id })}
                      />
                    </Group>
                    <Group title="Eyebrows" hint={config.micahEyebrows}>
                      <OptionGrid
                        options={MICAH_EYEBROW_OPTIONS}
                        value={config.micahEyebrows}
                        onSelect={(id) => update({ micahEyebrows: id })}
                      />
                    </Group>
                    <Group title="Mouth" hint={config.micahMouth}>
                      <OptionGrid
                        options={MICAH_MOUTH_OPTIONS}
                        value={config.micahMouth}
                        onSelect={(id) => update({ micahMouth: id })}
                      />
                    </Group>
                    <Group title="Ears" hint={config.micahEars}>
                      <OptionGrid
                        options={MICAH_EARS_OPTIONS}
                        value={config.micahEars}
                        onSelect={(id) => update({ micahEars: id })}
                      />
                    </Group>
                    <Group title="Glasses" hint={config.micahGlasses}>
                      <OptionGrid
                        options={MICAH_GLASSES_OPTIONS}
                        value={config.micahGlasses}
                        onSelect={(id) => update({ micahGlasses: id })}
                      />
                    </Group>
                  </>
                )}
              </div>
            )}

            {/* ---------- WARDROBE & FOOD PROP ---------- */}
            {tab === "wardrobe" && (
              <div className="space-y-5">
                {!isPeeps && (
                  <>
                    <Group title="Clothing Top Style" hint={config.micahShirt}>
                      <OptionGrid
                        options={MICAH_SHIRT_OPTIONS}
                        value={config.micahShirt}
                        onSelect={(id) => update({ micahShirt: id })}
                      />
                    </Group>
                    <div className="h-px bg-zinc-100" />
                  </>
                )}

                {isPeeps && (
                  <>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        <span className="font-semibold text-zinc-700">Open Peeps</span> renders the
                        bust (head + torso) as a single hand-inked unit — the garment is coloured by
                        the <span className="font-semibold text-zinc-700">Clothing Top</span> swatch
                        in the Colors tab.
                      </p>
                    </div>
                    <div className="h-px bg-zinc-100" />
                  </>
                )}

                <Group title="Food Prop" hint={config.prop}>
                  <OptionGrid
                    options={MASCOT_PROP_OPTIONS}
                    value={config.prop}
                    onSelect={(id) => update({ prop: id as MascotConfig["prop"] })}
                  />
                </Group>
              </div>
            )}

            {/* ---------- INDEPENDENT COLORS ---------- */}
            {tab === "colors" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Every channel is fully independent — changing one never recolours another.
                    Skin, hair, clothing and accessory map to native engine slots;{" "}
                    <span className="font-semibold text-zinc-700">hat</span> and{" "}
                    <span className="font-semibold text-zinc-700">bottoms</span> drive the radar
                    beacon &amp; food-prop overlay.
                  </p>
                </div>

                <Group title="Skin Tone" hint={config.skinColor}>
                  <SwatchRow
                    swatches={SKIN_TONE_SWATCHES}
                    value={config.skinColor}
                    onSelect={(hex) => update({ skinColor: hex })}
                  />
                </Group>

                <div className="h-px bg-zinc-100" />

                <Group title="Hair Color" hint={config.hairColor}>
                  <SwatchRow
                    swatches={HAIR_COLOR_SWATCHES}
                    value={config.hairColor}
                    onSelect={(hex) => update({ hairColor: hex })}
                  />
                </Group>

                <div className="h-px bg-zinc-100" />

                <Group title="Hat / Beacon Color" hint={config.hatColor}>
                  <SwatchRow
                    swatches={HAT_ACCENT_SWATCHES}
                    value={config.hatColor}
                    onSelect={(hex) => update({ hatColor: hex })}
                  />
                </Group>

                <div className="h-px bg-zinc-100" />

                <Group title="Clothing Top Color" hint={config.topColor}>
                  <SwatchRow
                    swatches={TOP_COLOR_SWATCHES}
                    value={config.topColor}
                    onSelect={(hex) => update({ topColor: hex })}
                  />
                </Group>

                <div className="h-px bg-zinc-100" />

                <Group title="Bottoms / Prop Base Color" hint={config.bottomColor}>
                  <SwatchRow
                    swatches={BOTTOM_COLOR_SWATCHES}
                    value={config.bottomColor}
                    onSelect={(hex) => update({ bottomColor: hex })}
                  />
                </Group>

                <div className="h-px bg-zinc-100" />

                <Group title="Accessory / Glasses Color" hint={config.accessoryColor}>
                  <SwatchRow
                    swatches={ACCESSORY_COLOR_SWATCHES}
                    value={config.accessoryColor}
                    onSelect={(hex) => update({ accessoryColor: hex })}
                  />
                </Group>
              </div>
            )}

            {/* ---------- MAP & MOTION ---------- */}
            {tab === "map" && (
              <div className="space-y-5">
                <Group title="Map Radar Beacon" hint={config.showBeacon ? "on" : "off"}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500 max-w-[75%]">
                      Pulses a radar ring under the character at your GPS location on the map.
                    </p>
                    <button
                      onClick={() => update({ showBeacon: !config.showBeacon })}
                      role="switch"
                      aria-checked={config.showBeacon}
                      aria-label="Toggle map radar beacon"
                      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                        config.showBeacon ? "" : "bg-zinc-300"
                      }`}
                      style={
                        config.showBeacon
                          ? { backgroundColor: "var(--success, #3D5A45)" }
                          : undefined
                      }
                    >
                      <span
                        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                          config.showBeacon ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </Group>

                <Group title="Idle Motion" hint={config.animation}>
                  <div className="grid grid-cols-3 gap-2.5">
                    {MASCOT_ANIMATION_OPTIONS.map((option) => {
                      const active = config.animation === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => update({ animation: option.id })}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
                            active
                              ? "border-[#e84a27] bg-orange-50/50 ring-2 ring-[#e84a27]/15"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className="text-lg leading-none" aria-hidden>
                            {option.emoji}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${
                              active ? "text-[#e84a27]" : "text-zinc-600"
                            }`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Group>

                <div className="pt-1 border-t border-zinc-100 space-y-3">{SaveExportButtons}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
