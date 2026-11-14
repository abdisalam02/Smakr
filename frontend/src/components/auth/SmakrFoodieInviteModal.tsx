"use client";

import React, { useMemo } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  buildOpenPeepsDataUri,
  openPeepsConfigFromPreset,
  type OpenPeepsConfig,
} from "@/lib/onboardingAvatar";

const INVITE_PEEPS: OpenPeepsConfig[] = [
  {
    ...openPeepsConfigFromPreset("female1"),
    headType: "longCurly",
    skinColor: "d08b5b",
    headColor: "2c1b18",
    faceExpression: "smileBig",
    clothingColor: "e84a27",
  },
  {
    ...openPeepsConfigFromPreset("male2"),
    headType: "short4",
    skinColor: "ffdbb4",
    headColor: "a55728",
    faceExpression: "eatingHappy",
    accessories: "glasses2",
    clothingColor: "181615",
  },
  {
    ...openPeepsConfigFromPreset("female2"),
    headType: "hijab",
    headwear: "hijab",
    skinColor: "ae5d29",
    headColor: "4a312c",
    faceExpression: "lovingGrin1",
    clothingColor: "4e8752",
    hatColor: "e84a27",
  },
];

export function SmakrFoodieInviteModal() {
  const isOpen = useCityPulseStore((s) => s.isFoodieInviteOpen);
  const setIsOpen = useCityPulseStore((s) => s.setIsFoodieInviteOpen);
  const setIsAuthModalOpen = useCityPulseStore((s) => s.setIsAuthModalOpen);

  const avatarUris = useMemo(
    () => INVITE_PEEPS.map((cfg) => buildOpenPeepsDataUri(cfg)),
    []
  );

  if (!isOpen) return null;

  const handleStart = () => {
    setIsOpen(false);
    setIsAuthModalOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-[#181615]/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="foodie-invite-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-[#FAF7F2] text-[#181615] border-2 border-[#181615]/15 shadow-[0_24px_60px_rgba(24,22,21,0.38)] p-6 sm:p-7 overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close invite"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#181615]/8 hover:bg-[#181615]/15 flex items-center justify-center text-[#181615] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Three Oslo Foodie Open Peeps busts */}
        <div className="flex items-center justify-center -space-x-3 pt-1 pb-4">
          {avatarUris.map((uri, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full border-[3px] border-[#FAF7F2] shadow-md overflow-hidden ${
                idx === 1 ? "z-10 scale-110 bg-[#F3EDE2]" : "bg-[#E6DFD3]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uri}
                alt={`Oslo Foodie Avatar ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E84A27]/12 text-[#E84A27] text-[10px] font-black uppercase tracking-[0.14em] mb-2.5">
            <Sparkles className="w-3 h-3" />
            Oslo Community Drops
          </span>

          <h2
            id="foodie-invite-title"
            className="font-comico font-normal text-[28px] sm:text-[32px] leading-[1.02] tracking-wide uppercase text-[#181615]"
          >
            BECOME A SMAKR FOODIE
          </h2>

          <p className="mt-3 text-[13.5px] leading-relaxed text-[#181615]/80 font-sans">
            Join Oslo foodies logging Oslo&apos;s best bites &amp; hidden gems. Pick your
            Open Peeps character, pick a <span className="font-bold text-[#181615]">@handle</span>,
            and submit your picks to <span className="font-bold text-[#E84A27]">Locals&apos; Picks</span>.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#E84A27] hover:bg-[#d63e1c] active:scale-[0.99] text-[#FAF7F2] font-bold text-[14px] py-3.5 px-5 shadow-[0_6px_18px_rgba(232,74,39,0.3)] transition-all cursor-pointer"
          >
            <span>Sign In &amp; Build Avatar</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 text-[12px] font-semibold text-[#181615]/55 hover:text-[#181615] transition-colors cursor-pointer"
          >
            Keep browsing Oslo first
          </button>
        </div>
      </div>
    </div>
  );
}
