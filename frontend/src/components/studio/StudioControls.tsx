'use client';

import { useState } from 'react';
import {
  PALETTES,
  type AspectRatio,
  type BubbleSide,
  type BubbleStyle,
  type ColorMode,
  type ElementKind,
  type PhotoState,
  type SlideId,
  type StudioElement,
  type StudioState,
  type WallpaperState,
} from '@/types/studio';
import { Color, Slider, Toggle, field, pill, readFile } from './StudioUi';
import { ExportFormat } from '@/lib/studioExport';

type WallpaperTab = 'grid' | 'effects' | 'add' | 'export';
type PhotoTab = 'photo' | 'adjust' | 'add' | 'export';

interface Props {
  state: StudioState;
  activeSlide: SlideId;
  onSelectSlide: (slide: SlideId) => void;
  update: (patch: Partial<StudioState>) => void;
  wp: (patch: Partial<WallpaperState>) => void;
  pp: (patch: Partial<PhotoState>) => void;
  selected: StudioElement | null;
  addElement: (kind: ElementKind, extra?: Partial<StudioElement>) => void;
  patchElement: (id: string, patch: Partial<StudioElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  onOpenMapCapture: () => void;
  onExport: (format: ExportFormat, bothSlides: boolean) => void;
  onDownloadOnly: (format: ExportFormat, bothSlides: boolean) => void;
  exporting: boolean;
  exportError: string | null;
}

export function StudioControls(props: Props) {
  const {
    state,
    activeSlide,
    onSelectSlide,
    update,
    wp,
    pp,
    selected,
    addElement,
    patchElement,
    removeElement,
    selectElement,
    onOpenMapCapture,
    onExport,
    onDownloadOnly,
    exporting,
    exportError,
  } = props;

  const [wpTab, setWpTab] = useState<WallpaperTab>('grid');
  const [ppTab, setPpTab] = useState<PhotoTab>('photo');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportBoth, setExportBoth] = useState(false);

  const w = state.wallpaper;
  const p = state.photo;
  const currentElements = state.elements[activeSlide] || [];

