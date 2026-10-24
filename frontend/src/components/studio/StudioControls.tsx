'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
  Database,
  X,
  Loader2,
} from 'lucide-react';
import {
  BLUSH_BODIES,
  BLUSH_HEADS,
  BLUSH_FACES,
  BLUSH_MASKS,
  BLUSH_ACCESSORIES,
  BLUSH_BEARDS,
  BLUSH_PRESETS,
} from '@/lib/blushMascotCatalog';
import { Color } from './StudioUi';
import { SmakrMascotRig } from './SmakrMascotRig';
import { MapShot } from './MapShot';
import { StudioCanvas } from './StudioCanvas';
import { StudioCaptionGenerator } from './StudioCaptionGenerator';
import { useCityPulseStore } from '@/store/useCityPulseStore';
import { resolveFoodCategoryAndIcon } from '@/lib/categoryResolver';
import type { Venue } from '@/types';
import {
  DEFAULT_MASCOT_CONFIG,
  DEFAULT_DISH_TITLE_STATE,
  STUDIO_STICKER_SWATCHES,
  ASPECT_RATIO_PRESETS,
  PALETTES,
  SKIN_TONE_SWATCHES,
  CLOTHING_SWATCHES,
  HAIR_COLOR_SWATCHES,
  SHOE_SWATCHES,
  type FoundryMode,
  type StudioState,
  type MascotState,
  type MapShotState,
  type DishTitleState,
  type DishFontFamily,
  type WallpaperState,
  type MascotFrameMode,
  type BubbleStyle,
  type BubbleSide,
  type MapExportTarget,
  type UiKitExportTarget,
  type CardTheme,
  type MapStyleKey,
  type StudioVenueItem,
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
  onQuickExtractUiTarget?: (target: UiKitExportTarget) => void;
  venues?: Venue[];
  isLoadingVenues?: boolean;
  onRefreshVenues?: () => void;
}

