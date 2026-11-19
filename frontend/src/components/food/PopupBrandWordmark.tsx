"use client";

import React from "react";

interface PopupBrandWordmarkProps {
  venueName: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
}

function UWanSamEyes({ size, strokeColor = "#3A1F16" }: { size: number; strokeColor?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.85)}
      viewBox="0 0 88 74"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M 10 14 Q 24 6, 38 14" stroke={strokeColor} strokeWidth="4.4" strokeLinecap="round" />
      <ellipse cx="24" cy="34" rx="15" ry="16" fill="#FFFFFF" stroke="#3A1F16" strokeWidth="4.4" />
      <path d="M 9 30 Q 24 27, 39 30" stroke="#3A1F16" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="29" cy="38" r="7.5" fill="#3A1F16" />
      <path d="M 50 14 Q 64 6, 78 14" stroke={strokeColor} strokeWidth="4.4" strokeLinecap="round" />
      <ellipse cx="64" cy="34" rx="15" ry="16" fill="#FFFFFF" stroke="#3A1F16" strokeWidth="4.4" />
      <path d="M 49 30 Q 64 27, 79 30" stroke="#3A1F16" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="59" cy="38" r="7.5" fill="#3A1F16" />
      <ellipse cx="44" cy="52" rx="5.5" ry="4" fill="#FFFFFF" stroke="#3A1F16" strokeWidth="3.6" />
      <path d="M 24 63 Q 44 70, 62 61" stroke={strokeColor} strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Custom pop-up brand wordmarks aligned with `/ad-reel` carousels.
 * Falls back cleanly to Pally display typography for any newly added pop-up.
 */
export function PopupBrandWordmark({
  venueName,
  size = "sm",
  tone = "light",
  className = "",
}: PopupBrandWordmarkProps) {
  const norm = venueName.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const isSm = size === "sm";
  const isLg = size === "lg";
  const isDark = tone === "dark";

  if (norm.includes("u wan sam") || norm.includes("u wan sum") || norm.includes("uwansam")) {
    return (
      <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
        <UWanSamEyes size={isSm ? 18 : isLg ? 28 : 24} strokeColor={isDark ? "#FAF7F2" : "#3A1F16"} />
        <span
          className={`font-black tracking-[-0.02em] leading-none truncate ${
            isSm ? "text-[13px]" : isLg ? "text-[22px] sm:text-[26px]" : "text-[16px]"
          }`}
          style={{ color: isDark ? "#FAF7F2" : "#3A1F16" }}
        >
          U WAN&apos; SAM?
        </span>
      </span>
    );
  }

  if (norm.includes("mint on wheels") || norm === "mint") {
    return (
      <span className={`inline-flex items-baseline gap-1 min-w-0 ${className}`}>
        <span
          className={`font-black italic tracking-[-0.04em] leading-none ${
            isSm ? "text-[15px]" : isLg ? "text-[26px] sm:text-[30px]" : "text-[19px]"
          }`}
          style={{ color: isDark ? "#A7E8B6" : "#2D5A3C" }}
        >
          mint.
        </span>
        <span
          className={`font-extrabold uppercase tracking-[0.08em] leading-none truncate ${
            isSm ? "text-[9px]" : isLg ? "text-[13px] sm:text-[14px]" : "text-[10.5px]"
          }`}
          style={{ color: isDark ? "#A7E8B6" : "#2D5A3C" }}
        >
          ON WHEELS
        </span>
      </span>
    );
  }

  if (norm.includes("crantz")) {
    return (
      <span
        className={`inline-block font-bold italic leading-tight truncate ${
          isSm ? "text-[14.5px]" : isLg ? "text-[24px] sm:text-[28px]" : "text-[18px]"
        } ${className}`}
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: isDark ? "#FAF7F2" : "#1E2B7B",
          letterSpacing: "-0.01em",
        }}
      >
        Crantz Cookies
      </span>
    );
  }

  return (
    <span
      className={`font-display font-bold tracking-tight leading-tight truncate ${
        isDark ? "text-[#FAF7F2]" : "text-[#181615] dark:text-white"
      } ${isSm ? "text-[13.5px]" : isLg ? "text-[22px] sm:text-[26px]" : "text-[16px]"} ${className}`}
    >
      {venueName}
    </span>
  );
}
