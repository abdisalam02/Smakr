'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Check, Sparkles, RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type {
  DishTitleState,
  IgCaptionAngle,
  IgCaptionLanguage,
  MapShotState,
  StudioState,
} from '@/types/studio';
import type { FoodPost, Venue } from '@/types';

export interface SpotOption {
  id: string;
  name: string;
  address: string;
  icon: string;
  rating: number;
  photo: string;
  dishPhoto?: string | null;
  venuePhoto?: string | null;
  neighborhood: string;
  featuredDish: string;
  lat: number;
  lng: number;
  category?: string;
}

interface StudioCaptionGeneratorProps {
  state: StudioState;
  allSpots: SpotOption[];
  foodPosts: FoodPost[];
  effectiveVenues: Venue[];
  onUpdateMap: (patch: Partial<MapShotState>) => void;
  onUpdateDishTitle: (patch: Partial<DishTitleState>) => void;
}

/**
 * Smart Dish-Aware Flavor Note Resolver
 * Never outputs "Balanced seasoning and cooked to order" for drinks/matcha/pastries!
 */
export function resolveSmartTasteNote(
  dishName = '',
  venueName = '',
  category = '',
  existingNote = ''
): string {
  const cleaned = existingNote.trim();
  const lowerExisting = cleaned.toLowerCase();
  if (
    cleaned &&
    !lowerExisting.includes('balanced seasoning') &&
    !lowerExisting.includes('worth crossing town for')
  ) {
    return cleaned;
  }

  const combined = `${dishName} ${venueName} ${category}`.toLowerCase();
  if (combined.includes('biscoff') && combined.includes('matcha')) {
    return 'Rich caramelized Biscoff cookie butter swirled with vibrant ceremonial-grade Uji matcha and silky milk.';
  }
  if (combined.includes('matcha') || combined.includes('ochaya') || combined.includes('tea')) {
    return 'Vibrant ceremonial-grade Uji matcha whisked smooth over velvety milk with zero bitterness.';
  }
  if (combined.includes('coffee') || combined.includes('latte') || combined.includes('espresso') || combined.includes('cappuccino')) {
    return 'Silky microfoam poured over bright Nordic-roasted espresso with clean sweetness.';
  }
  if (
    combined.includes('bakery') ||
    combined.includes('bun') ||
    combined.includes('bolle') ||
    combined.includes('croissant') ||
    combined.includes('cardamom') ||
    combined.includes('brød')
  ) {
    return 'Flaky, caramelized crust with a tender, butter-rich crumb and freshly ground spice.';
  }
  if (combined.includes('fried chicken') || combined.includes('k-fried') || combined.includes('korean')) {
    return 'Double-fried shatteringly crisp crust glazed in sticky sweet-heat gochujang and toasted sesame.';
  }
  if (combined.includes('dumpling') || combined.includes('gyoza') || combined.includes('dim sum') || combined.includes('bao')) {
    return 'Crisp pan-seared bottoms, delicate hand-pleated wrappers, and juicy aromatic filling.';
  }
  if (combined.includes('pizza') || combined.includes('slice')) {
    return 'Blistered, airy sourdough crust with bright crushed San Marzano tomatoes and melted fior di latte.';
  }
  if (combined.includes('ramen') || combined.includes('noodle') || combined.includes('pho')) {
    return 'Silky slow-simmered broth with springy noodles and deeply savory aromatics.';
  }
  if (combined.includes('burger') || combined.includes('smash')) {
    return 'Hard-seared lacy beef edges, melted cheese, house pickles, and a soft toasted potato bun.';
  }
  if (combined.includes('kebab') || combined.includes('shawarma') || combined.includes('falafel')) {
    return 'Char-grilled spiced meat shaved thin into warm flatbread with bright herbs and crisp pickles.';
  }
  return '';
}

/**
 * Smart Oslo Neighborhood Hashtag & Local SEO Resolver
 * Maps venue neighborhood or street address to hyper-local Oslo hashtags + dish tags.
 */
