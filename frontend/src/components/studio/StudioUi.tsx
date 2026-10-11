'use client';

export const pill = (on: boolean) =>
  `min-h-[44px] rounded-full px-4 text-sm font-semibold border transition-colors ${
    on
      ? 'bg-[#e84a27] border-[#e84a27] text-white'
      : 'bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-200'
  }`;

export const field =
  'w-full min-h-[44px] rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-base text-zinc-900 dark:text-zinc-100';

const label = 'block text-sm text-zinc-600 dark:text-zinc-300';

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
import { CURATED_SWATCHES, type ColorSwatch } from '@/types/studio';

export function Color(p: { name: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<'all' | ColorSwatch['category']>('all');

  const activeSwatch = CURATED_SWATCHES.find(
    (s) => s.hex.toLowerCase() === p.value.toLowerCase()
  );

  const filtered = cat === 'all' ? CURATED_SWATCHES : CURATED_SWATCHES.filter((s) => s.category === cat);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[46px] items-center gap-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-left shadow-xs transition-all hover:border-black/20 active:scale-98"
      >
        <span
          className="h-6 w-6 shrink-0 rounded-full border border-black/15 shadow-inner"
          style={{ backgroundColor: p.value }}
        />
        <div className="min-w-0 flex-1 leading-tight">
          <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider truncate">
            {p.name}
          </span>
          <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {activeSwatch ? activeSwatch.label : p.value}
          </span>
        </div>
        <span className="text-zinc-400 text-xs">▼</span>
      </button>

      {/* Curated Swatch Palette Popup Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[85dvh] flex flex-col rounded-3xl bg-[#FAF7F2] dark:bg-[#1c1a19] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="font-comico text-lg text-zinc-900 dark:text-zinc-100">
                  Select {p.name}
                </h3>
                <p className="text-xs text-zinc-500">Curated Smakr Oslo brand & foodie palette</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center text-sm hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto p-3 border-b border-black/5 dark:border-white/5 no-scrollbar bg-black/[0.02]">
              {(
                [
                  ['all', 'All'],
                  ['oat', '🌾 Creams & Oat'],
                  ['paprika', '🌶️ Paprika'],
                  ['amber', '🥐 Ambers'],
                  ['dark', '☕ Dark Inks'],
                  ['green', '🍵 Matcha'],
                  ['berry', '🍷 Berry'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCat(key)}
                  className={`min-h-[34px] px-3 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    cat === key
                      ? 'bg-[#e84a27] text-white shadow-xs'
                      : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-black/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Swatches Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5">
              {filtered.map((s) => {
                const isSelected = s.hex.toLowerCase() === p.value.toLowerCase();
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      p.onChange(s.hex);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#e84a27] bg-[#e84a27]/10 ring-2 ring-[#e84a27]'
                        : 'border-black/5 dark:border-white/5 bg-white dark:bg-white/5 hover:border-black/15'
                    }`}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-black/15 shadow-sm"
                      style={{ backgroundColor: s.hex }}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {s.label}
                      </span>
                      <span className="block text-[10px] font-mono text-zinc-400">
                        {s.hex}
                      </span>
                    </div>
                    {isSelected && <span className="text-[#e84a27] text-sm font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Optional Custom Hex Row */}
            <div className="p-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 bg-black/[0.02]">
              <span className="text-xs text-zinc-500 font-semibold">Custom Hex:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="#e84a27"
                  value={p.value}
                  onChange={(e) => p.onChange(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-center"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
        <span className="font-semibold text-zinc-500 uppercase tracking-wider">
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
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5'
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
                : 'bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-black/5'
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
