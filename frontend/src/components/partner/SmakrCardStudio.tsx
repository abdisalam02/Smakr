"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  X,
  Loader2,
  Plus,
  Mail,
  User,
  Instagram,
  Pencil,
  Camera,
  Calendar,
  Flame,
  Building2,
  Check,
} from "lucide-react";
import {
  StorefrontIcon,
  TicketStubIcon,
  OutdoorParkIcon,
} from "@/components/food/FoodIcons";
import { VisualPhotoSwitcher, toPhotoUrl } from "@/components/ui/VisualPhotoSwitcher";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import type { Venue, DietaryTag, FoodCategory, FoodPost } from "@/types";
import {
  PartnerRestaurantCardPreview,
  type PartnerDishItem,
} from "./PartnerRestaurantCardPreview";
import { PartnerDishCardModal } from "./PartnerDishCardModal";
import { PopupEventCard } from "@/components/food/PopupEventCard";

const PORTION_CAP_OPTIONS = ["Until sold out", "50 / day", "80 / day", "120 / day", "Unlimited"];
const DATE_PRESETS = ["This Weekend", "Friday & Saturday", "Next Weekend", "Daily Drop"];

export function SmakrCardStudio() {
  const venues = useCityPulseStore((s) => s.venues);
  const foodPosts = useCityPulseStore((s) => s.foodPosts);
  const showToast = useCityPulseStore((s) => s.showToast);

  // Pipeline Selection: null = Format Picker, "permanent" = Restaurant, "popup" = Pop-up
  const [pipeline, setPipeline] = useState<"permanent" | "popup" | null>(null);

  // Pop-up Wizard Step (1: Location, 2: Brand/Story, 3: Dates/Hours, 4: Specials & Preview)
  const [popupStep, setPopupStep] = useState<1 | 2 | 3 | 4>(1);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  // =========================================================================
  // PERMANENT SPOT STATE
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [externalPlaces, setExternalPlaces] = useState<Venue[]>([]);

  // Spot Details (Editable by Owner)
  const [spotName, setSpotName] = useState("");
  const [spotAddress, setSpotAddress] = useState("");
  const [spotCoverImage, setSpotCoverImage] = useState("");
  const [spotHours, setSpotHours] = useState("11:00 – 22:00");
  const [spotDescription, setSpotDescription] = useState("");
  const [spotCategory, setSpotCategory] = useState<FoodCategory>("street_food");

  // Multi-dish Menu
  const [menuDishes, setMenuDishes] = useState<PartnerDishItem[]>([]);

  // =========================================================================
  // POP-UP RESIDENCY STATE
  // =========================================================================
  const [popupLocationType, setPopupLocationType] = useState<"host_venue" | "outdoor">("host_venue");
  const [popupHostSearch, setPopupHostSearch] = useState("");
  const [popupHostVenue, setPopupHostVenue] = useState<Venue | null>(null);
  const [popupAddress, setPopupAddress] = useState("");
  const [popupBrandName, setPopupBrandName] = useState("");
  const [popupDescription, setPopupDescription] = useState("");
  const [popupDateWindow, setPopupDateWindow] = useState("This Weekend");
  const [popupHours, setPopupHours] = useState("17:00 – Sold Out");
  const [popupPortionCap, setPopupPortionCap] = useState("Until sold out");
  const [popupCoverImage, setPopupCoverImage] = useState("");
  const [popupDishes, setPopupDishes] = useState<PartnerDishItem[]>([]);

  // =========================================================================
  // MODALS & DRAWERS
  // =========================================================================
  const [dishModal, setDishModal] = useState<{
    isOpen: boolean;
    dish: PartnerDishItem | null;
    index: number | null;
  }>({ isOpen: false, dish: null, index: null });

  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [tempHours, setTempHours] = useState("");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Lightweight Claim Fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantInstagram, setApplicantInstagram] = useState("");

  // Autocomplete search across local store venues
  const localMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return venues
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.address || "").toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, venues]);

  // Host venue matches for popup
  const hostMatches = useMemo(() => {
    if (!popupHostSearch.trim()) return [];
    const q = popupHostSearch.toLowerCase().trim();
    return venues
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.address || "").toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [popupHostSearch, venues]);

  // Google Places search fallback for unlisted venues
  const handlePlacesSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(searchQuery + " Oslo")}`
      );
      const data = await res.json();
      const rawList =
        data.results && Array.isArray(data.results)
          ? data.results
          : data.place
          ? [data.place]
          : [];
      if (rawList.length > 0) {
        const mapped: Venue[] = rawList.slice(0, 4).map((r: any) => ({
          id: r.id || r.place_id || `place_${Date.now()}`,
          google_place_id: r.place_id || null,
          name: r.name,
          address:
            r.formatted_address || r.address || r.vicinity || "Oslo, Norway",
          city: "Oslo",
          neighborhood: r.neighborhood || "sentrum",
          latitude: r.location?.lat || r.geometry?.location?.lat || 59.9139,
          longitude: r.location?.lng || r.geometry?.location?.lng || 10.7522,
          place_type: "cafe",
          spot_type: "restaurant",
          cover_image_url: r.photos?.[0] ? toPhotoUrl(r.photos[0]) : null,
          google_rating: r.google_rating || r.rating || 4.5,
          google_reviews_count:
            r.google_reviews_count || r.user_ratings_total || 10,
          has_wifi: true,
          has_outlets: false,
          silent_zone: false,
          outdoor_seating: false,
          dog_friendly: false,
          open_late: false,
          baseline_seats: 20,
          baseline_noise: 50,
          baseline_outlets: false,
          vibe: {} as any,
          description: r.description || null,
        }));
        setExternalPlaces(mapped);
      } else {
        showToast("No matches found on Google Maps. Try another name.");
      }
    } catch {
      showToast("Could not reach Google Places. Try another spot name.");
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Select Venue for Permanent Spot
  const handleSelectVenue = async (v: Venue) => {
    setSelectedVenue(v);
    setSpotName(v.name);
    setSpotAddress(v.address || "Oslo, Norway");
    setSpotCoverImage(v.cover_image_url || "");
    setSpotHours(v.current_opening_hours_text || "11:00 – 22:00");
    if (v.food_category) setSpotCategory(v.food_category);

    // Populate description
    if (v.description) {
      setSpotDescription(v.description);
    } else if (v.google_place_id) {
      try {
        const res = await fetch(
          `/api/places/details?place_id=${encodeURIComponent(v.google_place_id)}`
        );
        const data = await res.json();
        const desc = data.place?.description || data.description;
        if (desc) setSpotDescription(desc);
      } catch {
        setSpotDescription("Prepared in-house daily with fresh ingredients and seasonal Oslo produce.");
      }
    } else {
      setSpotDescription("Prepared in-house daily with fresh ingredients and seasonal Oslo produce.");
    }

    // Load existing dishes
    const matchingPosts = foodPosts.filter(
      (p) =>
        p.spot_id === v.id ||
        p.spot_name.toLowerCase().includes(v.name.toLowerCase()) ||
        v.name.toLowerCase().includes(p.spot_name.toLowerCase())
    );

    const initialDishes: PartnerDishItem[] =
      matchingPosts.length > 0
        ? matchingPosts.map((p) => ({
            id: p.id,
            dishName: p.dish_name,
            priceNok: p.price_nok,
            imageUrl: p.image_url,
            tasteNote: p.review_text || "",
            category: p.category,
            dietaryTags: p.dietary_tags || [],
          }))
        : [
            {
              id: `dish_init_${Date.now()}`,
              dishName: v.signature_dishes?.[0] || `${v.name} Signature Meal`,
              priceNok: 185,
              imageUrl: v.cover_image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
              tasteNote: "Prepared in-house daily with fresh ingredients.",
              category: v.food_category || "street_food",
              dietaryTags: [],
            },
          ];

    setMenuDishes(initialDishes);
    setExternalPlaces([]);
    setSearchQuery("");
  };

  // Add Unlisted Custom Venue
  const handleCreateCustomVenue = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const customVenue: Venue = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      address: "Oslo, Norway",
      city: "Oslo",
      neighborhood: "sentrum",
      latitude: 59.9139,
      longitude: 10.7522,
      place_type: "cafe",
      spot_type: "restaurant",
      cover_image_url: null,
      google_rating: null,
      google_reviews_count: 0,
      has_wifi: true,
      has_outlets: false,
      silent_zone: false,
      outdoor_seating: false,
      dog_friendly: false,
      open_late: false,
      baseline_seats: 25,
      baseline_noise: 50,
      baseline_outlets: false,
      vibe: {} as any,
    };
    handleSelectVenue(customVenue);
    showToast(`Added "${trimmed}". Now customize your restaurant card.`);
  };

  // Save Dish to Menu (Permanent or Pop-up)
  const handleSaveDish = (dish: PartnerDishItem) => {
    if (pipeline === "permanent") {
      setMenuDishes((prev) => {
        const idx = prev.findIndex((d) => d.id === dish.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = dish;
          return updated;
        }
        return [...prev, dish];
      });
    } else {
      setPopupDishes((prev) => {
        const idx = prev.findIndex((d) => d.id === dish.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = dish;
          return updated;
        }
        return [...prev, dish];
      });
      if (!popupCoverImage) {
        setPopupCoverImage(dish.imageUrl);
      }
    }
  };

  // Delete Dish from Menu
  const handleDeleteDish = (dishId: string) => {
    if (pipeline === "permanent") {
      setMenuDishes((prev) => prev.filter((d) => d.id !== dishId));
    } else {
      setPopupDishes((prev) => prev.filter((d) => d.id !== dishId));
    }
    showToast("Dish removed from card");
  };

  // Submit Claim (Lightweight: Name + Email + optional Instagram)
  const handleSubmitClaim = async () => {
    if (!applicantName.trim()) {
      showToast("Please enter your name", "error");
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes("@")) {
      showToast("Please enter a valid business email", "error");
      return;
    }

    const isPermanent = pipeline === "permanent";
    const targetVenueId = isPermanent
      ? selectedVenue?.id || `custom_${Date.now()}`
      : `popup_${Date.now()}`;

    const effectiveDishes = isPermanent ? menuDishes : popupDishes;
    const primaryDish = effectiveDishes[0];

    if (!primaryDish || !primaryDish.dishName.trim()) {
      showToast("Please add at least one dish to your menu card", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        venueId: targetVenueId,
        venueName: isPermanent
          ? spotName || selectedVenue?.name || "Oslo Restaurant"
          : popupBrandName || "Pop-up Residency",
        venueAddress: isPermanent
          ? spotAddress
          : popupLocationType === "host_venue"
          ? popupHostVenue?.address || popupHostVenue?.name || "Oslo, Norway"
          : popupAddress || "Oslo, Norway",
        neighborhood: isPermanent
          ? selectedVenue?.neighborhood || "sentrum"
          : "sentrum",
        googlePlaceId: isPermanent ? selectedVenue?.google_place_id ?? undefined : undefined,
        latitude: isPermanent ? selectedVenue?.latitude : undefined,
        longitude: isPermanent ? selectedVenue?.longitude : undefined,
        googleRating: isPermanent ? selectedVenue?.google_rating : undefined,
        googleReviewsCount: isPermanent ? selectedVenue?.google_reviews_count : undefined,
        description: isPermanent ? spotDescription : popupDescription,
        coverImageUrl: isPermanent
          ? spotCoverImage || primaryDish.imageUrl
          : popupCoverImage || primaryDish.imageUrl,
        dishes: effectiveDishes,
        applicant: {
          name: applicantName.trim(),
          role: "owner",
          email: applicantEmail.trim().toLowerCase(),
          instagram: applicantInstagram.trim() || undefined,
        },
        proposedCard: {
          dishName: primaryDish.dishName,
          imageUrl: primaryDish.imageUrl,
          tasteNote: primaryDish.tasteNote,
          priceNok: primaryDish.priceNok,
          openingHours: isPermanent ? spotHours : popupHours,
          locationSchedule: isPermanent
            ? undefined
            : `${popupDateWindow} · ${popupHours}`,
          spotType: isPermanent
            ? selectedVenue?.spot_type || "restaurant"
            : "pop_up",
          category: isPermanent ? spotCategory : "street_food",
          dietaryTags: primaryDish.dietaryTags || [],
        },
        proposedChanges: {
          partnerType: isPermanent ? "restaurant" : "popup",
          coverImageUrl: isPermanent
            ? spotCoverImage || primaryDish.imageUrl
            : popupCoverImage || primaryDish.imageUrl,
          description: isPermanent ? spotDescription : popupDescription,
          menuDishes: effectiveDishes,
          popupMeta: !isPermanent
            ? {
                brand_id: `brand_${Date.now()}`,
                residency_status: "active",
                host_venue_name:
                  popupLocationType === "host_venue"
                    ? popupHostVenue?.name || "Oslo Host Bar"
                    : popupAddress || "Outdoor Pitch",
                dates_label: popupDateWindow,
                daily_hours: popupHours,
                portion_cap: popupPortionCap,
                entry_type: "walk_in",
              }
            : undefined,
        },
      };

      const res = await fetch("/api/partner/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit claim");

      setSubmittedClaimId(data.referenceCode || data.claimId || `claim_${Date.now()}`);
      setSubmittedEmail(applicantEmail.trim());
      setIsClaimModalOpen(false);
      showToast("Card updates submitted for editorial verification", "success");
    } catch (err: any) {
      showToast(err.message || "Could not submit claim.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAll = () => {
    setPipeline(null);
    setPopupStep(1);
    setSelectedVenue(null);
    setSearchQuery("");
    setSubmittedClaimId(null);
    setSubmittedEmail("");
    setMenuDishes([]);
    setPopupDishes([]);
    setPopupHostVenue(null);
  };

  // =========================================================================
  // VIEW: SUBMISSION CONFIRMATION
  // =========================================================================
  if (submittedClaimId) {
    return (
      <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-7 sm:p-10 text-center space-y-5 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-comico text-2xl sm:text-3xl font-bold text-[#181615] dark:text-white">
            Radar Card Submitted
          </h2>
          <p className="text-xs sm:text-sm text-[#6E655F] dark:text-[#A89E96] max-w-md mx-auto leading-relaxed">
            Your card updates for{" "}
            <span className="font-bold text-[#181615] dark:text-white">
              {pipeline === "permanent" ? spotName : popupBrandName}
            </span>{" "}
            have been queued for review.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-left text-xs space-y-2 max-w-sm mx-auto shadow-2xs">
          <div className="flex justify-between items-center text-[#6E655F]">
            <span>Reference ID:</span>
            <span className="font-bold text-[#181615] dark:text-white">
              {submittedClaimId.slice(0, 14)}
            </span>
          </div>
          {submittedEmail && (
            <div className="flex justify-between items-center text-[#6E655F]">
              <span>Notification Email:</span>
              <span className="font-bold text-[#181615] dark:text-white truncate max-w-[180px]">
                {submittedEmail}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-[#6E655F]">
            <span>Review Window:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Within 2 working days
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#6E655F] dark:text-[#A89E96] max-w-md mx-auto">
          Once approved, your card deploys directly to the Oslo map radar and your
          private Kitchen Remote link will arrive at {submittedEmail}.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-6 py-3 rounded-full bg-[#181615] hover:bg-[#2A2624] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Create or Edit Another Spot
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: FORMAT PICKER (Permanent vs Pop-up) - Visual Warm Nordic Cards
  // =========================================================================
  if (!pipeline) {
    return (
      <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
            Step 1 · Format Selection
          </div>
          <h2 className="font-comico text-2xl sm:text-3xl font-bold text-[#181615] dark:text-white">
            What kitchen are you managing?
          </h2>
          <p className="text-xs sm:text-sm text-[#6E655F] dark:text-[#A89E96] max-w-xl leading-relaxed">
            Manage your spot, control your photos, update your live batch and menu in real time directly on Oslo&apos;s food radar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card A: Permanent Spot */}
          <button
            type="button"
            onClick={() => setPipeline("permanent")}
            className="group rounded-3xl bg-white dark:bg-[#181615] border-2 border-[#181615]/10 hover:border-[#e84a27] text-left transition-all duration-300 cursor-pointer shadow-xs active:scale-[0.99] overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Photo Hero */}
              <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-zinc-900">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                  alt="Permanent restaurant dining"
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#181615]/85 text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                  <StorefrontIcon className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Permanent Spot</span>
                </div>
              </div>

              {/* Text Body */}
              <div className="p-5 sm:p-6 space-y-2">
                <h3 className="font-comico text-xl font-bold text-[#181615] dark:text-white group-hover:text-[#e84a27] transition-colors">
                  Restaurant, Cafe or Bakery
                </h3>
                <p className="text-xs text-[#6E655F] dark:text-[#A89E96] leading-relaxed">
                  Claim your physical Oslo spot. Put your high-res signature dishes, exact NOK prices, opening hours, and description directly on the map.
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5 pt-1">
              <div className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-zinc-800 text-[#e84a27] group-hover:bg-[#e84a27] group-hover:text-white text-xs font-bold transition-all flex items-center justify-between">
                <span>Start Restaurant Flow</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card B: Pop-up Residency */}
          <button
            type="button"
            onClick={() => {
              setPipeline("popup");
              setPopupStep(1);
            }}
            className="group rounded-3xl bg-white dark:bg-[#181615] border-2 border-[#181615]/10 hover:border-[#e84a27] text-left transition-all duration-300 cursor-pointer shadow-xs active:scale-[0.99] overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Photo Hero */}
              <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-zinc-900">
                <Image
                  src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
                  alt="Pop-up residency food drop"
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#181615]/85 text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                  <TicketStubIcon className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Pop-up Residency</span>
                </div>
              </div>

              {/* Text Body */}
              <div className="p-5 sm:p-6 space-y-2">
                <h3 className="font-comico text-xl font-bold text-[#181615] dark:text-white group-hover:text-[#e84a27] transition-colors">
                  Guest Takeover or Street Drop
                </h3>
                <p className="text-xs text-[#6E655F] dark:text-[#A89E96] leading-relaxed">
                  Taking over an Oslo bar for the weekend or popping up outdoors? Announce dates, set portion limits, and publish your limited batch ticket card.
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5 pt-1">
              <div className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-zinc-800 text-[#e84a27] group-hover:bg-[#e84a27] group-hover:text-white text-xs font-bold transition-all flex items-center justify-between">
                <span>Start Pop-up Ticket Flow</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: PERMANENT SPOT PIPELINE (with smooth sliding transitions)
  // =========================================================================
  if (pipeline === "permanent") {
    // Stage 1: Spot Resolver (Search DB or Google Maps)
    if (!selectedVenue) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="permanent_search"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-5 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPipeline(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#181615] dark:text-white hover:border-[#e84a27] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27]" />
                <span>Back</span>
              </button>
              <span className="text-xs font-bold text-[#e84a27]">
                Step 1 · Spot Resolver
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-comico text-xl sm:text-2xl font-bold text-[#181615] dark:text-white">
                Find your spot in Oslo
              </h2>
              <p className="text-xs text-[#6E655F] dark:text-[#A89E96]">
                Search your restaurant name to load your Google Maps listing, photos, and current menu dishes.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#6E655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePlacesSearch();
                }}
                placeholder="e.g. Koie Ramen, Lille Tøyen Kolonial, Farine..."
                className="w-full h-12 pl-10 pr-24 rounded-2xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white placeholder:text-[#6E655F]/60 focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handlePlacesSearch}
                  disabled={isSearchingPlaces}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#e84a27] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingPlaces ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              )}
            </div>

            {/* Local Matches from Smakr Database */}
            {localMatches.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E655F]">
                  Matching Oslo Spots on Smakr
                </span>
                <div className="space-y-2">
                  {localMatches.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVenue(v)}
                      className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#e84a27] text-left transition-all flex items-center gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-black/5">
                        {v.cover_image_url ? (
                          <Image
                            src={v.cover_image_url}
                            alt={v.name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <StorefrontIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-[#181615] dark:text-white group-hover:text-[#e84a27] truncate">
                          {v.name}
                        </div>
                        <div className="text-[11px] text-[#6E655F] truncate">
                          {v.address || "Oslo, Norway"}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-zinc-800 text-[11px] font-bold text-[#e84a27] border border-[#181615]/10 shrink-0">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Google Places Results */}
            {externalPlaces.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E655F]">
                  From Google Maps
                </span>
                <div className="space-y-2">
                  {externalPlaces.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVenue(v)}
                      className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#e84a27] text-left transition-all flex items-center gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-black/5">
                        {v.cover_image_url ? (
                          <Image
                            src={v.cover_image_url}
                            alt={v.name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <StorefrontIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-[#181615] dark:text-white group-hover:text-[#e84a27] truncate">
                          {v.name}
                        </div>
                        <div className="text-[11px] text-[#6E655F] truncate">
                          {v.address || "Oslo, Norway"}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-zinc-800 text-[11px] font-bold text-[#e84a27] border border-[#181615]/10 shrink-0">
                        Add from Maps
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unlisted Spot Trigger */}
            {searchQuery.trim().length > 2 && (
              <div className="pt-2 border-t border-[#181615]/10">
                <button
                  type="button"
                  onClick={() => handleCreateCustomVenue(searchQuery)}
                  className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#e84a27]/40 bg-[#e84a27]/5 hover:bg-[#e84a27]/10 text-xs font-bold text-[#e84a27] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add &ldquo;{searchQuery.trim()}&rdquo; as a new Oslo spot</span>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      );
    }

    // Stage 2: Interactive Restaurant Sheet Workspace
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="permanent_workspace"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Workspace Top Bar */}
          <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#181615] dark:text-white hover:border-[#e84a27] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27]" />
                <span>Change Spot</span>
              </button>
              <div>
                <div className="font-comico text-base sm:text-lg font-bold text-[#181615] dark:text-white leading-tight">
                  {spotName || selectedVenue.name}
                </div>
                <div className="text-[11px] text-[#6E655F]">
                  Interactive Card Workspace · Click highlighted sections to edit
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit Card &amp; Claim Remote</span>
            </button>
          </div>

          {/* The Live Interactive Restaurant Card Preview */}
          <div className="relative">
            <PartnerRestaurantCardPreview
              venue={selectedVenue}
              coverImageUrl={spotCoverImage}
              openingHours={spotHours}
              description={spotDescription}
              dishes={menuDishes}
              onEditCoverPhoto={() => setIsCoverPickerOpen(true)}
              onEditHours={() => {
                setTempHours(spotHours);
                setIsHoursModalOpen(true);
              }}
              onEditDescription={() => {
                setTempDescription(spotDescription);
                setIsDescriptionModalOpen(true);
              }}
              onAddDish={() => {
                setDishModal({ isOpen: true, dish: null, index: null });
              }}
              onEditDish={(idx) => {
                setDishModal({ isOpen: true, dish: menuDishes[idx], index: idx });
              }}
              isVerified={false}
              isProposed={true}
            />
          </div>

          {/* Bottom Submission Callout Bar */}
          <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
            <div>
              <h4 className="font-comico text-base font-bold text-[#181615] dark:text-white">
                Ready to publish your Oslo card?
              </h4>
              <p className="text-xs text-[#6E655F] dark:text-[#A89E96]">
                {menuDishes.length} signature dish{menuDishes.length === 1 ? "" : "es"} ready. No password required—we verify via your business email.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Updates &amp; Claim Remote</span>
            </button>
          </div>

          {/* Modals */}
          {/* 1. Dish Card Modal */}
          <PartnerDishCardModal
            isOpen={dishModal.isOpen}
            onClose={() => setDishModal({ isOpen: false, dish: null, index: null })}
            dish={dishModal.dish}
            venuePlaceId={selectedVenue.google_place_id}
            venueName={spotName || selectedVenue.name}
            category={spotCategory}
            extraPhotos={selectedVenue.cover_image_url ? [selectedVenue.cover_image_url] : []}
            onSaveDish={handleSaveDish}
            onDeleteDish={handleDeleteDish}
            showToast={showToast}
          />

          {/* 2. Cover Photo Picker Modal */}
          {isCoverPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                    Change Cover Photo
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCoverPickerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#6E655F]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <VisualPhotoSwitcher
                  venuePlaceId={selectedVenue.google_place_id}
                  venueName={spotName || selectedVenue.name}
                  category={spotCategory}
                  currentImageUrl={spotCoverImage}
                  onSelectPhoto={(url: string) => {
                    setSpotCoverImage(url);
                    setIsCoverPickerOpen(false);
                    showToast("Cover photo updated");
                  }}
                />
              </div>
            </div>
          )}

          {/* 3. Description Editor Modal */}
          {isDescriptionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                    Edit Oslo Editorial Story
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#6E655F]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#6E655F]">
                  1–2 sentences summarizing your culinary concept, specialties, and Oslo setting.
                </p>

                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Crisp sourdough pizzas with seasonal Nordic toppings and natural wines in a relaxed Grünerløkka setting..."
                  className="w-full p-3.5 rounded-2xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-normal text-[#181615] dark:text-white placeholder:text-[#6E655F]/50 focus:border-[#e84a27] outline-hidden resize-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpotDescription(tempDescription.trim());
                      setIsDescriptionModalOpen(false);
                      showToast("Editorial story updated");
                    }}
                    className="px-5 py-2 rounded-full bg-[#e84a27] text-white text-xs font-bold cursor-pointer"
                  >
                    Save Story
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Hours Editor Modal */}
          {isHoursModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                    Opening Hours
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsHoursModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#6E655F]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={tempHours}
                  onChange={(e) => setTempHours(e.target.value)}
                  placeholder="e.g. 11:00 – 22:00 (Tue–Sun)"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-bold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHoursModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpotHours(tempHours.trim());
                      setIsHoursModalOpen(false);
                      showToast("Opening hours updated");
                    }}
                    className="px-5 py-2 rounded-full bg-[#e84a27] text-white text-xs font-bold cursor-pointer"
                  >
                    Save Hours
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Lightweight Claim Modal */}
          {isClaimModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                      ✦ Partner Verification
                    </span>
                    <h3 className="font-comico text-xl font-bold text-[#181615] dark:text-white">
                      Submit &amp; Claim Remote
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#6E655F]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#6E655F] dark:text-[#A89E96] leading-relaxed">
                  Submit updates for{" "}
                  <span className="font-bold text-[#181615] dark:text-white">
                    {spotName || selectedVenue.name}
                  </span>
                  . Approved partners receive a private, zero-password Kitchen Remote link.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Your Full Name *</span>
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Henrik Thomsen"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Business Email *</span>
                    </label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="e.g. post@restaurant.no"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>Instagram Handle (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={applicantInstagram}
                      onChange={(e) => setApplicantInstagram(e.target.value)}
                      placeholder="@restaurantoslo"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2.5 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitClaim}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Submit for Review</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // =========================================================================
  // VIEW: POP-UP RESIDENCY PIPELINE (Guided 4-Step Sliding Wizard)
  // =========================================================================
  const primaryPopupDish = popupDishes[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Wizard Navigation Header */}
      <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-4 sm:p-5 flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (popupStep === 1) {
              setPipeline(null);
            } else {
              setPopupStep((s) => ((s - 1) as 1 | 2 | 3 | 4));
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#181615] dark:text-white hover:border-[#e84a27] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27]" />
          <span>{popupStep === 1 ? "Change Format" : "Back"}</span>
        </button>

        {/* Stepper Progress Pill */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e84a27]" />
          <span className="text-xs font-bold text-[#181615] dark:text-white">
            Step {popupStep} of 4 ·{" "}
            {popupStep === 1
              ? "Location & Pitch"
              : popupStep === 2
              ? "Brand & Concept"
              : popupStep === 3
              ? "Dates & Schedule"
              : "Specials & Live Card"}
          </span>
        </div>
      </div>

      {/* Guided 4-Step Slide Container */}
      <AnimatePresence mode="wait">
        {/* STEP 1: Location & Pitch */}
        {popupStep === 1 && (
          <motion.div
            key="popup_step_1"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
                Step 1 of 4 · Host Venue or Street Pitch
              </span>
              <h2 className="font-comico text-2xl font-bold text-[#181615] dark:text-white">
                Where is your pop-up happening?
              </h2>
              <p className="text-xs text-[#6E655F]">
                Are you taking over an existing Oslo bar, or serving from an outdoor street pitch or market?
              </p>
            </div>

            {/* Segmented Location Type */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10">
              <button
                type="button"
                onClick={() => setPopupLocationType("host_venue")}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  popupLocationType === "host_venue"
                    ? "bg-[#e84a27] text-white shadow-xs"
                    : "text-[#6E655F] hover:text-[#181615]"
                }`}
              >
                <StorefrontIcon className="w-4 h-4" />
                <span>Host Bar / Venue</span>
              </button>
              <button
                type="button"
                onClick={() => setPopupLocationType("outdoor")}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  popupLocationType === "outdoor"
                    ? "bg-[#e84a27] text-white shadow-xs"
                    : "text-[#6E655F] hover:text-[#181615]"
                }`}
              >
                <OutdoorParkIcon className="w-4 h-4" />
                <span>Outdoor / Street</span>
              </button>
            </div>

            {popupLocationType === "host_venue" ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Search Host Restaurant or Bar in Oslo
                </label>
                <input
                  type="text"
                  value={popupHostSearch}
                  onChange={(e) => setPopupHostSearch(e.target.value)}
                  placeholder="e.g. Becco, Trekanten, Postkontoret, Kafé Hærverk..."
                  className="w-full h-12 px-4 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
                {hostMatches.length > 0 && !popupHostVenue && (
                  <div className="space-y-1.5 pt-1">
                    {hostMatches.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setPopupHostVenue(h);
                          setPopupHostSearch(h.name);
                        }}
                        className="w-full p-3 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#e84a27] text-left text-xs font-bold text-[#181615] dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span>{h.name}</span>
                        <span className="text-[10px] text-[#6E655F] font-normal">
                          {h.neighborhood || "Oslo"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {popupHostVenue && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                    <span>Host: {popupHostVenue.name}</span>
                    <button
                      type="button"
                      onClick={() => setPopupHostVenue(null)}
                      className="text-xs underline text-emerald-700"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Outdoor Address or Location Name
                </label>
                <input
                  type="text"
                  value={popupAddress}
                  onChange={(e) => setPopupAddress(e.target.value)}
                  placeholder="e.g. Youngstorget, Kuben Park, Torggata 16..."
                  className="w-full h-12 px-4 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (popupLocationType === "host_venue" && !popupHostSearch.trim() && !popupHostVenue) {
                    showToast("Please enter or select a host venue", "error");
                    return;
                  }
                  if (popupLocationType === "outdoor" && !popupAddress.trim()) {
                    showToast("Please enter the outdoor pitch address", "error");
                    return;
                  }
                  setPopupStep(2);
                }}
                className="px-6 py-3 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Continue to Brand &amp; Story</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Brand & Concept Story */}
        {popupStep === 2 && (
          <motion.div
            key="popup_step_2"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
                Step 2 of 4 · Pop-up Brand &amp; Story
              </span>
              <h2 className="font-comico text-2xl font-bold text-[#181615] dark:text-white">
                Tell Oslo about your residency
              </h2>
              <p className="text-xs text-[#6E655F]">
                Your pop-up name and the short story behind your culinary drop.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Pop-up Brand Name *
                </label>
                <input
                  type="text"
                  value={popupBrandName}
                  onChange={(e) => setPopupBrandName(e.target.value)}
                  placeholder="e.g. Hot Temper Ramen, Nolo Smash Burger"
                  className="w-full h-12 px-4 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Concept Story / Taste Description
                </label>
                <textarea
                  value={popupDescription}
                  onChange={(e) => setPopupDescription(e.target.value)}
                  rows={3}
                  placeholder="Handmade spicy noodles, slow-simmered rich broth, and crunchy chili oil. Limited guest drop in Oslo."
                  className="w-full p-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPopupStep(1)}
                className="px-4 py-2.5 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!popupBrandName.trim()) {
                    showToast("Please enter your pop-up brand name", "error");
                    return;
                  }
                  setPopupStep(3);
                }}
                className="px-6 py-3 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Continue to Dates &amp; Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Dates & Schedule */}
        {popupStep === 3 && (
          <motion.div
            key="popup_step_3"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 sm:p-8 space-y-6 shadow-sm max-w-2xl mx-auto"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
                Step 3 of 4 · Schedule &amp; Daily Batch Cap
              </span>
              <h2 className="font-comico text-2xl font-bold text-[#181615] dark:text-white">
                When are you serving?
              </h2>
              <p className="text-xs text-[#6E655F]">
                Set your drop window, daily serving hours, and batch portion limits.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Dates Window
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DATE_PRESETS.map((dp) => (
                    <button
                      key={dp}
                      type="button"
                      onClick={() => setPopupDateWindow(dp)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        popupDateWindow === dp
                          ? "bg-[#e84a27] text-white border-[#e84a27]"
                          : "bg-white dark:bg-[#181615] text-[#6E655F] border-[#181615]/10"
                      }`}
                    >
                      {dp}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={popupDateWindow}
                  onChange={(e) => setPopupDateWindow(e.target.value)}
                  placeholder="e.g. Oct 25 – 27, This Weekend"
                  className="w-full h-11 px-4 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Service Hours
                </label>
                <input
                  type="text"
                  value={popupHours}
                  onChange={(e) => setPopupHours(e.target.value)}
                  placeholder="e.g. 17:00 – Sold Out"
                  className="w-full h-11 px-4 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#181615] dark:text-white">
                  Daily Batch Limit
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PORTION_CAP_OPTIONS.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setPopupPortionCap(cap)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        popupPortionCap === cap
                          ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                          : "bg-white dark:bg-[#181615] text-[#6E655F] border-[#181615]/10 hover:border-[#181615]/20"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPopupStep(2)}
                className="px-4 py-2.5 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setPopupStep(4)}
                className="px-6 py-3 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Continue to Specials &amp; Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Pop-up Specials Menu & Live Ticket Preview */}
        {popupStep === 4 && (
          <motion.div
            key="popup_step_4"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Manage Pop-up Specials */}
              <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                      Step 4 of 4 · Specials Menu
                    </span>
                    <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                      Your Pop-up Specials ({popupDishes.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDishModal({ isOpen: true, dish: null, index: null })}
                    className="px-3.5 py-1.5 rounded-full bg-[#e84a27] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Special</span>
                  </button>
                </div>

                <p className="text-xs text-[#6E655F]">
                  Upload an authentic 4:3 photo of your dish and set your in-house NOK price.
                </p>

                {popupDishes.length === 0 ? (
                  <div
                    onClick={() => setDishModal({ isOpen: true, dish: null, index: null })}
                    className="p-8 rounded-2xl bg-white dark:bg-[#181615] border-2 border-dashed border-[#e84a27]/40 text-center cursor-pointer space-y-2 hover:border-[#e84a27] transition-all"
                  >
                    <Flame className="w-8 h-8 text-[#e84a27] mx-auto" />
                    <p className="text-xs font-bold text-[#181615] dark:text-white">
                      + Add Your Signature Pop-up Meal
                    </p>
                    <p className="text-[11px] text-[#6E655F]">
                      Upload photo, dish title, and NOK price.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {popupDishes.map((d, idx) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 flex items-center gap-3.5 shadow-2xs"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-black/5">
                          {d.imageUrl && (
                            <Image
                              src={d.imageUrl}
                              alt={d.dishName}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-[#181615] dark:text-white truncate">
                            {d.dishName}
                          </div>
                          <div className="text-xs text-[#e84a27] font-bold">
                            {d.priceNok ? `${d.priceNok} kr` : "Seasonal price"}
                          </div>
                          {d.tasteNote && (
                            <div className="text-[10px] text-[#6E655F] truncate">
                              &ldquo;{d.tasteNote}&rdquo;
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDishModal({ isOpen: true, dish: d, index: idx })}
                          className="px-3 py-1 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white hover:border-[#e84a27] cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Live Warm Nordic Ticket Card Preview */}
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                    Live Radar Card Preview
                  </span>
                  <p className="text-xs text-[#6E655F]">
                    How Oslo foodies will view your pop-up residency ticket.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#181615] border border-[#181615]/10 shadow-lg">
                  <PopupEventCard
                    venue={{
                      id: "preview_popup",
                      name: popupBrandName || "Your Pop-up Brand",
                      address:
                        popupLocationType === "host_venue"
                          ? popupHostVenue?.address || "Becco, Oslo"
                          : popupAddress || "Youngstorget, Oslo",
                      city: "Oslo",
                      neighborhood: "sentrum",
                      latitude: 59.9139,
                      longitude: 10.7522,
                      place_type: "cafe",
                      spot_type: "pop_up",
                      cover_image_url:
                        primaryPopupDish?.imageUrl ||
                        popupCoverImage ||
                        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
                      google_rating: 4.9,
                      google_reviews_count: 32,
                      has_wifi: true,
                      has_outlets: false,
                      silent_zone: false,
                      outdoor_seating: true,
                      dog_friendly: true,
                      open_late: true,
                      baseline_seats: 30,
                      baseline_noise: 65,
                      baseline_outlets: false,
                      vibe: {} as any,
                      popup_meta: {
                        brand_id: "popup_preview",
                        residency_status: "active",
                        host_venue_name:
                          popupLocationType === "host_venue"
                            ? popupHostVenue?.name || "Host Venue"
                            : popupAddress || "Outdoor Pitch",
                        dates_label: popupDateWindow,
                        daily_hours: popupHours,
                        portion_cap: popupPortionCap,
                        bring_back_count: 24,
                      },
                    }}
                    post={{
                      id: "preview_popup_post",
                      spot_id: "preview_popup",
                      spot_name: popupBrandName || "Your Pop-up Brand",
                      spot_address:
                        popupLocationType === "host_venue"
                          ? popupHostVenue?.address || "Becco, Oslo"
                          : popupAddress || "Youngstorget, Oslo",
                      spot_neighborhood: "sentrum",
                      spot_coords: [10.7522, 59.9139],
                      dish_name: primaryPopupDish?.dishName || "Signature Limited Batch",
                      price_nok: primaryPopupDish?.priceNok || 195,
                      rating: 9.8,
                      taste_tags: ["Pop-up Drop", "Limited Batch"],
                      image_url:
                        primaryPopupDish?.imageUrl ||
                        popupCoverImage ||
                        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
                      review_text: primaryPopupDish?.tasteNote || "Limited batch residency special in Oslo.",
                      category: "street_food",
                      dietary_tags: (primaryPopupDish?.dietaryTags as DietaryTag[]) || [],
                      created_at_relative: "Live now",
                      likes_count: 14,
                      saves_count: 8,
                      spot_type: "pop_up",
                      author: {
                        handle: applicantInstagram ? applicantInstagram.replace("@", "") : "verified_partner",
                        name: applicantName || popupBrandName || "Chef",
                        avatar_url: "/mascots/cheffy.png",
                      },
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPopupStep(3)}
                    className="px-4 py-2.5 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
                  >
                    Back to Schedule
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="px-6 py-3 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Pop-up &amp; Claim Kitchen Remote</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals for Pop-up */}
      <PartnerDishCardModal
        isOpen={dishModal.isOpen}
        onClose={() => setDishModal({ isOpen: false, dish: null, index: null })}
        dish={dishModal.dish}
        venueName={popupBrandName || "Pop-up Residency"}
        category="street_food"
        onSaveDish={handleSaveDish}
        onDeleteDish={handleDeleteDish}
        showToast={showToast}
      />

      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                  ✦ Pop-up Verification
                </span>
                <h3 className="font-comico text-xl font-bold text-[#181615] dark:text-white">
                  Publish Pop-up Listing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#6E655F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Organizer / Chef Name *</span>
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Alex Lind"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Business Email *</span>
                </label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="e.g. chef@popupbrand.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Instagram Handle (Optional)</span>
                </label>
                <input
                  type="text"
                  value={applicantInstagram}
                  onChange={(e) => setApplicantInstagram(e.target.value)}
                  placeholder="@popupbrand"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-semibold text-[#181615] dark:text-white focus:border-[#e84a27] outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="px-4 py-2.5 rounded-full border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitClaim}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Submit for Review</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
