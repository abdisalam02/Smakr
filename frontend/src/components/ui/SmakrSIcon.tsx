import React from "react";

interface SmakrSIconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Minimalist freestanding 'S' icon for Smakr.
 * Pure letter vector with zero container box, rendered in vibrant electric orange.
 */
export function SmakrSIcon({
  className = "w-6 h-6",
  size,
  color = "#ff5500",
}: SmakrSIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Smakr S Logo"
    >
      <path
        d="M24 9.5C24 6 20.5 4 16 4C10.5 4 7 7 7 11C7 16.5 25 14.5 25 21C25 25.5 21 28 16 28C10 28 6.5 25 6 20.5"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
