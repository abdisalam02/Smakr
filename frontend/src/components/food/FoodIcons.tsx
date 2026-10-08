"use client";

import React from "react";

interface IconProps {
  className?: string;
}

// 1. All / Discover Sparkle
export function AllFoodIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#ffedd5" stroke="#e84a27" strokeWidth="1.5" />
      <path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="#e84a27" />
    </svg>
  );
}

// 2. Bakery & Pastries (Golden Artisan Croissant / Bun)
export function BakeryIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 14C3 10.5 5.5 6.5 12 6.5C18.5 6.5 21 10.5 20 14C19.5 16 17 17.5 15 16C13.5 15 13 13.5 12 13.5C11 13.5 10.5 15 9 16C7 17.5 4.5 16 4 14Z"
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 8.5C9 10 10.5 11 12 11C13.5 11 15 10 16 8.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 13.5C10.5 14.2 11.2 14.5 12 14.5C12.8 14.5 13.5 14.2 14.5 13.5" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 3. Vietnamese & Specialty Coffee (Phin brew / Iced Coconut Coffee)
export function CoffeeIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Cup */}
      <path d="M5 8H17V15C17 17.8 14.8 20 12 20C9.2 20 7 17.8 7 15V8H5Z" fill="#78350f" stroke="#451a03" strokeWidth="1.4" />
      {/* Coconut foam / cream layer */}
      <path d="M5 8H17V11H5V8Z" fill="#ffedd5" />
      {/* Handle */}
      <path d="M17 9H19.5C20.6 9 21.5 9.9 21.5 11C21.5 12.1 20.6 13 19.5 13H17" stroke="#451a03" strokeWidth="1.4" strokeLinecap="round" />
      {/* Steam lines */}
      <path d="M8 3.5C8 4.5 9 5 9 6" stroke="#e84a27" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 2.5C12 3.5 13 4 13 5.5" stroke="#e84a27" strokeWidth="1.2" strokeLinecap="round" />
      {/* Saucer */}
      <path d="M4 21H18" stroke="#451a03" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 4. Ramen (Steaming Bowl with Chopsticks & Tamago)
export function RamenIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Bowl */}
      <path d="M3 11C3 16.5 7 20 12 20C17 20 21 16.5 21 11H3Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.4" />
      {/* Broth surface */}
      <ellipse cx="12" cy="11" rx="9" ry="2.2" fill="#fbbf24" />
      {/* Halved Ajitsuke Egg */}
      <ellipse cx="9" cy="11" rx="2.5" ry="1.6" fill="#ffffff" />
      <circle cx="9" cy="11" r="1.1" fill="#f97316" />
      {/* Nori sheet */}
      <rect x="14" y="8" width="3" height="4.5" rx="0.5" fill="#18181b" />
      {/* Chopsticks */}
      <path d="M2 4L18 9M2 2L18 8.5" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// 5. Smash Burger (Toasted Bun, Cheese Drip, Crispy Patty)
export function BurgerIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Top Bun */}
      <path d="M4 11C4 7 7.5 4.5 12 4.5C16.5 4.5 20 7 20 11H4Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.4" />
      {/* Sesame seeds */}
      <circle cx="9" cy="7.5" r="0.6" fill="#ffffff" />
      <circle cx="12" cy="6.5" r="0.6" fill="#ffffff" />
      <circle cx="15" cy="7.5" r="0.6" fill="#ffffff" />
      {/* Lettuce */}
      <path d="M3.5 12.5C5 11.5 7 13.5 9 12.5C11 11.5 13 13.5 15 12.5C17 11.5 19 13.5 20.5 12.5" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" />
      {/* Melted Cheese */}
      <path d="M4 14L8 14L10 16L12 14L20 14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.4" />
      {/* Patty */}
      <rect x="4" y="14.5" width="16" height="2.5" rx="1.2" fill="#78350f" />
      {/* Bottom Bun */}
      <path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.4" />
    </svg>
  );
}

