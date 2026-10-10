'use client';

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { MapShot } from './MapShot';
import { Slider, Toggle, pill, field } from './StudioUi';
import {
  CAPTURE_SIZES,
  type CaptureSize,
  type MapShotState,
} from '@/types/studio';
import type { Venue } from '@/types';
import { fetchVenues } from '@/lib/supabase/data';

interface Props {
  mapState: MapShotState;
  captureSize: CaptureSize;
  onUpdateMap: (patch: Partial<MapShotState>) => void;
  onUpdateCaptureSize: (size: CaptureSize) => void;
  onCapture: (dataUrl: string, target: 'slide-bg' | 'sticker') => void;
  onClose: () => void;
}

export function MapCaptureModal({
  mapState,
  captureSize,
  onUpdateMap,
  onUpdateCaptureSize,
  onCapture,
  onClose,
}: Props) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [scale, setScale] = useState(0.4);
  const stageRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const { w, h } = CAPTURE_SIZES[captureSize];

  useEffect(() => {
    fetchVenues().then(setVenues).catch(() => setVenues([]));
  }, []);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const padW = 20;
      const padH = 20;
      setScale(Math.min((el.clientWidth - padW) / w, (el.clientHeight - padH) / h));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  const handleCapture = async (target: 'slide-bg' | 'sticker') => {
    if (!captureRef.current) return;
    setCapturing(true);
    try {
      // Let any tile settle
      await new Promise((r) => setTimeout(r, 200));
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        style: { transform: 'none' },
      });
      onCapture(dataUrl, target);
      onClose();
    } catch (err) {
      console.error('Failed to capture map snapshot', err);
    } finally {
      setCapturing(false);
    }
  };

  const pickVenue = (v: Venue) => {
    onUpdateMap({
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141211] text-zinc-100 font-jakarta select-none">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 bg-[#1b1918]">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-sm font-semibold text-zinc-300 hover:text-white"
          >
            ← Cancel
          </button>
          <span className="font-comico text-sm text-[#e84a27] uppercase tracking-wider">
            Map Snapshot Viewfinder
          </span>
        </div>

        {/* Capture Aspect Ratio */}
        <div className="flex gap-1">
          {(['1:1', '4:5', '4:3', '16:9'] as CaptureSize[]).map((r) => (
            <button
              key={r}
              onClick={() => onUpdateCaptureSize(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                captureSize === r ? 'bg-[#e84a27] text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* Interactive Map Viewport (Framed Viewfinder) */}
      <div
        ref={stageRef}
        className="relative flex flex-1 min-h-0 items-center justify-center p-3 overflow-hidden bg-radial from-zinc-900 to-black"
      >
        <div
          style={{ width: w * scale, height: h * scale }}
          className="relative shrink-0 overflow-hidden rounded-xl shadow-2xl ring-2 ring-white/10"
        >
          <div
            style={{
              width: w,
              height: h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <MapShot
              ref={captureRef}
              s={mapState}
              w={w}
              h={h}
              interactive={true}
              onMapChange={(coords, zoom, pitch) => {
                onUpdateMap({ lng: coords[0], lat: coords[1], zoom, pitch });
              }}
            />
          </div>
        </div>

        {/* Framing watermark guide */}
        <div className="pointer-events-none absolute bottom-4 text-center text-xs text-zinc-400">
          Drag to pan map · Pinch/scroll to zoom · Customize card below
        </div>
      </div>

      {/* Controls & Capture Action Bar */}
      <div className="h-64 shrink-0 border-t border-white/10 bg-[#1b1918] p-4 overflow-y-auto space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleCapture('slide-bg')}
            disabled={capturing}
            className="flex-1 min-h-[48px] rounded-xl bg-[#e84a27] font-comico text-base text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {capturing ? 'Capturing…' : '📷 Use as Photo Slide Background'}
          </button>
          <button
            onClick={() => handleCapture('sticker')}
            disabled={capturing}
            className="min-h-[48px] px-5 rounded-xl bg-white text-zinc-900 font-semibold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            ➕ Insert as Sticker
          </button>
        </div>

        {/* Spot chip picker */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Choose Spot
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => pickVenue(v)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  mapState.venueId === v.id
                    ? 'bg-[#e84a27] border-[#e84a27] text-white'
                    : 'bg-white/5 border-white/10 text-zinc-300'
                }`}
              >
                <span>{v.icon || '🍽️'}</span>
                <span>{v.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Map Style</span>
            <div className="flex gap-1">
              {(['streets', 'dataviz', 'aquarelle'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateMap({ style: s })}
                  className={`flex-1 py-1 text-xs rounded border capitalize ${
                    mapState.style === s
                      ? 'bg-white text-zinc-900 border-white'
                      : 'bg-white/5 text-zinc-300 border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Card Theme</span>
            <div className="flex gap-1">
              {(['cream', 'dark', 'paprika'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateMap({ cardTheme: t })}
                  className={`flex-1 py-1 text-xs rounded border capitalize ${
                    mapState.cardTheme === t
                      ? 'bg-white text-zinc-900 border-white'
                      : 'bg-white/5 text-zinc-300 border-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Card Position</span>
            <div className="flex gap-1">
              {(['below', 'above'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdateMap({ cardPosition: p })}
                  className={`flex-1 py-1 text-xs rounded border capitalize ${
                    mapState.cardPosition === p
                      ? 'bg-white text-zinc-900 border-white'
                      : 'bg-white/5 text-zinc-300 border-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Toggle name="Pin" on={mapState.showPin} onChange={(v) => onUpdateMap({ showPin: v })} />
            <Toggle name="Rating" on={mapState.showRating} onChange={(v) => onUpdateMap({ showRating: v })} />
            <Toggle name="Address" on={mapState.showAddress} onChange={(v) => onUpdateMap({ showAddress: v })} />
            <Toggle name="Photo" on={mapState.showPhoto} onChange={(v) => onUpdateMap({ showPhoto: v })} />
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Slider
            name="Card Size"
            value={mapState.cardScale}
            min={0.6}
            max={1.3}
            step={0.05}
            onChange={(v) => onUpdateMap({ cardScale: v })}
          />
          <Slider
            name="Corner Radius"
            value={mapState.cardRadius}
            min={0}
            max={80}
            onChange={(v) => onUpdateMap({ cardRadius: v })}
          />
          <Slider
            name="Pin Height"
            value={mapState.pinY}
            min={0.2}
            max={0.8}
            step={0.02}
            onChange={(v) => onUpdateMap({ pinY: v })}
          />
        </div>
      </div>
    </div>
  );
}
