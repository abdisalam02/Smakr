'use client';

import { useEffect, useState } from 'react';
import {
  PALETTES,
  MASCOT_EXPRESSIONS,
  type AspectRatio,
  type BubbleSide,
  type BubbleStyle,
  type CardTheme,
  type ColorMode,
  type ElementKind,
  type ExportFormat,
  type MapShotState,
  type MapStyleKey,
  type PhotoState,
  type SlideId,
  type StudioElement,
  type StudioState,
  type WallpaperState,
} from '@/types/studio';
import type { Venue } from '@/types';
import { fetchVenues } from '@/lib/supabase/data';
import { Color, HighlightRowPicker, Slider, Toggle, field, pill, readFile } from './StudioUi';

type WpTab = 'grid' | 'effects' | 'add' | 'export';
type MapTab = 'spot' | 'card' | 'add' | 'export';
type PhotoTab = 'photo' | 'adjust' | 'add' | 'export';

interface Props {
  state: StudioState;
  activeSlide: SlideId;
  onSelectSlide: (slide: SlideId) => void;
  update: (patch: Partial<StudioState>) => void;
  wp: (patch: Partial<WallpaperState>) => void;
  mp: (patch: Partial<MapShotState>) => void;
  pp: (patch: Partial<PhotoState>) => void;
  selected: StudioElement | null;
  addElement: (kind: ElementKind, extra?: Partial<StudioElement>) => void;
  patchElement: (id: string, patch: Partial<StudioElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  onExport: (format: ExportFormat, allSlides: boolean, pixelRatio: number) => void;
  onDownloadOnly: (format: ExportFormat, allSlides: boolean, pixelRatio: number) => void;
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
    mp,
    pp,
    selected,
    addElement,
    patchElement,
    removeElement,
    selectElement,
    onExport,
    onDownloadOnly,
    exporting,
    exportError,
  } = props;

