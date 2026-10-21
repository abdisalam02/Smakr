"use client";

import React from "react";

interface IconProps {
  className?: string;
}

// 1. All / Discover Sparkle
export function AllFoodIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" />
      <path d="M12 5.5L13.8 10.2L18.5 12L13.8 13.8L12 18.5L10.2 13.8L5.5 12L10.2 10.2L12 5.5Z" fill="#E84A27" stroke="#181615" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

// 2. Bakery & Pastries (Flaky Layered Croissant)
export function BakeryIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 14.5C2.5 10 6 6.5 12 6.5C18 6.5 21.5 10 20.5 14.5C19.8 17 17.2 18 15.2 16.2C13.8 15 13 13.8 12 13.8C11 13.8 10.2 15 8.8 16.2C6.8 18 4.2 17 3.5 14.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 7.5C9.2 10 10.5 11.2 12 11.2C13.5 11.2 14.8 10 16 7.5" fill="#E84A27" fillOpacity="0.22" stroke="#E84A27" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 10.5L8.5 14M17.5 10.5L15.5 14" stroke="#181615" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 3. Coffee & Drinks (Specialty Cup with Steam)
export function CoffeeIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 8.5H16.5V14.5C16.5 17.5 14.2 19.8 10.8 19.8C7.4 19.8 5 17.5 5 14.5V8.5Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 8.5H16.5V11.5H5V8.5Z" fill="#E84A27" />
      <path d="M16.5 9.5H18.8C20 9.5 21 10.5 21 11.8C21 13.1 20 14 18.8 14H16.5" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 3.5C8.5 4.8 9.5 5.2 9.5 6.5M12.8 3C12.8 4.3 13.8 4.8 13.8 6.2" stroke="#E84A27" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 4. Ramen (Steaming Noodle Bowl & Chopsticks)
export function RamenIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 11.5C3 16.8 6.8 20 12 20C17.2 20 21 16.8 21 11.5H3Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4.5 14.5H19.5" stroke="#E84A27" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10.5" r="1.8" fill="#E84A27" stroke="#181615" strokeWidth="1.2" />
      <path d="M3 5L19 8.5M3 3L19 7" stroke="#181615" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 5. Smash Burger (Stacked Bun, Cheese & Crispy Patty)
export function BurgerIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 10.5C4 6.8 7.5 4.5 12 4.5C16.5 4.5 20 6.8 20 10.5H4Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 13H20.5" stroke="#E84A27" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 13L9.5 15.5L12 13" fill="#E84A27" />
      <rect x="4" y="14.5" width="16" height="2.4" rx="1.2" fill="#181615" />
      <path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

// 6. Artisanal Pizza (Neapolitan Slice with Pepperoni)
export function PizzaIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L3.5 19C7.5 21.5 16.5 21.5 20.5 19L12 3Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 18C8 20.2 16 20.2 20 18" stroke="#181615" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="11" r="1.8" fill="#E84A27" />
      <circle cx="9.2" cy="15.2" r="1.5" fill="#E84A27" />
      <circle cx="14.8" cy="15.2" r="1.5" fill="#E84A27" />
    </svg>
  );
}

// 7. Tacos (Folded Tortilla Shell with Fillings)
export function TacoIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 16.5C3 9 7.2 5 12 5C16.8 5 21 9 21 16.5C16.5 18.2 7.5 18.2 3 16.5Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.5 13.5C7.5 11.5 9.5 13 11.5 11.5C13.5 13 15.5 11.5 18.5 13.5" stroke="#E84A27" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1.3" fill="#E84A27" />
      <circle cx="14.5" cy="9.5" r="1.3" fill="#181615" />
    </svg>
  );
}

// 8. Street Food (Skewer / Bao Street Cart)
export function StreetFoodIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20L20 4" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="15.5" cy="8.5" r="3" fill="#E84A27" stroke="#181615" strokeWidth="1.5" />
      <rect x="9.5" y="10.5" width="5" height="4" rx="1.5" transform="rotate(-45 9.5 10.5)" fill="#FAF7F2" stroke="#181615" strokeWidth="1.5" />
      <circle cx="8" cy="16" r="2.6" fill="#E84A27" stroke="#181615" strokeWidth="1.5" />
    </svg>
  );
}

