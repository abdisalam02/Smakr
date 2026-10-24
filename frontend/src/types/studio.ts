export type FoundryMode = 'mascot' | 'venue-map' | 'dish-title' | 'wallpaper';

export type AspectRatio = '9:16' | '4:5' | '1:1';

export interface AspectRatioPreset {
  id: AspectRatio;
  ratio: string;
  label: string;
  sublabel: string;
  fullLabel: string;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: '4:5', ratio: '4:5', label: '4:5 · Instagram Post', sublabel: 'Portrait', fullLabel: '📸 4:5 · Instagram Post (Portrait)' },
  { id: '9:16', ratio: '9:16', label: '9:16 · Reel, Story & TikTok', sublabel: 'Vertical', fullLabel: '📱 9:16 · Reel, Story & TikTok (Vertical)' },
  { id: '1:1', ratio: '1:1', label: '1:1 · Square Post', sublabel: 'Feed', fullLabel: '⏹️ 1:1 · Square Post (Feed)' },
];
export type SlideId = 'wallpaper' | 'map' | 'photo';
export type MapStyleKey = 'streets' | 'dataviz' | 'aquarelle';
export type CardTheme = 'cream' | 'dark' | 'paprika';
export type ElementKind = 'text' | 'mascot' | 'badge' | 'image';
export type BubbleStyle = 'round' | 'shout' | 'thought' | 'box';
export type BubbleSide = 'top' | 'left' | 'right' | 'bottom';
export type ColorMode = 'oranges' | 'solid' | 'tint' | 'greyscale';
export type ExportFormat = 'png' | 'jpeg';
export type ExportQuality = '1080p' | '2160p';

export type MapExportTarget = 'full-scene' | 'card-only' | 'pin-only' | 'map-only';

export type MascotFrameMode =
  | 'bust-plus-bubble'
  | 'bust-only'
  | 'circle-avatar'
  | 'bubble-only'
  | 'custom-upload';

export interface MascotDnaConfig {
  head: string;
  face: string;
  accessories: string;
  facialHair: string;
  mask?: string;
  skinColor: string;
  clothingColor: string;
  innerClothingColor?: string;
  shoeColor?: string;
  hatColor?: string;
  propColor?: string;
  headContrastColor: string;
  stickerOutline: boolean;
  bodyPose?: string;
}

export const DEFAULT_MASCOT_CONFIG: MascotDnaConfig = {
  head: 'afro',
  face: 'smile-big',
  accessories: 'glasses-2',
  facialHair: 'none',
  mask: 'none',
  skinColor: 'd08b5b',
  clothingColor: 'e84a27',
  innerClothingColor: '27272a',
  shoeColor: 'ffffff',
  hatColor: 'e84a27',
  propColor: 'ffffff',
  headContrastColor: '181615',
  stickerOutline: true,
  bodyPose: 'jacket-2',
};

export const OPEN_PEEPS_BODY_POSES = [
  'classic-bust',
  'Coffee',
  'PointingUp',
  'Whatever',
  'Explaining',
  'ArmsCrossed',
  'Hoodie',
  'FurJacket',
  'Device',
  'PocketShirt',
  'StripedShirt',
  'SweaterDots',
  'Sweater',
  'BlazerBlackTee',
  'Turtleneck',
  'ButtonShirt',
  'PoloSweater',
  'ShirtCoat',
  'Thunder',
  'Selena',
  'SportyShirt',
  'Gaming',
  'Paper',
  'DotJacket',
  'Geek',
  'Shirt',
  'ShirtFilled',
  'Dress',
] as const;

