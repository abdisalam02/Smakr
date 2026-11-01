"use client";

import React from "react";

/**
 * Smakr Duotone Gastronomy Icon System (Oslo Food Radar)
 *
 * Strict 24x24 duotone vector architecture:
 * - INK: #181615 (or currentColor in monochrome mode)
 * - CREAM: #FAF7F2
 * - PAPRIKA: #E84A27
 * - MATCHA: #4E8752
 * - AMBER: #D97706
 */

export interface IconProps {
  className?: string;
  title?: string;
  monochrome?: boolean;
}

/**
 * Single-Source Authoritative SVG Inner Bodies (24x24 viewBox)
 */
export const SMAKR_ICON_SVG_BODIES: Record<string, string> = {
  // Discover / All
  all: `<circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 5.5L13.8 10.2L18.5 12L13.8 13.8L12 18.5L10.2 13.8L5.5 12L10.2 10.2L12 5.5Z" fill="#E84A27" stroke="#181615" stroke-width="1.2" stroke-linejoin="round"/>`,

  // Bakery & Viennoiserie
  bakery: `<path d="M3.5 14.5C2.5 10 6 6.5 12 6.5C18 6.5 21.5 10 20.5 14.5C19.8 17 17.2 18 15.2 16.2C13.8 15 13 13.8 12 13.8C11 13.8 10.2 15 8.8 16.2C6.8 18 4.2 17 3.5 14.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 7.5C9.2 10 10.5 11.2 12 11.2C13.5 11.2 14.8 10 16 7.5" fill="#E84A27" fill-opacity="0.22" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/><path d="M6.5 10.5L8.5 14M17.5 10.5L15.5 14" stroke="#181615" stroke-width="1.5" stroke-linecap="round"/>`,

  // Artisan Sourdough
  sourdough: `<path d="M3 15c0-5 4-8 9-8s9 3 9 8c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M6 15h12" stroke="#E84A27" stroke-width="2"/><path d="M8.5 9.5l2 2.5M12 8.5l2 2.5M15.5 9.5l1.5 2" stroke="#E84A27" stroke-width="1.8"/>`,

  // Coffee & Espresso
  coffee: `<path d="M5 8.5H16.5V14.5C16.5 17.5 14.2 19.8 10.8 19.8C7.4 19.8 5 17.5 5 14.5V8.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 8.5H16.5V11.5H5V8.5Z" fill="#E84A27"/><path d="M16.5 9.5H18.8C20 9.5 21 10.5 21 11.8C21 13.1 20 14 18.8 14H16.5" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><path d="M8.5 3.5C8.5 4.8 9.5 5.2 9.5 6.5M12.8 3C12.8 4.3 13.8 4.8 13.8 6.2" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,

  // Matcha & Japanese Tea
  matcha: `<path d="M3.5 10.5C3.5 16.2 7.2 19.8 12 19.8C16.8 19.8 20.5 16.2 20.5 10.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="12" cy="10.5" rx="8.5" ry="3" fill="#4E8752" stroke="#181615" stroke-width="1.5"/><path d="M8.5 10.5C9.8 9.6 11.5 11.4 13.5 10.2C14.5 9.7 15.2 10.3 15.8 10.7" stroke="#FAF7F2" stroke-width="1.3" stroke-linecap="round"/><path d="M15.5 4.2C17.8 4.2 18.8 6 17.2 7.8C15.6 7.8 14.5 6.2 15.5 4.2Z" fill="#4E8752" stroke="#181615" stroke-width="1.3" stroke-linejoin="round"/>`,

  // Bubble Tea & Boba
  boba: `<path d="M6 8h12l-1.5 11.5a2 2 0 0 1-2 1.5h-5a2 2 0 0 1-2-1.5L6 8z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 8h14" stroke="#181615" stroke-width="2"/><path d="M13 3l-1.5 13" stroke="#E84A27" stroke-width="2.2"/><circle cx="9.5" cy="17.5" r="1.2" fill="#181615"/><circle cx="12.5" cy="18" r="1.2" fill="#181615"/><circle cx="14.5" cy="16.5" r="1.2" fill="#E84A27"/>`,

  // Ramen & Broth Noodles
  ramen: `<path d="M3 11.5C3 16.8 6.8 20 12 20C17.2 20 21 16.8 21 11.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 14.5H19.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="10.5" r="1.8" fill="#E84A27" stroke="#181615" stroke-width="1.2"/><path d="M3 5L19 8.5M3 3L19 7" stroke="#181615" stroke-width="1.5" stroke-linecap="round"/>`,

  // Burgers & Smash
  burger: `<path d="M4 10.5C4 6.8 7.5 4.5 12 4.5C16.5 4.5 20 6.8 20 10.5H4Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 13H20.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="14.5" width="16" height="2.4" rx="1.2" fill="#181615"/><path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/>`,

  // Pizza & Calzone
  pizza: `<path d="M12 3L3.5 19C7.5 21.5 16.5 21.5 20.5 19L12 3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 18C8 20.2 16 20.2 20 18" stroke="#181615" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="11" r="1.8" fill="#E84A27"/><circle cx="9.2" cy="15.2" r="1.5" fill="#E84A27"/><circle cx="14.8" cy="15.2" r="1.5" fill="#E84A27"/>`,

  // Tacos & Mexican
  tacos: `<path d="M3 16.5C3 9 7.2 5 12 5C16.8 5 21 9 21 16.5C16.5 18.2 7.5 18.2 3 16.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5.5 13.5C7.5 11.5 9.5 13 11.5 11.5C13.5 13 15.5 11.5 18.5 13.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.5" r="1.3" fill="#E84A27"/><circle cx="14.5" cy="9.5" r="1.3" fill="#181615"/>`,

  // Dumplings, Gyoza & Dim Sum
  dumplings: `<path d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 16.2C8.5 17.6 15.5 17.6 18.5 16.2" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/>`,

  // Bao & Steamed Buns
  bao: `<path d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/>`,

  // Handmade Pasta
  pasta: `<path d="M3 12.5C3 17.2 7 20 12 20C17 20 21 17.2 21 12.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 11.5C8.5 9 11 12.5 13 9.5C15 12 17.5 9.5 18.5 11.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="10.5" r="2" fill="#E84A27" stroke="#181615" stroke-width="1.2"/>`,

  // Fried Chicken & Wings
  fried_chicken: `<path d="M8.5 6C5.5 6 3.5 8.5 4 11.5C4.5 14.5 7.5 16 10.5 15.5L15.5 19.5C16.5 20.3 18 19.5 17.5 18.2L15 13.5C16.5 10.8 14.8 6 8.5 6Z" fill="#E84A27" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><circle cx="18.2" cy="18.8" r="2" fill="#FAF7F2" stroke="#181615" stroke-width="1.4"/><circle cx="16.2" cy="20.2" r="1.8" fill="#FAF7F2" stroke="#181615" stroke-width="1.4"/>`,

  // Korean BBQ & Grill
  kbbq: `<path d="M4 14h16l-1.5 4.5a2 2 0 0 1-1.9 1.5H7.4a2 2 0 0 1-1.9-1.5L4 14z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M2 14h20" stroke="#181615" stroke-width="2"/><path d="M12 4c1.5 2 3 3.5 3 5.5a3 3 0 0 1-6 0C9 7.5 10.5 6 12 4z" fill="#E84A27" stroke="#181615" stroke-width="1.6"/>`,

  // Kebab, Shawarma & Falafel
  kebab: `<path d="M6 9.5C6 6.5 8.7 4.5 12 4.5C15.3 4.5 18 6.5 18 9.5L15.5 19.5H8.5L6 9.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 9.5C9.5 8 14.5 8 16.5 9.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.2" cy="7.5" r="1.4" fill="#4E8752"/><circle cx="13.8" cy="7.5" r="1.4" fill="#E84A27"/>`,

  // Pho & Vietnamese
  vietnamese: `<path d="M3.5 11.5C3.5 16.8 7.2 20 12 20C16.8 20 20.5 16.8 20.5 11.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 11.5C8.5 9.2 11 11.5 13.5 9.2C15.2 10.8 17 9.5 18 11.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 6C9.5 7.5 10.5 8.5 10.5 9.5M14.5 5.5C14.5 7 15.5 8 15.5 9.2" stroke="#4E8752" stroke-width="1.6" stroke-linecap="round"/>`,

  // Indian & Curry
  indian: `<path d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 13C5 10 8 8.5 11.5 8.5C15 8.5 19 10 19 13H5Z" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><circle cx="9.5" cy="11" r="1.2" fill="#FAF7F2"/><circle cx="14" cy="11.2" r="1.2" fill="#FAF7F2"/>`,

  // Sushi & Sashimi
  sushi: `<rect x="5" y="11.5" width="14" height="6" rx="3" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M4 11C4 8.2 7 7.2 12 7.2C17 7.2 20 8.2 20 11C20 12.5 17 13.2 12 13.2C7 13.2 4 12.5 4 11Z" fill="#E84A27" stroke="#181615" stroke-width="1.6"/><rect x="10.5" y="7" width="3" height="10.5" rx="0.5" fill="#181615"/>`,

  // Scandinavian Salmon & Nordic Seafood
  nordic_seafood: `<path d="M3 14c3-5 10-6 15-3 1.5 1 3 0 3-1.5 0 2.5-1 4.5-3 4.5-5 3-12 2-15 0z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 13.5c3-3 8-3.5 12-1.5" stroke="#E84A27" stroke-width="2"/><path d="M8.5 11v4M12 10.5v4.5M15.5 11.5v3" stroke="#E84A27" stroke-width="1.5"/><circle cx="6.5" cy="13" r="0.9" fill="#181615"/>`,

  // Street Food & Skewers
  street_food: `<path d="M4 20L20 4" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="8.5" r="3" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><rect x="9.5" y="10.5" width="5" height="4" rx="1.5" transform="rotate(-45 9.5 10.5)" fill="#FAF7F2" stroke="#181615" stroke-width="1.5"/><circle cx="8" cy="16" r="2.6" fill="#E84A27" stroke="#181615" stroke-width="1.5"/>`,

  // Sweets & Desserts
  dessert: `<path d="M12 21L7 12H17L12 21Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="8.5" r="4" fill="#E84A27" stroke="#181615" stroke-width="1.5"/>`,

  // Artisanal Gelato & Ice Cream
  gelato: `<path d="M7 13a3.5 3.5 0 0 1 5.5-2.8A3.5 3.5 0 0 1 17 13" fill="#E84A27" opacity="0.85" stroke="#181615" stroke-width="1.8"/><path d="M5.5 13h13l-1.5 6.5a1.5 1.5 0 0 1-1.5 1.2h-7a1.5 1.5 0 0 1-1.5-1.2L5.5 13z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M16 6l2.5 5" stroke="#181615" stroke-width="1.8"/>`,

  // Craft Cocktails & Bars
  drinks: `<path d="M4.5 6C4.5 11 8 13.5 12 13.5C16 13.5 19.5 11 19.5 6H4.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.2 8.5C7.2 11 9.2 12 12 12C14.8 12 16.8 11 17.8 8.5H6.2Z" fill="#E84A27"/><path d="M12 13.5V20M8.5 20H15.5" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/>`,

  // Low-Intervention Natural Wine & Cider
  natural_wine: `<path d="M7 3h3v4l2 3.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8.5L7 7V3z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M5 13h7v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6z" fill="#E84A27" opacity="0.85"/><path d="M15 9h5l-.6 4a2.2 2.2 0 0 1-4.4 0L15 9z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M15.4 11.5h4.2c-.2 1.2-1 2-2.1 2s-1.9-.8-2.1-2z" fill="#E84A27"/><path d="M17.5 15v5M15.5 20h4" stroke="#181615" stroke-width="1.8"/>`,

  // Avocado & Specialty Brunch Toast
  brunch: `<path d="M5 9c0-2.5 3-4 7-4s7 1.5 7 4c0 1.2-.5 2.2-1.2 2.8L17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l-.8-6.2C5.5 11.2 5 10.2 5 9z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><circle cx="12" cy="13" r="3.8" fill="#4E8752" opacity="0.3" stroke="#4E8752" stroke-width="1.5"/><circle cx="12" cy="13" r="1.8" fill="#E84A27"/>`,

  // Pop-Up Residency Ticket Stub
  popup: `<path d="M3.5 7C3.5 6.2 4.2 5.5 5 5.5H19C19.8 5.5 20.5 6.2 20.5 7V10C19.4 10 18.5 10.9 18.5 12C18.5 13.1 19.4 14 20.5 14V17C20.5 17.8 19.8 18.5 19 18.5H5C4.2 18.5 3.5 17.8 3.5 17V14C4.6 14 5.5 13.1 5.5 12C5.5 10.9 4.6 10 3.5 10V7Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 6V18" stroke="#181615" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="6" cy="12" r="1.2" fill="#E84A27"/><path d="M11 9.5H17M11 12H16M11 14.5H14" stroke="#181615" stroke-width="1.4" stroke-linecap="round"/><circle cx="16.8" cy="14" r="1.6" fill="#E84A27"/>`,

  // DIETARY TAGS & BADGES
  halal: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M13.8 8.2a4.5 4.5 0 1 0 0 7.6 3.8 3.8 0 1 1 0-7.6z" fill="#4E8752" stroke="#181615" stroke-width="1.6"/><polygon points="15.5,10.2 16.1,11.4 17.4,11.6 16.4,12.5 16.7,13.8 15.5,13.1 14.3,13.8 14.6,12.5 13.6,11.6 14.9,11.4" fill="#E84A27"/>`,

  gluten_free: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M9 15l6-6M10.5 10.5c-.8-.8-.8-2 0-2.8.8.8 2 .8 2.8 0M13.5 13.5c.8.8 2 .8 2.8 0-.8-.8-.8-2 0-2.8" stroke="#4E8752" stroke-width="1.7"/><path d="M5.7 5.7l12.6 12.6" stroke="#E84A27" stroke-width="2"/>`,

  vegan: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M12 16.5C12 13 14.5 10 18 10C18 13.5 15.5 16.5 12 16.5Z" fill="#4E8752" stroke="#181615" stroke-width="1.4"/><path d="M12 16.5C12 13.5 10 11.5 7 11.5C7 14.5 9 16.5 12 16.5Z" fill="#4E8752" opacity="0.8" stroke="#181615" stroke-width="1.4"/><path d="M12 16.5V11" stroke="#FAF7F2" stroke-width="1.4"/>`,

  vegetarian: `<circle cx="12" cy="12" r="9" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M7 16.5C7 10.5 12 7.5 17 7.5C17 13.5 12 16.5 7 16.5Z" fill="#4E8752" stroke="#181615" stroke-width="1.6"/><path d="M7 16.5C10 14 13.5 11 17 7.5" stroke="#FAF7F2" stroke-width="1.5"/>`,

  spicy: `<path d="M14.5 3.5C13.5 5 12.5 5.5 11.5 6" stroke="#4E8752" stroke-width="1.8"/><path d="M11 6C6 8 4 13 6 17.5C7.5 20.5 11 21 13.5 19.5C17.5 17 19.5 12 18 7.5C16.8 6.2 13.5 5.8 11 6Z" fill="#E84A27" stroke="#181615" stroke-width="1.8"/><path d="M13.5 7C14.5 9.5 14 13 11.5 16" stroke="#FAF7F2" stroke-width="1.5" stroke-linecap="round"/>`,

  // SPOT TYPES & VENUES
  storefront: `<path d="M3 9.5L4.5 4.5H19.5L21 9.5V10.5C21 11.6 20.1 12.5 19 12.5C17.9 12.5 17 11.6 17 10.5C17 11.6 16.1 12.5 15 12.5C13.9 12.5 13 11.6 13 10.5C13 11.6 12.1 12.5 11 12.5C9.9 12.5 9 11.6 9 10.5C9 11.6 8.1 12.5 7 12.5C5.9 12.5 5 11.6 5 10.5C5 11.6 4.1 12.5 3 12.5V9.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 12.5V19.5C4 20.1 4.4 20.5 5 20.5H19C19.6 20.5 20 20.1 20 19.5V12.5" stroke="#181615" stroke-width="1.6"/><path d="M9 20.5V15H15V20.5" stroke="#E84A27" stroke-width="1.6" stroke-linejoin="round" fill="#FAF7F2"/><path d="M7 7.5L8 10M12 7.5V10M17 7.5L16 10" stroke="#E84A27" stroke-width="1.3" stroke-linecap="round"/>`,

  food_truck: `<path d="M2.5 7C2.5 5.9 3.4 5 4.5 5H15.5V15.5H2.5V7Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M15.5 8H19L21.5 12V15.5H15.5V8Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 8H12V12H5V8Z" fill="#E84A27" stroke="#181615" stroke-width="1.4"/><circle cx="6.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><circle cx="6.5" cy="18" r="0.8" fill="#E84A27"/><circle cx="17.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><circle cx="17.5" cy="18" r="0.8" fill="#E84A27"/><path d="M9 16H15M2.5 16H4.2M20 16H21.5" stroke="#181615" stroke-width="1.6" stroke-linecap="round"/>`,

  tiktok: `<rect x="4" y="3.5" width="16" height="17" rx="3.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.8"/><path d="M14 6.5C14.5 7.8 15.6 8.8 17 9.2V11.2C15.8 11.1 14.8 10.6 14 9.8V14C14 16.2 12.2 18 10 18C7.8 18 6 16.2 6 14C6 11.8 7.8 10 10 10C10.4 10 10.7 10.1 11 10.2V12.3C10.7 12.1 10.4 12 10 12C8.9 12 8 12.9 8 14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14V6.5H14Z" fill="#E84A27" stroke="#181615" stroke-width="1.1"/>`,

  park: `<path d="M12 3.5C8.8 3.5 6.5 5.8 6.5 8.8C6.5 10.2 7.2 11.5 8.2 12.4C7.2 13.2 6.5 14.5 6.5 16C6.5 18.2 8.3 20 10.5 20H13.5C15.7 20 17.5 18.2 17.5 16C17.5 14.5 16.8 13.2 15.8 12.4C16.8 11.5 17.5 10.2 17.5 8.8C17.5 5.8 15.2 3.5 12 3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9V20" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><path d="M12 13L15 11M12 16L9.5 14.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/><path d="M4 20.5H20" stroke="#181615" stroke-width="1.8" stroke-linecap="round"/>`,
};

