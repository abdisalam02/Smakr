"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Plus, LayoutGrid, Map, Columns, LogOut, Palette } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";

export function Header() {
  const pathname = usePathname();
  const wsConnected = useCityPulseStore((state) => state.wsConnected);
  const filters = useCityPulseStore((state) => state.filters);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const setViewMode = useCityPulseStore((state) => state.setViewMode);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const logout = useCityPulseStore((state) => state.logout);
  const setIsThemeStudioOpen = useCityPulseStore((state) => state.setIsThemeStudioOpen);

  const handleAddDish = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsCreateBiteModalOpen(true);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 bg-transparent px-4 lg:px-6 py-2.5 transition-colors pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/" className="flex items-center gap-1 group select-none bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/80 shadow-sm hover:bg-white transition-all">
            <SmakrSIcon className="w-5 h-5 shrink-0 -mr-0.5" />
            <span className="text-zinc-950 font-black text-lg tracking-tight leading-none">
              makr
            </span>
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase pl-1.5 ml-1 border-l border-zinc-200">
              oslo
            </span>
          </Link>
        </div>

        {/* Minimalist Floating Search Bar */}
        {pathname === "/" && (
          <div className="flex-1 max-w-sm hidden md:block pointer-events-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search coconut coffee, smash burgers, ramen..."
                value={filters.search_query}
                onChange={(e) => setFilters({ search_query: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-white/90 hover:bg-white focus:bg-white border border-white/80 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500] shadow-sm transition-all"
              />
            </div>
          </div>
        )}

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {pathname === "/" && (
            <div className="hidden sm:flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-xl border border-white/80 text-xs shadow-sm">
              <button
                onClick={() => setViewMode("feed")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === "feed"
                    ? "bg-zinc-950 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
                title="Feed view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Feed</span>
              </button>

              <button
                onClick={() => setViewMode("split")}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === "split"
                    ? "bg-zinc-950 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
                title="Split view"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === "map"
                    ? "bg-zinc-950 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
                title="Map view"
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Map</span>
              </button>
            </div>
          )}

          {/* Theme & Style Studio Button */}
          <button
            onClick={() => setIsThemeStudioOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#ff5500] border border-white/80 shadow-xs transition-all active:scale-95"
            title="Style & Theme Studio"
          >
            <Palette className="w-3.5 h-3.5 text-[#ff5500]" />
            <span className="hidden sm:inline text-xs font-semibold">Theme</span>
          </button>

          {/* Add Dish CTA (Auth-gated) */}
          <button
            onClick={handleAddDish}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-semibold text-xs shadow-md shadow-[#ff5500]/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Dish</span>
          </button>

          {/* User Profile / Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-0.5">
              <div
                className="relative w-7 h-7 rounded-full overflow-hidden border border-zinc-300 shadow-xs cursor-pointer group"
                title={`${currentUser.name} (${currentUser.handle}) · Click to sign out`}
                onClick={logout}
              >
                <Image
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
              <button
                onClick={logout}
                className="hidden xl:flex text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:flex items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-white/70 border border-white/50 transition-colors"
            >
              Sign in
            </button>
          )}

          {/* Live Sync */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 backdrop-blur-md border border-white/40 text-[10px] text-zinc-600 shadow-xs"
            title={wsConnected ? "Connected live" : "Connecting..."}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="hidden sm:inline font-mono">{wsConnected ? "Live" : "Sync"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