export const BODY_POSE_LABELS: Record<string, string> = {
  'classic-bust': 'Classic Bust',
  Coffee: 'Coffee / Matcha',
  PointingUp: 'Pointing Up',
  Whatever: 'Shrug / Whatever',
  Explaining: 'Explaining',
  ArmsCrossed: 'Arms Crossed',
  Hoodie: 'Hoodie',
  FurJacket: 'Fur Parka',
  Device: 'Holding Phone',
  PocketShirt: 'Pocket Tee',
  StripedShirt: 'Striped Tee',
  SweaterDots: 'Polka Sweater',
  Sweater: 'Knitted Sweater',
  BlazerBlackTee: 'Blazer & Tee',
  Turtleneck: 'Turtleneck',
  ButtonShirt: 'Button Down',
  PoloSweater: 'Polo Sweater',
  ShirtCoat: 'Coat & Shirt',
  Thunder: 'Thunder Graphic',
  Selena: 'Selena Graphic',
  SportyShirt: 'Sporty Jersey',
  Gaming: 'Gaming Controller',
  Paper: 'Menu Notes',
  DotJacket: 'Dot Jacket',
  Geek: 'Suspenders',
  Shirt: 'Clean Tee',
  ShirtFilled: 'Solid Shirt',
  Dress: 'Dress',
};

export interface MascotPosePreset {
  id: string;
  label: string;
  poseId: string;
  description: string;
}

export const CANONICAL_MASCOT_POSES: MascotPosePreset[] = [
  { id: 'bust', label: 'Classic Bust', poseId: 'classic-bust', description: 'Original @niwache12 avatar bust' },
  { id: 'shrug', label: 'Shrug / Whatever', poseId: 'Whatever', description: 'Shrugging with open palms' },
  { id: 'holding-coffee', label: 'Coffee / Matcha', poseId: 'Coffee', description: 'Holding coffee or matcha cup' },
  { id: 'explaining', label: 'Explaining', poseId: 'Explaining', description: 'Gesture explaining Oslo spot' },
  { id: 'pointing-up', label: 'Pointing Up', poseId: 'PointingUp', description: 'Finger pointing upward' },
  { id: 'hands-on-hips', label: 'Hands on Hips', poseId: 'ArmsCrossed', description: 'Casual arms crossed/hands on hips' },
];

export const OPEN_PEEPS_FACES = [
  'smile',
  'smileBig',
  'eatingHappy',
  'lovingGrin1',
  'lovingGrin2',
  'awe',
  'cheeky',
  'cute',
  'smileLOL',
  'smileTeethGap',
  'calm',
  'driven',
  'explaining',
  'eyesClosed',
  'suspicious',
  'contempt',
  'hectic',
  'tired',
  'solemn',
  'fear',
  'angryWithFang',
  'blank',
  'concerned',
  'old',
] as const;

export const OPEN_PEEPS_HEADS = [
  'afro',
  'hatBeanie',
  'hatHip',
  'bun',
  'buns',
  'cornrows',
  'dreads1',
  'dreads2',
  'flatTop',
  'hijab',
  'turban',
  'medium1',
  'medium2',
  'short1',
  'short2',
  'twists',
] as const;

export const OPEN_PEEPS_ACCESSORIES = [
  'glasses',
  'glasses2',
  'glasses3',
  'glasses4',
  'glasses5',
  'sunglasses',
  'sunglasses2',
  'none',
] as const;

export const OPEN_PEEPS_FACIAL_HAIR = [
  'none',
  'chin',
  'full',
  'full2',
  'goatee1',
  'goatee2',
  'moustache1',
  'moustache2',
  'moustache4',
] as const;

export interface MascotState extends MascotDnaConfig {
  frameMode: MascotFrameMode;
  bubbleText: string;
  bubbleEyebrow?: string;
  bubbleStyle: BubbleStyle;
  circleBg: string;
  customMascotDataUrl: string | null;
  presetId?: string;
  bubbleOffsetX?: number;
  bubbleOffsetY?: number;
  bubbleSide?: BubbleSide;
  bubbleScale?: number;
}

