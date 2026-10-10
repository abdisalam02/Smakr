'use client';

import { forwardRef, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URLS, type MapShotState } from '@/types/studio';

// Same self-hosted worker as the radar map (Turbopack cannot emit the ESM worker).
if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

const THEMES = {
  cream: { card: '#FAF7F2', ink: '#2B1810', sub: '#6b6459', btn: '#ffffff', btnInk: '#2B1810' },
  dark: { card: '#1f1d1b', ink: '#FAF7F2', sub: '#b8b0a3', btn: '#2c2926', btnInk: '#FAF7F2' },
  paprika: { card: '#e84a27', ink: '#ffffff', sub: '#ffe3da', btn: '#ffffff', btnInk: '#e84a27' },
} as const;

interface MapShotProps {
  s: MapShotState;
  w: number;
  h: number;
  interactive?: boolean;
  onMapChange?: (coords: [number, number], zoom: number, pitch: number) => void;
}

export const MapShot = forwardRef<HTMLDivElement, MapShotProps>(function MapShot(
  { s, w, h, interactive = false, onMapChange },
  forwardedRef
) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleRef = useRef(s.style);

  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE_URLS[s.style],
      center: [s.lng, s.lat],
      zoom: s.zoom,
      interactive: interactive,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
      pixelRatio: 2,
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
    // Map is created once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (styleRef.current !== s.style) {
      styleRef.current = s.style;
      map.setStyle(MAP_STYLE_URLS[s.style]);
    }
    map.resize();

    if (!interactive) {
      const above = s.pinY * h;
      const top = above > h / 2 ? Math.round(h * (2 * s.pinY - 1)) : 0;
      const bottom = above > h / 2 ? 0 : Math.round(h * (1 - 2 * s.pinY));
      map.jumpTo({
        center: [s.lng, s.lat],
        zoom: s.zoom,
        pitch: s.pitch,
        padding: { top, bottom, left: 0, right: 0 },
      });
    }
  }, [s.style, s.lng, s.lat, s.zoom, s.pitch, s.pinY, w, h, interactive]);

  const t = THEMES[s.cardTheme];
  const pinSize = 150 * s.pinScale;
  const pinCy = s.pinY * h;
  const cardW = Math.min(w - 80, 900) * s.cardScale;
  const gap = 40;
  const cardStyle: React.CSSProperties =
    s.cardPosition === 'below'
      ? { top: pinCy + pinSize / 2 + gap }
      : { bottom: h - (pinCy - pinSize / 2 - gap) };

  return (
    <div
      ref={forwardedRef}
      style={{ width: w, height: h }}
      className="relative overflow-hidden bg-[#e9e4d8] select-none"
    >
      <div ref={box} style={{ width: w, height: h }} className="absolute inset-0" />

      {s.showPin && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-white/90 pointer-events-none"
          style={{
            width: pinSize,
            height: pinSize,
            left: w / 2 - pinSize / 2,
            top: pinCy - pinSize / 2,
            fontSize: pinSize * 0.55,
            boxShadow: '0 0 90px 30px rgba(232,74,39,0.28), 0 12px 30px rgba(0,0,0,0.18)',
          }}
        >
          {s.icon || '🍽️'}
        </div>
      )}

      <section
        className="absolute left-1/2 -translate-x-1/2 p-8 shadow-2xl pointer-events-none"
        style={{
          width: cardW,
          background: t.card,
          color: t.ink,
          borderRadius: s.cardRadius,
          ...cardStyle,
        }}
      >
        <div className="flex items-center gap-8">
          {s.showPhoto && s.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.photo}
              alt=""
              crossOrigin="anonymous"
              className="h-52 w-52 shrink-0 object-cover"
              style={{ borderRadius: s.cardRadius * 0.6 }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-comico text-6xl uppercase leading-tight" style={{ overflowWrap: 'anywhere' }}>
              {s.name || 'Venue name'}
            </h2>
            {s.showRating && s.rating != null && (
              <span className="mt-4 inline-block rounded-xl bg-black px-5 py-1 font-comico text-4xl text-white">
                <span className="text-amber-400">★</span> {s.rating.toFixed(1)}
              </span>
            )}
            {s.showAddress && s.address && (
              <p className="mt-4 text-3xl font-semibold" style={{ color: t.sub }}>
                {s.address}
              </p>
            )}
          </div>
        </div>
        {s.showButtons && (
          <div className="mt-8 flex gap-5 border-t border-black/10 pt-8">
            <span
              className="flex-1 rounded-2xl py-5 text-center text-3xl font-bold"
              style={{ background: t.btn, color: t.btnInk, border: '2px solid rgba(0,0,0,0.08)' }}
            >
              {s.mapLabel}
            </span>
            <span className="flex-[1.4] rounded-2xl bg-[#e84a27] py-5 text-center text-3xl font-bold text-white">
              {s.detailsLabel}
            </span>
          </div>
        )}
      </section>
    </div>
  );
});