const CURATED_SPOTS = [
  {
    name: 'Daglig Brød',
    address: 'Frognerveien 22, Oslo',
    neighborhood: 'Frogner',
    featuredDish: '🥐 Cardamom Knot · 58 kr',
    icon: '🥐',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    lat: 59.916,
    lng: 10.713,
  },
  {
    name: 'Ochaya Tea House',
    address: 'Thorvald Meyers gate 33, Oslo',
    neighborhood: 'Grünerløkka',
    featuredDish: '🍵 Biscoff Matcha · 78 kr',
    icon: '🍵',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
    lat: 59.924,
    lng: 10.758,
  },
  {
    name: 'Em Oi! Street Food',
    address: 'Torggata 18, Oslo',
    neighborhood: 'Sentrum / Torggata',
    featuredDish: '🥟 Crispy Pork Dumplings · 145 kr',
    icon: '🥟',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
    lat: 59.915,
    lng: 10.751,
  },
  {
    name: 'Digg Pizza - Grønland',
    address: 'Grønlandsleiret 1, Oslo',
    neighborhood: 'Grønland',
    featuredDish: '🍕 Sourdough Nduja Slice · 195 kr',
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
  venues,
  isLoadingVenues,
  onRefreshVenues,
  onUpdateMascot,
  onUpdateMap,
  onUpdateDishTitle,
  onUpdateWallpaper,
  onUpdateAspectRatio,
  onUpdateTransparentBg,
  onUpdateSafeZones,
  onQuickExtractUiTarget,
}: Props) {
  // Slots per Mode
  const [mascotSlot, setMascotSlot] = useState<'presets' | 'body' | 'face' | 'glasses-hair' | 'colors' | 'bubble'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('slot');
      if (s === 'bubble' || s === 'colors' || s === 'face' || s === 'body' || s === 'glasses-hair') return s;
    }
    return 'presets';
  });
  const [mapSlot, setMapSlot] = useState<'spot' | 'multi' | 'target' | 'style' | 'caption'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('slot');
      if (s === 'spot' || s === 'multi' || s === 'target' || s === 'style' || s === 'caption') return s;
    }
    return 'spot';
  });
  const [titleSlot, setTitleSlot] = useState<'stacked' | 'pills' | 'caption'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('slot');
      if (s === 'caption') return 'caption';
    }
    return 'stacked';
  });
  const [wallSlot, setWallSlot] = useState<'ratio' | 'pattern' | 'palette'>('ratio');
  const [spotSearch, setSpotSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const q =
        new URLSearchParams(window.location.search).get('q') ||
        new URLSearchParams(window.location.search).get('search');
      if (q) return decodeURIComponent(q).replace(/\\+$/, '');
    }
    return '';
  });

  // Fallback & Google Places search
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [searchingGoogle, setSearchingGoogle] = useState(false);

  const searchGooglePlaces = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearchingGoogle(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const list = data.results ?? (data.place ? [data.place] : []);
      setGoogleResults(list);
    } catch {
      setGoogleResults([]);
    } finally {
      setSearchingGoogle(false);
    }
  }, []);

  const storeVenues = useCityPulseStore((s) => s.venues);
  const foodPosts = useCityPulseStore((s) => s.foodPosts);
  const effectiveVenues = (venues && venues.length > 0) ? venues : storeVenues;

  const allSpots = useMemo(() => {
    const NEIGHBORHOOD_LABELS: Record<string, string> = {
      grunerlokka: 'Grünerløkka',
      torggata: 'Torggata',
      toyen: 'Tøyen',
      gronland: 'Grønland',
      sentrum: 'Sentrum',
      frogner: 'Frogner',
      kampen: 'Kampen',
    };
    if (effectiveVenues && effectiveVenues.length > 0) {
      return effectiveVenues.map((v) => {
        const icon = v.icon || resolveFoodCategoryAndIcon('', v.name).icon || '🥐';
        const linkedDish = foodPosts.find(
          (p) => p.spot_id === v.id && p.image_url && !p.is_archived
        );
        const dishPhoto = linkedDish?.image_url || null;
        const venuePhoto = v.cover_image_url || null;
        const photo =
          dishPhoto ||
          venuePhoto ||
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80';
        const rating =
          typeof v.google_rating === 'number' && v.google_rating > 0
            ? Number(v.google_rating.toFixed(1))
            : 4.8;
        const neighborhood = v.neighborhood
          ? NEIGHBORHOOD_LABELS[v.neighborhood] || v.neighborhood
          : 'Oslo';
        const featuredDish = linkedDish
          ? `${icon} ${linkedDish.dish_name}${linkedDish.price_nok ? ` · ${linkedDish.price_nok} kr` : ''}`
          : v.signature_dishes?.[0]
          ? `${icon} ${v.signature_dishes[0]}`
          : '';
        return {
          id: v.id,
          name: v.name,
          address: v.address || `${v.name}, Oslo`,
          icon,
          rating,
          photo,
          dishPhoto,
          venuePhoto,
          neighborhood,
          featuredDish,
          lat: v.latitude,
          lng: v.longitude,
          category: v.food_category,
          source: 'db' as const,
        };
      });
    }
    return CURATED_SPOTS.map((s, idx) => ({
      ...s,
      id: `curated-${idx}`,
      dishPhoto: s.photo,
      venuePhoto: s.photo,
      neighborhood: s.neighborhood || 'Oslo',
      featuredDish: s.featuredDish || '',
      category: 'all',
      source: 'curated' as const,
    }));
  }, [effectiveVenues, foodPosts]);

  const filteredSpots = useMemo(() => {
    const q = spotSearch.trim().toLowerCase();
    if (!q) return allSpots;
    return allSpots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }, [allSpots, spotSearch]);

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

  const dishTitle: DishTitleState = {
    ...DEFAULT_DISH_TITLE_STATE,
    ...(state.dishTitle || {}),
  };

  const activeUiTarget: UiKitExportTarget =
    dishTitle.uiKitExportTarget ||
    (dishTitle.template === 'pills'
      ? dishTitle.pillType === 'price'
        ? 'paprika-price-pill'
        : dishTitle.pillType === 'rating'
        ? 'location-rating-pill'
        : 'brand-logo-pill'
      : 'comico-title-only');

  const [previewBackdrop, setPreviewBackdrop] = useState<'checker' | 'dark' | 'light'>('checker');

  const [mobileExpanded, setMobileExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('drawer') === '1';
    }
    return false;
  });

  const [bodyCategoryFilter, setBodyCategoryFilter] = useState<'all' | 'bust' | 'sitting' | 'standing'>('all');

  const mascotSlots = useMemo(
    () => [
      { id: 'presets', label: `★ Presets (${BLUSH_PRESETS.length})`, title: 'Official Presets', icon: '★' },
      { id: 'body', label: `👕 Body & Pose (${Object.keys(BLUSH_BODIES).length})`, title: 'Outfits & Poses', icon: '👕' },
      { id: 'face', label: `😊 Face (${Object.keys(BLUSH_FACES).length})`, title: 'Expressions', icon: '😊' },
      { id: 'glasses-hair', label: '🎩 Head, Mask & Glasses', title: 'Head, Mask & Glasses', icon: '🎩' },
      { id: 'colors', label: '🎨 Colors', title: 'Color Palette', icon: '🎨' },
      { id: 'bubble', label: '💬 Speech Bubble', title: 'Speech Bubble', icon: '💬' },
    ],
    []
  );

  const mapSlots = useMemo(
    () => [
      { id: 'spot', label: `🔍 Pick Spot (${allSpots.length})`, title: 'Pick Oslo Spot', icon: '🔍' },
      { id: 'multi', label: '🗺️ Multi-Spot Crawl', title: 'Multi-Venue Round-Up', icon: '🗺️' },
      { id: 'target', label: '🎯 Export Target', title: 'Export Target', icon: '🎯' },
      { id: 'style', label: '🎨 Style & Camera', title: 'Style & Camera', icon: '🎨' },
      { id: 'caption', label: '📝 IG Caption', title: 'AI IG Caption & SEO', icon: '📝' },
    ],
    [allSpots.length]
  );

  const titleSlots = useMemo(
    () => [
      { id: 'comico-title-only', label: '🔤 Dish Title', title: 'Dish Title Sticker', icon: '🔤' },
      { id: 'glass-verdict-card', label: '🪪 Verdict Card', title: 'Dish Verdict Card', icon: '🪪' },
      { id: 'paprika-price-pill', label: '🔥 Price Badge', title: 'Price / Callout Badge', icon: '🔥' },
      { id: 'location-rating-pill', label: '📍 Location Pill', title: 'Location + ★ Pill', icon: '📍' },
      { id: 'brand-logo-pill', label: '🏷️ Logo Badge', title: 'Brand Logo Badge', icon: '🏷️' },
      { id: 'full-cover', label: '🖼️ Full Cover', title: 'Full Slide 1 Cover', icon: '🖼️' },
      { id: 'caption', label: '📝 IG Caption', title: 'AI IG Caption & SEO', icon: '📝' },
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
      ? titleSlot === 'caption'
        ? 'caption'
        : activeUiTarget
      : wallSlot;

  const activeSlotMeta = currentSlots.find((s) => s.id === currentSlotId) || currentSlots[0];

  const handleSelectSlot = (id: string) => {
    if (activeMode === 'mascot') setMascotSlot(id as any);
    else if (activeMode === 'venue-map') {
      setMapSlot(id as any);
      if (id === 'spot') {
        onUpdateMap({ layoutMode: 'single' });
      } else if (id === 'multi') {
        onUpdateMap({
          layoutMode:
            state.map.layoutMode && state.map.layoutMode !== 'single'
              ? state.map.layoutMode
              : 'multi_compact',
          autoFitCamera: true,
        });
      }
    }
    else if (activeMode === 'dish-title') {
      if (id === 'caption') {
        setTitleSlot('caption');
      } else {
        const target = id as UiKitExportTarget;
        setTitleSlot(
          target === 'paprika-price-pill' ||
            target === 'brand-logo-pill' ||
            target === 'location-rating-pill'
            ? 'pills'
            : 'stacked'
        );
        onUpdateDishTitle({
          uiKitExportTarget: target,
          template:
            target === 'paprika-price-pill' ||
            target === 'brand-logo-pill' ||
            target === 'location-rating-pill'
              ? 'pills'
              : 'stacked',
        });
      }
    } else if (activeMode === 'wallpaper') setWallSlot(id as any);
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider">
                    Body Poses & Outfits ({Object.keys(BLUSH_BODIES).length})
                  </span>
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E6DEC8] overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'All Poses' },
                      { id: 'bust', label: 'Bust' },
                      { id: 'sitting', label: 'Sitting' },
                      { id: 'standing', label: 'Standing' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBodyCategoryFilter(cat.id as any)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                          bodyCategoryFilter === cat.id
                            ? 'bg-[#e84a27] text-white shadow-xs'
                            : 'text-[#6E655F] hover:text-[#231F1D]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {Object.values(BLUSH_BODIES)
                    .filter((b) => bodyCategoryFilter === 'all' || b.category === bodyCategoryFilter)
                    .map((b) => {
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
                              mask={mascot.mask}
                              skinColor={mascot.skinColor}
                              clothingColor={mascot.clothingColor}
                              innerClothingColor={mascot.innerClothingColor}
                              shoeColor={mascot.shoeColor}
                              headContrastColor={mascot.headContrastColor}
                              frameMode="bust-only"
                              stickerOutline={false}
                              size={80}
                            />
                          </div>
                          <span className="mt-1 text-[11px] font-bold text-[#231F1D] truncate max-w-full">
                            {b.label}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-[#8C827A]">
                            {b.category}
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
                    Blush Pro & Open Peeps
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Object.values(BLUSH_FACES).map((f) => {
                    const isSelected = mascot.face === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateMascot({ face: f.id })}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                            : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                        }`}
                      >
                        <div className="w-12 h-12 overflow-hidden flex items-center justify-center pointer-events-none">
                          <SmakrMascotRig
                            bodyPose={mascot.bodyPose}
                            head={mascot.head}
                            face={f.id}
                            accessories="none"
                            mask="none"
                            skinColor={mascot.skinColor}
                            clothingColor={mascot.clothingColor}
                            innerClothingColor={mascot.innerClothingColor}
                            headContrastColor={mascot.headContrastColor}
                            frameMode="bust-only"
                            stickerOutline={false}
                            size={60}
                          />
                        </div>
                        <span className="mt-1 text-[11px] font-bold text-[#231F1D] truncate max-w-full">
                          {f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. GLASSES, MASK & HAIR SLOT */}
            {mascotSlot === 'glasses-hair' && (
              <div className="space-y-4">
                {/* Eyewear & Accessories */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Eyewear & Accessories ({Object.keys(BLUSH_ACCESSORIES).length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(BLUSH_ACCESSORIES).map((acc) => {
                      const isSelected = mascot.accessories === acc.id || (!mascot.accessories && acc.id === 'glasses-2');
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => onUpdateMascot({ accessories: acc.id })}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Face Masks */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Face Mask & Face Paint
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(BLUSH_MASKS).map((m) => {
                      const isSelected = (mascot.mask || 'none') === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onUpdateMascot({ mask: m.id })}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Style & Headwear */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Hair Style & Headwear ({Object.keys(BLUSH_HEADS).length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(BLUSH_HEADS).map((h) => {
                      const isSelected = mascot.head === h.id || (!mascot.head && h.id === 'afro');
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => onUpdateMascot({ head: h.id })}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">{h.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Facial Hair / Beard */}
                <div>
                  <span className="block text-xs font-bold text-[#5C534E] uppercase tracking-wider mb-2">
                    Facial Hair & Beards
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(BLUSH_BEARDS).map((b) => {
                      const isSelected = (mascot.facialHair || 'none') === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onUpdateMascot({ facialHair: b.id })}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-xs'
                              : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0]'
                          }`}
                        >
                          <span className="block font-bold text-xs text-[#231F1D]">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. COLORS SLOT */}
            {mascotSlot === 'colors' && (() => {
              const activeBody = BLUSH_BODIES[mascot.bodyPose || 'jacket-2'] || BLUSH_BODIES['jacket-2'];
              const slots = activeBody.detectedColorSlots || ['skin', 'top'];
              const showBottom = slots.includes('bottom') || slots.includes('top');
              const showShoes = slots.includes('shoes');
              const showHat = mascot.head && mascot.head !== 'afro';

              return (
                <div className="space-y-4">
                  <Color
                    name="Skin Tone (Face, Throat, Forearms & Hands)"
                    value={`#${(mascot.skinColor || 'D08B5B').replace('#', '')}`}
                    onChange={(hex) => onUpdateMascot({ skinColor: hex })}
                    swatches={SKIN_TONE_SWATCHES}
                  />
                  <Color
                    name="Shirt / Jacket / Primary Garment"
                    value={`#${(mascot.clothingColor || 'e84a27').replace('#', '')}`}
                    onChange={(hex) => onUpdateMascot({ clothingColor: hex })}
                    swatches={CLOTHING_SWATCHES}
                  />
                  {showBottom && (
                    <Color
                      name="Bottom / Pants / Inner Accent Color"
                      value={`#${(mascot.innerClothingColor || '27272A').replace('#', '')}`}
                      onChange={(hex) => onUpdateMascot({ innerClothingColor: hex })}
                      swatches={CLOTHING_SWATCHES}
                    />
                  )}
                  {showShoes && (
                    <Color
                      name="Shoes & Footwear Tone"
                      value={`#${(mascot.shoeColor || 'FFFFFF').replace('#', '')}`}
                      onChange={(hex) => onUpdateMascot({ shoeColor: hex })}
                      swatches={SHOE_SWATCHES}
                    />
                  )}
                  <Color
                    name="Hair & Ink Linework Tone"
                    value={`#${(mascot.headContrastColor || '181615').replace('#', '')}`}
                    onChange={(hex) => onUpdateMascot({ headContrastColor: hex })}
                    swatches={HAIR_COLOR_SWATCHES}
                  />
                  {showHat && (
                    <Color
                      name="Hat / Headwear Fabric Accent"
                      value={`#${(mascot.hatColor || 'e84a27').replace('#', '')}`}
                      onChange={(hex) => onUpdateMascot({ hatColor: hex })}
                      swatches={CLOTHING_SWATCHES}
                    />
                  )}
                </div>
              );
            })()}

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
                {/* Header status bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#e84a27]" />
                    <span className="text-[11px] font-bold text-[#231F1D]">
                      {effectiveVenues.length > 0
                        ? `${effectiveVenues.length} Oslo venues synced from database`
                        : 'Using curated default spots'}
                    </span>
                  </div>
                  {onRefreshVenues && (
                    <button
                      type="button"
                      onClick={onRefreshVenues}
                      disabled={isLoadingVenues}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[10px] font-bold text-[#5C534E] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      title="Reload venues from Supabase"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLoadingVenues ? 'animate-spin text-[#e84a27]' : ''}`} />
                      <span>{isLoadingVenues ? 'Syncing...' : 'Sync DB'}</span>
                    </button>
                  )}
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spotSearch}
                    onChange={(e) => {
                      setSpotSearch(e.target.value);
                      if (googleResults.length > 0) setGoogleResults([]);
                    }}
                    placeholder="Search Oslo venue, address, or cuisine..."
                    className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#D8CFC0] bg-white text-xs font-semibold text-[#231F1D] focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]/20 transition-all placeholder:text-[#8C827A]"
                  />
                  {spotSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSpotSearch('');
                        setGoogleResults([]);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#231F1D] p-1"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Grid of database spots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] sm:max-h-[220px] overflow-y-auto pr-0.5">
                  {filteredSpots.map((spot) => {
                    const isSelected =
                      (state.map.venueId && state.map.venueId === spot.id) ||
                      state.map.name.toLowerCase() === spot.name.toLowerCase();

                    return (
                      <button
                        key={spot.id || spot.name}
                        type="button"
                        onClick={() => {
                          onUpdateMap({
                            venueId: spot.id || null,
                            name: spot.name,
                            address: spot.address,
                            icon: spot.icon,
                            rating: spot.rating,
                            photo: spot.photo,
                            neighborhood: spot.neighborhood,
                            featuredDish: spot.featuredDish,
                            lat: spot.lat,
                            lng: spot.lng,
                            layoutMode: 'single',
                          });
                          const rawDish = (spot.featuredDish || spot.name)
                            .replace(/^[^\wA-Za-zÀ-ÿ0-9]+/, '')
                            .split('·')[0]
                            .trim();
                          const rawPrice =
                            spot.featuredDish && spot.featuredDish.includes('·')
                              ? spot.featuredDish.split('·')[1].trim()
                              : undefined;
                          const words = (rawDish || spot.name).split(/\s+/);
                          onUpdateDishTitle({
                            dishTitle: rawDish || spot.name,
                            line1Text: words[0] || spot.name,
                            line2Text: words.slice(1).join(' ') || 'Oslo',
                            ...(rawPrice ? { priceText: rawPrice } : {}),
                            venueText: spot.name,
                            locationIcon: spot.icon || '📍',
                            neighborhoodText: spot.neighborhood || 'Oslo',
                            ratingText: String(spot.rating || '4.8'),
                            backgroundPhoto: spot.photo || null,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-98 relative group ${

                          isSelected
                            ? 'bg-[#FAF7F2] border-[#e84a27] ring-2 ring-[#e84a27]/20 shadow-xs'
                            : 'bg-white border-[#E6DEC8] hover:border-[#D8CFC0] hover:bg-[#FAF7F2]/50'
                        }`}
                      >
                        {/* Food Icon / Emoji */}
                        <span className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E6DEC8] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                          {spot.icon}
                        </span>

                        {/* Venue details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#231F1D] truncate">
                              {spot.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-bold bg-[#e84a27] text-white px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-[#6E655F] truncate">
                            {spot.address}
                          </span>
                        </div>

                        {/* Rating & Photo pill */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[11px] font-bold text-[#e84a27] bg-[#FAF7F2] px-1.5 py-0.5 rounded-md border border-[#E6DEC8]/60">
                            ★ {spot.rating}
                          </span>
                          {spot.photo && (
                            <div className="w-6 h-6 rounded-md overflow-hidden border border-[#E6DEC8] bg-[#FAF7F2]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={spot.photo}
                                alt={spot.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Empty state & Google Places search fallback */}
                {filteredSpots.length === 0 && (
                  <div className="p-4 rounded-xl bg-white border border-[#E6DEC8] text-center space-y-2">
                    <p className="text-xs text-[#6E655F]">
                      No database venues matching &quot;{spotSearch}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => searchGooglePlaces(spotSearch)}
                      disabled={searchingGoogle}
                      className="px-3.5 py-1.5 rounded-lg bg-[#231F1D] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 mx-auto transition-all active:scale-95 disabled:opacity-50"
                    >
                      {searchingGoogle ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e84a27]" />
                          <span>Searching Oslo Places...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 text-[#e84a27]" />
                          <span>Search Google Places for &quot;{spotSearch}&quot;</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Google Places Results */}
                {googleResults.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-[#E6DEC8]">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
                        Google Places Results ({googleResults.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setGoogleResults([])}
                        className="text-[10px] text-[#8C827A] hover:text-[#231F1D] underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                      {googleResults.map((place: any, i: number) => {
                        const icon = resolveFoodCategoryAndIcon('', place.name || '').icon || '📍';
                        const photo = place.photos?.[0]
                          ? (place.photos[0].startsWith('http')
                              ? place.photos[0]
                              : `/api/places/photos?ref=${encodeURIComponent(place.photos[0])}&w=400`)
                          : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80';
                        const rating = place.rating ? Number(place.rating.toFixed(1)) : 4.8;

                        return (
                          <button
                            key={place.id || place.name || i}
                            type="button"
                            onClick={() =>
                              onUpdateMap({
                                venueId: null,
                                name: place.name,
                                address: place.address || `${place.name}, Oslo`,
                                icon,
                                rating,
                                photo,
                                lat: place.latitude || 59.9139,
                                lng: place.longitude || 10.7522,
                                layoutMode: 'single',
                              })
                            }
                            className="p-2.5 rounded-xl bg-white border border-[#E6DEC8] hover:border-[#e84a27] text-left flex items-center gap-3 transition-all active:scale-98"
                          >
                            <span className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E6DEC8] flex items-center justify-center text-lg shrink-0">
                              {icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block font-bold text-xs text-[#231F1D] truncate">
                                {place.name}
                              </span>
                              <span className="block text-[10px] text-[#6E655F] truncate">
                                {place.address || 'Oslo, Norway'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#e84a27] shrink-0">
                              ★ {rating}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mapSlot === 'multi' && (
              <div className="space-y-4">
                {/* Multi-Venue Crawl Header & Summary */}
                <div className="p-3 rounded-2xl bg-white border border-[#D8CFC0] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E6DEC8] flex items-center justify-center text-lg shadow-2xs">
                      🗺️
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-[#231F1D]">
                        Oslo Multi-Spot Crawl
                      </span>
                      <span className="block text-[10px] text-[#6E655F]">
                        {(state.map.venues || []).length} locations pinned on map
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#e84a27] text-white text-[10px] font-bold uppercase tracking-wider">
                    {(state.map.venues || []).length} Spots
                  </span>
                </div>

                {/* Top Banner Pill Customization */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#231F1D]">TOP BANNER PILL</span>
                      <span className="block text-[10px] text-[#8C827A]">
                        Customize or toggle the headline card
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          showRoundupBanner: state.map.showRoundupBanner === false ? true : false,
                        })
                      }
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        state.map.showRoundupBanner !== false
                          ? 'bg-[#231F1D] text-white shadow-xs'
                          : 'bg-[#EFEAE1] text-[#8C827A]'
                      }`}
                    >
                      {state.map.showRoundupBanner !== false ? '✓ Visible' : 'Hidden'}
                    </button>
                  </div>

                  {state.map.showRoundupBanner !== false && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6E655F] uppercase tracking-wider">
                          Banner Headline Text
                        </label>
                        <input
                          type="text"
                          value={state.map.roundupTitle || ''}
                          onChange={(e) => onUpdateMap({ roundupTitle: e.target.value })}
                          placeholder="e.g. Oslo Sourdough Crawl"
                          className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D] focus:border-[#e84a27] outline-hidden"
                        />
                      </div>

                      {/* Aesthetic / Card Background */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#6E655F] uppercase tracking-wider">
                          Banner Aesthetic & Color
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'dark', label: 'Dark Espresso', bg: '#181615', fg: '#FAF7F2' },
                            { id: 'oat', label: 'Warm Oat', bg: '#FAF7F2', fg: '#2B1810', border: 'border border-black/15' },
                            { id: 'paprika', label: 'Oslo Paprika', bg: '#e84a27', fg: '#ffffff' },
                            { id: 'glass', label: 'Frosted Glass', bg: '#f4efe6', fg: '#181615' },
                          ].map((theme) => {
                            const isSelected = (state.map.roundupBannerBg || 'dark') === theme.id;
                            return (
                              <button
                                key={theme.id}
                                type="button"
                                onClick={() => onUpdateMap({ roundupBannerBg: theme.id as any })}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-[#e84a27] shadow-sm'
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: theme.bg,
                                  color: theme.fg,
                                }}
                              >
                                {isSelected && <span>✓</span>}
                                <span>{theme.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Toggle Pulsing Dot */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#E6DEC8]">
                        <span className="text-[11px] font-semibold text-[#5C534E]">
                          Pulsing Action Dot (•)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMap({
                              showRoundupDot: state.map.showRoundupDot === false ? true : false,
                            })
                          }
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            state.map.showRoundupDot !== false
                              ? 'bg-[#e84a27] text-white shadow-xs'
                              : 'bg-[#EFEAE1] text-[#8C827A]'
                          }`}
                        >
                          {state.map.showRoundupDot !== false ? '• With Dot' : 'No Dot'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Active Spots Chip List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#231F1D]">
                      Active Oslo Spots ({(state.map.venues || []).length}/4)
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ autoFitCamera: true })}
                      className="text-[10px] font-bold text-[#e84a27] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Fit Map Camera</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(state.map.venues || []).map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#D8CFC0] text-xs font-bold text-[#231F1D] shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#e84a27] text-white text-[10px] font-comico flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[130px]">{v.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (state.map.venues || []).filter(
                              (_, i) => i !== idx
                            );
                            onUpdateMap({ venues: updated });
                          }}
                          className="text-[#8C827A] hover:text-[#e84a27] p-0.5 rounded-full cursor-pointer"
                          title="Remove spot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Density Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#231F1D]">
                    Card Density Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ layoutMode: 'multi_compact' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        state.map.layoutMode === 'multi_compact'
                          ? 'bg-[#FAF7F2] border-[#e84a27] text-[#e84a27] ring-1 ring-[#e84a27]'
                          : 'bg-white border-[#D8CFC0] text-[#6E655F]'
                      }`}
                    >
                      <span>🏷️ Compact (Recommended)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ layoutMode: 'multi_full' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        state.map.layoutMode === 'multi_full'
                          ? 'bg-[#FAF7F2] border-[#e84a27] text-[#e84a27] ring-1 ring-[#e84a27]'
                          : 'bg-white border-[#D8CFC0] text-[#6E655F]'
                      }`}
                    >
                      <span>🪪 Full Cards</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Spot Camera Zoom Controls */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">MAP CAMERA ZOOM</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      Zoom {(state.map.zoom || 15).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          zoom: Math.max(10, Math.round(((state.map.zoom || 15) - 0.5) * 10) / 10),
                          autoFitCamera: false,
                        })
                      }
                      className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D8CFC0] hover:bg-[#EFEAE1] font-bold text-[#231F1D] text-base flex items-center justify-center cursor-pointer transition-all"
                      title="Zoom out camera"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ autoFitCamera: true })}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] border border-[#D8CFC0] hover:bg-[#EFEAE1] text-xs font-bold text-[#5C534E] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="Re-center and fit all spots automatically"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Auto-Fit All Spots</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          zoom: Math.min(18.5, Math.round(((state.map.zoom || 15) + 0.5) * 10) / 10),
                          autoFitCamera: false,
                        })
                      }
                      className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D8CFC0] hover:bg-[#EFEAE1] font-bold text-[#231F1D] text-base flex items-center justify-center cursor-pointer transition-all"
                      title="Zoom in camera"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Multi Card Sizing & Scale (Icon remains static at GPS coordinate) */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">CRAWL CARDS SIZE</span>
                    <span className="text-xs font-mono font-bold text-[#e84a27]">
                      {Math.round((state.map.cardScale || 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardScale: Math.max(0.6, Math.round(((state.map.cardScale || 1) - 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all cursor-pointer"
                      title="Smaller cards"
                    >
                      -
                    </button>
                    {[
                      { label: '85% (Compact)', val: 0.85 },
                      { label: '100% (Standard)', val: 1.0 },
                      { label: '115% (Hero)', val: 1.15 },
                      { label: '135% (Large)', val: 1.35 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateMap({ cardScale: preset.val })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                          cardScale: Math.min(1.6, Math.round(((state.map.cardScale || 1) + 0.05) * 100) / 100),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#EFEAE1] hover:bg-[#E6DEC8] font-bold text-[#231F1D] text-sm flex items-center justify-center transition-all cursor-pointer"
                      title="Larger cards"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mouse Dragging Card Position Controls & Reset */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#231F1D]">🖱️ CARD POSITIONS</span>
                      <span className="block text-[10px] text-[#8C827A]">
                        Drag cards directly with your mouse on preview
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const resetVenues = (state.map.venues || []).map((v) => ({
                          ...v,
                          x: 0,
                          y: 0,
                        }));
                        onUpdateMap({ venues: resetVenues, cardOffsetY: 0 });
                      }}
                      className="py-1 px-2.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#231F1D] border border-[#D8CFC0] hover:bg-[#EFEAE1] transition-all cursor-pointer flex items-center gap-1"
                      title="Reset all cards to default positions"
                    >
                      <RotateCcw className="w-3 h-3 text-[#e84a27]" />
                      <span>Reset Positions</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardOffsetY: Math.max(-120, (state.map.cardOffsetY || 0) - 20),
                        })
                      }
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#231F1D] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all cursor-pointer"
                    >
                      Higher ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ cardOffsetY: 0 })}
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#5C534E] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all cursor-pointer"
                    >
                      Centered
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMap({
                          cardOffsetY: Math.min(120, (state.map.cardOffsetY || 0) + 20),
                        })
                      }
                      className="py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#231F1D] border border-[#E6DEC8] hover:bg-[#EFEAE1] transition-all cursor-pointer"
                    >
                      Lower ↓
                    </button>
                  </div>
                </div>

                {/* Add Spots from Database */}
                <div className="space-y-2 pt-2 border-t border-[#D8CFC0]">
                  <label className="text-[11px] font-bold text-[#231F1D]">
                    + Add Spot to Crawl (Tap to add)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                    {allSpots.slice(0, 14).map((spot) => {
                      const isAdded = (state.map.venues || []).some(
                        (v) =>
                          v.id === spot.id ||
                          v.name.toLowerCase() === spot.name.toLowerCase()
                      );
                      const isMax = (state.map.venues || []).length >= 4;

                      return (
                        <button
                          key={spot.id || spot.name}
                          type="button"
                          disabled={isAdded || isMax}
                          onClick={() => {
                            if (isAdded || isMax) return;
                            const newVenue: StudioVenueItem = {
                              id: spot.id || `spot_${Date.now()}`,
                              name: spot.name,
                              address: spot.address,
                              neighborhood: spot.neighborhood,
                              dish:
                                spot.featuredDish?.split('·')[0]?.trim() ||
                                spot.name,
                              price: spot.featuredDish?.includes('·')
                                ? spot.featuredDish.split('·')[1].trim()
                                : undefined,
                              icon: spot.icon,
                              rating: spot.rating,
                              photo: spot.photo,
                              lat: spot.lat,
                              lng: spot.lng,
                            };
                            const updated = [
                              ...(state.map.venues || []),
                              newVenue,
                            ];
                            onUpdateMap({
                              venues: updated,
                              layoutMode:
                                state.map.layoutMode === 'multi_full'
                                  ? 'multi_full'
                                  : 'multi_compact',
                              autoFitCamera: true,
                            });
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 text-xs transition-all ${
                            isAdded
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-70 cursor-default'
                              : isMax
                              ? 'bg-white border-[#D8CFC0] opacity-40 cursor-not-allowed'
                              : 'bg-white border-[#D8CFC0] hover:border-[#e84a27] text-[#231F1D] cursor-pointer active:scale-98'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{spot.icon}</span>
                            <span className="font-bold truncate">
                              {spot.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold shrink-0">
                            {isAdded ? '✓ Added' : '+ Add'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {mapSlot === 'target' && (
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'card-only',
                    title: '🪪 Transparent Card + Pin (For Canva)',
                    desc: '100% transparent PNG sticker — zero map background',
                  },
                  {
                    id: 'full-scene',
                    title: '🗺️ Full Map Slide',
                    desc: 'MapLibre GL map background with pinned venue card',
                  },
                  {
                    id: 'pin-only',
                    title: '📍 Transparent Map Pin',
                    desc: 'Isolated high-res radar food glyph pin on alpha',
                  },
                  {
                    id: 'map-only',
                    title: '🧭 Clean Map Only',
                    desc: 'Map background with pin, venue card omitted',
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
                {/* 1-Tap Export Mode Switcher inside Style & Layout too */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF7F2] rounded-2xl border border-[#E6DEC8]">
                  <button
                    type="button"
                    onClick={() => onUpdateMap({ exportTarget: 'card-only' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      (state.map.exportTarget || 'card-only') === 'card-only'
                        ? 'bg-[#e84a27] text-white shadow-xs'
                        : 'text-[#5C534E] hover:text-[#231F1D]'
                    }`}
                  >
                    🪪 Transparent Card + Pin (Canva)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMap({ exportTarget: 'full-scene' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      state.map.exportTarget === 'full-scene'
                        ? 'bg-[#231F1D] text-white shadow-xs'
                        : 'text-[#5C534E] hover:text-[#231F1D]'
                    }`}
                  >
                    🗺️ Full Map Slide
                  </button>
                </div>

                {/* Card Thumbnail Photo Picker + Dish Photo Switcher */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D] uppercase tracking-wider">
                      Card Thumbnail Photo
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateMap({ showPhoto: !state.map.showPhoto })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        state.map.showPhoto
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#EFEAE1] text-[#5C534E]'
                      }`}
                    >
                      {state.map.showPhoto ? '✓ Photo Shown' : 'Hidden'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {state.map.photo && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E6DEC8] shrink-0 bg-[#FAF7F2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={state.map.photo}
                          alt="Card thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#D8CFC0] text-xs font-bold text-[#231F1D] cursor-pointer transition-all">
                        <span>📷 Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                onUpdateMap({ photo: reader.result, showPhoto: true });
                              }
                            };
                            reader.readAsDataURL(f);
                          }}
                        />
                      </label>
                      {(() => {
                        const activeSpot = allSpots.find(
                          (sp) =>
                            (state.map.venueId && sp.id === state.map.venueId) ||
                            sp.name.toLowerCase() === state.map.name.toLowerCase()
                        );
                        if (!activeSpot) return null;
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {activeSpot.dishPhoto && (
                              <button
                                type="button"
                                onClick={() => onUpdateMap({ photo: activeSpot.dishPhoto, showPhoto: true })}
                                className="px-2 py-1 rounded-lg bg-[#e84a27]/10 text-[#e84a27] text-[10px] font-bold hover:bg-[#e84a27]/20"
                              >
                                🍽️ Use Curated Dish Photo
                              </button>
                            )}
                            {activeSpot.venuePhoto && activeSpot.venuePhoto !== activeSpot.dishPhoto && (
                              <button
                                type="button"
                                onClick={() => onUpdateMap({ photo: activeSpot.venuePhoto, showPhoto: true })}
                                className="px-2 py-1 rounded-lg bg-[#EFEAE1] text-[#5C534E] text-[10px] font-bold hover:text-[#231F1D]"
                              >
                                🏠 Use Storefront Photo
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Neighborhood Badge, Featured Dish Pill & Bottom CTA Text */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2.5">
                  <span className="block text-xs font-bold text-[#231F1D] uppercase tracking-wider">
                    Card Details &amp; Canva Copy
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] mb-1">
                        Neighborhood Badge (next to ★ rating)
                      </label>
                      <input
                        type="text"
                        value={state.map.neighborhood ?? ''}
                        onChange={(e) => onUpdateMap({ neighborhood: e.target.value })}
                        placeholder="e.g. Grünerløkka"
                        className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-semibold text-[#231F1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] mb-1">
                        Featured Dish + Price Pill (optional)
                      </label>
                      <input
                        type="text"
                        value={state.map.featuredDish ?? ''}
                        onChange={(e) => onUpdateMap({ featuredDish: e.target.value })}
                        placeholder="e.g. 🍵 Biscoff Matcha · 79 kr"
                        className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-semibold text-[#231F1D]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6E655F] mb-1">
                      Bottom CTA Pill Text
                    </label>
                    <input
                      type="text"
                      value={state.map.ctaText ?? '🔗 See all Oslo picks & prices · @smakr.no'}
                      onChange={(e) => onUpdateMap({ ctaText: e.target.value })}
                      placeholder="🔗 See all Oslo picks & prices · @smakr.no"
                      className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-semibold text-[#231F1D]"
                    />
                  </div>
                </div>

                {/* Social Media Aspect Ratio Switcher */}
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#231F1D]">SOCIAL MEDIA SIZE & RATIO</span>
                    <span className="text-[10px] font-mono text-[#8C827A] font-bold uppercase">
                      {state.aspectRatio}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={state.aspectRatio}
                      onChange={(e) => onUpdateAspectRatio(e.target.value as any)}
                      className="w-full h-11 px-3.5 pr-8 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D] focus:border-[#e84a27] outline-hidden cursor-pointer"
                    >
                      {ASPECT_RATIO_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullLabel}
                        </option>
                      ))}
                    </select>
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

            {mapSlot === 'caption' && (
              <StudioCaptionGenerator
                state={state}
                allSpots={allSpots}
                foodPosts={foodPosts}
                effectiveVenues={effectiveVenues}
                onUpdateMap={onUpdateMap}
                onUpdateDishTitle={onUpdateDishTitle}
              />
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: DISH TITLES & APP-UI STICKER KIT                       */}
        {/* ============================================================== */}
        {activeMode === 'dish-title' && (() => {
          if (titleSlot === 'caption') {
            return (
              <StudioCaptionGenerator
                state={state}
                allSpots={allSpots}
                foodPosts={foodPosts}
                effectiveVenues={effectiveVenues}
                onUpdateMap={onUpdateMap}
                onUpdateDishTitle={onUpdateDishTitle}
              />
            );
          }

          const renderQuickSwatches = (
            labelText: string,

            currentHex: string,
            onPick: (hex: string) => void
          ) => {
            const norm = (currentHex || '#181615').toLowerCase();
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5C534E] uppercase tracking-wider">
                    {labelText}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#6E655F] uppercase">
                    {STUDIO_STICKER_SWATCHES.find((s) => s.hex.toLowerCase() === norm)?.label || currentHex}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {STUDIO_STICKER_SWATCHES.map((s) => {
                    const selected = s.hex.toLowerCase() === norm;
                    const isLight = ['#ffffff', '#faf7f2', '#e6dec8', '#f59e0b'].includes(
                      s.hex.toLowerCase()
                    );
                    return (
                      <button
                        key={s.hex}
                        type="button"
                        onClick={() => onPick(s.hex)}
                        title={s.label}
                        style={{ backgroundColor: s.hex }}
                        className={`w-8 h-8 rounded-full shrink-0 border flex items-center justify-center transition-transform active:scale-90 ${
                          selected
                            ? 'ring-2 ring-[#e84a27] ring-offset-1 border-black/30 scale-105'
                            : 'border-black/15 hover:scale-105'
                        }`}
                      >
                        {selected && (
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] ${
                              isLight ? 'text-[#181615]' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          };

          const renderFontPicker = (
            labelText: string,
            currentFont: DishFontFamily,
            onPick: (f: DishFontFamily) => void
          ) => (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-[#5C534E] uppercase tracking-wider">
                {labelText}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'comico', label: 'Comico', cls: 'font-comico' },
                    { id: 'sans', label: 'Bold Sans', cls: 'font-sans font-black' },
                    { id: 'serif', label: 'Editorial', cls: 'font-serif font-bold italic' },
                    { id: 'mono', label: 'Receipt', cls: 'font-mono font-bold' },
                  ] as const
                ).map((f) => {
                  const active = currentFont === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onPick(f.id)}
                      className={`py-2 px-2 rounded-xl border text-xs transition-all active:scale-95 ${
                        f.cls
                      } ${
                        active
                          ? 'bg-[#231F1D] text-white border-[#231F1D] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8] hover:border-[#e84a27]'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );

          const currentScale = dishTitle.titleScale ?? 1;

          return (
            <div className="max-w-2xl mx-auto space-y-3.5">
              {/* TOP ROW: AUTO-FILL FROM DISH/SPOT + WHITE RIM & SCALE */}
              <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-[#231F1D] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#e84a27]">⚡</span>
                    <span>Quick Auto-Fill from Oslo Dish / Spot</span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateDishTitle({ stickerOutline: !dishTitle.stickerOutline })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                      dishTitle.stickerOutline
                        ? 'bg-[#e84a27] text-white shadow-2xs'
                        : 'bg-[#EFEAE1] text-[#5C534E]'
                    }`}
                  >
                    {dishTitle.stickerOutline ? '✓ White Sticker Rim' : 'No White Rim'}
                  </button>
                </div>

                <select
                  aria-label="Auto-fill from Dish or Spot"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    if (val.startsWith('post:')) {
                      const postId = val.slice(5);
                      const p = foodPosts.find((fp) => fp.id === postId);
                      if (p) {
                        const v = effectiveVenues.find((vn) => vn.id === p.spot_id);
                        const words = (p.dish_name || 'Signature Dish').trim().split(/\s+/);
                        const l1 = words[0] || 'Signature';
                        const l2 = words.slice(1).join(' ') || '';
                        onUpdateDishTitle({
                          dishTitle: p.dish_name,
                          line1Text: l1,
                          line2Text: l2,
                          priceText: p.price_nok ? `${p.price_nok} kr` : '145 kr',
                          venueText: p.spot_name || v?.name || 'Oslo Spot',
                          neighborhoodText: p.spot_neighborhood || v?.neighborhood || 'Oslo',
                          ratingText: String(
                            v?.google_rating ? v.google_rating.toFixed(1) : p.rating || '4.9'
                          ),
                          tasteNote:
                            p.review_text ||
                            p.diner_quotes?.[0]?.text ||
                            'Worth crossing town for.',
                          backgroundPhoto: p.image_url || v?.cover_image_url || null,
                        });
                      }
                    } else if (val.startsWith('spot:')) {
                      const spotId = val.slice(5);
                      const s = allSpots.find((sp) => sp.id === spotId);
                      if (s) {
                        const rawDish = (s.featuredDish || s.name)
                          .replace(/^[^\wA-Za-zÀ-ÿ]+/, '')
                          .split('·')[0]
                          .trim();
                        const words = rawDish.split(/\s+/);
                        onUpdateDishTitle({
                          dishTitle: rawDish,
                          line1Text: words[0] || s.name,
                          line2Text: words.slice(1).join(' ') || 'Oslo',
                          venueText: s.name,
                          locationIcon: s.icon || '📍',
                          neighborhoodText: s.neighborhood || 'Oslo',
                          ratingText: String(s.rating || '4.8'),
                          backgroundPhoto: s.photo || null,
                        });
                      }
                    }
                  }}
                  defaultValue=""
                  className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                >
                  <option value="">Tap to auto-fill from a live dish or Oslo spot…</option>
                  {foodPosts.length > 0 && (
                    <optgroup label={`Curated Dishes (${foodPosts.length})`}>
                      {foodPosts.slice(0, 40).map((p) => (
                        <option key={p.id} value={`post:${p.id}`}>
                          🍽️ {p.dish_name} — {p.spot_name} {p.price_nok ? `(${p.price_nok} kr)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={`Oslo Spots (${allSpots.length})`}>
                    {allSpots.map((s) => (
                      <option key={s.id} value={`spot:${s.id}`}>
                        {s.icon} {s.name} ({s.neighborhood}) · ★ {s.rating}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Sticker Scale Row */}
                {activeUiTarget !== 'full-cover' && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6DEC8]">
                    <span className="text-[11px] font-bold text-[#5C534E] uppercase">
                      Sticker Size ({Math.round(currentScale * 100)}%)
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'S', val: 0.8 },
                        { label: 'M', val: 1.0 },
                        { label: 'L', val: 1.15 },
                        { label: 'XL', val: 1.3 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => onUpdateDishTitle({ titleScale: p.val })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            Math.abs(currentScale - p.val) < 0.04
                              ? 'bg-[#231F1D] text-white'
                              : 'bg-[#FAF7F2] border border-[#E6DEC8] text-[#231F1D]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* TARGET A: DISH TITLE STICKER (comico-title-only)             */}
              {/* ============================================================ */}
              {activeUiTarget === 'comico-title-only' && (
                <div className="space-y-3.5">
                  {/* Line 1 Card */}
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#231F1D] uppercase tracking-wider">
                        1. Top Line Text &amp; Style
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDishTitle({ showUnderline: !dishTitle.showUnderline })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          dishTitle.showUnderline
                            ? 'bg-[#e84a27] text-white'
                            : 'bg-[#EFEAE1] text-[#5C534E]'
                        }`}
                      >
                        {dishTitle.showUnderline ? '✓ Divider Bar On' : 'Divider Bar Off'}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={dishTitle.line1Text}
                      onChange={(e) =>
                        onUpdateDishTitle({
                          line1Text: e.target.value,
                          dishTitle: `${e.target.value} ${dishTitle.line2Text}`.trim(),
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] font-bold text-sm text-[#231F1D]"
                      placeholder="Write anything (e.g. Korean, Biscoff, Must Try)…"
                    />

                    {renderFontPicker(
                      'Line 1 Font Style',
                      dishTitle.line1Font || 'comico',
                      (f) => onUpdateDishTitle({ line1Font: f })
                    )}

                    {renderQuickSwatches(
                      'Line 1 & Divider Color (1-Tap)',
                      dishTitle.line1Color || '#8B3A0E',
                      (hex) => onUpdateDishTitle({ line1Color: hex })
                    )}
                  </div>

                  {/* Line 2 Card */}
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#231F1D] uppercase tracking-wider">
                        2. Bottom Line Text &amp; Style
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDishTitle({
                            uppercaseLine2: dishTitle.uppercaseLine2 === false ? true : false,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          dishTitle.uppercaseLine2 !== false
                            ? 'bg-[#231F1D] text-white'
                            : 'bg-[#EFEAE1] text-[#5C534E]'
                        }`}
                      >
                        {dishTitle.uppercaseLine2 !== false ? 'AA UPPERCASE' : 'Aa Normal'}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={dishTitle.line2Text}
                      onChange={(e) =>
                        onUpdateDishTitle({
                          line2Text: e.target.value,
                          dishTitle: `${dishTitle.line1Text} ${e.target.value}`.trim(),
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] font-bold text-sm text-[#231F1D]"
                      placeholder="Second line (or clear for 1-line title)…"
                    />

                    {renderFontPicker(
                      'Line 2 Font Style',
                      dishTitle.line2Font || 'sans',
                      (f) => onUpdateDishTitle({ line2Font: f })
                    )}

                    {renderQuickSwatches(
                      'Line 2 Color (1-Tap)',
                      dishTitle.line2Color || '#53A626',
                      (hex) => onUpdateDishTitle({ line2Color: hex })
                    )}
                  </div>

                  {/* Signature 1-Tap Combos */}
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2">
                    <span className="block text-[11px] font-bold text-[#5C534E] uppercase tracking-wider">
                      1-Tap Color &amp; Text Presets
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SIGNATURE_TITLE_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            onUpdateDishTitle({
                              dishTitle: `${p.l1} ${p.l2}`,
                              line1Text: p.l1,
                              line1Color: p.c1,
                              line2Text: p.l2,
                              line2Color: p.c2,
                              showUnderline: true,
                            })
                          }
                          className="p-2 rounded-xl border border-[#E6DEC8] bg-[#FAF7F2] text-left hover:border-[#e84a27] transition-all active:scale-95"
                        >
                          <span className="block font-bold text-xs text-[#231F1D] truncate">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10"
                              style={{ backgroundColor: p.c1 }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10"
                              style={{ backgroundColor: p.c2 }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TARGET B: VERDICT CARD (glass-verdict-card) & FULL COVER     */}
              {/* ============================================================ */}
              {(activeUiTarget === 'glass-verdict-card' || activeUiTarget === 'full-cover') && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#231F1D] uppercase tracking-wider">
                        1. Write Card Content
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDishTitle({
                            showPriceOnCard: dishTitle.showPriceOnCard === false ? true : false,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          dishTitle.showPriceOnCard !== false
                            ? 'bg-[#e84a27] text-white'
                            : 'bg-[#EFEAE1] text-[#5C534E]'
                        }`}
                      >
                        {dishTitle.showPriceOnCard !== false ? '✓ Price Pill On' : 'Price Pill Hidden'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                          Dish Title / Headline
                        </label>
                        <input
                          type="text"
                          value={
                            dishTitle.dishTitle ??
                            `${dishTitle.line1Text} ${dishTitle.line2Text}`.trim()
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const parts = val.trim().split(/\s+/);
                            onUpdateDishTitle({
                              dishTitle: val,
                              line1Text: parts[0] || '',
                              line2Text: parts.slice(1).join(' '),
                            });
                          }}
                          placeholder="Korean Fried Chicken"
                          className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                          Price / Callout
                        </label>
                        <input
                          type="text"
                          value={dishTitle.priceText || ''}
                          onChange={(e) => onUpdateDishTitle({ priceText: e.target.value })}
                          placeholder="79 kr"
                          className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                          Spot Name
                        </label>
                        <input
                          type="text"
                          value={dishTitle.venueText ?? ''}
                          onChange={(e) => onUpdateDishTitle({ venueText: e.target.value })}
                          placeholder="175°C K-fried"
                          className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                          Area / Subtitle
                        </label>
                        <input
                          type="text"
                          value={dishTitle.neighborhoodText ?? ''}
                          onChange={(e) => onUpdateDishTitle({ neighborhoodText: e.target.value })}
                          placeholder="Sentrum"
                          className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                          Rating ★
                        </label>
                        <input
                          type="text"
                          value={dishTitle.ratingText ?? ''}
                          onChange={(e) => onUpdateDishTitle({ ratingText: e.target.value })}
                          placeholder="4.8"
                          className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        ✦ Verdict Quote / Review (Clear to hide box)
                      </label>
                      <input
                        type="text"
                        value={dishTitle.tasteNote ?? ''}
                        onChange={(e) => onUpdateDishTitle({ tasteNote: e.target.value })}
                        placeholder="Write your short verdict or quote…"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-medium text-[#231F1D]"
                      />
                    </div>
                  </div>

                  {/* Card Style, Font & Colors */}
                  <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
                    <span className="block text-xs font-extrabold text-[#231F1D] uppercase tracking-wider">
                      2. Card Font &amp; 1-Tap Colors
                    </span>

                    {/* Quick Card Theme Combos */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { label: '🌙 Dark Espresso', bg: '#181615', fg: '#FFFFFF', priceBg: '#E84A27' },
                          { label: '☀️ Warm Porcelain', bg: '#FAF7F2', fg: '#181615', priceBg: '#E84A27' },
                          { label: '🔥 Burnt Paprika', bg: '#E84A27', fg: '#FFFFFF', priceBg: '#181615' },
                          { label: '🍵 Deep Matcha', bg: '#2D5A27', fg: '#FFFFFF', priceBg: '#E84A27' },
                          { label: '🥨 Warm Cinnamon', bg: '#8B3A0E', fg: '#FFFFFF', priceBg: '#F59E0B' },
                          { label: '🍷 Berry Wine', bg: '#9F1239', fg: '#FFFFFF', priceBg: '#F59E0B' },
                        ] as const
                      ).map((preset) => {
                        const isCurr =
                          (dishTitle.cardBgColor || '#181615').toLowerCase() ===
                          preset.bg.toLowerCase();
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              onUpdateDishTitle({
                                cardBgColor: preset.bg,
                                cardTextColor: preset.fg,
                                priceBgColor: preset.priceBg,
                              })
                            }
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${
                              isCurr
                                ? 'bg-[#231F1D] text-white border-[#231F1D]'
                                : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {renderFontPicker(
                      'Headline Font Style',
                      dishTitle.line1Font || 'comico',
                      (f) => onUpdateDishTitle({ line1Font: f })
                    )}

                    {renderQuickSwatches(
                      'Card Background Color',
                      dishTitle.cardBgColor || '#181615',
                      (hex) => {
                        const isLight = ['#ffffff', '#faf7f2', '#e6dec8'].includes(
                          hex.toLowerCase()
                        );
                        onUpdateDishTitle({
                          cardBgColor: hex,
                          cardTextColor: isLight ? '#181615' : '#FFFFFF',
                        });
                      }
                    )}

                    {renderQuickSwatches(
                      'Card Text Color',
                      dishTitle.cardTextColor || '#FFFFFF',
                      (hex) => onUpdateDishTitle({ cardTextColor: hex })
                    )}

                    {renderQuickSwatches(
                      'Price Pill & Sparkle Color',
                      dishTitle.priceBgColor || '#E84A27',
                      (hex) => onUpdateDishTitle({ priceBgColor: hex, cardAccentColor: hex })
                    )}

                    {activeUiTarget === 'full-cover' && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#E6DEC8]">
                        <span className="text-xs font-bold text-[#231F1D]">
                          Show Smakr Mascot in Bottom Corner
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDishTitle({
                              showMascotOnCover:
                                dishTitle.showMascotOnCover === false ? true : false,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            dishTitle.showMascotOnCover !== false
                              ? 'bg-[#e84a27] text-white'
                              : 'bg-[#EFEAE1] text-[#5C534E]'
                          }`}
                        >
                          {dishTitle.showMascotOnCover !== false ? '✓ Mascot Shown' : 'Hidden'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TARGET C: PRICE / CALLOUT BADGE (paprika-price-pill)         */}
              {/* ============================================================ */}
              {activeUiTarget === 'paprika-price-pill' && (
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold text-[#231F1D] uppercase tracking-wider mb-1.5">
                      Write Badge Text (Price or Callout)
                    </label>
                    <input
                      type="text"
                      value={dishTitle.priceText || ''}
                      onChange={(e) => onUpdateDishTitle({ priceText: e.target.value })}
                      placeholder="e.g. 79 kr, MUST TRY, 10/10, WORTH IT…"
                      className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-sm font-bold text-[#231F1D]"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2">
                      {['79 kr', '145 kr', '185 kr', '🔥 MUST TRY', '10/10', '✦ WORTH IT', 'NEW DROP'].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => onUpdateDishTitle({ priceText: preset })}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E6DEC8] hover:border-[#e84a27] text-[11px] font-bold text-[#231F1D] whitespace-nowrap active:scale-95"
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {renderFontPicker(
                    'Badge Font Style',
                    dishTitle.line1Font || 'sans',
                    (f) => onUpdateDishTitle({ line1Font: f })
                  )}

                  {/* Tilt Angle Picker */}
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-[#5C534E] uppercase tracking-wider">
                      Sticker Tilt Angle
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: '-4° Tilt', val: -4 },
                        { label: '-2° Tilt', val: -2 },
                        { label: '0° Flat', val: 0 },
                        { label: '+2° Tilt', val: 2 },
                        { label: '+4° Tilt', val: 4 },
                      ].map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => onUpdateDishTitle({ priceTilt: t.val })}
                          className={`py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                            (dishTitle.priceTilt ?? -2) === t.val
                              ? 'bg-[#231F1D] text-white border-[#231F1D]'
                              : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {renderQuickSwatches(
                    'Badge Background Color (1-Tap)',
                    dishTitle.priceBgColor || '#E84A27',
                    (hex) => {
                      const isLight = ['#ffffff', '#faf7f2', '#e6dec8'].includes(
                        hex.toLowerCase()
                      );
                      onUpdateDishTitle({
                        priceBgColor: hex,
                        priceTextColor: isLight ? '#181615' : '#FFFFFF',
                      });
                    }
                  )}

                  {renderQuickSwatches(
                    'Badge Text Color (1-Tap)',
                    dishTitle.priceTextColor || '#FFFFFF',
                    (hex) => onUpdateDishTitle({ priceTextColor: hex })
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TARGET D: LOCATION + ★ PILL (location-rating-pill)           */}
              {/* ============================================================ */}
              {activeUiTarget === 'location-rating-pill' && (
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        Spot / Restaurant
                      </label>
                      <input
                        type="text"
                        value={dishTitle.venueText ?? ''}
                        onChange={(e) => onUpdateDishTitle({ venueText: e.target.value })}
                        placeholder="175°C K-fried"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        Area / Subtext (Optional)
                      </label>
                      <input
                        type="text"
                        value={dishTitle.neighborhoodText ?? ''}
                        onChange={(e) => onUpdateDishTitle({ neighborhoodText: e.target.value })}
                        placeholder="Sentrum (or clear)"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        Rating ★ (Optional)
                      </label>
                      <input
                        type="text"
                        value={dishTitle.ratingText ?? ''}
                        onChange={(e) => onUpdateDishTitle({ ratingText: e.target.value })}
                        placeholder="4.8 (or clear)"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                      />
                    </div>
                  </div>

                  {/* Pin / Food Icon Strip */}
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-[#5C534E] uppercase tracking-wider">
                      Left Pin / Food Icon
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {['📍', '🍕', '🍵', '🥟', '🍔', '🍜', '🥐', '🍗', '🔥', '✨', '🍷', '🌮', '🍣', ''].map(
                        (ic) => (
                          <button
                            key={ic || 'none'}
                            type="button"
                            onClick={() => onUpdateDishTitle({ locationIcon: ic })}
                            className={`h-9 px-2.5 rounded-xl border text-sm font-bold shrink-0 flex items-center justify-center transition-all ${
                              (dishTitle.locationIcon ?? '📍') === ic
                                ? 'bg-[#231F1D] text-white border-[#231F1D]'
                                : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8]'
                            }`}
                          >
                            {ic || 'None'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {renderFontPicker(
                    'Pill Font Style',
                    dishTitle.line2Font || 'sans',
                    (f) => onUpdateDishTitle({ line2Font: f })
                  )}

                  {renderQuickSwatches(
                    'Pill Background Color (1-Tap)',
                    dishTitle.locationBgColor ||
                      (dishTitle.locationTheme === 'porcelain' ? '#FAF7F2' : '#181615'),
                    (hex) => {
                      const isLight = ['#ffffff', '#faf7f2', '#e6dec8'].includes(
                        hex.toLowerCase()
                      );
                      onUpdateDishTitle({
                        locationBgColor: hex,
                        locationTextColor: isLight ? '#181615' : '#FFFFFF',
                        locationTheme: isLight ? 'porcelain' : 'dark',
                      });
                    }
                  )}

                  {renderQuickSwatches(
                    'Pill Text Color (1-Tap)',
                    dishTitle.locationTextColor || '#FFFFFF',
                    (hex) => onUpdateDishTitle({ locationTextColor: hex })
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TARGET E: BRAND LOGO BADGE (brand-logo-pill)                 */}
              {/* ============================================================ */}
              {activeUiTarget === 'brand-logo-pill' && (
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        Left Wordmark
                      </label>
                      <input
                        type="text"
                        value={dishTitle.logoLeftText ?? 'SMAKR'}
                        onChange={(e) => onUpdateDishTitle({ logoLeftText: e.target.value })}
                        placeholder="SMAKR"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                        Right Tag (or clear)
                      </label>
                      <input
                        type="text"
                        value={dishTitle.logoRightText ?? 'OSLO'}
                        onChange={(e) => onUpdateDishTitle({ logoRightText: e.target.value })}
                        placeholder="OSLO, PICK, DROP…"
                        className="w-full h-10 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'porcelain', label: '☀️ Porcelain Pill', bg: '#FAF7F2', fg: '#181615' },
                        { id: 'dark', label: '🌙 Dark Pill', bg: '#181615', fg: '#FAF7F2' },
                        { id: 'text-only', label: '🔤 Text Only', bg: '#FAF7F2', fg: '#181615' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          onUpdateDishTitle({
                            logoTheme: t.id,
                            logoBgColor: t.bg,
                            logoTextColor: t.fg,
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          (dishTitle.logoTheme || 'porcelain') === t.id
                            ? 'bg-[#231F1D] text-white border-[#231F1D]'
                            : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {renderFontPicker(
                    'Wordmark Font Style',
                    dishTitle.line1Font || 'comico',
                    (f) => onUpdateDishTitle({ line1Font: f })
                  )}

                  {dishTitle.logoTheme !== 'text-only' &&
                    renderQuickSwatches(
                      'Pill Background Color',
                      dishTitle.logoBgColor || '#FAF7F2',
                      (hex) => {
                        const isLight = ['#ffffff', '#faf7f2', '#e6dec8'].includes(
                          hex.toLowerCase()
                        );
                        onUpdateDishTitle({
                          logoBgColor: hex,
                          logoTextColor: isLight ? '#181615' : '#FFFFFF',
                        });
                      }
                    )}

                  {renderQuickSwatches(
                    'Left Wordmark Color',
                    dishTitle.logoAccentColor || '#E84A27',
                    (hex) => onUpdateDishTitle({ logoAccentColor: hex })
                  )}

                  {renderQuickSwatches(
                    'Right Label Color',
                    dishTitle.logoTextColor || '#181615',
                    (hex) => onUpdateDishTitle({ logoTextColor: hex })
                  )}
                </div>
              )}

              {/* 1-CLICK QUICK EXTRACT STRIP FOR CANVA FREE */}
              {onQuickExtractUiTarget && (
                <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8]">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6E655F] mb-2">
                    ⬇ 1-Tap Download Individual Transparent PNG (For Canva)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['comico-title-only', '⬇ Title Sticker'],
                        ['glass-verdict-card', '⬇ Verdict Card'],
                        ['paprika-price-pill', '⬇ Price Badge'],
                        ['location-rating-pill', '⬇ Location Pill'],
                        ['brand-logo-pill', '⬇ Logo Badge'],
                        ['full-cover', '⬇ Full Cover'],
                      ] as const
                    ).map(([targetId, label]) => (
                      <button
                        key={targetId}
                        type="button"
                        onClick={() => onQuickExtractUiTarget(targetId)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FFF3ED] hover:bg-[#E84A27] text-[#E84A27] hover:text-white border border-[#E84A27]/30 text-[11px] font-bold transition-all active:scale-95"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                      15% top &amp; bottom dashed guidelines for stories and reels
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
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: pal.bgColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: pal.baseColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: pal.heroColor }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Color
                    name="Background Color"
                    value={state.wallpaper.bgColor}
                    onChange={(hex) => onUpdateWallpaper({ bgColor: hex })}
                    swatches={STUDIO_STICKER_SWATCHES}
                  />
                  <Color
                    name="Pattern Word Color"
                    value={state.wallpaper.baseColor}
                    onChange={(hex) => onUpdateWallpaper({ baseColor: hex })}
                    swatches={STUDIO_STICKER_SWATCHES}
                  />
                  <Color
                    name="Hero Row Accent"
                    value={state.wallpaper.heroColor}
                    onChange={(hex) => onUpdateWallpaper({ heroColor: hex })}
                    swatches={STUDIO_STICKER_SWATCHES}
                  />
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
        <footer className="hidden sm:flex sm:h-[42dvh] sm:max-h-[360px] bg-[#FAF7F2] border-t border-[#E6DEC8] flex-col shrink-0 text-[#231F1D] select-none">
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
            {/* Backdrop: transparent touch-outside to collapse */}
            <div
              className="sm:hidden fixed inset-0 bg-black/10 z-40 animate-in fade-in duration-200"
              onClick={() => setMobileExpanded(false)}
            />

            {/* Top Live Asset Preview on Mobile */}
            <div
              className={`sm:hidden fixed top-14 inset-x-0 ${
                currentSlotId === 'caption' ? 'bottom-[78dvh]' : 'bottom-[54dvh]'
              } z-40 bg-[#EFEAE1] border-b border-[#E6DEC8] flex items-center justify-center p-2.5 animate-in fade-in duration-200`}
              onClick={(e) => {
                if (e.target === e.currentTarget) setMobileExpanded(false);
              }}
            >
              <div
                className={`relative p-3 pt-8 rounded-2xl shadow-md border border-[#D8CFC0] flex items-center justify-center max-h-full max-w-[95vw] min-w-[280px] ${
                  currentSlotId === 'caption' ? 'min-h-[84px]' : 'min-h-[150px]'
                } overflow-hidden transition-colors ${
                  previewBackdrop === 'dark'
                    ? 'bg-[#181615]'
                    : previewBackdrop === 'light'
                    ? 'bg-[#FAF7F2]'
                    : 'bg-[conic-gradient(#e5e0d5_25%,#faf7f2_0_50%,#e5e0d5_0_75%,#faf7f2_0)] [background-size:16px_16px]'
                }`}
              >
                {activeMode === 'mascot' ? (
                  <div className="scale-[0.5] origin-center shrink-0 -my-14 -mx-10">
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
                  <div className="scale-[0.3] origin-center shrink-0 -my-24 -mx-28">
                    <MapShot s={state.map} w={860} h={440} interactive={false} />
                  </div>
                ) : activeMode === 'dish-title' ? (
                  (() => {
                    if (activeUiTarget === 'full-cover') {
                      return (
                        <div className="relative w-[162px] h-[202px] overflow-hidden rounded-xl shadow-md shrink-0 bg-[#181615]">
                          <div
                            style={{
                              width: 1080,
                              height: 1350,
                              transform: 'scale(0.15)',
                              transformOrigin: 'top left',
                            }}
                            className="absolute top-0 left-0"
                          >
                            <StudioCanvas state={state} interactive={false} />
                          </div>
                        </div>
                      );
                    }

                    if (activeUiTarget === 'glass-verdict-card') {
                      return (
                        <div className="w-[310px] h-[135px] overflow-visible relative shrink-0 flex items-center justify-center">
                          <div
                            style={{
                              transform: 'scale(0.35)',
                              transformOrigin: 'center center',
                            }}
                            className="shrink-0 flex items-center justify-center"
                          >
                            <StudioCanvas state={state} interactive={false} />
                          </div>
                        </div>
                      );
                    }

                    if (activeUiTarget === 'paprika-price-pill') {
                      return (
                        <div className="p-1 shrink-0 flex items-center justify-center">
                          <div
                            style={{
                              transform: 'scale(0.65)',
                              transformOrigin: 'center center',
                            }}
                            className="shrink-0"
                          >
                            <StudioCanvas state={state} interactive={false} />
                          </div>
                        </div>
                      );
                    }

                    if (activeUiTarget === 'brand-logo-pill') {
                      return (
                        <div className="p-1 shrink-0 flex items-center justify-center">
                          <div
                            style={{
                              transform: 'scale(0.62)',
                              transformOrigin: 'center center',
                            }}
                            className="shrink-0"
                          >
                            <StudioCanvas state={state} interactive={false} />
                          </div>
                        </div>
                      );
                    }

                    if (activeUiTarget === 'location-rating-pill') {
                      return (
                        <div className="p-1 shrink-0 flex items-center justify-center">
                          <div
                            style={{
                              transform: 'scale(0.52)',
                              transformOrigin: 'center center',
                            }}
                            className="shrink-0"
                          >
                            <StudioCanvas state={state} interactive={false} />
                          </div>
                        </div>
                      );
                    }

                    // comico-title-only
                    return (
                      <div className="w-[310px] h-[125px] overflow-visible relative shrink-0 flex items-center justify-center">
                        <div
                          style={{
                            transform: 'scale(0.36)',
                            transformOrigin: 'center center',
                          }}
                          className="shrink-0 flex items-center justify-center"
                        >
                          <StudioCanvas state={state} interactive={false} />
                        </div>
                      </div>
                    );
                  })()
                ) : activeMode === 'wallpaper' ? (
                  <div className="relative w-[162px] h-[216px] overflow-hidden rounded-xl shadow-md shrink-0 bg-[#181615]">
                    <div
                      style={{
                        width: 1080,
                        height: 1440,
                        transform: 'scale(0.15)',
                        transformOrigin: 'top left',
                      }}
                      className="absolute top-0 left-0"
                    >
                      <StudioCanvas state={state} interactive={false} />
                    </div>
                  </div>
                ) : null}

                {/* Top-Left Live Badge */}
                <div className="absolute top-1.5 left-2 flex items-center gap-1.5 bg-[#FAF7F2]/95 px-2 py-0.5 rounded-full border border-[#E6DEC8] z-20 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e84a27] animate-pulse" />
                  <span className="text-[9px] font-bold text-[#231F1D] uppercase tracking-wider">
                    Live · {activeSlotMeta.title}
                  </span>
                </div>

                {/* Top-Right Backdrop Contrast Switcher (Checker / Dark / Light) */}
                <div className="absolute top-1.5 right-2 flex items-center gap-0.5 bg-[#FAF7F2]/95 p-0.5 rounded-full border border-[#E6DEC8] z-20 shadow-2xs">
                  {(
                    [
                      ['checker', '🏁'],
                      ['dark', '🌙'],
                      ['light', '☀️'],
                    ] as const
                  ).map(([bgMode, icon]) => (
                    <button
                      key={bgMode}
                      type="button"
                      onClick={() => setPreviewBackdrop(bgMode)}
                      className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center transition-all ${
                        previewBackdrop === bgMode
                          ? 'bg-[#231F1D] text-white shadow-2xs'
                          : 'text-[#6E655F]'
                      }`}
                      title={`Preview backdrop: ${bgMode}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`sm:hidden fixed inset-x-0 bottom-0 z-50 ${
                currentSlotId === 'caption' ? 'h-[78dvh] max-h-[650px]' : 'h-[54dvh] max-h-[480px]'
              } pb-safe bg-[#FAF7F2] rounded-t-[28px] border-t border-[#D8CFC0] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-250 select-none`}
            >
              {/* Sheet Header */}
              <div className="px-4 pt-2.5 pb-2 border-b border-[#E6DEC8] flex items-center justify-between shrink-0 bg-white/80">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(false)}
                    className="w-7 h-7 rounded-full bg-[#EAE3D7] hover:bg-[#DFD7C8] flex items-center justify-center text-[#231F1D] active:scale-95 shrink-0"
                    aria-label="Collapse drawer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <span className="text-sm leading-none shrink-0">
                    {activeSlotMeta.icon || '🏷️'}
                  </span>

                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#231F1D] truncate">
                    {activeSlotMeta.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeMode === 'dish-title' &&
                    currentSlotId !== 'caption' &&
                    onQuickExtractUiTarget && (
                      <button
                        type="button"
                        onClick={() => onQuickExtractUiTarget(activeUiTarget)}
                        className="px-3 py-1.5 rounded-full bg-[#231F1D] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                      >
                        ⬇ Save PNG
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => setMobileExpanded(false)}
                    className="px-3 py-1.5 rounded-full bg-[#e84a27] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>Done</span>
                    <span>✓</span>
                  </button>
                </div>
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
