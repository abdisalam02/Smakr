'use client';

import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Copy,
  Share2,
  Download,
  Dices,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { StudioCanvas } from '@/components/studio/StudioCanvas';
import { StudioControls } from '@/components/studio/StudioControls';
import { useCityPulseStore } from '@/store/useCityPulseStore';
import { fetchVenues } from '@/lib/supabase/data';
import { resolveFoodCategoryAndIcon } from '@/lib/categoryResolver';
import {
  copyElementPngToClipboard,
  downloadElementPng,
  downloadMascotSvg,
  exportElementAsPngBlob,
  shareFiles,
} from '@/lib/studioExport';
import { BLUSH_BODIES, BLUSH_FACES } from '@/lib/blushMascotCatalog';
import {
  CANVAS_SIZES,
  DEFAULT_MASCOT_CONFIG,
  DEFAULT_DISH_TITLE_STATE,
  OPEN_PEEPS_BODY_POSES,
  OPEN_PEEPS_FACES,
  OPEN_PEEPS_HEADS,
  OPEN_PEEPS_ACCESSORIES,
  type FoundryMode,
  type StudioState,
  type MascotState,
  type MapShotState,
  type DishTitleState,
  type UiKitExportTarget,
  type WallpaperState,
  type AspectRatio,
  type BubbleSide,
} from '@/types/studio';