// Aliases for seamless backwards compatibility
SMAKR_ICON_SVG_BODIES.pho = SMAKR_ICON_SVG_BODIES.vietnamese;
SMAKR_ICON_SVG_BODIES.curry = SMAKR_ICON_SVG_BODIES.indian;
SMAKR_ICON_SVG_BODIES.pop_up = SMAKR_ICON_SVG_BODIES.popup;
SMAKR_ICON_SVG_BODIES.ticket_stub = SMAKR_ICON_SVG_BODIES.popup;
SMAKR_ICON_SVG_BODIES.wine_bar = SMAKR_ICON_SVG_BODIES.natural_wine;
SMAKR_ICON_SVG_BODIES.mandi_rice = SMAKR_ICON_SVG_BODIES.indian;
SMAKR_ICON_SVG_BODIES.middle_eastern = SMAKR_ICON_SVG_BODIES.kebab;
SMAKR_ICON_SVG_BODIES.outdoor_park = SMAKR_ICON_SVG_BODIES.park;

/**
 * Normalizes an icon name to match keys in SMAKR_ICON_SVG_BODIES
 */
export function normalizeSmakrIconName(name: string): string {
  return name.toLowerCase().trim().replace(/[\s-]/g, "_");
}

/**
 * Returns a standalone, self-contained SVG string for MapLibre GL radar markers and HTML injections.
 */
