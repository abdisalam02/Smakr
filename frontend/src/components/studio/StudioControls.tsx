'use client';

import React, { useMemo, useState } from 'react';
import {
  Smile,
  MapPin,
  Tag,
  Palette,
  RotateCcw,
  Sparkles,
  Upload,
  Check,
  Search,
  Grid,
  Ratio,
  Compass,
  ChevronDown,
} from 'lucide-react';
import {
  BLUSH_BODIES,
  BLUSH_HEADS,
  BLUSH_FACES,
  BLUSH_ACCESSORIES,
  BLUSH_BEARDS,
  BLUSH_PRESETS,
} from '@/lib/blushMascotCatalog';
import { Color } from './StudioUi';
import { SmakrMascotRig } from './SmakrMascotRig';
import { MapShot } from './MapShot';
import {
  DEFAULT_MASCOT_CONFIG,
  PALETTES,
  SKIN_TONE_SWATCHES,
  CLOTHING_SWATCHES,
  HAIR_COLOR_SWATCHES,
  type FoundryMode,
  type StudioState,
  type MascotState,
  type MapShotState,
  type DishTitleState,
  type WallpaperState,
  type MascotFrameMode,
  type BubbleStyle,
  type BubbleSide,
  type MapExportTarget,
  type CardTheme,
  type MapStyleKey,
} from '@/types/studio';

interface Props {
  state: StudioState;
  activeMode: FoundryMode;
  onUpdateMascot: (patch: Partial<MascotState>) => void;
  onUpdateMap: (patch: Partial<MapShotState>) => void;
  onUpdateDishTitle: (patch: Partial<DishTitleState>) => void;
  onUpdateWallpaper: (patch: Partial<WallpaperState>) => void;
  onUpdateAspectRatio: (ratio: '9:16' | '4:5' | '1:1') => void;
  onUpdateTransparentBg: (transparent: boolean) => void;
  onUpdateSafeZones?: (show: boolean) => void;
}

const CURATED_SPOTS = [
  {
    name: 'Daglig Brød',
    address: 'Frognerveien 22, Oslo',
    icon: '🥐',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    lat: 59.916,
    lng: 10.713,
  },
  {
    name: 'Ochaya Tea House',
    address: 'Thorvald Meyers gate 33, Oslo',
    icon: '🍵',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
    lat: 59.924,
    lng: 10.758,
  },
  {
    name: 'Em Oi! Street Food',
    address: 'Torggata 18, Oslo',
    icon: '🥟',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
    lat: 59.915,
    lng: 10.751,
  },
  {
    name: 'Digg Pizza - Grønland',
    address: 'Grønlandsleiret 1, Oslo',
    icon: '🍕',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    lat: 59.913,
    lng: 10.761,
  },
];

const FOOD_GLYPHS = ['🥐', '🍵', '🥟', '🍕', '🍜', '☕', '🍔', '🍦', '🍷', '🥑'];

const CIRCLE_BG_PRESETS = [
  { label: 'Warm Oat', hex: '#FAF7F2' },
  { label: 'Paprika', hex: '#e84a27' },
  { label: 'Matcha', hex: '#2D5A27' },
  { label: 'Golden Amber', hex: '#F59E0B' },
  { label: 'Late Night', hex: '#181615' },
];

const SIGNATURE_TITLE_PRESETS = [
  {
    name: 'Biscoff / Matcha',
    l1: 'Biscoff',
    c1: '#8B3A0E',
    l2: 'Matcha',
    c2: '#53A626',
  },
  {
    name: 'Krem / Bolle',
    l1: 'Krem',
    c1: '#1E1B4B',
    l2: 'Bolle',
    c2: '#e84a27',
  },
  {
    name: 'Paprika / Espresso',
    l1: 'Smakr',
    c1: '#e84a27',
    l2: 'Oslo',
    c2: '#231F1D',
  },
  {
    name: 'Golden / Green',
    l1: 'Butter',
    c1: '#D97706',
    l2: 'Basil',
    c2: '#15803D',
  },
];

