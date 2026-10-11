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

export function Color(p: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-h-[44px] items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <input
        type="color"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        className="h-9 w-11 rounded-lg border border-black/10 bg-transparent"
      />
      {p.name}
    </label>
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
