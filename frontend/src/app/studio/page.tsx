'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StudioCanvas } from '@/components/studio/StudioCanvas';
import { StudioControls } from '@/components/studio/StudioControls';
import {
  downloadFiles,
  makeFile,
  renderSlide,
  shareFiles,
} from '@/lib/studioExport';
import {
  CANVAS_SIZES,
  type ElementKind,
  type ExportFormat,
  type MapShotState,
  type PhotoState,
  type SlideId,
  type StudioElement,
  type StudioState,
  type WallpaperState,
} from '@/types/studio';

const INITIAL: StudioState = {
  aspectRatio: '9:16',
  showSafeZones: false,
  showNoiseTexture: true,
  wallpaper: {
    text: 'SMAKR',
    rows: 9,
    cols: 2,
    size: 1,
    colorMode: 'oranges', // Default: each logo in the grid has a Nordic orange shade
    baseColor: '#e84a27',
    variation: 1,
    seed: 1,
    heroColor: '#ffffff',
    heroRow: 4,
    bgColor: '#FAF7F2',
    bgColor2: '#e84a27',
    bgGradient: false,
    stagger: true,
    outline: false,
    glass: false,
    shadow: false,
    tilt: 0,
    opacity: 1,
    blur: 0,
  },
  map: {
    venueId: null,
    name: 'Digg Pizza - Grønland',
    address: 'Grønlandsleiret 1, 0190 Oslo, Norway',
    icon: '🍕',
    rating: 4.9,
    photo:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    lng: 10.761,
    lat: 59.913,
    style: 'streets',
    zoom: 15.5,
    pitch: 0,
    pinY: 0.35,
    showPin: true,
    pinScale: 1,
    cardPosition: 'below',
    cardY: 0.55,
    cardTheme: 'cream',
    cardScale: 1,
    cardWidth: 860,
    cardRadius: 44,
    showPhoto: true,
    showRating: true,
    showAddress: true,
    showButtons: true,
    mapLabel: 'Map ↗',
    detailsLabel: 'Details →',
  },
  photo: {
    src: null,
    fit: 'cover',
    zoom: 1,
    dim: 0,
    grayscale: false,
    blur: 0,
    vignette: false,
    bgColor: '#181615',
  },
  elements: {
    wallpaper: [],
    map: [],
    photo: [],
  },
};

const DEFAULTS: Record<ElementKind, Partial<StudioElement>> = {
  text: { color: '#2B1810', font: 'comico', bgColor: '', strokeWidth: 0, strokeColor: '#000000', shadow: false },
  mascot: {
    bubble: 'Week drop is live! ✦',
    bubbleSide: 'top',
    bubbleStyle: 'round',
    bubbleBg: '#ffffff',
    bubbleInk: '#181615',
    flip: false,
  },
  badge: { color: '#e84a27', bgColor: '#FAF7F2', shadow: true },
  image: { opacity: 1 },
};

const SLIDES_ORDER: SlideId[] = ['wallpaper', 'map', 'photo'];

