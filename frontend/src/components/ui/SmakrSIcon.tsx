"use client";

import React from "react";
import { LogoVariant } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface SmakrSIconProps {
  className?: string;
  size?: number;
  color?: string;
  variant?: LogoVariant;
}

/**
 * Minimalist freestanding 'S' icon for Smakr.
 * Pure letter vector with zero container box, rendered in electric accent colors.
 * Supports 4 distinct logo design variants (fluid, geometric, ribbon, block).
 */
export function SmakrSIcon({
  className = "w-6 h-6",
  size,
  color = "#ff5500",
  variant,
}: SmakrSIconProps) {
  const storeVariant = useCityPulseStore((state) => state.activeLogoVariant);
  const activeVariant = variant || storeVariant || "fluid";
  const style = size ? { width: size, height: size } : undefined;

  const renderPaths = () => {
    switch (activeVariant) {
      case "geometric":
        return (
          <path
            d="M24 7H13C9 7 7.5 9 7.5 12.5C7.5 16 10 16.5 15.5 17H16.5C22 17.5 24.5 18 24.5 21.5C24.5 25 23 27 19 27H7.5"
            stroke={color}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case "ribbon":
        return (
          <path
            d="M23.5 8C21.5 5.5 18 4.5 14.5 5C10 5.5 7 9 7.5 13.5C8 18 13.5 19 18.5 20C23 21 25.5 23 24.5 26.5C23.5 30 19 31 15 30.5C11 30 8.5 27.5 7 24.5"
            stroke={color}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case "block":
        return (
          <path
            d="M23.5 7H13.5C9.5 7 7 9 7 13C7 17 10 18 16 18.5C22 19 25 20 25 24C25 28 22.5 29 18.5 29H8"
            stroke={color}
            strokeWidth="4.8"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        );

      case "fluid":
      default:
        return (
          <path
            d="M24 9.5C24 6 20.5 4 16 4C10.5 4 7 7 7 11C7 16.5 25 14.5 25 21C25 25.5 21 28 16 28C10 28 6.5 25 6 20.5"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Smakr S Logo"
    >
      {renderPaths()}
    </svg>
  );
}
