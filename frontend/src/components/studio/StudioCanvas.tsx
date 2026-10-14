'use client';

import React, { forwardRef } from 'react';
import { SmakrMascotRig } from './SmakrMascotRig';
import { MapShot } from './MapShot';
import {
  CANVAS_SIZES,
  DEFAULT_MASCOT_CONFIG,
  DEFAULT_DISH_TITLE_STATE,
  type SlideId,
  type StudioState,
  type WallpaperState,
} from '@/types/studio';

const ORANGE_SHADES = [
  '#e84a27',
  '#f97316',
  '#ea580c',
  '#f59e0b',
  '#d97706',
  '#c2410c',
  '#ff5416',
  '#fb923c',
  '#fdba74',
  '#9a3412',
];

const GREY_SHADES = [
  '#27272a',
  '#3f3f46',
  '#52525b',
  '#71717a',
  '#a1a1aa',
  '#d4d4d8',
];

interface Props {
  state: StudioState;
  activeSlide?: SlideId;
  previewScale?: number;
  selectedId?: string | null;
  isCanvasLocked?: boolean;
  activeDockTab?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMapChange?: (coords: [number, number], zoom: number, pitch: number) => void;
  onUploadClick?: () => void;
}

function getLogoColor(
  r: number,
  c: number,
  rows: number,
  cols: number,
  wp: WallpaperState
): string {
  if (wp.heroRow >= 0 && r === wp.heroRow) {
    return wp.heroColor;
  }
  if (wp.colorMode === 'oranges') {
    const idx = Math.abs((r * cols + c + wp.seed) % ORANGE_SHADES.length);
    return ORANGE_SHADES[idx];
  }
  if (wp.colorMode === 'greyscale') {
    const idx = Math.abs((r * cols + c + wp.seed) % GREY_SHADES.length);
    return GREY_SHADES[idx];
  }
  if (wp.colorMode === 'tint') {
    const alpha = 0.35 + (((r + c * 2) % 5) / 5) * 0.65 * (wp.variation || 1);
    return wp.baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }
  return wp.baseColor;
}