export function resolveOsloNeighborhoodHashtags(
  neighborhood = '',
  address = '',
  category = '',
  dishName = ''
): {
  resolvedNeighborhood: string;
  areaHashtags: string[];
  allHashtags: string[];
} {
  const combined = `${neighborhood} ${address}`.toLowerCase();
  let resolvedNeighborhood = neighborhood.trim() || 'Oslo';
  let areaHashtags: string[] = ['#torggata', '#oslosentrum', '#youngstorget', '#midtibyen'];

  if (
    combined.includes('grünerløkka') ||
    combined.includes('grunerlokka') ||
    combined.includes('løkka') ||
    combined.includes('markveien') ||
    combined.includes('thorvald meyers')
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === 'oslo' ? 'Grünerløkka' : neighborhood;
    areaHashtags = ['#grünerløkka', '#løkka', '#markveien', '#thorvaldmeyersgate'];
  } else if (
    combined.includes('torggata') ||
    combined.includes('sentrum') ||
    combined.includes('bernt ankers') ||
    combined.includes('youngstorget')
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === 'oslo' ? 'Sentrum' : neighborhood;
    areaHashtags = ['#torggata', '#oslosentrum', '#youngstorget', '#midtibyen'];
  } else if (
    combined.includes('grønland') ||
    combined.includes('gronland') ||
    combined.includes('tøyen') ||
    combined.includes('toyen') ||
    combined.includes('gamle oslo')
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === 'oslo' ? 'Grønland / Tøyen' : neighborhood;
    areaHashtags = ['#grønlandoslo', '#tøyen', '#gamleoslo', '#oslostreetfood'];
  } else if (
    combined.includes('frogner') ||
    combined.includes('majorstuen') ||
    combined.includes('bogstadveien') ||
    combined.includes('vestkanten')
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === 'oslo' ? 'Frogner' : neighborhood;
    areaHashtags = ['#frogner', '#majorstuen', '#vestkanten', '#oslobakery'];
  } else if (
    combined.includes('bjørvika') ||
    combined.includes('bjorvika') ||
    combined.includes('barcode') ||
    combined.includes('sørenga') ||
    combined.includes('operagata') ||
    combined.includes('dronning eufemias')
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === 'oslo' ? 'Bjørvika' : neighborhood;
    areaHashtags = ['#bjørvika', '#oslobukta', '#barcodeoslo', '#sørenga'];
  }

  const dishCat = `${category} ${dishName}`.toLowerCase();
  const dishTags: string[] = [];
  if (dishCat.includes('matcha') || dishCat.includes('tea') || dishCat.includes('ochaya')) {
    dishTags.push('#matchaoslo', '#oslocafe');
  } else if (dishCat.includes('coffee') || dishCat.includes('latte') || dishCat.includes('espresso')) {
    dishTags.push('#oslocoffee', '#oslocafe');
  } else if (
    dishCat.includes('bakery') ||
    dishCat.includes('bun') ||
    dishCat.includes('bolle') ||
    dishCat.includes('croissant') ||
    dishCat.includes('cardamom') ||
    dishCat.includes('brød')
  ) {
    dishTags.push('#oslobakeri', '#oslocafe');
  } else if (dishCat.includes('pizza') || dishCat.includes('slice')) {
    dishTags.push('#oslopizza', '#osloeats');
  } else if (dishCat.includes('dumpling') || dishCat.includes('gyoza') || dishCat.includes('bao')) {
    dishTags.push('#dumplingsoslo', '#oslostreetfood');
  } else if (dishCat.includes('chicken') || dishCat.includes('korean') || dishCat.includes('k-fried')) {
    dishTags.push('#koreanfoodoslo', '#oslostreetfood');
  } else if (dishCat.includes('ramen') || dishCat.includes('noodle') || dishCat.includes('pho')) {
    dishTags.push('#ramenoslo', '#osloeats');
  } else if (
    dishCat.includes('kebab') ||
    dishCat.includes('shawarma') ||
    dishCat.includes('burger') ||
    dishCat.includes('taco')
  ) {
    dishTags.push('#oslostreetfood', '#osloeats');
  } else {
    dishTags.push('#osloeats', '#oslorestaurant');
  }

  const combinedTags = [
    '#oslofood',
    '#visitoslo',
    '#spiseioslo',
    ...areaHashtags,
    ...dishTags,
    '#smakroslo',
  ].map((t) => (t.startsWith('#') ? t : `#${t}`));
  const allHashtags = Array.from(new Set(combinedTags)).slice(0, 10);

  return { resolvedNeighborhood, areaHashtags, allHashtags };
}

