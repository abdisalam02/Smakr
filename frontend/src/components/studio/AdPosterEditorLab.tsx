"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  MoveHorizontal,
  MoveVertical,
  RotateCcw,
  RotateCw,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Undo2,
  Unlock,
} from "lucide-react";
import { comico, pally } from "@/lib/fonts";
import {
  AD_POSTER_TEMPLATES,
  SMAKR_POSTER_SWATCHES,
  cloneTemplateState,
  getPosterCanvasSize,
  type AdPosterTemplate,
  type PosterAspectId,
  type PosterFontId,
  type PosterLayer,
} from "@/lib/adPosterTemplates";

const STORAGE_PREFIX = "smakr_poster_editor_v14_";
const SNAP_THRESHOLD = 9;

type SafeZoneMode = "off" | "tiktok" | "ig" | "all";

interface EditorDocState {
  aspect: PosterAspectId;
  bgColor: string;
  layers: PosterLayer[];
}

function getFontFamilyCss(font: PosterFontId): string {
  if (font === "comico") return `${comico.style.fontFamily}, cursive, sans-serif`;
  if (font === "pally") return `${pally.style.fontFamily}, "Plus Jakarta Sans", sans-serif`;
  return 'var(--font-jakarta), "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
}

function loadSavedDoc(template: AdPosterTemplate): EditorDocState {
  if (typeof window === "undefined") return cloneTemplateState(template);
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${template.id}`);
    if (!raw) return cloneTemplateState(template);
    const parsed = JSON.parse(raw) as Partial<EditorDocState>;
    if (!parsed || !Array.isArray(parsed.layers) || parsed.layers.length === 0) {
      return cloneTemplateState(template);
    }
    return {
      aspect: parsed.aspect ?? template.defaultAspect,
      bgColor: parsed.bgColor ?? template.bgColor,
      layers: parsed.layers as PosterLayer[],
    };
  } catch {
    return cloneTemplateState(template);
  }
}

export function AdPosterEditorLab() {
  const [templateId, setTemplateId] = useState<string>(AD_POSTER_TEMPLATES[0].id);
  const currentTemplate = useMemo(
    () => AD_POSTER_TEMPLATES.find((t) => t.id === templateId) ?? AD_POSTER_TEMPLATES[0],
    [templateId]
  );

  const [doc, setDoc] = useState<EditorDocState>(() => cloneTemplateState(AD_POSTER_TEMPLATES[0]));
  const [history, setHistory] = useState<EditorDocState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapGuide, setSnapGuide] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [isExporting, setIsExporting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [safeZoneMode, setSafeZoneMode] = useState<SafeZoneMode>("off");
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasScale, setCanvasScale] = useState(0.5);

  // Hydrate saved state on mount & template switch
  useEffect(() => {
    const loaded = loadSavedDoc(currentTemplate);
    setDoc(loaded);
    setHistory([]);
    setSelectedId(null);
    setHasHydrated(true);
  }, [currentTemplate]);

  // Persist to localStorage automatically
  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${currentTemplate.id}`, JSON.stringify(doc));
    } catch {
      // Ignore storage quota errors
    }
  }, [doc, currentTemplate.id, hasHydrated]);

  const { width: canvasW, height: canvasH } = useMemo(
    () => getPosterCanvasSize(doc.aspect),
    [doc.aspect]
  );

  // Auto-fit canvas scale cleanly inside center workspace
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const recompute = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(240, rect.width - 48);
      const availH = Math.max(280, rect.height - 48);
      const nextScale = Math.min(availW / canvasW, availH / canvasH, 0.72);
      setCanvasScale(Math.max(0.2, nextScale));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasW, canvasH]);

  const pushHistory = useCallback((snapshot: EditorDocState) => {
    setHistory((prev) => [...prev.slice(-29), snapshot]);
  }, []);

  const updateLayer = useCallback(
    (id: string, patch: Partial<PosterLayer>, recordHistory = false) => {
      setDoc((prev) => {
        if (recordHistory) pushHistory(prev);
        return {
          ...prev,
          layers: prev.layers.map((layer) =>
            layer.id === id ? ({ ...layer, ...patch } as PosterLayer) : layer
          ),
        };
      });
    },
    [pushHistory]
  );

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setDoc(previous);
      return prev.slice(0, -1);
    });
  }, []);

  const handleReset = useCallback(() => {
    pushHistory(doc);
    const fresh = cloneTemplateState(currentTemplate);
    setDoc(fresh);
    setSelectedId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${currentTemplate.id}`);
    }
  }, [currentTemplate, doc, pushHistory]);

  const selectedLayer = useMemo(
    () => doc.layers.find((l) => l.id === selectedId) ?? null,
    [doc.layers, selectedId]
  );

  // Keyboard shortcuts: arrow nudge, Esc deselect, Ctrl/Cmd+Z undo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (!selectedLayer || selectedLayer.locked) return;
      const step = e.shiftKey ? 12 : 2;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateLayer(selectedLayer.id, { x: Math.round(selectedLayer.x - step) }, true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        updateLayer(selectedLayer.id, { x: Math.round(selectedLayer.x + step) }, true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        updateLayer(selectedLayer.id, { y: Math.round(selectedLayer.y - step) }, true);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateLayer(selectedLayer.id, { y: Math.round(selectedLayer.y + step) }, true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, selectedLayer, updateLayer]);

  // Pointer drag: move layer with center snap guides
  const startMoveDrag = (e: React.PointerEvent, layer: PosterLayer) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    if (layer.locked) return;

    const targetEl = e.currentTarget as HTMLElement;
    const measuredH = targetEl.offsetHeight || layer.height || 100;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = layer.x;
    const origY = layer.y;
    const snapshot = doc;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / canvasScale;
      const dy = (ev.clientY - startY) / canvasScale;
      if (!moved && (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5)) {
        moved = true;
        pushHistory(snapshot);
      }
      let nextX = Math.round(origX + dx);
      let nextY = Math.round(origY + dy);

      let snappedX = false;
      let snappedY = false;
      if (!ev.shiftKey) {
        const centerX = nextX + layer.width / 2;
        if (Math.abs(centerX - canvasW / 2) <= SNAP_THRESHOLD) {
          nextX = Math.round(canvasW / 2 - layer.width / 2);
          snappedX = true;
        }
        const centerY = nextY + measuredH / 2;
        if (Math.abs(centerY - canvasH / 2) <= SNAP_THRESHOLD) {
          nextY = Math.round(canvasH / 2 - measuredH / 2);
          snappedY = true;
        }
      }
      setSnapGuide({ x: snappedX, y: snappedY });
      updateLayer(layer.id, { x: nextX, y: nextY });
    };

    const onUp = () => {
      setSnapGuide({ x: false, y: false });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Corner/edge resize drag
  const startResizeDrag = (
    e: React.PointerEvent,
    layer: PosterLayer,
    mode: "se" | "e" | "s"
  ) => {
    e.stopPropagation();
    if (layer.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = layer.width;
    const origH = layer.height ?? 160;
    const origFontSize =
      layer.type === "text" || layer.type === "brand_header" ? layer.fontSize : 0;
    const origAccentSize = layer.type === "text" ? layer.accentFontSize ?? layer.fontSize : 0;
    const origLogoW = layer.type === "spot_block" ? layer.logoWidth : 0;
    const snapshot = doc;
    let pushed = false;

    const onMove = (ev: PointerEvent) => {
      if (!pushed) {
        pushed = true;
        pushHistory(snapshot);
      }
      const dx = (ev.clientX - startX) / canvasScale;
      const dy = (ev.clientY - startY) / canvasScale;
      const nextW = Math.max(60, Math.round(origW + dx));

      if (mode === "e") {
        updateLayer(layer.id, { width: nextW });
        return;
      }
      if (mode === "s" && (layer.type === "shape" || layer.height !== undefined)) {
        updateLayer(layer.id, { height: Math.max(24, Math.round(origH + dy)) });
        return;
      }

      const ratio = nextW / Math.max(1, origW);
      if (layer.type === "shape" || (layer.type === "image" && layer.height !== undefined)) {
        updateLayer(layer.id, {
          width: nextW,
          height: Math.max(24, Math.round(origH + dy)),
        });
      } else if (layer.type === "text") {
        updateLayer(layer.id, {
          width: nextW,
          fontSize: Math.max(14, Math.round(origFontSize * ratio)),
          ...(layer.accentFontSize
            ? { accentFontSize: Math.max(14, Math.round(origAccentSize * ratio)) }
            : {}),
        });
      } else if (layer.type === "brand_header") {
        updateLayer(layer.id, {
          width: nextW,
          fontSize: Math.max(20, Math.round(origFontSize * ratio)),
        });
      } else if (layer.type === "spot_block") {
        updateLayer(layer.id, {
          width: nextW,
          logoWidth: Math.max(56, Math.round(origLogoW * ratio)),
        });
      } else {
        updateLayer(layer.id, { width: nextW });
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Top rotation handle drag
  const startRotateDrag = (e: React.PointerEvent, layer: PosterLayer, boxEl: HTMLElement | null) => {
    e.stopPropagation();
    if (layer.locked || !boxEl) return;
    const rect = boxEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const origRot = layer.rotation;
    const snapshot = doc;
    let pushed = false;

    const onMove = (ev: PointerEvent) => {
      if (!pushed) {
        pushed = true;
        pushHistory(snapshot);
      }
      const curAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let deg = Math.round(origRot + ((curAngle - startAngle) * 180) / Math.PI);
      if (!ev.shiftKey && Math.abs(deg) <= 3) deg = 0;
      updateLayer(layer.id, { rotation: deg });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const nudgeZIndex = (layerId: string, delta: 1 | -1) => {
    const sorted = [...doc.layers].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((l) => l.id === layerId);
    const swapIdx = idx + delta;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    pushHistory(doc);
    const reordered = [...sorted];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(swapIdx, 0, item);
    const nextZ = new Map<string, number>();
    reordered.forEach((l, i) => nextZ.set(l.id, (i + 1) * 2));
    setDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => ({ ...l, zIndex: nextZ.get(l.id) ?? l.zIndex })),
    }));
  };

  const handleCenterSelected = (axis: "x" | "y") => {
    if (!selectedLayer || selectedLayer.locked) return;
    if (axis === "x") {
      updateLayer(selectedLayer.id, { x: Math.round((canvasW - selectedLayer.width) / 2) }, true);
    } else {
      const h = selectedLayer.height ?? 180;
      updateLayer(selectedLayer.id, { y: Math.round((canvasH - h) / 2) }, true);
    }
  };

  const handleCopyLayoutJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
      setCopiedJson(true);
      window.setTimeout(() => setCopiedJson(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleExportPng = async () => {
    const node = canvasRef.current;
    if (!node || isExporting) return;
    const prevSelected = selectedId;
    setSelectedId(null);
    setIsExporting(true);

    // Wait 2 animation frames so selection outline cleanly unmounts before capture
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const blob = await toBlob(node, {
        width: canvasW,
        height: canvasH,
        pixelRatio: 3,
        cacheBust: true,
        style: {
          transform: "none",
          transformOrigin: "top left",
        },
      });
      if (!blob) throw new Error("Export blob was null");
      const filename = `${currentTemplate.fileSlug}_${doc.aspect.replace(":", "x")}_3x.png`;

      // Prefer native mobile share sheet (Save to Photos on iOS/Android) when on touch devices
      const isMobileUa =
        typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileUa && typeof navigator.share === "function" && typeof File !== "undefined") {
        try {
          const file = new File([blob], filename, { type: "image/png" });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: currentTemplate.name });
            return;
          }
        } catch (shareErr) {
          // User cancelled share or share unsupported -> fall back to direct download
          if ((shareErr as Error)?.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Poster PNG export failed:", err);
    } finally {
      setIsExporting(false);
      setSelectedId(prevSelected);
    }
  };

  const sortedLayersTopFirst = useMemo(
    () => [...doc.layers].sort((a, b) => b.zIndex - a.zIndex),
    [doc.layers]
  );

  return (
    <div className="w-full h-full flex flex-col px-3 sm:px-4 pb-24 lg:pb-4 pt-1 max-w-[1720px] mx-auto select-none">
      {/* ── MOBILE TEMPLATE CAROUSEL STRIP (< lg) ── */}
      <div className="lg:hidden mb-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {AD_POSTER_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setTemplateId(tpl.id)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              tpl.id === templateId
                ? "bg-[#e84a27] border-[#e84a27] text-white shadow-sm"
                : "bg-[#1C1A18] border-white/10 text-zinc-300"
            }`}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* ── DESKTOP TOP EDITOR TOOLBAR (lg+) ── */}
      <div className="hidden lg:flex rounded-2xl bg-[#1C1A18] border border-white/10 px-3.5 py-2.5 mb-3 flex-wrap items-center justify-between gap-2.5 shadow-xl shrink-0">
        {/* Left: Template Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-400">
            Editable Ads
          </span>
          {AD_POSTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplateId(tpl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tpl.id === templateId
                  ? "bg-[#e84a27] text-white shadow-xs"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Middle: Aspect Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-[11px]">
          {(["4:5", "1:1", "3:4", "9:16"] as PosterAspectId[]).map((asp) => (
            <button
              key={asp}
              type="button"
              onClick={() => {
                pushHistory(doc);
                setDoc((prev) => ({ ...prev, aspect: asp }));
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                doc.aspect === asp ? "bg-white text-stone-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              {asp}
            </button>
          ))}
        </div>

        {/* Right: Safe Zones, Undo, Reset, Copy JSON, Export @3x */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-[11px]"
            title="Toggle platform safe-zone overlays (auto-hidden on PNG export)"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#e84a27] mx-1.5 shrink-0" />
            {(
              [
                ["off", "Off"],
                ["tiktok", "TikTok"],
                ["ig", "Sides"],
                ["all", "All"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSafeZoneMode(mode)}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  safeZoneMode === mode
                    ? "bg-[#e84a27] text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-35 text-zinc-200 text-xs font-bold cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold cursor-pointer"
            title="Reset all layers to template defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLayoutJson}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-bold cursor-pointer"
            title="Copy current layout JSON to paste in chat"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Layout</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e84a27] hover:bg-[#d33e1d] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? "Exporting..." : "Export @3x PNG"}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN WORKSPACE: LAYERS | CANVAS | INSPECTOR ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[240px_1fr_290px] gap-3">
        {/* LEFT: LAYERS PANEL */}
        <aside className={`${showMobileControls ? "flex" : "hidden"} lg:flex order-2 lg:order-1 rounded-2xl bg-[#1C1A18] border border-white/10 p-3 flex-col min-h-0 overflow-hidden`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Layers className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Layers</span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-500">
              {doc.layers.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {sortedLayersTopFirst.map((layer) => {
              const isSel = layer.id === selectedId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedId(layer.id)}
                  className={`group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSel
                      ? "bg-[#e84a27]/20 border border-[#e84a27]/70 text-white"
                      : "bg-white/[0.03] hover:bg-white/[0.07] border border-transparent text-zinc-300"
                  }`}
                >
                  <span className={`truncate font-semibold ${!layer.visible ? "opacity-40 line-through" : ""}`}>
                    {layer.label}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nudgeZIndex(layer.id, 1);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title="Bring forward"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nudgeZIndex(layer.id, -1);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title="Send backward"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { visible: !layer.visible }, true);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title={layer.visible ? "Hide layer" : "Show layer"}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-zinc-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { locked: !layer.locked });
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title={layer.locked ? "Unlock layer" : "Lock layer"}
                    >
                      {layer.locked ? <Lock className="w-3 h-3 text-[#e84a27]" /> : <Unlock className="w-3 h-3 opacity-50" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 text-[10.5px] text-zinc-500 leading-snug">
            Drag to move · Corner dot to resize · Top dot to rotate · Arrows to nudge (`Shift` for 12px).
          </div>
        </aside>

        {/* CENTER: INTERACTIVE SCALED POSTER STAGE */}
        <section
          ref={stageContainerRef}
          onPointerDown={() => setSelectedId(null)}
          className="order-1 lg:order-2 rounded-2xl bg-[#11100F] border border-white/10 relative flex items-center justify-center overflow-hidden min-h-[60dvh] lg:min-h-[460px]"
        >
          {/* Scaled wrapper matching rendered pixel box */}
          <div
            style={{
              width: Math.round(canvasW * canvasScale),
              height: Math.round(canvasH * canvasScale),
              position: "relative",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55)",
            }}
          >
            {/* Native-resolution 1080×H Artboard */}
            <div
              ref={canvasRef}
              style={{
                width: canvasW,
                height: canvasH,
                background: doc.bgColor,
                position: "relative",
                overflow: "hidden",
                transform: `scale(${canvasScale})`,
                transformOrigin: "top left",
              }}
            >
              {/* Smart Center Snap Guides */}
              {!isExporting && snapGuide.x && (
                <div
                  style={{
                    position: "absolute",
                    left: canvasW / 2,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "#E84A27",
                    opacity: 0.75,
                    zIndex: 999,
                    pointerEvents: "none",
                  }}
                />
              )}
              {!isExporting && snapGuide.y && (
                <div
                  style={{
                    position: "absolute",
                    top: canvasH / 2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "#E84A27",
                    opacity: 0.75,
                    zIndex: 999,
                    pointerEvents: "none",
                  }}
                />
              )}

              {doc.layers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = !isExporting && layer.id === selectedId;
                return (
                  <EditableLayerNode
                    key={layer.id}
                    layer={layer}
                    isSelected={isSelected}
                    canvasScale={canvasScale}
                    onPointerDown={(e) => startMoveDrag(e, layer)}
                    onResizeDown={(e, mode) => startResizeDrag(e, layer, mode)}
                    onRotateDown={(e, el) => startRotateDrag(e, layer, el)}
                  />
                );
              })}

              {/* Non-exported Platform Safe-Zone Overlays (Side Crop + TikTok UI Rail) */}
              {!isExporting && safeZoneMode !== "off" && (
                <>
                  {/* Side-Edge Crop Danger Bands (44px left & right + top/bottom in All/Sides) */}
                  {(safeZoneMode === "ig" || safeZoneMode === "all" || safeZoneMode === "tiktok") && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 44,
                          background: "rgba(232, 74, 39, 0.08)",
                          borderRight: "2px dashed rgba(232, 74, 39, 0.45)",
                          zIndex: 985,
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 44,
                          background: "rgba(232, 74, 39, 0.08)",
                          borderLeft: "2px dashed rgba(232, 74, 39, 0.45)",
                          zIndex: 985,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  )}

                  {(safeZoneMode === "ig" || safeZoneMode === "all") && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          height: 44,
                          background: "rgba(232, 74, 39, 0.06)",
                          borderBottom: "2px dashed rgba(232, 74, 39, 0.4)",
                          zIndex: 985,
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 48,
                          background: "rgba(232, 74, 39, 0.06)",
                          borderTop: "2px dashed rgba(232, 74, 39, 0.4)",
                          zIndex: 985,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  )}

                  {/* TikTok Full-Screen 9:16 Top Bar + Bottom Caption Safe-Zone Bands */}
                  {(safeZoneMode === "tiktok" || safeZoneMode === "all") && doc.aspect === "9:16" && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          height: 205,
                          background: "rgba(24, 22, 21, 0.12)",
                          borderBottom: "2.5px dashed rgba(24, 22, 21, 0.42)",
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          paddingBottom: 14,
                          zIndex: 988,
                          pointerEvents: "none",
                        }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 800, color: "rgba(24, 22, 21, 0.58)" }}>
                          TikTok Top Nav (Following · For You)
                        </span>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 330,
                          background: "rgba(24, 22, 21, 0.14)",
                          borderTop: "2.5px dashed rgba(24, 22, 21, 0.42)",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          paddingTop: 14,
                          zIndex: 988,
                          pointerEvents: "none",
                        }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 800, color: "rgba(24, 22, 21, 0.58)" }}>
                          TikTok Caption &amp; Bottom Bar Zone
                        </span>
                      </div>
                    </>
                  )}

                  {/* TikTok Right-Rail Engagement Column (Avatar + Heart + Comment + Bookmark) */}
                  {(safeZoneMode === "tiktok" || safeZoneMode === "all") && (
                    <div
                      style={{
                        position: "absolute",
                        right: 16,
                        top: doc.aspect === "9:16" ? 890 : Math.round(canvasH * 0.44),
                        width: 126,
                        height: doc.aspect === "9:16" ? 680 : Math.round(canvasH * 0.50),
                        borderRadius: 28,
                        border: "2.5px dashed rgba(24, 22, 21, 0.4)",
                        background: "rgba(24, 22, 21, 0.09)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "24px 0",
                        zIndex: 990,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 78,
                          height: 78,
                          borderRadius: "50%",
                          background: "rgba(24, 22, 21, 0.22)",
                          border: "3px solid rgba(255,255,255,0.85)",
                        }}
                      />
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(24, 22, 21, 0.18)" }} />
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(24, 22, 21, 0.18)" }} />
                      <div style={{ width: 58, height: 68, borderRadius: 12, background: "rgba(24, 22, 21, 0.18)" }} />
                      <span
                        style={{
                          position: "absolute",
                          top: -28,
                          right: 0,
                          fontSize: 16,
                          fontWeight: 800,
                          color: "rgba(24, 22, 21, 0.6)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        TikTok Rail
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="absolute bottom-2.5 right-3 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-zinc-400 pointer-events-none">
            {canvasW}×{canvasH} · {Math.round(canvasScale * 100)}%
          </div>
        </section>

        {/* RIGHT: INSPECTOR PANEL */}
        <aside className={`${showMobileControls ? "flex" : "hidden"} lg:flex order-3 rounded-2xl bg-[#1C1A18] border border-white/10 p-3.5 flex-col min-h-0 overflow-y-auto`}>
          {!selectedLayer ? (
            <div className="space-y-4">
              <div className="pb-2 border-b border-white/10">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Canvas Settings
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Click any component on the poster to drag, resize, rotate, or edit its properties.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-300 block">
                  Background Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SMAKR_POSTER_SWATCHES.map((sw) => (
                    <button
                      key={sw.hex}
                      type="button"
                      onClick={() => {
                        pushHistory(doc);
                        setDoc((prev) => ({ ...prev, bgColor: sw.hex }));
                      }}
                      title={`${sw.label} (${sw.hex})`}
                      className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform hover:scale-105 ${
                        doc.bgColor.toUpperCase() === sw.hex
                          ? "border-[#e84a27] scale-105"
                          : "border-white/20"
                      }`}
                      style={{ background: sw.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={doc.bgColor}
                    onChange={(e) => setDoc((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="w-7 h-7 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                    title="Custom background color"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-[11px] text-zinc-400 space-y-1.5">
                <div className="font-bold text-zinc-200">Need a new component?</div>
                <p className="leading-relaxed">
                  Come back to chat anytime to add a new cutout, mascot, logo, or shape and it will drop right into this editor.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-2 border-b border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                    {selectedLayer.type.replace("_", " ")}
                  </div>
                  <h3 className="text-xs font-extrabold text-white truncate">
                    {selectedLayer.label}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCenterSelected("x")}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                    title="Center horizontally"
                  >
                    <MoveHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCenterSelected("y")}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                    title="Center vertically"
                  >
                    <MoveVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Position & Size Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <NumberField
                  label="X"
                  value={selectedLayer.x}
                  onChange={(v) => updateLayer(selectedLayer.id, { x: v })}
                />
                <NumberField
                  label="Y"
                  value={selectedLayer.y}
                  onChange={(v) => updateLayer(selectedLayer.id, { y: v })}
                />
                <NumberField
                  label="Width"
                  value={selectedLayer.width}
                  min={40}
                  onChange={(v) => updateLayer(selectedLayer.id, { width: v })}
                />
                {selectedLayer.type === "shape" ? (
                  <NumberField
                    label="Height"
                    value={selectedLayer.height}
                    min={20}
                    onChange={(v) => updateLayer(selectedLayer.id, { height: v })}
                  />
                ) : (
                  <NumberField
                    label="Rotate °"
                    value={selectedLayer.rotation}
                    onChange={(v) => updateLayer(selectedLayer.id, { rotation: v })}
                  />
                )}
              </div>

              {/* Rotation & Opacity sliders */}
              <div className="space-y-2.5">
                <SliderField
                  label={`Rotation (${selectedLayer.rotation}°)`}
                  value={selectedLayer.rotation}
                  min={-45}
                  max={45}
                  onReset={() => updateLayer(selectedLayer.id, { rotation: 0 }, true)}
                  onChange={(v) => updateLayer(selectedLayer.id, { rotation: v })}
                />
                <SliderField
                  label={`Opacity (${Math.round(selectedLayer.opacity * 100)}%)`}
                  value={Math.round(selectedLayer.opacity * 100)}
                  min={10}
                  max={100}
                  onChange={(v) => updateLayer(selectedLayer.id, { opacity: v / 100 })}
                />
              </div>

              {/* SHAPE CONTROLS */}
              {selectedLayer.type === "shape" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <ColorSwatchPicker
                    label="Fill Color"
                    value={selectedLayer.fill}
                    onChange={(hex) => updateLayer(selectedLayer.id, { fill: hex }, true)}
                  />
                  <SliderField
                    label={`Corner Radius (${selectedLayer.borderRadius}px)`}
                    value={selectedLayer.borderRadius}
                    min={0}
                    max={200}
                    onChange={(v) => updateLayer(selectedLayer.id, { borderRadius: v })}
                  />
                </div>
              )}

              {/* IMAGE CONTROLS */}
              {selectedLayer.type === "image" && (
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <SliderField
                    label={`Image Width (${selectedLayer.width}px)`}
                    value={selectedLayer.width}
                    min={120}
                    max={1200}
                    onChange={(v) => updateLayer(selectedLayer.id, { width: v })}
                  />
                  {selectedLayer.height !== undefined && (
                    <>
                      <SliderField
                        label={`Map Zoom (${((selectedLayer.mapScale ?? 1) * 100).toFixed(0)}%)`}
                        value={Math.round((selectedLayer.mapScale ?? 1) * 100)}
                        min={100}
                        max={280}
                        onReset={() => updateLayer(selectedLayer.id, { mapScale: 1 }, true)}
                        onChange={(v) => updateLayer(selectedLayer.id, { mapScale: v / 100 })}
                      />
                      <SliderField
                        label={`Map Pan X (${selectedLayer.mapOffsetX ?? 0}%)`}
                        value={selectedLayer.mapOffsetX ?? 0}
                        min={-40}
                        max={40}
                        onReset={() => updateLayer(selectedLayer.id, { mapOffsetX: 0 }, true)}
                        onChange={(v) => updateLayer(selectedLayer.id, { mapOffsetX: v })}
                      />
                      <SliderField
                        label={`Map Pan Y (${selectedLayer.mapOffsetY ?? 0}%)`}
                        value={selectedLayer.mapOffsetY ?? 0}
                        min={-40}
                        max={40}
                        onReset={() => updateLayer(selectedLayer.id, { mapOffsetY: 0 }, true)}
                        onChange={(v) => updateLayer(selectedLayer.id, { mapOffsetY: v })}
                      />
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span className="font-semibold">Top Fade Gradient</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedLayer.topFade)}
                          onChange={(e) =>
                            updateLayer(selectedLayer.id, { topFade: e.target.checked }, true)
                          }
                          className="accent-[#e84a27] w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span className="font-semibold">Bottom Fade Gradient</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedLayer.bottomFade)}
                          onChange={(e) =>
                            updateLayer(selectedLayer.id, { bottomFade: e.target.checked }, true)
                          }
                          className="accent-[#e84a27] w-4 h-4"
                        />
                      </label>
                    </>
                  )}
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span className="font-semibold">Soft Drop Shadow</span>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLayer.dropShadow)}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, { dropShadow: e.target.checked }, true)
                      }
                      className="accent-[#e84a27] w-4 h-4"
                    />
                  </label>
                </div>
              )}

              {/* BRAND HEADER CONTROLS */}
              {selectedLayer.type === "brand_header" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Text</label>
                    <textarea
                      rows={2}
                      value={selectedLayer.text}
                      onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold resize-none"
                    />
                  </div>
                  <SliderField
                    label={`Font Size (${selectedLayer.fontSize}px)`}
                    value={selectedLayer.fontSize}
                    min={24}
                    max={110}
                    onChange={(v) => updateLayer(selectedLayer.id, { fontSize: v })}
                  />
                  <ColorSwatchPicker
                    label="Brand Color"
                    value={selectedLayer.color}
                    onChange={(hex) =>
                      updateLayer(selectedLayer.id, { color: hex, dividerColor: hex }, true)
                    }
                  />
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span className="font-semibold">Underline Bar</span>
                    <input
                      type="checkbox"
                      checked={selectedLayer.showDivider}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, { showDivider: e.target.checked }, true)
                      }
                      className="accent-[#e84a27] w-4 h-4"
                    />
                  </label>
                  {selectedLayer.showDivider && (
                    <SliderField
                      label={`Line Width (${selectedLayer.dividerWidth}px)`}
                      value={selectedLayer.dividerWidth}
                      min={40}
                      max={280}
                      onChange={(v) => updateLayer(selectedLayer.id, { dividerWidth: v })}
                    />
                  )}
                </div>
              )}

              {/* TEXT CONTROLS */}
              {selectedLayer.type === "text" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Text</label>
                    <textarea
                      rows={2}
                      value={selectedLayer.text}
                      onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold resize-none"
                    />
                  </div>
                  {typeof selectedLayer.accentText === "string" && (
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        Accent Text (e.g. smakr.no)
                      </label>
                      <input
                        type="text"
                        value={selectedLayer.accentText}
                        onChange={(e) =>
                          updateLayer(selectedLayer.id, { accentText: e.target.value })
                        }
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                      />
                    </div>
                  )}
                  {typeof selectedLayer.trailingText === "string" && (
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        Trailing Text
                      </label>
                      <input
                        type="text"
                        value={selectedLayer.trailingText}
                        onChange={(e) =>
                          updateLayer(selectedLayer.id, { trailingText: e.target.value })
                        }
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1">
                    {(["pally", "comico", "jakarta"] as PosterFontId[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => updateLayer(selectedLayer.id, { font: f }, true)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                          selectedLayer.font === f
                            ? "bg-[#e84a27] text-white"
                            : "bg-white/5 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <SliderField
                    label={`Font Size (${selectedLayer.fontSize}px)`}
                    value={selectedLayer.fontSize}
                    min={16}
                    max={310}
                    onChange={(v) => updateLayer(selectedLayer.id, { fontSize: v })}
                  />
                  <AlignPicker
                    value={selectedLayer.align}
                    onChange={(align) => updateLayer(selectedLayer.id, { align }, true)}
                  />
                  <ColorSwatchPicker
                    label="Text Color"
                    value={selectedLayer.color}
                    onChange={(hex) => updateLayer(selectedLayer.id, { color: hex }, true)}
                  />
                </div>
              )}

              {/* MAP PIN CONTROLS */}
              {selectedLayer.type === "map_pin" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Spot Name</label>
                    <input
                      type="text"
                      value={selectedLayer.title}
                      onChange={(e) => updateLayer(selectedLayer.id, { title: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Address</label>
                    <input
                      type="text"
                      value={selectedLayer.subtitle ?? ""}
                      onChange={(e) => updateLayer(selectedLayer.id, { subtitle: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                    />
                  </div>
                  {selectedLayer.logoSrc && (
                    <SliderField
                      label={`Logo Width (${selectedLayer.logoWidth ?? 46}px)`}
                      value={selectedLayer.logoWidth ?? 46}
                      min={24}
                      max={120}
                      onChange={(v) => updateLayer(selectedLayer.id, { logoWidth: v })}
                    />
                  )}
                  <SliderField
                    label={`Pin Size (${selectedLayer.pinSize ?? 44}px)`}
                    value={selectedLayer.pinSize ?? 44}
                    min={24}
                    max={88}
                    onChange={(v) => updateLayer(selectedLayer.id, { pinSize: v })}
                  />
                  <ColorSwatchPicker
                    label="Text Color"
                    value={selectedLayer.textColor}
                    onChange={(hex) => updateLayer(selectedLayer.id, { textColor: hex }, true)}
                  />
                </div>
              )}

              {/* INFO CARD CONTROLS */}
              {selectedLayer.type === "info_card" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Spot &amp; Dish</label>
                    <input
                      type="text"
                      value={selectedLayer.title}
                      onChange={(e) => updateLayer(selectedLayer.id, { title: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Street Address</label>
                    <input
                      type="text"
                      value={selectedLayer.subtitle}
                      onChange={(e) => updateLayer(selectedLayer.id, { subtitle: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Tag</label>
                      <input
                        type="text"
                        value={selectedLayer.tag ?? ""}
                        onChange={(e) => updateLayer(selectedLayer.id, { tag: e.target.value })}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Price</label>
                      <input
                        type="text"
                        value={selectedLayer.price}
                        onChange={(e) => updateLayer(selectedLayer.id, { price: e.target.value })}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPOT BLOCK CONTROLS */}
              {selectedLayer.type === "spot_block" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <SliderField
                    label={`Logo Size (${selectedLayer.logoWidth}px)`}
                    value={selectedLayer.logoWidth}
                    min={64}
                    max={280}
                    onChange={(v) => updateLayer(selectedLayer.id, { logoWidth: v })}
                  />
                  <SliderField
                    label={`Dish & Location Size (${selectedLayer.metaFontSize ?? 20}px)`}
                    value={selectedLayer.metaFontSize ?? 20}
                    min={13}
                    max={30}
                    onChange={(v) => updateLayer(selectedLayer.id, { metaFontSize: v })}
                  />
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Dish &amp; Street Lines
                    </label>
                    <textarea
                      rows={2}
                      value={selectedLayer.metaLines}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, { metaLines: e.target.value })
                      }
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Price</label>
                    <input
                      type="text"
                      value={selectedLayer.price}
                      onChange={(e) => updateLayer(selectedLayer.id, { price: e.target.value })}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block mb-1">Price Font</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(["pally", "jakarta", "comico"] as PosterFontId[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateLayer(selectedLayer.id, { priceFont: f }, true)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                            (selectedLayer.priceFont ?? "pally") === f
                              ? "bg-[#e84a27] text-white"
                              : "bg-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderField
                    label={`Price Size (${selectedLayer.priceFontSize ?? 38}px)`}
                    value={selectedLayer.priceFontSize ?? 38}
                    min={22}
                    max={56}
                    onChange={(v) => updateLayer(selectedLayer.id, { priceFontSize: v })}
                  />
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span className="font-semibold">Location Pin Badge</span>
                    <input
                      type="checkbox"
                      checked={selectedLayer.showLocationPin !== false}
                      onChange={(e) =>
                        updateLayer(selectedLayer.id, { showLocationPin: e.target.checked }, true)
                      }
                      className="accent-[#e84a27] w-4 h-4"
                    />
                  </label>
                  <AlignPicker
                    value={selectedLayer.align}
                    onChange={(align) => updateLayer(selectedLayer.id, { align }, true)}
                  />
                  <ColorSwatchPicker
                    label="Price Color"
                    value={selectedLayer.priceColor}
                    onChange={(hex) => updateLayer(selectedLayer.id, { priceColor: hex }, true)}
                  />
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── MOBILE STICKY DOWNLOAD & QUICK CONTROLS BAR (< lg) ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#181615]/95 backdrop-blur-md border-t border-white/10 px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setSafeZoneMode((m) => (m === "off" ? "tiktok" : m === "tiktok" ? "all" : "off"))
          }
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer shrink-0 ${
            safeZoneMode !== "off"
              ? "bg-[#e84a27]/20 border-[#e84a27]/60 text-[#ff9d87]"
              : "bg-white/5 border-white/10 text-zinc-300"
          }`}
          title="Toggle Safe Zones"
        >
          <Smartphone className="w-4 h-4" />
          <span>{safeZoneMode === "off" ? "Zones" : safeZoneMode === "tiktok" ? "TikTok" : "All"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobileControls((v) => !v)}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer shrink-0 ${
            showMobileControls
              ? "bg-white text-stone-900 border-white"
              : "bg-white/5 border-white/10 text-zinc-300"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d33e1d] active:scale-[0.98] text-white text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span>{isExporting ? "Preparing @3x PNG..." : "Save @3x PNG"}</span>
        </button>
      </div>
    </div>
  );
}

function EditableLayerNode({
  layer,
  isSelected,
  canvasScale,
  onPointerDown,
  onResizeDown,
  onRotateDown,
}: {
  layer: PosterLayer;
  isSelected: boolean;
  canvasScale: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onResizeDown: (e: React.PointerEvent, mode: "se" | "e" | "s") => void;
  onRotateDown: (e: React.PointerEvent, el: HTMLElement | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const invScale = 1 / Math.max(0.25, canvasScale);
  const handleSize = Math.round(13 * invScale);

  return (
    <div
      ref={boxRef}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        transform: `rotate(${layer.rotation}deg)`,
        transformOrigin: "center center",
        zIndex: layer.zIndex,
        opacity: layer.opacity,
        cursor: layer.locked ? "default" : "grab",
        outline: isSelected ? `${Math.max(2, Math.round(2 * invScale))}px solid #E84A27` : "none",
        outlineOffset: isSelected ? Math.round(3 * invScale) : 0,
      }}
    >
      {/* Layer Body */}
      {layer.type === "shape" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: layer.fill,
            borderRadius: layer.borderRadius,
            border:
              layer.borderWidth && layer.borderColor
                ? `${layer.borderWidth}px solid ${layer.borderColor}`
                : undefined,
            pointerEvents: "none",
          }}
        />
      )}

      {layer.type === "image" && (
        <div
          style={{
            width: "100%",
            height: layer.height ? "100%" : "auto",
            overflow: "hidden",
            borderRadius: layer.borderRadius,
            border:
              layer.borderWidth && layer.borderColor
                ? `${layer.borderWidth}px solid ${layer.borderColor}`
                : undefined,
            position: "relative",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={layer.src}
            alt={layer.label}
            draggable={false}
            style={{
              width: "100%",
              height: layer.height ? "100%" : "auto",
              objectFit: layer.objectFit ?? "contain",
              objectPosition: layer.objectPosition ?? "center",
              transform:
                layer.mapScale || layer.mapOffsetX || layer.mapOffsetY
                  ? `scale(${layer.mapScale ?? 1}) translate(${layer.mapOffsetX ?? 0}%, ${layer.mapOffsetY ?? 0}%)`
                  : undefined,
              transformOrigin: "center center",
              display: "block",
              filter: layer.dropShadow
                ? "drop-shadow(0 16px 26px rgba(24, 22, 21, 0.14))"
                : layer.topFade || layer.bottomFade
                ? "saturate(0.97) contrast(1.02)"
                : undefined,
            }}
          />
          {layer.scrimColor && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: layer.scrimColor,
                pointerEvents: "none",
              }}
            />
          )}
          {/* Exact Preset 2 & 3 Top Fade Gradient */}
          {layer.topFade && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(247, 242, 232, 0.96) 0%, rgba(247, 242, 232, 0.80) 15%, rgba(247, 242, 232, 0.30) 26%, rgba(247, 242, 232, 0) 37%)",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Exact Preset 2 & 3 Bottom Fade Gradient */}
          {layer.bottomFade && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(0deg, rgba(247, 242, 232, 0.97) 0%, rgba(247, 242, 232, 0.80) 13%, rgba(247, 242, 232, 0.25) 24%, rgba(247, 242, 232, 0) 34%)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      )}

      {layer.type === "map_pin" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {/* Compact horizontal marker: logo on left + Name & prominent Address on right */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 18px 11px 14px",
              borderRadius: 20,
              background: "rgba(247, 242, 232, 0.94)",
              border: "1.5px solid rgba(36, 28, 22, 0.16)",
              boxShadow: "0 10px 24px rgba(24, 22, 21, 0.16)",
              whiteSpace: "nowrap",
            }}
          >
            {layer.logoSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={layer.logoSrc}
                alt={layer.title}
                draggable={false}
                style={{
                  width: layer.logoWidth ?? 58,
                  maxHeight: 54,
                  height: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, textAlign: "left" }}>
              <span
                style={{
                  fontFamily: getFontFamilyCss("jakarta"),
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#574C44",
                }}
              >
                {layer.title}
              </span>
              {layer.subtitle && (
                <span
                  style={{
                    fontFamily: getFontFamilyCss("pally"),
                    fontWeight: 700,
                    fontSize: 25,
                    letterSpacing: "-0.015em",
                    color: layer.textColor,
                    marginTop: 2,
                  }}
                >
                  {layer.subtitle}
                </span>
              )}
            </div>
          </div>
          {layer.pinSrc && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={layer.pinSrc}
              alt=""
              draggable={false}
              style={{
                marginTop: 3,
                height: layer.pinSize ?? 44,
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 7px rgba(24, 22, 21, 0.28))",
              }}
            />
          )}
        </div>
      )}

      {layer.type === "info_card" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "16px 24px",
            borderRadius: 24,
            background: layer.bgColor,
            border: "2px solid rgba(36, 28, 22, 0.14)",
            boxShadow: "0 8px 22px rgba(24, 22, 21, 0.08)",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            <div
              style={{
                width: 108,
                height: 92,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layer.logoSrc}
                alt={layer.title}
                draggable={false}
                style={{
                  maxWidth: layer.logoWidth,
                  maxHeight: 88,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: getFontFamilyCss("pally"),
                  fontWeight: 700,
                  fontSize: 26,
                  lineHeight: 1.15,
                  color: layer.textColor,
                }}
              >
                {layer.title}
              </span>
              <span
                style={{
                  fontFamily: getFontFamilyCss("jakarta"),
                  fontWeight: 600,
                  fontSize: 17,
                  color: "#574C44",
                }}
              >
                {layer.subtitle}
              </span>
              {layer.tag && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 2,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "#F3E9D8",
                    fontFamily: getFontFamilyCss("jakarta"),
                    fontWeight: 700,
                    fontSize: 13.5,
                    color: layer.accentColor,
                  }}
                >
                  {layer.tag}
                </span>
              )}
            </div>
          </div>
          <span
            style={{
              fontFamily: getFontFamilyCss("pally"),
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "-0.025em",
              color: layer.accentColor,
              flexShrink: 0,
            }}
          >
            {layer.price}
          </span>
        </div>
      )}

      {layer.type === "brand_header" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: getFontFamilyCss("comico"),
              fontSize: layer.fontSize,
              color: layer.color,
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            {layer.text}
          </span>
          {layer.showDivider && (
            <div
              style={{
                width: layer.dividerWidth,
                height: layer.dividerHeight,
                borderRadius: 999,
                background: layer.dividerColor,
                marginTop: 12,
              }}
            />
          )}
        </div>
      )}

      {layer.type === "text" && (
        <div
          style={{
            fontFamily: getFontFamilyCss(layer.font),
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight,
            letterSpacing: `${layer.letterSpacing}em`,
            lineHeight: layer.lineHeight,
            color: layer.color,
            textAlign: layer.align,
            textTransform: layer.uppercase ? "uppercase" : undefined,
            whiteSpace: "pre-line",
            pointerEvents: "none",
          }}
        >
          <span>{layer.text}</span>
          {layer.accentText && (
            <span
              style={{
                fontFamily: getFontFamilyCss(layer.accentFont ?? "comico"),
                fontSize: layer.accentFontSize ?? layer.fontSize,
                color: layer.accentColor ?? "#E84A27",
                marginLeft: 4,
              }}
            >
              {layer.accentText}
            </span>
          )}
          {layer.trailingText && <span>{layer.trailingText}</span>}
        </div>
      )}

      {layer.type === "spot_block" && (() => {
        const lines = layer.metaLines.split("\n");
        const dishLine = lines[0] ?? "";
        const locationLine = lines.slice(1).join(" · ");
        const usePinBadge = layer.showLocationPin !== false && Boolean(locationLine);
        const priceFont = layer.priceFont ?? "pally";
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems:
                layer.align === "left"
                  ? "flex-start"
                  : layer.align === "right"
                  ? "flex-end"
                  : "center",
              textAlign: layer.align,
              pointerEvents: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={layer.logoSrc}
              alt={layer.label}
              draggable={false}
              style={{
                width: layer.logoWidth,
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
            {dishLine && (
              <div
                style={{
                  fontFamily: getFontFamilyCss("pally"),
                  fontWeight: 700,
                  fontSize: (layer.metaFontSize ?? 20) + 2,
                  lineHeight: 1.22,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: layer.textColor,
                  marginTop: 10,
                }}
              >
                {dishLine}
              </div>
            )}
            {locationLine && (
              usePinBadge ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    padding: "5px 12px 5px 8px",
                    borderRadius: 999,
                    background: "#EDE5D6",
                    border: "1px solid rgba(36, 28, 22, 0.12)",
                    fontFamily: getFontFamilyCss("jakarta"),
                    fontWeight: 700,
                    fontSize: Math.max(15, (layer.metaFontSize ?? 20) - 2),
                    lineHeight: 1.15,
                    color: "#241C16",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ad-slides/banh-mi/push-pin.png"
                    alt=""
                    draggable={false}
                    style={{
                      height: Math.max(20, (layer.metaFontSize ?? 20) + 2),
                      width: "auto",
                      objectFit: "contain",
                      flexShrink: 0,
                      transform: "rotate(-10deg)",
                    }}
                  />
                  <span>{locationLine}</span>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: getFontFamilyCss("jakarta"),
                    fontWeight: 700,
                    fontSize: layer.metaFontSize ?? 20,
                    lineHeight: 1.35,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: layer.textColor,
                    marginTop: 4,
                  }}
                >
                  {locationLine}
                </div>
              )
            )}
            <div
              style={{
                fontFamily: getFontFamilyCss(priceFont),
                fontWeight: priceFont === "jakarta" ? 800 : 700,
                fontSize: layer.priceFontSize ?? 38,
                letterSpacing: priceFont === "comico" ? "0.02em" : "-0.025em",
                lineHeight: 1.08,
                color: layer.priceColor,
                marginTop: 7,
              }}
            >
              {layer.price}
            </div>
          </div>
        );
      })()}

      {/* Interactive Selection Handles (never rendered during export) */}
      {isSelected && !layer.locked && (
        <>
          {/* Top Rotate Handle */}
          <button
            type="button"
            onPointerDown={(e) => onRotateDown(e, boxRef.current)}
            title="Drag to rotate"
            style={{
              position: "absolute",
              left: "50%",
              top: -Math.round(34 * invScale),
              transform: "translateX(-50%)",
              width: Math.round(22 * invScale),
              height: Math.round(22 * invScale),
              borderRadius: "50%",
              background: "#E84A27",
              color: "#FFFFFF",
              border: `${Math.max(2, Math.round(2 * invScale))}px solid #FFFFFF`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            <RotateCw style={{ width: Math.round(11 * invScale), height: Math.round(11 * invScale) }} />
          </button>

          {/* Bottom-Right Resize Handle */}
          <div
            onPointerDown={(e) => onResizeDown(e, "se")}
            title="Drag to resize"
            style={{
              position: "absolute",
              right: -Math.round(handleSize / 2),
              bottom: -Math.round(handleSize / 2),
              width: handleSize,
              height: handleSize,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `${Math.max(2, Math.round(2.5 * invScale))}px solid #E84A27`,
              cursor: "nwse-resize",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          />

          {/* Right/Bottom Edge Handles for Shapes & Fixed-Height Images/Cards */}
          {(layer.type === "shape" || layer.height !== undefined) && (
            <>
              <div
                onPointerDown={(e) => onResizeDown(e, "e")}
                title="Drag to resize width"
                style={{
                  position: "absolute",
                  right: -Math.round(handleSize / 2),
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: handleSize,
                  height: Math.round(handleSize * 1.4),
                  borderRadius: 6,
                  background: "#FFFFFF",
                  border: `${Math.max(2, Math.round(2 * invScale))}px solid #E84A27`,
                  cursor: "ew-resize",
                }}
              />
              <div
                onPointerDown={(e) => onResizeDown(e, "s")}
                title="Drag to resize height"
                style={{
                  position: "absolute",
                  bottom: -Math.round(handleSize / 2),
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: Math.round(handleSize * 1.4),
                  height: handleSize,
                  borderRadius: 6,
                  background: "#FFFFFF",
                  border: `${Math.max(2, Math.round(2 * invScale))}px solid #E84A27`,
                  cursor: "ns-resize",
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-bold text-zinc-400 block mb-1">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(min !== undefined ? Math.max(min, n) : n);
        }}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-xs text-white font-bold tabular-nums"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onReset,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onReset?: () => void;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 mb-1">
        <span>{label}</span>
        {onReset && value !== 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] text-[#e84a27] hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#e84a27] cursor-pointer"
      />
    </div>
  );
}

function ColorSwatchPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <span className="text-[11px] font-bold text-zinc-400 block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {SMAKR_POSTER_SWATCHES.map((sw) => (
          <button
            key={sw.hex}
            type="button"
            onClick={() => onChange(sw.hex)}
            title={`${sw.label} (${sw.hex})`}
            className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
              value.toUpperCase() === sw.hex ? "border-[#e84a27] scale-105" : "border-white/20"
            }`}
            style={{ background: sw.hex }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded-md bg-transparent border border-white/20 cursor-pointer"
        />
      </div>
    </div>
  );
}

function AlignPicker({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (align: "left" | "center" | "right") => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {(
        [
          ["left", AlignLeft],
          ["center", AlignCenter],
          ["right", AlignRight],
        ] as const
      ).map(([id, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`py-1.5 rounded-lg flex items-center justify-center cursor-pointer ${
            value === id
              ? "bg-[#e84a27] text-white"
              : "bg-white/5 text-zinc-400 hover:text-white"
          }`}
          title={`Align ${id}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
