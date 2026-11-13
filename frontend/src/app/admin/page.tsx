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
  ChevronRight,
  Search,
  Star,
  Clock,
  Loader2,
  FlaskConical,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  DietaryTag,
  FoodCategory,
  FoodPost,
  Neighborhood,
  Venue,
  WeeklyPick,
  PopupResidencyMeta,
  ResidencyStatus,
} from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { isCustomFoodIcon, SmakrFoodIcon } from "@/components/food/FoodIcons";
import { VenueImporter, DataCleanupCard } from "@/components/admin/VenueImporter";
import { BulkVenueSeeder } from "@/components/admin/BulkVenueSeeder";
import { EditPostModal } from "@/components/admin/EditPostModal";
import {
  broadcastWeeklyPick,
  fetchFoodPosts,
  fetchVenues,
  deleteVenueById,
  deleteFoodPostById,
  updateVenue as updateVenueDb,
  updateFoodPost as updateFoodPostDb,
  insertVenue,
} from "@/lib/supabase/data";
import { triggerAdminRevalidate } from "@/lib/adminUpload";
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

const inputCls =
  "w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DDD6C9] text-[#181615] placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

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
      className={`rounded-3xl border border-[#E7E0D4] bg-white p-4 sm:p-5 shadow-xs ${className}`}
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
  const updatePost = useCityPulseStore((state) => state.updatePost);
  const deleteVenue = useCityPulseStore((state) => state.deleteVenue);
  const deletePost = useCityPulseStore((state) => state.deletePost);
  const toggleOfficialPick = useCityPulseStore((state) => state.toggleOfficialPick);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [tab, setTab] = useState<TabId>("dispatch");
  const [selectedDishId, setSelectedDishId] = useState("");
  const [editingPost, setEditingPost] = useState<FoodPost | null>(null);
  const [venueSearch, setVenueSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");

  /* ---------- Weekly Dispatch Interactive Editor State ---------- */
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchPanel, setDispatchPanel] = useState<"spot" | "photo" | "bubble">("spot");
  const [dispatchInline, setDispatchInline] = useState<"dish" | "price" | "label" | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

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
    const prevMeta = venue.popup_meta;
    updateVenue(venue.id, {
      popup_meta: updatedMeta,
    });
    const res = await updateVenueDb(venue.id, {
      popupMeta: updatedMeta,
    });
    if (!res.success) {
      updateVenue(venue.id, { popup_meta: prevMeta });
      showToast(res.error || `Could not update ${venue.name} status`);
      return;
    }
    await triggerAdminRevalidate();
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
  const [addingVenue, setAddingVenue] = useState(false);

  /* ---------- Interactive Edit Venue Card State ---------- */
  const [editing, setEditing] = useState<Venue | null>(null);
  const [editInitialCover, setEditInitialCover] = useState("");
  const [editPanel, setEditPanel] = useState<"photo" | "basics" | "hours" | "story">("photo");
  const [editInline, setEditInline] = useState<"name" | null>(null);
  const [syncPrimaryDishPhoto, setSyncPrimaryDishPhoto] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

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
    setBroadcasting(true);
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

    const prevPick = weeklyPick;
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
    setBroadcasting(false);

    if (error) {
      setWeeklyPick(prevPick);
      showToast(`Broadcast failed (${error}).`);
      return;
    }

    await triggerAdminRevalidate();
    showToast("Dispatch broadcast live — feed & map updated!");
    setIsDispatchModalOpen(false);
  };

  const handleAddVenue = async () => {
    if (!vName.trim()) {
      showToast("Give the new venue a name.");
      return;
    }
    setAddingVenue(true);
    const result = await insertVenue({
      name: vName.trim(),
      address: vAddress.trim() || "Oslo",
      category: vCategory,
      neighborhood: vNeighborhood as any,
      latitude: Number(vLat) || 59.9171,
      longitude: Number(vLng) || 10.7516,
      currentOpeningHoursText: vStatus.trim() || undefined,
      dietaryTags: vDietary,
      openNow: vOpenNow,
    });
    setAddingVenue(false);

    if (!result.success || !result.venue) {
      showToast(result.error || "Could not add this venue to the live radar.");
      return;
    }

    if (result.reused) {
      updateVenue(result.venue.id, result.venue);
    } else {
      addVenue(result.venue);
    }

    await triggerAdminRevalidate();
    showToast("Added " + result.venue.name + " to the radar");
    setVName("");
    setVAddress("");
    setVStatus("");
    setVDietary([]);
  };

  const startEdit = (venue: Venue) => {
    setEditing({ ...venue });
    setEditInitialCover(venue.cover_image_url || "");
    setEditPanel("photo");
    setEditInline(null);
    setSyncPrimaryDishPhoto(true);
  };

  const saveEdit = async () => {
    if (!editing || savingEdit) return;
    setSavingEdit(true);
    try {
      const cat = editing.food_category ?? "ramen";
      const emoji = isCustomFoodIcon(cat)
        ? cat
        : (FOOD_CATEGORIES.find((c) => c.id === cat)?.emoji ?? editing.icon ?? "🥢");

      const res = await updateVenueDb(editing.id, {
        name: editing.name.trim() || editing.name,
        address: editing.address.trim() || "Oslo",
        neighborhood: editing.neighborhood,
        category: cat,
        icon: emoji,
        imageUrl: editing.cover_image_url,
        priceLevel: editing.price_level || "$$",
        description: editing.description,
        signatureDishes: editing.signature_dishes,
        dietaryTags: editing.dietary_tags,
        currentOpeningHoursText: editing.current_opening_hours_text,
        latitude: editing.latitude,
        longitude: editing.longitude,
        openNow: editing.open_now,
        kitchenStatus: editing.kitchen_status,
      });

      if (!res.success) {
        showToast(res.error || "Could not save venue changes to database.");
        return;
      }

      updateVenue(editing.id, {
        name: editing.name.trim() || editing.name,
        address: editing.address.trim() || "Oslo",
        neighborhood: editing.neighborhood,
        latitude: editing.latitude,
        longitude: editing.longitude,
        open_now: editing.open_now,
        dietary_tags: editing.dietary_tags,
        signature_dishes: editing.signature_dishes,
        description: editing.description,
        price_level: editing.price_level || "$$",
        food_category: cat,
        icon: emoji,
        cover_image_url: editing.cover_image_url,
        current_opening_hours_text: editing.current_opening_hours_text,
        kitchen_status: editing.kitchen_status,
      });

      // Keep the linked primary feed dish photo in sync when requested so FoodSpotCard updates immediately
      const linkedPrimaryPost = foodPosts.find((p) => p.spot_id === editing.id);
      if (
        syncPrimaryDishPhoto &&
        linkedPrimaryPost &&
        editing.cover_image_url &&
        editing.cover_image_url !== editInitialCover
      ) {
        const postRes = await updateFoodPostDb(linkedPrimaryPost.id, {
          dishImage: editing.cover_image_url,
        });
        if (!postRes.error) {
          updatePost(linkedPrimaryPost.id, { image_url: editing.cover_image_url });
        }
      }

      await triggerAdminRevalidate();
      showToast(`Saved ${editing.name} — live on Oslo radar`);
      setEditing(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const officialCount = foodPosts.filter((p) => p.is_official_pick).length;
  const editingLinkedPost = editing
    ? foodPosts.find((p) => p.spot_id === editing.id) ?? null
    : null;
  const filteredVenuesList = useMemo(() => {
    const q = venueSearch.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.address || "").toLowerCase().includes(q) ||
        (v.neighborhood || "").toLowerCase().includes(q) ||
        (v.food_category || "").toLowerCase().includes(q)
    );
  }, [venues, venueSearch]);
  const filteredPostsList = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    if (!q) return foodPosts;
    return foodPosts.filter(
      (p) =>
        p.dish_name.toLowerCase().includes(q) ||
        p.spot_name.toLowerCase().includes(q) ||
        (p.review_text || "").toLowerCase().includes(q)
    );
  }, [foodPosts, postSearch]);

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#F7F2E8] text-[#181615]">
      <div className="pt-3 sm:pt-5 pb-16 px-3 sm:px-6 max-w-6xl mx-auto">
        {/* ============ Top administrative bar ============ */}
        <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2.5 mb-5 bg-[#F7F2E8]/92 backdrop-blur-md border-b border-[#181615]/10 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Back to Food Radar + Studio Nav */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#181615] hover:text-[#e84a27] border border-[#181615]/10 shadow-xs text-xs font-bold transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Radar</span>
            </Link>
            <Link
              href="/admin/seeding-lab"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#181615] hover:bg-zinc-800 text-white shadow-xs text-xs font-bold transition-all active:scale-95 shrink-0"
              title="Open AI Seeding Lab"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#E84A27]" />
              <span className="hidden xs:inline">Seeding Lab</span>
              <span className="xs:hidden">Lab</span>
            </Link>
          </div>

          {/* Center: SMAKR CONTROL CENTER + @handle dot */}
          <div className="hidden md:flex items-center gap-1.5 text-center truncate">
            <span className="font-comico text-base text-[#181615] tracking-wide">
              SMAKR <span className="text-[#e84a27]">STUDIO</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[110px]">
              @{currentUser?.handle || "admin"}
            </span>
          </div>

          {/* Right: Quick Creation + Mascot Studio */}
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
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#181615] hover:text-[#e84a27] border border-[#181615]/10 shadow-xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Manage Oslo spots"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spot</span>
            </button>
            <Link
              href="/mascot-studio"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-[#181615] hover:text-[#e84a27] border border-[#181615]/10 shadow-xs text-xs font-bold transition-all active:scale-95"
              title="Open Mascot Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
              <span className="hidden sm:inline">Mascot</span>
            </Link>
          </div>
        </div>

        {/* ============ Horizontal Scrollable Segmented Tab Bar ============ */}
        <div className="mb-6 p-1.5 rounded-2xl bg-[#EFEAE1] border border-[#181615]/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                    ? "bg-[#181615] text-white shadow-xs"
                    : "text-zinc-600 hover:text-[#181615] hover:bg-white/60"
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
                <h2 className="font-comico font-black text-base text-[#181615]">
                  Active Weekly Dispatch
                </h2>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Live in Feed
              </span>
            </div>

            {/* Current Live Card View (click directly to launch card studio) */}
            <Card className="space-y-4 p-4 sm:p-5 bg-[#FAF7F2]">
              <button
                type="button"
                onClick={() => {
                  setDispatchPanel("photo");
                  setDispatchInline(null);
                  setIsDispatchModalOpen(true);
                }}
                className="group relative block w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#181615]/10 bg-[#EAE6DF] text-left cursor-pointer"
              >
                {weeklyPick.dish_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={weeklyPick.dish_image}
                    alt={weeklyPick.dish_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#181615]/85 text-white text-[11px] font-bold backdrop-blur-xs">
                  ✦ {weeklyPick.week_label || "Weekly Pick"}
                </span>
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#e84a27] text-white text-xs font-mono font-bold shadow-xs">
                  {weeklyPick.price_nok} NOK
                </span>
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-comico font-black text-xl text-white drop-shadow-md truncate">
                      {weeklyPick.dish_name}
                    </h3>
                    <p className="text-xs text-white/90 flex items-center gap-1 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                      <span>
                        {selectedVenue?.name || "Spotlight Venue"} ·{" "}
                        {selectedVenue?.neighborhood || selectedVenue?.city || "Oslo"}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/95 text-[#181615] text-[11px] font-bold shadow-xs">
                    Tap to edit
                  </span>
                </div>
              </button>

              <div className="p-3.5 rounded-2xl bg-white border border-[#181615]/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-500/10 shrink-0 border border-orange-500/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      weeklyPick.mascot_avatar_url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                    }
                    alt="Mascot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27] block">
                    Mascot Speech Bubble
                  </span>
                  <p className="font-comico text-xs sm:text-sm text-[#181615] mt-0.5 leading-snug">
                    &ldquo;{weeklyPick.speech_bubble || "Skip the queue — order before 17:30!"}&rdquo;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDispatchPanel("spot");
                  setDispatchInline(null);
                  setIsDispatchModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#e84a27] hover:bg-[#d43d1c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#e84a27]/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Weekly Drop Card</span>
              </button>
            </Card>

            {/* Interactive Preview-First Weekly Dispatch Modal Sheet */}
            {isDispatchModalOpen && (
              <div
                className="fixed inset-0 z-50 bg-[#181615]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
                onClick={() => setIsDispatchModalOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#FAF7F2] border border-[#181615]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-white border-b border-[#EAE5DC] shrink-0">
                    <div>
                      <h3 className="font-comico text-base sm:text-lg font-bold text-[#181615] flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-[#e84a27]" />
                        <span>Weekly Drop Card</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Click photo, dish title, NOK, label, or bubble right on the card.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
                    {/* Clickable Live Weekly Pick Card */}
                    <div
                      onClick={() => {
                        setDispatchInline(null);
                        setDispatchPanel("photo");
                      }}
                      className="group relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#EAE6DF] border border-[#DDD6C9] shadow-md cursor-pointer"
                    >
                      {dishImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dishImage}
                          alt={dishName || "Weekly Pick"}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/25 pointer-events-none" />

                      {/* Week Label Badge (Inline Editable) */}
                      <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
                        {dispatchInline === "label" ? (
                          <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-lg border border-[#e84a27]">
                            <input
                              type="text"
                              autoFocus
                              value={label}
                              onChange={(e) => setLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setDispatchInline(null);
                              }}
                              className="w-28 text-[11px] font-bold text-[#181615] bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setDispatchInline(null)}
                              className="p-0.5 rounded-full bg-[#e84a27] text-white cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDispatchInline("label")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181615]/85 hover:bg-[#181615] text-white text-[11px] font-bold cursor-pointer"
                          >
                            <span>✦ {label || "Weekly Pick"}</span>
                            <Pencil className="w-2.5 h-2.5 opacity-80" />
                          </button>
                        )}
                      </div>

                      {/* Price Badge (Inline Editable) */}
                      <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                        {dispatchInline === "price" ? (
                          <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-lg border border-[#e84a27]">
                            <input
                              type="number"
                              autoFocus
                              value={price}
                              onChange={(e) => setPrice(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setDispatchInline(null);
                              }}
                              className="w-14 text-xs font-black text-[#181615] bg-transparent focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-zinc-400">NOK</span>
                            <button
                              type="button"
                              onClick={() => setDispatchInline(null)}
                              className="p-0.5 rounded-full bg-[#e84a27] text-white cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDispatchInline("price")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-black shadow-md cursor-pointer"
                          >
                            <span>{price || 0} NOK</span>
                            <Pencil className="w-2.5 h-2.5 opacity-80" />
                          </button>
                        )}
                      </div>

                      {/* Dish Title & Spot Line */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 z-20 space-y-0.5" onClick={(e) => e.stopPropagation()}>
                        {dispatchInline === "dish" ? (
                          <div className="flex items-center gap-1.5 bg-white/95 rounded-xl px-2.5 py-1.5 shadow-lg border border-[#e84a27]">
                            <input
                              type="text"
                              autoFocus
                              value={dishName}
                              onChange={(e) => setDishName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setDispatchInline(null);
                              }}
                              className="w-full text-sm font-bold text-[#181615] bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setDispatchInline(null)}
                              className="px-2 py-0.5 rounded-lg bg-[#e84a27] text-white text-[11px] font-bold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDispatchInline("dish")}
                            className="inline-flex items-center gap-1.5 text-left max-w-full cursor-pointer group/dish"
                          >
                            <h4 className="font-comico font-black text-xl text-white drop-shadow-md truncate group-hover/dish:underline decoration-[#e84a27] decoration-2 underline-offset-4">
                              {dishName || "Tap to name dish"}
                            </h4>
                            <Pencil className="w-3.5 h-3.5 text-white/80 shrink-0" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDispatchPanel("spot")}
                          className="flex items-center gap-1 text-xs text-white/90 hover:text-white cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                          <span className="truncate">{selectedVenue?.name || "Tap to choose Oslo venue"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Clickable Speech Bubble Preview */}
                    <button
                      type="button"
                      onClick={() => setDispatchPanel("bubble")}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        dispatchPanel === "bubble"
                          ? "bg-white border-[#e84a27] shadow-xs"
                          : "bg-white border-[#EAE5DC] hover:border-zinc-300"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27] block">
                          Mascot Speech Bubble
                        </span>
                        <p className="font-comico text-xs text-[#181615] truncate mt-0.5">
                          &ldquo;{speech || "Tap to write the radar pin quote..."}&rdquo;
                        </p>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </button>

                    {/* Focused Section Switcher */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#EFEAE1]">
                      {[
                        { id: "spot" as const, label: "Spot & Dish" },
                        { id: "photo" as const, label: "Photo" },
                        { id: "bubble" as const, label: "Speech Bubble" },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setDispatchPanel(sec.id)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            dispatchPanel === sec.id
                              ? "bg-[#181615] text-white shadow-xs"
                              : "text-zinc-600 hover:text-[#181615]"
                          }`}
                        >
                          {sec.label}
                        </button>
                      ))}
                    </div>

                    {/* Active Panel */}
                    {dispatchPanel === "spot" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <Field label="Spotlight Venue *">
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

                        {foodPosts.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Quick-Pick From Feed Dishes
                            </span>
                            <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5 rounded-2xl border border-[#EAE5DC] p-1.5 bg-[#FAF7F2]">
                              {foodPosts.slice(0, 12).map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleDishSelect(p.id)}
                                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer group ${
                                    selectedDishId === p.id
                                      ? "bg-[#E84A27]/10 ring-1 ring-[#E84A27]/40"
                                      : "hover:bg-white"
                                  }`}
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
                                      <p className="font-bold text-[#181615] truncate group-hover:text-[#e84a27]">
                                        {p.dish_name}
                                      </p>
                                      <p className="text-[11px] text-zinc-500 truncate">@{p.spot_name}</p>
                                    </div>
                                  </div>
                                  {p.price_nok && (
                                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-zinc-800 shrink-0 border border-black/5">
                                      {p.price_nok} kr
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {dispatchPanel === "photo" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC]">
                        <VisualPhotoSwitcher
                          label="Featured Dish Photo"
                          currentImageUrl={dishImage}
                          venuePlaceId={selectedVenue?.google_place_id}
                          venueName={selectedVenue?.name}
                          category={selectedVenue?.food_category || "all"}
                          onSelectPhoto={(url) => setDishImage(url)}
                        />
                      </div>
                    )}

                    {dispatchPanel === "bubble" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <Field label="Mascot Speech Bubble Note *">
                          <textarea
                            value={speech}
                            onChange={(e) => setSpeech(e.target.value)}
                            rows={2}
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
                              "Skip the queue — order before 17:30!",
                              "Limited 80 bowls per night — arrive when doors open at 17:00.",
                              "Fresh warm cardamom buns straight from the oven at 08:30.",
                            ].map((quote) => (
                              <button
                                key={quote}
                                type="button"
                                onClick={() => setSpeech(quote)}
                                className="text-left text-xs p-2 rounded-xl bg-[#FAF7F2] hover:bg-orange-500/10 text-zinc-700 transition-colors cursor-pointer"
                              >
                                &ldquo;{quote}&rdquo;
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sticky Broadcast Footer */}
                  <div className="px-4 sm:px-5 py-3 border-t border-[#EAE5DC] bg-white flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC] text-zinc-600 text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBroadcast}
                      disabled={broadcasting || !venueId}
                      className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#e84a27]/20 cursor-pointer"
                    >
                      {broadcasting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                      <span>{broadcasting ? "Broadcasting..." : "Broadcast Live"}</span>
                    </button>
                  </div>
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
                              await triggerAdminRevalidate();
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
            {/* Seeding Verification Lab Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#1C1A19] border border-[#e84a27]/30 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Manual Seeding Verification Lab</h3>
                  <p className="text-xs text-zinc-400">Visually vet candidate spots, verify dish macros, swap photos, and approve before production seed.</p>
                </div>
              </div>
              <Link
                href="/admin/seeding-lab"
                className="px-4 py-2 rounded-2xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <span>Open Seeding Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
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
                  disabled={addingVenue}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {addingVenue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{addingVenue ? "Adding..." : "Add Venue to Radar"}</span>
                </button>
              </div>
            </details>

            {/* Interactive Preview-First Edit Venue Modal Sheet */}
            {editing && (
              <div
                className="fixed inset-0 z-50 bg-[#181615]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
                onClick={() => setEditing(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#FAF7F2] border border-[#181615]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
                >
                  {/* Sticky Modal Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-white border-b border-[#EAE5DC] shrink-0">
                    <div className="min-w-0">
                      <h3 className="font-comico text-base sm:text-lg font-bold text-[#181615] flex items-center gap-2 truncate">
                        <Pencil className="w-4 h-4 text-[#e84a27] shrink-0" />
                        <span className="truncate">Edit Spot Card</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Tap photo, name, price tier, category, hours, or story on the card.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer shrink-0"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
                    {/* Interactive Live FoodSpotCard Preview */}
                    <div className="rounded-3xl bg-white border border-[#E7E0D4] shadow-md overflow-hidden">
                      {/* Cover Photo */}
                      <div
                        onClick={() => {
                          setEditInline(null);
                          setEditPanel("photo");
                        }}
                        className="group relative aspect-[16/9] w-full bg-[#EAE6DF] cursor-pointer overflow-hidden"
                      >
                        {editing.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editing.cover_image_url}
                            alt={editing.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1">
                            <ImageIcon className="w-8 h-8 opacity-40" />
                            <span className="text-xs font-semibold">Tap to add cover photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15 pointer-events-none" />

                        {/* Top-Left Rating + Open Pill */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                          {editing.google_rating && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-[#181615] text-[11px] font-mono font-bold shadow-xs">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                              {editing.google_rating.toFixed(1)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing({ ...editing, open_now: !(editing.open_now ?? false) });
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs cursor-pointer transition-colors ${
                              editing.open_now
                                ? "bg-emerald-500 text-white"
                                : "bg-[#181615]/80 text-white/90"
                            }`}
                          >
                            {editing.open_now ? "● Open now" : "Closed"}
                          </button>
                        </div>

                        {/* Top-Right Category Badge + Photo hint */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPanel("basics");
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-[#181615] text-[11px] font-bold shadow-xs cursor-pointer"
                          >
                            <SmakrFoodIcon name={editing.food_category || "ramen"} className="w-4 h-4" />
                            <span className="capitalize">
                              {(editing.food_category || "ramen").replace("_", " ")}
                            </span>
                          </button>
                        </div>

                        {/* Bottom Card Info Overlay (Name + Price Tier + Location) */}
                        <div
                          className="absolute bottom-3 left-3.5 right-3.5 z-20 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-end justify-between gap-2">
                            {editInline === "name" ? (
                              <div className="flex-1 flex items-center gap-1.5 bg-white/95 rounded-xl px-2.5 py-1.5 shadow-lg border border-[#e84a27]">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editing.name}
                                  onChange={(e) =>
                                    setEditing({ ...editing, name: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") setEditInline(null);
                                  }}
                                  className="w-full text-sm font-bold text-[#181615] bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditInline(null)}
                                  className="px-2 py-0.5 rounded-lg bg-[#e84a27] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditInline("name")}
                                className="group/vname inline-flex items-center gap-1.5 max-w-[75%] text-left cursor-pointer"
                              >
                                <h4 className="font-comico font-black text-xl text-white drop-shadow-md truncate group-hover/vname:underline decoration-[#e84a27] decoration-2 underline-offset-4">
                                  {editing.name}
                                </h4>
                                <Pencil className="w-3.5 h-3.5 text-white/80 shrink-0" />
                              </button>
                            )}

                            {/* 1-Tap Price Tier Cycle ($ -> $$ -> $$$) */}
                            <button
                              type="button"
                              onClick={() => {
                                const order: ("$" | "$$" | "$$$")[] = ["$", "$$", "$$$"];
                                const cur = (editing.price_level || "$$") as "$" | "$$" | "$$$";
                                const next = order[(order.indexOf(cur) + 1) % order.length];
                                setEditing({ ...editing, price_level: next });
                              }}
                              title="Tap to cycle price tier"
                              className="px-2.5 py-1 rounded-full bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-black tracking-wider shadow-md shrink-0 cursor-pointer transition-transform active:scale-95"
                            >
                              {editing.price_level || "$$"}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditPanel("basics")}
                            className="flex items-center gap-1 text-xs text-white/90 hover:text-white cursor-pointer max-w-full"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                            <span className="truncate">
                              {editing.neighborhood || "Oslo"} · {editing.address || "Add address"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Card Footer Strip (Hours / Batch Status / Signature Dish) */}
                      <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditPanel("hours")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE5DC] hover:border-[#e84a27] text-[#181615] font-semibold cursor-pointer transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#e84a27]" />
                          <span className="truncate max-w-[180px]">
                            {editing.current_opening_hours_text || "Set opening hours"}
                          </span>
                          {editing.kitchen_status?.status &&
                            editing.kitchen_status.status !== "normal" && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#e84a27]/10 text-[#e84a27] text-[10px] font-bold">
                                {editing.kitchen_status.status === "fresh_batch"
                                  ? "Fresh Batch"
                                  : editing.kitchen_status.status === "low_stock"
                                    ? "Few Left"
                                    : "Sold Out"}
                              </span>
                            )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditPanel("story")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE5DC] hover:border-[#e84a27] text-zinc-700 font-semibold cursor-pointer transition-colors"
                        >
                          <span className="truncate max-w-[160px]">
                            {editing.signature_dishes?.[0] || "Tap for story & tags"}
                          </span>
                          <Pencil className="w-3 h-3 text-[#e84a27] shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* Section Pill Switcher */}
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#EFEAE1]">
                      {[
                        { id: "photo" as const, label: "Photo" },
                        { id: "basics" as const, label: "Basics" },
                        { id: "hours" as const, label: "Hours & Live" },
                        { id: "story" as const, label: "Story & Tags" },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setEditPanel(sec.id)}
                          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            editPanel === sec.id
                              ? "bg-[#181615] text-white shadow-xs"
                              : "text-zinc-600 hover:text-[#181615]"
                          }`}
                        >
                          {sec.label}
                        </button>
                      ))}
                    </div>

                    {/* PANEL 1: PHOTO */}
                    {editPanel === "photo" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <VisualPhotoSwitcher
                          label="Venue Cover Photo"
                          currentImageUrl={editing.cover_image_url || ""}
                          venuePlaceId={editing.google_place_id}
                          venueName={editing.name}
                          category={editing.food_category || "all"}
                          onSelectPhoto={(url) =>
                            setEditing({ ...editing, cover_image_url: url })
                          }
                        />

                        {editingLinkedPost && (
                          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC] text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={syncPrimaryDishPhoto}
                              onChange={(e) => setSyncPrimaryDishPhoto(e.target.checked)}
                              className="mt-0.5 accent-[#e84a27]"
                            />
                            <div>
                              <span className="font-bold text-[#181615] block">
                                Also sync cover photo to primary feed dish card
                              </span>
                              <span className="text-[11px] text-zinc-500">
                                Updates &ldquo;{editingLinkedPost.dish_name}&rdquo; so the live Oslo radar card matches right away.
                              </span>
                            </div>
                          </label>
                        )}
                      </div>
                    )}

                    {/* PANEL 2: BASICS & GPS */}
                    {editPanel === "basics" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Address *">
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
                        </div>

                        <Field label="Food Category">
                          <select
                            value={editing.food_category ?? "ramen"}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                food_category: e.target.value as FoodCategory,
                                icon: isCustomFoodIcon(e.target.value)
                                  ? e.target.value
                                  : (FOOD_CATEGORIES.find((c) => c.id === e.target.value)?.emoji ??
                                      editing.icon),
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

                        <details className="text-xs text-zinc-500 cursor-pointer pt-1">
                          <summary className="font-semibold text-zinc-600 hover:text-zinc-900">
                            Advanced GPS Coordinates
                          </summary>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <Field label="Latitude">
                              <input
                                type="number"
                                step="0.0001"
                                value={editing.latitude}
                                onChange={(e) =>
                                  setEditing({ ...editing, latitude: Number(e.target.value) })
                                }
                                className={inputCls}
                              />
                            </Field>
                            <Field label="Longitude">
                              <input
                                type="number"
                                step="0.0001"
                                value={editing.longitude}
                                onChange={(e) =>
                                  setEditing({ ...editing, longitude: Number(e.target.value) })
                                }
                                className={inputCls}
                              />
                            </Field>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* PANEL 3: HOURS & KITCHEN BATCH STATUS */}
                    {editPanel === "hours" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <TimeSlotPicker
                          label="Regular Opening Hours"
                          value={editing.current_opening_hours_text || ""}
                          onChange={(val) =>
                            setEditing({ ...editing, current_opening_hours_text: val })
                          }
                        />

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Kitchen Live Batch Status
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    active
                                      ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                                      : "bg-[#FAF7F2] text-zinc-600 border-[#EAE5DC] hover:bg-zinc-100"
                                  }`}
                                >
                                  <span>{s.icon}</span>
                                  <span className="truncate">{s.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editing.open_now ?? false}
                            onChange={(e) => setEditing({ ...editing, open_now: e.target.checked })}
                            className="accent-[#e84a27]"
                          />
                          <span>Open now on live radar</span>
                        </label>
                      </div>
                    )}

                    {/* PANEL 4: SIGNATURE DISH, STORY & DIETARY */}
                    {editPanel === "story" && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                        <Field label="Signature Dish">
                          <input
                            value={editing.signature_dishes?.[0] || ""}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                signature_dishes: e.target.value ? [e.target.value] : [],
                              })
                            }
                            placeholder="e.g. Spicy Miso Tonkotsu"
                            className={inputCls}
                          />
                        </Field>

                        <Field label="Insider Editorial Story">
                          <textarea
                            rows={2}
                            value={editing.description || ""}
                            onChange={(e) =>
                              setEditing({ ...editing, description: e.target.value })
                            }
                            placeholder="Short Oslo insider note for why this spot belongs on Smakr..."
                            className={`${inputCls} resize-none`}
                          />
                        </Field>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Dietary Tags
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {DIETARY_OPTIONS.map((d) => {
                              const active = (editing.dietary_tags || []).includes(d.id);
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    const cur = editing.dietary_tags || [];
                                    setEditing({
                                      ...editing,
                                      dietary_tags: active
                                        ? cur.filter((t) => t !== d.id)
                                        : [...cur, d.id],
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                                    active
                                      ? "bg-[#181615] text-white border-[#181615]"
                                      : "bg-[#FAF7F2] text-zinc-600 border-[#EAE5DC] hover:bg-zinc-100"
                                  }`}
                                >
                                  {d.emoji} {d.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sticky Footer */}
                  <div className="px-4 sm:px-5 py-3 border-t border-[#EAE5DC] bg-white flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC] text-zinc-600 text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#e84a27]/20 cursor-pointer"
                    >
                      {savingEdit ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing venues photo card grid */}
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#181615] flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#e84a27]" />
                    <span>Registered Venues</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tap any card to edit photo, price tier, hours, or copy kitchen remote link.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE5DC] text-zinc-700">
                  {filteredVenuesList.length} / {venues.length}
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  placeholder="Search spots by name, street, neighborhood, or category..."
                  className={`${inputCls} pl-9`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredVenuesList.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-3xl bg-[#FAF7F2] border border-[#E7E0D4] shadow-xs flex flex-col justify-between space-y-3"
                  >
                    {/* Clickable 16:9 Cover Photo Header -> opens interactive card editor */}
                    <button
                      type="button"
                      onClick={() => startEdit(v)}
                      className="group relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#EAE6DF] border border-black/5 text-left cursor-pointer"
                    >
                      {v.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.cover_image_url}
                          alt={v.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                          {v.icon || "🏪"}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#181615]/75 text-white text-[10px] font-bold capitalize backdrop-blur-xs">
                        {(v.food_category || "Spot").replace("_", " ")}
                      </div>
                      {v.google_rating && (
                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-white/95 text-[#181615] text-[10px] font-mono font-bold shadow-xs">
                          ★ {v.google_rating.toFixed(1)}
                        </div>
                      )}
                      {isPopupVenue(v) && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#E84A27] text-white text-[9px] font-bold">
                          🎟️ Pop-up
                        </div>
                      )}
                      {v.price_level && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/95 text-[#181615] text-[10px] font-black shadow-xs">
                          {v.price_level}
                        </div>
                      )}
                    </button>

                    {/* Venue Body */}
                    <div className="space-y-1">
                      <h4 className="font-comico font-black text-sm sm:text-base text-[#181615] truncate">
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
                    <div className="pt-2 border-t border-[#181615]/5 flex items-center justify-between gap-1.5">
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
                            const res = await updateVenueDb(v.id, {
                              kitchenStatus: newStatus,
                            });
                            if (!res.success) {
                              showToast(res.error || "Could not create kitchen link.");
                              return;
                            }
                            updateVenue(v.id, {
                              kitchen_status: newStatus,
                            });
                          }
                          const url = `${window.location.origin}/kitchen/${token}`;
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            await navigator.clipboard.writeText(url);
                            showToast(`Copied Kitchen Remote Link for ${v.name}`);
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
                          className="p-2 rounded-xl bg-white border border-[#EAE5DC] hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                          title="Edit venue card"
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
                            await triggerAdminRevalidate();
                            showToast(`Removed ${v.name}`);
                          }}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#181615] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e84a27]" />
                  <span>Community Post Moderation Queue</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tap any dish card to edit photo, price, taste note, or diner quotes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span>
                  {filteredPostsList.length}/{foodPosts.length} posts
                </span>
                <span className="text-[#e84a27]">✦ {officialCount} official</span>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Search dishes by name, spot, or review text..."
                className={`${inputCls} pl-9`}
              />
            </div>

            {/* Responsive Feed Cards Grid — Zero Horizontal Scrolling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPostsList.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-3xl bg-[#FAF7F2] border border-[#E7E0D4] shadow-xs flex flex-col justify-between space-y-3"
                >
                  {/* Clickable 4:3 Food Photo -> opens click-to-edit Dish Modal */}
                  <button
                    type="button"
                    onClick={() => setEditingPost(post)}
                    className="group relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EAE6DF] text-left cursor-pointer"
                  >
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image_url}
                        alt={post.dish_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        No Photo
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#181615]/75 text-white text-[10px] font-bold backdrop-blur-xs">
                      {post.author?.handle || "@community"}
                    </div>
                    {post.price_nok && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/95 text-[#181615] text-[10px] font-mono font-bold shadow-xs">
                        {post.price_nok} NOK
                      </div>
                    )}
                    {post.is_official_pick && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#E84A27] text-white text-[9px] font-bold">
                        ✦ Smakr Pick
                      </div>
                    )}
                  </button>

                  {/* Meta & Quote */}
                  <div className="space-y-1">
                    <h4 className="font-comico font-black text-sm sm:text-base text-[#181615] truncate">
                      {post.dish_name}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                      <span>{post.spot_name}</span>
                    </p>
                    {post.review_text && (
                      <p className="text-xs text-zinc-600 line-clamp-2 italic pt-1 leading-snug">
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
                          ? "bg-[#181615] text-white shadow-xs"
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
                        className="p-2 rounded-xl bg-white border border-[#EAE5DC] hover:bg-zinc-100 text-zinc-700 text-xs font-bold cursor-pointer"
                        title="Edit dish card"
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
                          await triggerAdminRevalidate();
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
