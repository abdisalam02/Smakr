'use client';

import { forwardRef, useEffect, useRef } from 'react';
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

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainer.current) return;

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
    mapRef.current = map;

    if (interactive && onMapChange) {
      map.on('moveend', () => {
        const c = map.getCenter();
        onMapChange([c.lng, c.lat], map.getZoom(), map.getPitch());
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Synchronize style and camera changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (styleRef.current !== s.style) {
      styleRef.current = s.style;
      map.setStyle(MAP_STYLE_URLS[s.style]);
    }

    map.resize();

    const curr = map.getCenter();
    const currZoom = map.getZoom();
    const currPitch = map.getPitch();

    const dist = Math.hypot(curr.lng - s.lng, curr.lat - s.lat);
    const zoomDiff = Math.abs(currZoom - s.zoom);
    const pitchDiff = Math.abs(currPitch - s.pitch);

    if (dist > 0.0001 || zoomDiff > 0.1 || pitchDiff > 1) {
      map.jumpTo({
        center: [s.lng, s.lat],
        zoom: s.zoom,
        pitch: s.pitch,
      });
    }
  }, [s.style, s.lng, s.lat, s.zoom, s.pitch, w, h]);

  const t = THEMES[s.cardTheme] || THEMES.cream;
  const pinSize = 140 * (s.pinScale || 1);
  const pinCy = (s.pinY ?? 0.35) * h;
  const pinCx = w / 2;

  // Baseline Card Width (860px on a 1080px canvas gives generous 110px margins)
  const baselineCardWidth = s.cardWidth || 860;
  const scale = s.cardScale || 1;

  let cardStyle: React.CSSProperties = {};
  if (s.cardPosition === 'above') {
    cardStyle = {
      bottom: h - (pinCy - pinSize / 2 - 32),
      transform: `scale(${scale})`,
      transformOrigin: 'bottom center',
    };
  } else if (s.cardPosition === 'custom') {
    cardStyle = {
      top: (s.cardY ?? 0.55) * h,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    };
  } else {
    // Default: 'below' pin
    cardStyle = {
      top: pinCy + pinSize / 2 + 32,
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
    };
  }

  return (
    <div
      ref={forwardedRef}
      style={{ width: w, height: h }}
      className="relative overflow-hidden bg-[#e9e4d8] select-none"
    >
      {/* Live MapLibre Canvas Container */}
      <div
        ref={mapContainer}
        style={{ width: w, height: h }}
        className="absolute inset-0 w-full h-full"
      />

      {/* Floating Center Radar Marker Pin */}
      {s.showPin && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-white/95 pointer-events-none transition-transform"
          style={{
            width: pinSize,
            height: pinSize,
            left: pinCx - pinSize / 2,
            top: pinCy - pinSize / 2,
            fontSize: pinSize * 0.52,
            boxShadow:
              '0 0 100px 30px rgba(232, 74, 39, 0.32), 0 16px 36px rgba(0, 0, 0, 0.22)',
            border: '4px solid rgba(255, 255, 255, 0.95)',
          }}
        >
          {s.icon || '🍽️'}
        </div>
      )}

      {/* Proportionally Scaled Venue Card */}
      <section
        className="absolute p-8 shadow-2xl pointer-events-none transition-transform"
        style={{
          width: baselineCardWidth,
          left: (w - baselineCardWidth) / 2,
          background: t.card,
          color: t.ink,
          borderRadius: s.cardRadius || 44,
          border: `2px solid ${t.border}`,
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.35)',
          ...cardStyle,
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
          </div>
        )}
      </section>
    </div>
  );
});