  return (
    <div className="flex h-full flex-col font-jakarta">
      {/* Slide Switcher Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#FAF7F2] dark:bg-[#1a1817] border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectSlide('background')}
            className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold transition-all ${
              activeSlide === 'background'
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            1. Logo Wallpaper
          </button>
          <button
            onClick={() => onSelectSlide('photo')}
            className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold transition-all ${
              activeSlide === 'photo'
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            2. Photo Canvas
          </button>
        </div>

        {/* Aspect Ratio Pill Selector */}
        <div className="flex gap-1">
          {(['9:16', '4:5', '1:1'] as AspectRatio[]).map((r) => (
            <button
              key={r}
              onClick={() => update({ aspectRatio: r })}
              className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                state.aspectRatio === r
                  ? 'bg-[#e84a27] border-[#e84a27] text-white'
                  : 'bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Segmented Sub-navigation Tabs */}
      <nav
        className="sticky top-0 z-10 flex gap-1 overflow-x-auto bg-[#FAF7F2] p-2 dark:bg-[#1f1d1b] border-b border-black/5 dark:border-white/5"
        role="tablist"
      >
        {activeSlide === 'background' ? (
          <>
            {(
              [
                ['grid', '🎨 Grid & Colors'],
                ['effects', '✨ Effects'],
                ['add', '✦ Add Ons'],
                ['export', '💾 Export'],
              ] as [WallpaperTab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setWpTab(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${
                  wpTab === t
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </>
        ) : (
          <>
            {(
              [
                ['photo', '🖼️ Photo & Source'],
                ['adjust', '✨ Adjustments'],
                ['add', '✦ Add Ons'],
                ['export', '💾 Export'],
              ] as [PhotoTab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setPpTab(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${
                  ppTab === t
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Main Controls Content Pane */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* SLIDE 1: WALLPAPER CONTROLS */}
        {activeSlide === 'background' && wpTab === 'grid' && (
          <>
            {/* Word input */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Wallpaper Text
              </span>
              <input
                className={`${field} font-comico uppercase tracking-wider`}
                value={w.text}
                maxLength={12}
                onChange={(e) => wp({ text: e.target.value.toUpperCase() })}
                placeholder="SMAKR"
              />
            </div>

            {/* Color Mode selector */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Logo Color Palette
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['oranges', '🔥 Shades of Orange (Default)'],
                    ['tint', '🎨 Single Tint'],
                    ['greyscale', '🔘 Greyscale'],
                    ['solid', '⬛ Solid Color'],
                  ] as [ColorMode, string][]
                ).map(([m, l]) => (
                  <button
                    key={m}
                    className={pill(w.colorMode === m)}
                    onClick={() => wp({ colorMode: m })}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Shuffle orange shades button */}
            {w.colorMode === 'oranges' && (
              <button
                onClick={() => wp({ seed: Math.floor(Math.random() * 50) + 1 })}
                className="w-full min-h-[42px] rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-orange-300/40"
              >
                🔀 Shuffle Orange Shades Across Grid
              </button>
            )}

            {/* Preset Color Swatches */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Preset Palettes
              </span>
              <div className="flex gap-2.5">
                {PALETTES.map((pal) => (
                  <button
                    key={pal.label}
                    onClick={() =>
                      wp({
                        bgColor: pal.bgColor,
                        baseColor: pal.baseColor,
                        heroColor: pal.heroColor,
                        colorMode: pal.colorMode,
                      })
                    }
                    title={pal.label}
                    className="h-10 w-10 rounded-full border-2 border-black/10 shadow-sm transition-transform active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${pal.bgColor} 50%, ${pal.baseColor} 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="flex flex-wrap gap-4 items-center pt-1">
              <Color name="Background" value={w.bgColor} onChange={(v) => wp({ bgColor: v })} />
              <Color name="Logo Base" value={w.baseColor} onChange={(v) => wp({ baseColor: v })} />
              <Color name="Highlight Row" value={w.heroColor} onChange={(v) => wp({ heroColor: v })} />
            </div>

            {/* Background gradient option */}
            <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <Toggle
                  name="Background Gradient"
                  on={w.bgGradient}
                  onChange={(v) => wp({ bgGradient: v })}
                />
                {w.bgGradient && (
                  <Color
                    name="Gradient End"
                    value={w.bgColor2 || '#e84a27'}
                    onChange={(v) => wp({ bgColor2: v })}
                  />
                )}
              </div>
            </div>

            {/* Grid dimension sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Slider
                name="Rows"
                value={w.rows}
                min={2}
                max={16}
                onChange={(v) => wp({ rows: v, heroRow: Math.min(w.heroRow, v - 1) })}
              />
              <Slider name="Columns" value={w.cols} min={1} max={8} onChange={(v) => wp({ cols: v })} />
            </div>

            <Slider
              name="Logo Scale"
              value={w.size}
              min={0.4}
              max={1.6}
              step={0.05}
              onChange={(v) => wp({ size: v })}
            />

            <Slider
              name="Highlight Row Index (0 = None)"
              value={w.heroRow + 1}
              min={0}
              max={w.rows}
              onChange={(v) => wp({ heroRow: v - 1 })}
            />
          </>
        )}

        {activeSlide === 'background' && wpTab === 'effects' && (
          <>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Grid Effects
              </span>
              <div className="flex flex-wrap gap-2">
                <Toggle name="Stagger Rows" on={w.stagger} onChange={(v) => wp({ stagger: v })} />
                <Toggle name="Outline Only" on={w.outline} onChange={(v) => wp({ outline: v })} />
                <Toggle name="Glassmorphism Cards" on={w.glass} onChange={(v) => wp({ glass: v })} />
                <Toggle name="Deep Text Shadow" on={w.shadow} onChange={(v) => wp({ shadow: v })} />
                <Toggle name="Noise Grain" on={state.showNoiseTexture} onChange={(v) => update({ showNoiseTexture: v })} />
                <Toggle name="Safe Zones" on={state.showSafeZones} onChange={(v) => update({ showSafeZones: v })} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Slider
                name="3D Tilt / Angle"
                value={w.tilt || 0}
                min={-30}
                max={30}
                onChange={(v) => wp({ tilt: v })}
              />
              <Slider
                name="Depth of Field Blur"
                value={w.blur || 0}
                min={0}
                max={16}
                onChange={(v) => wp({ blur: v })}
              />
              <Slider
                name="Wallpaper Opacity"
                value={w.opacity ?? 1}
                min={0.2}
                max={1}
                step={0.05}
                onChange={(v) => wp({ opacity: v })}
              />
            </div>
          </>
        )}

        {/* SLIDE 2: PHOTO CONTROLS */}
        {activeSlide === 'photo' && ppTab === 'photo' && (
          <>
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Photo Source
              </span>
              <div className="grid grid-cols-2 gap-3">
                <label className={`${pill(false)} flex cursor-pointer items-center justify-center gap-2 text-center`}>
                  📁 Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) =>
                      readFile(e.target.files?.[0], (src) =>
                        pp({ src, fit: 'cover', zoom: 1 })
                      )
                    }
                  />
                </label>

                <button
                  onClick={onOpenMapCapture}
                  className="min-h-[44px] rounded-full px-4 text-sm font-bold bg-[#e84a27] text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  🗺️ Map Snapshot
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Tap “Map Snapshot” to interactively frame any Oslo venue with live pins & styled cards.
              </p>
            </div>

            {p.src && (
              <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Framing
                  </span>
                  <div className="flex gap-2">
                    <button
                      className={pill(p.fit === 'cover')}
                      onClick={() => pp({ fit: 'cover' })}
                    >
                      Cover
                    </button>
                    <button
                      className={pill(p.fit === 'contain')}
                      onClick={() => pp({ fit: 'contain' })}
                    >
                      Contain
                    </button>
                  </div>
                </div>

                <Slider
                  name="Photo Zoom"
                  value={p.zoom || 1}
                  min={0.8}
                  max={2.5}
                  step={0.05}
                  onChange={(v) => pp({ zoom: v })}
                />

                <Color
                  name="Letterbox Canvas Color"
                  value={p.bgColor || '#181615'}
                  onChange={(v) => pp({ bgColor: v })}
                />

                <button
                  onClick={() => pp({ src: null })}
                  className="w-full py-2.5 text-xs text-red-600 font-bold border border-red-200 dark:border-red-950 rounded-xl"
                >
                  Clear Photo
                </button>
              </div>
            )}
          </>
        )}

        {activeSlide === 'photo' && ppTab === 'adjust' && (
          <>
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Photo Filters & Overlays
              </span>
              <div className="flex flex-wrap gap-2">
                <Toggle
                  name="Black & White"
                  on={p.grayscale}
                  onChange={(v) => pp({ grayscale: v })}
                />
                <Toggle
                  name="Vignette"
                  on={p.vignette}
                  onChange={(v) => pp({ vignette: v })}
                />
                <Toggle
                  name="Noise Grain"
                  on={state.showNoiseTexture}
                  onChange={(v) => update({ showNoiseTexture: v })}
                />
                <Toggle
                  name="Safe Zones"
                  on={state.showSafeZones}
                  onChange={(v) => update({ showSafeZones: v })}
                />
              </div>

              <Slider
                name="Dark Scrim / Dim"
                value={p.dim || 0}
                min={0}
                max={0.8}
                step={0.05}
                onChange={(v) => pp({ dim: v })}
              />

              <Slider
                name="Background Blur"
                value={p.blur || 0}
                min={0}
                max={20}
                onChange={(v) => pp({ blur: v })}
              />
            </div>
          </>
        )}

        {/* ADD ONS TAB (FOR EITHER SLIDE) */}
        {((activeSlide === 'background' && wpTab === 'add') ||
          (activeSlide === 'photo' && ppTab === 'add')) && (
          <>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Add Elements to {activeSlide === 'background' ? 'Wallpaper' : 'Photo'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  className={pill(false)}
                  onClick={() => addElement('text', { text: 'SMAKR OSLO' })}
                >
                  + Text
                </button>
                <button
                  className={pill(false)}
                  onClick={() =>
                    addElement('mascot', {
                      bubble: 'Week drop is live! ✦',
                      bubbleSide: 'top',
                      bubbleStyle: 'round',
                    })
                  }
                >
                  + Admin Mascot
                </button>
                <button
                  className={pill(false)}
                  onClick={() => addElement('badge', { text: '✦ WEEK DROP', color: '#e84a27' })}
                >
                  + Stamp Badge
                </button>
                <label className={`${pill(false)} flex cursor-pointer items-center`}>
                  + Image Sticker
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) =>
                      readFile(e.target.files?.[0], (src) => addElement('image', { src }))
                    }
                  />
                </label>
                <button className={pill(false)} onClick={onOpenMapCapture}>
                  + Map Snapshot Sticker
                </button>
              </div>
            </div>

            {/* List of active elements */}
            {currentElements.length > 0 && (
              <div className="space-y-1 pt-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Layers on this Slide ({currentElements.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentElements.map((el, i) => (
                    <button
                      key={el.id}
                      className={pill(selected?.id === el.id)}
                      onClick={() => selectElement(el.id)}
                    >
                      {i + 1}. {el.kind.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Element Editor */}
            {selected && (
              <div className="space-y-3 rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-black/5 dark:bg-white/5 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
                    Editing {selected.kind}
                  </span>
                  <button
                    onClick={() => removeElement(selected.id)}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Delete Layer
                  </button>
                </div>

                {/* TEXT SETTINGS */}
                {selected.kind === 'text' && (
                  <>
                    <textarea
                      className={`${field} py-2`}
                      rows={2}
                      value={selected.text}
                      onChange={(e) => patchElement(selected.id, { text: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      {(['comico', 'jakarta'] as const).map((f) => (
                        <button
                          key={f}
                          className={pill(selected.font === f)}
                          onClick={() => patchElement(selected.id, { font: f })}
                        >
                          {f}
                        </button>
                      ))}
                      <Toggle
                        name="Shadow"
                        on={selected.shadow}
                        onChange={(v) => patchElement(selected.id, { shadow: v })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Color
                        name="Text Color"
                        value={selected.color}
                        onChange={(v) => patchElement(selected.id, { color: v })}
                      />
                      <Color
                        name="Background Pill"
                        value={selected.bgColor || '#ffffff'}
                        onChange={(v) => patchElement(selected.id, { bgColor: v })}
                      />
                    </div>
                  </>
                )}

                {/* MASCOT SETTINGS */}
                {selected.kind === 'mascot' && (
                  <>
                    <div className="flex items-center justify-between">
                      <Toggle
                        name={selected.flip ? 'Facing Left 👈' : 'Facing Right 👉'}
                        on={selected.flip}
                        onChange={(v) => patchElement(selected.id, { flip: v })}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-500">Speech Bubble Text</span>
                      <textarea
                        className={`${field} py-2`}
                        rows={2}
                        maxLength={60}
                        placeholder="Say something! (leave empty to hide)"
                        value={selected.bubble}
                        onChange={(e) => patchElement(selected.id, { bubble: e.target.value })}
                      />
                      <p className="text-[10px] text-zinc-500">{selected.bubble.length}/60 chars</p>
                    </div>

                    {selected.bubble && (
                      <>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-zinc-500">Bubble Position</span>
                          <div className="flex gap-1">
                            {(['top', 'bottom', 'left', 'right'] as BubbleSide[]).map((side) => (
                              <button
                                key={side}
                                className={pill(selected.bubbleSide === side)}
                                onClick={() => patchElement(selected.id, { bubbleSide: side })}
                              >
                                {side}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-zinc-500">Bubble Shape</span>
                          <div className="flex gap-1">
                            {(['round', 'box', 'thought'] as BubbleStyle[]).map((style) => (
                              <button
                                key={style}
                                className={pill(selected.bubbleStyle === style)}
                                onClick={() => patchElement(selected.id, { bubbleStyle: style })}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                          <Color
                            name="Bubble Fill"
                            value={selected.bubbleBg || '#ffffff'}
                            onChange={(v) => patchElement(selected.id, { bubbleBg: v })}
                          />
                          <Color
                            name="Bubble Ink"
                            value={selected.bubbleInk || '#181615'}
                            onChange={(v) => patchElement(selected.id, { bubbleInk: v })}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* BADGE SETTINGS */}
                {selected.kind === 'badge' && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {['✦ WEEK DROP', 'OSLO FOOD RADAR', '100% OSLO CERTIFIED', 'SAVE THIS SPOT ↗'].map(
                        (preset) => (
                          <button
                            key={preset}
                            className={pill(selected.text === preset)}
                            onClick={() => patchElement(selected.id, { text: preset })}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                    <textarea
                      className={`${field} py-2`}
                      rows={1}
                      value={selected.text}
                      onChange={(e) => patchElement(selected.id, { text: e.target.value })}
                    />
                    <div className="flex gap-4 items-center">
                      <Color
                        name="Badge Color"
                        value={selected.color}
                        onChange={(v) => patchElement(selected.id, { color: v })}
                      />
                      <Color
                        name="Badge Background"
                        value={selected.bgColor || '#FAF7F2'}
                        onChange={(v) => patchElement(selected.id, { bgColor: v })}
                      />
                    </div>
                  </>
                )}

                {/* COMMON TRANSFORM SLIDERS */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Slider
                    name="Size"
                    value={selected.scale}
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    onChange={(v) => patchElement(selected.id, { scale: v })}
                  />
                  <Slider
                    name="Rotation"
                    value={selected.rotation}
                    min={-45}
                    max={45}
                    onChange={(v) => patchElement(selected.id, { rotation: v })}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* EXPORT TAB (FOR BOTH SLIDES) */}
        {((activeSlide === 'background' && wpTab === 'export') ||
          (activeSlide === 'photo' && ppTab === 'export')) && (
          <div className="space-y-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Export Configuration
            </span>

            {/* Format Selection */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">File Format</span>
              <div className="flex gap-2">
                <button
                  className={pill(exportFormat === 'png')}
                  onClick={() => setExportFormat('png')}
                >
                  PNG (Crisp 2K Retina)
                </button>
                <button
                  className={pill(exportFormat === 'jpeg')}
                  onClick={() => setExportFormat('jpeg')}
                >
                  JPEG (Instagram Standard)
                </button>
              </div>
            </div>

            {/* Target Selection */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Export Scope</span>
              <div className="flex gap-2">
                <button
                  className={pill(!exportBoth)}
                  onClick={() => setExportBoth(false)}
                >
                  Current Slide ({activeSlide === 'background' ? '1. Wallpaper' : '2. Photo'})
                </button>
                <button
                  className={pill(exportBoth)}
                  onClick={() => setExportBoth(true)}
                >
                  Both Slides (Carousel Set)
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onExport(exportFormat, exportBoth)}
                disabled={exporting}
                className="min-h-[52px] w-full rounded-2xl bg-[#e84a27] font-comico text-lg text-white shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {exporting ? 'Rendering Image…' : '⚡ Share to Instagram / Native Share'}
              </button>

              <button
                onClick={() => onDownloadOnly(exportFormat, exportBoth)}
                disabled={exporting}
                className="min-h-[46px] w-full rounded-xl bg-white dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-sm border border-black/10 dark:border-white/10 shadow-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                ⬇️ Direct Download Only ({exportFormat.toUpperCase()})
              </button>
            </div>

            {exporting && (
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#e84a27]" />
              </div>
            )}

            {exportError && <p className="text-sm text-red-600 font-medium">{exportError}</p>}

            <p className="text-xs text-zinc-400">
              Selection dashed outlines and safe-zone hatched bars are automatically excluded from the final exported image.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
