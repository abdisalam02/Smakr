import React from "react";
import { VibeStatus } from "@/types";
import { getVibeColor } from "@/lib/math";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "vibe" | "secondary" | "outline";
  vibeStatus?: VibeStatus;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "default",
  vibeStatus,
  className = "",
  icon,
}: BadgeProps) {
  if (variant === "vibe" && vibeStatus) {
    const colors = getVibeColor(vibeStatus);

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors.bg} ${colors.border} ${colors.text} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {children || colors.label}
      </span>
    );
  }

  if (variant === "secondary") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f6f3ee] text-[#554e42] border border-[#e3dcce] ${className}`}
      >
        {icon}
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f6f3ee] text-[#221e19] border border-[#e3dcce] ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
