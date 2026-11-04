"use client";

import React, { useRef, useState } from "react";

// Plain <img> + CSS transforms: the browser decodes each SVG once and
// moves it on the GPU, so dragging never re-parses paths.
type Piece = { id: string; label: string; file: string; x: number; y: number; rot: number; scale: number };

type PresetKey = "k_chicken" | "cinnamon_roll" | "croissant" | "naan" | "pizza" | "coffee" | "banh_mi" | "ramen" | "all_mix";

interface PresetConfig {
  label: string;
  iconFile: string;
  pieces: Piece[];
}

const PRESETS: Record<PresetKey, PresetConfig> = {
  k_chicken: {
    label: "K-Chicken (3 Wings)",
    iconFile: "/food-svgs/k-chicken.svg",
    pieces: [
      { id: "left", label: "Left wing", file: "/food-svgs/recraft-left-wing-flat.svg", x: -150, y: 119.33, rot: -80, scale: 0.88 },
      { id: "right", label: "Drumette", file: "/food-svgs/recraft-right-drumette.svg", x: 113.56, y: 82, rot: 46, scale: 0.9 },
      { id: "center", label: "Top tender", file: "/food-svgs/recraft-center-flat.svg", x: -9.78, y: -47.11, rot: 37, scale: 1.01 }
    ]
  },
  cinnamon_roll: {
    label: "Cinnamon Roll",
    iconFile: "/food-svgs/cinnamon_roll.svg",
    pieces: [
      { id: "cin_main", label: "Cinnamon Roll (Active)", file: "/food-svgs/cinnamon_roll.svg", x: 0, y: 0, rot: 0, scale: 0.85 },
      { id: "cin_p1", label: "Photo Quantized", file: "/food-svgs/cinnamon_roll_part1.svg", x: -160, y: 40, rot: -10, scale: 0.75 },
      { id: "cin_p2", label: "Lineless Gouache", file: "/food-svgs/cinnamon_roll_part2.svg", x: 160, y: 40, rot: 10, scale: 0.75 }
    ]
  },
  croissant: {
    label: "Artisan Croissant",
    iconFile: "/food-svgs/croissant.svg",
    pieces: [
      { id: "cr_main", label: "Croissant (Active)", file: "/food-svgs/croissant.svg", x: 0, y: 0, rot: -15, scale: 0.85 },
      { id: "cr_p1", label: "Photo Cutout", file: "/food-svgs/croissant_part1.svg", x: -160, y: 30, rot: -25, scale: 0.75 },
      { id: "cr_p2", label: "Lineless Gouache", file: "/food-svgs/croissant_part2.svg", x: 160, y: 30, rot: 5, scale: 0.75 }
    ]
  },
  naan: {
    label: "Garlic Naan",
    iconFile: "/food-svgs/naan.svg",
    pieces: [
      { id: "naan_main", label: "Tandoor Naan (Active)", file: "/food-svgs/naan.svg", x: 0, y: 0, rot: 0, scale: 0.85 },
      { id: "naan_clean", label: "Clean Naan", file: "/food-svgs/naan-clean.svg", x: 150, y: 30, rot: 15, scale: 0.75 }
    ]
  },
  pizza: {
    label: "Neapolitan Pizza",
    iconFile: "/food-svgs/pizza.svg",
    pieces: [
      { id: "pizza_main", label: "Pizza Slice", file: "/food-svgs/pizza.svg", x: 0, y: 0, rot: 0, scale: 0.95 }
    ]
  },
  coffee: {
    label: "Specialty Coffee",
    iconFile: "/food-svgs/coffee.svg",
    pieces: [
      { id: "coffee_main", label: "Pistachio Latte", file: "/food-svgs/coffee.svg", x: 0, y: 0, rot: 0, scale: 0.9 }
    ]
  },
  banh_mi: {
    label: "Bánh Mì",
    iconFile: "/food-svgs/banh_mi.svg",
    pieces: [
      { id: "banh_mi_main", label: "Crispy Baguette", file: "/food-svgs/banh_mi.svg", x: 0, y: 0, rot: 0, scale: 0.95 }
    ]
  },
  ramen: {
    label: "Tonkotsu Ramen",
    iconFile: "/food-svgs/ramen.svg",
    pieces: [
      { id: "ramen_main", label: "Ramen Bowl", file: "/food-svgs/ramen.svg", x: 0, y: 0, rot: 0, scale: 0.9 }
    ]
  },
  all_mix: {
    label: "All 8 Custom Icons",
    iconFile: "/food-svgs/k-chicken.svg",
    pieces: [
      { id: "mix_chicken", label: "K-Chicken", file: "/food-svgs/k-chicken.svg", x: -240, y: -120, rot: 0, scale: 0.65 },
      { id: "mix_cinnamon", label: "Cinnamon Roll", file: "/food-svgs/cinnamon_roll.svg", x: -80, y: -120, rot: 0, scale: 0.65 },
      { id: "mix_croissant", label: "Croissant", file: "/food-svgs/croissant.svg", x: 80, y: -120, rot: -10, scale: 0.65 },
      { id: "mix_naan", label: "Garlic Naan", file: "/food-svgs/naan.svg", x: 240, y: -120, rot: 10, scale: 0.65 },
      { id: "mix_pizza", label: "Pizza", file: "/food-svgs/pizza.svg", x: -240, y: 120, rot: 0, scale: 0.65 },
      { id: "mix_coffee", label: "Coffee", file: "/food-svgs/coffee.svg", x: -80, y: 120, rot: 0, scale: 0.65 },
      { id: "mix_banh_mi", label: "Bánh Mì", file: "/food-svgs/banh_mi.svg", x: 80, y: 120, rot: 0, scale: 0.65 },
      { id: "mix_ramen", label: "Ramen", file: "/food-svgs/ramen.svg", x: 240, y: 120, rot: 0, scale: 0.65 },
    ]
  }
};

