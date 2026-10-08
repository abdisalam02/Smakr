"use client";

import React from "react";
import Link from "next/link";

interface SmakrLogoProps {
  variant?: "solid-orange" | "big-s" | "two-tone";
  className?: string;
}

export default function SmakrLogo({
  variant = "solid-orange",
  className = "",
}: SmakrLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group select-none ${className}`}
      aria-label="Smakr Home"
    >
      {/* Variant 1: Uniform All-Caps Burnt Paprika (Default) */}
      {variant === "solid-orange" && (
        <span className="font-comico text-base sm:text-[17px] tracking-wide text-[#e84a27] transition-transform duration-150 group-hover:scale-105">
          SMAKR
        </span>
      )}

      {/* Variant 2: Big Orange S with Dark Espresso MAKR */}
      {variant === "big-s" && (
        <span className="font-comico flex items-baseline tracking-wide">
          <span className="text-xl text-[#e84a27] mr-[1px]">S</span>
          <span className="text-base text-[#2B1810] dark:text-neutral-200">MAKR</span>
        </span>
      )}

      {/* Variant 3: Two-tone SMA (Orange) + KR (Espresso) */}
      {variant === "two-tone" && (
        <span className="font-comico text-base sm:text-[17px] tracking-wide">
          <span className="text-[#e84a27]">SMA</span>
          <span className="text-[#2B1810] dark:text-neutral-200">KR</span>
        </span>
      )}

      {/* Clean Oslo Location Indicator without boxed border */}
      <span className="text-[9px] font-sans font-bold tracking-[0.22em] uppercase text-zinc-400 dark:text-zinc-500">
        OSLO
      </span>
    </Link>
  );
}
