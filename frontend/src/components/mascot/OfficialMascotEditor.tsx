"use client";

import React, { useRef, useState } from "react";
import { Check, Copy, Download, Layers, Move, RefreshCw, RotateCcw, Sparkles, UploadCloud } from "lucide-react";
import {
  SmakrMascotRig,
  type MascotJacketStyle,
  type MascotLayerTransform,
} from "@/components/studio/SmakrMascotRig";
import { OFFICIAL_SMAKR_MASCOT_CONFIG } from "@/lib/officialSmakrMascot";
import {
  SAVED_MASCOT_VARIATIONS,
  type SavedMascotVariation,
} from "@/lib/mascotVariations";

interface OfficialMascotEditorProps {
  showToast: (msg: string) => void;
}

type OutfitPresetId = "navy-sherpa" | "sherpa-pockets" | "paprika-dots" | "custom";
type EditableLayerId = "sherpa" | "details";
type StageBgId = "oat" | "map" | "espresso" | "gallery";

const DEFAULT_LAYER_TRANSFORM: MascotLayerTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotate: 0,
};

const JACKET_SWATCHES = ["#1E2738", "#E84A27", "#232F3E", "#27272A", "#3D5A45", "#5C3D2E"];
const SHERPA_SWATCHES = ["#C8B79E", "#E5DEC9", "#A89378", "#FAF7F2", "#7C6D5D"];
const TEE_SWATCHES = ["#FAF7F2", "#27272A", "#E5DEC9", "#D4A373", "#1E2738"];
const GLASSES_SWATCHES = ["#181615", "#4A3728", "#E84A27", "#1E2738"];

function buildCleanSvgMarkup(svgEl: SVGSVGElement): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = clone.getAttribute("viewBox") || "130 130 1050 1250";
  const parts = vb.trim().split(/\s+/).map(Number);
  const w = parts[2] || 1050;
  const h = parts[3] || 1250;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  return new XMLSerializer().serializeToString(clone);
}

