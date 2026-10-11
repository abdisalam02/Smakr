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