// 6. Artisanal Pizza (Neapolitan Slice with Pepperoni & Mozzarella)
export function PizzaIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Crust / Slice */}
      <path d="M12 2.5L3 19C7 21.5 17 21.5 21 19L12 2.5Z" fill="#fef08a" stroke="#b45309" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Crust rim */}
      <path d="M3 19C7 21.5 17 21.5 21 19" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pepperoni Slices */}
      <circle cx="12" cy="11" r="1.8" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
      <circle cx="9" cy="15.5" r="1.6" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
      <circle cx="15" cy="15.5" r="1.6" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
      {/* Basil flake */}
      <path d="M12 14C12.5 13.5 13.5 13.5 13.5 14C13.5 14.5 12.5 14.5 12 14Z" fill="#16a34a" />
    </svg>
  );
}

// 7. Street Food & Tacos (Crisp Shell with Fresh Fillings)
export function TacoIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Taco Folded Shell */}
      <path d="M3 16C3 8.5 7.5 4.5 12 4.5C16.5 4.5 21 8.5 21 16H3Z" fill="#fcd34d" stroke="#d97706" strokeWidth="1.4" />
      {/* Lettuce / Cilantro Layer */}
      <path d="M5 14C7 12 9 13.5 11 12C13 13.5 15 12 17 13.5C18.5 12.5 19.5 13 20 14" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
      {/* Diced meat & tomatoes */}
      <circle cx="8" cy="10" r="1.2" fill="#ef4444" />
      <circle cx="12" cy="8.5" r="1.2" fill="#78350f" />
      <circle cx="15.5" cy="9.5" r="1.2" fill="#ef4444" />
      {/* Bottom fold line */}
      <path d="M3 16C7 18 17 18 21 16" stroke="#b45309" strokeWidth="1.4" />
    </svg>
  );
}

// 8. Sushi & Seafood (Fresh Salmon Nigiri & Roe)
export function SushiIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Rice Base */}
      <rect x="5" y="11" width="14" height="6.5" rx="3.2" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.2" />
      {/* Salmon Slice */}
      <path d="M4 11C4 8.5 7 7.5 12 7.5C17 7.5 20 8.5 20 11C20 12.5 17 13.5 12 13.5C7 13.5 4 12.5 4 11Z" fill="#fb7185" stroke="#e11d48" strokeWidth="1.2" />
      {/* Salmon fat marbling stripes */}
      <path d="M8 8.5L9.5 12.5M12 8L13.5 13M16 8.5L17.5 12.5" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.85" />
      {/* Nori Belt */}
      <rect x="10.5" y="7.5" width="3" height="10" rx="0.5" fill="#18181b" />
    </svg>
  );
}

// 9. Sweets & Gelato (Artisan Swirled Soft-Serve Cone)
export function DessertIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Waffle Cone */}
      <path d="M12 21.5L6.5 11.5H17.5L12 21.5Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.3" />
      <path d="M9 13.5L14.5 18.5M15 13.5L9.5 18.5" stroke="#d97706" strokeWidth="0.8" />
      {/* Swirl Base */}
      <path d="M6 11.5C6 9.5 8.5 9.5 12 9.5C15.5 9.5 18 9.5 18 11.5H6Z" fill="#f472b6" />
      {/* Swirl Top */}
      <circle cx="12" cy="7.5" r="3.8" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" />
      <path d="M12 4C13 2.5 14 3.5 13.5 4.5" stroke="#db2777" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 10. Craft Cocktails & Natural Wine
export function DrinksIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Coupe Glass Bowl */}
      <path d="M4 6C4 11 8 13.5 12 13.5C16 13.5 20 11 20 6H4Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.4" />
      {/* Cocktail liquid */}
      <path d="M5.5 8C6.5 11 8.5 12.2 12 12.2C15.5 12.2 17.5 11 18.5 8H5.5Z" fill="#f43f5e" />
      {/* Stem & Base */}
      <path d="M12 13.5V20.5M8 20.5H16" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
      {/* Citrus wheel / garnish */}
      <circle cx="16.5" cy="5.5" r="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
    </svg>
  );
}

