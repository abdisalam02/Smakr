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
} from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { VenueImporter, DataCleanupCard } from "@/components/admin/VenueImporter";
import { EditPostModal } from "@/components/admin/EditPostModal";
import { broadcastWeeklyPick, fetchFoodPosts, fetchVenues, deleteVenueById, deleteFoodPostById } from "@/lib/supabase/data";
import { BodyFontPicker } from "@/components/ui/FontSwitcher";

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

type TabId = "dispatch" | "venues" | "moderation" | "settings";

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

  if (!currentUser || currentUser.role !== "admin") {
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
    setPrice(post.price_nok);
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
    else showToast("📣 Dispatch broadcast live — feed & map updated!");
  };

  const handleAddVenue = () => {
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
  };

  const startEdit = (venue: Venue) => setEditing({ ...venue });
  const saveEdit = () => {
    if (!editing) return;
    updateVenue(editing.id, {
      name: editing.name,
      address: editing.address,
      neighborhood: editing.neighborhood,
      latitude: editing.latitude,
      longitude: editing.longitude,
      open_now: editing.open_now,
      dietary_tags: editing.dietary_tags,
    });
    showToast(`Updated ${editing.name}`);
    setEditing(null);
  };

  const officialCount = foodPosts.filter((p) => p.is_official_pick).length;

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[var(--background)]">
      <div className="pt-[70px] pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* ============ Top administrative bar ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#e84a27] border border-zinc-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Food Radar</span>
            </Link>
            <Link
              href="/mascot-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#e84a27] border border-zinc-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Open Mascot Studio</span>
            </Link>
            <button
              onClick={() => setIsThemeStudioOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-[#e84a27] border border-zinc-200 shadow-xs text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Style Studio</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Logged in as {currentUser.handle} (Admin)
            </span>
          </div>
        </div>

        {/* ============ Title ============ */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#e84a27] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restricted · Administrators only</span>
          </div>
          <h1 className="font-comico text-3xl sm:text-4xl text-zinc-900 leading-tight">
            Smakr <span className="text-[#e84a27]">Control Center</span>
          </h1>
        </div>

        {/* ============ Tabs ============ */}
        <div className="mb-5 p-1 rounded-2xl bg-zinc-100 border border-zinc-200 grid grid-cols-4 gap-1">
          {(
            [
              { id: "dispatch", label: "Mascot & Dispatch", emoji: "📣" },
              { id: "venues", label: "Venue Management", emoji: "🏪" },
              { id: "moderation", label: "Post Moderation", emoji: "🛡️" },
              { id: "settings", label: "Settings", emoji: "⚙️" },
            ] as { id: TabId; label: string; emoji: string }[]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active ? "bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span aria-hidden>{t.emoji}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* TAB 1 — Mascot & Weekly Dispatch Manager                          */}
        {/* ================================================================= */}
        {tab === "dispatch" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <Card className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#e84a27]" />
                Weekly Dispatch Manager
              </h2>

              <Field label="Select Existing Dish from Database">
                <select
                  value={selectedDishId}
                  onChange={(e) => handleDishSelect(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Choose a registered dish —</option>
                  {foodPosts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.dish_name} · {p.spot_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Spotlight Venue">
                <select
                  value={venueId}
                  onChange={(e) => handleVenueSelect(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select a venue —</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.neighborhood ?? v.city}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Dish Name">
                  <input value={dishName} onChange={(e) => setDishName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Price (NOK)">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Dish Photo URL">
                <input
                  value={dishImage}
                  onChange={(e) => setDishImage(e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>

              <Field label="Mascot Speech Bubble Note">
                <textarea
                  value={speech}
                  onChange={(e) => setSpeech(e.target.value)}
                  rows={3}
                  placeholder="Skip the queue at Koie, order the Spicy Miso before 17:30!"
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Week Label">
                  <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
                </Field>
              </div>

              <button
                onClick={handleBroadcast}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
              >
                <Megaphone className="w-4 h-4" />
                <span>Broadcast Dispatch Live</span>
              </button>
            </Card>

            {/* Live preview */}
            <Card className="space-y-3 self-start">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Feed preview
              </h3>
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                {dishImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dishImage} alt={dishName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold">
                  ✦ {label || "This Week's Pick"}
                </span>
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 text-zinc-900 text-[10px] font-mono font-bold">
                  {price} NOK
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-zinc-900">{dishName || "Dish name"}</p>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#e84a27]" />
                  {selectedVenue?.name ?? "No venue selected"}
                </p>
              </div>
              <p className="font-comico text-[12.5px] leading-snug text-zinc-700 bg-[var(--surface-raised,#F5EFE3)] rounded-xl px-3 py-2">
                &ldquo;{speech || "Write the mascot's dispatch note…"}&rdquo;
              </p>
            </Card>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2 — Venue Management & Google Places                          */}
        {/* ================================================================= */}
        {tab === "venues" && (
          <div className="space-y-4">
            {/* Google Places importer + interactive photo picker */}
            <VenueImporter />

            <div className="grid grid-cols-1 gap-4">
              {/* Add venue (manual fallback) */}
              <Card className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#e84a27]" />
                  Add Venue
                </h2>

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
                  onClick={handleAddVenue}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Venue to Radar</span>
                </button>
              </Card>
            </div>

            {/* Edit venue inline */}
            {editing && (
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-[#e84a27]" />
                    Editing: {editing.name}
                  </h3>
                  <button onClick={() => setEditing(null)} className="text-zinc-400 hover:text-zinc-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Name">
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      value={editing.address}
                      onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
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
                  <label className="flex items-end gap-2 text-xs font-semibold text-zinc-600 pb-2">
                    <input
                      type="checkbox"
                      checked={editing.open_now ?? false}
                      onChange={(e) => setEditing({ ...editing, open_now: e.target.checked })}
                      className="accent-[#e84a27]"
                    />
                    Open now
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save changes
                  </button>
                </div>
              </Card>
            )}

            {/* Existing venues table */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#e84a27]" />
                  Registered Venues
                </h2>
                <span className="text-[11px] font-mono text-zinc-400">{venues.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                      <th className="py-2 pr-3 font-bold">Name</th>
                      <th className="py-2 pr-3 font-bold">Neighborhood</th>
                      <th className="py-2 pr-3 font-bold">Coords</th>
                      <th className="py-2 pr-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((v) => (
                      <tr key={v.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                        <td className="py-2 pr-3">
                          <span className="font-semibold text-zinc-800">{v.name}</span>
                          <span className="block text-[10px] text-zinc-400">{v.address}</span>
                        </td>
                        <td className="py-2 pr-3 text-zinc-500 capitalize">{v.neighborhood ?? "—"}</td>
                        <td className="py-2 pr-3 font-mono text-[10px] text-zinc-400">
                          {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(v)}
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                              title="Edit venue"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                const res = await deleteVenueById(v.id);
                                if (!res.success) {
                                  showToast(res.error ?? "Couldn't delete this venue.");
                                  return;
                                }
                                deleteVenue(v.id);
                                showToast(`Removed ${v.name}`);
                              }}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                              title="Delete venue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <DataCleanupCard />
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3 — Post & Dish Moderation Queue                              */}
        {/* ================================================================= */}
        {tab === "moderation" && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#e84a27]" />
                Community Post Moderation Queue
              </h2>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>{foodPosts.length} posts</span>
                <span className="text-[#e84a27]">✦ {officialCount} official</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                    <th className="py-2 pr-3 font-bold">Author</th>
                    <th className="py-2 pr-3 font-bold">Spot</th>
                    <th className="py-2 pr-3 font-bold">Dish</th>
                    <th className="py-2 pr-3 font-bold">Created</th>
                    <th className="py-2 pr-3 font-bold">Status</th>
                    <th className="py-2 pr-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foodPosts.map((post) => (
                    <tr key={post.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="py-2 pr-3 text-zinc-600">{post.author.handle}</td>
                      <td className="py-2 pr-3 text-zinc-600">{post.spot_name}</td>
                      <td className="py-2 pr-3 font-semibold text-zinc-800">{post.dish_name}</td>
                      <td className="py-2 pr-3 text-zinc-400 font-mono text-[10px]">
                        {post.created_at_relative}
                      </td>
                      <td className="py-2 pr-3">
                        {post.is_official_pick ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e84a27] text-white text-[10px] font-bold">
                            ✦ Official
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-semibold">
                            Community
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition-colors"
                            title="Edit dish"
                          >
                            <span aria-hidden>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => toggleOfficialPick(post.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                              post.is_official_pick
                                ? "bg-zinc-900 text-white"
                                : "bg-orange-50 text-[#e84a27] hover:bg-orange-100"
                            }`}
                          >
                            {post.is_official_pick ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                            <span>Toggle ✦ Smakr Pick</span>
                          </button>
                          <button
                            onClick={async () => {
                              const res = await deleteFoodPostById(post.id);
                              if (!res.success) {
                                showToast(res.error ?? "Couldn't delete this dish.");
                                return;
                              }
                              deletePost(post.id);
                              showToast("Post removed from the feed.");
                            }}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </div>
  );
}