export type DishTitleTemplate = 'stacked' | 'pills';
export type PillStickerType = 'price' | 'drop' | 'rating' | 'status';
export type DishFontFamily = 'comico' | 'sans' | 'serif' | 'mono';
export type IgCaptionAngle = 'hype-drop' | 'hidden-gem' | 'budget-steal' | 'debate-question';
export type IgCaptionLanguage = 'en' | 'no' | 'bilingual';
export type UiKitExportTarget =
  | 'full-cover'
  | 'glass-verdict-card'
  | 'paprika-price-pill'
  | 'brand-logo-pill'
  | 'location-rating-pill'
  | 'comico-title-only';

export const STUDIO_STICKER_SWATCHES: { label: string; hex: string }[] = [
  { label: 'Burnt Paprika', hex: '#E84A27' },
  { label: 'Espresso Ink', hex: '#181615' },
  { label: 'Warm Porcelain', hex: '#FAF7F2' },
  { label: 'Pure White', hex: '#FFFFFF' },
  { label: 'Warm Cinnamon', hex: '#8B3A0E' },
  { label: 'Matcha Green', hex: '#53A626' },
  { label: 'Deep Forest', hex: '#2D5A27' },
  { label: 'Golden Amber', hex: '#F59E0B' },
  { label: 'Berry Wine', hex: '#9F1239' },
  { label: 'Classic Cobalt', hex: '#1E40AF' },
  { label: 'Warm Stone', hex: '#E6DEC8' },
  { label: 'Charcoal', hex: '#27272A' },
];

export interface DishTitleState {
  template: DishTitleTemplate;
  uiKitExportTarget?: UiKitExportTarget;
  dishTitle?: string;
  line1Text: string;
  line1Color: string;
  line1Font?: DishFontFamily;
  showUnderline: boolean;
  line2Text: string;
  line2Color: string;
  line2Font?: DishFontFamily;
  titleScale?: number;
  uppercaseLine2?: boolean;
  stickerOutline: boolean;
  pillType: PillStickerType;
  priceText: string;
  priceBgColor?: string;
  priceTextColor?: string;
  priceTilt?: number;
  dropText: string;
  ratingText: string;
  statusText: string;
  venueText?: string;
  neighborhoodText?: string;
  locationIcon?: string;
  locationBgColor?: string;
  locationTextColor?: string;
  tasteNote?: string;
  cardBgColor?: string;
  cardTextColor?: string;
  cardAccentColor?: string;
  logoLeftText?: string;
  logoRightText?: string;
  logoBgColor?: string;
  logoTextColor?: string;
  logoAccentColor?: string;
  backgroundPhoto?: string | null;
  logoTheme?: 'porcelain' | 'dark' | 'text-only';
  locationTheme?: 'porcelain' | 'dark';
  showPriceOnCard?: boolean;
  showMascotOnCover?: boolean;
}

export const DEFAULT_DISH_TITLE_STATE: DishTitleState = {
  template: 'stacked',
  uiKitExportTarget: 'comico-title-only',
  dishTitle: 'Biscoff Matcha',
  line1Text: 'Biscoff',
  line1Color: '#8B3A0E',
  line1Font: 'comico',
  showUnderline: true,
  line2Text: 'Matcha',
  line2Color: '#53A626',
  line2Font: 'sans',
  titleScale: 1,
  uppercaseLine2: true,
  stickerOutline: true,
  pillType: 'price',
  priceText: '79 kr',
  priceBgColor: '#E84A27',
  priceTextColor: '#FFFFFF',
  priceTilt: -2,
  dropText: '✦ Smakr Pick · Em Oi!',
  ratingText: '4.9',
  statusText: '🟢 Open now',
  venueText: 'Godt Brød',
  neighborhoodText: 'Grünerløkka',
  locationIcon: '📍',
  locationBgColor: '#181615',
  locationTextColor: '#FFFFFF',
  tasteNote: 'Creamy ceremonial matcha layered over spiced biscoff cream.',
  cardBgColor: '#181615',
  cardTextColor: '#FFFFFF',
  cardAccentColor: '#E84A27',
  logoLeftText: 'SMAKR',
  logoRightText: 'OSLO',
  logoBgColor: '#FAF7F2',
  logoTextColor: '#181615',
  logoAccentColor: '#E84A27',
  backgroundPhoto:
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1080&q=85',
  logoTheme: 'porcelain',
  locationTheme: 'dark',
  showPriceOnCard: true,
  showMascotOnCover: true,
};