const INITIAL_STUDIO_STATE: StudioState = {
  mode: 'mascot',
  aspectRatio: '9:16',
  showSafeZones: false,
  showNoiseTexture: false,
  transparentBg: true,
  wallpaper: {
    text: 'SMAKR',
    rows: 8,
    cols: 2,
    size: 1,
    colorMode: 'oranges',
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
    name: 'Daglig Brød',
    address: 'Frognerveien 22, 0263 Oslo',
    icon: '🥐',
    rating: 4.8,
    photo:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    lng: 10.713,
    lat: 59.916,
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
    showWebButtons: false,
    showCardInfo: true,
    mapLabel: 'Map ↗',
    detailsLabel: 'Details →',
    neighborhood: 'Frogner',
    featuredDish: '🥐 Cardamom Knot · 58 kr',
    ctaText: '🔗 See all Oslo picks & prices · @smakr.no',
    exportTarget: 'card-only',
  },
  photo: {
    src: null,
    fit: 'cover',
    zoom: 1,
    panX: 0,
    panY: 0,
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
  mascot: {
    ...DEFAULT_MASCOT_CONFIG,
    frameMode: 'bust-plus-bubble',
    bubbleText: 'For the biscoff lovers',
    bubbleEyebrow: '✦ SMAKR VERDICT',
    bubbleStyle: 'round',
    circleBg: '#FAF7F2',
    customMascotDataUrl: null,
  },
  dishTitle: DEFAULT_DISH_TITLE_STATE,
};

export default function StudioPage() {
  const currentUser = useCityPulseStore((s) => s.currentUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const modeParam = sp.get('mode') as FoundryMode | null;
      if (modeParam) {
        setState((prev) => ({
          ...prev,
          mode: modeParam,
          aspectRatio: modeParam === 'venue-map' ? '4:5' : prev.aspectRatio,
        }));
      }
    }
  }, []);
  const [state, setState] = useState<StudioState>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const pose = sp.get('pose');
      const skin = sp.get('skin');
      const shirt = sp.get('shirt');
      const modeParam = sp.get('mode') as FoundryMode | null;
      const bX = sp.get('bx');
      const bY = sp.get('by');
      const bSide = sp.get('side') as BubbleSide | null;
      if (pose || skin || shirt || modeParam || bX || bY || bSide) {
        return {
          ...INITIAL_STUDIO_STATE,
          ...(modeParam ? { mode: modeParam } : {}),
          mascot: {
            ...INITIAL_STUDIO_STATE.mascot!,
            ...(pose ? { bodyPose: pose } : {}),
            ...(skin ? { skinColor: `#${skin.replace('#', '')}` } : {}),
            ...(shirt ? { clothingColor: `#${shirt.replace('#', '')}` } : {}),
            ...(bX ? { bubbleOffsetX: parseInt(bX, 10) } : {}),
            ...(bY ? { bubbleOffsetY: parseInt(bY, 10) } : {}),
            ...(bSide ? { bubbleSide: bSide } : {}),
          },
        };
      }
    }
    return INITIAL_STUDIO_STATE;
  });
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync all database venues so Studio can load all live Oslo locations
  const venues = useCityPulseStore((s) => s.venues);
  const setVenues = useCityPulseStore((s) => s.setVenues);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);

  const reloadVenues = useCallback(async () => {
    setIsLoadingVenues(true);
    try {
      const data = await fetchVenues();
      if (data && data.length > 0) {
        setVenues(data);
      }
    } catch (err) {
      console.warn('[Studio] Failed to load venues from DB:', err);
    } finally {
      setIsLoadingVenues(false);
    }
  }, [setVenues]);

  useEffect(() => {
    reloadVenues();
  }, [reloadVenues]);

  // Deep-link auto-selection: ?venueId=... or ?venue=...
  useEffect(() => {
    if (venues.length > 0 && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const rawParam = sp.get('venueId') || sp.get('venue');
      if (rawParam) {
        const decoded = decodeURIComponent(rawParam).trim().toLowerCase();
        const found = venues.find(
          (v) =>
            v.id === rawParam ||
            v.name.toLowerCase().includes(decoded) ||
            decoded.includes(v.name.toLowerCase())
        );
        if (found) {
          const icon = found.icon || resolveFoodCategoryAndIcon('', found.name).icon || '🥐';
          const linkedDish = useCityPulseStore
            .getState()
            .foodPosts.find((p) => p.spot_id === found.id && p.image_url && !p.is_archived);
          setState((prev) => ({
            ...prev,
            map: {
              ...prev.map,
              venueId: found.id,
              name: found.name,
              address: found.address || `${found.name}, Oslo`,
              icon,
              rating: found.google_rating ? Number(found.google_rating.toFixed(1)) : 4.8,
              photo: linkedDish?.image_url || found.cover_image_url || prev.map.photo,
              neighborhood: found.neighborhood ? found.neighborhood.charAt(0).toUpperCase() + found.neighborhood.slice(1) : 'Oslo',
              featuredDish: linkedDish
                ? `${icon} ${linkedDish.dish_name}${linkedDish.price_nok ? ` · ${linkedDish.price_nok} kr` : ''}`
                : prev.map.featuredDish,
              lat: found.latitude,
              lng: found.longitude,
            },
          }));
        }
      }
    }
  }, [venues]);

  const stageRef = useRef<HTMLDivElement>(null);
  const assetRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [mascotScale, setMascotScale] = useState(1);
  const [cardScale, setCardScale] = useState(0.4);

  const activeMode: FoundryMode = state.mode || 'mascot';

  // Responsive stage scaling for canvases
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const fit = () => {
      const padW = 24;
      const padH = 68;
      const availW = Math.max(120, el.clientWidth - padW);
      const availH = Math.max(120, el.clientHeight - padH);

      // 1. Full Aspect Canvases (Wallpaper, Full Map)
      const { w, h } = CANVAS_SIZES[state.aspectRatio || '9:16'];
      const s = Math.min(availW / w, availH / h);
      setPreviewScale(Math.min(1, Math.max(0.18, s)));

      // 2. Mascot Sticker Canvas
      const isStanding = BLUSH_BODIES[state.mascot?.bodyPose || '']?.category === 'standing';
      const isSitting = BLUSH_BODIES[state.mascot?.bodyPose || '']?.category === 'sitting';
      const hasBubble =
        state.mascot?.frameMode === 'bust-plus-bubble' && Boolean(state.mascot?.bubbleText);
      const intrinsicW = hasBubble ? (isStanding ? 700 : 740) : (isStanding ? 440 : 420);
      const intrinsicH = isStanding ? 580 : isSitting ? 520 : 500;
      const ms = Math.min(availW / intrinsicW, availH / intrinsicH);
      setMascotScale(Math.min(1.15, Math.max(0.35, ms)));

      // 3. Venue Card & Dish Title Sticker Scaling
      const cardIntrinsicW = activeMode === 'venue-map' ? 1080 : 860;
      const cardIntrinsicH =
        activeMode === 'venue-map'
          ? state.map.exportTarget === 'pin-only'
            ? 400
            : 680
          : 460;
      const cs = Math.min(availW / cardIntrinsicW, availH / cardIntrinsicH);
      setCardScale(Math.min(1.0, Math.max(0.2, cs)));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    state.aspectRatio,
    activeMode,
    state.map.exportTarget,
    state.mascot?.frameMode,
    state.mascot?.bubbleText,
    state.mascot?.bodyPose,
  ]);

  // Patch state helpers
  const updateMascot = useCallback((patch: Partial<MascotState>) => {
    setState((prev) => ({
      ...prev,
      mascot: { ...(prev.mascot || INITIAL_STUDIO_STATE.mascot!), ...patch },
    }));
  }, []);

  const updateMap = useCallback((patch: Partial<MapShotState>) => {
    setState((prev) => ({
      ...prev,
      map: { ...prev.map, ...patch },
    }));
  }, []);

  const updateDishTitle = useCallback((patch: Partial<DishTitleState>) => {
    setState((prev) => ({
      ...prev,
      dishTitle: { ...(prev.dishTitle || INITIAL_STUDIO_STATE.dishTitle!), ...patch },
    }));
  }, []);

  const updateWallpaper = useCallback((patch: Partial<WallpaperState>) => {
    setState((prev) => ({
      ...prev,
      wallpaper: { ...prev.wallpaper, ...patch },
    }));
  }, []);

  // Quick Action: Shuffle Mascot Look
  const handleShuffleMascot = () => {
    const blushFaces = Object.keys(BLUSH_FACES);
    const blushBodies = Object.keys(BLUSH_BODIES);
    const blushAccessories = ['glasses-2', 'none'];
    const randomFace = blushFaces[Math.floor(Math.random() * blushFaces.length)];
    const randomAcc = blushAccessories[Math.floor(Math.random() * blushAccessories.length)];
    const randomPose = blushBodies[Math.floor(Math.random() * blushBodies.length)];
    updateMascot({
      face: randomFace,
      head: 'afro',
      accessories: randomAcc,
      bodyPose: randomPose,
    });
  };

  // Quick Action: Reset to @niwache12
  const handleResetMascot = () => {
    updateMascot({
      ...DEFAULT_MASCOT_CONFIG,
      frameMode: 'bust-plus-bubble',
      bodyPose: 'jacket-2',
      bubbleText: 'For the biscoff lovers',
      bubbleStyle: 'round',
      customMascotDataUrl: null,
    });
  };

  // Export 1: 1-Tap Clipboard Copy
  const handleCopyClipboard = async () => {
    if (!assetRef.current || exporting) return;
    setExporting(true);
    try {
      const isWallpaperSolid = activeMode === 'wallpaper' && !state.transparentBg;
      const ok = await copyElementPngToClipboard(assetRef.current, {
        backgroundColor: isWallpaperSolid ? state.wallpaper.bgColor : undefined,
      });

      if (ok) {
        setToast('✓ Copied PNG to clipboard!');
      } else {
        await downloadElementPng(assetRef.current, `smakr-${activeMode}-sticker.png`);
        setToast('Saved PNG to device');
      }
    } catch {
      setToast('Clipboard export failed');
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Export 2: Mobile Share Sheet
  const handleShareMobile = async () => {
    if (!assetRef.current || exporting) return;
    setExporting(true);
    try {
      const isWallpaperSolid = activeMode === 'wallpaper' && !state.transparentBg;
      const blob = await exportElementAsPngBlob(assetRef.current, {
        pixelRatio: 3,
        backgroundColor: isWallpaperSolid ? state.wallpaper.bgColor : undefined,
      });
      const file = new File([blob], `smakr-${activeMode}.png`, { type: 'image/png' });
      const shared = await shareFiles([file]);
      if (!shared) {
        await downloadElementPng(assetRef.current, `smakr-${activeMode}.png`);
        setToast('Saved PNG to downloads');
      }
    } catch {
      setToast('Share cancelled');
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Export 3: Direct 2K PNG Download
  const handleDownload2K = async () => {
    if (!assetRef.current || exporting) return;
    setExporting(true);
    try {
      const isWallpaperSolid = activeMode === 'wallpaper' && !state.transparentBg;
      await downloadElementPng(
        assetRef.current,
        `smakr-${activeMode}-2k.png`,
        {
          backgroundColor: isWallpaperSolid ? state.wallpaper.bgColor : undefined,
        }
      );
      setToast('✓ 2K PNG Downloaded');
    } catch {
      setToast('Download failed');
    } finally {
      setExporting(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Export 4: 1-Click Vector SVG Download for Mascot (Figma Ready)
  const handleExportSvg = () => {
    if (!assetRef.current) return;
    try {
      const pose = state.mascot?.bodyPose || 'bust';
      downloadMascotSvg(assetRef.current, `smakr-mascot-${pose}.svg`);
      setToast('✓ Vector SVG Downloaded (Figma ready)');
    } catch {
      setToast('SVG export failed');
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Export 5: 1-Click Quick Extract Individual UI Sticker PNG (Mode 3)
  const handleQuickExtractUiTarget = useCallback(
    async (target: UiKitExportTarget) => {
      if (exporting) return;
      updateDishTitle({ uiKitExportTarget: target });
      setExporting(true);
      setTimeout(async () => {
        try {
          if (assetRef.current) {
            await downloadElementPng(assetRef.current, `smakr-ui-${target}.png`, {
              backgroundColor: undefined,
            });
            setToast(`✓ Extracted ${target}.png (3x Transparent)`);
          }
        } catch {
          setToast('Quick extract failed');
        } finally {
          setExporting(false);
          setTimeout(() => setToast(null), 2500);
        }
      }, 120);
    },
    [exporting, updateDishTitle]
  );

  const isFullAspectMode =
    activeMode === 'wallpaper' ||
    (activeMode === 'venue-map' &&
      state.map.exportTarget !== 'card-only' &&
      state.map.exportTarget !== 'pin-only') ||
    (activeMode === 'dish-title' && state.dishTitle?.uiKitExportTarget === 'full-cover');

  const { w: fullW, h: fullH } =
    activeMode === 'dish-title' && state.dishTitle?.uiKitExportTarget === 'full-cover'
      ? { w: 1080, h: 1350 }
      : CANVAS_SIZES[state.aspectRatio || '9:16'];

  // Admin access gate check
  const isAllowed = currentUser?.role === "admin" || currentUser?.is_official === true;

  if (!isAllowed) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4 bg-[#FAF7F2] text-[#231F1D]">
        <div className="w-full max-w-sm p-6 bg-white rounded-3xl border border-[#E6DEC8] shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e84a27]/10 text-[#e84a27] font-comico text-2xl flex items-center justify-center mx-auto">
            ✦
          </div>
          <div>
            <h1 className="font-comico text-xl text-[#231F1D]">Smakr Asset Studio</h1>
            <p className="text-xs text-[#6E655F] mt-1">Admin access required</p>
          </div>
          <Link
            href="/"
            className="inline-block w-full h-11 leading-[44px] rounded-xl bg-[#e84a27] text-white font-bold text-xs uppercase tracking-wider text-center"
          >
            Return to Radar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[100vw] h-[100dvh] overflow-hidden flex flex-col bg-[#FAF7F2] text-[#231F1D]">
      {/* 1. TOP UTILITY HEADER */}
      <header className="h-14 px-4 bg-[#FAF7F2] border-b border-[#E6DEC8] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-9 h-9 rounded-full bg-[#EAE3D7] hover:bg-[#DFD7C8] flex items-center justify-center text-[#231F1D] transition-all"
            title="Back to Admin"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="leading-tight">
            <h1 className="font-comico text-base text-[#e84a27] tracking-wide">
              Smakr Asset Studio
            </h1>
            <span className="text-[10px] text-[#6E655F] font-semibold block">
              2K Transparent Sticker Library
            </span>
          </div>
        </div>

        {/* Instant Export Actions */}
        <div className="flex items-center gap-1.5">
          {activeMode === 'mascot' && (
            <button
              type="button"
              onClick={handleExportSvg}
              disabled={exporting}
              className="h-9 px-3 rounded-full bg-white border border-[#D8CFC0] hover:bg-[#FAF7F2] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              title="Download clean Vector SVG for Figma"
            >
              <Download className="w-3.5 h-3.5 text-[#e84a27]" />
              <span className="hidden sm:inline">Export .SVG</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyClipboard}
            disabled={exporting}
            className="h-9 px-3 rounded-full bg-white border border-[#D8CFC0] hover:bg-[#FAF7F2] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            title="Copy Transparent PNG directly to Clipboard"
          >
            <Copy className="w-3.5 h-3.5 text-[#6E655F]" />
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            type="button"
            onClick={handleShareMobile}
            disabled={exporting}
            className="h-9 px-3 rounded-full bg-white border border-[#D8CFC0] hover:bg-[#FAF7F2] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            title="Share to Samsung Editor, Canva, or Instagram"
          >
            <Share2 className="w-3.5 h-3.5 text-[#6E655F]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={handleDownload2K}
            disabled={exporting}
            className="h-9 px-3.5 rounded-full bg-[#e84a27] hover:bg-[#d13d1c] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Download 2K High-Res PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PNG</span>
          </button>
        </div>
      </header>

      {/* 2. MODE SWITCHER BAR */}
      <nav
        aria-label="Studio mode navigation"
        className="px-4 py-2 bg-[#F3EDE2] border-b border-[#E6DEC8] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20"
      >
        {[
          { id: 'mascot', label: '1. 😊 Mascot & Bubble' },
          { id: 'venue-map', label: '2. 📍 Venue & Map' },
          { id: 'dish-title', label: '3. 🏷️ Dish Titles & Badges' },
          { id: 'wallpaper', label: '4. 🎨 Brand Wallpaper' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                mode: tab.id as FoundryMode,
                aspectRatio: tab.id === 'venue-map' ? '4:5' : prev.aspectRatio,
              }))
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeMode === tab.id
                ? 'bg-[#231F1D] text-[#FAF7F2] shadow-xs'
                : 'bg-white/80 text-[#5C534E] hover:text-[#231F1D] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 3. CENTER PREVIEW STAGE */}
      <section
        ref={stageRef}
        aria-label="Asset stage preview"
        className="flex-1 min-h-0 relative flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-4 bg-[#EFEAE1] overflow-hidden"
      >
        {/* Floating Toast Notification */}
        {toast && (
          <div className="absolute top-4 z-40 px-4 py-2 rounded-full bg-[#181615] text-[#FAF7F2] font-semibold text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            {toast}
          </div>
        )}

        {/* STAGE CANVAS / STICKER FRAME */}
        {isFullAspectMode ? (
          <div
            style={{
              width: fullW * previewScale,
              height: fullH * previewScale,
            }}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#FAF7F2]"
          >
            <div
              style={{
                width: fullW,
                height: fullH,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <StudioCanvas
                state={state}
                ref={assetRef}
                onMapChange={(coords, zoom, pitch) => {
                  updateMap({ lng: coords[0], lat: coords[1], zoom, pitch });
                }}
              />
            </div>
          </div>
        ) : activeMode === 'mascot' ? (
          (() => {
            const isStanding = BLUSH_BODIES[state.mascot?.bodyPose || '']?.category === 'standing';
            const isSitting = BLUSH_BODIES[state.mascot?.bodyPose || '']?.category === 'sitting';
            const hasBubble =
              state.mascot?.frameMode === 'bust-plus-bubble' && Boolean(state.mascot?.bubbleText);
            const intrinsicW = hasBubble ? (isStanding ? 700 : 740) : (isStanding ? 440 : 420);
            const intrinsicH = isStanding ? 580 : isSitting ? 520 : 500;
            return (
              <div
                style={{
                  width: Math.round(intrinsicW * mascotScale),
                  height: Math.round(intrinsicH * mascotScale),
                }}
                className="relative rounded-3xl border border-[#D8CFC0]/60 shadow-xl overflow-hidden flex items-center justify-center bg-[conic-gradient(#e5e0d5_25%,#faf7f2_0_50%,#e5e0d5_0_75%,#faf7f2_0)] [background-size:20px_20px]"
              >
                <div
                  style={{
                    width: intrinsicW,
                    height: intrinsicH,
                    transform: `scale(${mascotScale})`,
                    transformOrigin: 'center center',
                  }}
                  className="flex items-center justify-center shrink-0"
                >
                  <StudioCanvas state={state} ref={assetRef} />
                </div>
              </div>
            );
          })()
        ) : activeMode === 'venue-map' || activeMode === 'dish-title' ? (
          (() => {
            const cardIntrinsicW = activeMode === 'venue-map' ? 1080 : 880;
            const cardIntrinsicH =
              activeMode === 'venue-map'
                ? state.map.exportTarget === 'pin-only'
                  ? 400
                  : 680
                : 460;
            return (
              <div
                style={{
                  width: Math.round(cardIntrinsicW * cardScale),
                  height: Math.round(cardIntrinsicH * cardScale),
                }}
                className="relative rounded-3xl border border-[#D8CFC0]/60 shadow-xl overflow-hidden flex items-center justify-center bg-[conic-gradient(#e5e0d5_25%,#faf7f2_0_50%,#e5e0d5_0_75%,#faf7f2_0)] [background-size:20px_20px]"
              >
                <div
                  style={{
                    width: cardIntrinsicW,
                    height: cardIntrinsicH,
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'center center',
                  }}
                  className="flex items-center justify-center shrink-0"
                >
                  <StudioCanvas
                    state={state}
                    ref={assetRef}
                    onMapChange={(coords, zoom, pitch) => {
                      updateMap({ lng: coords[0], lat: coords[1], zoom, pitch });
                    }}
                  />
                </div>
              </div>
            );
          })()
        ) : (
          <div className="relative max-w-full max-h-full p-4 sm:p-8 rounded-3xl border border-[#D8CFC0]/60 shadow-xl overflow-hidden flex items-center justify-center bg-[conic-gradient(#e5e0d5_25%,#faf7f2_0_50%,#e5e0d5_0_75%,#faf7f2_0)] [background-size:20px_20px]">
            <StudioCanvas state={state} ref={assetRef} />
          </div>
        )}

        {/* STAGE FLOATING QUICK ACTION BAR */}
        <div className="absolute bottom-20 sm:bottom-3 z-30 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E6DEC8] shadow-lg max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar">
          {activeMode === 'mascot' && (
            <>
              <button
                type="button"
                onClick={handleShuffleMascot}
                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DEC8] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 whitespace-nowrap"
                title="Randomize expressions and look"
              >
                <Dices className="w-3.5 h-3.5 text-[#e84a27]" />
                <span>Shuffle Look</span>
              </button>
              <button
                type="button"
                onClick={handleResetMascot}
                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DEC8] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 whitespace-nowrap"
                title="Reset to authentic @niwache12 mascot"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6E655F]" />
                <span>Reset @niwache12</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateMascot({ stickerOutline: !state.mascot?.stickerOutline })
                }
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  state.mascot?.stickerOutline ? 'bg-[#e84a27] text-white' : 'bg-[#EFEAE1] text-[#5C534E]'
                }`}
              >
                {state.mascot?.stickerOutline ? '✓ White Rim' : '+ White Rim'}
              </button>
              <button
                type="button"
                onClick={handleExportSvg}
                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DEC8] text-xs font-bold text-[#231F1D] flex items-center gap-1.5 whitespace-nowrap"
                title="Download Vector SVG for Figma"
              >
                <Download className="w-3.5 h-3.5 text-[#e84a27]" />
                <span>.SVG (Figma)</span>
              </button>
            </>
          )}

          {activeMode === 'venue-map' && (
            <>
              {(
                [
                  ['4:5', '4:5 Post'],
                  ['1:1', '1:1 Square'],
                  ['9:16', '9:16 Story'],
                ] as const
              ).map(([ratio, label]) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, aspectRatio: ratio }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    state.aspectRatio === ratio
                      ? 'bg-[#231F1D] text-white shadow-xs'
                      : 'bg-[#EFEAE1] text-[#5C534E] hover:text-[#231F1D]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="w-[1px] h-4 bg-[#D8CFC0] mx-0.5" />
              {(
                [
                  ['card-only', '🪪 Transparent Card + Pin (For Canva)'],
                  ['full-scene', '🗺️ Full Map Slide'],
                  ['pin-only', '📍 Pin Only'],
                  ['map-only', '🧭 Map Only'],
                ] as const
              ).map(([target, label]) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => updateMap({ exportTarget: target })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    (state.map.exportTarget || 'card-only') === target
                      ? 'bg-[#e84a27] text-white shadow-xs'
                      : 'bg-[#EFEAE1] text-[#5C534E] hover:text-[#231F1D]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          )}

          {activeMode === 'dish-title' && (
            <>
              {(
                [
                  ['comico-title-only', '🔤 Comico Title'],
                  ['glass-verdict-card', '🪪 Glass Card'],
                  ['paprika-price-pill', '🔥 Price Pill'],
                  ['brand-logo-pill', '🏷️ Logo Pill'],
                  ['location-rating-pill', '📍 Location Pill'],
                  ['full-cover', '🖼️ Full Cover'],
                ] as const
              ).map(([target, label]) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => updateDishTitle({ uiKitExportTarget: target })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    (state.dishTitle?.uiKitExportTarget || 'comico-title-only') === target
                      ? 'bg-[#231F1D] text-white'
                      : 'bg-[#EFEAE1] text-[#5C534E]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateDishTitle({ stickerOutline: !state.dishTitle?.stickerOutline })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  state.dishTitle?.stickerOutline ? 'bg-[#e84a27] text-white' : 'bg-[#EFEAE1] text-[#5C534E]'
                }`}
              >
                {state.dishTitle?.stickerOutline ? '✓ White Rim' : '+ White Rim'}
              </button>
            </>
          )}

          {activeMode === 'wallpaper' && (
            <>
              {(['9:16', '4:5', '1:1'] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, aspectRatio: r }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    state.aspectRatio === r
                      ? 'bg-[#231F1D] text-white'
                      : 'bg-[#EFEAE1] text-[#5C534E]'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, transparentBg: !prev.transparentBg }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  state.transparentBg ? 'bg-[#e84a27] text-white' : 'bg-[#EFEAE1] text-[#5C534E]'
                }`}
              >
                {state.transparentBg ? '✓ Transparent' : 'Solid'}
              </button>
            </>
          )}

          {/* Quick Action: Instagram Safe Zones Toggle */}
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, showSafeZones: !prev.showSafeZones }))}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              state.showSafeZones ? 'bg-[#e84a27] text-white shadow-xs' : 'bg-[#EFEAE1] text-[#5C534E]'
            }`}
            title="Toggle 15% Instagram UI safe zone overlay"
          >
            {state.showSafeZones ? '✓ Safe Zones' : 'Safe Zones'}
          </button>
        </div>
      </section>

      {/* 4. BOTTOM BLUSH-STYLE CUSTOMIZER PANEL */}
      <StudioControls
        state={state}
        activeMode={activeMode}
        venues={venues}
        isLoadingVenues={isLoadingVenues}
        onRefreshVenues={reloadVenues}
        onUpdateMascot={updateMascot}
        onUpdateMap={updateMap}
        onUpdateDishTitle={updateDishTitle}
        onUpdateWallpaper={updateWallpaper}
        onUpdateAspectRatio={(r) => setState((prev) => ({ ...prev, aspectRatio: r }))}
        onUpdateTransparentBg={(t) => setState((prev) => ({ ...prev, transparentBg: t }))}
        onUpdateSafeZones={(sz) => setState((prev) => ({ ...prev, showSafeZones: sz }))}
        onQuickExtractUiTarget={handleQuickExtractUiTarget}
      />
    </main>
  );
}