async function downloadSvgAsPng(svgMarkup: string, filename: string): Promise<void> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
  const vb = (doc.documentElement.getAttribute("viewBox") || "130 130 1050 1250")
    .trim()
    .split(/\s+/)
    .map(Number);
  const vbW = vb[2] || 1050;
  const vbH = vb[3] || 1250;

  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const padding = 36;
    const maxDim = 1080 - padding * 2;
    const scale = Math.min(maxDim / vbW, maxDim / vbH);
    const drawW = Math.round(vbW * scale);
    const drawH = Math.round(vbH * scale);
    const drawX = Math.round((1080 - drawW) / 2);
    const drawY = Math.round((1080 - drawH) / 2);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG blob failed"))), "image/png");
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function OfficialMascotEditor({ showToast }: OfficialMascotEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseOffsetX: number;
    baseOffsetY: number;
    layer: EditableLayerId;
  } | null>(null);

  const [preset, setPreset] = useState<OutfitPresetId>("navy-sherpa");
  const [selectedVariation, setSelectedVariation] = useState<SavedMascotVariation | null>(null);
  const [bodyPose, setBodyPose] = useState<"jacket-2" | "jacket-pockets">("jacket-2");
  const [jacketStyle, setJacketStyle] = useState<MascotJacketStyle>("navy-sherpa");
  const [jacketColor, setJacketColor] = useState("#1E2738");
  const [sherpaColor, setSherpaColor] = useState("#C8B79E");
  const [innerTeeColor, setInnerTeeColor] = useState("#FAF7F2");
  const [accessories, setAccessories] = useState<"glasses-2" | "none">("glasses-2");
  const [glassesColor, setGlassesColor] = useState("#181615");

  const [selectedLayer, setSelectedLayer] = useState<EditableLayerId>("sherpa");
  const [sherpaTransform, setSherpaTransform] = useState<MascotLayerTransform>(DEFAULT_LAYER_TRANSFORM);
  const [detailsTransform, setDetailsTransform] = useState<MascotLayerTransform>(DEFAULT_LAYER_TRANSFORM);
  const [stageBg, setStageBg] = useState<StageBgId>("oat");

  const [exportingPng, setExportingPng] = useState(false);
  const [syncingSvg, setSyncingSvg] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);

  const activeTransform = selectedLayer === "sherpa" ? sherpaTransform : detailsTransform;
  const setActiveTransform = (updater: (prev: MascotLayerTransform) => MascotLayerTransform) => {
    if (selectedLayer === "sherpa") {
      setSherpaTransform(updater);
    } else {
      setDetailsTransform(updater);
    }
  };

  const applyOutfitPreset = (nextPreset: OutfitPresetId) => {
    setSelectedVariation(null);
    setPreset(nextPreset);
    if (nextPreset === "navy-sherpa") {
      setBodyPose("jacket-2");
      setJacketStyle("navy-sherpa");
      setJacketColor("#1E2738");
      setSherpaColor("#C8B79E");
      setInnerTeeColor("#FAF7F2");
      showToast("Applied Navy Sherpa Work Jacket (Winter)");
    } else if (nextPreset === "sherpa-pockets") {
      setBodyPose("jacket-pockets");
      setJacketStyle("navy-sherpa");
      setJacketColor("#1E2738");
      setSherpaColor("#C8B79E");
      setInnerTeeColor("#FAF7F2");
      showToast("Applied Navy Sherpa Jacket (Hands in Pockets)");
    } else if (nextPreset === "paprika-dots") {
      setBodyPose("jacket-2");
      setJacketStyle("paprika-dots");
      setJacketColor("#E84A27");
      setInnerTeeColor("#27272A");
      showToast("Applied Paprika Speckled Blazer (Classic)");
    }
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedVariation || jacketStyle !== "navy-sherpa") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const current = selectedLayer === "sherpa" ? sherpaTransform : detailsTransform;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: current.offsetX,
      baseOffsetY: current.offsetY,
      layer: selectedLayer,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = Math.round((e.clientX - drag.startX) * 2.4);
    const dy = Math.round((e.clientY - drag.startY) * 2.4);
    const nextX = Math.max(-80, Math.min(80, drag.baseOffsetX + dx));
    const nextY = Math.max(-80, Math.min(80, drag.baseOffsetY + dy));

    if (drag.layer === "sherpa") {
      setSherpaTransform((prev) => ({ ...prev, offsetX: nextX, offsetY: nextY }));
    } else {
      setDetailsTransform((prev) => ({ ...prev, offsetX: nextX, offsetY: nextY }));
    }
  };

  const handleStagePointerUp = () => {
    dragRef.current = null;
  };

  const getActiveSvgMarkup = async (): Promise<string> => {
    if (selectedVariation) {
      const res = await fetch(selectedVariation.svgUrl);
      if (!res.ok) throw new Error("Could not load saved SVG file");
      return await res.text();
    }
    if (!svgRef.current) throw new Error("Rig SVG unavailable");
    return buildCleanSvgMarkup(svgRef.current);
  };

  const handleDownloadPng = async () => {
    if (exportingPng || (!selectedVariation && !svgRef.current)) return;
    setExportingPng(true);
    try {
      const markup = await getActiveSvgMarkup();
      const pngName = selectedVariation
        ? `${selectedVariation.filename.replace(/\.svg$/i, "")}-1080.png`
        : "smakr-official-mascot-1080.png";
      await downloadSvgAsPng(markup, pngName);
      showToast(`Downloaded ${pngName} (1080×1080)`);
    } catch {
      showToast("Could not export PNG. Please try again.");
    } finally {
      setExportingPng(false);
    }
  };

  const handleCopySvg = async () => {
    if (!selectedVariation && !svgRef.current) return;
    try {
      const markup = await getActiveSvgMarkup();
      await navigator.clipboard.writeText(markup);
      setCopiedSvg(true);
      showToast(
        selectedVariation
          ? `Copied ${selectedVariation.filename} SVG markup`
          : "Official SVG markup copied to clipboard"
      );
      setTimeout(() => setCopiedSvg(false), 1800);
    } catch {
      showToast("Clipboard copy failed. Please allow clipboard access.");
    }
  };

  const handleSyncToApp = async () => {
    if (syncingSvg || (!selectedVariation && !svgRef.current)) return;
    setSyncingSvg(true);
    try {
      const markup = await getActiveSvgMarkup();
      const res = await fetch("/api/admin/save-mascot-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svg: markup }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Sync failed");
      }
      showToast("Synced to public/mascot/smakr-pick-pointing.svg across the app");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to sync SVG");
    } finally {
      setSyncingSvg(false);
    }
  };

  const stageStyle: React.CSSProperties =
    stageBg === "map"
      ? {
          backgroundColor: "#F6F1E6",
          backgroundImage:
            "linear-gradient(rgba(35,31,29,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(35,31,29,0.06) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }
      : {
          backgroundColor:
            stageBg === "espresso" ? "#17120F" : stageBg === "gallery" ? "#FFFFFF" : "#FAF7F2",
        };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ================= LEFT: Official Stage ================= */}
      <div className="lg:col-span-6 space-y-4">
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                {selectedVariation ? selectedVariation.label : "Official Pointing Rig Stage"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {selectedVariation
                  ? `${selectedVariation.outfit} · ${selectedVariation.filename}`
                  : jacketStyle === "navy-sherpa"
                    ? `Drag on stage to offset ${selectedLayer === "sherpa" ? "SherpaCollar" : "WorkJacketDetails"}`
                    : "Classic Paprika Speckled Blazer active"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E2738] text-[#FAF7F2] text-[10px] font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#e84a27]" />
              {selectedVariation
                ? selectedVariation.pose
                : jacketStyle === "navy-sherpa"
                  ? "Winter Sherpa"
                  : "Classic Blazer"}
            </span>
          </div>

          <div
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
            className={`relative rounded-2xl border border-zinc-200/80 overflow-hidden flex items-center justify-center h-[410px] sm:h-[460px] select-none transition-colors ${
              !selectedVariation && jacketStyle === "navy-sherpa"
                ? "cursor-grab active:cursor-grabbing touch-none"
                : ""
            }`}
            style={stageStyle}
          >
            {selectedVariation ? (
              <img
                src={selectedVariation.svgUrl}
                alt={selectedVariation.label}
                className="w-[370px] h-[370px] object-contain pointer-events-none select-none"
              />
            ) : (
              <SmakrMascotRig
                svgRef={svgRef}
                frameMode="bust-only"
                bodyPose={bodyPose}
                head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead || "afro"}
                face="smile-big"
                accessories={accessories}
                facialHair="none"
                skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                clothingColor={jacketColor}
                innerClothingColor={innerTeeColor}
                sherpaColor={sherpaColor}
                glassesColor={glassesColor}
                jacketStyle={jacketStyle}
                sherpaTransform={sherpaTransform}
                detailsTransform={detailsTransform}
                headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                size={370}
                stickerOutline
              />
            )}

            {!selectedVariation && jacketStyle === "navy-sherpa" && (
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-zinc-200 shadow-xs text-[10px] font-semibold text-zinc-700">
                <Move className="w-3 h-3 text-[#e84a27]" />
                <span>
                  Editing {selectedLayer === "sherpa" ? "SherpaCollar" : "WorkJacketDetails"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pr-1 shrink-0">
              Backdrop
            </span>
            {(
              [
                { id: "oat", label: "Warm Oat" },
                { id: "map", label: "Map Grid" },
                { id: "espresso", label: "Espresso" },
                { id: "gallery", label: "Pure White" },
              ] as const
            ).map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setStageBg(bg.id)}
                className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition-all ${
                  stageBg === bg.id
                    ? "border-zinc-900 bg-zinc-900 text-white font-semibold"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 font-medium"
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </section>

        {/* Export & Sync Actions */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={exportingPng}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPng ? "Rendering PNG…" : "Download PNG (1080×1080)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySvg}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 border border-zinc-200 font-bold text-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              {copiedSvg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSvg ? "Copied SVG Code" : "Copy SVG Code"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncToApp}
            disabled={syncingSvg}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all cursor-pointer active:scale-[0.98]"
          >
            {syncingSvg ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>
              {syncingSvg
                ? "Writing public/mascot/smakr-pick-pointing.svg…"
                : "Sync to Map & App (smakr-pick-pointing.svg)"}
            </span>
          </button>
        </section>
      </div>

      {/* ================= RIGHT: Wardrobe, Colors & Layers ================= */}
      <div className="lg:col-span-6 space-y-4">
        {/* 0. Saved Standalone Mascot Variations */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Saved Mascot Variations ({SAVED_MASCOT_VARIATIONS.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                All approved standalone SVGs in <span className="font-mono">public/mascot/</span>
              </p>
            </div>
            {selectedVariation && (
              <button
                type="button"
                onClick={() => setSelectedVariation(null)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Back to Live Rig
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SAVED_MASCOT_VARIATIONS.map((variation) => {
              const active = selectedVariation?.id === variation.id;
              return (
                <button
                  key={variation.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariation(variation);
                    showToast(`Loaded ${variation.label}`);
                  }}
                  className={`group rounded-2xl border p-2 text-left transition-all cursor-pointer ${
                    active
                      ? "border-[#e84a27] bg-orange-50/60 ring-2 ring-[#e84a27]/15"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <div className="rounded-xl bg-[#F7F2E8] border border-zinc-200/70 h-24 flex items-center justify-center overflow-hidden mb-2 p-1.5">
                    <img
                      src={variation.svgUrl}
                      alt={variation.label}
                      className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform"
                    />
                  </div>
                  <span className="block text-[11px] font-bold text-zinc-900 leading-tight truncate">
                    {variation.shortLabel}
                  </span>
                  <span className="block text-[10px] text-zinc-500 truncate mt-0.5">
                    {variation.pose}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 1. Outfit Presets */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              1. Outfit Preset
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">{preset}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                {
                  id: "navy-sherpa",
                  label: "Navy Sherpa Work Jacket",
                  sub: "Pointing · Oatmeal Fleece",
                },
                {
                  id: "sherpa-pockets",
                  label: "Sherpa · Hands in Pockets",
                  sub: "New Stance · Hoodie Merge",
                },
                {
                  id: "paprika-dots",
                  label: "Paprika Speckled Blazer",
                  sub: "Classic Dotted Fit",
                },
                {
                  id: "custom",
                  label: "Custom Colors",
                  sub: "Manual Swatches",
                },
              ] as const
            ).map((opt) => {
              const active = preset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => applyOutfitPreset(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? "border-[#e84a27] bg-orange-50/60 ring-2 ring-[#e84a27]/15"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <span className="block text-xs font-bold text-zinc-900">{opt.label}</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Color Pickers */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            2. Garment & Frame Colors
          </h3>

          <ColorPickerRow
            label="Jacket Color"
            value={jacketColor}
            swatches={JACKET_SWATCHES}
            onChange={(hex) => {
              setPreset("custom");
              setJacketColor(hex);
            }}
          />

          <ColorPickerRow
            label="Sherpa Collar Tint"
            value={sherpaColor}
            swatches={SHERPA_SWATCHES}
            disabled={jacketStyle !== "navy-sherpa"}
            hint={jacketStyle !== "navy-sherpa" ? "Enable Winter Sherpa preset to edit collar" : undefined}
            onChange={(hex) => {
              setPreset("custom");
              setSherpaColor(hex);
            }}
          />

          <ColorPickerRow
            label="Inner Tee Color"
            value={innerTeeColor}
            swatches={TEE_SWATCHES}
            onChange={(hex) => {
              setPreset("custom");
              setInnerTeeColor(hex);
            }}
          />

          <div className="pt-2 border-t border-zinc-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">Glasses / Frames</span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: "glasses-2", label: "Round Frames" },
                    { id: "none", label: "No Glasses" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setAccessories(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      accessories === g.id
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {accessories === "glasses-2" && (
              <ColorPickerRow
                label="Frame Tint"
                value={glassesColor}
                swatches={GLASSES_SWATCHES}
                onChange={setGlassesColor}
              />
            )}
          </div>
        </section>

        {/* 3. Interactive Layer Transform Controls */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#e84a27]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                3. Layer Transform Studio
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTransform(() => DEFAULT_LAYER_TRANSFORM)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-[11px] font-semibold text-zinc-600 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Layer</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "sherpa", label: "SherpaCollar" },
                { id: "details", label: "WorkJacketDetails" },
              ] as const
            ).map((layer) => {
              const active = selectedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  disabled={jacketStyle !== "navy-sherpa"}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-45 ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <TransformSlider
              label="Offset X"
              value={activeTransform.offsetX}
              min={-80}
              max={80}
              step={1}
              unit="px"
              disabled={jacketStyle !== "navy-sherpa"}
              onChange={(v) => setActiveTransform((p) => ({ ...p, offsetX: v }))}
            />
            <TransformSlider
              label="Offset Y"
              value={activeTransform.offsetY}
              min={-80}
              max={80}
              step={1}
              unit="px"
              disabled={jacketStyle !== "navy-sherpa"}
              onChange={(v) => setActiveTransform((p) => ({ ...p, offsetY: v }))}
            />
            <TransformSlider
              label="Scale"
              value={activeTransform.scale}
              min={0.75}
              max={1.35}
              step={0.01}
              unit="x"
              disabled={jacketStyle !== "navy-sherpa"}
              onChange={(v) => setActiveTransform((p) => ({ ...p, scale: v }))}
            />
            <TransformSlider
              label="Rotate"
              value={activeTransform.rotate}
              min={-25}
              max={25}
              step={1}
              unit="°"
              disabled={jacketStyle !== "navy-sherpa"}
              onChange={(v) => setActiveTransform((p) => ({ ...p, rotate: v }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorPickerRow({
  label,
  value,
  swatches,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (hex: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className={`space-y-1.5 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-zinc-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-zinc-500">{value}</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="w-7 h-7 rounded-lg border border-zinc-200 cursor-pointer bg-transparent p-0"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((hex) => {
          const active = value.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onChange(hex)}
              title={hex}
              className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                active ? "border-[#e84a27] scale-110 shadow-xs" : "border-zinc-200 hover:scale-105"
              }`}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>
      {hint && <p className="text-[10px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function TransformSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={disabled ? "opacity-45 pointer-events-none" : ""}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 mb-1">
        <span>{label}</span>
        <span className="font-mono text-zinc-500">
          {step < 1 ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#e84a27] cursor-pointer"
      />
    </div>
  );
}
