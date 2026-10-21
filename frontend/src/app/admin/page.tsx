"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Palette,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  Store,
  Trash2,
  Pencil,
  Save,
  MapPin,
  Plus,
  Check,
  X,
  ImageIcon,
  Ticket,
  ChefHat,
  ChevronDown,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  DietaryTag,
  FoodCategory,
  FoodPost,
  Neighborhood,
  Venue,
  VibeMetrics,
  WeeklyPick,
  PopupResidencyMeta,
  ResidencyStatus,
} from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { VenueImporter, DataCleanupCard } from "@/components/admin/VenueImporter";
import { BulkVenueSeeder } from "@/components/admin/BulkVenueSeeder";
import { EditPostModal } from "@/components/admin/EditPostModal";
import { broadcastWeeklyPick, fetchFoodPosts, fetchVenues, deleteVenueById, deleteFoodPostById, updateVenue as updateVenueDb, insertVenue } from "@/lib/supabase/data";
import { BodyFontPicker } from "@/components/ui/FontSwitcher";
import { PartnerClaimsQueue } from "@/components/admin/PartnerClaimsQueue";
import { AdminPopupWizardModal } from "@/components/admin/AdminPopupWizardModal";
import { VisualPhotoSwitcher } from "@/components/ui/VisualPhotoSwitcher";
import { isPopupVenue } from "@/lib/popupUtils";
import { TimeSlotPicker } from "@/components/ui/TimeSlotPicker";

/* ------------------------------------------------------------------ */
/* Static option lists                                                 */
/* ------------------------------------------------------------------ */

const NEIGHBORHOODS: { id: Neighborhood; label: string }[] = [
  { id: "grunerlokka", label: "Grünerløkka" },
  { id: "torggata", label: "Torggata" },
  { id: "toyen", label: "Tøyen" },
  { id: "gronland", label: "Grønland" },
  { id: "sentrum", label: "Sentrum" },
  { id: "frogner", label: "Frogner" },
  { id: "kampen", label: "Kampen" },
];

const DIETARY_OPTIONS: { id: DietaryTag; label: string; emoji: string }[] = [
  { id: "vegan", label: "Vegan", emoji: "🌿" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🌱" },
  { id: "halal", label: "Halal", emoji: "حلال" },
  { id: "gluten_free", label: "Gluten-Free", emoji: "🌾" },
];

const VENUE_CATEGORIES = FOOD_CATEGORIES.filter((c) => c.id !== "all");

function emptyVibe(): VibeMetrics {
  return {
    seat_score: 3,
    seat_label: "Moderate",
    noise_score: 2,
    noise_label: "Calm",
    outlets_percentage: 50,
    outlets_label: "Some",
    overall_status: "optimal",
    overall_score: 3,
    active_checkins_count: 0,
    last_checkin_at: null,
    is_live: false,
    decay_factor: 1,
    avg_download_mbps: null,
    avg_ping_ms: null,
  };
}

const inputCls =
  "w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border bg-white p-4 shadow-xs ${className}`}
      style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
    >
      {children}
    </div>
  );
}

