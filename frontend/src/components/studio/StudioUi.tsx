'use client';

export const pill = (on: boolean) =>
  `min-h-[38px] rounded-xl px-3.5 text-xs font-semibold border transition-all ${
    on
      ? 'bg-[#e84a27] border-[#e84a27] text-white shadow-xs'
      : 'bg-white border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
  }`;

export const field =
  'w-full min-h-[38px] rounded-xl border border-[#E6DEC8] bg-white px-3 text-xs text-[#231F1D] placeholder:text-[#A89F91]';

const label = 'block text-xs font-semibold text-[#6E655F]';

export function SteppedScaleControl(p: {
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  presets?: { label: string; val: number }[];
  onChange: (v: number) => void;
}) {
  const min = p.min ?? 0.5;
  const max = p.max ?? 2.0;
  const step = p.step ?? 0.05;
  const presets = p.presets ?? [
    { label: 'S (80%)', val: 0.8 },
    { label: 'M (100%)', val: 1.0 },
    { label: 'L (120%)', val: 1.2 },
    { label: 'XL (140%)', val: 1.4 },
  ];

  const decrement = () => {
    const next = Math.max(min, Math.round((p.value - step) * 100) / 100);
    p.onChange(next);
  };

  const increment = () => {
    const next = Math.min(max, Math.round((p.value + step) * 100) / 100);
    p.onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#6E655F] uppercase tracking-wider truncate">
          {p.name}
        </span>
        <span className="font-mono font-bold text-[#231F1D]">
          {Math.round(p.value * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={decrement}
          className="min-h-[36px] w-9 shrink-0 rounded-xl border border-[#E6DEC8] bg-white text-sm font-bold text-[#231F1D] hover:bg-[#FAF7F2] active:scale-95 transition-all flex items-center justify-center shadow-xs"
          title="Decrease"
        >
          −
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          {presets.map((preset) => {
            const isMatch = Math.abs(p.value - preset.val) < 0.03;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => p.onChange(preset.val)}
                className={`flex-1 min-h-[36px] px-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isMatch
                    ? 'bg-[#e84a27] text-white shadow-xs'
                    : 'bg-white border border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={increment}
          className="min-h-[36px] w-9 shrink-0 rounded-xl border border-[#E6DEC8] bg-white text-sm font-bold text-[#231F1D] hover:bg-[#FAF7F2] active:scale-95 transition-all flex items-center justify-center shadow-xs"
          title="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SteppedCounterControl(p: {
  name: string;
  value: number;
  min?: number;
  max?: number;
  presets?: number[];
  onChange: (v: number) => void;
}) {
  const min = p.min ?? 1;
  const max = p.max ?? 30;
  const presets = p.presets ?? [6, 9, 12, 15];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#6E655F] uppercase tracking-wider truncate">
          {p.name}
        </span>
        <span className="font-mono font-bold text-[#231F1D]">
          {p.value}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => p.onChange(Math.max(min, p.value - 1))}
          className="min-h-[36px] w-9 shrink-0 rounded-xl border border-[#E6DEC8] bg-white text-sm font-bold text-[#231F1D] hover:bg-[#FAF7F2] active:scale-95 transition-all flex items-center justify-center shadow-xs"
        >
          −
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          {presets.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => p.onChange(val)}
              className={`flex-1 min-h-[36px] px-2 rounded-xl text-xs font-bold transition-all ${
                p.value === val
                  ? 'bg-[#e84a27] text-white shadow-xs'
                  : 'bg-white border border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => p.onChange(Math.min(max, p.value + 1))}
          className="min-h-[36px] w-9 shrink-0 rounded-xl border border-[#E6DEC8] bg-white text-sm font-bold text-[#231F1D] hover:bg-[#FAF7F2] active:scale-95 transition-all flex items-center justify-center shadow-xs"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SteppedZoomPanControl(p: {
  zoom: number;
  panX: number;
  panY: number;
  onZoomChange: (z: number) => void;
  onPanChange: (x: number, y: number) => void;
}) {
  const stepZoom = 0.1;
  const stepPan = 30;

  return (
    <div className="space-y-2 p-3 rounded-2xl bg-[#EFEAE1]/60 border border-[#E6DEC8]">
      {/* Zoom Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#6E655F] uppercase tracking-wider">
          Zoom ({Math.round((p.zoom || 1) * 100)}%)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => p.onZoomChange(Math.max(0.5, Math.round(((p.zoom || 1) - stepZoom) * 10) / 10))}
            className="w-8 h-8 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => p.onZoomChange(1)}
            className="px-2.5 h-8 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Reset Zoom"
          >
            100%
          </button>
          <button
            type="button"
            onClick={() => p.onZoomChange(Math.min(3, Math.round(((p.zoom || 1) + stepZoom) * 10) / 10))}
            className="w-8 h-8 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Pan Nudge Row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6DEC8]">
        <span className="text-xs font-bold text-[#6E655F] uppercase tracking-wider">
          Frame Pan
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => p.onPanChange(p.panX, Math.max(-300, Math.min(300, (p.panY || 0) - stepPan)))}
            className="w-7 h-7 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Nudge Up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => p.onPanChange(p.panX, Math.max(-300, Math.min(300, (p.panY || 0) + stepPan)))}
            className="w-7 h-7 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Nudge Down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => p.onPanChange(Math.max(-300, Math.min(300, (p.panX || 0) - stepPan)), p.panY)}
            className="w-7 h-7 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Nudge Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => p.onPanChange(Math.max(-300, Math.min(300, (p.panX || 0) + stepPan)), p.panY)}
            className="w-7 h-7 rounded-lg bg-white border border-[#E6DEC8] text-xs font-bold text-[#231F1D] flex items-center justify-center active:scale-95 shadow-xs"
            title="Nudge Right"
          >
            →
          </button>
          {(() => {
            const isModified = p.panX !== 0 || p.panY !== 0 || Math.abs((p.zoom || 1) - 1) > 0.02;
            return (
              <button
                type="button"
                onClick={() => {
                  p.onPanChange(0, 0);
                  p.onZoomChange(1);
                }}
                className={`px-2 h-7 rounded-lg border text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all shadow-xs ${
                  isModified
                    ? 'bg-[#e84a27] border-[#e84a27] text-white shadow-xs'
                    : 'bg-white border-[#E6DEC8] text-[#6E655F]'
                }`}
                title="Reset Frame"
              >
                ⌖ Reset Frame
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export function Slider(p: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={label}>
      <span className="block truncate text-xs font-semibold">
        {p.name}: {Number.isInteger(p.value) ? p.value : p.value.toFixed(2)}
      </span>
      <input
        type="range"
        min={p.min}
        max={p.max}
        step={p.step ?? 1}
        value={p.value}
        onChange={(e) => p.onChange(+e.target.value)}
        className="h-11 w-full"
      />
    </label>
  );
}

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { CURATED_SWATCHES } from '@/types/studio';

const DEFAULT_VIVIDS = [
  { label: 'Burnt Paprika', hex: '#E84A27' },
  { label: 'Warm Cinnamon', hex: '#8B3A0E' },
  { label: 'Golden Amber', hex: '#F59E0B' },
  { label: 'Forest Matcha', hex: '#2D5A27' },
  { label: 'Classic Cobalt', hex: '#1E40AF' },
  { label: 'Bordeaux Wine', hex: '#9F1239' },
  { label: 'Charcoal Denim', hex: '#27272A' },
];

const DEFAULT_PASTELS = [
  { label: 'Warm Ivory', hex: '#F7E4D5' },
  { label: 'Nordic Fair', hex: '#FFDBB4' },
  { label: 'Peach Honey', hex: '#EDB98A' },
  { label: 'Warm Oat', hex: '#FAF7F2' },
  { label: 'Sage Linen', hex: '#86EFAC' },
  { label: 'Sky Mist', hex: '#BAE6FD' },
  { label: 'Pale Plum', hex: '#FBCFE8' },
];

const DEFAULT_DARKS = [
  { label: 'Late Night Black', hex: '#181615' },
  { label: 'Deep Cocoa', hex: '#3B2219' },
  { label: 'Rich Espresso', hex: '#694D3D' },
  { label: 'Chestnut', hex: '#8B4513' },
  { label: 'Warm Caramel', hex: '#AE5D29' },
  { label: 'Golden Bronze', hex: '#D08B5B' },
  { label: 'Charcoal', hex: '#3F3F46' },
];

export function Color(p: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  swatches?: { label: string; hex: string }[];
}) {
  const [openCustom, setOpenCustom] = useState(false);

  const normalizedVal = p.value.startsWith('#') ? p.value : `#${p.value}`;
  const activeSwatch =
    p.swatches?.find((s) => s.hex.toLowerCase() === normalizedVal.toLowerCase()) ||
    CURATED_SWATCHES.find((s) => s.hex.toLowerCase() === normalizedVal.toLowerCase());

  const roleSwatches = p.swatches || CURATED_SWATCHES;

  return (
    <div className="bg-white rounded-2xl border border-[#E6DEC8] p-3 shadow-2xs space-y-2.5 transition-all">
      {/* 1. Header: Name, Active Color Label, and Custom Toggle */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <span className="block text-xs font-bold text-[#231F1D] truncate">
            {p.name}
          </span>
          <span className="block text-[10px] text-[#6E655F] font-mono mt-0.5 truncate">
            {activeSwatch ? activeSwatch.label : normalizedVal}
          </span>
        </div>

        {/* Active Badge + Custom Hex Expand Toggle */}
        <button
          type="button"
          onClick={() => setOpenCustom(!openCustom)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E6DEC8] hover:border-[#D8CFC0] active:scale-95 transition-all"
          title="Toggle custom color palette"
        >
          <span
            className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
            style={{ backgroundColor: normalizedVal }}
          />
          <span className="text-[10px] font-mono font-bold text-[#231F1D] uppercase">
            {normalizedVal}
          </span>
          {openCustom ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#6E655F]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#6E655F]" />
          )}
        </button>
      </div>

      {/* 2. 1-Tap Horizontal Swatch Strip (Always Visible, Never Clips or Drops Off-Screen) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {roleSwatches.map((s) => {
          const isSelected = s.hex.toLowerCase() === normalizedVal.toLowerCase();
          return (
            <button
              key={s.hex}
              type="button"
              onClick={() => p.onChange(s.hex)}
              className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shadow-2xs"
              style={{ backgroundColor: s.hex }}
              title={s.label}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 stroke-[3] drop-shadow-xs ${
                    ['#ffffff', '#faf7f2', '#f7e4d5', '#ffdbb4', '#f3ede2', '#86efac', '#e8e1e1'].includes(s.hex.toLowerCase())
                      ? 'text-[#181615]'
                      : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. In-Flow Expandable Custom Hex & Native Color Wheel (Never Goes Under Screen) */}
      {openCustom && (
        <div className="pt-2.5 border-t border-[#E6DEC8] space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#5C534E]">Custom Hex / Eyedropper</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                maxLength={7}
                value={p.value}
                onChange={(e) => p.onChange(e.target.value)}
                className="w-20 h-7 px-2 rounded-lg border border-[#D8CFC0] bg-[#FAF7F2] font-mono text-[11px] text-[#231F1D] text-center font-bold uppercase"
              />
              <label
                className="relative flex items-center justify-center w-7 h-7 rounded-full border border-[#D8CFC0] bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 to-indigo-500 cursor-pointer shadow-xs hover:scale-110 active:scale-95 transition-transform"
                title="Open Color Wheel / Eyedropper"
              >
                <input
                  type="color"
                  value={normalizedVal}
                  onChange={(e) => p.onChange(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Secondary Palette Rows */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-[#8C827A] uppercase tracking-wider block">
              Complementary Shades
            </span>
            <div className="flex items-center justify-between gap-1.5">
              {DEFAULT_VIVIDS.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => p.onChange(s.hex)}
                  className="w-6 h-6 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform shadow-2xs"
                  style={{ backgroundColor: s.hex }}
                  title={s.label}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-1.5">
              {DEFAULT_PASTELS.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => p.onChange(s.hex)}
                  className="w-6 h-6 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform shadow-2xs"
                  style={{ backgroundColor: s.hex }}
                  title={s.label}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-1.5">
              {DEFAULT_DARKS.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => p.onChange(s.hex)}
                  className="w-6 h-6 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform shadow-2xs"
                  style={{ backgroundColor: s.hex }}
                  title={s.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HighlightRowPicker(p: {
  totalRows: number;
  heroRow: number;
  onChange: (row: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#5C534E] uppercase tracking-wider">
          Highlight Row
        </span>
        <span className="text-xs font-bold text-[#e84a27]">
          {p.heroRow >= 0 ? `Row ${p.heroRow + 1} Highlighted` : 'No Highlight'}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => p.onChange(-1)}
          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            p.heroRow === -1
              ? 'bg-[#231F1D] text-[#FAF7F2] shadow-sm'
              : 'bg-white border border-[#D8CFC0] text-[#5C534E] hover:bg-[#FAF7F2]'
          }`}
        >
          None
        </button>
        {Array.from({ length: p.totalRows }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => p.onChange(idx)}
            className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              p.heroRow === idx
                ? 'bg-[#e84a27] text-white shadow-sm'
                : 'bg-white border border-[#D8CFC0] text-[#231F1D] hover:bg-[#FAF7F2]'
            }`}
          >
            Row {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle(p: { name: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" aria-pressed={p.on} onClick={() => p.onChange(!p.on)} className={pill(p.on)}>
      {p.name}
    </button>
  );
}

export function readFile(file: File | undefined, cb: (url: string) => void) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => cb(String(r.result));
  r.readAsDataURL(file);
}
