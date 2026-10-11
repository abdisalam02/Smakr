export type AspectRatio = '9:16' | '4:5' | '1:1';
export type SlideId = 'wallpaper' | 'map' | 'photo';
export type MapStyleKey = 'streets' | 'dataviz' | 'aquarelle';
export type CardTheme = 'cream' | 'dark' | 'paprika';
export type ElementKind = 'text' | 'mascot' | 'badge' | 'image';
export type BubbleStyle = 'round' | 'shout' | 'thought' | 'box';
export type BubbleSide = 'top' | 'left' | 'right' | 'bottom';
export type ColorMode = 'oranges' | 'solid' | 'tint' | 'greyscale';
export type ExportFormat = 'png' | 'jpeg';
export type ExportQuality = '1080p' | '2160p';

export interface StudioElement {
  id: string;
  kind: ElementKind;
  /** Canvas-pixel centre of the element. */
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  text: string;
  color: string;
  font: 'comico' | 'jakarta';
  /** Text pill background; empty string means none. */
  bgColor: string;
  strokeWidth: number;
  strokeColor: string;
  shadow: boolean;
  /** Mascot speech bubble; empty hides it. */
  bubble: string;
  bubbleStyle: BubbleStyle;
  bubbleSide: BubbleSide;
  bubbleBg: string;
  bubbleInk: string;
  flip: boolean;
  /** Mascot facial expression mood */
  expression?: string;
  /** Data URL of an image the creator owns (image kind only). */
  src: string | null;
}

export interface WallpaperState {
  text: string;
  rows: number;
  cols: number;
  /** Multiplier on the auto-fitted font size. */
  size: number;
  colorMode: ColorMode;
  baseColor: string;
  /** 0 = every logo the same shade, 1 = full spread. */
  variation: number;
  seed: number;
  heroColor: string;
  /** Row index highlighted in heroColor, -1 for none. */
  heroRow: number;
  bgColor: string;
  bgColor2: string;
  bgGradient: boolean;
  stagger: boolean;
  outline: boolean;
  glass: boolean;
  shadow: boolean;
  tilt: number;
  opacity: number;
  blur: number;
}

export interface PhotoState {
  src: string | null;
  fit: 'cover' | 'contain';
  zoom: number;
  dim: number;
  grayscale: boolean;
  blur: number;
  vignette: boolean;
  bgColor: string;
}

export interface MapShotState {
  venueId: string | null;
  name: string;
  address: string;
  icon: string;
  rating: number | null;
  photo: string | null;
  lng: number;
  lat: number;
  style: MapStyleKey;
  zoom: number;
  pitch: number;
  /** Vertical pin position as a fraction of canvas height (0.1 to 0.9). */
  pinY: number;
  showPin: boolean;
  pinScale: number;
  /** Card position: 'below' (anchored to pin), 'above' (anchored to pin), or 'custom' (using cardY). */
  cardPosition: 'below' | 'above' | 'custom';
  cardY: number; // 0.1 to 0.9
  cardTheme: CardTheme;
  /** Geometric uniform scale applied via transform: scale() */
  cardScale: number; // 0.6 to 1.4
  cardWidth: number; // baseline width in canvas px (e.g. 880)
  cardRadius: number;
  showPhoto: boolean;
  showRating: boolean;
  showAddress: boolean;
  showButtons: boolean;
  mapLabel: string;
  detailsLabel: string;
}

export interface StudioState {
  aspectRatio: AspectRatio;
  showSafeZones: boolean;
  showNoiseTexture: boolean;
  wallpaper: WallpaperState;
  map: MapShotState;
  photo: PhotoState;
  elements: Record<SlideId, StudioElement[]>;
}

export const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  '9:16': { w: 1080, h: 1920 },
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
};

export const PALETTES: {
  label: string;
  bgColor: string;
  baseColor: string;
  heroColor: string;
  colorMode: ColorMode;
}[] = [
  { label: 'Orange on oat', bgColor: '#FAF7F2', baseColor: '#e84a27', heroColor: '#ffffff', colorMode: 'oranges' },
  { label: 'Late night', bgColor: '#181615', baseColor: '#f59e0b', heroColor: '#e84a27', colorMode: 'tint' },
  { label: 'Matcha', bgColor: '#2d372e', baseColor: '#86efac', heroColor: '#ffffff', colorMode: 'tint' },
  { label: 'Paprika', bgColor: '#e84a27', baseColor: '#ffffff', heroColor: '#2B1810', colorMode: 'tint' },
  { label: 'Greyscale', bgColor: '#f4f4f5', baseColor: '#71717a', heroColor: '#e84a27', colorMode: 'greyscale' },
];

export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'ThoacZP1opK329U6AvTz';

export const MAP_STYLE_URLS: Record<MapStyleKey, string> = {
  streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  dataviz: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`,
  aquarelle: `https://api.maptiler.com/maps/aquarelle-v4/style.json?key=${MAPTILER_KEY}`,
};