export type MascotBodyPose =
  | 'bust'           // Classic shoulder bust
  | 'sticker-badge'  // Rounded torso base (no flat bottom cut)
  | 'card-peeker'    // Gripping hands peeking over edge
  | 'standing'       // Full-body standing with legs & sneakers
  | 'sitting';       // Full-body sitting with dangling legs

export type MascotProp =
  | 'none'
  | 'matcha'         // Iced Biscoff/Matcha cup
  | 'dumpling'       // Bamboo steamer / dumpling + chopsticks
  | 'croissant'      // Flaky pastry / krembolle
  | 'ramen'          // Steaming ramen bowl
  | 'pizza'          // Slice of pizza
  | 'point-up'       // Cartoon hand pointing up/right
  | 'thumbs-up'      // Cartoon hand thumbs up
  | 'chefs-kiss';    // Cartoon hand + sparkle

export type MascotEyewear = 'round-glasses' | 'sunglasses' | 'none';

export type MascotFx = 'none' | 'sparkles' | 'spicy-sweat' | 'hearts' | 'steam';

export interface SavedMascotPreset {
  id: string;
  name: string;
  emoji: string;
  expression: string;
  bodyPose: MascotBodyPose;
  prop: MascotProp;
  eyewear: MascotEyewear;
  shirtColor: string;
  fx: MascotFx;
  stickerOutline: boolean;
  bubbleStyle: 'round' | 'shout' | 'thought' | 'box' | 'none';
  bubbleText: string;
}

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
  /** Modular Mascot Rig properties */
  mascotBodyPose?: MascotBodyPose;
  mascotProp?: MascotProp;
  mascotEyewear?: MascotEyewear;
  mascotShirtColor?: string;
  mascotFx?: MascotFx;
  mascotStickerOutline?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  /** Percentage coordinates (0-100) for responsive mascot positioning */
  mascotX?: number;
  mascotY?: number;
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

export type DockTab =
  | 'canvas'
  | 'pattern'
  | 'colors'
  | 'spot'
  | 'mapView'
  | 'photo'
  | 'adjust'
  | 'mascot'
  | 'stickers';

export interface PhotoState {
  src: string | null;
  fit: 'cover' | 'contain';
  zoom: number;
  panX: number;
  panY: number;
  dim: number;
  grayscale: boolean;
  blur: number;
  vignette: boolean;
  bgColor: string;
}

export interface StudioVenueItem {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  dish?: string;
  price?: string;
  photo?: string;
  rating?: number | null;
  icon?: string;
  lat: number;
  lng: number;
  x?: number; // canvas X offset or px
  y?: number; // canvas Y offset or px
  scale?: number;
}

export type RoundupBannerBg = 'dark' | 'oat' | 'paprika' | 'glass';

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
  /** Multi-venue round-up support (2 to 4 spots on single canvas) */
  venues?: StudioVenueItem[];
  activeVenueIndex?: number;
  layoutMode?: 'single' | 'multi_compact' | 'multi_full';
  multiPlacementMode?: 'auto_stack' | 'bento' | 'free_drag';
  autoFitCamera?: boolean;
  roundupTitle?: string;
  showRoundupBanner?: boolean;
  showRoundupDot?: boolean;
  roundupBannerBg?: RoundupBannerBg;
  /** Vertical pin position as a fraction of canvas height (0.1 to 0.9). */
  pinY: number;
  showPin: boolean;
  pinScale: number;
  /** Card position: 'below' (anchored to pin), 'above' (anchored to pin), or 'custom' (using cardY). */
  cardPosition: 'below' | 'above' | 'custom';
  cardY: number; // 0.1 to 0.9
  cardTheme: CardTheme;
  /** Geometric uniform scale applied via transform: scale() */
  cardScale: number; // 0.65 to 1.45
  cardOffsetY?: number; // -200 to 200 (vertical gap relative to pin)
  cardWidth: number; // baseline width in canvas px (e.g. 880)
  cardRadius: number;
  showPhoto: boolean;
  showRating: boolean;
  showAddress: boolean;
  showButtons: boolean;
  showWebButtons?: boolean;
  showCardInfo?: boolean;
  mapLabel: string;
  detailsLabel: string;
  neighborhood?: string;
  featuredDish?: string;
  ctaText?: string;
  exportTarget?: MapExportTarget;
}