// Helper dictionary of raw SVG strings for MapLibre map pins
export const FOOD_PIN_SVG_MAP: Record<string, string> = {
  all: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="12" r="10" fill="#ffedd5" stroke="#e84a27" stroke-width="1.5"/><path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="#e84a27"/></svg>`,
  bakery: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 14C3 10.5 5.5 6.5 12 6.5C18.5 6.5 21 10.5 20 14C19.5 16 17 17.5 15 16C13.5 15 13 13.5 12 13.5C11 13.5 10.5 15 9 16C7 17.5 4.5 16 4 14Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.4"/><path d="M8 8.5C9 10 10.5 11 12 11C13.5 11 15 10 16 8.5" stroke="#d97706" stroke-width="1.3"/></svg>`,
  coffee: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M5 8H17V15C17 17.8 14.8 20 12 20C9.2 20 7 17.8 7 15V8H5Z" fill="#78350f" stroke="#451a03" stroke-width="1.4"/><path d="M5 8H17V11H5V8Z" fill="#ffedd5"/><path d="M17 9H19.5C20.6 9 21.5 9.9 21.5 11C21.5 12.1 20.6 13 19.5 13H17" stroke="#451a03" stroke-width="1.4"/></svg>`,
  ramen: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M3 11C3 16.5 7 20 12 20C17 20 21 16.5 21 11H3Z" fill="#ef4444" stroke="#991b1b" stroke-width="1.4"/><ellipse cx="12" cy="11" rx="9" ry="2.2" fill="#fbbf24"/><circle cx="9" cy="11" r="1.5" fill="#f97316"/><rect x="14" y="8" width="3" height="4.5" rx="0.5" fill="#18181b"/><path d="M2 4L18 9" stroke="#78350f" stroke-width="1.3"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 11C4 7 7.5 4.5 12 4.5C16.5 4.5 20 7 20 11H4Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.4"/><circle cx="12" cy="7" r="0.8" fill="#fff"/><path d="M3.5 12.5C7 11.5 11 13.5 15 12.5C18 11.5 20.5 12.5 20.5 12.5" stroke="#22c55e" stroke-width="1.6"/><path d="M4 14L8 14L10 16L12 14L20 14" fill="#fbbf24"/><rect x="4" y="14.5" width="16" height="2.5" rx="1.2" fill="#78350f"/><path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.4"/></svg>`,
  pizza: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2.5L3 19C7 21.5 17 21.5 21 19L12 2.5Z" fill="#fef08a" stroke="#b45309" stroke-width="1.4"/><path d="M3 19C7 21.5 17 21.5 21 19" stroke="#b45309" stroke-width="2.5"/><circle cx="12" cy="11" r="1.8" fill="#ef4444"/><circle cx="9" cy="15.5" r="1.5" fill="#ef4444"/><circle cx="15" cy="15.5" r="1.5" fill="#ef4444"/></svg>`,
  street_food: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M3 16C3 8.5 7.5 4.5 12 4.5C16.5 4.5 21 8.5 21 16H3Z" fill="#fcd34d" stroke="#d97706" stroke-width="1.4"/><path d="M5 14C8 12 12 13 16 12C18 12.5 20 14 20 14" stroke="#16a34a" stroke-width="1.8"/><circle cx="9" cy="9.5" r="1.2" fill="#ef4444"/><circle cx="14" cy="9" r="1.2" fill="#78350f"/></svg>`,
  sushi: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="5" y="11" width="14" height="6.5" rx="3.2" fill="#ffffff" stroke="#d1d5db" stroke-width="1.2"/><path d="M4 11C4 8.5 7 7.5 12 7.5C17 7.5 20 8.5 20 11C20 12.5 17 13.5 12 13.5C7 13.5 4 12.5 4 11Z" fill="#fb7185" stroke="#e11d48" stroke-width="1.2"/><path d="M8 8.5L9.5 12.5M12 8L13.5 13" stroke="#ffffff" stroke-width="0.9"/><rect x="10.5" y="7.5" width="3" height="10" rx="0.5" fill="#18181b"/></svg>`,
  dessert: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 21.5L6.5 11.5H17.5L12 21.5Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.3"/><circle cx="12" cy="8" r="4" fill="#f472b6" stroke="#db2777" stroke-width="1.2"/></svg>`,
  drinks: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 6C4 11 8 13.5 12 13.5C16 13.5 20 11 20 6H4Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.4"/><path d="M5.5 8C7 11 9 12.2 12 12.2C15 12.2 17 11 18.5 8H5.5Z" fill="#f43f5e"/><path d="M12 13.5V20.5M8 20.5H16" stroke="#0284c7" stroke-width="1.4"/><circle cx="16.5" cy="5.5" r="2.2" fill="#facc15"/></svg>`,
};