export type CaptureSize = '1:1' | '4:5' | '4:3' | '16:9';
export const CAPTURE_SIZES: Record<CaptureSize, { label: string; w: number; h: number }> = {
  '1:1': { label: 'Square 1:1', w: 1080, h: 1080 },
  '4:5': { label: 'Portrait 4:5', w: 1080, h: 1350 },
  '4:3': { label: 'Standard 4:3', w: 1200, h: 900 },
  '16:9': { label: 'Landscape 16:9', w: 1920, h: 1080 },
};

export interface ColorSwatch {
  label: string;
  hex: string;
  category: 'oat' | 'paprika' | 'amber' | 'dark' | 'green' | 'berry';
}

export const CURATED_SWATCHES: ColorSwatch[] = [
  // Creams & Oats (Backgrounds & Soft Cards)
  { label: 'Warm Oat', hex: '#FAF7F2', category: 'oat' },
  { label: 'Porcelain', hex: '#F4EFEA', category: 'oat' },
  { label: 'Alabaster', hex: '#FFFDF9', category: 'oat' },
  { label: 'Nordic Linen', hex: '#EFE8DF', category: 'oat' },
  { label: 'Vanilla Cream', hex: '#FDF6EC', category: 'oat' },
  { label: 'Oat Milk', hex: '#F5ECE1', category: 'oat' },

  // Paprika & Citrus (Brand Heroes & Accents)
  { label: 'Burnt Paprika', hex: '#e84a27', category: 'paprika' },
  { label: 'Seville Orange', hex: '#ff5416', category: 'paprika' },
  { label: 'Flame Orange', hex: '#ea580c', category: 'paprika' },
  { label: 'Maple Tangerine', hex: '#f97316', category: 'paprika' },
  { label: 'Russet Paprika', hex: '#c2410c', category: 'paprika' },
  { label: 'Spiced Chili', hex: '#dc2626', category: 'paprika' },

  // Ambers & Baked Crusts (Warm Accents)
  { label: 'Golden Amber', hex: '#f59e0b', category: 'amber' },
  { label: 'Birch Ochre', hex: '#d97706', category: 'amber' },
  { label: 'Caramel Crust', hex: '#b45309', category: 'amber' },
  { label: 'Honey Glaze', hex: '#fbbf24', category: 'amber' },
  { label: 'Warm Cinnamon', hex: '#92400e', category: 'amber' },
  { label: 'Espresso Amber', hex: '#78350f', category: 'amber' },

  // Dark Roast & Late Night Oslo (High Contrast & Inks)
  { label: 'Late Night Oslo', hex: '#181615', category: 'dark' },
  { label: 'Espresso Ink', hex: '#2B1810', category: 'dark' },
  { label: 'Dark Roast', hex: '#1F1B18', category: 'dark' },
  { label: 'Obsidian Black', hex: '#11100f', category: 'dark' },
  { label: 'Charcoal Slate', hex: '#27272a', category: 'dark' },
  { label: 'Graphite Stone', hex: '#3f3f46', category: 'dark' },

  // Matcha & Herbs (Natural Foodie Greens)
  { label: 'Nordic Matcha', hex: '#2d372e', category: 'green' },
  { label: 'Forest Pine', hex: '#1b2d1d', category: 'green' },
  { label: 'Sage Herb', hex: '#4a6741', category: 'green' },
  { label: 'Matcha Foam', hex: '#86efac', category: 'green' },
  { label: 'Fresh Basil', hex: '#4ade80', category: 'green' },
  { label: 'Pistachio', hex: '#bbf7d0', category: 'green' },

  // Nordic Berry & Wine
  { label: 'Lingonberry', hex: '#831843', category: 'berry' },
  { label: 'Bordeaux Wine', hex: '#9f1239', category: 'berry' },
  { label: 'Wild Blackberry', hex: '#4c0519', category: 'berry' },
  { label: 'Cherry Glaze', hex: '#e11d48', category: 'berry' },
  { label: 'Pale Plum', hex: '#fbcfe8', category: 'berry' },
];

export interface MascotExpressionOption {
  id: string;
  label: string;
  emoji: string;
  hint: string;
}

export const MASCOT_EXPRESSIONS: MascotExpressionOption[] = [
  { id: 'smile', label: 'Warm Smile', emoji: '🙂', hint: 'Friendly' },
  { id: 'smileBig', label: 'Big Smile', emoji: '😄', hint: 'Beaming joy' },
  { id: 'eatingHappy', label: 'Tasting / Yum', emoji: '😋', hint: 'Delicious bite' },
  { id: 'cheeky', label: 'Cheeky Critic', emoji: '😏', hint: 'Playful food critic' },
  { id: 'awe', label: 'Wowed / Awe', emoji: '😮', hint: 'Mind-blown dish' },
  { id: 'calm', label: 'Calm & Content', emoji: '😌', hint: 'Satisfied diner' },
  { id: 'cute', label: 'Cute & Sweet', emoji: '🥰', hint: 'Loving the vibe' },
];