export default function StudioPage() {
  const [state, setState] = useState<StudioState>(INITIAL);
  const [activeSlide, setActiveSlide] = useState<SlideId>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('slide');
      if (p === 'wallpaper' || p === 'map' || p === 'photo') return p;
    }
    return 'map';
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.3);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLDivElement>(null);
  const [offscreenSlide, setOffscreenSlide] = useState<SlideId>('wallpaper');

  const { w, h } = CANVAS_SIZES[state.aspectRatio];

  const update = useCallback((patch: Partial<StudioState>) => setState((s) => ({ ...s, ...patch })), []);
  const wp = useCallback((patch: Partial<WallpaperState>) => setState((s) => ({ ...s, wallpaper: { ...s.wallpaper, ...patch } })), []);
  const mp = useCallback((patch: Partial<MapShotState>) => setState((s) => ({ ...s, map: { ...s.map, ...patch } })), []);
  const pp = useCallback((patch: Partial<PhotoState>) => setState((s) => ({ ...s, photo: { ...s.photo, ...patch } })), []);

  const patchElement = useCallback(
    (id: string, patch: Partial<StudioElement>) =>
      setState((s) => ({
        ...s,
        elements: {
          ...s.elements,
          [activeSlide]: (s.elements[activeSlide] || []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
        },
      })),
    [activeSlide]
  );

  const addElement = useCallback(
    (kind: ElementKind, extra: Partial<StudioElement> = {}) => {
      const id = `el-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const el: StudioElement = {
        id,
        kind,
        x: w / 2,
        y: h / 2,
        scale: 1,
        rotation: 0,
        opacity: 1,
        text: '',
        color: '#2B1810',
        font: 'comico',
        bgColor: '',
        strokeWidth: 0,
        strokeColor: '#000000',
        shadow: false,
        bubble: '',
        bubbleStyle: 'round',
        bubbleSide: 'top',
        bubbleBg: '#ffffff',
        bubbleInk: '#181615',
        flip: false,
        src: null,
        ...DEFAULTS[kind],
        ...extra,
      };
      setState((s) => ({
        ...s,
        elements: {
          ...s.elements,
          [activeSlide]: [...(s.elements[activeSlide] || []), el],
        },
      }));
      setSelectedId(id);
    },
    [w, h, activeSlide]
  );

  const removeElement = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        elements: {
          ...s.elements,
          [activeSlide]: (s.elements[activeSlide] || []).filter((e) => e.id !== id),
        },
      }));
      setSelectedId(null);
    },
    [activeSlide]
  );

  // Maintain preview scale proportional to stage container bounds
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const padding = 20;
      setScale(Math.min((el.clientWidth - padding) / w, (el.clientHeight - padding) / h));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  const cycleSlide = (dir: 'prev' | 'next') => {
    const idx = SLIDES_ORDER.indexOf(activeSlide);
    const nextIdx =
      dir === 'next'
        ? (idx + 1) % SLIDES_ORDER.length
        : (idx - 1 + SLIDES_ORDER.length) % SLIDES_ORDER.length;
    setActiveSlide(SLIDES_ORDER[nextIdx]);
    setSelectedId(null);
  };

  const executeExport = async (
    format: ExportFormat,
    allSlides: boolean,
    pixelRatio: number,
    mode: 'share' | 'download'
  ) => {
    if (!canvasRef.current) return;
    setExporting(true);
    setExportError(null);
    setSelectedId(null);

    try {
      await new Promise((r) => setTimeout(r, 350));
      const files: File[] = [];

      // 1. Current active slide
      const blobActive = await renderSlide(canvasRef.current, format, w, h, pixelRatio);
      const nameActive = `smakr-${activeSlide}-${state.aspectRatio.replace(':', 'x')}`;
      files.push(makeFile(blobActive, nameActive, format));

      // 2. Additional slides if all requested
      if (allSlides && offscreenRef.current) {
        const others = SLIDES_ORDER.filter((s) => s !== activeSlide);
        for (const other of others) {
          setOffscreenSlide(other);
          await new Promise((r) => setTimeout(r, 400));
          if (offscreenRef.current) {
            const blobOther = await renderSlide(offscreenRef.current, format, w, h, pixelRatio);
            const nameOther = `smakr-${other}-${state.aspectRatio.replace(':', 'x')}`;
            files.push(makeFile(blobOther, nameOther, format));
          }
        }
      }

      if (mode === 'share') {
        const shared = await shareFiles(files);
        if (!shared) {
          await downloadFiles(files);
        }
      } else {
        await downloadFiles(files);
      }
    } catch (err) {
      console.error('Export failed', err);
      setExportError('Export failed. Ensure all images and map tiles are fully loaded.');
    } finally {
      setExporting(false);
    }
  };

  const selected = (state.elements[activeSlide] || []).find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh w-full max-w-full flex-col overflow-hidden bg-[#141211] font-jakarta select-none">
      {/* Top Header Chrome */}
      <header className="flex h-12 shrink-0 items-center justify-between px-3 border-b border-white/5 bg-[#191716]">
        <Link
          href="/"
          className="min-h-[44px] content-center text-xs font-bold text-zinc-300 hover:text-white transition-colors"
        >
          ← Back to Radar
        </Link>

        {/* Center Slide Indicator Pills */}
        <div className="flex rounded-full bg-white/10 p-0.5">
          <button
            onClick={() => {
              setActiveSlide('wallpaper');
              setSelectedId(null);
            }}
            className={`min-h-[30px] rounded-full px-3 text-xs font-bold transition-all ${
              activeSlide === 'wallpaper'
                ? 'bg-[#e84a27] text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Wallpaper
          </button>
          <button
            onClick={() => {
              setActiveSlide('map');
              setSelectedId(null);
            }}
            className={`min-h-[30px] rounded-full px-3 text-xs font-bold transition-all ${
              activeSlide === 'map'
                ? 'bg-[#e84a27] text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => {
              setActiveSlide('photo');
              setSelectedId(null);
            }}
            className={`min-h-[30px] rounded-full px-3 text-xs font-bold transition-all ${
              activeSlide === 'photo'
                ? 'bg-[#e84a27] text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Photo
          </button>
        </div>

        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          {state.aspectRatio}
        </span>
      </header>

      {/* Main Content Area: Responsive Stack (Mobile: Column, Desktop: Row) */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0 w-full max-w-full">
        {/* Main Preview Stage */}
        <section
          ref={stageRef}
          className="relative flex min-h-0 basis-[46%] lg:basis-auto lg:flex-1 items-center justify-center p-3 bg-[#100e0d] overflow-hidden w-full max-w-full"
        >
          {/* Left / Right Slide Navigation Chevrons */}
          <button
            onClick={() => cycleSlide('prev')}
            className="absolute left-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 text-base active:scale-95 transition-all shadow-lg"
            title="Previous Slide"
          >
            ‹
          </button>
          <button
            onClick={() => cycleSlide('next')}
            className="absolute right-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 text-base active:scale-95 transition-all shadow-lg"
            title="Next Slide"
          >
            ›
          </button>

          {/* Live Scaled Canvas */}
          <div
            style={{ width: w * scale, height: h * scale }}
            className="relative shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
          >
            <div
              style={{
                width: w,
                height: h,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <StudioCanvas
                ref={canvasRef}
                state={state}
                activeSlide={activeSlide}
                previewScale={scale}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={(id, x, y) => patchElement(id, { x, y })}
                onMapChange={(coords, zoom, pitch) => {
                  mp({ lng: coords[0], lat: coords[1], zoom, pitch });
                }}
              />
            </div>
          </div>

          {/* Hidden Offscreen Canvas for Exporting Non-Active Slides */}
          <div className="fixed -top-[99999px] -left-[99999px] pointer-events-none opacity-0 overflow-hidden w-0 h-0" aria-hidden>
            <StudioCanvas
              ref={offscreenRef}
              state={state}
              activeSlide={offscreenSlide}
              previewScale={1}
              selectedId={null}
              onSelect={() => {}}
              onMove={() => {}}
            />
          </div>
        </section>

        {/* Controls Drawer (Mobile: bottom drawer, Desktop: right inspector sidebar) */}
        <section className="min-h-0 flex-1 lg:flex-initial lg:w-[420px] lg:h-full overflow-hidden rounded-t-3xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#191716] w-full max-w-full">
          <StudioControls
            state={state}
            activeSlide={activeSlide}
            onSelectSlide={(slide) => {
              setActiveSlide(slide);
              setSelectedId(null);
            }}
            update={update}
            wp={wp}
            mp={mp}
            pp={pp}
            selected={selected}
            addElement={addElement}
            patchElement={patchElement}
            removeElement={removeElement}
            selectElement={setSelectedId}
            onExport={(format, all, pr) => executeExport(format, all, pr, 'share')}
            onDownloadOnly={(format, all, pr) => executeExport(format, all, pr, 'download')}
            exporting={exporting}
            exportError={exportError}
          />
        </section>
      </div>
    </div>
  );
}