export function getFoodPinSvg(categoryOrTag: string, width = 22, height = 22): string {
  const key = normalizeSmakrIconName(categoryOrTag);
  const body = SMAKR_ICON_SVG_BODIES[key] || SMAKR_ICON_SVG_BODIES.all;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${width}" height="${height}" fill="none">${body}</svg>`;
}

/**
 * Dictionary mapping category keys to full SVG strings for MapLibre radar pins.
 * Wrapped in a proxy so any unexpected category defaults cleanly to the 'all' pin.
 */
const rawPinMap: Record<string, string> = Object.keys(SMAKR_ICON_SVG_BODIES).reduce(
  (acc, key) => {
    acc[key] = getFoodPinSvg(key);
    return acc;
  },
  {} as Record<string, string>
);

export const FOOD_PIN_SVG_MAP: Record<string, string> = new Proxy(rawPinMap, {
  get(target, prop: string) {
    if (typeof prop === "string" && prop in target) {
      return target[prop];
    }
    return getFoodPinSvg(typeof prop === "string" ? prop : "all");
  },
});

export interface SmakrFoodIconProps {
  name: string;
  className?: string;
  title?: string;
  monochrome?: boolean;
}

/**
 * Universal Smakr Duotone Food & Dietary Vector Icon component
 */
