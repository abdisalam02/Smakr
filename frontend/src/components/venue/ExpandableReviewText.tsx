"use client";

import React, { useState } from "react";

interface ExpandableReviewTextProps {
  text: string;
  className?: string;
  maxLength?: number;
}

export function ExpandableReviewText({
  text,
  className = "text-xs text-zinc-600 leading-relaxed italic",
  maxLength = 130,
}: ExpandableReviewTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > maxLength;

  return (
    <div>
      <p className={`${className} ${!isExpanded && isLong ? "line-clamp-2" : ""}`}>
        &ldquo;{text}&rdquo;
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-1 text-[11px] font-semibold text-[#e84a27] hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <span>{isExpanded ? "Show less" : "Read more..."}</span>
        </button>
      )}
    </div>
  );
}