// 9. Sushi & Seafood (Nigiri)
export function SushiIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11.5" width="14" height="6" rx="3" fill="#FAF7F2" stroke="#181615" strokeWidth="1.5" />
      <path d="M4 11C4 8.2 7 7.2 12 7.2C17 7.2 20 8.2 20 11C20 12.5 17 13.2 12 13.2C7 13.2 4 12.5 4 11Z" fill="#E84A27" stroke="#181615" strokeWidth="1.5" />
      <rect x="10.5" y="7" width="3" height="10.5" rx="0.5" fill="#181615" />
    </svg>
  );
}

// 10. Sweets & Gelato
export function DessertIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21L7 12H17L12 21Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="8.5" r="4" fill="#E84A27" stroke="#181615" strokeWidth="1.5" />
    </svg>
  );
}

// 11. Craft Cocktails & Natural Wine
export function DrinksIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 6C4.5 11 8 13.5 12 13.5C16 13.5 19.5 11 19.5 6H4.5Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.2 8.5C7.2 11 9.2 12 12 12C14.8 12 16.8 11 17.8 8.5H6.2Z" fill="#E84A27" />
      <path d="M12 13.5V20M8.5 20H15.5" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 12. Matcha & Ceremonial Tea (Green Chawan Bowl & Frothy Swirl)
export function MatchaIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Ceremonial Chawan ceramic bowl */}
      <path
        d="M3.5 10.5C3.5 16.2 7.2 19.8 12 19.8C16.8 19.8 20.5 16.2 20.5 10.5H3.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Vibrant ceremonial matcha green liquid top */}
      <ellipse
        cx="12"
        cy="10.5"
        rx="8.5"
        ry="3"
        fill="#4E8752"
        stroke="#181615"
        strokeWidth="1.5"
      />
      {/* Delicate white micro-foam swirl inside the green matcha */}
      <path
        d="M8.5 10.5C9.8 9.6 11.5 11.4 13.5 10.2C14.5 9.7 15.2 10.3 15.8 10.7"
        stroke="#FAF7F2"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Matcha tea leaf / chasen whisk accent on top right */}
      <path
        d="M15.5 4.2C17.8 4.2 18.8 6 17.2 7.8C15.6 7.8 14.5 6.2 15.5 4.2Z"
        fill="#4E8752"
        stroke="#181615"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 13. Handmade Pasta
export function PastaIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12.5C3 17.2 7 20 12 20C17 20 21 17.2 21 12.5H3Z" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 11.5C8.5 9 11 12.5 13 9.5C15 12 17.5 9.5 18.5 11.5" stroke="#E84A27" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="10.5" r="2" fill="#E84A27" stroke="#181615" strokeWidth="1.2" />
    </svg>
  );
}

// 14. Dumplings, Dim Sum & Gyoza (Pleated Upright Scalloped Gyoza Pouch)
export function DumplingIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Scalloped pleated top rim + plump gyoza belly */}
      <path
        d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Distinct pleated dumpling folds radiating from the top crimp */}
      <path
        d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5"
        stroke="#E84A27"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Pan-seared golden-crisp base */}
      <path
        d="M5.5 16.2C8.5 17.6 15.5 17.6 18.5 16.2"
        stroke="#E84A27"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 15. Fried Chicken & Korean
export function FriedChickenIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8.5 6C5.5 6 3.5 8.5 4 11.5C4.5 14.5 7.5 16 10.5 15.5L15.5 19.5C16.5 20.3 18 19.5 17.5 18.2L15 13.5C16.5 10.8 14.8 6 8.5 6Z"
        fill="#E84A27"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="18.2" cy="18.8" r="2" fill="#FAF7F2" stroke="#181615" strokeWidth="1.4" />
      <circle cx="16.2" cy="20.2" r="1.8" fill="#FAF7F2" stroke="#181615" strokeWidth="1.4" />
    </svg>
  );
}

