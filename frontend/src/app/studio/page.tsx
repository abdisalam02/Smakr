'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StudioCanvas } from '@/components/studio/StudioCanvas';
import { StudioControls } from '@/components/studio/StudioControls';
import { MapCaptureModal } from '@/components/studio/MapCaptureModal';
import {
  downloadFiles,
  makeFile,
  renderSlide,
  shareFiles,
  type ExportFormat,
} from '@/lib/studioExport';
import {
  CANVAS_SIZES,
  type CaptureSize,
  type ElementKind,
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
    colorMode: 'oranges', // Default: each logo in the grid has a shade of orange
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
  map: {
    venueId: null,
    name: 'Ochaya - The Matcha Bar',
    address: 'Bernt Ankers gate 6a, 0183 Oslo, Norway',
    icon: '🍵',
    rating: 4.9,
    photo: null,
    lng: 10.7516,
    lat: 59.9171,
    style: 'streets',
    zoom: 15.2,
    pitch: 0,
    pinY: 0.34,
    showPin: true,
    pinScale: 1,
    cardPosition: 'below',
    cardTheme: 'cream',
    cardScale: 1,
    cardRadius: 48,
    showPhoto: false,
    showRating: true,
    showAddress: true,
    showButtons: true,
    mapLabel: 'Map ↗',
    detailsLabel: 'Details →',
  },
  captureSize: '4:5',
  elements: {
    background: [],
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

export default function StudioPage() {
  const [state, setState] = useState<StudioState>(INITIAL);
  const [activeSlide, setActiveSlide] = useState<SlideId>('background');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.3);
  const [isMapCaptureOpen, setIsMapCaptureOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLDivElement>(null);

  const { w, h } = CANVAS_SIZES[state.aspectRatio];

  const update = useCallback((patch: Partial<StudioState>) => setState((s) => ({ ...s, ...patch })), []);
  const wp = useCallback((patch: Partial<WallpaperState>) => setState((s) => ({ ...s, wallpaper: { ...s.wallpaper, ...patch } })), []);
  const pp = useCallback((patch: Partial<PhotoState>) => setState((s) => ({ ...s, photo: { ...s.photo, ...patch } })), []);
  const mp = useCallback((patch: Partial<MapShotState>) => setState((s) => ({ ...s, map: { ...s.map, ...patch } })), []);

  const patchElement = useCallback(
    (id: string, patch: Partial<StudioElement>) =>
      setState((s) => ({
        ...s,
        elements: {
          ...s.elements,
          [activeSlide]: s.elements[activeSlide].map((e) => (e.id === id ? { ...e, ...patch } : e)),
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
          [activeSlide]: [...s.elements[activeSlide], el],
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
          [activeSlide]: s.elements[activeSlide].filter((e) => e.id !== id),
        },
      }));
      setSelectedId(null);
    },
    [activeSlide]
  );

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min((el.clientWidth - 24) / w, (el.clientHeight - 24) / h));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  const handleMapCaptured = (dataUrl: string, target: 'slide-bg' | 'sticker') => {
    if (target === 'slide-bg') {
      pp({ src: dataUrl, fit: 'cover', zoom: 1 });
      setActiveSlide('photo');
    } else {
      addElement('image', { src: dataUrl });
    }
  };

  const executeExport = async (format: ExportFormat, bothSlides: boolean, mode: 'share' | 'download') => {
    if (!canvasRef.current) return;
    setExporting(true);
    setExportError(null);
    setSelectedId(null);

    try {
      await new Promise((r) => setTimeout(r, 300));
      const files: File[] = [];

      // 1. Current active slide
      const blob1 = await renderSlide(canvasRef.current, format);
      const name1 = `smakr-${activeSlide}-${state.aspectRatio.replace(':', 'x')}`;
      files.push(makeFile(blob1, name1, format));

      // 2. Secondary slide if both requested
      if (bothSlides && offscreenCanvasRef.current) {
        const otherSlide: SlideId = activeSlide === 'background' ? 'photo' : 'background';
        const blob2 = await renderSlide(offscreenCanvasRef.current, format);
        const name2 = `smakr-${otherSlide}-${state.aspectRatio.replace(':', 'x')}`;
        files.push(makeFile(blob2, name2, format));
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
      setExportError('Export failed. If using high-resolution images, check that they are fully loaded.');
    } finally {
      setExporting(false);
    }
  };

  const selected = state.elements[activeSlide]?.find((e) => e.id === selectedId) ?? null;
  const otherSlide: SlideId = activeSlide === 'background' ? 'photo' : 'background';

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#141211] font-jakarta select-none">
      {/* Header Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between px-3 border-b border-white/5 bg-[#1a1817]">
        <Link href="/" className="min-h-[44px] content-center text-xs font-bold text-zinc-300 hover:text-white">
          ← Back to Radar
        </Link>

        {/* Center slide switch pill */}
        <div className="flex rounded-full bg-white/10 p-0.5">
          <button
            onClick={() => setActiveSlide('background')}
            className={`min-h-[30px] rounded-full px-3 text-xs font-bold transition-all ${
              activeSlide === 'background' ? 'bg-[#e84a27] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Slide 1: Wallpaper
          </button>
          <button
            onClick={() => setActiveSlide('photo')}
            className={`min-h-[30px] rounded-full px-3 text-xs font-bold transition-all ${
              activeSlide === 'photo' ? 'bg-[#e84a27] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Slide 2: Photo
          </button>
        </div>

        {/* Quick Map Viewfinder Action */}
        <button
          onClick={() => setIsMapCaptureOpen(true)}
          className="min-h-[30px] px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 flex items-center gap-1"
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Map Snapshot</span>
        </button>
      </header>

      {/* Main Preview Stage (upper ~46vh) */}
      <section ref={stageRef} className="relative flex min-h-0 basis-[46%] items-center justify-center p-2 bg-[#12100f]">
        {/* Left / Right Slide Arrow Buttons */}
        <button
          onClick={() => setActiveSlide(activeSlide === 'background' ? 'photo' : 'background')}
          className="absolute left-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 text-xs"
          title="Switch Slide"
        >
          ‹
        </button>
        <button
          onClick={() => setActiveSlide(activeSlide === 'background' ? 'photo' : 'background')}
          className="absolute right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 text-xs"
          title="Switch Slide"
        >
          ›
        </button>

        {/* Live Scaled Canvas */}
        <div style={{ width: w * scale, height: h * scale }} className="relative shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <StudioCanvas
              ref={canvasRef}
              state={state}
              activeSlide={activeSlide}
              previewScale={scale}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, x, y) => patchElement(id, { x, y })}
            />
          </div>
        </div>

        {/* Hidden offscreen canvas for rendering secondary slide in dual export */}
        <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden>
          <StudioCanvas
            ref={offscreenCanvasRef}
            state={state}
            activeSlide={otherSlide}
            previewScale={1}
            selectedId={null}
            onSelect={() => {}}
            onMove={() => {}}
          />
        </div>
      </section>

      {/* Bottom Controls Drawer */}
      <section className="min-h-0 flex-1 overflow-hidden rounded-t-3xl border-t border-black/10 bg-[#FAF7F2] dark:bg-[#1a1817]">
        <StudioControls
          state={state}
          activeSlide={activeSlide}
          onSelectSlide={setActiveSlide}
          update={update}
          wp={wp}
          pp={pp}
          selected={selected}
          addElement={addElement}
          patchElement={patchElement}
          removeElement={removeElement}
          selectElement={setSelectedId}
          onOpenMapCapture={() => setIsMapCaptureOpen(true)}
          onExport={(format, both) => executeExport(format, both, 'share')}
          onDownloadOnly={(format, both) => executeExport(format, both, 'download')}
          exporting={exporting}
          exportError={exportError}
        />
      </section>

      {/* Interactive Map Capture Viewfinder Modal */}
      {isMapCaptureOpen && (
        <MapCaptureModal
          mapState={state.map}
          captureSize={state.captureSize}
          onUpdateMap={mp}
          onUpdateCaptureSize={(sz: CaptureSize) => update({ captureSize: sz })}
          onCapture={handleMapCaptured}
          onClose={() => setIsMapCaptureOpen(false)}
        />
      )}
    </main>
  );
}