export interface StudioState {
  mode?: FoundryMode;
  aspectRatio: AspectRatio;
  showSafeZones: boolean;
  showNoiseTexture: boolean;
  transparentBg?: boolean;
  wallpaper: WallpaperState;
  map: MapShotState;
  photo: PhotoState;
  elements: Record<SlideId, StudioElement[]>;
  mascot?: MascotState;
  dishTitle?: DishTitleState;
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

export interface SimpleColorSwatch {
  label: string;
  hex: string;
}

export const SKIN_TONE_SWATCHES: SimpleColorSwatch[] = [
  { label: 'Golden Bronze (Smakr Default)', hex: '#D08B5B' },
  { label: 'Nordic Fair', hex: '#FFDBB4' },
  { label: 'Warm Ivory', hex: '#F7E4D5' },
  { label: 'Peach Honey', hex: '#EDB98A' },
  { label: 'Warm Caramel', hex: '#AE5D29' },
  { label: 'Chestnut', hex: '#8B4513' },
  { label: 'Rich Espresso', hex: '#694D3D' },
  { label: 'Deep Cocoa', hex: '#3B2219' },
];

export const CLOTHING_SWATCHES: SimpleColorSwatch[] = [
  { label: 'Burnt Paprika (Smakr Default)', hex: '#e84a27' },
  { label: 'Charcoal Denim (Safe Dark)', hex: '#27272A' },
  { label: 'Forest Matcha', hex: '#2D372E' },
  { label: 'Warm Cinnamon', hex: '#8B3A0E' },
  { label: 'Golden Amber', hex: '#F59E0B' },
  { label: 'Bordeaux Wine', hex: '#9F1239' },
  { label: 'Sage Linen', hex: '#4A6741' },
  { label: 'Classic Cobalt', hex: '#1E40AF' },
  { label: 'Pistachio Foam', hex: '#86EFAC' },
  { label: 'Warm Cream', hex: '#F3EDE2' },
];

export const HAIR_COLOR_SWATCHES: SimpleColorSwatch[] = [
  { label: 'Late Night Black (Default)', hex: '#181615' },
  { label: 'Dark Chocolate', hex: '#2C1B18' },
  { label: 'Espresso Brown', hex: '#4A312C' },
  { label: 'Warm Chestnut', hex: '#724133' },
  { label: 'Nordic Auburn', hex: '#C93305' },
  { label: 'Honey Blonde', hex: '#D6B370' },
  { label: 'Platinum Silver', hex: '#E8E1E1' },
];

export const SHOE_SWATCHES: SimpleColorSwatch[] = [
  { label: 'Late Night Black (Default)', hex: '#181615' },
  { label: 'Crisp White', hex: '#FAF7F2' },
  { label: 'Timber Tan', hex: '#D97706' },
  { label: 'Nordic Navy', hex: '#1E293B' },
  { label: 'Burnt Paprika', hex: '#e84a27' },
  { label: 'Sage Olive', hex: '#4D7C0F' },
];

export interface MascotExpressionOption {
  id: string;
  label: string;
  emoji: string;
  hint: string;
}

export const MASCOT_EXPRESSIONS: MascotExpressionOption[] = [
  { id: 'smile', label: 'Warm Smile', emoji: '🙂', hint: 'Friendly' },
  { id: 'smileBig', label: 'Big Grin', emoji: '😄', hint: 'Beaming joy' },
  { id: 'eatingHappy', label: 'Chewing/Yum', emoji: '😋', hint: 'Puffed cheeks' },
  { id: 'lovingGrin1', label: 'Heart Eyes', emoji: '😍', hint: 'Food love' },
  { id: 'awe', label: 'Mind Blown', emoji: '😮', hint: 'Wowed reaction' },
  { id: 'cheeky', label: 'Tongue Out', emoji: '😏', hint: 'Playful critic' },
  { id: 'cute', label: 'Sweet', emoji: '🥰', hint: 'Loving the vibe' },
  { id: 'smileLOL', label: 'Laughing', emoji: '😆', hint: 'LOL joy' },
  { id: 'driven', label: 'Focused', emoji: '🧐', hint: 'Deep inspection' },
  { id: 'suspicious', label: 'Side-Eye', emoji: '🤨', hint: 'Skeptical' },
  { id: 'hectic', label: 'Spicy Sweat', emoji: '🥵', hint: 'Fire food' },
  { id: 'eyesClosed', label: 'Savoring', emoji: '😌', hint: 'Pure taste' },
  { id: 'tired', label: 'Late Night', emoji: '🥱', hint: 'Midnight munchies' },
  { id: 'explaining', label: 'Talking', emoji: '🗣️', hint: 'Foodie monologue' },
];

export const BUILTIN_MASCOT_PRESETS: SavedMascotPreset[] = [
  {
    id: 'preset-matcha',
    name: 'Matcha Critic',
    emoji: '🍵',
    expression: 'eatingHappy',
    bodyPose: 'sticker-badge',
    prop: 'matcha',
    eyewear: 'round-glasses',
    shirtColor: '#2D5A27',
    fx: 'sparkles',
    stickerOutline: true,
    bubbleStyle: 'round',
    bubbleText: 'For the biscoff lovers',
  },
  {
    id: 'preset-drop-hype',
    name: 'Drop Hype',
    emoji: '🔥',
    expression: 'smileBig',
    bodyPose: 'standing',
    prop: 'point-up',
    eyewear: 'sunglasses',
    shirtColor: '#e84a27',
    fx: 'none',
    stickerOutline: true,
    bubbleStyle: 'shout',
    bubbleText: "Today's drop ✦",
  },
  {
    id: 'preset-dumpling',
    name: 'Dumpling Stan',
    emoji: '🥟',
    expression: 'lovingGrin1',
    bodyPose: 'sticker-badge',
    prop: 'dumpling',
    eyewear: 'none',
    shirtColor: '#e84a27',
    fx: 'hearts',
    stickerOutline: true,
    bubbleStyle: 'round',
    bubbleText: '10/10 Dumplings',
  },
  {
    id: 'preset-peeker',
    name: 'Card Peeker',
    emoji: '🥐',
    expression: 'awe',
    bodyPose: 'card-peeker',
    prop: 'croissant',
    eyewear: 'round-glasses',
    shirtColor: '#181615',
    fx: 'sparkles',
    stickerOutline: true,
    bubbleStyle: 'box',
    bubbleText: 'Look at that glaze',
  },
  {
    id: 'preset-spicy',
    name: 'Spicy Burn',
    emoji: '🌶️',
    expression: 'hectic',
    bodyPose: 'sticker-badge',
    prop: 'ramen',
    eyewear: 'none',
    shirtColor: '#9A3412',
    fx: 'spicy-sweat',
    stickerOutline: true,
    bubbleStyle: 'thought',
    bubbleText: 'Worth the burn!',
  },
  {
    id: 'preset-chilling',
    name: 'Chilling',
    emoji: '🪑',
    expression: 'cute',
    bodyPose: 'sitting',
    prop: 'thumbs-up',
    eyewear: 'round-glasses',
    shirtColor: '#e84a27',
    fx: 'none',
    stickerOutline: true,
    bubbleStyle: 'round',
    bubbleText: 'Certified Oslo gem',
  },
];

