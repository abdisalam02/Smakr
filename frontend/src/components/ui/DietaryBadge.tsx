"use client";

import React from "react";
import { DietaryTag } from "@/types";

export const DIETARY_META: Record<
  DietaryTag,
  { label: string; emoji: string; display: string }
> = {
  vegan: { label: "Vegan", emoji: "🌿", display: "🌿 Vegan" },
  vegetarian: { label: "Vegetarian", emoji: "🌱", display: "🌱 Veg" },
  halal: { label: "Halal", emoji: "حلال", display: "حلال Halal" },
  gluten_free: { label: "Gluten-Free", emoji: "🌾", display: "🌾 Gluten-Free" },
};

interface DietaryBadgeProps {
  tag: DietaryTag;
  className?: string;
}

/**
 * Semantic dietary pill driven by the global `--success` / `--success-tint`
 * tokens so it stays legible across every theme.
 */
export function DietaryBadge({ tag, className = "" }: DietaryBadgeProps) {
  const meta = DIETARY_META[tag];
  if (!meta) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none whitespace-nowrap ${className}`}
      style={{
        backgroundColor: "var(--success-tint, #E6EDE6)",
        color: "var(--success, #3D5A45)",
        border:
          "1px solid color-mix(in srgb, var(--success, #3D5A45) 28%, transparent)",
      }}
      title={meta.label}
    >
      <span aria-hidden>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
