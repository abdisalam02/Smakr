'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URLS, type MapShotState } from '@/types/studio';

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

interface MapShotProps {
  s: MapShotState;
  w: number;
  h: number;
  interactive?: boolean;
  onMapChange?: (coords: [number, number], zoom: number, pitch: number) => void;
}

export const MapShot = forwardRef<HTMLDivElement, MapShotProps>(function MapShot(
  { s, w, h, interactive = true, onMapChange },
  forwardedRef
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleRef = useRef(s.style);

  const exportTarget = s.exportTarget || 'full-scene';
  const needsMap = exportTarget === 'full-scene' || exportTarget === 'map-only';

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
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsMap, interactive]);

  // Synchronize style and camera changes
  useEffect(() => {
    if (!needsMap) return;
    const map = mapRef.current;
    if (!map) return;

    if (styleRef.current !== s.style) {
      styleRef.current = s.style;
      map.setStyle(MAP_STYLE_URLS[s.style]);
    }

    map.resize();

    const pinCy = (s.pinY || 0.36) * h;
    const bottomPadding = Math.max(0, Math.round(h - 2 * pinCy));

    map.jumpTo({
      center: [s.lng, s.lat],
      padding: { top: 0, bottom: bottomPadding, left: 0, right: 0 },
      zoom: s.zoom,
      pitch: s.pitch,
    });
  }, [needsMap, s.style, s.lng, s.lat, s.zoom, s.pitch, s.pinY, w, h]);

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

          {s.showRating && s.rating != null && (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-1.5 font-comico text-3xl text-white">
              <span className="text-amber-400">★</span>
              <span>{s.rating.toFixed(1)}</span>
            </div>
          )}

          {s.showAddress && s.address && (
            <p
              className="mt-3.5 text-2xl font-semibold leading-snug"
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
              <span>🔗 Save &amp; get radar in bio · ✦ @smakr.no ✦</span>
            </div>
          )}
        </div>
      )}
    </section>
  );

  // TARGET: Card Only (Transparent Venue Card Sticker)
  if (exportTarget === 'card-only') {
    return (
      <div
        ref={forwardedRef}
        style={{ width: w, minHeight: h }}
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

      {s.showPin && renderPin(false)}

      {exportTarget === 'full-scene' && s.showCardInfo !== false && renderCard(false)}
    </div>
  );
});
