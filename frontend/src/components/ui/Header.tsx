"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  LogOut,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Palette,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import type { UserProfile } from "@/types";
import SmakrLogo from "@/components/ui/SmakrLogo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";

export function Header({ initialUser }: { initialUser?: UserProfile | null }) {
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);
  const storeUser = useCityPulseStore((state) => state.currentUser);
  const storeResolved = useCityPulseStore((state) => state.isAuthResolved);
  // Prefer the client store once hydrated; fall back to the SSR user so the very
  // first painted frame already shows the signed-in user.
  const currentUser = storeUser ?? initialUser ?? null;
  const isAuthResolved = storeResolved || initialUser !== undefined;
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const openAvatarStudio = useCityPulseStore((state) => state.openAvatarStudio);
  const openBetaFeedback = useCityPulseStore((state) => state.openBetaFeedback);
  const logout = useCityPulseStore((state) => state.logout);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore — local state is cleared below regardless.
      }
    }
    logout();
    showToast("Signed out of Smakr.");
  };

  const isAdmin = currentUser?.role === "admin";
  const isNiwacheOrAdmin =
    isAdmin ||
    currentUser?.handle?.toLowerCase().includes("niwache");

  const initials = currentUser
    ? (currentUser.name || currentUser.handle || "?")
        .replace(/[@_.]/g, " ")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-transparent pt-safe pt-3 px-3.5 sm:px-6 transition-colors pointer-events-none">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Top-Left Pill: Frosted glass capsule */}
        <div className="flex items-center gap-3 pointer-events-auto shrink-0">
          <div className="bg-white/45 dark:bg-stone-900/45 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 rounded-full px-3.5 py-1.5 hover:bg-white/60 dark:hover:bg-stone-900/60 transition-all">
            <SmakrLogo variant="solid-orange" />
          </div>
        </div>

        {/* Top-Right Pill: Matching frosted capsule */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/45 dark:bg-stone-900/45 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-stone-900/60 transition-all active:scale-95"
                title="Account menu"
              >
                <span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden ring-1 ring-black/5 shrink-0">
                  {currentUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.handle}
                      className="w-full h-full object-cover"
                    />
                  ) : isNiwacheOrAdmin ? (
                    <MascotCharacter config={mascotConfig} size={28} />
                  ) : (
                    <span className="w-full h-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold tracking-tight">
                      {initials}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold text-zinc-800 max-w-[100px] truncate">
                  {currentUser.handle}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-zinc-200/90 bg-white shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-2.5 border-b border-zinc-100">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {currentUser.name || currentUser.handle}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {currentUser.email || currentUser.handle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? "bg-[#e84a27]/10 text-[#e84a27]"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {isAdmin ? "✦ Admin" : "Foodie"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e84a27]/10 text-[#e84a27] border border-[#e84a27]/20">
                        ✦ Beta Tester
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      openCreateDish();
                    }}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e84a27]" />
                    <span>Add Dish</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Control Center</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      openAvatarStudio();
                    }}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors text-left"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#e84a27]" />
                    <span>Customize Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      openBetaFeedback();
                    }}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors text-left"
                  >
                    <span className="text-[13px] leading-none">💬</span>
                    <span>Send Beta Feedback</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/mascot-studio"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Mascot Studio</span>
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : !isAuthResolved ? (
            <div
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/45 dark:bg-stone-900/45 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 animate-pulse"
              aria-label="Loading account"
            >
              <span className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="h-3 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/45 dark:bg-stone-900/45 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-stone-900/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