const BASE = 520;

export default function FoodIconStudioPage() {
  const [currentPreset, setCurrentPreset] = useState<PresetKey>("k_chicken");
  const [pieces, setPieces] = useState<Piece[]>(PRESETS.k_chicken.pieces);
  const [order, setOrder] = useState<string[]>(PRESETS.k_chicken.pieces.map(p => p.id));
  const [sel, setSel] = useState<string>(PRESETS.k_chicken.pieces[0].id);
  const [bg, setBg] = useState("#FAF7F2");
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  function loadPreset(key: PresetKey) {
    setCurrentPreset(key);
    const pz = PRESETS[key].pieces;
    setPieces(pz);
    setOrder(pz.map(p => p.id));
    setSel(pz[0].id);
  }

  function patch(id: string, p: Partial<Piece>) {
    setPieces(ps => ps.map(x => (x.id === id ? { ...x, ...p } : x)));
  }

  function front(id: string) {
    setSel(id);
    setOrder(o => [...o.filter(i => i !== id), id]);
  }

  function onDown(e: React.PointerEvent, p: Piece) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { id: p.id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    front(p.id);
  }

  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    patch(d.id, { x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy });
  }

  async function copySvg() {
    try {
      const parts: string[] = [];
      for (const id of order) {
        const p = pieces.find(x => x.id === id);
        if (!p) continue;
        const txt = await (await fetch(p.file)).text();
        const vbMatch = txt.match(/viewBox="([^"]+)"/);
        const vb = vbMatch ? vbMatch[1] : "0 0 520 520";
        const inner = txt.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
        parts.push(
          `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.scale})"><svg x="${-BASE / 2}" y="${-BASE / 2}" width="${BASE}" height="${BASE}" viewBox="${vb}">${inner}</svg></g>`
        );
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-600 -400 1200 800">${parts.join("")}</svg>`;
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  }

  const cur = pieces.find(p => p.id === sel) || pieces[0];

  return (
    <main className="fixed inset-0 top-16 overflow-hidden touch-none" style={{ background: bg }} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
      {/* Interactive Drag Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        {order.map((id, i) => {
          const p = pieces.find(x => x.id === id);
          if (!p) return null;
          return (
            <img
              key={id}
              src={p.file}
              alt={p.label}
              draggable={false}
              onPointerDown={e => onDown(e, p)}
              className="absolute cursor-grab active:cursor-grabbing select-none"
              style={{
                width: BASE,
                height: BASE,
                zIndex: i,
                willChange: "transform",
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${p.scale})`
              }}
            />
          );
        })}
      </div>

      {/* Control Panel */}
      <aside className="absolute left-4 top-4 w-72 rounded-2xl bg-[#181615] p-3.5 text-[#FAF7F2] shadow-2xl space-y-3 text-xs border border-white/10 backdrop-blur-md">
        {/* Preset Category Switcher */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block mb-1.5">
            Food Icon Collection
          </span>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(PRESETS) as PresetKey[]).map(key => (
              <button
                key={key}
                onClick={() => loadPreset(key)}
                className={`rounded-lg py-1.5 px-2 text-[11px] font-bold text-left truncate transition-colors ${
                  currentPreset === key ? "bg-[#E84A27] text-white shadow-xs" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Piece Selector */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block mb-1">
            Active Layer / Piece
          </span>
          <div className="flex flex-wrap gap-1">
            {pieces.map(p => (
              <button
                key={p.id}
                onClick={() => front(p.id)}
                className={`rounded py-1 px-2 font-bold text-[11px] transition-colors ${
                  sel === p.id ? "bg-[#E84A27] text-white" : "bg-white/10 hover:bg-white/15 text-zinc-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transform Sliders */}
        {(
          [
            ["rot", "Rotate", -180, 180, 1],
            ["scale", "Scale", 0.2, 2.0, 0.01]
          ] as const
        ).map(([k, name, min, max, step]) => (
          <label key={k} className="block">
            <span className="flex justify-between text-[#A8A29E]">
              {name}
              <span className="font-mono text-zinc-200">{k === "rot" ? `${cur.rot}°` : cur.scale.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={cur[k]}
              onChange={e => patch(cur.id, { [k]: parseFloat(e.target.value) })}
              className="w-full accent-[#E84A27]"
            />
          </label>
        ))}

        <p className="text-[11px] text-[#A8A29E] leading-relaxed">
          Drag any piece to move it on the canvas. Click to bring forward.
        </p>

        {/* Background & Export Controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <span className="text-[10px] text-[#A8A29E]">Canvas:</span>
          {["#FAF7F2", "#181615", "#FFFFFF"].map(c => (
            <button
              key={c}
              onClick={() => setBg(c)}
              className="h-5 w-5 rounded-full border border-white/30 transition-transform hover:scale-110"
              style={{ background: c }}
              aria-label={`Background ${c}`}
            />
          ))}
          <button
            onClick={copySvg}
            className="ml-auto rounded-lg bg-[#E84A27] hover:bg-[#d03d1b] px-3 py-1.5 font-bold text-white transition-colors"
          >
            {copied ? "Copied SVG!" : "Copy SVG"}
          </button>
        </div>

        {/* Active Icon Indicator */}
        <div className="flex items-center gap-2 border-t border-white/10 pt-2">
          <img
            src={PRESETS[currentPreset].iconFile}
            alt={PRESETS[currentPreset].label}
            className="h-8 w-8 rounded-lg bg-[#FAF7F2] p-1 object-contain border border-white/10"
          />
          <span className="font-bold text-[11px] truncate">
            {PRESETS[currentPreset].label}
          </span>
        </div>
      </aside>
    </main>
  );
}