  const [wpTab, setWpTab] = useState<WpTab>('grid');
  const [mapTab, setMapTab] = useState<MapTab>('spot');
  const [ppTab, setPpTab] = useState<PhotoTab>('photo');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportAll, setExportAll] = useState(false);
  const [exportRetina, setExportRetina] = useState(false);

  useEffect(() => {
    fetchVenues().then(setVenues).catch(() => setVenues([]));
  }, []);

  const pickVenue = (v: Venue) => {
    mp({
      venueId: v.id,
      name: v.name,
      address: v.address,
      icon: v.icon || '🍽️',
      rating: v.google_rating ?? null,
      photo: v.cover_image_url ?? null,
      lng: v.longitude,
      lat: v.latitude,
    });
  };

  const w = state.wallpaper;
  const m = state.map;
  const p = state.photo;
  const currentElements = state.elements[activeSlide] || [];

  return (
    <div className="flex h-full w-full max-w-full flex-col font-jakarta select-none overflow-hidden">
      {/* 3-Slide Top Switcher Pill Bar */}
      <div className="flex items-center px-3 py-2 bg-[#FAF7F2] dark:bg-[#191716] border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={() => onSelectSlide('wallpaper')}
            className={`min-h-[38px] flex-1 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSlide === 'wallpaper'
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            1. Wallpaper
          </button>
          <button
            onClick={() => onSelectSlide('map')}
            className={`min-h-[38px] flex-1 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSlide === 'map'
                ? 'bg-[#e84a27] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            2. Map Spotlight
          </button>
          <button
            onClick={() => onSelectSlide('photo')}
            className={`min-h-[38px] flex-1 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSlide === 'photo'
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            3. Custom Photo
          </button>
        </div>
      </div>

      {/* Secondary Contextual Tabs */}
      <nav
        className="sticky top-0 z-10 flex gap-1 overflow-x-auto bg-[#FAF7F2] p-2 dark:bg-[#1d1b1a] border-b border-black/5 dark:border-white/5"
        role="tablist"
      >
        {activeSlide === 'wallpaper' ? (
          <>
            {(
              [
                ['grid', '🎨 Grid & Colors'],
                ['effects', '✨ Effects'],
                ['add', '✦ Addons'],
                ['export', '💾 Export'],
              ] as [WpTab, string][]
            ).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setWpTab(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${
                  wpTab === t
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {l}
              </button>
            ))}
          </>
        ) : activeSlide === 'map' ? (
          <>
            {(
              [
                ['spot', '📍 Spot & Map'],
                ['card', '🪪 Card Style'],
                ['add', '✦ Addons'],
                ['export', '💾 Export'],
              ] as [MapTab, string][]
            ).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setMapTab(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${
                  mapTab === t
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {l}
              </button>
            ))}
          </>
        ) : (
          <>
            {(
              [
                ['photo', '🖼️ Photo & Fit'],
                ['adjust', '✨ Adjustments'],
                ['add', '✦ Addons'],
                ['export', '💾 Export'],
              ] as [PhotoTab, string][]
            ).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setPpTab(t)}
                className={`min-h-[40px] flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${
                  ppTab === t
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {l}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Main Drawer Controls Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Instagram Format / Dimensions Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xs">
          <div>
            <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Format Dimensions
            </span>
            <span className="text-[10px] text-zinc-500">
              {state.aspectRatio === '9:16'
                ? 'Story (1080 × 1920)'
                : state.aspectRatio === '4:5'
                ? 'Feed (1080 × 1350)'
                : 'Square (1080 × 1080)'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {(['9:16', '4:5', '1:1'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update({ aspectRatio: r })}
                className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all ${
                  state.aspectRatio === r
                    ? 'bg-[#e84a27] text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10'
                }`}
              >
                {r === '9:16' ? '📱 9:16' : r === '4:5' ? '🖼️ 4:5' : '⏹️ 1:1'}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SLIDE 1: WALLPAPER CONTROLS */}
        {/* ======================================================== */}
        {activeSlide === 'wallpaper' && wpTab === 'grid' && (
          <>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Wallpaper Word
              </span>
              <input
                className={`${field} font-comico uppercase tracking-wider`}
                value={w.text}
                maxLength={12}
                onChange={(e) => wp({ text: e.target.value.toUpperCase() })}
                placeholder="SMAKR"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Grid Logo Colors
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['oranges', '🔥 Nordic Orange Shades (Default)'],
                    ['tint', '🎨 Single Tint'],
                    ['greyscale', '🔘 Greyscale'],
                    ['solid', '⬛ Solid Color'],
                  ] as [ColorMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    className={pill(w.colorMode === mode)}
                    onClick={() => wp({ colorMode: mode })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {w.colorMode === 'oranges' && (
              <button
                onClick={() => wp({ seed: Math.floor(Math.random() * 80) + 1 })}
                className="w-full min-h-[42px] rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-orange-300/40"
              >
                🔀 Shuffle Orange Shades Across Grid
              </button>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Preset Palettes
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
                    className="flex shrink-0 items-center gap-2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-xs transition-transform active:scale-95 text-xs font-semibold"
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/10 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${pal.bgColor} 50%, ${pal.baseColor} 50%)`,
                      }}
                    />
                    <span>{pal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Curated Color Swatches
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <Color name="Background" value={w.bgColor} onChange={(v) => wp({ bgColor: v })} />
                <Color name="Logo Base" value={w.baseColor} onChange={(v) => wp({ baseColor: v })} />
              </div>

              {/* Highlight Row Picker & Color */}
              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
                <HighlightRowPicker
                  totalRows={w.rows}
                  heroRow={w.heroRow}
                  onChange={(r) => wp({ heroRow: r })}
                />
                {w.heroRow >= 0 && (
                  <div className="pt-2 border-t border-black/5 dark:border-white/5">
                    <Color
                      name="Highlight Row Color"
                      value={w.heroColor}
                      onChange={(v) => wp({ heroColor: v })}
                    />
                  </div>
                )}
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
          </>
        )}

        {activeSlide === 'wallpaper' && wpTab === 'effects' && (
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

        {/* ======================================================== */}
        {/* SLIDE 2: LIVE MAP SPOTLIGHT CONTROLS */}
        {/* ======================================================== */}
        {activeSlide === 'map' && mapTab === 'spot' && (
          <>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Select Oslo Venue
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {venues.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => pickVenue(v)}
                    className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      m.venueId === v.id
                        ? 'bg-[#e84a27] border-[#e84a27] text-white shadow-sm'
                        : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <span>{v.icon || '🍽️'}</span>
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Map Vector Theme
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(
                  [
                    ['streets', 'Streets v2 (Color)'],
                    ['dataviz', 'Dataviz (Light Monochrome)'],
                    ['aquarelle', 'Aquarelle (Artistic)'],
                  ] as [MapStyleKey, string][]
                ).map(([styleKey, label]) => (
                  <button
                    key={styleKey}
                    className={pill(m.style === styleKey)}
                    onClick={() => mp({ style: styleKey })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Slider
                name="Map Zoom"
                value={m.zoom}
                min={12}
                max={18}
                step={0.1}
                onChange={(v) => mp({ zoom: v })}
              />
              <Slider
                name="3D Building Pitch"
                value={m.pitch}
                min={0}
                max={60}
                onChange={(v) => mp({ pitch: v })}
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
              <span className="shrink-0">📍</span>
              <span>Accurate GPS alignment: Map center and marker pin are statically locked to the venue coordinates.</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Venue Custom Text
              </span>
              <input
                className={field}
                placeholder="Venue Name"
                value={m.name}
                onChange={(e) => mp({ name: e.target.value })}
              />
              <input
                className={field}
                placeholder="Address"
                value={m.address}
                onChange={(e) => mp({ address: e.target.value })}
              />
            </div>
          </>
        )}

        {activeSlide === 'map' && mapTab === 'card' && (
          <>
            {/* Card Theme Picker */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Card Visual Theme
              </span>
              <div className="flex gap-2">
                {(
                  [
                    ['cream', 'Warm Cream (Oat)'],
                    ['dark', 'Espresso Dark'],
                    ['paprika', 'Burnt Paprika'],
                  ] as [CardTheme, string][]
                ).map(([themeKey, label]) => (
                  <button
                    key={themeKey}
                    className={pill(m.cardTheme === themeKey)}
                    onClick={() => mp({ cardTheme: themeKey })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proportional Card Uniform Scale */}
            <div className="space-y-1 pt-1">
              <Slider
                name="Proportional Card Scale"
                value={m.cardScale}
                min={0.35}
                max={1.35}
                step={0.05}
                onChange={(v) => mp({ cardScale: v })}
              />
              <p className="text-[11px] text-zinc-500">
                Scales cleanly from compact (0.35x) to prominent (1.35x) with zero text cramping.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Slider
                name="Corner Radius"
                value={m.cardRadius || 44}
                min={12}
                max={68}
                onChange={(v) => mp({ cardRadius: v })}
              />
              <Slider
                name="Pin Size"
                value={m.pinScale || 1}
                min={0.6}
                max={1.5}
                step={0.05}
                onChange={(v) => mp({ pinScale: v })}
              />
            </div>

            {/* Elements Visibility Toggles */}
            <div className="space-y-1 pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Card Elements Visibility
              </span>
              <div className="flex flex-wrap gap-2">
                <Toggle name="Show Rating" on={m.showRating} onChange={(v) => mp({ showRating: v })} />
                <Toggle name="Show Address" on={m.showAddress} onChange={(v) => mp({ showAddress: v })} />
                <Toggle name="Show Buttons" on={m.showButtons} onChange={(v) => mp({ showButtons: v })} />
                <Toggle name="Show Photo" on={m.showPhoto} onChange={(v) => mp({ showPhoto: v })} />
                <Toggle name="Show Marker Pin" on={m.showPin} onChange={(v) => mp({ showPin: v })} />
              </div>
            </div>

            {m.showButtons && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input
                  className={field}
                  placeholder="Left Button"
                  value={m.mapLabel}
                  onChange={(e) => mp({ mapLabel: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Right Button"
                  value={m.detailsLabel}
                  onChange={(e) => mp({ detailsLabel: e.target.value })}
                />
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* SLIDE 3: CUSTOM PHOTO CONTROLS */}
        {/* ======================================================== */}
        {activeSlide === 'photo' && ppTab === 'photo' && (
          <>
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Upload Custom Photo
              </span>
              <label className={`${pill(false)} flex cursor-pointer items-center justify-center gap-2 text-center`}>
                📁 Pick Photo from Device
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
            </div>

            {p.src && (
              <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Framing Fit
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
                  name="Letterbox Fill"
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
                max={0.85}
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

        {/* ======================================================== */}
        {/* ADDONS TAB (SHARED ACROSS ALL 3 SLIDES) */}
        {/* ======================================================== */}
        {((activeSlide === 'wallpaper' && wpTab === 'add') ||
          (activeSlide === 'map' && mapTab === 'add') ||
          (activeSlide === 'photo' && ppTab === 'add')) && (
          <>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Add Elements to Active Slide ({activeSlide.toUpperCase()})
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
              </div>
            </div>

            {/* Layers List */}
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

                    {/* Mascot Expression & Mood Picker */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Mascot Mood & Expression
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {MASCOT_EXPRESSIONS.map((exp) => (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => patchElement(selected.id, { expression: exp.id })}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                              (selected.expression || 'smile') === exp.id
                                ? 'bg-[#e84a27] border-[#e84a27] text-white shadow-xs'
                                : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#e84a27]/40'
                            }`}
                          >
                            <span>{exp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500">Speech Bubble Text</span>
                        <span className="text-[10px] text-zinc-400">{selected.bubble.length}/60</span>
                      </div>
                      <textarea
                        className={`${field} py-2`}
                        rows={2}
                        maxLength={60}
                        placeholder="Say something! (leave empty to hide)"
                        value={selected.bubble}
                        onChange={(e) => patchElement(selected.id, { bubble: e.target.value })}
                      />

                      {/* Quick Catchphrases */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {[
                          'Week 41 Drop is live! ✦',
                          'Crust was insane 🔥',
                          '100% Certified Gem 💎',
                          'Best coffee in Oslo ☕',
                          'Save this for the weekend! ↗',
                        ].map((phrase) => (
                          <button
                            key={phrase}
                            type="button"
                            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-[#e84a27] hover:text-[#e84a27] transition-colors"
                            onClick={() => patchElement(selected.id, { bubble: phrase })}
                          >
                            {phrase}
                          </button>
                        ))}
                      </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

        {/* ======================================================== */}
        {/* EXPORT TAB (FOR ALL SLIDES) */}
        {/* ======================================================== */}
        {((activeSlide === 'wallpaper' && wpTab === 'export') ||
          (activeSlide === 'map' && mapTab === 'export') ||
          (activeSlide === 'photo' && ppTab === 'export')) && (
          <div className="space-y-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Export Configuration
            </span>

            {/* Format Selection */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Image Format</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  className={pill(exportFormat === 'png')}
                  onClick={() => setExportFormat('png')}
                >
                  PNG (Lossless 2K)
                </button>
                <button
                  className={pill(exportFormat === 'jpeg')}
                  onClick={() => setExportFormat('jpeg')}
                >
                  JPEG (Instagram Standard)
                </button>
              </div>
            </div>

            {/* Export Scope */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Export Scope</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  className={pill(!exportAll)}
                  onClick={() => setExportAll(false)}
                >
                  Current Slide ({activeSlide.toUpperCase()})
                </button>
                <button
                  className={pill(exportAll)}
                  onClick={() => setExportAll(true)}
                >
                  All 3 Slides (Carousel Set)
                </button>
              </div>
            </div>

            {/* Resolution Mode */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Resolution</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  className={pill(!exportRetina)}
                  onClick={() => setExportRetina(false)}
                >
                  1080p Standard (Exact Instagram Fit)
                </button>
                <button
                  className={pill(exportRetina)}
                  onClick={() => setExportRetina(true)}
                >
                  2160p 2K Retina (Ultra Crisp)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onExport(exportFormat, exportAll, exportRetina ? 2 : 1)}
                disabled={exporting}
                className="min-h-[52px] w-full rounded-2xl bg-[#e84a27] font-comico text-lg text-white shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {exporting ? 'Rendering Image…' : '⚡ Share to Instagram / Native Share'}
              </button>

              <button
                onClick={() => onDownloadOnly(exportFormat, exportAll, exportRetina ? 2 : 1)}
                disabled={exporting}
                className="min-h-[46px] w-full rounded-xl bg-white dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-sm border border-black/10 dark:border-white/10 shadow-sm active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                ⬇️ Direct Download Image ({exportFormat.toUpperCase()})
              </button>
            </div>

            {exporting && (
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#e84a27]" />
              </div>
            )}

            {exportError && <p className="text-sm text-red-600 font-medium">{exportError}</p>}

            <p className="text-xs text-zinc-400">
              Selection dashed outlines and safe-zone guides are automatically excluded from the final exported image.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
