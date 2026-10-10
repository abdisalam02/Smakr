'use client';

import { forwardRef } from 'react';
import { MascotCharacter } from '@/components/avatar/MascotCharacter';
import { useCityPulseStore } from '@/store/useCityPulseStore';
import {
  CANVAS_SIZES,
  type SlideId,
  type StudioElement,
  type StudioState,
  type WallpaperState,
  type PhotoState,
} from '@/types/studio';

const ORANGE_SHADES = [
  '#e84a27', // Burnt Paprika
  '#f97316', // Maple Orange
  '#ea580c', // Bright Flame
  '#f59e0b', // Golden Amber
  '#d97706', // Birch Gold
  '#c2410c', // Russet Orange
  '#ff5416', // Seville Orange
  '#fb923c', // Warm Tangerine
  '#fdba74', // Soft Amber
  '#9a3412', // Deep Russet
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
  activeSlide: SlideId;
  previewScale: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
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
    // Generate subtle alpha variation
    const alpha = 0.35 + (((r + c * 2) % 5) / 5) * 0.65 * (wp.variation || 1);
    return wp.baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }

  return wp.baseColor;
}

function WallpaperLayer({ s, w, h }: { s: WallpaperState; w: number; h: number }) {
  const cellW = w / s.cols;
  const cellH = h / s.rows;
  const text = s.text || 'SMAKR';
  const fontSize = Math.min(cellH * 0.9, cellW / (text.length * 0.62)) * s.size;

  const bgStyle: React.CSSProperties = {
    background: s.bgGradient
      ? `linear-gradient(135deg, ${s.bgColor} 0%, ${s.bgColor2 || '#e84a27'} 100%)`
      : s.bgColor,
  };

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden select-none"
      style={bgStyle}
    >
      <div
        className="w-full h-full flex flex-col justify-center"
        style={{
          transform: s.tilt ? `rotate(${s.tilt}deg) scale(1.15)` : undefined,
          filter: s.blur > 0 ? `blur(${s.blur}px)` : undefined,
          opacity: s.opacity ?? 1,
        }}
      >
        {Array.from({ length: s.rows }, (_, r) => {
          const rowShift = s.stagger && r % 2 !== 0 ? -cellW / 2 : 0;
          return (
            <div
              key={r}
              className="flex"
              style={{
                height: cellH,
                width: w + cellW,
                marginLeft: rowShift,
              }}
            >
              {Array.from({ length: s.cols + 2 }, (_, c) => {
                const color = getLogoColor(r, c, s.rows, s.cols, s);
                return (
                  <div
                    key={c}
                    className="flex shrink-0 items-center justify-center whitespace-nowrap font-comico leading-none transition-all"
                    style={{
                      width: cellW,
                      height: cellH,
                      fontSize,
                      color: s.outline ? 'transparent' : color,
                      WebkitTextStroke: s.outline ? `2.5px ${color}` : undefined,
                      textShadow: s.shadow
                        ? '0 12px 24px rgba(0, 0, 0, 0.28)'
                        : undefined,
                      ...(s.glass
                        ? {
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '16px',
                            margin: '4px',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
                          }
                        : {}),
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoLayer({ s, w, h }: { s: PhotoState; w: number; h: number }) {
  if (!s.src) {
    return (
      <div
        style={{ width: w, height: h, background: s.bgColor || '#181615' }}
        className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-zinc-400 font-jakarta select-none"
      >
        <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center text-5xl mb-6">
          📷
        </div>
        <h3 className="text-4xl font-bold text-white mb-3">No Photo Uploaded</h3>
        <p className="text-2xl text-zinc-400 max-w-md">
          Tap “Upload Photo” or “Capture Map Shot” in the controls below to build your slide.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ width: w, height: h, background: s.bgColor || '#181615' }}
      className="absolute inset-0 overflow-hidden select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.src}
        alt=""
        crossOrigin="anonymous"
        className="w-full h-full"
        style={{
          objectFit: s.fit,
          transform: `scale(${s.zoom || 1})`,
          filter: [
            s.grayscale ? 'grayscale(1)' : '',
            s.blur > 0 ? `blur(${s.blur}px)` : '',
          ]
            .filter(Boolean)
            .join(' ') || undefined,
        }}
      />

      {/* Dim scrim */}
      {s.dim > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0, 0, 0, ${s.dim})` }}
        />
      )}

      {/* Vignette */}
      {s.vignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 160px 40px rgba(0, 0, 0, 0.75)',
          }}
        />
      )}
    </div>
  );
}

function SpeechBubble({
  text,
  side,
  style,
  bg,
  ink,
}: {
  text: string;
  side: 'top' | 'left' | 'right' | 'bottom';
  style: 'round' | 'shout' | 'thought' | 'box';
  bg: string;
  ink: string;
}) {
  const isTop = side === 'top';
  const isBottom = side === 'bottom';
  const isLeft = side === 'left';
  const isRight = side === 'right';

  const positionClasses = isTop
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-6'
    : isBottom
    ? 'top-full left-1/2 -translate-x-1/2 mt-6'
    : isLeft
    ? 'right-full top-1/2 -translate-y-1/2 mr-6'
    : 'left-full top-1/2 -translate-y-1/2 ml-6';

  const roundedClasses =
    style === 'round'
      ? 'rounded-3xl'
      : style === 'box'
      ? 'rounded-xl'
      : style === 'thought'
      ? 'rounded-[32px]'
      : 'rounded-2xl';

  return (
    <div
      className={`absolute ${positionClasses} w-[420px] p-5 shadow-2xl ${roundedClasses} border-2 border-black/10 select-none z-20`}
      style={{ background: bg, color: ink }}
    >
      <div className="font-semibold text-3xl text-center leading-snug font-jakarta">
        {text}
      </div>

      {/* Pointer tail */}
      {isTop && (
        <svg
          width="40"
          height="24"
          viewBox="0 0 40 24"
          className="absolute left-1/2 -translate-x-1/2 top-full"
        >
          <path d="M0 0 L20 24 L40 0 Z" fill={bg} />
        </svg>
      )}
      {isBottom && (
        <svg
          width="40"
          height="24"
          viewBox="0 0 40 24"
          className="absolute left-1/2 -translate-x-1/2 bottom-full rotate-180"
        >
          <path d="M0 0 L20 24 L40 0 Z" fill={bg} />
        </svg>
      )}
      {isLeft && (
        <svg
          width="24"
          height="40"
          viewBox="0 0 24 40"
          className="absolute top-1/2 -translate-y-1/2 left-full"
        >
          <path d="M0 0 L24 20 L0 40 Z" fill={bg} />
        </svg>
      )}
      {isRight && (
        <svg
          width="24"
          height="40"
          viewBox="0 0 24 40"
          className="absolute top-1/2 -translate-y-1/2 right-full rotate-180"
        >
          <path d="M0 0 L24 20 L0 40 Z" fill={bg} />
        </svg>
      )}
    </div>
  );
}

function ElementView({
  el,
  selected,
  scale,
  onSelect,
  onMove,
}: {
  el: StudioElement;
  selected: boolean;
  scale: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const mascotConfig = useCityPulseStore((s) => s.mascotConfig);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    const move = (ev: PointerEvent) => {
      onMove(origX + (ev.clientX - startX) / scale, origY + (ev.clientY - startY) / scale);
    };

    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };

    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };

  let content: React.ReactNode = null;

  if (el.kind === 'text') {
    content = (
      <span
        className={`inline-block px-6 py-2 leading-tight text-center ${
          el.font === 'comico' ? 'font-comico' : 'font-jakarta font-extrabold'
        }`}
        style={{
          color: el.color,
          fontSize: 96,
          background: el.bgColor || undefined,
          borderRadius: el.bgColor ? '24px' : undefined,
          WebkitTextStroke:
            el.strokeWidth > 0 ? `${el.strokeWidth}px ${el.strokeColor}` : undefined,
          textShadow: el.shadow ? '0 10px 24px rgba(0, 0, 0, 0.35)' : undefined,
          opacity: el.opacity ?? 1,
        }}
      >
        {el.text}
      </span>
    );
  } else if (el.kind === 'badge') {
    content = (
      <span
        className="whitespace-nowrap rounded-full border-4 px-10 py-4 font-comico text-5xl shadow-xl inline-block"
        style={{
          color: el.color,
          borderColor: el.color,
          background: el.bgColor || '#FAF7F2',
          textShadow: el.shadow ? '0 8px 16px rgba(0,0,0,0.2)' : undefined,
          opacity: el.opacity ?? 1,
        }}
      >
        {el.text}
      </span>
    );
  } else if (el.kind === 'image' && el.src) {
    // eslint-disable-next-line @next/next/no-img-element
    content = (
      <img
        src={el.src}
        alt=""
        crossOrigin="anonymous"
        className="w-[520px] rounded-[26px] shadow-2xl select-none"
        draggable={false}
        style={{ opacity: el.opacity ?? 1 }}
      />
    );
  } else if (el.kind === 'mascot') {
    content = (
      <div className="relative">
        {el.bubble && (
          <SpeechBubble
            text={el.bubble}
            side={el.bubbleSide || 'top'}
            style={el.bubbleStyle || 'round'}
            bg={el.bubbleBg || '#ffffff'}
            ink={el.bubbleInk || '#181615'}
          />
        )}
        <div
          className="drop-shadow-2xl transition-transform"
          style={{
            transform: el.flip ? 'scaleX(-1)' : undefined,
            opacity: el.opacity ?? 1,
          }}
        >
          <MascotCharacter config={mascotConfig} size={320} />
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      className="absolute cursor-grab touch-none select-none"
      style={{
        left: el.x,
        top: el.y,
        transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
      }}
    >
      {content}
      {selected && (
        <div
          data-export-ignore
          className="pointer-events-none absolute -inset-4 rounded-2xl border-4 border-dashed border-[#e84a27]"
        />
      )}
    </div>
  );
}

export const StudioCanvas = forwardRef<HTMLDivElement, Props>(function StudioCanvas(
  { state, activeSlide, previewScale, selectedId, onSelect, onMove },
  ref
) {
  const { w, h } = CANVAS_SIZES[state.aspectRatio];
  const elements = state.elements[activeSlide] || [];

  return (
    <div
      ref={ref}
      style={{ width: w, height: h }}
      className="relative overflow-hidden font-jakarta select-none"
      onPointerDown={() => onSelect(null)}
    >
      {/* Slide base layer */}
      {activeSlide === 'background' ? (
        <WallpaperLayer s={state.wallpaper} w={w} h={h} />
      ) : (
        <PhotoLayer s={state.photo} w={w} h={h} />
      )}

      {/* Free draggable elements on active slide */}
      {elements.map((el) => (
        <ElementView
          key={el.id}
          el={el}
          selected={el.id === selectedId}
          scale={previewScale}
          onSelect={() => onSelect(el.id)}
          onMove={(x, y) => onMove(el.id, x, y)}
        />
      ))}

      {/* Risograph grain overlay */}
      {state.showNoiseTexture && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25 mix-blend-overlay"
        >
          <filter id="studio-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#studio-noise)" />
        </svg>
      )}

      {/* Instagram Story Safe Zones Overlay */}
      {state.showSafeZones &&
        [{ top: 0, height: 220 }, { bottom: 0, height: 280 }].map((pos, i) => (
          <div
            key={i}
            data-export-ignore
            className="pointer-events-none absolute inset-x-0"
            style={{
              ...pos,
              background:
                'repeating-linear-gradient(45deg, rgba(220,38,38,0.35) 0 14px, rgba(220,38,38,0.1) 14px 28px)',
            }}
          />
        ))}
    </div>
  );
});
