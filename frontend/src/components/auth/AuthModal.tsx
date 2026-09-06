"use client";

import React from "react";
import { X, Sparkles, ArrowRight, UserCheck } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";

export function AuthModal() {
  const isAuthModalOpen = useCityPulseStore((state) => state.isAuthModalOpen);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const login = useCityPulseStore((state) => state.login);

  if (!isAuthModalOpen) return null;

  const handleDemoLogin = (name: string, handle: string, avatar: string) => {
    login({
      id: `user-${Date.now()}`,
      name,
      handle,
      avatar_url: avatar,
      badge: "Verified Foodie",
    });
    // Proceed directly to create meal modal
    setIsCreateBiteModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 flex flex-col space-y-5">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 text-center pt-2">
          <div className="flex items-center justify-center mx-auto mb-1">
            <SmakrSIcon className="w-9 h-9" />
          </div>
          <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
            Sign in to post on Smakr
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            Anyone can browse the feed and map freely. Sign in to log dishes and share recommendations.
          </p>
        </div>

        {/* Fast Sign-in Options */}
        <div className="space-y-2.5 pt-1 text-xs">
          {/* Instant 1-Click Demo Login as Astrid */}
          <button
            onClick={() =>
              handleDemoLogin(
                "Astrid Lindholm",
                "@astrid_eats_oslo",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
              )
            }
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-xs transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                A
              </span>
              <div className="text-left">
                <p className="font-bold text-xs">Continue as Astrid</p>
                <p className="text-[10px] text-zinc-300">@astrid_eats_oslo · Verified Foodie</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Instant 1-Click Demo Login as Sander */}
          <button
            onClick={() =>
              handleDemoLogin(
                "Sander Johansen",
                "@sander_taster",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
              )
            }
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-medium border border-zinc-200/80 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700">
                S
              </span>
              <div className="text-left">
                <p className="font-bold text-xs">Continue as Sander</p>
                <p className="text-[10px] text-zinc-500">@sander_taster · Top Taster</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <p className="text-[11px] text-center text-zinc-400 pt-1">
          No password needed · 1-click foodie profile
        </p>
      </div>
    </div>
  );
}
