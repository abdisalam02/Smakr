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
  interactive?: boolean;
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
  { state, onMapChange, interactive = true },
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

  // Hard 0px-blur die-cut sticker rim ONLY — zero blurred drop-shadow so Canva Free exports have 100% pure alpha transparency
  const stickerOutlineStyle = dishTitle.stickerOutline
    ? {
        filter:
          'drop-shadow(3px 0 0 #FFFFFF) drop-shadow(-3px 0 0 #FFFFFF) drop-shadow(0 3px 0 #FFFFFF) drop-shadow(0 -3px 0 #FFFFFF) drop-shadow(2px 2px 0 #FFFFFF) drop-shadow(-2px -2px 0 #FFFFFF) drop-shadow(2px -2px 0 #FFFFFF) drop-shadow(-2px 2px 0 #FFFFFF)',
      }
    : undefined;

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
            interactive={interactive}
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
          interactive={interactive}
          onMapChange={onMapChange}
        />
        {state.showSafeZones && <SafeZoneOverlay />}
      </div>
    );
  }

  // 3. DISH TITLE & APP-UI STICKER KIT MODE
  if (mode === 'dish-title') {
    const uiTarget =
      dishTitle.uiKitExportTarget ||
      (dishTitle.template === 'pills'
        ? dishTitle.pillType === 'price'
          ? 'paprika-price-pill'
          : dishTitle.pillType === 'rating'
          ? 'location-rating-pill'
          : 'brand-logo-pill'
        : 'comico-title-only');

    const fontClassMap = {
      comico: 'font-comico tracking-wide',
      sans: 'font-sans font-black tracking-tight',
      serif: 'font-serif font-bold italic tracking-tight',
      mono: 'font-mono font-extrabold tracking-tight',
    } as const;

    const l1FontClass = fontClassMap[dishTitle.line1Font || 'comico'] || fontClassMap.comico;
    const l2FontClass = fontClassMap[dishTitle.line2Font || 'sans'] || fontClassMap.sans;
    const scaleVal = dishTitle.titleScale ?? 1;

    const venueName = dishTitle.venueText ?? state.map.name ?? 'Godt Brød';
    const neighborhoodName = dishTitle.neighborhoodText ?? state.map.neighborhood ?? 'Grünerløkka';
    const ratingVal = (dishTitle.ratingText ?? '4.9').replace(/★\s*/, '');
    const priceLabel = dishTitle.priceText || '79 kr';
    const priceBg = dishTitle.priceBgColor || '#E84A27';
    const priceFg = dishTitle.priceTextColor || '#FFFFFF';
    const priceTiltDeg = dishTitle.priceTilt ?? -2;
    const locIcon = dishTitle.locationIcon ?? '📍';
    const fullTitle =
      dishTitle.dishTitle ||
      `${dishTitle.line1Text || 'Biscoff'} ${dishTitle.line2Text || 'Matcha'}`.trim();
    const quoteText =
      dishTitle.tasteNote ??
      'Creamy ceremonial matcha layered over spiced biscoff cream.';
    const bgPhoto =
      dishTitle.backgroundPhoto ||
      state.map.photo ||
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1080&q=85';

    const cardBg = dishTitle.cardBgColor || '#181615';
    const isLightCard = ['#ffffff', '#faf7f2', '#f7e4d5', '#e6dec8', '#f3ede2'].includes(
      cardBg.toLowerCase()
    );
    const cardFg = dishTitle.cardTextColor || (isLightCard ? '#181615' : '#FFFFFF');
    const cardAccent = dishTitle.cardAccentColor || '#E84A27';

    const logoLeft = dishTitle.logoLeftText ?? 'SMAKR';
    const logoRight = dishTitle.logoRightText ?? 'OSLO';
    const logoTheme = dishTitle.logoTheme || 'porcelain';
    const logoBg =
      dishTitle.logoBgColor || (logoTheme === 'dark' ? '#181615' : '#FAF7F2');
    const logoFg =
      dishTitle.logoTextColor || (logoTheme === 'dark' ? '#FAF7F2' : '#181615');
    const logoAccent = dishTitle.logoAccentColor || '#E84A27';

    // Target 1: Full Slide 1 Cover (1080x1350 4:5)
    if (uiTarget === 'full-cover') {
      return (
        <div
          ref={ref}
          data-asset-builder="dish-title-full-cover"
          style={{ width: 1080, height: 1350 }}
          className="relative overflow-hidden bg-[#181615] select-none"
        >
          {/* Full-Bleed Dish Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgPhoto}
            alt={fullTitle}
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.18) 100%)',
            }}
          />

          {/* Top Bar: Top-Left Brand Pill + Top-Right Price Pill */}
          <div className="absolute top-12 inset-x-12 flex items-center justify-between z-10">
            <div
              style={{ backgroundColor: logoBg, color: logoFg }}
              className="px-7 py-3.5 rounded-full border-2 border-white/60 flex items-center gap-3 shadow-lg"
            >
              <span
                style={{ color: logoAccent }}
                className={`${l1FontClass} text-4xl leading-none`}
              >
                {logoLeft}
              </span>
              {logoRight && (
                <span
                  style={{ color: logoFg }}
                  className="font-sans font-extrabold text-xl tracking-[0.22em] uppercase leading-none"
                >
                  {logoRight}
                </span>
              )}
            </div>

            {priceLabel && (
              <div
                style={{
                  backgroundColor: priceBg,
                  color: priceFg,
                  transform: `rotate(${priceTiltDeg}deg)`,
                }}
                className={`px-8 py-3.5 rounded-full ${l2FontClass} text-4xl border-2 border-white/30 shadow-lg`}
              >
                {priceLabel}
              </div>
            )}
          </div>

          {/* Bottom Overlay: Dish Verdict Card + Optional Corner Mascot */}
          <div className="absolute bottom-12 inset-x-12 z-10 flex items-end gap-5">
            <div
              style={{
                backgroundColor: cardBg,
                color: cardFg,
              }}
              className="flex-1 rounded-[40px] border-2 border-white/25 p-9 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <h2
                  style={{ color: cardFg }}
                  className={`${l1FontClass} text-6xl leading-tight`}
                >
                  {fullTitle}
                </h2>
              </div>

              <div className="flex items-center gap-3 text-2xl font-semibold flex-wrap opacity-95">
                {locIcon && <span style={{ color: cardAccent }}>{locIcon}</span>}
                <span className="font-bold">{venueName}</span>
                {neighborhoodName && (
                  <>
                    <span className="opacity-50">·</span>
                    <span className="opacity-85">{neighborhoodName}</span>
                  </>
                )}
                {ratingVal && (
                  <>
                    <span className="opacity-50">·</span>
                    <span
                      style={{
                        backgroundColor: isLightCard
                          ? 'rgba(24,22,21,0.08)'
                          : 'rgba(255,255,255,0.14)',
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-current/15 font-bold text-xl"
                    >
                      <span className="text-amber-400">★</span>
                      <span>{ratingVal}</span>
                    </span>
                  </>
                )}
              </div>

              {quoteText && (
                <div
                  style={{
                    backgroundColor: isLightCard
                      ? 'rgba(24,22,21,0.06)'
                      : 'rgba(0,0,0,0.45)',
                  }}
                  className="rounded-2xl border border-current/15 px-5 py-3.5"
                >
                  <p className="text-2xl leading-snug">
                    <span
                      style={{ color: cardAccent }}
                      className="font-extrabold not-italic mr-2"
                    >
                      ✦
                    </span>
                    <span className="italic">&ldquo;{quoteText}&rdquo;</span>
                  </p>
                </div>
              )}
            </div>

            {dishTitle.showMascotOnCover !== false && (
              <div className="shrink-0 -mb-2">
                <SmakrMascotRig
                  head="afro"
                  face="smileBig"
                  accessories="glasses-2"
                  skinColor="#D08B5B"
                  clothingColor="#E84A27"
                  headContrastColor="#181615"
                  frameMode="bust-only"
                  bodyPose="pointing-up"
                  stickerOutline={true}
                  size={210}
                />
              </div>
            )}
          </div>
          {state.showSafeZones && <SafeZoneOverlay />}
        </div>
      );
    }

    // Target 2: Dish Verdict Card Only (Isolated Transparent Sticker)
    if (uiTarget === 'glass-verdict-card') {
      return (
        <div
          ref={ref}
          data-asset-builder="dish-title-glass-card"
          className="relative inline-flex items-center justify-center p-3 bg-transparent select-none"
        >
          <div
            style={{
              ...stickerOutlineStyle,
              backgroundColor: cardBg,
              color: cardFg,
              transform: scaleVal !== 1 ? `scale(${scaleVal})` : undefined,
            }}
            className="relative w-[820px] rounded-[38px] border-2 border-white/25 p-8 space-y-4"
          >
            {dishTitle.showPriceOnCard !== false && priceLabel && (
              <div
                style={{
                  backgroundColor: priceBg,
                  color: priceFg,
                  transform: `rotate(${priceTiltDeg}deg)`,
                }}
                className={`inline-flex items-center px-6 py-2 rounded-full ${l2FontClass} text-3xl border-2 border-white/25`}
              >
                {priceLabel}
              </div>
            )}

            <h2
              style={{ color: cardFg }}
              className={`${l1FontClass} text-5xl leading-tight`}
            >
              {fullTitle}
            </h2>

            <div className="flex items-center gap-2.5 text-xl font-semibold flex-wrap">
              {locIcon && <span style={{ color: cardAccent }}>{locIcon}</span>}
              <span className="font-bold">{venueName}</span>
              {neighborhoodName && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="opacity-85">{neighborhoodName}</span>
                </>
              )}
              {ratingVal && (
                <>
                  <span className="opacity-50">·</span>
                  <span
                    style={{
                      backgroundColor: isLightCard
                        ? 'rgba(24,22,21,0.08)'
                        : 'rgba(255,255,255,0.16)',
                    }}
                    className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full border border-current/20 font-bold text-lg"
                  >
                    <span className="text-amber-400">★</span>
                    <span>{ratingVal}</span>
                  </span>
                </>
              )}
            </div>

            {quoteText && (
              <div
                style={{
                  backgroundColor: isLightCard
                    ? 'rgba(24,22,21,0.06)'
                    : 'rgba(0,0,0,0.48)',
                }}
                className="rounded-2xl border border-current/15 px-4 py-3"
              >
                <p className="text-xl leading-snug">
                  <span
                    style={{ color: cardAccent }}
                    className="font-extrabold not-italic mr-2"
                  >
                    ✦
                  </span>
                  <span className="italic">&ldquo;{quoteText}&rdquo;</span>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Target 3: Price / Callout Badge Only
    if (uiTarget === 'paprika-price-pill') {
      return (
        <div
          ref={ref}
          data-asset-builder="dish-title-price-pill"
          className="relative inline-flex items-center justify-center p-3 bg-transparent select-none"
        >
          <div
            style={{
              ...stickerOutlineStyle,
              backgroundColor: priceBg,
              color: priceFg,
              transform: `rotate(${priceTiltDeg}deg) scale(${scaleVal})`,
            }}
            className={`px-10 py-5 rounded-full ${l1FontClass} text-6xl border-[3px] border-white/30 flex items-center justify-center`}
          >
            <span>{priceLabel}</span>
          </div>
        </div>
      );
    }

    // Target 4: Smakr Oslo Brand Logo Pill Only
    if (uiTarget === 'brand-logo-pill') {
      return (
        <div
          ref={ref}
          data-asset-builder="dish-title-logo-pill"
          className="relative inline-flex items-center justify-center p-3 bg-transparent select-none"
        >
          {logoTheme === 'text-only' ? (
            <div
              style={{
                ...stickerOutlineStyle,
                transform: scaleVal !== 1 ? `scale(${scaleVal})` : undefined,
              }}
              className="inline-flex items-baseline gap-4 px-2 py-1"
            >
              <span
                style={{ color: logoAccent }}
                className={`${l1FontClass} text-7xl leading-none`}
              >
                {logoLeft}
              </span>
              {logoRight && (
                <span
                  style={{ color: logoFg }}
                  className={`${l2FontClass} text-4xl tracking-[0.24em] uppercase leading-none`}
                >
                  {logoRight}
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                ...stickerOutlineStyle,
                backgroundColor: logoBg,
                color: logoFg,
                transform: scaleVal !== 1 ? `scale(${scaleVal})` : undefined,
              }}
              className="px-9 py-4 rounded-full flex items-center gap-4 border-[3px] border-[#E6DEC8]/60"
            >
              <span
                style={{ color: logoAccent }}
                className={`${l1FontClass} text-5xl leading-none`}
              >
                {logoLeft}
              </span>
              {logoRight && (
                <span
                  style={{ color: logoFg }}
                  className={`${l2FontClass} text-2xl tracking-[0.24em] uppercase leading-none`}
                >
                  {logoRight}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Target 5: Location & Rating Pill Only
    if (uiTarget === 'location-rating-pill') {
      const locTheme = dishTitle.locationTheme || 'dark';
      const locBg =
        dishTitle.locationBgColor ||
        (locTheme === 'porcelain' ? '#FAF7F2' : '#181615');
      const isLightLoc = ['#ffffff', '#faf7f2', '#f7e4d5', '#e6dec8', '#f3ede2'].includes(
        locBg.toLowerCase()
      );
      const locFg =
        dishTitle.locationTextColor || (isLightLoc ? '#181615' : '#FFFFFF');

      return (
        <div
          ref={ref}
          data-asset-builder="dish-title-location-pill"
          className="relative inline-flex items-center justify-center p-3 bg-transparent select-none"
        >
          <div
            style={{
              ...stickerOutlineStyle,
              backgroundColor: locBg,
              color: locFg,
              transform: scaleVal !== 1 ? `scale(${scaleVal})` : undefined,
            }}
            className={`px-8 py-4 rounded-full flex items-center gap-3 text-3xl ${l2FontClass} border-[3px] ${
              isLightLoc ? 'border-[#E6DEC8]' : 'border-white/25'
            }`}
          >
            {locIcon && <span style={{ color: cardAccent }}>{locIcon}</span>}
            <span>{venueName}</span>
            {neighborhoodName && (
              <>
                <span className="opacity-50">·</span>
                <span className="opacity-90 font-semibold">{neighborhoodName}</span>
              </>
            )}
            {ratingVal && (
              <>
                <span className="opacity-50">·</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold">
                  <span>★</span>
                  <span style={{ color: locFg }}>{ratingVal}</span>
                </span>
              </>
            )}
          </div>
        </div>
      );
    }

    // Target 6: Title Sticker Only (Zero blurred drop-shadow — pure alpha transparency!)
    return (
      <div
        ref={ref}
        data-asset-builder="dish-title"
        className="relative inline-flex flex-col items-center justify-center p-3 bg-transparent select-none"
      >
        <div
          className="flex flex-col items-center text-center max-w-[820px]"
          style={{
            ...stickerOutlineStyle,
            transform: scaleVal !== 1 ? `scale(${scaleVal})` : undefined,
          }}
        >
          {/* Line 1 */}
          <span
            className={`${l1FontClass} text-8xl md:text-9xl leading-none`}
            style={{ color: dishTitle.line1Color || '#8B3A0E' }}
          >
            {dishTitle.line1Text || 'Biscoff'}
          </span>

          {/* Horizontal Underline Divider */}
          {dishTitle.showUnderline && (
            <div
              className="w-full h-3 md:h-3.5 rounded-full my-3 md:my-4"
              style={{ backgroundColor: dishTitle.line1Color || '#8B3A0E' }}
            />
          )}

          {/* Line 2 */}
          {dishTitle.line2Text && (
            <span
              className={`${l2FontClass} ${
                dishTitle.uppercaseLine2 !== false ? 'uppercase' : ''
              } text-7xl md:text-8xl leading-none`}
              style={{ color: dishTitle.line2Color || '#53A626' }}
            >
              {dishTitle.line2Text}
            </span>
          )}
        </div>
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