function WallpaperLayer({
  s,
  w,
  h,
  transparentBg = false,
}: {
  s: WallpaperState;
  w: number;
  h: number;
  transparentBg?: boolean;
}) {
  const cellW = w / s.cols;
  const cellH = h / s.rows;
  const text = s.text || 'SMAKR';
  const fontSize = Math.min(cellH * 0.9, cellW / (text.length * 0.62)) * s.size;

  const bgStyle: React.CSSProperties = {
    background: transparentBg
      ? 'transparent'
      : s.bgGradient
      ? `linear-gradient(135deg, ${s.bgColor} 0%, ${s.bgColor2 || '#181615'} 100%)`
      : s.bgColor,
  };

  const rowsArr = Array.from({ length: s.rows });
  const colsArr = Array.from({ length: s.cols });

  return (
    <div
      style={{ width: w, height: h, ...bgStyle }}
      className="relative overflow-hidden flex flex-col justify-between p-4 select-none"
    >
      <div
        className="w-full h-full flex flex-col justify-between"
        style={{
          transform: s.tilt ? `rotate(${s.tilt}deg)` : undefined,
          opacity: s.opacity ?? 1,
          filter: s.blur ? `blur(${s.blur}px)` : undefined,
        }}
      >
        {rowsArr.map((_, r) => {
          const isShifted = s.stagger && r % 2 === 1;
          return (
            <div
              key={r}
              className="flex justify-between items-center w-full"
              style={{
                transform: isShifted ? `translateX(${cellW * 0.25}px)` : undefined,
              }}
            >
              {colsArr.map((__, c) => {
                const color = getLogoColor(r, c, s.rows, s.cols, s);
                return (
                  <span
                    key={c}
                    className="font-comico font-black tracking-tighter uppercase whitespace-nowrap leading-none transition-colors"
                    style={{
                      fontSize,
                      color: s.outline ? 'transparent' : color,
                      WebkitTextStroke: s.outline ? `2px ${color}` : undefined,
                      textShadow: s.shadow
                        ? '0 4px 12px rgba(0,0,0,0.3)'
                        : undefined,
                    }}
                  >
                    {text}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SafeZoneOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between">
      {/* Top 15% Safe Zone */}
      <div className="h-[15%] w-full border-b-2 border-dashed border-red-500/70 bg-red-500/[0.05] flex items-end justify-center pb-2 px-4 text-center">
        <span className="text-red-600 text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          Instagram UI Overlays Zone (Top Carousel Count)
        </span>
      </div>
      {/* Middle Unobstructed Canvas */}
      <div className="flex-1" />
      {/* Bottom 15% Safe Zone */}
      <div className="h-[15%] w-full border-t-2 border-dashed border-red-500/70 bg-red-500/[0.05] flex items-start justify-center pt-2 px-4 text-center">
        <span className="text-red-600 text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          Instagram UI Overlays Zone (Bottom Captions)
        </span>
      </div>
    </div>
  );
}

export const StudioCanvas = forwardRef<HTMLDivElement, Props>(function StudioCanvas(
  { state, onMapChange },
  ref
) {
  const mode = state.mode || 'mascot';
  const { w, h } = CANVAS_SIZES[state.aspectRatio || '9:16'];

  const mascot = state.mascot || {
    ...DEFAULT_MASCOT_CONFIG,
    frameMode: 'bust-plus-bubble',
    bubbleText: 'For the biscoff lovers',
    bubbleStyle: 'round',
    circleBg: '#FAF7F2',
    customMascotDataUrl: null,
  };

  const dishTitle = state.dishTitle || DEFAULT_DISH_TITLE_STATE;

  const stickerOutlineStyle = dishTitle.stickerOutline
    ? {
        filter:
          'drop-shadow(4px 0 0 #FFFFFF) drop-shadow(-4px 0 0 #FFFFFF) drop-shadow(0 4px 0 #FFFFFF) drop-shadow(0 -4px 0 #FFFFFF) drop-shadow(0 12px 24px rgba(0,0,0,0.22))',
      }
    : {
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
      };

  // 1. MASCOT & BUBBLE MODE
  if (mode === 'mascot') {
    return (
      <div
        ref={ref}
        data-asset-builder="mascot"
        className="relative flex items-center justify-center p-6 bg-transparent select-none"
      >
        <SmakrMascotRig
          head={mascot.head}
          face={mascot.face}
          accessories={mascot.accessories}
          facialHair={mascot.facialHair}
          skinColor={mascot.skinColor}
          clothingColor={mascot.clothingColor}
          innerClothingColor={mascot.innerClothingColor}
          headContrastColor={mascot.headContrastColor}
          stickerOutline={mascot.stickerOutline}
          frameMode={mascot.frameMode}
          bodyPose={mascot.bodyPose}
          bubbleText={mascot.bubbleText}
          bubbleEyebrow={mascot.bubbleEyebrow}
          bubbleStyle={mascot.bubbleStyle}
          circleBg={mascot.circleBg}
          customMascotDataUrl={mascot.customMascotDataUrl}
          bubbleOffsetX={mascot.bubbleOffsetX}
          bubbleOffsetY={mascot.bubbleOffsetY}
          bubbleSide={mascot.bubbleSide}
          bubbleScale={mascot.bubbleScale}
          size={380}
        />
      </div>
    );
  }

  // 2. VENUE & MAP MODE
  if (mode === 'venue-map') {
    const exportTarget = state.map.exportTarget || 'card-only';
    const isIsolated = exportTarget === 'card-only' || exportTarget === 'pin-only';

    if (isIsolated) {
      return (
        <div
          ref={ref}
          data-asset-builder="venue-map-isolated"
          className="relative flex items-center justify-center p-4 sm:p-6 bg-transparent select-none"
        >
          <MapShot
            s={state.map}
            w={1080}
            h={exportTarget === 'card-only' ? 680 : 400}
            interactive={true}
            onMapChange={onMapChange}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-asset-builder="venue-map-full"
        style={{ width: w, height: h }}
        className="relative overflow-hidden bg-transparent select-none shadow-2xl rounded-2xl"
      >
        <MapShot
          s={state.map}
          w={w}
          h={h}
          interactive={true}
          onMapChange={onMapChange}
        />
        {state.showSafeZones && <SafeZoneOverlay />}
      </div>
    );
  }

  // 3. DISH TITLE & BADGE STICKER MODE
  if (mode === 'dish-title') {
    return (
      <div
        ref={ref}
        data-asset-builder="dish-title"
        className="relative flex flex-col items-center justify-center p-8 bg-transparent select-none"
      >
        {dishTitle.template === 'stacked' ? (
          <div
            className="flex flex-col items-center text-center max-w-[800px]"
            style={stickerOutlineStyle}
          >
            {/* Line 1: Comico Marker Style */}
            <span
              className="font-comico tracking-wide text-8xl md:text-9xl leading-none"
              style={{ color: dishTitle.line1Color || '#8B3A0E' }}
            >
              {dishTitle.line1Text || 'Biscoff'}
            </span>

            {/* Horizontal Underline Divider */}
            {dishTitle.showUnderline && (
              <div
                className="w-full h-3 md:h-3.5 rounded-full my-3 md:my-4 transition-all"
                style={{ backgroundColor: dishTitle.line1Color || '#8B3A0E' }}
              />
            )}

            {/* Line 2: Bold Geometric Sans */}
            <span
              className="font-sans font-black uppercase tracking-tight text-7xl md:text-8xl leading-none"
              style={{ color: dishTitle.line2Color || '#53A626' }}
            >
              {dishTitle.line2Text || 'Matcha'}
            </span>
          </div>
        ) : (
          <div style={stickerOutlineStyle} className="flex items-center justify-center">
            {dishTitle.pillType === 'price' && (
              <div className="px-9 py-4 rounded-full bg-[#e84a27] text-white shadow-xl flex items-center gap-3 border-4 border-white">
                <span className="font-comico text-6xl tracking-wide">
                  {dishTitle.priceText || '135 NOK'}
                </span>
              </div>
            )}

            {dishTitle.pillType === 'drop' && (
              <div className="px-8 py-3.5 rounded-full bg-[#181615] text-[#FAF7F2] shadow-xl flex items-center gap-4 border-4 border-white">
                <div className="w-11 h-11 rounded-full bg-[#e84a27] flex items-center justify-center overflow-hidden border-2 border-white">
                  <SmakrMascotRig size={46} frameMode="bust-only" stickerOutline={false} />
                </div>
                <span className="font-sans font-extrabold text-3xl tracking-tight">
                  {dishTitle.dropText || '✦ Drop 41 · Em Oi!'}
                </span>
              </div>
            )}

            {dishTitle.pillType === 'rating' && (
              <div className="px-8 py-3.5 rounded-full bg-black/95 text-white shadow-xl flex items-center gap-3 border-4 border-white">
                <span className="text-amber-400 text-4xl">★</span>
                <span className="font-comico text-5xl tracking-wide">
                  {dishTitle.ratingText || '4.9'}
                </span>
              </div>
            )}

            {dishTitle.pillType === 'status' && (
              <div className="px-8 py-4 rounded-full bg-emerald-600 text-white shadow-xl flex items-center gap-3 border-4 border-white font-sans font-bold text-3xl">
                <span>{dishTitle.statusText || '🟢 Open now'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 4. BRAND WALLPAPER MODE
  return (
    <div
      ref={ref}
      data-asset-builder="wallpaper"
      style={{ width: w, height: h }}
      className="relative overflow-hidden bg-transparent select-none shadow-2xl rounded-2xl"
    >
      <WallpaperLayer
        s={state.wallpaper}
        w={w}
        h={h}
        transparentBg={state.transparentBg}
      />
      {state.showSafeZones && <SafeZoneOverlay />}
    </div>
  );
});