// 16. Kebab, Shawarma & Falafel Wrap
export function KebabIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9.5C6 6.5 8.7 4.5 12 4.5C15.3 4.5 18 6.5 18 9.5L15.5 19.5H8.5L6 9.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 9.5C9.5 8 14.5 8 16.5 9.5"
        stroke="#E84A27"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="10.2" cy="7.5" r="1.4" fill="#4E8752" />
      <circle cx="13.8" cy="7.5" r="1.4" fill="#E84A27" />
    </svg>
  );
}

// 17. Pho & Vietnamese Herb Bowl
export function PhoIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 11.5C3.5 16.8 7.2 20 12 20C16.8 20 20.5 16.8 20.5 11.5H3.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6.5 11.5C8.5 9.2 11 11.5 13.5 9.2C15.2 10.8 17 9.5 18 11.5" stroke="#E84A27" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 6C9.5 7.5 10.5 8.5 10.5 9.5M14.5 5.5C14.5 7 15.5 8 15.5 9.2" stroke="#4E8752" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 18. Indian & Curry
export function CurryIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 13C5 10 8 8.5 11.5 8.5C15 8.5 19 10 19 13H5Z"
        fill="#E84A27"
        stroke="#181615"
        strokeWidth="1.5"
      />
      <circle cx="9.5" cy="11" r="1.2" fill="#FAF7F2" />
      <circle cx="14" cy="11.2" r="1.2" fill="#FAF7F2" />
    </svg>
  );
}

// 19. Pop-up & Residency Event Ticket Stub
export function TicketStubIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 7C3.5 6.2 4.2 5.5 5 5.5H19C19.8 5.5 20.5 6.2 20.5 7V10C19.4 10 18.5 10.9 18.5 12C18.5 13.1 19.4 14 20.5 14V17C20.5 17.8 19.8 18.5 19 18.5H5C4.2 18.5 3.5 17.8 3.5 17V14C4.6 14 5.5 13.1 5.5 12C5.5 10.9 4.6 10 3.5 10V7Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 6V18"
        stroke="#181615"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx="6" cy="12" r="1.2" fill="#E84A27" />
      <path
        d="M11 9.5H17M11 12H16M11 14.5H14"
        stroke="#181615"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="16.8" cy="14" r="1.6" fill="#E84A27" />
    </svg>
  );
}

// 20. Permanent Spot / Storefront
export function StorefrontIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 9.5L4.5 4.5H19.5L21 9.5V10.5C21 11.6 20.1 12.5 19 12.5C17.9 12.5 17 11.6 17 10.5C17 11.6 16.1 12.5 15 12.5C13.9 12.5 13 11.6 13 10.5C13 11.6 12.1 12.5 11 12.5C9.9 12.5 9 11.6 9 10.5C9 11.6 8.1 12.5 7 12.5C5.9 12.5 5 11.6 5 10.5C5 11.6 4.1 12.5 3 12.5V9.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M4 12.5V19.5C4 20.1 4.4 20.5 5 20.5H19C19.6 20.5 20 20.1 20 19.5V12.5" stroke="#181615" strokeWidth="1.6" />
      <path d="M9 20.5V15H15V20.5" stroke="#E84A27" strokeWidth="1.6" strokeLinejoin="round" fill="#FAF7F2" />
      <path d="M7 7.5L8 10M12 7.5V10M17 7.5L16 10" stroke="#E84A27" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// 21. Food Truck
export function FoodTruckIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2.5 7C2.5 5.9 3.4 5 4.5 5H15.5V15.5H2.5V7Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8H19L21.5 12V15.5H15.5V8Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 8H12V12H5V8Z" fill="#E84A27" stroke="#181615" strokeWidth="1.4" />
      <circle cx="6.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" />
      <circle cx="6.5" cy="18" r="0.8" fill="#E84A27" />
      <circle cx="17.5" cy="18" r="2.2" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" />
      <circle cx="17.5" cy="18" r="0.8" fill="#E84A27" />
      <path d="M9 16H15M2.5 16H4.2M20 16H21.5" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 22. TikTok / Mobile Food Video