export function buildDeterministicIgCaption(params: {
  dishName: string;
  priceNok: string;
  venueName: string;
  neighborhood: string;
  address: string;
  rating: string;
  tasteNote: string;
  includeTasteNote: boolean;
  betaMode: boolean;
  spacedCheatSheet: boolean;
  category?: string;
  openingHoursSummary?: string;
  angle: IgCaptionAngle;
  language: IgCaptionLanguage;
}): {
  caption: string;
  storyTeaser: string;
  altText: string;
  hookLength: number;
  hashtags: string[];
} {
  const dishName = params.dishName.trim() || 'Biscoff Matcha';
  const rawPrice = params.priceNok.trim() || '90 kr';
  const priceNok = /\bkr\b/i.test(rawPrice) ? rawPrice : `${rawPrice} kr`;
  const venueName = params.venueName.trim() || 'Ochaya - The Matcha';
  const address = params.address.trim() || `${venueName}, Oslo`;
  const rating = params.rating.trim() || '4.9';

  const { resolvedNeighborhood, allHashtags } = resolveOsloNeighborhoodHashtags(
    params.neighborhood,
    address,
    params.category || '',
    dishName
  );

  const cleanNote = params.includeTasteNote
    ? resolveSmartTasteNote(dishName, venueName, params.category || '', params.tasteNote)
    : '';
  const notePrefix = cleanNote ? `${cleanNote} ` : '';

  let hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - worth crossing Oslo for`;
  let verdict = `${notePrefix}At ${priceNok}, this is one of the sharpest orders at ${venueName} right now.`;
  let cta = params.betaMode
    ? `Send this to someone you want to get a ${dishName} with. Type "beta test" to get the link and be an early tester of Smakr and to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`
    : `Send this to someone you want to get a ${dishName} with and tap the link in bio (@smakr.no) to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`;
  let storyTeaser = params.betaMode
    ? `New ${priceNok} ${dishName} drop in ${resolvedNeighborhood} — type "beta test" for early access 👉`
    : `New ${priceNok} ${dishName} drop in ${resolvedNeighborhood} 👉`;

  if (params.language === 'no') {
    if (params.angle === 'hype-drop') {
      hook = `${dishName} (${priceNok}) i ${resolvedNeighborhood} som alle snakker om nå`;
      verdict = `${notePrefix}Til ${priceNok} hos ${venueName} er dette en av de råeste bestillingene i Oslo akkurat nå.`;
    } else if (params.angle === 'hidden-gem') {
      hook = `Ikke gå forbi ${venueName} i ${resolvedNeighborhood} uten å teste ${dishName} (${priceNok})`;
      verdict = `${notePrefix}En ekte lokal favoritt i ${resolvedNeighborhood} til ${priceNok}.`;
    } else if (params.angle === 'budget-steal') {
      hook = `${priceNok} for ${dishName} i ${resolvedNeighborhood} - beste kjøpet i Oslo nå?`;
      verdict = `${notePrefix}Sjelden du får så mye kvalitet for ${priceNok} i Oslo som hos ${venueName}.`;
    } else {
      hook = `Er dette Oslos beste ${dishName.toLowerCase()}? (${priceNok} i ${resolvedNeighborhood})`;
      verdict = `${notePrefix}Vi gir den ${rating}/5 hos ${venueName} - enig eller uenig?`;
    }
    cta = params.betaMode
      ? `Send denne til noen du vil teste ${dishName} med. Skriv "beta test" i kommentarfeltet for å få linken og bli tidlig betatester av Smakr, og se ${venueName} + alle steder i nærheten på Oslo Food Radar-kartet.`
      : `Send denne til noen du vil teste ${dishName} med og sjekk linken i bio (@smakr.no) for å se ${venueName} på Oslo Food Radar-kartet.`;
    storyTeaser = `Ny ${priceNok} ${dishName}-favoritt i ${resolvedNeighborhood} — skriv "beta test" 👉`;
  } else if (params.language === 'bilingual') {
    if (params.angle === 'hype-drop') {
      hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - ny Oslo-favoritt du må teste`;
    } else if (params.angle === 'hidden-gem') {
      hook = `Low-key ${resolvedNeighborhood} gem: ${dishName} (${priceNok}) at ${venueName}`;
    } else if (params.angle === 'budget-steal') {
      hook = `${priceNok} in ${resolvedNeighborhood}: ${dishName} at ${venueName} er et ekte kupp`;
    } else {
      hook = `Best ${dishName.toLowerCase()} in Oslo? (${priceNok} at ${venueName}) - enig eller uenig?`;
    }
    verdict = `${notePrefix}At ${priceNok}, this is one of the sharpest orders at ${venueName} right now.`;
    cta = params.betaMode
      ? `Send this to someone you want to get a ${dishName} with ("Spise her? 👀"). Type "beta test" to get the link and be an early tester of Smakr and to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`
      : `Send this to someone you want to get a ${dishName} with ("Spise her? 👀") and tap the link in bio (@smakr.no) to find ${venueName} on the live Oslo Food Radar map.`;
  } else {
    if (params.angle === 'hype-drop') {
      hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - worth crossing Oslo for`;
    } else if (params.angle === 'hidden-gem') {
      hook = `Don't walk past ${venueName} in ${resolvedNeighborhood} without ordering the ${dishName}`;
    } else if (params.angle === 'budget-steal') {
      hook = `${priceNok} for ${dishName} in ${resolvedNeighborhood} might be Oslo's best value order`;
    } else {
      hook = `Is this the best ${dishName.toLowerCase()} in Oslo right now? (${priceNok} in ${resolvedNeighborhood})`;
    }
  }

  if (hook.length > 108) {
    hook = `${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood}`.slice(0, 108);
  }

  const cheatLines = [
    `📍 Spot: ${venueName}`,
    `🗺️ Area: ${address} (${resolvedNeighborhood})`,
    `💰 Price: ${priceNok}`,
    `⭐ Rating: ${rating}/5`,
    ...(params.openingHoursSummary ? [`🕒 Hours: ${params.openingHoursSummary}`] : []),
  ];

  const cheatSheet = cheatLines.join(params.spacedCheatSheet ? '\n\n' : '\n');

  const caption = [hook, verdict, cheatSheet, cta, allHashtags.join(' ')].join('\n\n');
  const altText = `${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood}, Oslo — Smakr Oslo Food Guide`;

  return {
    caption,
    storyTeaser,
    altText,
    hookLength: hook.length,
    hashtags: allHashtags,
  };
}