export function SmakrFoodIcon({
  name,
  className = "w-4 h-4",
  title,
  monochrome = false,
}: SmakrFoodIconProps) {
  const key = normalizeSmakrIconName(name);
  let body = SMAKR_ICON_SVG_BODIES[key] || SMAKR_ICON_SVG_BODIES.all;

  // In monochrome mode, replace ink stroke with currentColor
  if (monochrome) {
    body = body.replace(/#181615/g, "currentColor");
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label={title || name}
      role={title ? "img" : "presentation"}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

// =============================================================================
// BACKWARDS-COMPATIBLE NAMED COMPONENT EXPORTS (thin wrappers around SmakrFoodIcon)
// =============================================================================
export const AllFoodIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="all" className={className} />
);
export const BakeryIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="bakery" className={className} />
);
export const SourdoughIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="sourdough" className={className} />
);
export const CoffeeIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="coffee" className={className} />
);
export const MatchaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="matcha" className={className} />
);
export const BobaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="boba" className={className} />
);
export const RamenIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="ramen" className={className} />
);
export const BurgerIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="burger" className={className} />
);
export const PizzaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="pizza" className={className} />
);
export const TacoIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="tacos" className={className} />
);
export const DumplingIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="dumplings" className={className} />
);
export const PastaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="pasta" className={className} />
);
export const FriedChickenIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="fried_chicken" className={className} />
);
export const KbbqIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="kbbq" className={className} />
);
export const KebabIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="kebab" className={className} />
);
export const PhoIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="vietnamese" className={className} />
);
export const CurryIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="indian" className={className} />
);
export const SushiIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="sushi" className={className} />
);
export const NordicSeafoodIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="nordic_seafood" className={className} />
);
export const StreetFoodIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="street_food" className={className} />
);
export const DessertIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="dessert" className={className} />
);
export const GelatoIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="gelato" className={className} />
);
export const DrinksIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="drinks" className={className} />
);
export const NaturalWineIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="natural_wine" className={className} />
);
export const BrunchIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="brunch" className={className} />
);
export const TicketStubIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="popup" className={className} />
);
export const StorefrontIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="storefront" className={className} />
);
export const FoodTruckIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="food_truck" className={className} />
);
export const TikTokVideoIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="tiktok" className={className} />
);
export const OutdoorParkIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="park" className={className} />
);
export const WineBarIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="natural_wine" className={className} />
);

// Dietary Badges
export const HalalIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="halal" className={className} />
);
export const GlutenFreeIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="gluten_free" className={className} />
);
export const VeganIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="vegan" className={className} />
);
export const VegetarianIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="vegetarian" className={className} />
);
export const SpicyIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <SmakrFoodIcon name="spicy" className={className} />
);