export function TikTokVideoIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="3.5" fill="#FAF7F2" stroke="#181615" strokeWidth="1.6" />
      <path
        d="M14 6.5C14.5 7.8 15.6 8.8 17 9.2V11.2C15.8 11.1 14.8 10.6 14 9.8V14C14 16.2 12.2 18 10 18C7.8 18 6 16.2 6 14C6 11.8 7.8 10 10 10C10.4 10 10.7 10.1 11 10.2V12.3C10.7 12.1 10.4 12 10 12C8.9 12 8 12.9 8 14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14V6.5H14Z"
        fill="#E84A27"
        stroke="#181615"
        strokeWidth="1.1"
      />
    </svg>
  );
}

// 23. Outdoor / Park / Square Location
export function OutdoorParkIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5C8.8 3.5 6.5 5.8 6.5 8.8C6.5 10.2 7.2 11.5 8.2 12.4C7.2 13.2 6.5 14.5 6.5 16C6.5 18.2 8.3 20 10.5 20H13.5C15.7 20 17.5 18.2 17.5 16C17.5 14.5 16.8 13.2 15.8 12.4C16.8 11.5 17.5 10.2 17.5 8.8C17.5 5.8 15.2 3.5 12 3.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 9V20" stroke="#E84A27" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13L15 11M12 16L9.5 14.5" stroke="#E84A27" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 20.5H20" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 24. Wine Bar & Craft Beer Host Venue
export function WineBarIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5.5 5.5C5.5 10 9 12.5 12 12.5C15 12.5 18.5 10 18.5 5.5H5.5Z"
        fill="#FAF7F2"
        stroke="#181615"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 7.5C8.5 10 10.5 11 12 11C13.5 11 15.5 10 17 7.5H7Z" fill="#E84A27" />
      <path d="M12 12.5V19.5M8.5 19.5H15.5" stroke="#181615" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Helper dictionary of raw SVG strings for MapLibre map pins (Smakr Duotone #181615 + #E84A27 + Matcha #4E8752)
export const FOOD_PIN_SVG_MAP: Record<string, string> = {
  all: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="12" r="9.5" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M12 5.5L13.8 10.2L18.5 12L13.8 13.8L12 18.5L10.2 13.8L5.5 12L10.2 10.2L12 5.5Z" fill="#E84A27" stroke="#181615" stroke-width="1.1"/></svg>`,
  popup: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3.5 7C3.5 6.2 4.2 5.5 5 5.5H19C19.8 5.5 20.5 6.2 20.5 7V10C19.4 10 18.5 10.9 18.5 12C18.5 13.1 19.4 14 20.5 14V17C20.5 17.8 19.8 18.5 19 18.5H5C4.2 18.5 3.5 17.8 3.5 17V14C4.6 14 5.5 13.1 5.5 12C5.5 10.9 4.6 10 3.5 10V7Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 6V18" stroke="#181615" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="6" cy="12" r="1.2" fill="#E84A27"/><path d="M11 9.5H17M11 12H16M11 14.5H14" stroke="#181615" stroke-width="1.4" stroke-linecap="round"/><circle cx="16.8" cy="14" r="1.6" fill="#E84A27"/></svg>`,
  dumplings: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 16.2C8.5 17.6 15.5 17.6 18.5 16.2" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  bao: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 15.5C3 11.5 5 8.5 7 7.2C7.8 5.8 9.2 5.8 10 7C10.8 5.5 13.2 5.5 14 7C14.8 5.8 16.2 5.8 17 7.2C19 8.5 21 11.5 21 15.5C21 17.8 17.2 19 12 19C6.8 19 3 17.8 3 15.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.2 7.5L8.8 12.5M10.2 7L11 12.8M13.8 7L13 12.8M16.8 7.5L15.2 12.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  bakery: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3.5 14.5C2.5 10 6 6.5 12 6.5C18 6.5 21.5 10 20.5 14.5C19.8 17 17.2 18 15.2 16.2C13.8 15 13 13.8 12 13.8C11 13.8 10.2 15 8.8 16.2C6.8 18 4.2 17 3.5 14.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M8 7.5C9.2 10 10.5 11.2 12 11.2C13.5 11.2 14.8 10 16 7.5" stroke="#E84A27" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  coffee: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M5 8.5H16.5V14.5C16.5 17.5 14.2 19.8 10.8 19.8C7.4 19.8 5 17.5 5 14.5V8.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M5 8.5H16.5V11.5H5V8.5Z" fill="#E84A27"/><path d="M16.5 9.5H18.8C20 9.5 21 10.5 21 11.8C21 13.1 20 14 18.8 14H16.5" stroke="#181615" stroke-width="1.6"/></svg>`,
  matcha: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3.5 10.5C3.5 16.2 7.2 19.8 12 19.8C16.8 19.8 20.5 16.2 20.5 10.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="12" cy="10.5" rx="8.5" ry="3" fill="#4E8752" stroke="#181615" stroke-width="1.5"/><path d="M8.5 10.5C9.8 9.6 11.5 11.4 13.5 10.2C14.5 9.7 15.2 10.3 15.8 10.7" stroke="#FAF7F2" stroke-width="1.3" stroke-linecap="round"/><path d="M15.5 4.2C17.8 4.2 18.8 6 17.2 7.8C15.6 7.8 14.5 6.2 15.5 4.2Z" fill="#4E8752" stroke="#181615" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  pasta: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 12.5C3 17.2 7 20 12 20C17 20 21 17.2 21 12.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M6.5 11.5C8.5 9 11 12.5 13 9.5C15 12 17.5 9.5 18.5 11.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="10.5" r="2" fill="#E84A27" stroke="#181615" stroke-width="1.2"/></svg>`,
  ramen: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 11.5C3 16.8 6.8 20 12 20C17.2 20 21 16.8 21 11.5H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M4.5 14.5H19.5" stroke="#E84A27" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="10.5" r="1.8" fill="#E84A27" stroke="#181615" stroke-width="1.2"/><path d="M3 5L19 8.5" stroke="#181615" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M4 10.5C4 6.8 7.5 4.5 12 4.5C16.5 4.5 20 6.8 20 10.5H4Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M3.5 13H20.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="14.5" width="16" height="2.4" rx="1.2" fill="#181615"/><path d="M5 17.5H19C19 19.5 16.5 20.5 12 20.5C7.5 20.5 5 19.5 5 17.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/></svg>`,
  pizza: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 3L3.5 19C7.5 21.5 16.5 21.5 20.5 19L12 3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M4 18C8 20.2 16 20.2 20 18" stroke="#181615" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="11" r="1.8" fill="#E84A27"/><circle cx="9.2" cy="15.2" r="1.5" fill="#E84A27"/><circle cx="14.8" cy="15.2" r="1.5" fill="#E84A27"/></svg>`,
  tacos: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 16.5C3 9 7.2 5 12 5C16.8 5 21 9 21 16.5C16.5 18.2 7.5 18.2 3 16.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M5.5 13.5C7.5 11.5 9.5 13 11.5 11.5C13.5 13 15.5 11.5 18.5 13.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.5" r="1.3" fill="#E84A27"/><circle cx="14.5" cy="9.5" r="1.3" fill="#181615"/></svg>`,
  street_food: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M4 20L20 4" stroke="#181615" stroke-width="1.6" stroke-linecap="round"/><circle cx="15.5" cy="8.5" r="3" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><rect x="9.5" y="10.5" width="5" height="4" rx="1.5" transform="rotate(-45 9.5 10.5)" fill="#FAF7F2" stroke="#181615" stroke-width="1.5"/><circle cx="8" cy="16" r="2.6" fill="#E84A27" stroke="#181615" stroke-width="1.5"/></svg>`,
  sushi: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="5" y="11.5" width="14" height="6" rx="3" fill="#FAF7F2" stroke="#181615" stroke-width="1.5"/><path d="M4 11C4 8.2 7 7.2 12 7.2C17 7.2 20 8.2 20 11C20 12.5 17 13.2 12 13.2C7 13.2 4 12.5 4 11Z" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><rect x="10.5" y="7" width="3" height="10.5" rx="0.5" fill="#181615"/></svg>`,
  dessert: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 21L7 12H17L12 21Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.5"/><circle cx="12" cy="8.5" r="4" fill="#E84A27" stroke="#181615" stroke-width="1.5"/></svg>`,
  drinks: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M4.5 6C4.5 11 8 13.5 12 13.5C16 13.5 19.5 11 19.5 6H4.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6"/><path d="M6.2 8.5C7.2 11 9.2 12 12 12C14.8 12 16.8 11 17.8 8.5H6.2Z" fill="#E84A27"/><path d="M12 13.5V20M8.5 20H15.5" stroke="#181615" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  fried_chicken: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M8.5 6C5.5 6 3.5 8.5 4 11.5C4.5 14.5 7.5 16 10.5 15.5L15.5 19.5C16.5 20.3 18 19.5 17.5 18.2L15 13.5C16.5 10.8 14.8 6 8.5 6Z" fill="#E84A27" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><circle cx="18.2" cy="18.8" r="2" fill="#FAF7F2" stroke="#181615" stroke-width="1.4"/><circle cx="16.2" cy="20.2" r="1.8" fill="#FAF7F2" stroke="#181615" stroke-width="1.4"/></svg>`,
  kebab: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M6 9.5C6 6.5 8.7 4.5 12 4.5C15.3 4.5 18 6.5 18 9.5L15.5 19.5H8.5L6 9.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 9.5C9.5 8 14.5 8 16.5 9.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.2" cy="7.5" r="1.4" fill="#4E8752"/><circle cx="13.8" cy="7.5" r="1.4" fill="#E84A27"/></svg>`,
  vietnamese: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3.5 11.5C3.5 16.8 7.2 20 12 20C16.8 20 20.5 16.8 20.5 11.5H3.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.5 11.5C8.5 9.2 11 11.5 13.5 9.2C15.2 10.8 17 9.5 18 11.5" stroke="#E84A27" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 6C9.5 7.5 10.5 8.5 10.5 9.5M14.5 5.5C14.5 7 15.5 8 15.5 9.2" stroke="#4E8752" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  indian: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 13C5 10 8 8.5 11.5 8.5C15 8.5 19 10 19 13H5Z" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><circle cx="9.5" cy="11" r="1.2" fill="#FAF7F2"/><circle cx="14" cy="11.2" r="1.2" fill="#FAF7F2"/></svg>`,
  mandi_rice: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 13C3 17.5 7 20 12 20C17 20 21 17.5 21 13H3Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 13C5 10 8 8.5 11.5 8.5C15 8.5 19 10 19 13H5Z" fill="#E84A27" stroke="#181615" stroke-width="1.5"/><circle cx="9.5" cy="11" r="1.2" fill="#FAF7F2"/><circle cx="14" cy="11.2" r="1.2" fill="#FAF7F2"/></svg>`,
  middle_eastern: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M6 9.5C6 6.5 8.7 4.5 12 4.5C15.3 4.5 18 6.5 18 9.5L15.5 19.5H8.5L6 9.5Z" fill="#FAF7F2" stroke="#181615" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 9.5C9.5 8 14.5 8 16.5 9.5" stroke="#E84A27" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.2" cy="7.5" r="1.4" fill="#4E8752"/><circle cx="13.8" cy="7.5" r="1.4" fill="#E84A27"/></svg>`,
};