export function StudioCaptionGenerator({
  state,
  allSpots,
  foodPosts,
  effectiveVenues,
  onUpdateMap,
  onUpdateDishTitle,
}: StudioCaptionGeneratorProps) {
  const dishTitleState = state.dishTitle;
  const mapState = state.map;

  const derivedDishName = useMemo(() => {
    if (dishTitleState?.dishTitle && dishTitleState.dishTitle !== 'Biscoff Matcha') {
      return dishTitleState.dishTitle;
    }
    const combinedLines = `${dishTitleState?.line1Text || ''} ${dishTitleState?.line2Text || ''}`.trim();
    if (combinedLines && combinedLines !== 'Biscoff Matcha') {
      return combinedLines;
    }
    if (mapState?.featuredDish) {
      return mapState.featuredDish
        .replace(/^[^\wA-Za-zÀ-ÿ0-9]+/, '')
        .split('·')[0]
        .trim();
    }
    return combinedLines || 'Biscoff Matcha';
  }, [dishTitleState?.dishTitle, dishTitleState?.line1Text, dishTitleState?.line2Text, mapState?.featuredDish]);

  const derivedPrice = useMemo(() => {
    if (mapState?.featuredDish && mapState.featuredDish.includes('·')) {
      const pricePart = mapState.featuredDish.split('·')[1]?.trim();
      if (pricePart) return pricePart;
    }
    return dishTitleState?.priceText || '90 kr';
  }, [mapState?.featuredDish, dishTitleState?.priceText]);

  const derivedVenueName = useMemo(() => {
    return mapState?.name || dishTitleState?.venueText || 'Ochaya - The Matcha';
  }, [mapState?.name, dishTitleState?.venueText]);

  const derivedAddress = useMemo(() => {
    return mapState?.address || `${derivedVenueName}, Oslo`;
  }, [mapState?.address, derivedVenueName]);

  const derivedNeighborhood = useMemo(() => {
    return mapState?.neighborhood || dishTitleState?.neighborhoodText || 'Sentrum';
  }, [mapState?.neighborhood, dishTitleState?.neighborhoodText]);

  const derivedRating = useMemo(() => {
    return String(mapState?.rating || dishTitleState?.ratingText || '4.9');
  }, [mapState?.rating, dishTitleState?.ratingText]);

  const derivedTasteNote = useMemo(() => {
    return resolveSmartTasteNote(
      derivedDishName,
      derivedVenueName,
      '',
      dishTitleState?.tasteNote || ''
    );
  }, [derivedDishName, derivedVenueName, dishTitleState?.tasteNote]);

  // Local editable override states
  const [dishName, setDishName] = useState(derivedDishName);
  const [priceNok, setPriceNok] = useState(derivedPrice);
  const [venueName, setVenueName] = useState(derivedVenueName);
  const [neighborhood, setNeighborhood] = useState(derivedNeighborhood);
  const [address, setAddress] = useState(derivedAddress);
  const [rating, setRating] = useState(derivedRating);
  const [tasteNote, setTasteNote] = useState(derivedTasteNote);
  const [includeTasteNote, setIncludeTasteNote] = useState(false);
  const [betaMode, setBetaMode] = useState(true);
  const [spacedCheatSheet, setSpacedCheatSheet] = useState(true);
  const [category, setCategory] = useState('all');

  const [angle, setAngle] = useState<IgCaptionAngle>('hype-drop');
  const [language, setLanguage] = useState<IgCaptionLanguage>('en');
  const [showMoreAddressFields, setShowMoreAddressFields] = useState(false);

  // Sync local overrides whenever user switches spot/dish in Studio
  useEffect(() => {
    setDishName(derivedDishName);
    setPriceNok(derivedPrice);
    setVenueName(derivedVenueName);
    setNeighborhood(derivedNeighborhood);
    setAddress(derivedAddress);
    setRating(derivedRating);
    setTasteNote(derivedTasteNote);
  }, [
    derivedDishName,
    derivedPrice,
    derivedVenueName,
    derivedNeighborhood,
    derivedAddress,
    derivedRating,
    derivedTasteNote,
  ]);

  const deterministic = useMemo(
    () =>
      buildDeterministicIgCaption({
        dishName,
        priceNok,
        venueName,
        neighborhood,
        address,
        rating,
        tasteNote,
        includeTasteNote,
        betaMode,
        spacedCheatSheet,
        category,
        angle,
        language,
      }),
    [
      dishName,
      priceNok,
      venueName,
      neighborhood,
      address,
      rating,
      tasteNote,
      includeTasteNote,
      betaMode,
      spacedCheatSheet,
      category,
      angle,
      language,
    ]
  );

  const [captionText, setCaptionText] = useState(deterministic.caption);
  const [storyTeaserText, setStoryTeaserText] = useState(deterministic.storyTeaser);
  const [altText, setAltText] = useState(deterministic.altText);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<'caption' | 'story' | 'alt' | 'tags' | null>(null);

  useEffect(() => {
    setCaptionText(deterministic.caption);
    setStoryTeaserText(deterministic.storyTeaser);
    setAltText(deterministic.altText);
  }, [deterministic]);

  const triggerToast = useCallback(
    (msg: string, key: 'caption' | 'story' | 'alt' | 'tags') => {
      setCopyToast(msg);
      setCopiedKey(key);
      setTimeout(() => {
        setCopyToast(null);
        setCopiedKey(null);
      }, 2600);
    },
    []
  );

  const handleCopy = useCallback(
    async (text: string, key: 'caption' | 'story' | 'alt' | 'tags', toastMsg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        triggerToast(toastMsg, key);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        triggerToast(toastMsg, key);
      }
    },
    [triggerToast]
  );

  const handleGenerateAiVariation = useCallback(async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/admin/ai-curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate-ig-caption',
          dishName,
          priceNok: /\bkr\b/i.test(priceNok.trim()) ? priceNok.trim() : `${priceNok.trim()} kr`,
          venueName,
          neighborhood,
          address,
          rating,
          tasteNote: includeTasteNote ? tasteNote : '',
          category,
          angle,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.caption) setCaptionText(data.caption);
        if (data.storyTeaser) setStoryTeaserText(data.storyTeaser);
        if (data.altText) setAltText(data.altText);
        setCopyToast('✨ Fresh AI caption generated!');
        setTimeout(() => setCopyToast(null), 2400);
      }
    } catch {
      // Fallback already populated
    } finally {
      setIsGeneratingAi(false);
    }
  }, [
    dishName,
    priceNok,
    venueName,
    neighborhood,
    address,
    rating,
    includeTasteNote,
    tasteNote,
    category,
    angle,
    language,
  ]);

  const firstLineLength = useMemo(() => {
    const firstLine = (captionText.split('\n')[0] || '').trim();
    return firstLine.length;
  }, [captionText]);

  return (
    <div className="max-w-2xl mx-auto space-y-3.5 pb-4">
      {/* Floating Copy / AI Toast */}
      {copyToast && (
        <div className="p-2.5 rounded-xl bg-[#181615] text-[#FAF7F2] text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in duration-150">
          <span>{copyToast}</span>
          <span className="text-[10px] text-[#e84a27] font-extrabold uppercase">Ready</span>
        </div>
      )}

      {/* 1. ALWAYS-VISIBLE DISH, PRICE & SPOT BAR (Updates all places in caption simultaneously!) */}
      <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#FFF3ED] border border-[#e84a27]/30 text-[#e84a27] text-[10px] font-extrabold uppercase tracking-wider">
              🧪 Beta Launch Mode
            </span>
            <span className="text-xs font-extrabold text-[#231F1D]">
              1. Dish, Price &amp; Spot (Syncs Everywhere)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMoreAddressFields((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[11px] font-bold text-[#231F1D] flex items-center gap-1 active:scale-95"
          >
            <span>{showMoreAddressFields ? 'Hide Address/Note' : '+ Address & Taste Note'}</span>
            {showMoreAddressFields ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 1-Tap Switch Spot / Dish Dropdown */}
        <select
          aria-label="Select Oslo dish or venue for caption"
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            if (val.startsWith('post:')) {
              const postId = val.slice(5);
              const p = foodPosts.find((fp) => fp.id === postId);
              if (p) {
                const v = effectiveVenues.find((vn) => vn.id === p.spot_id);
                const dName = p.dish_name || 'Biscoff Matcha';
                const pText = p.price_nok ? `${p.price_nok} kr` : priceNok;
                const vName = p.spot_name || v?.name || 'Oslo Spot';
                const nText = p.spot_neighborhood || v?.neighborhood || 'Sentrum';
                const addr = v?.address || `${vName}, Oslo`;
                const rText = String(v?.google_rating ? v.google_rating.toFixed(1) : p.rating || '4.9');
                const note = resolveSmartTasteNote(
                  dName,
                  vName,
                  p.category || v?.food_category || '',
                  p.review_text || p.diner_quotes?.[0]?.text || ''
                );
                setDishName(dName);
                setPriceNok(pText);
                setVenueName(vName);
                setNeighborhood(nText);
                setAddress(addr);
                setRating(rText);
                setTasteNote(note);
                setCategory(p.category || v?.food_category || 'all');

                const words = dName.trim().split(/\s+/);
                onUpdateDishTitle({
                  dishTitle: dName,
                  line1Text: words[0] || dName,
                  line2Text: words.slice(1).join(' '),
                  priceText: pText,
                  venueText: vName,
                  neighborhoodText: nText,
                  ratingText: rText,
                  tasteNote: note,
                });
                onUpdateMap({
                  venueId: v?.id || null,
                  name: vName,
                  address: addr,
                  neighborhood: nText,
                  rating: Number(rText) || 4.8,
                  featuredDish: `${dName} · ${pText}`,
                });
              }
            } else if (val.startsWith('spot:')) {
              const spotId = val.slice(5);
              const s = allSpots.find((sp) => sp.id === spotId);
              if (s) {
                const rawDish = (s.featuredDish || s.name)
                  .replace(/^[^\wA-Za-zÀ-ÿ0-9]+/, '')
                  .split('·')[0]
                  .trim();
                const rawPrice =
                  s.featuredDish && s.featuredDish.includes('·')
                    ? s.featuredDish.split('·')[1].trim()
                    : priceNok;
                const smartNote = resolveSmartTasteNote(
                  rawDish || s.name,
                  s.name,
                  s.category || '',
                  ''
                );
                setDishName(rawDish || s.name);
                setPriceNok(rawPrice || '90 kr');
                setVenueName(s.name);
                setNeighborhood(s.neighborhood || 'Sentrum');
                setAddress(s.address || `${s.name}, Oslo`);
                setRating(String(s.rating || '4.9'));
                setTasteNote(smartNote);
                setCategory(s.category || 'all');

                const words = (rawDish || s.name).split(/\s+/);
                onUpdateMap({
                  venueId: s.id,
                  name: s.name,
                  address: s.address,
                  icon: s.icon,
                  rating: s.rating,
                  photo: s.photo,
                  neighborhood: s.neighborhood,
                  featuredDish: s.featuredDish || `${s.icon} ${rawDish} · ${rawPrice}`,
                  lat: s.lat,
                  lng: s.lng,
                });
                onUpdateDishTitle({
                  dishTitle: rawDish || s.name,
                  line1Text: words[0] || s.name,
                  line2Text: words.slice(1).join(' ') || 'Oslo',
                  priceText: rawPrice || '90 kr',
                  venueText: s.name,
                  neighborhoodText: s.neighborhood || 'Sentrum',
                  ratingText: String(s.rating || '4.9'),
                });
              }
            }
          }}
          defaultValue=""
          className="w-full h-9 px-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
        >
          <option value="">⚡ Auto-Fill from Oslo Spot or Curated Dish…</option>
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

        {/* ALWAYS-VISIBLE Dish Name, Price (NOK), and Spot Name */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
              Dish / Drink
            </label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => {
                setDishName(e.target.value);
                onUpdateDishTitle({ dishTitle: e.target.value });
              }}
              placeholder="Biscoff Matcha"
              className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-[10px] font-extrabold text-[#e84a27] uppercase mb-1">
              Price (Syncs All)
            </label>
            <input
              type="text"
              value={priceNok}
              onChange={(e) => {
                setPriceNok(e.target.value);
                onUpdateDishTitle({ priceText: e.target.value });
              }}
              placeholder="90 kr"
              className="w-full h-9 px-2.5 rounded-xl border-2 border-[#e84a27]/40 bg-[#FFF3ED]/50 text-xs font-extrabold text-[#231F1D]"
            />
          </div>
          <div className="col-span-4">
            <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
              Spot Name
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => {
                setVenueName(e.target.value);
                onUpdateMap({ name: e.target.value });
                onUpdateDishTitle({ venueText: e.target.value });
              }}
              placeholder="Ochaya - The Matcha"
              className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
            />
          </div>
        </div>

        {/* Quick Toggle Chips: Beta CTA Mode, Spaced Lines, Extra Flavor Sentence */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setBetaMode((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
              betaMode
                ? 'bg-[#e84a27] text-white border-[#e84a27]'
                : 'bg-[#FAF7F2] text-[#5C534E] border-[#E6DEC8]'
            }`}
          >
            {betaMode ? '✓ Type "beta test" CTA (Active)' : 'Public Link-in-Bio CTA'}
          </button>

          <button
            type="button"
            onClick={() => setIncludeTasteNote((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
              includeTasteNote
                ? 'bg-[#231F1D] text-white border-[#231F1D]'
                : 'bg-[#FAF7F2] text-[#5C534E] border-[#E6DEC8]'
            }`}
          >
            {includeTasteNote ? '✓ Flavor Note Included' : 'Clean Verdict Only (No Filler)'}
          </button>

          <button
            type="button"
            onClick={() => setSpacedCheatSheet((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
              spacedCheatSheet
                ? 'bg-[#231F1D] text-white border-[#231F1D]'
                : 'bg-[#FAF7F2] text-[#5C534E] border-[#E6DEC8]'
            }`}
          >
            {spacedCheatSheet ? '✓ Spaced Info Lines' : 'Compact Info Lines'}
          </button>
        </div>

        {showMoreAddressFields && (
          <div className="pt-2 border-t border-[#E6DEC8] space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    onUpdateMap({ neighborhood: e.target.value });
                    onUpdateDishTitle({ neighborhoodText: e.target.value });
                  }}
                  placeholder="Sentrum"
                  className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    onUpdateMap({ address: e.target.value });
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                  Rating ★
                </label>
                <input
                  type="text"
                  value={rating}
                  onChange={(e) => {
                    setRating(e.target.value);
                    onUpdateDishTitle({ ratingText: e.target.value });
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-bold text-[#231F1D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6E655F] uppercase mb-1">
                Optional Custom Flavor Note (Shown when &quot;Flavor Note Included&quot; is on)
              </label>
              <input
                type="text"
                value={tasteNote}
                onChange={(e) => {
                  setTasteNote(e.target.value);
                  setIncludeTasteNote(Boolean(e.target.value.trim()));
                  onUpdateDishTitle({ tasteNote: e.target.value });
                }}
                placeholder="e.g. Rich cookie butter swirl over ceremonial Uji matcha."
                className="w-full h-9 px-2.5 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs font-medium text-[#231F1D]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. 1-TAP ANGLE & LANGUAGE PILLS + AI VARIATION */}
      <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-3">
        <div>
          <span className="block text-[11px] font-extrabold text-[#5C534E] uppercase tracking-wider mb-1.5">
            2. Hook Angle (1-Tap)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(
              [
                { id: 'hype-drop', label: '🔥 Hype Drop' },
                { id: 'hidden-gem', label: '🤫 Hidden Gem' },
                { id: 'budget-steal', label: '💸 Best Value' },
                { id: 'debate-question', label: '💬 Comment Debate' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAngle(item.id)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                  angle === item.id
                    ? 'bg-[#231F1D] text-white border-[#231F1D] shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8] hover:border-[#e84a27]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pt-1 border-t border-[#E6DEC8]">
          <div className="flex-1">
            <span className="block text-[11px] font-extrabold text-[#5C534E] uppercase tracking-wider mb-1.5">
              3. Caption Language
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'en', label: '🇬🇧 English' },
                  { id: 'no', label: '🇳🇴 Norsk' },
                  { id: 'bilingual', label: '⚡ Oslo Mix' },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                    language === lang.id
                      ? 'bg-[#231F1D] text-white border-[#231F1D] shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#231F1D] border-[#E6DEC8] hover:border-[#e84a27]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleGenerateAiVariation}
              disabled={isGeneratingAi}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-[#e84a27] hover:bg-[#d13d1c] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-60"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Writing…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Generate AI Variation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCaptionText(deterministic.caption);
                setStoryTeaserText(deterministic.storyTeaser);
                setAltText(deterministic.altText);
              }}
              title="Reset to instant template"
              className="h-10 w-10 rounded-xl bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[#231F1D] flex items-center justify-center active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. EDITABLE CAPTION TEXTAREA & 1-TAP COPY */}
      <div className="p-3 bg-white rounded-2xl border border-[#E6DEC8] space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-extrabold text-[#231F1D] uppercase tracking-wider">
            4. Ready-to-Post Instagram Caption
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              firstLineLength <= 110
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            Hook: {firstLineLength}/110 chars {firstLineLength <= 110 ? '✓ No truncation' : '⚠ Long'}
          </span>
        </div>

        <textarea
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          rows={10}
          className="w-full p-3 rounded-xl border border-[#D8CFC0] bg-[#FAF7F2] text-xs leading-relaxed font-medium text-[#231F1D] focus:border-[#e84a27] focus:outline-none resize-y"
        />

        {/* Neighborhood SEO Hashtag Pills Preview (Every tag guaranteed to have #) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-[#6E655F] uppercase shrink-0 mr-1">
            Local SEO:
          </span>
          {deterministic.hashtags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E6DEC8] text-[10px] font-mono font-bold text-[#5C534E] whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* PRIMARY & SECONDARY 1-TAP COPY BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              handleCopy(
                captionText,
                'caption',
                'Caption copied! Ready to paste in Instagram 🚀'
              )
            }
            className="sm:col-span-3 py-3 px-4 rounded-xl bg-[#231F1D] hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
          >
            {copiedKey === 'caption' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Caption copied! Ready to paste in Instagram 🚀</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#e84a27]" />
                <span>📋 Copy Full Caption</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              handleCopy(storyTeaserText, 'story', 'Story hook copied to clipboard! 📲')
            }
            className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[#231F1D] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {copiedKey === 'story' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Story Hook Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6E655F]" />
                <span>📋 Copy Story Hook</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              handleCopy(
                deterministic.hashtags.join(' '),
                'tags',
                'All 10 #hashtags copied to clipboard! #'
              )
            }
            className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[#231F1D] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {copiedKey === 'tags' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>#Hashtags Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6E655F]" />
                <span># Copy Hashtags</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              handleCopy(altText, 'alt', 'SEO Alt-Text copied to clipboard! 🔍')
            }
            className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EFEAE1] border border-[#E6DEC8] text-[#231F1D] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {copiedKey === 'alt' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alt-Text Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6E655F]" />
                <span>📋 Copy SEO Alt-Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