export function StudioControls({
  state,
  activeMode,
  onUpdateMascot,
  onUpdateMap,
  onUpdateDishTitle,
  onUpdateWallpaper,
  onUpdateAspectRatio,
  onUpdateTransparentBg,
  onUpdateSafeZones,
}: Props) {
  // Slots per Mode
  const [mascotSlot, setMascotSlot] = useState<'presets' | 'body' | 'face' | 'glasses-hair' | 'colors' | 'bubble'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('slot');
      if (s === 'bubble' || s === 'colors' || s === 'face' || s === 'body' || s === 'glasses-hair') return s;
    }
    return 'presets';
  });
  const [mapSlot, setMapSlot] = useState<'spot' | 'target' | 'style'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('slot');
      if (s === 'spot' || s === 'target' || s === 'style') return s;
    }
    return 'spot';
  });
  const [titleSlot, setTitleSlot] = useState<'stacked' | 'pills'>('stacked');
  const [wallSlot, setWallSlot] = useState<'ratio' | 'pattern' | 'palette'>('ratio');
  const [spotSearch, setSpotSearch] = useState('');

  const mascot = state.mascot || {
    ...DEFAULT_MASCOT_CONFIG,
    frameMode: 'bust-plus-bubble',
    bodyPose: 'jacket-2',
    bubbleText: 'For the biscoff lovers',
    bubbleEyebrow: '✦ SMAKR VERDICT',
    bubbleStyle: 'round',
    circleBg: '#FAF7F2',
    customMascotDataUrl: null,
  };

  const dishTitle = state.dishTitle || {
    template: 'stacked',
    line1Text: 'Biscoff',
    line1Color: '#8B3A0E',
    showUnderline: true,
    line2Text: 'Matcha',
    line2Color: '#53A626',
    stickerOutline: true,
    pillType: 'price',
    priceText: '135 NOK',
    dropText: '✦ Drop 41 · Em Oi!',
    ratingText: '★ 4.9',
    statusText: '🟢 Open now',
  };

  const filteredSpots = CURATED_SPOTS.filter(
    (s) =>
      s.name.toLowerCase().includes(spotSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(spotSearch.toLowerCase())
  );

  const [mobileExpanded, setMobileExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('drawer') === '1';
    }
    return false;
  });

  const mascotSlots = useMemo(
    () => [
      { id: 'presets', label: `★ Presets (${BLUSH_PRESETS.length})`, title: 'Official Presets', icon: '★' },
      { id: 'body', label: `👕 Body & Pose (${Object.keys(BLUSH_BODIES).length})`, title: 'Outfits & Poses', icon: '👕' },
      { id: 'face', label: `😊 Face (${Object.keys(BLUSH_FACES).length})`, title: 'Expressions', icon: '😊' },
      { id: 'glasses-hair', label: '👓 Glasses & Hair', title: 'Glasses & Hair', icon: '👓' },
      { id: 'colors', label: '🎨 Colors', title: 'Color Palette', icon: '🎨' },
      { id: 'bubble', label: '💬 Speech Bubble', title: 'Speech Bubble', icon: '💬' },
    ],
    []
  );

  const mapSlots = useMemo(
    () => [
      { id: 'spot', label: '🔍 Pick Oslo Spot', title: 'Pick Oslo Spot', icon: '🔍' },
      { id: 'target', label: '🎯 Export Target', title: 'Export Target', icon: '🎯' },
      { id: 'style', label: '🗺️ Style & Camera', title: 'Style & Camera', icon: '🗺️' },
    ],
    []
  );

  const titleSlots = useMemo(
    () => [
      { id: 'stacked', label: '✍️ 2-Line Dish Title', title: '2-Line Dish Title', icon: '✍️' },
      { id: 'pills', label: '🏷️ Price & Drop Pills', title: 'Price & Drop Pills', icon: '🏷️' },
    ],
    []
  );

  const wallSlots = useMemo(
    () => [
      { id: 'ratio', label: '📐 Ratio & Stage', title: 'Ratio & Stage', icon: '📐' },
      { id: 'pattern', label: '🔠 Grid & Density', title: 'Grid & Density', icon: '🔠' },
      { id: 'palette', label: '🎨 Nordic Palette', title: 'Nordic Palette', icon: '🎨' },
    ],
    []
  );

  const currentSlots =
    activeMode === 'mascot'
      ? mascotSlots
      : activeMode === 'venue-map'
      ? mapSlots
      : activeMode === 'dish-title'
      ? titleSlots
      : wallSlots;

  const currentSlotId =
    activeMode === 'mascot'
      ? mascotSlot
      : activeMode === 'venue-map'
      ? mapSlot
      : activeMode === 'dish-title'
      ? titleSlot
      : wallSlot;

  const activeSlotMeta = currentSlots.find((s) => s.id === currentSlotId) || currentSlots[0];

  const handleSelectSlot = (id: string) => {
    if (activeMode === 'mascot') setMascotSlot(id as any);
    else if (activeMode === 'venue-map') setMapSlot(id as any);
    else if (activeMode === 'dish-title') setTitleSlot(id as any);
    else if (activeMode === 'wallpaper') setWallSlot(id as any);
    setMobileExpanded(true);
  };

  const renderSlotNav = (isMobileSheet = false) => (
    <nav
      aria-label="Slot navigation"
      className={`px-3 sm:px-4 py-2 border-b border-[#E6DEC8] flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 ${
        isMobileSheet ? 'bg-white/60' : 'bg-white/50'
      }`}
    >
      {currentSlots.map((slot) => {
        const isSelected = currentSlotId === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => handleSelectSlot(slot.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-[#231F1D] text-white shadow-xs'
                : 'bg-[#EFEAE1] text-[#5C534E] hover:text-[#231F1D]'
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </nav>
  );

  const renderContent = () => (
    <section className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* ============================================================== */}
        {/* MODE 1: MASCOT & BUBBLE SLOTS */}
        {/* ============================================================== */}
        {activeMode === 'mascot' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* 1. PRESETS SLOT */}
            {mascotSlot === 'presets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    9 Official Blush Pro Presets
                  </span>
                  <span className="text-[11px] text-[#8C827A]">
                    Hand-drawn Pablo Stanley Open Peeps
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {BLUSH_PRESETS.map((p) => {
                    const isSelected = mascot.bodyPose === p.bodyId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onUpdateMascot({
                            bodyPose: p.bodyId,
                            head: p.headId,
                            face: p.faceId,
                            accessories: p.accessoryId,
                            presetId: p.id,
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                            : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                        }`}
                      >
                        <div className="w-14 h-14 overflow-hidden flex items-center justify-center pointer-events-none">
                          <SmakrMascotRig
                            bodyPose={p.bodyId}
                            head={p.headId}
                            face={p.faceId}
                            accessories={p.accessoryId}
                            skinColor={mascot.skinColor}
                            clothingColor={mascot.clothingColor}
                            innerClothingColor={mascot.innerClothingColor}
                            headContrastColor={mascot.headContrastColor}
                            frameMode="bust-only"
                            stickerOutline={false}
                            size={70}
                          />
                        </div>
                        <span className="mt-1 text-[11px] font-bold text-[#231F1D] truncate max-w-full">
                          {p.label.replace(' (Afro)', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. BODY & POSE SLOT */}
            {mascotSlot === 'body' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    Waist-Up Body Poses & Outfits ({Object.keys(BLUSH_BODIES).length})
                  </span>
                  <span className="text-[11px] text-[#8C827A]">
                    Jacket, Hoodie, Sweater, Macbook, Coffee, Pointing, Shrug
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {Object.values(BLUSH_BODIES).map((b) => {
                    const isSelected = mascot.bodyPose === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onUpdateMascot({ bodyPose: b.id })}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                            : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                        }`}
                      >
                        <div className="w-16 h-16 overflow-hidden flex items-center justify-center pointer-events-none">
                          <SmakrMascotRig
                            bodyPose={b.id}
                            head={mascot.head}
                            face={mascot.face}
                            accessories={mascot.accessories}
                            skinColor={mascot.skinColor}
                            clothingColor={mascot.clothingColor}
                            innerClothingColor={mascot.innerClothingColor}
                            headContrastColor={mascot.headContrastColor}
                            frameMode="bust-only"
                            stickerOutline={false}
                            size={80}
                          />
                        </div>
                        <span className="mt-1 text-xs font-bold text-[#231F1D] truncate max-w-full">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. FACE SLOT */}
            {mascotSlot === 'face' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    Face Expressions ({Object.keys(BLUSH_FACES).length})
                  </span>
                  <span className="text-[11px] text-[#8C827A]">
                    13 curated expressions
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {Object.values(BLUSH_FACES).map((f) => {
                    const isSelected = mascot.face === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateMascot({ face: f.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                            : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                        }`}
                      >
                        <div className="w-14 h-14 overflow-hidden flex items-center justify-center pointer-events-none">
                          <SmakrMascotRig
                            bodyPose={mascot.bodyPose}
                            head={mascot.head}
                            face={f.id}
                            accessories="none"
                            skinColor={mascot.skinColor}
                            clothingColor={mascot.clothingColor}
                            innerClothingColor={mascot.innerClothingColor}
                            headContrastColor={mascot.headContrastColor}
                            frameMode="bust-only"
                            stickerOutline={false}
                            size={70}
                          />
                        </div>
                        <span className="mt-1 text-xs font-bold text-[#231F1D]">
                          {f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. GLASSES & HAIR SLOT */}
            {mascotSlot === 'glasses-hair' && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Eyewear & Accessories
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'glasses-2', label: '👓 Round Wire Glasses', desc: 'Blush Pro round frames' },
                      { id: 'none', label: '🚫 No Glasses', desc: 'Bare face without eyewear' },
                    ].map((acc) => {
                      const isSelected = mascot.accessories === acc.id || (!mascot.accessories && acc.id === 'glasses-2');
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => onUpdateMascot({ accessories: acc.id })}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">{acc.label}</span>
                          <span className="block text-[10px] text-[#6E655F] mt-0.5">{acc.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Hair Style
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(BLUSH_HEADS).map((h) => {
                      const isSelected = mascot.head === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => onUpdateMascot({ head: h.id })}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">💇 {h.name}</span>
                          <span className="block text-[10px] text-[#6E655F] mt-0.5">Signature Smakr Afro</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. COLORS SLOT */}
            {mascotSlot === 'colors' && (
              <div className="space-y-4">
                <Color
                  name="Skin Tone (Face, Throat, Forearms & Hands)"
                  value={`#${(mascot.skinColor || 'D08B5B').replace('#', '')}`}
                  onChange={(hex) => onUpdateMascot({ skinColor: hex })}
                  swatches={SKIN_TONE_SWATCHES}
                />
                <Color
                  name="Shirt / Jacket / Garment Color"
                  value={`#${(mascot.clothingColor || 'e84a27').replace('#', '')}`}
                  onChange={(hex) => onUpdateMascot({ clothingColor: hex })}
                  swatches={CLOTHING_SWATCHES}
                />
                <Color
                  name="Inner Tee / Accent Color (Layered: Jacket 1, Pointing Up & Jacket 2)"
                  value={`#${(mascot.innerClothingColor || '27272A').replace('#', '')}`}
                  onChange={(hex) => onUpdateMascot({ innerClothingColor: hex })}
                  swatches={CLOTHING_SWATCHES}
                />
                <Color
                  name="Hair & Linework Tone"
                  value={`#${(mascot.headContrastColor || '181615').replace('#', '')}`}
                  onChange={(hex) => onUpdateMascot({ headContrastColor: hex })}
                  swatches={HAIR_COLOR_SWATCHES}
                />
              </div>
            )}

            {/* 6. SPEECH BUBBLE & FRAMING SLOT */}
            {mascotSlot === 'bubble' && (
              <div className="space-y-4">
                {/* Framing Mode Segmented Control */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Framing Mode
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'bust-plus-bubble', label: 'Bust + Bubble', desc: 'Instagram drop card' },
                      { id: 'bust-only', label: 'Bust Only', desc: 'Standalone character' },
                      { id: 'circle-avatar', label: 'Circle Avatar', desc: 'Round badge' },
                      { id: 'bubble-only', label: 'Bubble Only', desc: 'Speech sticker' },
                      { id: 'custom-upload', label: 'Custom Blush', desc: 'Imported PNG/SVG' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => onUpdateMascot({ frameMode: mode.id as MascotFrameMode })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          mascot.frameMode === mode.id
                            ? 'bg-[#e84a27] text-white border-[#e84a27] shadow-xs'
                            : 'bg-white border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span className="block font-bold text-xs">{mode.label}</span>
                        <span
                          className={`block text-[10px] mt-0.5 ${
                            mascot.frameMode === mode.id ? 'text-white/80' : 'text-[#6E655F]'
                          }`}
                        >
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speech Bubble Eyebrow, Main Text & Style */}
                {(mascot.frameMode === 'bust-plus-bubble' || mascot.frameMode === 'bubble-only') && (
                  <div className="space-y-3 p-3.5 bg-white rounded-2xl border border-[#E6DEC8]">
                    {/* Eyebrow tag */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                          Eyebrow Tag (Upper Accent)
                        </span>
                        <div className="flex items-center gap-1">
                          {['✦ SMAKR VERDICT', "✦ TODAY'S DROP", '✦ OSLO FAVORITE'].map((pill) => (
                            <button
                              key={pill}
                              type="button"
                              onClick={() => onUpdateMascot({ bubbleEyebrow: pill })}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                                mascot.bubbleEyebrow === pill
                                  ? 'bg-[#e84a27] text-white'
                                  : 'bg-[#FAF7F2] text-[#8C827A] hover:text-[#231F1D] border border-[#E6DEC8]'
                              }`}
                            >
                              {pill}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={mascot.bubbleEyebrow || '✦ SMAKR VERDICT'}
                        onChange={(e) => onUpdateMascot({ bubbleEyebrow: e.target.value })}
                        placeholder="✦ SMAKR VERDICT"
                        className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#e84a27] uppercase tracking-wider focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Main Bubble Text */}
                    <div>
                      <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-1.5">
                        Main Quote / Verdict
                      </span>
                      <input
                        type="text"
                        value={mascot.bubbleText}
                        onChange={(e) => onUpdateMascot({ bubbleText: e.target.value })}
                        placeholder="e.g. For the biscoff lovers"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D] focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Bubble Style */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#6E655F]">Style:</span>
                      {(['round', 'shout', 'thought', 'box'] as BubbleStyle[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onUpdateMascot({ bubbleStyle: st })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                            mascot.bubbleStyle === st
                              ? 'bg-[#231F1D] text-white'
                              : 'bg-[#EFEAE1] text-[#5C534E] hover:text-[#231F1D]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Bubble Placement & Closeness Controls */}
                    <div className="pt-3 border-t border-[#E6DEC8] space-y-3">
                      {/* Placement Side */}
                      <div>
                        <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-1.5">
                          Bubble Placement
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'right', label: 'Right →' },
                            { id: 'left', label: '← Left' },
                            { id: 'top', label: '↑ Above' },
                          ].map((side) => (
                            <button
                              key={side.id}
                              type="button"
                              onClick={() => onUpdateMascot({ bubbleSide: side.id as BubbleSide })}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                (mascot.bubbleSide || 'right') === side.id
                                  ? 'bg-[#231F1D] text-white border-[#231F1D] shadow-xs'
                                  : 'bg-[#FAF7F2] border-[#E6DEC8] text-[#231F1D] hover:bg-[#EFEAE1]'
                              }`}
                            >
                              {side.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Closeness / Horizontal Distance */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                            Closeness / Horizontal Gap
                          </span>
                          <span className="text-xs font-mono font-bold text-[#e84a27]">
                            {(mascot.bubbleOffsetX || 0) > 0 ? `+${mascot.bubbleOffsetX}px` : `${mascot.bubbleOffsetX || 0}px`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetX: Math.max(-120, (mascot.bubbleOffsetX || 0) - 15),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E6DEC8] text-xs font-bold text-[#231F1D]"
                            title="Move closer to mascot"
                          >
                            ← Closer
                          </button>
                          {[
                            { label: 'Snug (-40px)', val: -40 },
                            { label: 'Normal (0)', val: 0 },
                            { label: 'Wide (+40px)', val: 40 },
                          ].map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => onUpdateMascot({ bubbleOffsetX: p.val })}
                              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                (mascot.bubbleOffsetX || 0) === p.val
                                  ? 'bg-[#231F1D] text-white shadow-xs'
                                  : 'bg-[#FAF7F2] text-[#5C534E] border border-[#E6DEC8]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetX: Math.min(140, (mascot.bubbleOffsetX || 0) + 15),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E6DEC8] text-xs font-bold text-[#231F1D]"
                            title="Move further away"
                          >
                            Further →
                          </button>
                        </div>
                      </div>

                      {/* Height / Vertical Elevation */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                            Bubble Height / Elevation
                          </span>
                          <span className="text-xs font-mono font-bold text-[#e84a27]">
                            {(mascot.bubbleOffsetY || 0) > 0 ? `+${mascot.bubbleOffsetY}px` : `${mascot.bubbleOffsetY || 0}px`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetY: Math.max(-120, (mascot.bubbleOffsetY || 0) - 15),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E6DEC8] text-xs font-bold text-[#231F1D]"
                            title="Move higher"
                          >
                            ↑ Higher
                          </button>
                          {[
                            { label: 'Head (-50px)', val: -50 },
                            { label: 'Mouth (0)', val: 0 },
                            { label: 'Chest (+40px)', val: 40 },
                          ].map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => onUpdateMascot({ bubbleOffsetY: p.val })}
                              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                (mascot.bubbleOffsetY || 0) === p.val
                                  ? 'bg-[#231F1D] text-white shadow-xs'
                                  : 'bg-[#FAF7F2] text-[#5C534E] border border-[#E6DEC8]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetY: Math.min(140, (mascot.bubbleOffsetY || 0) + 15),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E6DEC8] text-xs font-bold text-[#231F1D]"
                            title="Move lower"
                          >
                            Lower ↓
                          </button>
                        </div>
                      </div>

                      {/* 4-Way Thumb Directional Nudge Pad */}
                      <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6DEC8] flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-[#231F1D]">Fine Nudge Pad</span>
                          <span className="block text-[10px] text-[#8C827A]">Move 10px per tap</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetX: (mascot.bubbleOffsetX || 0) - 10,
                              })
                            }
                            className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-xs flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                            title="Move left 10px"
                          >
                            ←
                          </button>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateMascot({
                                  bubbleOffsetY: (mascot.bubbleOffsetY || 0) - 10,
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-xs flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                              title="Move up 10px"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateMascot({
                                  bubbleOffsetY: (mascot.bubbleOffsetY || 0) + 10,
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-xs flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                              title="Move down 10px"
                            >
                              ↓
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetX: (mascot.bubbleOffsetX || 0) + 10,
                              })
                            }
                            className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-xs flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                            title="Move right 10px"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMascot({
                                bubbleOffsetX: 0,
                                bubbleOffsetY: 0,
                              })
                            }
                            className="ml-2 px-2.5 h-8 rounded-lg bg-[#EAE3D7] hover:bg-[#DFD7C8] text-[10px] font-bold text-[#5C534E]"
                            title="Reset bubble to standard position"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Circle Avatar Color Picker */}
                {mascot.frameMode === 'circle-avatar' && (
                  <div className="space-y-2 p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                    <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                      Circle Background Color
                    </span>
                    <div className="flex items-center gap-2">
                      {CIRCLE_BG_PRESETS.map((p) => (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => onUpdateMascot({ circleBg: p.hex })}
                          style={{ backgroundColor: p.hex }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            mascot.circleBg === p.hex
                              ? 'border-[#e84a27] ring-2 ring-[#e84a27]/30 scale-110'
                              : 'border-black/10'
                          }`}
                          title={p.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* White Sticker Outline Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <div>
                    <span className="block text-xs font-bold text-[#231F1D]">Die-Cut White Vinyl Rim</span>
                    <span className="block text-[11px] text-[#6E655F]">
                      Multi-directional white outline for popping over photos
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateMascot({ stickerOutline: !mascot.stickerOutline })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      mascot.stickerOutline
                        ? 'bg-[#e84a27] text-white shadow-xs'
                        : 'bg-[#EFEAE1] text-[#5C534E]'
                    }`}
                  >
                    {mascot.stickerOutline ? '✓ Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Custom Upload Form */}
                {mascot.frameMode === 'custom-upload' && (
                  <div className="space-y-3 p-4 bg-white rounded-2xl border border-[#E6DEC8] text-center">
                    <Upload className="w-8 h-8 text-[#e84a27] mx-auto" />
                    <div>
                      <h4 className="font-bold text-xs text-[#231F1D]">Import Custom Blush SVG or PNG</h4>
                      <p className="text-[11px] text-[#6E655F]">
                        Custom graphics are displayed in place of the parametric rig
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            onUpdateMascot({
                              customMascotDataUrl: reader.result as string,
                              frameMode: 'custom-upload',
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-[#5C534E] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e84a27] file:text-white hover:file:bg-[#d13d1c] cursor-pointer"
                    />
                    {mascot.customMascotDataUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateMascot({ customMascotDataUrl: null, frameMode: 'bust-plus-bubble' })}
                        className="mt-2 text-xs text-red-600 font-semibold hover:underline"
                      >
                        Remove Uploaded Graphic
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: VENUE & MAP SLOTS */}
        {/* ============================================================== */}
        {activeMode === 'venue-map' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {mapSlot === 'spot' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spotSearch}
                    onChange={(e) => setSpotSearch(e.target.value)}
                    placeholder="Search Oslo venue or dish..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#D8CFC0] bg-white text-xs font-semibold text-[#231F1D] focus:border-[#e84a27]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSpots.map((spot) => (
                    <button
                      key={spot.name}
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          name: spot.name,
                          address: spot.address,
                          icon: spot.icon,
                          rating: spot.rating,
                          photo: spot.photo,
                          lat: spot.lat,
                          lng: spot.lng,
                        })
                      }
                      className="p-3 rounded-xl bg-white border border-[#E6DEC8] hover:border-[#e84a27] text-left flex items-center gap-3 transition-all active:scale-98"
                    >
                      <span className="text-2xl">{spot.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-xs text-[#231F1D] truncate">
                          {spot.name}
                        </span>
                        <span className="block text-[10px] text-[#6E655F] truncate">
                          {spot.address}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#e84a27]">★ {spot.rating}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mapSlot === 'target' && (
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'card-only',
                    title: 'Transparent Venue Card',
                    desc: 'Isolated card sticker without map pixels',
                  },
                  {
                    id: 'full-scene',
                    title: 'Full Map + Card',
                    desc: 'MapLibre GL map with pinned card',
                  },
                  {
                    id: 'pin-only',
                    title: 'Transparent Map Pin',
                    desc: 'Isolated high-res radar food glyph pin',
                  },
                  {
                    id: 'map-only',
                    title: 'Clean Map Only',
                    desc: 'Map with pin, venue card omitted',
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateMap({ exportTarget: t.id as MapExportTarget })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      (state.map.exportTarget || 'card-only') === t.id
                        ? 'bg-[#e84a27] text-white border-[#e84a27] shadow-sm'
                        : 'bg-white border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="block font-bold text-xs">{t.title}</span>
                    <span
                      className={`block text-[10px] mt-1 ${
                        (state.map.exportTarget || 'card-only') === t.id ? 'text-white/80' : 'text-[#6E655F]'
                      }`}
                    >
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mapSlot === 'style' && (
              <div className="space-y-4">
                {/* Aspect Ratio Switcher */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Aspect Ratio
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['4:5', '4:5 Post'],
                        ['1:1', '1:1 Square'],
                        ['9:16', '9:16 Story'],
                      ] as const
                    ).map(([r, label]) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onUpdateAspectRatio(r)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          state.aspectRatio === r
                            ? 'bg-[#231F1D] text-white border-[#231F1D] shadow-xs'
                            : 'bg-white border-[#E6DEC8] text-[#231F1D] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food Glyph Picker */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Food Glyph Marker
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {FOOD_GLYPHS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => onUpdateMap({ icon: g })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                          state.map.icon === g
                            ? 'bg-[#e84a27] text-white shadow-xs scale-105'
                            : 'bg-white border border-[#E6DEC8]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Theme */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Card Theme
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cream', 'dark', 'paprika'] as CardTheme[]).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => onUpdateMap({ cardTheme: theme })}
                        className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                          state.map.cardTheme === theme
                            ? 'bg-[#231F1D] text-white border-[#231F1D]'
                            : 'bg-white border-[#E6DEC8] text-[#231F1D]'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Style */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    MapLibre Tile Style
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['streets', 'dataviz', 'aquarelle'] as MapStyleKey[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateMap({ style: st })}
                        className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                          state.map.style === st
                            ? 'bg-[#231F1D] text-white border-[#231F1D]'
                            : 'bg-white border-[#E6DEC8] text-[#231F1D]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Camera Zoom & 3D Tilt Controls */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">MAP CAMERA & ZOOM</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      Zoom: {(state.map.zoom || 15.5).toFixed(1)} · Pitch: {Math.round(state.map.pitch || 0)}°
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Zoom +/- */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-xl border border-[#E6DEC8]">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMap({
                            zoom: Math.max(10, Math.round(((state.map.zoom || 15.5) - 0.5) * 10) / 10),
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-[#231F1D] text-sm flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                        title="Zoom out"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-[#5C534E]">
                        Zoom {(state.map.zoom || 15.5).toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMap({
                            zoom: Math.min(19, Math.round(((state.map.zoom || 15.5) + 0.5) * 10) / 10),
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-[#D8CFC0] font-bold text-[#231F1D] text-sm flex items-center justify-center hover:bg-[#EFEAE1] active:scale-95"
                        title="Zoom in"
                      >
                        +
                      </button>
                    </div>

                    {/* Tilt Presets */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: '0° Flat', p: 0 },
                        { label: '35° 3D', p: 35 },
                        { label: '55° Angle', p: 55 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => onUpdateMap({ pitch: preset.p })}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            Math.abs((state.map.pitch || 0) - preset.p) < 5
                              ? 'bg-[#231F1D] text-white shadow-xs'
                              : 'bg-white border border-[#E6DEC8] text-[#5C534E]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Venue Card Size Stepper */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">VENUE CARD SIZE</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      {Math.round((state.map.cardScale || 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardScale: Math.max(0.65, Math.round(((state.map.cardScale || 1) - 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all"
                    >
                      -
                    </button>
                    {[
                      { label: 'S 80%', val: 0.8 },
                      { label: 'M 100%', val: 1.0 },
                      { label: 'L 115%', val: 1.15 },
                      { label: 'XL 130%', val: 1.3 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateMap({ cardScale: preset.val })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          Math.abs((state.map.cardScale || 1) - preset.val) < 0.03
                            ? 'bg-[#231F1D] text-white shadow-xs'
                            : 'bg-[#FAF7F2] text-[#5C534E] hover:text-[#231F1D]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardScale: Math.min(1.45, Math.round(((state.map.cardScale || 1) + 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Map Pin Icon Size Stepper */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">MAP PIN ICON SIZE</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      {Math.round((state.map.pinScale || 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          pinScale: Math.max(0.65, Math.round(((state.map.pinScale || 1) - 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all"
                    >
                      -
                    </button>
                    {[
                      { label: 'S 80%', val: 0.8 },
                      { label: 'M 100%', val: 1.0 },
                      { label: 'L 120%', val: 1.2 },
                      { label: 'XL 140%', val: 1.4 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateMap({ pinScale: preset.val })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          Math.abs((state.map.pinScale || 1) - preset.val) < 0.03
                            ? 'bg-[#231F1D] text-white shadow-xs'
                            : 'bg-[#FAF7F2] text-[#5C534E] hover:text-[#231F1D]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          pinScale: Math.min(1.6, Math.round(((state.map.pinScale || 1) + 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Card Vertical Position Gap */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">CARD VERTICAL POSITION</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      {(state.map.cardOffsetY || 0) > 0 ? `+${state.map.cardOffsetY}px` : `${state.map.cardOffsetY || 0}px`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardOffsetY: Math.max(-200, (state.map.cardOffsetY || 0) - 40),
                        })
                      }
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#231F1D] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all"
                    >
                      ↑ Higher
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ cardOffsetY: 0 })}
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#5C534E] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardOffsetY: Math.min(200, (state.map.cardOffsetY || 0) + 40),
                        })
                      }
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#231F1D] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all"
                    >
                      ↓ Lower
                    </button>
                  </div>
                </div>

                {/* Social Discovery Badge vs Web Buttons */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <div>
                    <span className="block text-xs font-bold text-[#231F1D]">Card Action Mode</span>
                    <span className="block text-[11px] text-[#6E655F]">
                      {state.map.showWebButtons
                        ? 'Interactive Web Buttons [Map ↗] [Details →]'
                        : 'Social Discovery Badge (🔗 Save & get radar in bio)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateMap({ showWebButtons: !state.map.showWebButtons })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      state.map.showWebButtons
                        ? 'bg-[#231F1D] text-white shadow-xs'
                        : 'bg-[#e84a27] text-white shadow-xs'
                    }`}
                  >
                    {state.map.showWebButtons ? 'Web Buttons' : '✦ Social Bio Badge'}
                  </button>
                </div>

                {/* Full Scene: Venue Card Toggle */}
                {state.map.exportTarget === 'full-scene' && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                    <div>
                      <span className="block text-xs font-bold text-[#231F1D]">Pinned Venue Card</span>
                      <span className="block text-[11px] text-[#6E655F]">
                        {state.map.showCardInfo !== false
                          ? 'Showing full venue inspection card over map'
                          : 'Clean map snapshot with radar pin only'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({ showCardInfo: state.map.showCardInfo === false ? true : false })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        state.map.showCardInfo !== false
                          ? 'bg-[#e84a27] text-white shadow-xs'
                          : 'bg-[#EFEAE1] text-[#5C534E]'
                      }`}
                    >
                      {state.map.showCardInfo !== false ? '✓ Card Shown' : 'Map Snapshot Only'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: DISH TITLES & BADGES */}
        {/* ============================================================== */}
        {activeMode === 'dish-title' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {titleSlot === 'stacked' && (
              <div className="space-y-4">
                {/* 1-Tap Preset Combos */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Signature Title Combinations
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SIGNATURE_TITLE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          onUpdateDishTitle({
                            line1Text: p.l1,
                            line1Color: p.c1,
                            line2Text: p.l2,
                            line2Color: p.c2,
                            showUnderline: true,
                          })
                        }
                        className="p-2.5 rounded-xl border border-[#E6DEC8] bg-white text-left hover:border-[#e84a27] transition-all active:scale-95"
                      >
                        <span className="block font-bold text-xs text-[#231F1D] truncate">{p.name}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.c1 }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.c2 }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line 1 Text & Color */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                      Line 1 (Comico Marker)
                    </span>
                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: dishTitle.line1Color }} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dishTitle.line1Text}
                      onChange={(e) => onUpdateDishTitle({ line1Text: e.target.value })}
                      className="flex-1 h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] font-comico text-sm text-[#231F1D]"
                      placeholder="e.g. Biscoff"
                    />
                    <input
                      type="color"
                      value={dishTitle.line1Color}
                      onChange={(e) => onUpdateDishTitle({ line1Color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#D8CFC0] p-0.5"
                    />
                  </div>
                </div>

                {/* Underline Bar Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <div>
                    <span className="block text-xs font-bold text-[#231F1D]">Divider Bar Underline</span>
                    <span className="block text-[11px] text-[#6E655F]">
                      Signature colored separator matching Line 1
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateDishTitle({ showUnderline: !dishTitle.showUnderline })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dishTitle.showUnderline ? 'bg-[#e84a27] text-white' : 'bg-[#EFEAE1] text-[#5C534E]'
                    }`}
                  >
                    {dishTitle.showUnderline ? '✓ Shown' : 'Hidden'}
                  </button>
                </div>

                {/* Line 2 Text & Color */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                      Line 2 (Geometric Sans)
                    </span>
                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: dishTitle.line2Color }} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dishTitle.line2Text}
                      onChange={(e) => onUpdateDishTitle({ line2Text: e.target.value })}
                      className="flex-1 h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] font-sans font-black text-sm uppercase text-[#231F1D]"
                      placeholder="e.g. Matcha"
                    />
                    <input
                      type="color"
                      value={dishTitle.line2Color}
                      onChange={(e) => onUpdateDishTitle({ line2Color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#D8CFC0] p-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {titleSlot === 'pills' && (
              <div className="space-y-4">
                <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                  Select Pill Sticker Type
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'price', label: 'Price Tag', val: dishTitle.priceText },
                    { id: 'drop', label: 'Drop Badge', val: dishTitle.dropText },
                    { id: 'rating', label: 'Rating Pill', val: dishTitle.ratingText },
                    { id: 'status', label: 'Status Pill', val: dishTitle.statusText },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onUpdateDishTitle({ template: 'pills', pillType: p.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dishTitle.pillType === p.id
                          ? 'bg-[#e84a27] text-white border-[#e84a27] shadow-xs'
                          : 'bg-white border-[#E6DEC8] text-[#231F1D]'
                      }`}
                    >
                      <span className="block font-bold text-xs">{p.label}</span>
                      <span className="block text-[10px] truncate mt-0.5 opacity-80">{p.val}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    Edit Pill Text
                  </span>
                  <input
                    type="text"
                    value={
                      dishTitle.pillType === 'price'
                        ? dishTitle.priceText
                        : dishTitle.pillType === 'drop'
                        ? dishTitle.dropText
                        : dishTitle.pillType === 'rating'
                        ? dishTitle.ratingText
                        : dishTitle.statusText
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (dishTitle.pillType === 'price') onUpdateDishTitle({ priceText: val });
                      else if (dishTitle.pillType === 'drop') onUpdateDishTitle({ dropText: val });
                      else if (dishTitle.pillType === 'rating') onUpdateDishTitle({ ratingText: val });
                      else onUpdateDishTitle({ statusText: val });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 4: BRAND WALLPAPER */}
        {/* ============================================================== */}
        {activeMode === 'wallpaper' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {wallSlot === 'ratio' && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Canvas Aspect Ratio
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '9:16', label: '9:16 Story/Reel' },
                      { id: '4:5', label: '4:5 Portrait Feed' },
                      { id: '1:1', label: '1:1 Square' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onUpdateAspectRatio(r.id as any)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          state.aspectRatio === r.id
                            ? 'bg-[#231F1D] text-white border-[#231F1D]'
                            : 'bg-white border-[#E6DEC8] text-[#231F1D]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <div>
                    <span className="block text-xs font-bold text-[#231F1D]">Transparent Wallpaper Background</span>
                    <span className="block text-[11px] text-[#6E655F]">
                      Exports transparent PNG pattern overlay
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateTransparentBg(!state.transparentBg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      state.transparentBg ? 'bg-[#e84a27] text-white' : 'bg-[#EFEAE1] text-[#5C534E]'
                    }`}
                  >
                    {state.transparentBg ? '✓ Transparent' : 'Solid Color'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <div>
                    <span className="block text-xs font-bold text-[#231F1D]">Instagram UI Safe Zones</span>
                    <span className="block text-[11px] text-[#6E655F]">
                      15% top & bottom dashed guidelines for stories and reels
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSafeZones?.(!state.showSafeZones)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      state.showSafeZones ? 'bg-[#e84a27] text-white shadow-xs' : 'bg-[#EFEAE1] text-[#5C534E]'
                    }`}
                  >
                    {state.showSafeZones ? '✓ Guides Shown' : 'Guides Hidden'}
                  </button>
                </div>
              </div>
            )}

            {wallSlot === 'pattern' && (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-1.5">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    Wordmark Text
                  </span>
                  <input
                    type="text"
                    value={state.wallpaper.text}
                    onChange={(e) => onUpdateWallpaper({ text: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] font-comico text-sm text-[#231F1D]"
                    placeholder="e.g. SMAKR"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                    <span className="block text-xs font-bold text-[#5C534E] uppercase mb-1">Rows</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateWallpaper({ rows: Math.max(3, state.wallpaper.rows - 1) })}
                        className="w-8 h-8 rounded-lg bg-[#EAE3D7] font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs">{state.wallpaper.rows}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateWallpaper({ rows: Math.min(18, state.wallpaper.rows + 1) })}
                        className="w-8 h-8 rounded-lg bg-[#EAE3D7] font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                    <span className="block text-xs font-bold text-[#5C534E] uppercase mb-1">Columns</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateWallpaper({ cols: Math.max(1, state.wallpaper.cols - 1) })}
                        className="w-8 h-8 rounded-lg bg-[#EAE3D7] font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs">{state.wallpaper.cols}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateWallpaper({ cols: Math.min(6, state.wallpaper.cols + 1) })}
                        className="w-8 h-8 rounded-lg bg-[#EAE3D7] font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {wallSlot === 'palette' && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Smakr Palette Presets
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PALETTES.map((pal) => (
                      <button
                        key={pal.label}
                        type="button"
                        onClick={() =>
                          onUpdateWallpaper({
                            bgColor: pal.bgColor,
                            baseColor: pal.baseColor,
                            heroColor: pal.heroColor,
                            colorMode: pal.colorMode,
                          })
                        }
                        className="p-2.5 rounded-xl border border-[#E6DEC8] bg-white text-left hover:border-[#e84a27] transition-all"
                      >
                        <span className="block font-bold text-xs text-[#231F1D]">{pal.label}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pal.bgColor }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pal.baseColor }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pal.heroColor }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );

    return (
      <>
        {/* 1. DESKTOP DOCKED FOOTER */}
        <footer className="hidden sm:flex sm:h-[42dvh] sm:max-h-[350px] bg-[#FAF7F2] border-t border-[#E6DEC8] flex-col shrink-0 text-[#231F1D] select-none">
          {renderSlotNav(false)}
          {renderContent()}
        </footer>

        {/* 2. MOBILE PEEK BOTTOM BAR */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E6DEC8] pb-safe shrink-0 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileExpanded(true)}
            className="w-full flex flex-col items-center pt-2 pb-1 active:opacity-70 cursor-pointer"
            aria-label="Open customization drawer"
          >
            <div className="w-10 h-1.5 rounded-full bg-[#D8CFC0]" />
          </button>
          <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {currentSlots.map((slot) => {
              const isSelected = currentSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSelectSlot(slot.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#231F1D] text-white shadow-xs'
                      : 'bg-white border border-[#E6DEC8] text-[#231F1D]'
                  }`}
                >
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. MOBILE EXPANDABLE BOTTOM SHEET DRAWER */}
        {mobileExpanded && (
          <>
            {/* Backdrop: transparent touch-outside to collapse, no heavy blur */}
            <div
              className="sm:hidden fixed inset-0 bg-black/10 z-40 animate-in fade-in duration-200"
              onClick={() => setMobileExpanded(false)}
            />

            {/* Top Live Mascot / Asset Preview on Mobile ("smaller view ontop") */}
            <div
              className="sm:hidden fixed top-14 inset-x-0 bottom-[52dvh] z-40 bg-[#FAF7F2] border-b border-[#E6DEC8] flex items-center justify-center p-2.5 animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) setMobileExpanded(false);
              }}
            >
              <div className="relative p-2 rounded-2xl bg-white shadow-md border border-[#D8CFC0] flex items-center justify-center max-h-full max-w-[94vw] overflow-hidden">
                {activeMode === 'mascot' ? (
                  <div className="scale-[0.52] origin-center shrink-0 -my-14 -mx-10">
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
                      bubbleOffsetX={mascot.bubbleOffsetX}
                      bubbleOffsetY={mascot.bubbleOffsetY}
                      bubbleSide={mascot.bubbleSide}
                      bubbleScale={mascot.bubbleScale}
                      size={240}
                    />
                  </div>
                ) : activeMode === 'venue-map' ? (
                  <div className="scale-[0.32] origin-center shrink-0 -my-24 -mx-28">
                    <MapShot s={state.map} w={860} h={440} interactive={false} />
                  </div>
                ) : (
                  <div className="scale-[0.44] origin-center shrink-0 -my-10 -mx-14">
                    <div className="scale-[0.7] origin-center">
                      <SmakrMascotRig
                        skinColor={mascot.skinColor}
                        clothingColor={mascot.clothingColor}
                        face={mascot.face}
                        accessories={mascot.accessories}
                        size={180}
                      />
                    </div>
                  </div>
                )}
                {/* Subtle Live Badge */}
                <div className="absolute top-1.5 left-2.5 flex items-center gap-1.5 bg-[#FAF7F2]/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#E6DEC8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e84a27] animate-pulse" />
                  <span className="text-[9px] font-bold text-[#231F1D] uppercase tracking-wider">
                    Live Preview
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 h-[52dvh] max-h-[460px] pb-safe bg-[#FAF7F2] rounded-t-[32px] border-t border-[#D8CFC0] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-250 select-none">
              {/* Sheet Header */}
              <div className="px-4 pt-3 pb-2.5 border-b border-[#E6DEC8] flex items-center justify-between shrink-0 bg-white/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(false)}
                    className="w-8 h-8 rounded-full bg-[#EAE3D7] hover:bg-[#DFD7C8] flex items-center justify-center text-[#231F1D] active:scale-95 shrink-0"
                    aria-label="Collapse drawer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E6DEC8] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    <SmakrMascotRig
                      head={mascot.head}
                      face={mascot.face}
                      accessories={mascot.accessories}
                      skinColor={mascot.skinColor}
                      clothingColor={mascot.clothingColor}
                      innerClothingColor={mascot.innerClothingColor}
                      headContrastColor={mascot.headContrastColor}
                      stickerOutline={false}
                      frameMode="bust-only"
                      bodyPose={mascot.bodyPose}
                      size={36}
                    />
                  </div>

                  <div className="truncate">
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-[#231F1D] truncate">
                      {activeSlotMeta.title}
                    </span>
                    <span className="block text-[10px] text-[#8C827A] truncate">
                      Tap any option to customize live
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileExpanded(false)}
                  className="px-3.5 py-1.5 rounded-full bg-[#e84a27] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  <span>Done</span>
                  <span>✓</span>
                </button>
              </div>

              {/* Sheet Slot Selector */}
              {renderSlotNav(true)}

              {/* Scrollable Content */}
              {renderContent()}
            </div>
          </>
        )}
      </>
    );
}
