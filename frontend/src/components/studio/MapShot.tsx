'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MAP_STYLE_URLS,
  type MapShotState,
  type StudioVenueItem,
  type RoundupBannerBg,
} from '@/types/studio';

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

const THEMES = {
  cream: {
    card: '#FAF7F2',
    ink: '#2B1810',
    sub: '#6b6459',
    btn: '#ffffff',
    btnInk: '#2B1810',
    border: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    card: '#181615',
    ink: '#FAF7F2',
    sub: '#a1a1aa',
    btn: '#27272a',
    btnInk: '#FAF7F2',
    border: 'rgba(255, 255, 255, 0.12)',
  },
  paprika: {
    card: '#e84a27',
    ink: '#ffffff',
    sub: '#ffe4dd',
    btn: '#ffffff',
    btnInk: '#e84a27',
    border: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

export const ROUNDUP_BANNER_STYLES: Record<
  RoundupBannerBg,
  { bg: string; text: string; border: string; dot: string; countBg: string; countText: string; label: string }
> = {
  dark: {
    bg: 'bg-[#181615]',
    text: 'text-white',
    border: 'border-white/15',
    dot: 'bg-[#e84a27]',
    countBg: 'bg-white/15',
    countText: 'text-white',
    label: 'Dark Espresso',
  },
  oat: {
    bg: 'bg-[#FAF7F2]',
    text: 'text-[#2B1810]',
    border: 'border-black/10',
    dot: 'bg-[#e84a27]',
    countBg: 'bg-black/10',
    countText: 'text-[#2B1810]',
    label: 'Warm Oat',
  },
  paprika: {
    bg: 'bg-[#e84a27]',
    text: 'text-white',
    border: 'border-white/20',
    dot: 'bg-white',
    countBg: 'bg-black/25',
    countText: 'text-white',
    label: 'Oslo Paprika',
  },
  glass: {
    bg: 'bg-white/90 backdrop-blur-xl',
    text: 'text-[#181615]',
    border: 'border-black/10',
    dot: 'bg-[#e84a27]',
    countBg: 'bg-black/10',
    countText: 'text-[#181615]',
    label: 'Frosted Glass',
  },
};

interface MapShotProps {
  s: MapShotState;
  w: number;
  h: number;
  interactive?: boolean;
  onMapChange?: (coords: [number, number], zoom: number, pitch: number) => void;
  onUpdateVenueOffset?: (venueIdOrIndex: string | number, x: number, y: number) => void;
}

/**
 * MultiVenuePin
 * Fixed-size circular pin anchored at center to exact GPS coordinate with zIndex 50
 * so it is NEVER hidden by any card on the map.
 */
function MultiVenuePin({
  venue,
  index,
  s,
}: {
  venue: StudioVenueItem;
  index: number;
  s: MapShotState;
}) {
  const pinSize = 72;
  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-white/95 shrink-0 transition-transform select-none cursor-pointer"
      style={{
        width: pinSize,
        height: pinSize,
        fontSize: pinSize * 0.52,
        border: '3.5px solid rgba(255, 255, 255, 0.95)',
        boxShadow:
          '0 0 36px 8px rgba(232, 74, 39, 0.35), 0 10px 24px rgba(0, 0, 0, 0.25)',
      }}
    >
      <span>{venue.icon || '🍽️'}</span>
      <span
        className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#e84a27] text-white font-comico font-black border-2 border-white shadow-md"
        style={{
          width: 26,
          height: 26,
          fontSize: 13,
        }}
      >
        {index + 1}
      </span>
    </div>
  );
}

/**
 * MultiVenueCard
 * Scalable Warm Nordic card anchored below the pin with adaptive width and edge safety.
 */
function MultiVenueCard({
  venue,
  index,
  s,
  t,
  totalSpots,
  onUpdateVenueOffset,
}: {
  venue: StudioVenueItem;
  index: number;
  s: MapShotState;
  t: (typeof THEMES)[keyof typeof THEMES];
  totalSpots: number;
  onUpdateVenueOffset?: (venueIdOrIndex: string | number, x: number, y: number) => void;
}) {
  const isCompact = s.layoutMode === 'multi_compact';
  const scale = s.cardScale || 1;
  // Adaptive card width: when 4 spots, 300px; when 3 spots, 340px; when 2 spots, 380px
  const defaultWidth = totalSpots >= 4 ? 300 : totalSpots === 3 ? 340 : 380;
  const cardWidth = Math.min(s.cardWidth || 860, defaultWidth);

  // Alternating slight lateral offset so adjacent pins don't completely stack cards directly on top of each other
  const staggerX = totalSpots > 1 ? (index % 2 === 0 ? -14 : 14) : 0;

  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { x: venue.x || 0, y: venue.y || 0 };
    setDragDelta({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const canvasEl =
      e.currentTarget.closest('[data-asset-builder]') ||
      e.currentTarget.closest('.smakr-canvas-stage') ||
      document.querySelector('[data-asset-builder="venue-map-full"]');
    const scaleFactor = canvasEl ? canvasEl.getBoundingClientRect().width / 1080 : 1;
    const dx = (e.clientX - startPosRef.current.x) / (scaleFactor || 1);
    const dy = (e.clientY - startPosRef.current.y) / (scaleFactor || 1);
    setDragDelta({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const finalX = Math.round(startOffsetRef.current.x + (dragDelta?.x || 0));
    const finalY = Math.round(startOffsetRef.current.y + (dragDelta?.y || 0));
    setDragDelta(null);
    onUpdateVenueOffset?.(venue.id || index, finalX, finalY);
  };

  const currentX = (venue.x != null ? venue.x : staggerX) + (dragDelta?.x || 0);
  const currentY = (venue.y || 0) + (dragDelta?.y || 0);
  const isCustomMoved = venue.x != null || venue.y != null;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="select-none pointer-events-auto touch-none"
      style={{
        marginTop: 48 + (s.cardOffsetY || 0),
        width: cardWidth,
        transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale})`,
        transformOrigin: 'top center',
        cursor: dragDelta ? 'grabbing' : 'grab',
      }}
    >
      <section
        className="shadow-2xl border transition-shadow"
        style={{
          background: t.card,
          color: t.ink,
          borderRadius: Math.round((s.cardRadius || 44) * 0.65),
          border: `2px solid ${t.border}`,
          boxShadow: dragDelta
            ? '0 30px 60px -8px rgba(0, 0, 0, 0.5), 0 0 0 2px #e84a27'
            : '0 20px 48px -10px rgba(0, 0, 0, 0.35)',
          padding: totalSpots >= 4 ? '10px 12px' : '14px 16px',
        }}
      >
        {/* Subtle drag handle header */}
        <div className="flex items-center justify-between pb-1 text-[9px] font-bold opacity-60 hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1 cursor-grab">
            <span className="text-[11px] leading-none">⠿</span>
            <span>DRAG TO REPOSITION</span>
          </span>
          {isCustomMoved && (
            <span className="text-[8px] font-mono text-[#e84a27] font-extrabold uppercase">
              Moved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-3.5">
          {s.showPhoto && venue.photo && (
            <div
              className="shrink-0 overflow-hidden border border-black/10 shadow-xs relative"
              style={{
                width: totalSpots >= 4 ? 72 : 84,
                height: totalSpots >= 4 ? 72 : 84,
                minWidth: totalSpots >= 4 ? 72 : 84,
                maxWidth: totalSpots >= 4 ? 72 : 84,
                minHeight: totalSpots >= 4 ? 72 : 84,
                maxHeight: totalSpots >= 4 ? 72 : 84,
                borderRadius: Math.round((s.cardRadius || 44) * 0.35),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.photo}
                alt={venue.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <h3
              className={`font-comico uppercase tracking-wide leading-tight truncate ${
                totalSpots >= 4 ? 'text-lg' : 'text-xl'
              }`}
              style={{ color: t.ink }}
            >
              {venue.name}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {s.showRating && venue.rating != null && (
                <div className="inline-flex items-center gap-1 rounded-md bg-black px-2 py-0.5 font-comico text-xs text-white shadow-xs shrink-0">
                  <span className="text-amber-400 text-[10px]">★</span>
                  <span>{typeof venue.rating === 'number' ? venue.rating.toFixed(1) : venue.rating}</span>
                </div>
              )}

              {venue.neighborhood && (
                <div
                  className="inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 font-sans text-[11px] font-bold shrink-0"
                  style={{
                    background: s.cardTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(24,22,21,0.06)',
                    color: t.ink,
                  }}
                >
                  <span>📍</span>
                  <span className="truncate max-w-[90px]">{venue.neighborhood}</span>
                </div>
              )}
            </div>

            {venue.dish && (
              <div
                className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold max-w-full truncate"
                style={{
                  background: s.cardTheme === 'paprika' ? 'rgba(255,255,255,0.18)' : 'rgba(232, 74, 39, 0.12)',
                  color: s.cardTheme === 'paprika' ? '#ffffff' : '#e84a27',
                }}
              >
                <span className="truncate">
                  {venue.dish} {venue.price ? `· ${venue.price}` : ''}
                </span>
              </div>
            )}

            {s.showAddress && venue.address && (
              <p
                className="mt-1 text-[11px] font-semibold leading-snug truncate opacity-75"
                style={{ color: t.sub }}
              >
                📍 {venue.address}
              </p>
            )}
          </div>
        </div>

        {!isCompact && s.showButtons && (
          <div
            className="mt-2.5 pt-2 flex gap-1.5"
            style={{ borderTop: `1.5px solid ${t.border}` }}
          >
            <div
              className="w-full flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-center text-[11px] font-bold shadow-xs"
              style={{
                background: s.cardTheme === 'paprika' ? '#ffffff' : '#e84a27',
                color: s.cardTheme === 'paprika' ? '#e84a27' : '#ffffff',
              }}
            >
              <span>{s.ctaText || '🔗 See all Oslo picks · @smakr.no'}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export const MapShot = forwardRef<HTMLDivElement, MapShotProps>(function MapShot(
  { s, w, h, interactive = true, onMapChange, onUpdateVenueOffset },
  forwardedRef
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const styleRef = useRef(s.style);
  const prevVenuesKeyRef = useRef<string>('');
  const isProgrammaticMoveRef = useRef<boolean>(false);
  const [portalTargets, setPortalTargets] = useState<
    { pinEl: HTMLDivElement; cardEl: HTMLDivElement; venue: StudioVenueItem; index: number }[]
  >([]);

  const exportTarget = s.exportTarget || 'card-only';
  const needsMap = exportTarget === 'full-scene' || exportTarget === 'map-only';

  const isMulti = Boolean(
    s.venues &&
      s.venues.length > 1 &&
      s.layoutMode &&
      s.layoutMode !== 'single'
  );
  const venuesList = isMulti ? s.venues! : [];

  // Initialize MapLibre GL only if map rendering is requested
  useEffect(() => {
    if (!needsMap || !mapContainer.current) return;

    const pinCy = (s.pinY || 0.36) * h;
    const bottomPadding = Math.max(0, Math.round(h - 2 * pinCy));

    const pr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2);
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_URLS[s.style],
      center: [s.lng, s.lat],
      zoom: s.zoom,
      pitch: s.pitch,
      interactive: interactive,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
      pixelRatio: pr,
    });
    map.setPadding({ top: 0, bottom: bottomPadding, left: 0, right: 0 });

    const handleMoveEnd = () => {
      if (!map) return;
      if (isProgrammaticMoveRef.current) {
        isProgrammaticMoveRef.current = false;
        return;
      }
      const c = map.getCenter();
      onMapChange?.([c.lng, c.lat], map.getZoom(), map.getPitch());
    };

    if (interactive && onMapChange) {
      map.on('moveend', handleMoveEnd);
    }

    const suppressClutter = () => {
      try {
        const style = map.getStyle();
        if (style && style.layers) {
          for (const layer of style.layers) {
            const id = layer.id.toLowerCase();
            if (
              id.includes('poi_restaurant') ||
              id.includes('poi_fast_food') ||
              id.includes('poi_commercial') ||
              id.includes('poi_food') ||
              id.includes('poi_transit') ||
              id.includes('poi_bus')
            ) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      } catch {}
    };

    map.on('style.load', suppressClutter);
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      setPortalTargets([]);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsMap, interactive]);

  // Synchronize style, markers and camera changes
  useEffect(() => {
    if (!needsMap) {
      setPortalTargets([]);
      return;
    }
    const map = mapRef.current;
    if (!map) return;

    if (styleRef.current !== s.style) {
      styleRef.current = s.style;
      map.setStyle(MAP_STYLE_URLS[s.style]);
    }

    map.resize();

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (isMulti && venuesList.length > 0) {
      // Add multi-venue markers: Pin Marker (anchor: center, zIndex: 50) + Card Marker (anchor: top, zIndex: 20 + idx)
      const bounds = new maplibregl.LngLatBounds();
      const newTargets: { pinEl: HTMLDivElement; cardEl: HTMLDivElement; venue: StudioVenueItem; index: number }[] = [];

      venuesList.forEach((v, idx) => {
        bounds.extend([v.lng, v.lat]);

        // 1. Pin Marker — always on top layer (zIndex: 100 on MapLibre marker wrapper)
        const pinEl = document.createElement('div');
        pinEl.className = 'smakr-multi-spot-pin-marker';
        pinEl.style.position = 'relative';
        pinEl.style.cursor = 'pointer';

        const pinMarker = new maplibregl.Marker({
          element: pinEl,
          anchor: 'center',
        })
          .setLngLat([v.lng, v.lat])
          .addTo(map);

        pinMarker.getElement().style.zIndex = '100';
        markersRef.current.push(pinMarker);

        // 2. Card Marker — lower layer (zIndex: 20 + idx on MapLibre marker wrapper)
        const cardEl = document.createElement('div');
        cardEl.className = 'smakr-multi-spot-card-marker';
        cardEl.style.position = 'relative';
        cardEl.style.cursor = 'pointer';

        const cardMarker = new maplibregl.Marker({
          element: cardEl,
          anchor: 'top',
        })
          .setLngLat([v.lng, v.lat])
          .addTo(map);

        cardMarker.getElement().style.zIndex = String(20 + idx);
        markersRef.current.push(cardMarker);

        newTargets.push({ pinEl, cardEl, venue: v, index: idx });
      });

      setPortalTargets(newTargets);

      // Check if venues composition changed or if fit was explicitly triggered
      const venuesKey = venuesList.map((v) => `${v.id}_${v.lat}_${v.lng}`).join('|');
      const venuesChanged = prevVenuesKeyRef.current !== venuesKey;
      const shouldFit = venuesChanged || s.autoFitCamera === true;

      if (shouldFit && !bounds.isEmpty()) {
        const isSquare = Math.abs(w - h) < 100;
        const isStory = h > 1600;
        const fitPadding = isSquare
          ? { top: 110, bottom: 120, left: 120, right: 120 }
          : isStory
          ? { top: 180, bottom: 220, left: 160, right: 160 }
          : { top: 130, bottom: 160, left: 140, right: 140 };

        isProgrammaticMoveRef.current = true;
        map.fitBounds(bounds, {
          padding: fitPadding,
          maxZoom: 16.8,
          duration: 0,
        });
        prevVenuesKeyRef.current = venuesKey;
      } else {
        // Manual camera adjustment (zoom in/out or pan from controls)
        const curCenter = map.getCenter();
        const curZoom = map.getZoom();
        const dist = Math.abs(curCenter.lng - s.lng) + Math.abs(curCenter.lat - s.lat);
        const zoomDiff = Math.abs(curZoom - s.zoom);
        if (zoomDiff > 0.05 || dist > 0.001) {
          isProgrammaticMoveRef.current = true;
          map.jumpTo({
            center: [s.lng, s.lat],
            zoom: s.zoom,
            pitch: s.pitch,
          });
        }
      }
    } else {
      setPortalTargets([]);
      const pinCy = (s.pinY || 0.36) * h;
      const bottomPadding = Math.max(0, Math.round(h - 2 * pinCy));

      map.jumpTo({
        center: [s.lng, s.lat],
        padding: { top: 0, bottom: bottomPadding, left: 0, right: 0 },
        zoom: s.zoom,
        pitch: s.pitch,
      });
    }
  }, [
    needsMap,
    s.style,
    s.lng,
    s.lat,
    s.zoom,
    s.pitch,
    s.pinY,
    s.autoFitCamera,
    isMulti,
    venuesList,
    w,
    h,
  ]);

  const t = THEMES[s.cardTheme] || THEMES.cream;
  const pinSize = 140 * (s.pinScale || 1);
  const pinCy = (s.pinY || 0.36) * h;
  const pinCx = w / 2;

  const baselineCardWidth = s.cardWidth || 860;
  const scale = s.cardScale || 1;

  // Pin Element
  const renderPin = (centered = false) => (
    <div
      className="flex items-center justify-center rounded-full bg-white/95 transition-transform"
      style={{
        width: pinSize,
        height: pinSize,
        ...(centered
          ? {}
          : {
              position: 'absolute',
              left: pinCx - pinSize / 2,
              top: pinCy - pinSize / 2,
            }),
        fontSize: pinSize * 0.52,
        boxShadow:
          '0 0 100px 30px rgba(232, 74, 39, 0.32), 0 16px 36px rgba(0, 0, 0, 0.22)',
        border: '4px solid rgba(255, 255, 255, 0.95)',
      }}
    >
      {s.icon || '🍽️'}
    </div>
  );

  // Venue Card Element
  const renderCard = (standalone = false) => (
    <section
      className={`p-8 shadow-2xl transition-transform ${standalone ? 'relative' : 'absolute pointer-events-none'}`}
      style={{
        width: baselineCardWidth,
        ...(standalone
          ? { margin: '0 auto', transform: `scale(${scale})`, transformOrigin: 'center center' }
          : {
              left: (w - baselineCardWidth) / 2,
              top: pinCy + pinSize / 2 + 28 + (s.cardOffsetY || 0),
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }),
        background: t.card,
        color: t.ink,
        borderRadius: s.cardRadius || 44,
        border: `2px solid ${t.border}`,
        boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div className="flex items-center gap-7">
        {s.showPhoto && s.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt=""
            crossOrigin="anonymous"
            className="h-48 w-48 shrink-0 object-cover"
            style={{ borderRadius: (s.cardRadius || 44) * 0.55 }}
          />
        )}

        <div className="min-w-0 flex-1">
          <h2
            className="font-comico text-6xl uppercase tracking-wide leading-[1.15]"
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
          >
            {s.name || 'Venue Name'}
          </h2>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            {s.showRating && s.rating != null && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-1.5 font-comico text-3xl text-white">
                <span className="text-amber-400">★</span>
                <span>{s.rating.toFixed(1)}</span>
              </div>
            )}

            {s.neighborhood && (
              <div
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 font-sans text-2xl font-bold"
                style={{
                  background: s.cardTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(24,22,21,0.07)',
                  color: t.ink,
                }}
              >
                <span>📍</span>
                <span>{s.neighborhood}</span>
              </div>
            )}
          </div>

          {s.featuredDish && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-2xl font-bold"
              style={{
                background: s.cardTheme === 'paprika' ? 'rgba(255,255,255,0.18)' : 'rgba(232, 74, 39, 0.12)',
                color: s.cardTheme === 'paprika' ? '#ffffff' : '#e84a27',
              }}
            >
              <span>{s.featuredDish}</span>
            </div>
          )}

          {s.showAddress && s.address && (
            <p
              className="mt-3 text-2xl font-semibold leading-snug"
              style={{ color: t.sub }}
            >
              📍 {s.address}
            </p>
          )}
        </div>
      </div>

      {s.showButtons && (
        <div
          className="mt-7 flex gap-4 pt-7"
          style={{ borderTop: `2px solid ${t.border}` }}
        >
          {s.showWebButtons ? (
            <>
              <span
                className="flex-1 rounded-2xl py-4 text-center text-3xl font-bold transition-all shadow-sm"
                style={{
                  background: t.btn,
                  color: t.btnInk,
                  border: `2px solid ${t.border}`,
                }}
              >
                {s.mapLabel || 'Map ↗'}
              </span>

              <span className="flex-[1.4] rounded-2xl bg-[#e84a27] py-4 text-center text-3xl font-bold text-white shadow-md">
                {s.detailsLabel || 'Details →'}
              </span>
            </>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-5 text-center text-2xl font-bold tracking-tight shadow-sm"
              style={{
                background: s.cardTheme === 'paprika' ? '#ffffff' : '#e84a27',
                color: s.cardTheme === 'paprika' ? '#e84a27' : '#ffffff',
              }}
            >
              <span>{s.ctaText || '🔗 See all Oslo picks & prices · @smakr.no'}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const bannerTheme = ROUNDUP_BANNER_STYLES[s.roundupBannerBg || 'dark'] || ROUNDUP_BANNER_STYLES.dark;
  const showBanner = s.showRoundupBanner !== false && Boolean(s.roundupTitle);
  const showDot = s.showRoundupDot !== false;

  // Multi-Venue Floating Cards Element for Transparent Card-Only Export (Canva / IG Stories)
  const renderMultiCards = (standalone = false) => {
    return (
      <div
        className="flex flex-col items-center gap-6 p-6 select-none"
        style={{
          width: '100%',
          maxWidth: 960,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {showBanner && (
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full ${bannerTheme.bg} ${bannerTheme.text} shadow-xl border ${bannerTheme.border}`}>
            {showDot && <span className={`w-2.5 h-2.5 rounded-full ${bannerTheme.dot} animate-pulse`} />}
            <span className="font-comico text-2xl uppercase tracking-wider">
              {s.roundupTitle}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full ${bannerTheme.countBg} text-xs font-bold ${bannerTheme.countText} uppercase tracking-wider font-mono`}>
              {venuesList.length} SPOTS
            </span>
          </div>
        )}

        <div className={`grid ${venuesList.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 w-full`}>
          {venuesList.map((venue, idx) => (
            <div key={venue.id || idx} className="flex flex-col items-center">
              {/* Pin badge attached over card */}
              <div
                className="relative -mb-6 z-10 flex items-center justify-center rounded-full bg-white shadow-xl"
                style={{
                  width: 68,
                  height: 68,
                  fontSize: 34,
                  border: '3.5px solid white',
                  boxShadow: '0 0 30px 6px rgba(232, 74, 39, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span>{venue.icon || '🍽️'}</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#e84a27] text-white font-comico font-black text-xs w-6 h-6 border-2 border-white shadow-md">
                  {idx + 1}
                </span>
              </div>

              {/* Venue Card matching Image 1 Structure */}
              <div
                className="p-5 rounded-3xl shadow-xl border w-full flex items-center gap-4 transition-transform"
                style={{
                  background: t.card,
                  color: t.ink,
                  border: `2px solid ${t.border}`,
                  borderRadius: Math.round((s.cardRadius || 44) * 0.75),
                  paddingTop: '28px',
                }}
              >
                {venue.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={venue.photo}
                    alt=""
                    crossOrigin="anonymous"
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-black/10"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-comico text-2xl uppercase tracking-wide truncate">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {venue.rating != null && (
                      <span className="px-2 py-0.5 rounded-md bg-black text-white font-comico text-xs flex items-center gap-0.5">
                        <span className="text-amber-400 text-[10px]">★</span>
                        <span>{typeof venue.rating === 'number' ? venue.rating.toFixed(1) : venue.rating}</span>
                      </span>
                    )}
                    {venue.neighborhood && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 truncate">
                        📍 {venue.neighborhood}
                      </span>
                    )}
                  </div>
                  {venue.dish && (
                    <p className="text-xs font-bold text-[#e84a27] mt-1 truncate">
                      {venue.dish} {venue.price ? `· ${venue.price}` : ''}
                    </p>
                  )}
                  {venue.address && (
                    <p className="text-[11px] font-semibold opacity-70 mt-0.5 truncate">
                      📍 {venue.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // TARGET: Card Only (Transparent Card/Cards for Canva)
  if (exportTarget === 'card-only') {
    if (isMulti) {
      return (
        <div
          ref={forwardedRef}
          style={{ width: w, minHeight: h, background: 'transparent' }}
          className="relative flex flex-col items-center justify-center p-6 bg-transparent select-none"
        >
          {renderMultiCards(true)}
        </div>
      );
    }

    return (
      <div
        ref={forwardedRef}
        style={{ width: w, minHeight: h, background: 'transparent' }}
        className="relative flex flex-col items-center justify-center p-6 bg-transparent select-none"
      >
        {/* Floating food glyph badge attached over the card */}
        {s.icon && (
          <div className="-mb-8 z-10 w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl border-4 border-white">
            {s.icon}
          </div>
        )}
        {renderCard(true)}
      </div>
    );
  }

  // TARGET: Pin Only (Transparent Map Pin Sticker)
  if (exportTarget === 'pin-only') {
    return (
      <div
        ref={forwardedRef}
        style={{ width: w, height: h }}
        className="relative flex items-center justify-center bg-transparent select-none"
      >
        {renderPin(true)}
      </div>
    );
  }

  // TARGET: Map Only (No Venue Card) or Full Scene
  return (
    <div
      ref={forwardedRef}
      style={{ width: w, height: h }}
      className="relative overflow-hidden bg-[#e9e4d8] select-none"
    >
      <div
        ref={mapContainer}
        style={{ width: w, height: h }}
        className="absolute inset-0 w-full h-full"
      />

      {/* Floating Round-up Title Banner (Multi-Spot Mode Only) */}
      {isMulti && showBanner && (
        <div
          className={`absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-2.5 rounded-full ${bannerTheme.bg} ${bannerTheme.text} shadow-2xl border ${bannerTheme.border} backdrop-blur-md pointer-events-none select-none`}
        >
          {showDot && (
            <span className={`w-2.5 h-2.5 rounded-full ${bannerTheme.dot} animate-pulse`} />
          )}
          <span className="font-comico text-2xl uppercase tracking-wider">
            {s.roundupTitle}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full ${bannerTheme.countBg} text-xs font-bold ${bannerTheme.countText} uppercase tracking-wider font-mono`}
          >
            {venuesList.length} SPOTS
          </span>
        </div>
      )}

      {/* Single Spot Mode: Centered Pin and Card */}
      {!isMulti && s.showPin && renderPin(false)}
      {!isMulti && exportTarget === 'full-scene' && s.showCardInfo !== false && renderCard(false)}

      {/* Multi-Spot Mode: Pins (layer 50) and Cards (layer 20) via Portals */}
      {isMulti &&
        exportTarget === 'full-scene' &&
        portalTargets.map(({ pinEl, cardEl, venue, index }) => (
          <React.Fragment key={venue.id || index}>
            {createPortal(
              <MultiVenuePin
                venue={venue}
                index={index}
                s={s}
              />,
              pinEl
            )}
            {createPortal(
              <MultiVenueCard
                venue={venue}
                index={index}
                s={s}
                t={t}
                totalSpots={venuesList.length}
                onUpdateVenueOffset={onUpdateVenueOffset}
              />,
              cardEl
            )}
          </React.Fragment>
        ))}
    </div>
  );
});
