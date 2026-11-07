/**
 * Smakr Single-Source Icon Registry
 *
 * All icons in Smakr are mapped here:
 * - 9 Spot Kinds (duotone 24x24 vector architecture)
 * - 5 Dietary Badges (duotone 24x24 vector badges)
 * - 12 Regional Cuisines (flag-free 24x24 duotone vector glyphs)
 * - Dishes (8 high-craft remixed WebPs + crisp 24x24 duotone fallbacks for dishes without custom rasters)
 * - UI & Category Hero Icons
 */

export interface IconEntry {
  id: string;
  kind: "spotKind" | "dish" | "group" | "diet" | "cuisine" | "ui";
  label: string;
  svg?: string;
  webp?: string;
  parent?: string;
  aliases?: string[];
}

export const ICON_REGISTRY: Record<string, IconEntry> = {
  // ── Spot Kinds (Axis 1: Architectural & Venue Types) ──
  restaurant: {
    id: "restaurant",
    kind: "spotKind",
    label: "Restaurant",
    svg: `<path d="M4 19.5H20" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><path d="M6 19.5V8.5C6 5.5 8.5 3.5 12 3.5C15.5 3.5 18 5.5 18 8.5V19.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M9 19.5V12C9 10.3 10.3 9 12 9C13.7 9 15 10.3 15 12V19.5" fill="#E84A27" stroke="#181615" stroke-width="1.4"/><circle cx="12" cy="6.2" r="1.3" fill="#E84A27"/>`,
    aliases: ["sit_down", "sitdown", "standard", "eatery"],
  },
  cafe: {
    id: "cafe",
    kind: "spotKind",
    label: "Coffee Bar",
    svg: `<path d="M4 9h12.5v5.5c0 2.8-2.2 5-5 5H9c-2.8 0-5-2.2-5-5V9z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M16.5 10.5H19c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5h-2.5" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><path d="M3 20h15" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><path d="M7 5.5c0-1.2.8-1.8.8-3M10.5 5.5c0-1.2.8-1.8.8-3M14 5.5c0-1.2.8-1.8.8-3" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,
    aliases: ["kaffe", "kaffebar", "espresso_bar"],
  },
  bakery: {
    id: "bakery",
    kind: "spotKind",
    label: "Bakery",
    webp: "/icons/food/bakery.webp",
    svg: `<path d="M3 10.5L4.5 4.5H19.5L21 10.5V11.5C21 12.6 20.1 13.5 19 13.5C17.9 13.5 17 12.6 17 11.5C17 12.6 16.1 13.5 15 13.5C13.9 13.5 13 12.6 13 11.5C13 12.6 12.1 13.5 11 13.5C9.9 13.5 9 12.6 9 11.5C9 12.6 8.1 13.5 7 13.5C5.9 13.5 5 12.6 5 11.5C5 12.6 4.1 13.5 3 13.5V10.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 13.5V19.5C4 20.1 4.4 20.5 5 20.5H19C19.6 20.5 20 20.1 20 19.5V13.5" stroke="#181615" stroke-width="1.6"/><path d="M8.5 20.5V14.5H15.5V20.5" stroke="#E84A27" stroke-width="1.5" fill="#FAF7F2"/><path d="M12 7.5c1.5 0 2.5.8 2.5 1.8H9.5c0-1 1-1.8 2.5-1.8z" fill="#E84A27"/>`,
    aliases: ["bakeri", "boulangerie", "pastry_shop"],
  },
  bar: {
    id: "bar",
    kind: "spotKind",
    label: "Bar & Wine",
    svg: `<path d="M5 5h14l-5.5 6.5V18h4v2H6.5v-2h4v-6.5L5 5z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.2 7.5h9.6l-1.8 2.2H9l-1.8-2.2z" fill="#E84A27"/><circle cx="17.5" cy="5.5" r="1.5" fill="#4E8752"/>`,
    aliases: ["wine_bar", "cocktail_bar", "pub"],
  },
  food_truck: {
    id: "food_truck",
    kind: "spotKind",
    label: "Food Truck",
    svg: `<path d="M2.5 7C2.5 5.9 3.4 5 4.5 5H15.5V15.5H2.5V7Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M15.5 8H19L21.5 12V15.5H15.5V8Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 8H12V12H5V8Z" fill="#E84A27" stroke="#181615" stroke-width="1.4"/><circle cx="6.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><circle cx="6.5" cy="18" r="0.8" fill="#E84A27"/><circle cx="17.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><circle cx="17.5" cy="18" r="0.8" fill="#E84A27"/><path d="M9 16H15M2.5 16H4.2M20 16H21.5" stroke="#181615" stroke-width="1.6" stroke-linecap="round"/>`,
    aliases: ["truck", "vogn"],
  },
  popup: {
    id: "popup",
    kind: "spotKind",
    label: "Pop-up",
    svg: `<path d="M3.5 7C3.5 6.2 4.2 5.5 5 5.5H19C19.8 5.5 20.5 6.2 20.5 7V10C19.4 10 18.5 10.9 18.5 12C18.5 13.1 19.4 14 20.5 14V17C20.5 17.8 19.8 18.5 19 18.5H5C4.2 18.5 3.5 17.8 3.5 17V14C4.6 14 5.5 13.1 5.5 12C5.5 10.9 4.6 10 3.5 10V7Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 6V18" stroke="#181615" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="6" cy="12" r="1.2" fill="#E84A27"/><path d="M11 9.5H17M11 12H16M11 14.5H14" stroke="#181615" stroke-width="1.4" stroke-linecap="round"/><circle cx="16.8" cy="14" r="1.6" fill="#E84A27"/>`,
    aliases: ["pop_up", "ticket_stub", "residency"],
  },
  street_stall: {
    id: "street_stall",
    kind: "spotKind",
    label: "Street Stall",
    svg: `<path d="M3 9L5 4H19L21 9V10C21 11.1 20.1 12 19 12C17.9 12 17 11.1 17 10C17 11.1 16.1 12 15 12C13.9 12 13 11.1 13 10C13 11.1 12.1 12 11 12C9.9 12 9 11.1 9 10C9 11.1 8.1 12 7 12C5.9 12 5 11.1 5 10C5 11.1 4.1 12 3 12V9Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 12v8h14v-8" stroke="#181615" stroke-width="1.6"/><rect x="8" y="14" width="8" height="6" fill="#E84A27" stroke="#181615" stroke-width="1.2"/>`,
    aliases: ["kiosk", "window", "stall", "kebab_shack"],
  },
  food_hall: {
    id: "food_hall",
    kind: "spotKind",
    label: "Food Hall",
    svg: `<path d="M2.5 10L12 4L21.5 10V20H2.5V10Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 20V13C6 11.3 7.3 10 9 10C10.7 10 12 11.3 12 13V20" stroke="#181615" stroke-width="1.5"/><path d="M12 20V13C12 11.3 13.3 10 15 10C16.7 10 18 11.3 18 13V20" stroke="#181615" stroke-width="1.5"/><circle cx="12" cy="7.5" r="1.3" fill="#E84A27"/>`,
    aliases: ["market_hall", "mathallen", "torghall"],
  },
  dessert_shop: {
    id: "dessert_shop",
    kind: "spotKind",
    label: "Gelato & Sweets",
    svg: `<path d="M7 13a3.5 3.5 0 0 1 5.5-2.8A3.5 3.5 0 0 1 17 13" fill="#E84A27" opacity="0.85" stroke="#181615" stroke-width="1.8"/><path d="M5.5 13h13l-1.5 6.5a1.5 1.5 0 0 1-1.5 1.2h-7a1.5 1.5 0 0 1-1.5-1.2L5.5 13z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M16 6l2.5 5" stroke="#181615" stroke-width="1.8"/>`,
    aliases: ["gelateria", "ice_cream_parlor", "sweet_shop"],
  },

  // ── Dietary Tags (Axis 4: Badges with Custom Duotone Geometry) ──
  halal: {
    id: "halal",
    kind: "diet",
    label: "Halal",
    svg: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M14.2 7.8a5 5 0 1 0 0 8.4 4.2 4.2 0 1 1 0-8.4z" fill="#4E8752" stroke="#181615" stroke-width="1.4"/><polygon points="16,10 16.6,11.3 18,11.5 16.9,12.5 17.2,13.9 16,13.2 14.8,13.9 15.1,12.5 14,11.5 15.4,11.3" fill="#E84A27"/>`,
  },
  vegan: {
    id: "vegan",
    kind: "diet",
    label: "Vegan",
    svg: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 17C12 13.2 14.8 10 18.5 10C18.5 13.8 15.8 17 12 17Z" fill="#4E8752" stroke="#181615" stroke-width="1.4"/><path d="M12 17C12 13.8 9.8 11.5 6.5 11.5C6.5 14.8 8.8 17 12 17Z" fill="#4E8752" opacity="0.8" stroke="#181615" stroke-width="1.4"/><path d="M12 17V11" stroke="#FAF7F2" stroke-width="1.4"/>`,
  },
  vegetarian: {
    id: "vegetarian",
    kind: "diet",
    label: "Vegetarian",
    svg: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M6.5 17C6.5 10.5 11.8 7 17.5 7C17.5 13.5 12.2 17 6.5 17Z" fill="#4E8752" stroke="#181615" stroke-width="1.6"/><path d="M6.5 17C9.8 14.2 13.5 10.8 17.5 7" stroke="#FAF7F2" stroke-width="1.5"/>`,
  },
  gluten_free: {
    id: "gluten_free",
    kind: "diet",
    label: "Gluten-Free",
    svg: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M8.5 15.5l7-7M10.2 10.5c-.8-.8-.8-2 0-2.8.8.8 2 .8 2.8 0M13.8 14.1c.8.8 2 .8 2.8 0-.8-.8-.8-2 0-2.8" stroke="#4E8752" stroke-width="1.7"/><path d="M5.5 5.5l13 13" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  spicy: {
    id: "spicy",
    kind: "diet",
    label: "Spicy",
    svg: `<path d="M14.5 3.5C13.5 5 12.5 5.5 11.5 6" stroke="#4E8752" stroke-width="1.8"/><path d="M11 6C6 8 4 13 6 17.5C7.5 20.5 11 21 13.5 19.5C17.5 17 19.5 12 18 7.5C16.8 6.2 13.5 5.8 11 6Z" fill="#E84A27" stroke="#181615" stroke-width="1.8"/><path d="M13.5 7C14.5 9.5 14 13 11.5 16" stroke="#FAF7F2" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  // ── Regional Cuisines (Axis 3: Pastel Watercolor Waving Flags with Cream Sticker Halo) ──
  cuisine_vietnamese: {
    id: "cuisine_vietnamese",
    kind: "cuisine",
    label: "Vietnamese",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#E68A7E"/><polygon points="12.5,6.8 13.3,9.0 15.6,9.1 13.8,10.4 14.4,12.6 12.5,11.3 10.6,12.6 11.2,10.4 9.4,9.1 11.7,9.0" fill="#F4D37E" stroke="#381820" stroke-width="0.9" stroke-linejoin="round"/><path d="M5.2 5.2 C9.4 3.4, 14.6 7.2, 20.0 5.0" stroke="#FFFDF8" stroke-width="0.9" stroke-linecap="round" fill="none"/><path d="M11.5 4.8 C13.2 4.8, 14.8 5.6, 15.8 5.4 L15.2 15.4 C13.8 15.6, 12.2 14.8, 11.0 14.6 Z" fill="#381820" fill-opacity="0.10"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_korean: {
    id: "cuisine_korean",
    kind: "cuisine",
    label: "Korean",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FFFDF8"/><circle cx="12.5" cy="9.7" r="2.7" fill="#89B0CE" stroke="#381820" stroke-width="1.0"/><path d="M9.8 9.7 A2.7 2.7 0 0 1 15.2 9.7 A1.35 1.35 0 0 1 12.5 9.7 A1.35 1.35 0 0 0 9.8 9.7 Z" fill="#E68A7E"/><path d="M7.2 6.4 L8.4 5.2 M16.6 6.2 L17.8 7.4 M7.4 12.2 L8.6 13.4 M16.4 13.2 L17.6 12.0" stroke="#381820" stroke-width="1.1" stroke-linecap="round"/><path d="M11.5 4.8 C13.2 4.8, 14.8 5.6, 15.8 5.4 L15.2 15.4 C13.8 15.6, 12.2 14.8, 11.0 14.6 Z" fill="#381820" fill-opacity="0.08"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_japanese: {
    id: "cuisine_japanese",
    kind: "cuisine",
    label: "Japanese",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FFFDF8"/><circle cx="12.5" cy="9.7" r="2.8" fill="#E58B88" stroke="#381820" stroke-width="1.0"/><path d="M11.5 4.8 C13.2 4.8, 14.8 5.6, 15.8 5.4 L15.2 15.4 C13.8 15.6, 12.2 14.8, 11.0 14.6 Z" fill="#381820" fill-opacity="0.08"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_chinese: {
    id: "cuisine_chinese",
    kind: "cuisine",
    label: "Chinese",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#E68A7E"/><circle cx="8.2" cy="7.8" r="1.5" fill="#F4D37E" stroke="#381820" stroke-width="0.8"/><circle cx="11.2" cy="6.2" r="0.65" fill="#F4D37E"/><circle cx="12.2" cy="7.6" r="0.65" fill="#F4D37E"/><circle cx="11.8" cy="9.3" r="0.65" fill="#F4D37E"/><circle cx="10.4" cy="10.4" r="0.65" fill="#F4D37E"/><path d="M5.2 5.2 C9.4 3.4, 14.6 7.2, 20.0 5.0" stroke="#FFFDF8" stroke-width="0.9" stroke-linecap="round" fill="none"/><path d="M11.5 4.8 C13.2 4.8, 14.8 5.6, 15.8 5.4 L15.2 15.4 C13.8 15.6, 12.2 14.8, 11.0 14.6 Z" fill="#381820" fill-opacity="0.10"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_indian: {
    id: "cuisine_indian",
    kind: "cuisine",
    label: "Indian & Pakistani",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L20.3 8.0 C14.5 10.2, 9.0 6.0, 4.8 8.0 Z" fill="#F0AD74"/><path d="M4.8 8.0 C9.0 6.0, 14.5 10.2, 20.3 8.0 L20.0 11.4 C14.3 13.6, 8.9 9.4, 5.0 11.4 Z" fill="#FFFDF8"/><path d="M5.0 11.4 C8.9 9.4, 14.3 13.6, 20.0 11.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#8CBF9F"/><circle cx="12.5" cy="9.7" r="1.4" fill="none" stroke="#6B88B4" stroke-width="1.0"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_middle_eastern: {
    id: "cuisine_middle_eastern",
    kind: "cuisine",
    label: "Middle Eastern",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L20.3 7.6 C14.5 9.8, 9.0 5.6, 4.8 7.6 Z" fill="#E68A7E"/><path d="M4.8 7.6 C9.0 5.6, 14.5 9.8, 20.3 7.6 L20.0 11.8 C14.3 14.0, 8.9 9.8, 5.0 11.8 Z" fill="#FFFDF8"/><path d="M5.0 11.8 C8.9 9.8, 14.3 14.0, 20.0 11.8 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#E68A7E"/><path d="M12.5 7.8 L10.8 10.6 L14.2 10.6 Z" fill="#8CBF9F" stroke="#381820" stroke-width="0.8" stroke-linejoin="round"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_yemeni: {
    id: "cuisine_yemeni",
    kind: "cuisine",
    label: "Yemeni & Somali",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#8DBAE2"/><polygon points="12.5,6.8 13.3,9.0 15.6,9.1 13.8,10.4 14.4,12.6 12.5,11.3 10.6,12.6 11.2,10.4 9.4,9.1 11.7,9.0" fill="#FFFDF8" stroke="#381820" stroke-width="0.9" stroke-linejoin="round"/><path d="M5.2 5.2 C9.4 3.4, 14.6 7.2, 20.0 5.0" stroke="#FFFDF8" stroke-width="0.9" stroke-linecap="round" fill="none"/><path d="M11.5 4.8 C13.2 4.8, 14.8 5.6, 15.8 5.4 L15.2 15.4 C13.8 15.6, 12.2 14.8, 11.0 14.6 Z" fill="#381820" fill-opacity="0.10"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_italian: {
    id: "cuisine_italian",
    kind: "cuisine",
    label: "Italian",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C6.5 3.6, 8.2 3.6, 10.0 4.1 L9.5 14.3 C7.8 13.8, 6.4 14.0, 5.2 14.8 Z" fill="#8CBF9F"/><path d="M10.0 4.1 C11.8 4.6, 13.6 5.4, 15.3 5.5 L14.7 15.6 C13.0 15.5, 11.2 14.7, 9.5 14.3 Z" fill="#FFFDF8"/><path d="M15.3 5.5 C17.2 5.6, 19.0 5.1, 20.6 4.4 L19.8 14.8 C18.2 15.6, 16.5 15.7, 14.7 15.6 Z" fill="#E68A7E"/><path d="M10.0 4.1 L9.5 14.3 M15.3 5.5 L14.7 15.6" stroke="#381820" stroke-width="0.9" stroke-opacity="0.45"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_mexican: {
    id: "cuisine_mexican",
    kind: "cuisine",
    label: "Mexican",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C6.5 3.6, 8.2 3.6, 10.0 4.1 L9.5 14.3 C7.8 13.8, 6.4 14.0, 5.2 14.8 Z" fill="#8CBF9F"/><path d="M10.0 4.1 C11.8 4.6, 13.6 5.4, 15.3 5.5 L14.7 15.6 C13.0 15.5, 11.2 14.7, 9.5 14.3 Z" fill="#FFFDF8"/><path d="M15.3 5.5 C17.2 5.6, 19.0 5.1, 20.6 4.4 L19.8 14.8 C18.2 15.6, 16.5 15.7, 14.7 15.6 Z" fill="#E68A7E"/><circle cx="12.4" cy="9.8" r="1.3" fill="#D9A76A" stroke="#381820" stroke-width="0.8"/><path d="M10.0 4.1 L9.5 14.3 M15.3 5.5 L14.7 15.6" stroke="#381820" stroke-width="0.9" stroke-opacity="0.45"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_nordic: {
    id: "cuisine_nordic",
    kind: "cuisine",
    label: "Nordic",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#E58B88"/><path d="M9.6 3.9 L9.1 14.3 M4.9 9.6 C9.2 7.6, 14.5 11.8, 20.2 9.6" stroke="#FFFDF8" stroke-width="3.0"/><path d="M9.6 3.9 L9.1 14.3 M4.9 9.6 C9.2 7.6, 14.5 11.8, 20.2 9.6" stroke="#6E94B8" stroke-width="1.5"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_french: {
    id: "cuisine_french",
    kind: "cuisine",
    label: "French",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C6.5 3.6, 8.2 3.6, 10.0 4.1 L9.5 14.3 C7.8 13.8, 6.4 14.0, 5.2 14.8 Z" fill="#89B0CE"/><path d="M10.0 4.1 C11.8 4.6, 13.6 5.4, 15.3 5.5 L14.7 15.6 C13.0 15.5, 11.2 14.7, 9.5 14.3 Z" fill="#FFFDF8"/><path d="M15.3 5.5 C17.2 5.6, 19.0 5.1, 20.6 4.4 L19.8 14.8 C18.2 15.6, 16.5 15.7, 14.7 15.6 Z" fill="#E68A7E"/><path d="M10.0 4.1 L9.5 14.3 M15.3 5.5 L14.7 15.6" stroke="#381820" stroke-width="0.9" stroke-opacity="0.45"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },
  cuisine_american: {
    id: "cuisine_american",
    kind: "cuisine",
    label: "American",
    svg: `<g stroke="#FAF7F2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M4.2 3.2 L5.6 20.8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FAF7F2"/></g><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="#FFFDF8"/><path d="M4.7 6.2 C9.2 4.2, 14.8 8.4, 20.4 6.2 M4.9 9.6 C9.2 7.6, 14.8 11.8, 20.1 9.6 M5.1 13.0 C9.2 11.0, 14.5 15.2, 19.9 13.0" stroke="#E58B88" stroke-width="1.6" fill="none"/><path d="M4.6 4.5 C7.0 3.4, 9.5 3.8, 11.6 4.6 L11.3 10.2 C9.2 9.4, 6.8 9.0, 4.9 10.0 Z" fill="#7FA4C4" stroke="#381820" stroke-width="0.9" stroke-linejoin="round"/><circle cx="8.0" cy="7.0" r="0.8" fill="#FFFDF8"/><path d="M4.6 4.5 C9.2 2.4, 14.8 6.8, 20.6 4.4 L19.8 14.8 C14.2 17.0, 8.8 12.6, 5.2 14.8 Z" fill="none" stroke="#381820" stroke-width="1.35" stroke-linejoin="round"/><path d="M4.2 3.2 L5.6 20.8" stroke="#381820" stroke-width="1.8" stroke-linecap="round"/><circle cx="4.1" cy="3.0" r="1.1" fill="#E84A27" stroke="#381820" stroke-width="1.1"/>`,
  },

  // ── High-Craft Remixed Food Icons (8 Distinct WebPs + Crisp Vector Duotone SVGs) ──
  croissant: {
    id: "croissant",
    kind: "dish",
    label: "Croissant",
    webp: "/icons/food/croissant.webp",
    parent: "pastries_bakery",
    svg: `<path d="M3.5 14.5C2.5 10 6 6.5 12 6.5C18 6.5 21.5 10 20.5 14.5C19.8 17 17.2 18 15.2 16.2C13.8 15 13 13.8 12 13.8C11 13.8 10.2 15 8.8 16.2C6.8 18 4.2 17 3.5 14.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 7.5C9.2 10 10.5 11.2 12 11.2C13.5 11.2 14.8 10 16 7.5" fill="#E84A27" fill-opacity="0.22" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  kanelbolle: {
    id: "kanelbolle",
    kind: "dish",
    label: "Cinnamon Roll",
    webp: "/icons/food/cinnamon_roll.webp",
    parent: "pastries_bakery",
    svg: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 6a6 6 0 1 0 6 6 4 4 0 1 0-4-4 2 2 0 1 0 2 2" stroke="#E84A27" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    aliases: ["cinnamon_roll", "bolle"],
  },
  cinnamon_roll: {
    id: "cinnamon_roll",
    kind: "dish",
    label: "Cinnamon Roll",
    webp: "/icons/food/cinnamon_roll.webp",
    parent: "pastries_bakery",
    aliases: ["kanelbolle"],
  },
  cardamom_bun: {
    id: "cardamom_bun",
    kind: "dish",
    label: "Cardamom Bun",
    webp: "/icons/food/cinnamon_roll.webp",
    parent: "pastries_bakery",
  },
  bagel: {
    id: "bagel",
    kind: "dish",
    label: "Bagel",
    parent: "pastries_bakery",
    svg: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><circle cx="12" cy="12" r="3.5" fill="#E84A27" stroke="#181615" stroke-width="1.4"/><circle cx="7.5" cy="9.5" r="0.8" fill="#181615"/><circle cx="15.5" cy="8.5" r="0.8" fill="#181615"/><circle cx="16" cy="14.5" r="0.8" fill="#181615"/><circle cx="8" cy="15" r="0.8" fill="#181615"/>`,
  },
  waffle: {
    id: "waffle",
    kind: "dish",
    label: "Waffle",
    parent: "pastries_bakery",
    svg: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 3v18M3 12h18M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="#E84A27" stroke-width="1.5"/>`,
  },
  naan: {
    id: "naan",
    kind: "dish",
    label: "Garlic Naan",
    webp: "/icons/food/naan.webp",
    parent: "breads",
    svg: `<path d="M4 14C4 8 7 4 12 4s8 4 8 10c0 4-3.5 6.5-8 6.5S4 18 4 14z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><circle cx="9.5" cy="10" r="1.5" fill="#E84A27"/><circle cx="14" cy="13.5" r="2" fill="#E84A27"/><circle cx="10" cy="16" r="1.3" fill="#E84A27"/>`,
    aliases: ["flatbread", "roti"],
  },
  flatbread: {
    id: "flatbread",
    kind: "dish",
    label: "Flatbread",
    webp: "/icons/food/naan.webp",
    parent: "breads",
  },
  sourdough: {
    id: "sourdough",
    kind: "dish",
    label: "Artisan Sourdough",
    webp: "/icons/food/breads.webp",
    parent: "breads",
    svg: `<path d="M3 15c0-5 4-8 9-8s9 3 9 8c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M6 15h12" stroke="#E84A27" stroke-width="2"/><path d="M8.5 9.5l2 2.5M12 8.5l2 2.5M15.5 9.5l1.5 2" stroke="#E84A27" stroke-width="1.8"/>`,
  },
  pizza: {
    id: "pizza",
    kind: "dish",
    label: "Neapolitan Pizza",
    webp: "/icons/food/pizza.webp",
    parent: "pizza_pasta",
    svg: `<path d="M12 3L3.5 19C7.5 21.5 16.5 21.5 20.5 19L12 3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 18C8 20.2 16 20.2 20 18" stroke="#181615" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="11" r="1.8" fill="#E84A27"/><circle cx="9.2" cy="15.2" r="1.5" fill="#E84A27"/><circle cx="14.8" cy="15.2" r="1.5" fill="#E84A27"/>`,
  },
  pasta: {
    id: "pasta",
    kind: "dish",
    label: "Fresh Pasta",
    parent: "pizza_pasta",
    svg: `<path d="M3 12.5C3 17.2 7 20 12 20C17 20 21 17.2 21 12.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 11.5C8.5 9 11 12.5 13 9.5C15 12 17.5 9.5 18.5 11.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="10.5" r="2" fill="#E84A27" stroke="#181615" stroke-width="1.2"/>`,
  },
  coffee: {
    id: "coffee",
    kind: "dish",
    label: "Specialty Coffee",
    webp: "/icons/food/coffee.webp",
    parent: "coffee_tea",
    svg: `<path d="M5 8.5H16.5V14.5C16.5 17.5 14.2 19.8 10.8 19.8C7.4 19.8 5 17.5 5 14.5V8.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 8.5H16.5V11.5H5V8.5Z" fill="#E84A27"/><path d="M16.5 9.5H18.8C20 9.5 21 10.5 21 11.8C21 13.1 20 14 18.8 14H16.5" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><path d="M8.5 3.5C8.5 4.8 9.5 5.2 9.5 6.5M12.8 3C12.8 4.3 13.8 4.8 13.8 6.2" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,
    aliases: ["specialty_coffee", "espresso", "latte"],
  },
  iced_coffee: {
    id: "iced_coffee",
    kind: "dish",
    label: "Iced Coffee",
    parent: "coffee_tea",
    svg: `<path d="M6 7h12l-1.5 13a2 2 0 0 1-2 1.5h-5a2 2 0 0 1-2-1.5L6 7z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><rect x="8.5" y="9.5" width="3" height="3" fill="#E84A27" rx="0.5"/><rect x="12.5" y="12.5" width="3" height="3" fill="#E84A27" rx="0.5"/><path d="M14 3l-2 13" stroke="#181615" stroke-width="2"/>`,
  },
  matcha: {
    id: "matcha",
    kind: "dish",
    label: "Matcha Latte",
    parent: "coffee_tea",
    svg: `<path d="M3.5 10.5C3.5 16.2 7.2 19.8 12 19.8C16.8 19.8 20.5 16.2 20.5 10.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="12" cy="10.5" rx="8.5" ry="3" fill="#4E8752" stroke="#181615" stroke-width="1.5"/><path d="M8.5 10.5C9.8 9.6 11.5 11.4 13.5 10.2C14.5 9.7 15.2 10.3 15.8 10.7" stroke="#FAF7F2" stroke-width="1.3" stroke-linecap="round"/>`,
  },
  boba: {
    id: "boba",
    kind: "dish",
    label: "Boba & Bubble Tea",
    parent: "coffee_tea",
    svg: `<path d="M6 8h12l-1.5 11.5a2 2 0 0 1-2 1.5h-5a2 2 0 0 1-2-1.5L6 8z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 8h14" stroke="#181615" stroke-width="2"/><path d="M13 3l-1.5 13" stroke="#E84A27" stroke-width="2.2"/><circle cx="9.5" cy="17.5" r="1.2" fill="#181615"/><circle cx="12.5" cy="18" r="1.2" fill="#181615"/><circle cx="14.5" cy="16.5" r="1.2" fill="#E84A27"/>`,
  },
  banh_mi: {
    id: "banh_mi",
    kind: "dish",
    label: "Bánh Mì",
    webp: "/icons/food/banh_mi.webp",
    parent: "sandwiches_handhelds",
    svg: `<path d="M3 13.5C3 10.5 5.5 8 9.5 8h5c4 0 6.5 2.5 6.5 5.5s-2.5 5.5-6.5 5.5h-5C5.5 19 3 16.5 3 13.5z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M4.5 13.5h15" stroke="#E84A27" stroke-width="2"/><path d="M8 10.5l2 1.5M12 10.5l2 1.5M16 10.5l1.5 1.5" stroke="#4E8752" stroke-width="1.5" stroke-linecap="round"/>`,
    aliases: ["vietnamese_sandwich"],
  },
  burger: {
    id: "burger",
    kind: "dish",
    label: "Smash Burger",
    parent: "sandwiches_handhelds",
    svg: `<path d="M4 10.5C4 6.8 7.5 4.5 12 4.5C16.5 4.5 20 6.8 20 10.5H4Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 13H20.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="14.5" width="16" height="2.4" rx="1.2" fill="#181615"/><path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/>`,
  },
  tacos: {
    id: "tacos",
    kind: "dish",
    label: "Street Tacos",
    parent: "sandwiches_handhelds",
    svg: `<path d="M3 16.5C3 9 7.2 5 12 5C16.8 5 21 9 21 16.5C16.5 18.2 7.5 18.2 3 16.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5.5 13.5C7.5 11.5 9.5 13 11.5 11.5C13.5 13 15.5 11.5 18.5 13.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.5" r="1.3" fill="#E84A27"/><circle cx="14.5" cy="9.5" r="1.3" fill="#181615"/>`,
  },
  ramen: {
    id: "ramen",
    kind: "dish",
    label: "Tonkotsu Ramen",
    webp: "/icons/food/ramen.webp",
    parent: "noodles_soup",
    svg: `<path d="M3 11.5C3 16.8 6.8 20 12 20C17.2 20 21 16.8 21 11.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 14.5H19.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="10.5" r="1.8" fill="#E84A27" stroke="#181615" stroke-width="1.2"/><path d="M3 5L19 8.5M3 3L19 7" stroke="#181615" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  pho: {
    id: "pho",
    kind: "dish",
    label: "Steaming Pho",
    parent: "noodles_soup",
    svg: `<path d="M3.5 11.5C3.5 16.8 7.2 20 12 20C16.8 20 20.5 16.8 20.5 11.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 11.5C8.5 9.2 11 11.5 13.5 9.2C15.2 10.8 17 9.5 18 11.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 5C9.5 6.5 10.5 7.5 10.5 8.8M14.5 4.5C14.5 6 15.5 7 15.5 8.2" stroke="#4E8752" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="13.5" r="1.5" fill="#E84A27"/>`,
  },
  udon: {
    id: "udon",
    kind: "dish",
    label: "Udon Noodle Bowl",
    parent: "noodles_soup",
    svg: `<path d="M3 11.5C3 16.8 6.8 20 12 20C17.2 20 21 16.8 21 11.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M6 11c1 2 2 2 3 0s2-2 3 0 2 2 3 0 2-2 3 0" stroke="#FAF7F2" stroke-width="1.8" stroke-linecap="round"/><rect x="8" y="7" width="8" height="4" rx="2" fill="#E84A27"/>`,
  },
  k_chicken: {
    id: "k_chicken",
    kind: "dish",
    label: "K-Chicken & Wings",
    webp: "/icons/food/fried_chicken.webp",
    parent: "chicken_grill",
    svg: `<path d="M2.5 8.8L4.2 6.0L6.8 4.2L10.0 3.0L13.5 2.0L17.2 2.5L20.5 4.0L22.5 6.2L22.8 8.8L21.8 11.2L19.5 12.8L16.5 13.8L12.8 14.5L9.2 13.8L6.2 12.5L3.5 10.5Z" fill="#D4320C" stroke="#120100" stroke-width="0.95" stroke-linejoin="round"/><path d="M6.2 4.5L9.2 3.2L12.8 2.8" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8" r="1.2" fill="#FAF7F2"/><circle cx="16" cy="7" r="1.2" fill="#FAF7F2"/>`,
    aliases: ["fried_chicken", "wings", "korean_chicken"],
  },
  fried_chicken: {
    id: "fried_chicken",
    kind: "dish",
    label: "Fried Chicken",
    webp: "/icons/food/fried_chicken.webp",
    parent: "chicken_grill",
  },
  kbbq: {
    id: "kbbq",
    kind: "dish",
    label: "Korean BBQ",
    parent: "chicken_grill",
    svg: `<path d="M4 14h16l-1.5 4.5a2 2 0 0 1-1.9 1.5H7.4a2 2 0 0 1-1.9-1.5L4 14z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M2 14h20" stroke="#181615" stroke-width="2"/><path d="M12 4c1.5 2 3 3.5 3 5.5a3 3 0 0 1-6 0C9 7.5 10.5 6 12 4z" fill="#E84A27" stroke="#181615" stroke-width="1.6"/>`,
  },
  kebab: {
    id: "kebab",
    kind: "dish",
    label: "Kebab & Shawarma",
    parent: "chicken_grill",
    svg: `<path d="M6 9.5C6 6.5 8.7 4.5 12 4.5C15.3 4.5 18 6.5 18 9.5L15.5 19.5H8.5L6 9.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 9.5C9.5 8 14.5 8 16.5 9.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.2" cy="7.5" r="1.4" fill="#4E8752"/><circle cx="13.8" cy="7.5" r="1.4" fill="#E84A27"/>`,
    aliases: ["shawarma", "falafel"],
  },
  indian: {
    id: "indian",
    kind: "dish",
    label: "Curry & Dal",
    parent: "rice_bowls",
    svg: `<path d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 13C5 10 8 8.5 11.5 8.5C15 8.5 19 10 19 13H5Z" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><circle cx="9.5" cy="11" r="1.2" fill="#FAF7F2"/><circle cx="14" cy="11.2" r="1.2" fill="#FAF7F2"/>`,
    aliases: ["curry", "biryani"],
  },
  mandi_rice: {
    id: "mandi_rice",
    kind: "dish",
    label: "Mandi Rice",
    parent: "rice_bowls",
    svg: `<path d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M6 13c2-2 4-2 6 0s4 2 6 0" stroke="#E84A27" stroke-width="2"/><ellipse cx="12" cy="9.5" rx="3.5" ry="2" fill="#E84A27"/>`,
  },
  dumplings: {
    id: "dumplings",
    kind: "dish",
    label: "Handmade Dumplings",
    webp: "/icons/food/dumplings.webp",
    parent: "dumplings_buns",
    svg: `<path d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,
    aliases: ["gyoza", "dim_sum"],
  },
  bao: {
    id: "bao",
    kind: "dish",
    label: "Steamed Bao",
    webp: "/icons/food/dumplings.webp",
    parent: "dumplings_buns",
    svg: `<path d="M4 16.5C4 11 7 8 12 8s8 3 8 8.5c0 1.5-1.5 2.5-4 2.5H8c-2.5 0-4-1-4-2.5z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M10 8c1 2 1.5 3 2 4M14 8c-1 2-1.5 3-2 4" stroke="#E84A27" stroke-width="1.4"/>`,
  },
  sushi: {
    id: "sushi",
    kind: "dish",
    label: "Sushi & Sashimi",
    parent: "seafood",
    svg: `<rect x="5" y="11.5" width="14" height="6" rx="3" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M4 11C4 8.2 7 7.2 12 7.2C17 7.2 20 8.2 20 11C20 12.5 17 13.2 12 13.2C7 13.2 4 12.5 4 11Z" fill="#E84A27" stroke="#181615" stroke-width="1.6"/><rect x="10.5" y="7" width="3" height="10.5" rx="0.5" fill="#181615"/>`,
  },
  nordic_seafood: {
    id: "nordic_seafood",
    kind: "dish",
    label: "Nordic Seafood",
    parent: "seafood",
    svg: `<path d="M3 14c3-5 10-6 15-3 1.5 1 3 0 3-1.5 0 2.5-1 4.5-3 4.5-5 3-12 2-15 0z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 13.5c3-3 8-3.5 12-1.5" stroke="#E84A27" stroke-width="2"/>`,
  },
  gelato: {
    id: "gelato",
    kind: "dish",
    label: "Artisan Gelato",
    parent: "sweets_frozen",
    svg: `<path d="M7 13a3.5 3.5 0 0 1 5.5-2.8A3.5 3.5 0 0 1 17 13" fill="#E84A27" opacity="0.85" stroke="#181615" stroke-width="1.8"/><path d="M5.5 13h13l-1.5 6.5a1.5 1.5 0 0 1-1.5 1.2h-7a1.5 1.5 0 0 1-1.5-1.2L5.5 13z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M16 6l2.5 5" stroke="#181615" stroke-width="1.8"/>`,
  },
  dessert: {
    id: "dessert",
    kind: "dish",
    label: "Dessert & Pastry",
    parent: "sweets_frozen",
    svg: `<path d="M12 21L7 12H17L12 21Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="8.5" r="4" fill="#E84A27" stroke="#181615" stroke-width="1.5"/>`,
  },
  drinks: {
    id: "drinks",
    kind: "dish",
    label: "Cocktails & Drinks",
    parent: "drinks_bars",
    svg: `<path d="M4.5 6C4.5 11 8 13.5 12 13.5C16 13.5 19.5 11 19.5 6H4.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.2 8.5C7.2 11 9.2 12 12 12C14.8 12 16.8 11 17.8 8.5H6.2Z" fill="#E84A27"/><path d="M12 13.5V20M8.5 20H15.5" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/>`,
    aliases: ["cocktail"],
  },
  natural_wine: {
    id: "natural_wine",
    kind: "dish",
    label: "Natural Wine",
    parent: "drinks_bars",
    svg: `<path d="M7 3h3v4l2 3.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8.5L7 7V3z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 13h7v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6z" fill="#E84A27" opacity="0.85"/><path d="M15 9h5l-.6 4a2.2 2.2 0 0 1-4.4 0L15 9z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M15.4 11.5h4.2c-.2 1.2-1 2-2.1 2s-1.9-.8-2.1-2z" fill="#E84A27"/><path d="M17.5 15v5M15.5 20h4" stroke="#181615" stroke-width="1.8"/>`,
  },
  brunch: {
    id: "brunch",
    kind: "dish",
    label: "Brunch & Toast",
    parent: "brunch",
    svg: `<path d="M5 9c0-2.5 3-4 7-4s7 1.5 7 4c0 1.2-.5 2.2-1.2 2.8L17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l-.8-6.2C5.5 11.2 5 10.2 5 9z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><circle cx="12" cy="13" r="3.8" fill="#4E8752" opacity="0.3" stroke="#4E8752" stroke-width="1.5"/><circle cx="12" cy="13" r="1.8" fill="#E84A27"/>`,
  },
  street_food: {
    id: "street_food",
    kind: "dish",
    label: "Street Food",
    parent: "sandwiches_handhelds",
    svg: `<path d="M4 20L20 4" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="8.5" r="3" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><rect x="9.5" y="10.5" width="5" height="4" rx="1.5" transform="rotate(-45 9.5 10.5)" fill="#FAF7F2" stroke="#181615" stroke-width="1.5"/><circle cx="8" cy="16" r="2.6" fill="#E84A27" stroke="#181615" stroke-width="1.5"/>`,
  },

  // ── Discover & Meta ──
  all: {
    id: "all",
    kind: "ui",
    label: "All Spots",
    svg: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 5.5L13.8 10.2L18.5 12L13.8 13.8L12 18.5L10.2 13.8L5.5 12L10.2 10.2L12 5.5Z" fill="#E84A27" stroke="#181615" stroke-width="1.2" stroke-linejoin="round"/>`,
  },
};

/** Emoji to stable key lookup */
export const EMOJI_TO_STABLE_KEY: Record<string, string> = {
  "🍕": "pizza",
  "☕": "coffee",
  "🍜": "ramen",
  "🍗": "k_chicken",
  "🥐": "croissant",
  "🥮": "kanelbolle",
  "🫓": "naan",
  "🥖": "banh_mi",
  "🥪": "banh_mi",
  "🍔": "burger",
  "🌮": "tacos",
  "🥟": "dumplings",
  "🥠": "bao",
  "🍝": "pasta",
  "🍣": "sushi",
  "🍨": "gelato",
  "🍰": "dessert",
  "🍷": "natural_wine",
  "🍸": "drinks",
  "🥑": "brunch",
  "🍵": "matcha",
  "🧋": "boba",
  "🍛": "indian",
  "🍚": "mandi_rice",
  "🍲": "pho",
};

/** Alias map for old keys & alternate spellings */
const ALIAS_LOOKUP: Record<string, string> = {};
for (const entry of Object.values(ICON_REGISTRY)) {
  ALIAS_LOOKUP[entry.id] = entry.id;
  if (entry.aliases) {
    for (const a of entry.aliases) {
      ALIAS_LOOKUP[a] = entry.id;
    }
  }
}

/**
 * Resolve an icon entry by stable id, legacy key, or emoji.
 */
export function resolveIconEntry(nameOrEmoji?: string | null): IconEntry | null {
  if (!nameOrEmoji) return null;
  const trimmed = nameOrEmoji.trim();
  const fromEmoji = EMOJI_TO_STABLE_KEY[trimmed];
  const targetId = fromEmoji ? fromEmoji : trimmed.toLowerCase();

  const direct = ICON_REGISTRY[targetId];
  if (direct) return direct;

  const aliasedId = ALIAS_LOOKUP[targetId];
  if (aliasedId && ICON_REGISTRY[aliasedId]) {
    return ICON_REGISTRY[aliasedId];
  }

  return null;
}

/**
 * Returns rendering instructions for an icon (WebP raster or SVG body string).
 */
export function getIconDisplay(nameOrEmoji?: string | null): {
  type: "webp" | "svg";
  value: string;
  label: string;
} {
  const entry = resolveIconEntry(nameOrEmoji);
  if (!entry) {
    return {
      type: "svg",
      value: ICON_REGISTRY.all.svg!,
      label: "All",
    };
  }

  if (entry.webp) {
    return {
      type: "webp",
      value: entry.webp,
      label: entry.label,
    };
  }

  return {
    type: "svg",
    value: entry.svg || ICON_REGISTRY.all.svg!,
    label: entry.label,
  };
}