type TabId = "dispatch" | "popups" | "venues" | "claims" | "moderation" | "settings";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminControlCenterPage() {
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const setWeeklyPick = useCityPulseStore((state) => state.setWeeklyPick);
  const venues = useCityPulseStore((state) => state.venues);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const setVenues = useCityPulseStore((state) => state.setVenues);
  const setFoodPosts = useCityPulseStore((state) => state.setFoodPosts);
  const addVenue = useCityPulseStore((state) => state.addVenue);
  const updateVenue = useCityPulseStore((state) => state.updateVenue);
  const deleteVenue = useCityPulseStore((state) => state.deleteVenue);
  const deletePost = useCityPulseStore((state) => state.deletePost);
  const toggleOfficialPick = useCityPulseStore((state) => state.toggleOfficialPick);
  const setIsThemeStudioOpen = useCityPulseStore((state) => state.setIsThemeStudioOpen);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [tab, setTab] = useState<TabId>("dispatch");
  const [selectedDishId, setSelectedDishId] = useState("");
  const [editingPost, setEditingPost] = useState<FoodPost | null>(null);

  /* ---------- Weekly Dispatch Stepper State ---------- */
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchStep, setDispatchStep] = useState<1 | 2 | 3>(1);

  /* ---------- Pop-ups management state ---------- */
  const [isPopupWizardOpen, setIsPopupWizardOpen] = useState(false);
  const [editingPopupVenue, setEditingPopupVenue] = useState<Venue | null>(null);
  const [popupFilter, setPopupFilter] = useState<"all" | "active" | "next_confirmed" | "between_residencies">("all");

  const popupVenues = useMemo(
    () => venues.filter((v) => isPopupVenue(v)),
    [venues]
  );

  const filteredPopups = useMemo(() => {
    if (popupFilter === "all") return popupVenues;
    return popupVenues.filter((v) => {
      const status = v.popup_meta?.residency_status || "active";
      return status === popupFilter;
    });
  }, [popupVenues, popupFilter]);

  const handleOpenCreatePopup = () => {
    setEditingPopupVenue(null);
    setIsPopupWizardOpen(true);
  };

  const handleOpenEditPopup = (v: Venue) => {
    setEditingPopupVenue(v);
    setIsPopupWizardOpen(true);
  };

  const handleUpdatePopupStatus = async (venue: Venue, newStatus: ResidencyStatus) => {
    const currentMeta = venue.popup_meta || {
      brand_id: `brand_${Date.now()}`,
      dates_label: "Upcoming Drop",
      daily_hours: "17:00 – Late",
    };
    const updatedMeta: PopupResidencyMeta = {
      ...currentMeta,
      residency_status: newStatus,
    };
    updateVenue(venue.id, {
      popup_meta: updatedMeta,
    });
    await updateVenueDb(venue.id, {
      popupMeta: updatedMeta,
    });
    showToast(`Updated ${venue.name} status`);
  };

  /* ---------- Weekly Dispatch form ---------- */
  const [venueId, setVenueId] = useState(weeklyPick.venue_id);
  const [dishName, setDishName] = useState(weeklyPick.dish_name);
  const [dishImage, setDishImage] = useState(weeklyPick.dish_image);
  const [speech, setSpeech] = useState(weeklyPick.speech_bubble);
  const [price, setPrice] = useState(weeklyPick.price_nok);
  const [label, setLabel] = useState(weeklyPick.week_label);
  const [lat, setLat] = useState(weeklyPick.coords[1]);
  const [lng, setLng] = useState(weeklyPick.coords[0]);

  useEffect(() => {
    setVenueId(weeklyPick.venue_id);
    setDishName(weeklyPick.dish_name);
    setDishImage(weeklyPick.dish_image);
    setSpeech(weeklyPick.speech_bubble);
    setPrice(weeklyPick.price_nok);
    setLabel(weeklyPick.week_label);
    setLat(weeklyPick.coords[1]);
    setLng(weeklyPick.coords[0]);
  }, [weeklyPick]);

  // Hydrate venues + dishes from Supabase so the importer, the dish dropdown and
  // the moderation queue are populated even on a direct /admin visit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [v, p] = await Promise.all([fetchVenues(), fetchFoodPosts()]);
      if (cancelled) return;
      setVenues(v);
      setFoodPosts(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [setVenues, setFoodPosts]);

  /* ---------- Add Venue form ---------- */
  const [vName, setVName] = useState("");
  const [vAddress, setVAddress] = useState("");
  const [vNeighborhood, setVNeighborhood] = useState<Neighborhood>("torggata");
  const [vCategory, setVCategory] = useState<FoodCategory>("ramen");
  const [vDietary, setVDietary] = useState<DietaryTag[]>([]);
  const [vStatus, setVStatus] = useState("");
  const [vOpenNow, setVOpenNow] = useState(true);
  const [vLat, setVLat] = useState(59.9171);
  const [vLng, setVLng] = useState(10.7516);

  /* ---------- Edit venue ---------- */
  const [editing, setEditing] = useState<Venue | null>(null);

  const selectedVenue = useMemo(
    () => venues.find((v) => v.id === venueId) ?? null,
    [venues, venueId]
  );

  // The Control Center is gated by the profile role only. The server-side
  // admin layout performs the same check before this client component renders.
  const isUserAdmin = currentUser?.role === "admin";

  if (!isUserAdmin) {
    return (
      <div className="w-full h-full overflow-y-auto no-scrollbar bg-[var(--background)]">
        <div className="pt-[120px] px-4 flex justify-center">
          <div
            className="max-w-md w-full rounded-3xl border bg-white p-8 text-center shadow-sm"
            style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-lg font-extrabold text-zinc-900 tracking-tight">Access denied</h1>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              The Smakr Control Center is restricted to administrators. Sign in with an admin
              account to continue.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Food Radar</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Handlers ---------- */

  const handleVenueSelect = (id: string) => {
    setVenueId(id);
    const venue = venues.find((v) => v.id === id);
    if (venue) {
      setLat(venue.latitude);
      setLng(venue.longitude);
      if (venue.signature_dishes && venue.signature_dishes.length > 0) {
        setDishName(venue.signature_dishes[0]);
      }
      if (venue.cover_image_url) setDishImage(venue.cover_image_url);
    }
  };

  // Auto-fill every Weekly Drop field from a registered dish + its venue.
  const handleDishSelect = (postId: string) => {
    setSelectedDishId(postId);
    const post = foodPosts.find((p) => p.id === postId);
    if (!post) return;
    setVenueId(post.spot_id);
    setDishName(post.dish_name);
    setPrice(post.price_nok ?? 0);
    setDishImage(post.image_url);
    setLat(post.spot_coords[1]);
    setLng(post.spot_coords[0]);
  };

  const handleBroadcast = async () => {
    if (!venueId) {
      showToast("Select a spotlight venue first.");
      return;
    }
    const pick: WeeklyPick = {
      id: `weekly-pick-${venueId}`,
      venue_id: venueId,
      dish_name: dishName.trim() || "Chef's pick",
      dish_image: dishImage.trim(),
      speech_bubble: speech.trim(),
      coords: [Number(lng), Number(lat)],
      price_nok: Number(price) || 0,
      week_label: label.trim() || "This Week's Pick",
      active: true,
    };

    // Optimistic: the home feed & map update instantly.
    setWeeklyPick(pick);

    const { error } = await broadcastWeeklyPick({
      venueId,
      dishName: pick.dish_name,
      dishImage: pick.dish_image,
      priceNok: pick.price_nok,
      speechBubble: pick.speech_bubble,
      weekLabel: pick.week_label,
      latitude: Number(lat),
      longitude: Number(lng),
    });

    if (error) showToast(`📣 Dispatch updated locally — database sync failed (${error}).`);
    else {
      showToast("📣 Dispatch broadcast live — feed & map updated!");
      setIsDispatchModalOpen(false);
    }
  };

  const handleAddVenue = async () => {
    if (!vName.trim()) {
      showToast("Give the new venue a name.");
      return;
    }
    const venue: Venue = {
      id: `spot-${vName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()
        .toString()
        .slice(-4)}`,
      name: vName.trim(),
      address: vAddress.trim() || "Oslo",
      city: "Oslo",
      latitude: Number(vLat) || 59.9171,
      longitude: Number(vLng) || 10.7516,
      place_type: "cafe",
      food_category: vCategory,
      price_level: "$$",
      signature_dishes: [],
      live_food_status: vStatus.trim() || undefined,
      neighborhood: vNeighborhood,
      dietary_tags: vDietary,
      open_now: vOpenNow,
      cover_image_url: null,
      description: null,
      has_wifi: true,
      has_outlets: false,
      silent_zone: false,
      outdoor_seating: false,
      dog_friendly: false,
      open_late: false,
      baseline_seats: 3,
      baseline_noise: 2,
      baseline_outlets: false,
      distance_meters: null,
      vibe: emptyVibe(),
    };
    addVenue(venue);
    showToast(`Added ${venue.name} to the radar ✅`);
    setVName("");
    setVAddress("");
    setVStatus("");
    setVDietary([]);

    await insertVenue({
      name: venue.name,
      address: venue.address,
      category: venue.food_category,
      neighborhood: venue.neighborhood as any,
      latitude: venue.latitude,
      longitude: venue.longitude,
      dietaryTags: venue.dietary_tags,
      openNow: venue.open_now,
    }).catch(() => {});
  };

  const startEdit = (venue: Venue) => setEditing({ ...venue });
  const saveEdit = () => {
    if (!editing) return;
    const cat = editing.food_category ?? "ramen";
    const emoji = FOOD_CATEGORIES.find((c) => c.id === cat)?.emoji ?? editing.icon ?? "🥢";
    updateVenue(editing.id, {
      name: editing.name,
      address: editing.address,
      neighborhood: editing.neighborhood,
      latitude: editing.latitude,
      longitude: editing.longitude,
      open_now: editing.open_now,
      dietary_tags: editing.dietary_tags,
      food_category: cat,
      icon: emoji,
      cover_image_url: editing.cover_image_url,
      current_opening_hours_text: editing.current_opening_hours_text,
      kitchen_status: editing.kitchen_status,
    });
    void updateVenueDb(editing.id, {
      name: editing.name,
      address: editing.address,
      neighborhood: editing.neighborhood,
      category: cat,
      icon: emoji,
      imageUrl: editing.cover_image_url,
      latitude: editing.latitude,
      longitude: editing.longitude,
      openNow: editing.open_now,
      kitchenStatus: editing.kitchen_status,
    });
    showToast(`Updated ${editing.name}`);
    setEditing(null);
  };

  const officialCount = foodPosts.filter((p) => p.is_official_pick).length;

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[var(--background)]">
      <div className="pt-[70px] pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* ============ Top administrative bar ============ */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-5 bg-[#F7F2E8]/90 dark:bg-[#181615]/90 backdrop-blur-md border-b border-[#181615]/10 flex items-center justify-between gap-2">
          {/* Left: Back to Food Radar */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-[#e84a27] border border-black/10 dark:border-white/10 shadow-xs text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Radar</span>
          </Link>

          {/* Center: SMAKR CONTROL CENTER + @handle dot */}
          <div className="flex items-center gap-1.5 text-center truncate">
            <span className="font-comico text-sm sm:text-base text-zinc-900 dark:text-white tracking-wide">
              SMAKR <span className="text-[#e84a27]">CONTROL CENTER</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[100px] hidden xs:inline">
              @{currentUser?.handle || "admin"}
            </span>
          </div>

          {/* Right: Quick Creation + Studios Links */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreatePopup}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white shadow-xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Launch Pop-up Drop Wizard"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>+ Pop-up</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("venues")}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-[#e84a27] border border-black/10 dark:border-white/10 shadow-xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Add regular spot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spot</span>
            </button>
            <Link
              href="/mascot-studio"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-[#e84a27] border border-black/10 dark:border-white/10 shadow-xs text-xs font-bold transition-all active:scale-95"
              title="Open Mascot Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Mascot</span>
            </Link>
            <Link
              href="/ad-reel"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-[#e84a27] border border-black/10 dark:border-white/10 shadow-xs text-xs font-bold transition-all active:scale-95"
              title="Open Ad Studio"
            >
              <Palette className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Ads</span>
            </Link>
          </div>
        </div>

        {/* ============ Horizontal Scrollable Segmented Tab Bar ============ */}
        <div className="mb-6 p-1.5 rounded-2xl bg-[#EAE6DF]/75 dark:bg-white/5 border border-[#181615]/8 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "dispatch", label: "Dispatch", emoji: "📣" },
              { id: "popups", label: `Pop-ups (${popupVenues.length})`, emoji: "🎟️" },
              { id: "venues", label: `Venues (${venues.length})`, emoji: "🏪" },
              { id: "claims", label: "Claims", emoji: "🤝" },
              { id: "moderation", label: `Posts (${foodPosts.length})`, emoji: "🛡️" },
              { id: "settings", label: "Settings", emoji: "⚙️" },
            ] as { id: TabId; label: string; emoji: string }[]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5"
                }`}
              >
                <span aria-hidden>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* TAB 1 — Mascot & Weekly Dispatch Manager                          */}
        {/* ================================================================= */}
        {tab === "dispatch" && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#e84a27]" />
                <h2 className="font-comico font-black text-sm sm:text-base text-zinc-900 dark:text-white">
                  Active Weekly Dispatch
                </h2>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Live in Feed
              </span>
            </div>

            {/* Current Live Card View */}
            <Card className="space-y-4 p-5">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#181615]/10 bg-[#EAE6DF]">
                {weeklyPick.dish_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={weeklyPick.dish_image} alt={weeklyPick.dish_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-bold backdrop-blur-xs">
                  ✦ {weeklyPick.week_label || "Weekly Pick"}
                </span>
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/95 text-zinc-900 text-xs font-mono font-bold shadow-xs">
                  {weeklyPick.price_nok} NOK
                </span>
              </div>

              <div>
                <h3 className="font-comico font-black text-lg text-zinc-900 dark:text-white">
                  {weeklyPick.dish_name}
                </h3>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>{selectedVenue?.name || "Spotlight Venue"} · {selectedVenue?.neighborhood || selectedVenue?.city || "Oslo"}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-500/10 shrink-0 border border-orange-500/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={weeklyPick.mascot_avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"}
                    alt="Mascot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27] block">
                    Mascot Dispatch Note
                  </span>
                  <p className="font-comico text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
                    &ldquo;{weeklyPick.speech_bubble || "Skip the queue — order before 17:30!"}&rdquo;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDispatchStep(1);
                  setIsDispatchModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#e84a27] hover:bg-[#d43d1c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#e84a27]/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Change Weekly Drop (3-Step Editor)</span>
              </button>
            </Card>

            {/* Focused 3-Step Dispatch Modal */}
            {isDispatchModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
                <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between border-b border-[#181615]/5 pb-3">
                    <div>
                      <h3 className="font-comico text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-[#e84a27]" />
                        <span>Update Weekly Dispatch</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium">Step {dispatchStep} of 3</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sleek Horizontal Stepper */}
                  <div className="h-9 px-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 flex items-center justify-between text-xs font-bold">
                    <div className={`flex items-center gap-1.5 ${dispatchStep >= 1 ? "text-[#e84a27]" : "text-zinc-400"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${dispatchStep >= 1 ? "bg-[#e84a27] text-white" : "bg-zinc-200 text-zinc-500"}`}>1</span>
                      <span>Spot &amp; Dish</span>
                    </div>
                    <span className="text-zinc-300">→</span>
                    <div className={`flex items-center gap-1.5 ${dispatchStep >= 2 ? "text-[#e84a27]" : "text-zinc-400"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${dispatchStep >= 2 ? "bg-[#e84a27] text-white" : "bg-zinc-200 text-zinc-500"}`}>2</span>
                      <span>Photo &amp; NOK</span>
                    </div>
                    <span className="text-zinc-300">→</span>
                    <div className={`flex items-center gap-1.5 ${dispatchStep >= 3 ? "text-[#e84a27]" : "text-zinc-400"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${dispatchStep >= 3 ? "bg-[#e84a27] text-white" : "bg-zinc-200 text-zinc-500"}`}>3</span>
                      <span>Mascot Note</span>
                    </div>
                  </div>

                  {/* Live Mini-Card Mirror */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-black/5">
                      {dishImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dishImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🍽️</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-comico text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {dishName || "Signature Dish"}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#e84a27] shrink-0">
                          {price || 195} NOK
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {selectedVenue?.name || "Choose Spotlight Venue"}
                      </p>
                    </div>
                  </div>

                  {/* STEP 1: SPOT & DISH */}
                  {dispatchStep === 1 && (
                    <div className="space-y-4">
                      <Field label="Choose Spotlight Venue *">
                        <select
                          value={venueId}
                          onChange={(e) => handleVenueSelect(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">— Select an Oslo Venue —</option>
                          {venues.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} · {v.neighborhood || v.city || "Oslo"}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Signature Dish Name *">
                        <input
                          value={dishName}
                          onChange={(e) => setDishName(e.target.value)}
                          placeholder="e.g. Spicy Miso Tonkotsu Ramen"
                          className={inputCls}
                        />
                      </Field>

                      {/* Visual Quick-Pick From Feed Posts */}
                      {foodPosts.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Or Quick-Pick From Feed Posts
                          </span>
                          <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1.5 bg-[#FAF7F2] dark:bg-[#181615]">
                            {foodPosts.slice(0, 10).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleDishSelect(p.id)}
                                className="w-full text-left p-2 rounded-xl hover:bg-orange-500/10 text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-200 shrink-0 border border-black/5">
                                    {p.image_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs">🍽️</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#e84a27]">
                                      {p.dish_name}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 truncate">@{p.spot_name}</p>
                                  </div>
                                </div>
                                {p.price_nok && (
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0 border border-black/5">
                                    {p.price_nok} kr
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setDispatchStep(2)}
                          disabled={!venueId || !dishName.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[#e84a27] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Continue to Photo &amp; Price →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PHOTO & PRICE */}
                  {dispatchStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Price (NOK) *">
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="195"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Week Label">
                          <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Week 42 Pick"
                            className={inputCls}
                          />
                        </Field>
                      </div>

                      <VisualPhotoSwitcher
                        label="Dish Photo"
                        currentImageUrl={dishImage}
                        venuePlaceId={selectedVenue?.google_place_id}
                        venueName={selectedVenue?.name}
                        category={selectedVenue?.food_category || "all"}
                        onSelectPhoto={(url) => setDishImage(url)}
                      />

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setDispatchStep(1)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setDispatchStep(3)}
                          className="px-5 py-2.5 rounded-xl bg-[#e84a27] text-white text-xs font-bold cursor-pointer"
                        >
                          Continue to Speech Note →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MASCOT DISPATCH NOTE */}
                  {dispatchStep === 3 && (
                    <div className="space-y-4">
                      <Field label="Mascot Speech Bubble Note *">
                        <textarea
                          value={speech}
                          onChange={(e) => setSpeech(e.target.value)}
                          rows={3}
                          placeholder="Skip the queue at Koie — order the Spicy Miso before 17:30!"
                          className={`${inputCls} resize-none`}
                        />
                      </Field>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          1-Tap Note Presets
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {[
                            "Skip the queue at Koie — order before 17:30!",
                            "Limited 80 bowls per night — get there when doors open at 17:00!",
                            "Fresh warm cardamom buns straight from the oven at 08:30!",
                          ].map((quote) => (
                            <button
                              key={quote}
                              type="button"
                              onClick={() => setSpeech(quote)}
                              className="text-left text-xs p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              &ldquo;{quote}&rdquo;
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#181615]/5">
                        <button
                          type="button"
                          onClick={() => setDispatchStep(2)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={handleBroadcast}
                          className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#e84a27]/20 cursor-pointer"
                        >
                          <Megaphone className="w-4 h-4" />
                          <span>Broadcast Live Now</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2 — Pop-Up Residencies & Drops                                */}
        {/* ================================================================= */}
        {tab === "popups" && (
          <div className="space-y-4">
            {/* Top Action & Filter Bar */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#e84a27]" />
                  <span>Oslo Pop-up Residencies &amp; Drops</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Enduring chef brands with time-capped residencies, host bar bindings, and crowd petitions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreatePopup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md shadow-[#e84a27]/25 transition-all active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>+ Launch Pop-up Wizard</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: "all" as const, label: `All Residencies (${popupVenues.length})` },
                { id: "active" as const, label: "🔥 Live Now" },
                { id: "next_confirmed" as const, label: "📅 Next Drop" },
                { id: "between_residencies" as const, label: "⏸ Between Residencies" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPopupFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    popupFilter === f.id
                      ? "bg-[#181615] text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                      : "bg-white dark:bg-[#23201D] text-zinc-600 dark:text-zinc-400 border border-[#181615]/10 hover:border-zinc-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Pop-up Grid */}
            {filteredPopups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPopups.map((p) => {
                  const meta = p.popup_meta;
                  const isDormant =
                    meta?.residency_status === "between_residencies" ||
                    Boolean(meta?.dates_label?.toLowerCase().includes("tba"));
                  const currentStatus: ResidencyStatus = isDormant
                    ? "between_residencies"
                    : meta?.residency_status || "active";
                  const hostVenueName =
                    meta?.host_venue_name &&
                    !meta.host_venue_name.toLowerCase().includes("tba") &&
                    !meta.host_venue_name.toLowerCase().includes("host")
                      ? meta.host_venue_name
                      : null;
                  const coverPhoto =
                    p.cover_image_url ||
                    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80";

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-3.5">
                        {/* 4:3 Thumbnail */}
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] border border-[#181615]/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverPhoto} alt={p.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                            {currentStatus === "active" ? "🔥 Live" : currentStatus === "next_confirmed" ? "📅 Drop" : "⏸ Inactive"}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-comico text-sm sm:text-base font-black text-zinc-900 dark:text-white truncate">
                              {p.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-[#e84a27] font-mono shrink-0">
                              {isDormant ? "Inactive" : "Drop"}
                            </span>
                          </div>

                          {meta?.guest_chef && (
                            <p className="text-xs text-zinc-500 font-medium truncate flex items-center gap-1">
                              <ChefHat className="w-3.5 h-3.5 text-[#e84a27]" />
                              <span>{meta.guest_chef}</span>
                            </p>
                          )}

                          {hostVenueName && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span>At {hostVenueName}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 flex-wrap">
                            {isDormant ? (
                              <span className="text-stone-500 font-semibold">Dates &amp; location TBA</span>
                            ) : (
                              <>
                                <span>{meta?.dates_label || "Active run"}</span>
                                {(meta?.daily_hours || meta?.event_hours) && (
                                  <>
                                    <span>·</span>
                                    <span>{meta.daily_hours || meta.event_hours}</span>
                                  </>
                                )}
                                {meta?.portion_cap && (
                                  <span className="font-bold text-[#e84a27]">· {meta.portion_cap}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* State Switcher & Actions */}
                      <div className="pt-3 border-t border-[#181615]/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                        {/* 1-Tap Lifecycle State Switcher */}
                        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#F5EFE4] dark:bg-[#23201D] text-[10px] font-bold">
                          {[
                            { id: "active" as const, label: "Live" },
                            { id: "next_confirmed" as const, label: "Next Drop" },
                            { id: "between_residencies" as const, label: "Between Runs" },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => handleUpdatePopupStatus(p, st.id)}
                              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                currentStatus === st.id
                                  ? "bg-[#e84a27] text-white shadow-xs"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPopup(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit in Wizard</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await deleteVenueById(p.id);
                              if (!res.success) {
                                showToast(res.error ?? "Could not delete this pop-up.");
                                return;
                              }
                              deleteVenue(p.id);
                              showToast(`Removed pop-up residency: ${p.name}`);
                            }}
                            className="p-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Delete pop-up"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#e84a27] flex items-center justify-center mx-auto text-xl font-bold">
                  🎟️
                </div>
                <h3 className="font-comico text-base font-black text-zinc-900 dark:text-white">
                  No Pop-up Residencies Registered
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Launch the dedicated Pop-up Wizard to ingest TikTok announcements, parse drop flyers, and bind guest chefs to host venues.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreatePopup}
                  className="px-4 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Launch Pop-up Drop Wizard</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3 — Venue Management & Google Places                          */}
        {/* ================================================================= */}
        {tab === "venues" && (
          <div className="space-y-4">
            {/* 1. AI + Google Places Bulk Seeder Dropdown Accordion */}
            <details className="group rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 overflow-hidden shadow-xs">
              <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs sm:text-sm text-zinc-900 dark:text-white hover:text-[#e84a27] transition-colors select-none">
                <span className="flex items-center gap-2">
                  <span>🤖</span>
                  <span>AI Corridor Bulk Seeder (Grünerløkka, Torggata, Frogner)</span>
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 pt-2 border-t border-[#181615]/5">
                <BulkVenueSeeder />
              </div>
            </details>

            {/* 2. Google Places Single Importer Dropdown Accordion */}
            <details className="group rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 overflow-hidden shadow-xs">
              <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs sm:text-sm text-zinc-900 dark:text-white hover:text-[#e84a27] transition-colors select-none">
                <span className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Google Places Single Spot Importer</span>
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 pt-2 border-t border-[#181615]/5">
                <VenueImporter />
              </div>
            </details>

            {/* 3. Manual Add Venue Dropdown Accordion */}
            <details className="group rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 overflow-hidden shadow-xs">
              <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs sm:text-sm text-zinc-900 dark:text-white hover:text-[#e84a27] transition-colors select-none">
                <span className="flex items-center gap-2">
                  <span>➕</span>
                  <span>Add Spot Manually (Fallback)</span>
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 pt-2 border-t border-[#181615]/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name">
                    <input value={vName} onChange={(e) => setVName(e.target.value)} className={inputCls} placeholder="Fjord Coffee" />
                  </Field>
                  <Field label="Neighborhood">
                    <select
                      value={vNeighborhood}
                      onChange={(e) => setVNeighborhood(e.target.value as Neighborhood)}
                      className={inputCls}
                    >
                      {NEIGHBORHOODS.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Address">
                  <input value={vAddress} onChange={(e) => setVAddress(e.target.value)} className={inputCls} placeholder="Markveien 12" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Food Category">
                    <select
                      value={vCategory}
                      onChange={(e) => setVCategory(e.target.value as FoodCategory)}
                      className={inputCls}
                    >
                      {VENUE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Hours / Status">
                    <input
                      value={vStatus}
                      onChange={(e) => setVStatus(e.target.value)}
                      className={inputCls}
                      placeholder="Open 08–17 · Kitchen till 16:30"
                    />
                  </Field>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dietary Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {DIETARY_OPTIONS.map((d) => {
                      const active = vDietary.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() =>
                            setVDietary((prev) =>
                              prev.includes(d.id) ? prev.filter((t) => t !== d.id) : [...prev, d.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            active
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          {d.emoji} {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude">
                    <input
                      type="number"
                      step="0.0001"
                      value={vLat}
                      onChange={(e) => setVLat(Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      type="number"
                      step="0.0001"
                      value={vLng}
                      onChange={(e) => setVLng(Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={vOpenNow}
                    onChange={(e) => setVOpenNow(e.target.checked)}
                    className="accent-[#e84a27]"
                  />
                  Open now
                </label>

                <button
                  type="button"
                  onClick={handleAddVenue}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Venue to Radar</span>
                </button>
              </div>
            </details>

            {/* Slide-Up Edit Venue Modal Sheet */}
            {editing && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between border-b border-[#181615]/5 pb-3">
                    <h3 className="font-comico text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-[#e84a27]" />
                      <span>Editing: {editing.name}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 1. Visual Photo Switcher at Top */}
                  <VisualPhotoSwitcher
                    label="Venue Cover Photo"
                    currentImageUrl={editing.cover_image_url || ""}
                    venuePlaceId={editing.google_place_id}
                    venueName={editing.name}
                    category={editing.food_category || "all"}
                    onSelectPhoto={(url) => setEditing({ ...editing, cover_image_url: url })}
                  />

                  {/* 2. Venue Identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Venue Name *">
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Address *">
                      <input
                        value={editing.address}
                        onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Neighborhood">
                      <select
                        value={editing.neighborhood ?? "torggata"}
                        onChange={(e) =>
                          setEditing({ ...editing, neighborhood: e.target.value as Neighborhood })
                        }
                        className={inputCls}
                      >
                        {NEIGHBORHOODS.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Food Category">
                      <select
                        value={editing.food_category ?? "ramen"}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            food_category: e.target.value as FoodCategory,
                            icon: FOOD_CATEGORIES.find((c) => c.id === e.target.value)?.emoji ?? editing.icon,
                          })
                        }
                        className={inputCls}
                      >
                        {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* 3. Opening Hours Picker */}
                  <TimeSlotPicker
                    label="Regular Opening Hours"
                    value={editing.current_opening_hours_text || ""}
                    onChange={(val) => setEditing({ ...editing, current_opening_hours_text: val })}
                  />

                  {/* 4. Kitchen Live Batch Status */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Kitchen Live Batch Status
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "normal", label: "Normal", icon: "✓" },
                        { id: "fresh_batch", label: "Fresh Batch", icon: "🔥" },
                        { id: "low_stock", label: "Few Left", icon: "⚡" },
                        { id: "sold_out", label: "Sold Out", icon: "❌" },
                      ].map((s) => {
                        const active = (editing.kitchen_status?.status || "normal") === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                kitchen_status: {
                                  ...(editing.kitchen_status || {}),
                                  status: s.id as any,
                                  updated_at: new Date().toISOString(),
                                },
                              })
                            }
                            className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              active
                                ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <span>{s.icon}</span>
                            <span className="truncate">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Collapsible GPS Coordinates */}
                  <details className="text-xs text-zinc-500 cursor-pointer pt-1">
                    <summary className="font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                      Advanced GPS Coordinates
                    </summary>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Field label="Latitude">
                        <input
                          type="number"
                          step="0.0001"
                          value={editing.latitude}
                          onChange={(e) => setEditing({ ...editing, latitude: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Longitude">
                        <input
                          type="number"
                          step="0.0001"
                          value={editing.longitude}
                          onChange={(e) => setEditing({ ...editing, longitude: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </details>

                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={editing.open_now ?? false}
                      onChange={(e) => setEditing({ ...editing, open_now: e.target.checked })}
                      className="accent-[#e84a27]"
                    />
                    Open now
                  </label>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#181615]/5">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing venues photo card grid */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#e84a27]" />
                    <span>Registered Venues</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Oslo spots with curated photos, live kitchen status, and zero-password remote links.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {venues.length} total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    {/* 16:9 Cover Photo Header */}
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#EAE6DF] border border-black/5">
                      {v.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.cover_image_url} alt={v.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                          {v.icon || "🏪"}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold capitalize backdrop-blur-xs">
                        {v.food_category || "Spot"}
                      </div>
                      {v.google_rating && (
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-white/95 text-zinc-900 text-[10px] font-mono font-bold shadow-xs">
                          ★ {v.google_rating.toFixed(1)}
                        </div>
                      )}
                      {v.spot_type === "pop_up" && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#E84A27] text-white text-[9px] font-bold">
                          🎟️ Pop-up
                        </div>
                      )}
                    </div>

                    {/* Venue Body */}
                    <div className="space-y-1">
                      <h4 className="font-comico font-black text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                        {v.name}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                        <span className="truncate">{v.address || "Oslo, Norway"}</span>
                      </p>
                      {v.kitchen_status && v.kitchen_status.status !== "normal" && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#e84a27]">
                            {v.kitchen_status.status === "fresh_batch" && "🔥 Fresh Batch"}
                            {v.kitchen_status.status === "low_stock" && "⚡ Few Left"}
                            {v.kitchen_status.status === "sold_out" && "❌ Sold Out"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-[#181615]/5 dark:border-white/5 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          let token = v.kitchen_status?.kitchen_token;
                          if (!token) {
                            token = `smk_kitch_${v.id.replace(/[^a-z0-9]/gi, "").slice(0, 8)}_${Math.random().toString(36).substring(2, 8)}`;
                            const newStatus = {
                              status: v.kitchen_status?.status || "normal",
                              kitchen_token: token,
                              verified_kitchen: true,
                              updated_at: new Date().toISOString(),
                            };
                            await updateVenueDb(v.id, {
                              kitchenStatus: newStatus,
                            });
                            updateVenue(v.id, {
                              kitchen_status: newStatus,
                            });
                          }
                          const url = `${window.location.origin}/kitchen/${token}`;
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            await navigator.clipboard.writeText(url);
                            showToast(`🔗 Copied Kitchen Remote Link for ${v.name}`);
                          } else {
                            prompt("Kitchen Magic Link:", url);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#e84a27] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Copy Zero-Password Kitchen Magic Link"
                      >
                        <span>🔗</span>
                        <span>Remote</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(v)}
                          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                          title="Edit venue"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await deleteVenueById(v.id);
                            if (!res.success) {
                              showToast(res.error ?? "Couldn't delete this venue.");
                              return;
                            }
                            deleteVenue(v.id);
                            showToast(`Removed ${v.name}`);
                          }}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 cursor-pointer"
                          title="Delete venue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <DataCleanupCard />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4 — Partner Claims Moderation Queue                           */}
        {/* ================================================================= */}
        {tab === "claims" && <PartnerClaimsQueue />}

        {/* ================================================================= */}
        {/* TAB 5 — Community Post Moderation Feed Cards                      */}
        {/* ================================================================= */}
        {tab === "moderation" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e84a27]" />
                  <span>Community Post Moderation Queue</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Direct tactile cards matching the home food feed with 1-tap official pick toggle.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>{foodPosts.length} posts</span>
                <span className="text-[#e84a27]">✦ {officialCount} official</span>
              </div>
            </div>

            {/* Responsive Feed Cards Grid — Zero Horizontal Scrolling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foodPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-3xl bg-white dark:bg-[#1C1917] border border-[#181615]/10 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3"
                >
                  {/* 4:3 Food Photo */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE6DF]">
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt={post.dish_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">No Photo</div>
                    )}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                      {post.author?.handle || "@community"}
                    </div>
                    {post.price_nok && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/95 text-zinc-900 text-[10px] font-mono font-bold shadow-xs">
                        {post.price_nok} NOK
                      </div>
                    )}
                    {post.is_official_pick && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#E84A27] text-white text-[9px] font-bold">
                        ✦ Smakr Pick
                      </div>
                    )}
                  </div>

                  {/* Meta & Quote */}
                  <div className="space-y-1">
                    <h4 className="font-comico font-black text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                      {post.dish_name}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                      <span>{post.spot_name}</span>
                    </p>
                    {post.review_text && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic pt-1 leading-snug">
                        &ldquo;{post.review_text}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#181615]/5 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleOfficialPick(post.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        post.is_official_pick
                          ? "bg-[#181615] text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                          : "bg-orange-500/10 text-[#e84a27] hover:bg-orange-500/20"
                      }`}
                    >
                      {post.is_official_pick ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{post.is_official_pick ? "Official" : "Smakr Pick"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPost(post)}
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                        title="Edit dish"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await deleteFoodPostById(post.id);
                          if (!res.success) {
                            showToast(res.error ?? "Couldn't delete this post.");
                            return;
                          }
                          deletePost(post.id);
                          showToast("Post removed from the feed.");
                        }}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 text-xs font-bold cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ================================================================= */}
        {/* TAB 4 — Settings (typeface + appearance)                           */}
        {/* ================================================================= */}
        {tab === "settings" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#e84a27]" />
              Appearance &amp; Typeface
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The app body typeface. Kept as <strong>Syne</strong> for the beta run — change it here if needed.
            </p>
            <BodyFontPicker />
          </Card>
        )}
      </div>

      {editingPost && (
        <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} />
      )}

      {/* Admin Pop-up Wizard Modal */}
      <AdminPopupWizardModal
        isOpen={isPopupWizardOpen}
        onClose={() => setIsPopupWizardOpen(false)}
        editingPopupVenue={editingPopupVenue}
      />
    </div>
  );
}
