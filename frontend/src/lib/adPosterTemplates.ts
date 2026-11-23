export type PosterAspectId = "4:5" | "1:1" | "3:4" | "9:16";
export type PosterFontId = "pally" | "comico" | "jakarta";

export interface BasePosterLayer {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  locked?: boolean;
}

export interface ShapePosterLayer extends BasePosterLayer {
  type: "shape";
  height: number;
  fill: string;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface ImagePosterLayer extends BasePosterLayer {
  type: "image";
  src: string;
  dropShadow?: boolean;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  objectFit?: "contain" | "cover";
  objectPosition?: string;
  topFade?: boolean;
  bottomFade?: boolean;
  scrimColor?: string;
  mapScale?: number;
  mapOffsetX?: number;
  mapOffsetY?: number;
}

export interface MapPinPosterLayer extends BasePosterLayer {
  type: "map_pin";
  title: string;
  subtitle?: string;
  pinSrc?: string;
  pinSize?: number;
  logoSrc?: string;
  logoWidth?: number;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export interface InfoCardPosterLayer extends BasePosterLayer {
  type: "info_card";
  logoSrc: string;
  logoWidth: number;
  title: string;
  subtitle: string;
  tag?: string;
  price: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export interface TextPosterLayer extends BasePosterLayer {
  type: "text";
  text: string;
  font: PosterFontId;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  align: "left" | "center" | "right";
  uppercase?: boolean;
  accentText?: string;
  accentFont?: PosterFontId;
  accentFontSize?: number;
  accentColor?: string;
  trailingText?: string;
}

export interface BrandHeaderPosterLayer extends BasePosterLayer {
  type: "brand_header";
  text: string;
  fontSize: number;
  color: string;
  showDivider: boolean;
  dividerWidth: number;
  dividerHeight: number;
  dividerColor: string;
}

export interface SpotBlockPosterLayer extends BasePosterLayer {
  type: "spot_block";
  logoSrc: string;
  logoWidth: number;
  metaLines: string;
  price: string;
  align: "left" | "center" | "right";
  textColor: string;
  priceColor: string;
  metaFontSize?: number;
  priceFont?: PosterFontId;
  priceFontSize?: number;
  showLocationPin?: boolean;
}

export type PosterLayer =
  | ShapePosterLayer
  | ImagePosterLayer
  | TextPosterLayer
  | BrandHeaderPosterLayer
  | SpotBlockPosterLayer
  | MapPinPosterLayer
  | InfoCardPosterLayer;

export interface AdPosterTemplate {
  id: string;
  name: string;
  subtitle: string;
  fileSlug: string;
  defaultAspect: PosterAspectId;
  bgColor: string;
  layers: PosterLayer[];
}

export function getPosterCanvasSize(aspect: PosterAspectId): { width: number; height: number } {
  if (aspect === "1:1") return { width: 1080, height: 1080 };
  if (aspect === "3:4") return { width: 1080, height: 1440 };
  if (aspect === "9:16") return { width: 1080, height: 1920 };
  return { width: 1080, height: 1350 };
}

export const SMAKR_POSTER_SWATCHES = [
  { label: "Smakr Cream", hex: "#F7F2E8" },
  { label: "Warm Oat", hex: "#FAF7F2" },
  { label: "Paper White", hex: "#FFFCF6" },
  { label: "Burnt Paprika", hex: "#E84A27" },
  { label: "Espresso Roast", hex: "#241C16" },
  { label: "Charcoal", hex: "#181615" },
  { label: "Muted Clay", hex: "#3E352F" },
  { label: "Soft Peach", hex: "#F6D5C9" },
] as const;

export const AD_POSTER_TEMPLATES: AdPosterTemplate[] = [
  {
    id: "oslo-banh-mi-v1",
    name: "Oslo Bánh Mì — 3 Spots",
    subtitle: "Bánh Mì XO · Bánh Mì Cousins · Lai Zai",
    fileSlug: "smakr_oslo_banh_mi_poster",
    defaultAspect: "3:4",
    bgColor: "#FFFCF6",
    layers: [
      {
        id: "slide1-map-backdrop",
        label: "Oslo Map Backdrop",
        type: "image",
        x: 0,
        y: 26,
        width: 1080,
        height: 1440,
        rotation: 0,
        zIndex: 1,
        opacity: 0.34,
        visible: true,
        src: "/ad-slides/pure_oslo_map_4_5.png",
        objectFit: "cover",
        scrimColor: "rgba(247, 242, 232, 0.18)",
        topFade: false,
        bottomFade: false,
        mapScale: 1.55,
        mapOffsetX: -2,
        mapOffsetY: 8,
        dropShadow: false,
      },
      {
        id: "orange-center-box",
        label: "Orange Center Box",
        type: "shape",
        x: 220,
        y: 290,
        width: 640,
        height: 860,
        rotation: 0,
        zIndex: 3,
        opacity: 1,
        visible: true,
        fill: "#E84A27",
        borderRadius: 34,
      },
      {
        id: "hero-title",
        label: "BÁNH MÌ Headline",
        type: "text",
        x: 40,
        y: 442,
        width: 1000,
        rotation: 0,
        zIndex: 6,
        opacity: 1,
        visible: true,
        text: "BÁNH MÌ",
        font: "pally",
        fontSize: 254,
        fontWeight: 700,
        letterSpacing: -0.03,
        lineHeight: 0.9,
        color: "#241C16",
        align: "center",
      },
      {
        id: "cutout-xo",
        label: "Bánh Mì XO Cutout",
        type: "image",
        x: 342,
        y: 129,
        width: 475,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/xo-cutout.png",
        dropShadow: true,
      },
      {
        id: "cutout-laizai",
        label: "Lai Zai Cutout",
        type: "image",
        x: 387,
        y: 863,
        width: 510,
        rotation: 14,
        zIndex: 11,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/laizai-cutout.png",
        dropShadow: true,
      },
      {
        id: "cutout-cousins",
        label: "Bánh Mì Cousins Cutout",
        type: "image",
        x: 182,
        y: 604,
        width: 551,
        rotation: 15,
        zIndex: 12,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/cousins-cutout.png",
        dropShadow: true,
      },
      {
        id: "spot-xo",
        label: "XO Logo + Price",
        type: "spot_block",
        x: 858,
        y: 94,
        width: 204,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-xo.png",
        logoWidth: 142,
        metaLines: "ĐẶC BIỆT",
        price: "189 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "spot-cousins",
        label: "Cousins Logo + Price",
        type: "spot_block",
        x: 25,
        y: 794,
        width: 210,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-cousins.png",
        logoWidth: 176,
        metaLines: "CRISPY RIBBE",
        price: "189 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "spot-laizai",
        label: "Lai Zai Logo + Price",
        type: "spot_block",
        x: 766,
        y: 1135,
        width: 200,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-laizai.png",
        logoWidth: 112,
        metaLines: "HEO QUAY",
        price: "130 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "top-header",
        label: "SMAKR Top Logo",
        type: "brand_header",
        x: 256,
        y: 43,
        width: 519,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "SMAKR",
        fontSize: 73,
        color: "#E84A27",
        showDivider: true,
        dividerWidth: 126,
        dividerHeight: 4,
        dividerColor: "#E84A27",
      },
      {
        id: "footer-cta",
        label: "Footer CTA",
        type: "text",
        x: -136,
        y: 1284,
        width: 900,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "Who makes Oslo’s best bánh mì?\n",
        accentText: "Swipe for map & pins →",
        font: "pally",
        accentFont: "pally",
        fontSize: 34,
        accentFontSize: 30,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.32,
        color: "#241C16",
        accentColor: "#E84A27",
        align: "center",
      },
    ],
  },
  {
    id: "oslo-banh-mi-slide2-map",
    name: "Oslo Bánh Mì — Slide 2 (Map)",
    subtitle: "Full-Bleed Oslo Map · Preset 2/3 Fade · Exact Street Pins",
    fileSlug: "smakr_oslo_banh_mi_slide2_map",
    defaultAspect: "3:4",
    bgColor: "#F7F2E8",
    layers: [
      {
        id: "oslo-map-backdrop",
        label: "Full-Bleed Oslo Map",
        type: "image",
        x: 0,
        y: 0,
        width: 1080,
        height: 1440,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        visible: true,
        src: "/ad-slides/pure_oslo_map_4_5.png",
        objectFit: "cover",
        scrimColor: "rgba(247, 242, 232, 0.16)",
        topFade: true,
        bottomFade: true,
        mapScale: 1.8,
        mapOffsetX: -3,
        mapOffsetY: 14,
      },
      {
        id: "map-top-header",
        label: "SMAKR Top Logo",
        type: "brand_header",
        x: 256,
        y: 43,
        width: 519,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "SMAKR",
        fontSize: 73,
        color: "#E84A27",
        showDivider: true,
        dividerWidth: 126,
        dividerHeight: 4,
        dividerColor: "#E84A27",
      },
      {
        id: "map-headline",
        label: "Map Headline",
        type: "text",
        x: 90,
        y: 146,
        width: 900,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "All 3 spots pinned on Oslo’s map",
        font: "jakarta",
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.15,
        color: "#241C16",
        align: "center",
      },
      {
        id: "pin-laizai",
        label: "Pin: Lai Zai (Løkka)",
        type: "map_pin",
        x: 420,
        y: 274,
        width: 350,
        rotation: 0,
        zIndex: 16,
        opacity: 1,
        visible: true,
        title: "Lai Zai",
        subtitle: "Thorvald Meyers gt. 83A",
        logoSrc: "/ad-slides/banh-mi/logo-laizai.png",
        logoWidth: 54,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "pin-xo",
        label: "Pin: Bánh Mì XO",
        type: "map_pin",
        x: 448,
        y: 774,
        width: 270,
        rotation: 0,
        zIndex: 17,
        opacity: 1,
        visible: true,
        title: "Bánh Mì XO",
        subtitle: "Storgata 23",
        logoSrc: "/ad-slides/banh-mi/logo-xo.png",
        logoWidth: 62,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "pin-cousins",
        label: "Pin: Bánh Mì Cousins",
        type: "map_pin",
        x: 276,
        y: 924,
        width: 295,
        rotation: 0,
        zIndex: 18,
        opacity: 1,
        visible: true,
        title: "Bánh Mì Cousins",
        subtitle: "Storgata 25",
        logoSrc: "/ad-slides/banh-mi/logo-cousins.png",
        logoWidth: 68,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "map-footer-cta",
        label: "Footer CTA",
        type: "text",
        x: -136,
        y: 1284,
        width: 900,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "See what more Oslo has to offer at ",
        accentText: "smakr.no",
        font: "pally",
        accentFont: "pally",
        fontSize: 33,
        accentFontSize: 33,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.25,
        color: "#241C16",
        accentColor: "#E84A27",
        align: "center",
      },
    ],
  },
  {
    id: "oslo-banh-mi-tiktok-s1",
    name: "Bánh Mì — Slide 1 (TikTok 9:16)",
    subtitle: "Full-Screen 1080×1920 · Zero Black Bars · TikTok Safe",
    fileSlug: "smakr_oslo_banh_mi_tiktok_s1",
    defaultAspect: "9:16",
    bgColor: "#FFFCF6",
    layers: [
      {
        id: "tt-s1-map-backdrop",
        label: "Oslo Map Backdrop (9:16)",
        type: "image",
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        rotation: 0,
        zIndex: 1,
        opacity: 0.34,
        visible: true,
        src: "/ad-slides/pure_oslo_map_9_16.png",
        objectFit: "cover",
        scrimColor: "rgba(247, 242, 232, 0.16)",
        topFade: false,
        bottomFade: false,
        mapScale: 1.25,
        mapOffsetX: 0,
        mapOffsetY: 4,
        dropShadow: false,
      },
      {
        id: "tt-orange-center-box",
        label: "Orange Center Box",
        type: "shape",
        x: 205,
        y: 438,
        width: 640,
        height: 920,
        rotation: 0,
        zIndex: 3,
        opacity: 0.97,
        visible: true,
        fill: "#E84A27",
        borderRadius: 36,
      },
      {
        id: "tt-hero-title",
        label: "BÁNH MÌ Headline",
        type: "text",
        x: 25,
        y: 602,
        width: 1000,
        rotation: 0,
        zIndex: 6,
        opacity: 1,
        visible: true,
        text: "BÁNH MÌ",
        font: "pally",
        fontSize: 254,
        fontWeight: 700,
        letterSpacing: -0.03,
        lineHeight: 0.9,
        color: "#241C16",
        align: "center",
      },
      {
        id: "tt-cutout-xo",
        label: "Bánh Mì XO Cutout",
        type: "image",
        x: 318,
        y: 286,
        width: 527,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/xo-cutout.png",
        dropShadow: true,
      },
      {
        id: "tt-cutout-laizai",
        label: "Lai Zai Cutout",
        type: "image",
        x: 339,
        y: 1082,
        width: 531,
        rotation: 13,
        zIndex: 11,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/laizai-cutout.png",
        dropShadow: true,
      },
      {
        id: "tt-cutout-cousins",
        label: "Bánh Mì Cousins Cutout",
        type: "image",
        x: 123,
        y: 772,
        width: 590,
        rotation: 21,
        zIndex: 12,
        opacity: 1,
        visible: true,
        src: "/ad-slides/banh-mi/cousins-cutout.png",
        dropShadow: true,
      },
      {
        id: "tt-spot-xo",
        label: "XO Logo + Price",
        type: "spot_block",
        x: 822,
        y: 244,
        width: 204,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-xo.png",
        logoWidth: 142,
        metaLines: "ĐẶC BIỆT",
        price: "189 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "tt-spot-cousins",
        label: "Cousins Logo + Price",
        type: "spot_block",
        x: 20,
        y: 962,
        width: 205,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-cousins.png",
        logoWidth: 172,
        metaLines: "CRISPY RIBBE",
        price: "189 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "tt-spot-laizai",
        label: "Lai Zai Logo + Price",
        type: "spot_block",
        x: 749,
        y: 1321,
        width: 205,
        rotation: 0,
        zIndex: 20,
        opacity: 1,
        visible: true,
        logoSrc: "/ad-slides/banh-mi/logo-laizai.png",
        logoWidth: 118,
        metaLines: "HEO QUAY",
        price: "130 kr",
        align: "center",
        textColor: "#241C16",
        priceColor: "#E84A27",
        metaFontSize: 20,
        priceFont: "pally",
        priceFontSize: 38,
        showLocationPin: false,
      },
      {
        id: "tt-top-header",
        label: "SMAKR Top Logo",
        type: "brand_header",
        x: 267,
        y: 116,
        width: 520,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "SMAKR",
        fontSize: 76,
        color: "#E84A27",
        showDivider: true,
        dividerWidth: 136,
        dividerHeight: 4,
        dividerColor: "#E84A27",
      },
      {
        id: "tt-joke-hook",
        label: "Pun Hook Line",
        type: "text",
        x: 47,
        y: 1564,
        width: 810,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "It’s so good they have to ",
        accentText: "bánh mì",
        trailingText: "... get it",
        font: "pally",
        accentFont: "comico",
        fontSize: 40,
        accentFontSize: 44,
        fontWeight: 700,
        letterSpacing: -0.02,
        lineHeight: 1.15,
        color: "#241C16",
        accentColor: "#E84A27",
        align: "left",
      },
      {
        id: "tt-footer-cta",
        label: "Footer CTA",
        type: "text",
        x: 52,
        y: 1678,
        width: 700,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "Who makes Oslo’s best bánh mì?\n",
        accentText: "Swipe for map & pins →",
        font: "pally",
        accentFont: "pally",
        fontSize: 32,
        accentFontSize: 30,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.32,
        color: "#241C16",
        accentColor: "#E84A27",
        align: "left",
      },
    ],
  },
  {
    id: "oslo-banh-mi-tiktok-s2",
    name: "Bánh Mì — Slide 2 Map (TikTok 9:16)",
    subtitle: "Full-Screen 1080×1920 Oslo Map · Top/Bottom Fades",
    fileSlug: "smakr_oslo_banh_mi_tiktok_s2_map",
    defaultAspect: "9:16",
    bgColor: "#F7F2E8",
    layers: [
      {
        id: "tt-map-backdrop",
        label: "Full-Bleed Oslo Map (9:16)",
        type: "image",
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        visible: true,
        src: "/ad-slides/pure_oslo_map_9_16.png",
        objectFit: "cover",
        scrimColor: "rgba(247, 242, 232, 0.14)",
        topFade: true,
        bottomFade: true,
        mapScale: 1.65,
        mapOffsetX: -3,
        mapOffsetY: 12,
      },
      {
        id: "tt-map-header",
        label: "SMAKR Top Logo",
        type: "brand_header",
        x: 267,
        y: 116,
        width: 520,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "SMAKR",
        fontSize: 76,
        color: "#E84A27",
        showDivider: true,
        dividerWidth: 136,
        dividerHeight: 4,
        dividerColor: "#E84A27",
      },
      {
        id: "tt-map-headline",
        label: "Map Headline",
        type: "text",
        x: 90,
        y: 230,
        width: 900,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "All 3 spots pinned on Oslo’s map",
        font: "jakarta",
        fontSize: 31,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.15,
        color: "#241C16",
        align: "center",
      },
      {
        id: "tt-pin-laizai",
        label: "Pin: Lai Zai (Løkka)",
        type: "map_pin",
        x: 375,
        y: 472,
        width: 350,
        rotation: 0,
        zIndex: 16,
        opacity: 1,
        visible: true,
        title: "Lai Zai",
        subtitle: "Thorvald Meyers gt. 83A",
        logoSrc: "/ad-slides/banh-mi/logo-laizai.png",
        logoWidth: 54,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "tt-pin-xo",
        label: "Pin: Bánh Mì XO",
        type: "map_pin",
        x: 420,
        y: 992,
        width: 270,
        rotation: 0,
        zIndex: 17,
        opacity: 1,
        visible: true,
        title: "Bánh Mì XO",
        subtitle: "Storgata 23",
        logoSrc: "/ad-slides/banh-mi/logo-xo.png",
        logoWidth: 62,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "tt-pin-cousins",
        label: "Pin: Bánh Mì Cousins",
        type: "map_pin",
        x: 210,
        y: 1152,
        width: 295,
        rotation: 0,
        zIndex: 18,
        opacity: 1,
        visible: true,
        title: "Bánh Mì Cousins",
        subtitle: "Storgata 25",
        logoSrc: "/ad-slides/banh-mi/logo-cousins.png",
        logoWidth: 68,
        pinSrc: "/ad-slides/banh-mi/push-pin.png",
        pinSize: 52,
        bgColor: "#F7F2E8",
        textColor: "#241C16",
        accentColor: "#E84A27",
      },
      {
        id: "tt-map-footer",
        label: "Footer CTA",
        type: "text",
        x: 52,
        y: 1678,
        width: 700,
        rotation: 0,
        zIndex: 25,
        opacity: 1,
        visible: true,
        text: "See what more Oslo has to offer at ",
        accentText: "smakr.no",
        font: "pally",
        accentFont: "pally",
        fontSize: 32,
        accentFontSize: 32,
        fontWeight: 700,
        letterSpacing: -0.01,
        lineHeight: 1.32,
        color: "#241C16",
        accentColor: "#E84A27",
        align: "left",
      },
    ],
  },
];

export function cloneTemplateState(template: AdPosterTemplate): {
  aspect: PosterAspectId;
  bgColor: string;
  layers: PosterLayer[];
} {
  return {
    aspect: template.defaultAspect,
    bgColor: template.bgColor,
    layers: template.layers.map((layer) => ({ ...layer })),
  };
}
