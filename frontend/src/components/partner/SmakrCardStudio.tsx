"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  X,
  Loader2,
  Plus,
  Phone,
  Mail,
  User,
  Flame,
  Zap,
  AlertCircle,
  Instagram,
  Building2,
  Calendar,
} from "lucide-react";
import {
  StorefrontIcon,
  TicketStubIcon,
  OutdoorParkIcon,
  WineBarIcon,
  FoodTruckIcon,
} from "@/components/food/FoodIcons";
import { VisualPhotoSwitcher, toPhotoUrl } from "@/components/ui/VisualPhotoSwitcher";
import { TimeSlotPicker, DateWindowPicker } from "@/components/ui/TimeSlotPicker";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import type { Venue, DietaryTag, FoodCategory, SpotType, PopupResidencyMeta, FoodPost } from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import {
  PartnerRestaurantCardPreview,
  type PartnerDishItem,
} from "./PartnerRestaurantCardPreview";
import { PartnerCardPreview } from "./PartnerCardPreview";
import { PopupEventCard } from "@/components/food/PopupEventCard";
import { PartnerDishEditorSheet } from "./PartnerSheets";

const OSLO_CORRIDORS = [
  { label: "All Areas", filter: "" },
  { label: "Grünerløkka", filter: "grunerlokka" },
  { label: "Torggata", filter: "torggata" },
  { label: "Sentrum", filter: "sentrum" },
  { label: "Grønland", filter: "gronland" },
  { label: "Majorstuen", filter: "majorstuen" },
];

const DIETARY_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: "halal", label: "Halal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" },
];

const PORTION_CAP_OPTIONS = [
  "50 / day",
  "80 / day",
  "120 / day",
  "Unlimited",
];

export function SmakrCardStudio() {
  const venues = useCityPulseStore((s) => s.venues);
  const foodPosts = useCityPulseStore((s) => s.foodPosts);
  const showToast = useCityPulseStore((s) => s.showToast);

  // Pipeline Selection: null = Slide 0, "permanent" = Pipeline A, "popup" = Pipeline B
  const [pipeline, setPipeline] = useState<"permanent" | "popup" | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  // Live Preview Drawer State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [permanentPreviewFormat, setPermanentPreviewFormat] = useState<"restaurant" | "feed">("restaurant");

  // =========================================================================
  // PIPELINE A: PERMANENT SPOT STATE
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCorridor, setSelectedCorridor] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [externalPlaces, setExternalPlaces] = useState<Venue[]>([]);

  // Spot Details
  const [spotName, setSpotName] = useState("");
  const [spotAddress, setSpotAddress] = useState("");
  const [spotCoverImage, setSpotCoverImage] = useState("");
  const [spotHours, setSpotHours] = useState("11:00 – 22:00");
  const [spotCategory, setSpotCategory] = useState<FoodCategory>("street_food");

  // Signature Dish Details
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState<number>(185);
  const [dishTasteNote, setDishTasteNote] = useState("");
  const [dishImage, setDishImage] = useState("");
  const [dishDietary, setDishDietary] = useState<DietaryTag[]>([]);

  // Multi-dish Menu Management
  const [menuDishes, setMenuDishes] = useState<PartnerDishItem[]>([]);
  const [editingDish, setEditingDish] = useState<PartnerDishItem | null>(null);
  const [isDishEditorOpen, setIsDishEditorOpen] = useState(false);

  const handleSaveMenuDish = (saved: PartnerDishItem) => {
    setMenuDishes((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    // Keep primary dish state in sync if primary dish was modified
    if (menuDishes.length === 0 || saved.id === menuDishes[0]?.id) {
      setDishName(saved.dishName);
      if (saved.priceNok != null) setDishPrice(saved.priceNok);
      if (saved.imageUrl) setDishImage(saved.imageUrl);
      if (saved.tasteNote) setDishTasteNote(saved.tasteNote);
      if (saved.dietaryTags) setDishDietary(saved.dietaryTags as DietaryTag[]);
    }
  };

  const handleDeleteMenuDish = (dishId: string) => {
    setMenuDishes((prev) => {
      const filtered = prev.filter((d) => d.id !== dishId);
      if (filtered.length > 0 && dishId === menuDishes[0]?.id) {
        const next = filtered[0];
        setDishName(next.dishName);
        if (next.priceNok != null) setDishPrice(next.priceNok);
        if (next.imageUrl) setDishImage(next.imageUrl);
        if (next.tasteNote) setDishTasteNote(next.tasteNote);
        if (next.dietaryTags) setDishDietary(next.dietaryTags as DietaryTag[]);
      }
      return filtered;
    });
    showToast("Dish removed from menu");
  };

  // =========================================================================
  // PIPELINE B: POP-UP RESIDENCY STATE
  // =========================================================================
  const [popupBrandName, setPopupBrandName] = useState("");
  const [popupLocationType, setPopupLocationType] = useState<"host_venue" | "outdoor">("host_venue");
  const [popupLocationName, setPopupLocationName] = useState("");
  const [popupDateWindow, setPopupDateWindow] = useState("This Weekend");
  const [popupHours, setPopupHours] = useState("17:00 – 22:00");
  const [popupPortionCap, setPopupPortionCap] = useState("80 / day");
  const [popupEntryType, setPopupEntryType] = useState<"walk_in" | "ticketed">("walk_in");

  // Pop-up Signature Dish
  const [popupDishName, setPopupDishName] = useState("");
  const [popupDishPrice, setPopupDishPrice] = useState<number>(195);
  const [popupDishNote, setPopupDishNote] = useState("");
  const [popupDishImage, setPopupDishImage] = useState("");
  const [popupDietary, setPopupDietary] = useState<DietaryTag[]>([]);

  // =========================================================================
  // COMMON APPLICANT / CLAIM STATE
  // =========================================================================
  const [applicantName, setApplicantName] = useState("");
  const [applicantRole, setApplicantRole] = useState<"owner" | "chef" | "manager" | "staff">("owner");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantOrgNumber, setApplicantOrgNumber] = useState("");
  const [applicantInstagram, setApplicantInstagram] = useState("");
  const [kitchenStatus, setKitchenStatus] = useState<"normal" | "fresh_batch" | "low_stock">("normal");

  // Autocomplete search across local store venues
  const localMatches = useMemo(() => {
    if (!searchQuery.trim() && !selectedCorridor) return [];
    const q = searchQuery.toLowerCase().trim();
    return venues
      .filter((v) => {
        const matchesQuery = !q || v.name.toLowerCase().includes(q) || (v.address || "").toLowerCase().includes(q);
        const matchesCorridor =
          !selectedCorridor ||
          (v.neighborhood || "").toLowerCase().includes(selectedCorridor) ||
          (v.city || "").toLowerCase().includes(selectedCorridor);
        return matchesQuery && matchesCorridor;
      })
      .slice(0, 5);
  }, [searchQuery, selectedCorridor, venues]);

  // Google Places search fallback
  const handlePlacesSearch = async () => {
    if (!searchQuery.trim() || localMatches.length > 0) return;
    setIsSearchingPlaces(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery + " Oslo")}`);
      const data = await res.json();
      const rawList = data.results && Array.isArray(data.results) ? data.results : data.place ? [data.place] : [];
      if (rawList.length > 0) {
        const mapped: Venue[] = rawList.slice(0, 4).map((r: any) => ({
          id: r.id || r.place_id || `place_${Date.now()}`,
          google_place_id: r.place_id || null,
          name: r.name,
          address: r.formatted_address || r.address || r.vicinity || "Oslo, Norway",
          city: "Oslo",
          neighborhood: r.neighborhood || "sentrum",
          latitude: r.location?.lat || r.geometry?.location?.lat || 59.9139,
          longitude: r.location?.lng || r.geometry?.location?.lng || 10.7522,
          place_type: "cafe",
          spot_type: "restaurant",
          cover_image_url: r.photos?.[0] ? toPhotoUrl(r.photos[0]) : null,
          google_rating: r.google_rating || r.rating || 4.5,
          google_reviews_count: r.google_reviews_count || r.user_ratings_total || 10,
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
        }));
        setExternalPlaces(mapped);
      }
    } catch {
      showToast("Could not reach Google Places. Try another spot name.");
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Select Venue for Permanent Spot
  const handleSelectVenue = (v: Venue) => {
    setSelectedVenue(v);
    setSpotName(v.name);
    setSpotAddress(v.address || "Oslo, Norway");
    setSpotCoverImage(v.cover_image_url || "");
    setSpotHours(v.current_opening_hours_text || "11:00 – 22:00");
    if (v.food_category) setSpotCategory(v.food_category);

    // Initial dish matching
    const matchingPosts = foodPosts.filter(
      (p) =>
        p.spot_id === v.id ||
        p.spot_name.toLowerCase().includes(v.name.toLowerCase()) ||
        v.name.toLowerCase().includes(p.spot_name.toLowerCase())
    );

    const initialDishes: PartnerDishItem[] = matchingPosts.length > 0
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
            imageUrl: v.cover_image_url || "",
            tasteNote: "Prepared in-house daily with fresh ingredients.",
            category: v.food_category || "street_food",
            dietaryTags: [],
          },
        ];

    setMenuDishes(initialDishes);

    if (initialDishes.length > 0) {
      const topPost = initialDishes[0];
      setDishName(topPost.dishName);
      setDishPrice(topPost.priceNok || 185);
      setDishTasteNote(topPost.tasteNote);
      setDishImage(topPost.imageUrl);
      setDishDietary((topPost.dietaryTags as DietaryTag[]) || []);
    } else {
      const defaultDish = v.signature_dishes?.[0] || `${v.name} Signature Meal`;
      setDishName(defaultDish);
      setDishPrice(185);
      setDishTasteNote("Prepared in-house daily with fresh ingredients.");
      setDishImage(v.cover_image_url || "");
    }

    setExternalPlaces([]);
    setStep(2);
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
      neighborhood: (selectedCorridor as any) || "sentrum",
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
    showToast(`Added "${trimmed}". Now customize your signature dish.`);
  };

  // Submit Claim (Permanent or Pop-up)
  const handleSubmitClaim = async () => {
    if (!applicantName.trim()) {
      showToast("Please enter your contact name.", "error");
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes("@")) {
      showToast("Please enter a valid business email.", "error");
      return;
    }

    const isPermanent = pipeline === "permanent";
    const targetVenueId = isPermanent
      ? (selectedVenue?.id || `custom_${Date.now()}`)
      : `popup_${Date.now()}`;

    const effectiveDishName = isPermanent ? dishName : popupDishName;
    const effectiveDishImage = isPermanent ? dishImage : popupDishImage;
    const effectiveDishPrice = isPermanent ? dishPrice : popupDishPrice;
    const effectiveTasteNote = isPermanent ? dishTasteNote : popupDishNote;
    const effectiveDietary = isPermanent ? dishDietary : popupDietary;

    if (!effectiveDishName.trim()) {
      showToast("Please provide a signature dish name.", "error");
      return;
    }
    if (!effectiveDishImage) {
      showToast("Please upload or select a photo for your dish.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        venueId: targetVenueId,
        venueName: isPermanent ? (spotName || selectedVenue?.name || "Oslo Restaurant") : popupBrandName,
        venueAddress: isPermanent ? spotAddress : (popupLocationName || "Oslo, Norway"),
        neighborhood: isPermanent ? (selectedVenue?.neighborhood || "Sentrum") : "Sentrum",
        applicant: {
          name: applicantName.trim(),
          role: applicantRole,
          email: applicantEmail.trim(),
          phone: applicantPhone.trim(),
          instagram: applicantInstagram.trim(),
          orgNumber: applicantOrgNumber.trim(),
        },
        proposedCard: {
          dishName: effectiveDishName.trim(),
          imageUrl: effectiveDishImage,
          tasteNote: effectiveTasteNote.trim(),
          priceNok: effectiveDishPrice,
          openingHours: isPermanent ? spotHours : popupHours,
          locationSchedule: isPermanent ? undefined : `${popupDateWindow} · ${popupHours}`,
          spotType: isPermanent ? (selectedVenue?.spot_type || "restaurant") : "pop_up",
          category: isPermanent ? spotCategory : "street_food",
          dietaryTags: effectiveDietary,
        },
        proposedChanges: {
          partnerType: isPermanent ? "restaurant" : "popup",
          kitchenStatus,
          coverImageUrl: isPermanent ? spotCoverImage : effectiveDishImage,
          menuDishes: isPermanent ? menuDishes : undefined,
          popupMeta: !isPermanent
            ? {
                brand_id: `brand_${Date.now()}`,
                residency_status: "active",
                host_venue_name: popupLocationName || "Oslo Location",
                dates_label: popupDateWindow,
                daily_hours: popupHours,
                portion_cap: popupPortionCap,
                entry_type: popupEntryType,
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

      setSubmittedClaimId(data.claimId || `claim_${Date.now()}`);
      setSubmittedEmail(applicantEmail.trim());
      showToast("Claim submitted for editorial review.", "success");
    } catch (err: any) {
      showToast(err.message || "Could not submit claim.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock venue object for live preview
  const livePreviewVenue: Venue = useMemo(() => {
    if (pipeline === "permanent") {
      return {
        id: selectedVenue?.id || "preview-permanent",
        name: spotName || selectedVenue?.name || "Your Restaurant Name",
        address: spotAddress || "Torggata 18, Oslo",
        city: "Oslo",
        neighborhood: selectedVenue?.neighborhood || "sentrum",
        latitude: selectedVenue?.latitude || 59.9139,
        longitude: selectedVenue?.longitude || 10.7522,
        place_type: "cafe",
        spot_type: "restaurant",
        food_category: spotCategory,
        cover_image_url: spotCoverImage || dishImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        google_rating: selectedVenue?.google_rating ?? 4.7,
        google_reviews_count: selectedVenue?.google_reviews_count ?? 142,
        current_opening_hours_text: spotHours,
        signature_dishes: [dishName || "Signature Dish"],
        has_wifi: true,
        has_outlets: false,
        silent_zone: false,
        outdoor_seating: true,
        dog_friendly: false,
        open_late: false,
        baseline_seats: 30,
        baseline_noise: 45,
        baseline_outlets: false,
        vibe: {} as any,
        vibe_signals: { partner_verified: true, kitchen_status: kitchenStatus },
      };
    } else {
      return {
        id: "preview-popup",
        name: popupBrandName || "Your Pop-up Brand",
        address: popupLocationName ? `Hosted at ${popupLocationName}` : "Oslo, Norway",
        city: "Oslo",
        neighborhood: "sentrum",
        latitude: 59.9139,
        longitude: 10.7522,
        place_type: "cafe",
        spot_type: "pop_up",
        food_category: "street_food",
        cover_image_url: popupDishImage || "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
        google_rating: null,
        google_reviews_count: 0,
        current_opening_hours_text: popupHours,
        signature_dishes: [popupDishName || "Residency Special"],
        has_wifi: false,
        has_outlets: false,
        silent_zone: false,
        outdoor_seating: true,
        dog_friendly: true,
        open_late: true,
        baseline_seats: 25,
        baseline_noise: 65,
        baseline_outlets: false,
        vibe: {} as any,
        popup_meta: {
          brand_id: "brand_preview",
          residency_status: "active",
          host_venue_name: popupLocationName || "Oslo Host Bar",
          dates_label: popupDateWindow,
          daily_hours: popupHours,
          bring_back_count: 12,
        },
        vibe_signals: { partner_verified: true, kitchen_status: kitchenStatus },
      };
    }
  }, [
    pipeline,
    selectedVenue,
    spotName,
    spotAddress,
    spotCategory,
    spotCoverImage,
    dishImage,
    spotHours,
    dishName,
    kitchenStatus,
    popupBrandName,
    popupLocationName,
    popupDishImage,
    popupHours,
    popupDishName,
    popupDateWindow,
  ]);

  // Mock post object for preview
  const livePreviewPost: FoodPost = useMemo(() => {
    const isPerm = pipeline === "permanent";
    return {
      id: "preview-post",
      spot_id: livePreviewVenue.id,
      spot_name: livePreviewVenue.name,
      spot_address: livePreviewVenue.address,
      spot_neighborhood: livePreviewVenue.neighborhood || "Sentrum",
      spot_coords: [livePreviewVenue.longitude, livePreviewVenue.latitude],
      dish_name: isPerm ? (dishName || "Signature Dish") : (popupDishName || "Residency Special"),
      price_nok: isPerm ? dishPrice : popupDishPrice,
      rating: 9.4,
      taste_tags: isPerm ? ["Signature", "Oslo"] : ["Pop-up Drop", "Limited Batch"],
      image_url: isPerm ? (dishImage || spotCoverImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80") : (popupDishImage || "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"),
      review_text: isPerm ? (dishTasteNote || "In-house culinary signature.") : (popupDishNote || "Limited batch residency special."),
      category: isPerm ? spotCategory : "street_food",
      dietary_tags: isPerm ? dishDietary : popupDietary,
      created_at_relative: "Just now",
      likes_count: 24,
      saves_count: 8,
      spot_type: isPerm ? "restaurant" : "pop_up",
      author: {
        handle: applicantInstagram ? applicantInstagram.replace("@", "") : "verified_partner",
        name: applicantName || livePreviewVenue.name,
        avatar_url: "/mascots/cheffy.png",
        badge: "Chef",
      },
    };
  }, [
    pipeline,
    livePreviewVenue,
    dishName,
    popupDishName,
    dishPrice,
    popupDishPrice,
    dishImage,
    spotCoverImage,
    popupDishImage,
    dishTasteNote,
    popupDishNote,
    spotCategory,
    dishDietary,
    popupDietary,
    applicantInstagram,
    applicantName,
  ]);

  // Reset all state for a new spot
  const handleResetAll = () => {
    setPipeline(null);
    setStep(1);
    setSelectedVenue(null);
    setSearchQuery("");
    setSubmittedClaimId(null);
    setSubmittedEmail("");
  };

  // =========================================================================
  // SUBMISSION CONFIRMATION VIEW
  // =========================================================================
  if (submittedClaimId) {
    return (
      <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-7 sm:p-10 text-center space-y-5 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-comico text-2xl sm:text-3xl font-bold text-[#181615] dark:text-white">
            Claim Received
          </h2>
          <p className="text-xs sm:text-sm text-[#6E655F] dark:text-[#A89E96] max-w-md mx-auto leading-relaxed">
            Your radar card updates for{" "}
            <span className="font-bold text-[#181615] dark:text-white">
              {pipeline === "permanent" ? spotName : popupBrandName}
            </span>{" "}
            have been queued for verification.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-left text-xs space-y-2 max-w-sm mx-auto shadow-2xs">
          <div className="flex justify-between items-center text-[#6E655F]">
            <span>Reference ID:</span>
            <span className="font-bold text-[#181615] dark:text-white">{submittedClaimId.slice(0, 14)}</span>
          </div>
          {submittedEmail && (
            <div className="flex justify-between items-center text-[#6E655F]">
              <span>Notification Email:</span>
              <span className="font-bold text-[#181615] dark:text-white truncate max-w-[180px]">{submittedEmail}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[#6E655F]">
            <span>Review Window:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">Within 2 working days</span>
          </div>
        </div>

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
  // SLIDE 0: FORMAT SELECTOR (PERMANENT SPOT vs POP-UP RESIDENCY)
  // =========================================================================
  if (!pipeline) {
    return (
      <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
            Step 1 · Format Selection
          </div>
          <h2 className="font-comico text-xl sm:text-2xl font-bold text-[#181615] dark:text-white">
            What type of kitchen are you listing?
          </h2>
          <p className="text-xs text-[#6E655F] dark:text-[#A89E96] max-w-xl">
            Select your kitchen format to enter the tailored 4-step card designer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Permanent Spot */}
          <button
            type="button"
            onClick={() => {
              setPipeline("permanent");
              setStep(1);
            }}
            className="p-6 rounded-3xl bg-white dark:bg-[#181615] border-2 border-[#181615]/10 hover:border-[#e84a27] text-left transition-all group cursor-pointer shadow-xs active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <StorefrontIcon className="w-6 h-6" />
              </div>
              <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                Permanent Spot
              </h3>
              <p className="text-xs text-[#6E655F] dark:text-[#A89E96] mt-2 leading-relaxed">
                Restaurant, bakery, cafe or food truck with a regular physical Google Maps presence in Oslo.
              </p>
            </div>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#e84a27] group-hover:translate-x-1 transition-transform">
              <span>Start Permanent Spot Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card B: Pop-up Residency */}
          <button
            type="button"
            onClick={() => {
              setPipeline("popup");
              setStep(1);
            }}
            className="p-6 rounded-3xl bg-white dark:bg-[#181615] border-2 border-[#181615]/10 hover:border-[#e84a27] text-left transition-all group cursor-pointer shadow-xs active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <TicketStubIcon className="w-6 h-6" />
              </div>
              <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                Pop-up Residency / Guest Drop
              </h3>
              <p className="text-xs text-[#6E655F] dark:text-[#A89E96] mt-2 leading-relaxed">
                Guest takeover inside an Oslo bar, temporary culinary residency, or outdoor limited batch drop.
              </p>
            </div>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#e84a27] group-hover:translate-x-1 transition-transform">
              <span>Start Pop-up Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PIPELINE A & B CAROUSEL STEP WIZARD
  // =========================================================================
  const stepTitlesPermanent: Record<1 | 2 | 3 | 4, string> = {
    1: "Find Oslo Spot",
    2: "Signature Dish",
    3: "Venue & Hours",
    4: "Review & Claim",
  };

  const stepTitlesPopup: Record<1 | 2 | 3 | 4, string> = {
    1: "Brand & Location",
    2: "Dates & Schedule",
    3: "Signature Dish Drop",
    4: "Review & Claim",
  };

  const currentStepTitle =
    pipeline === "permanent" ? stepTitlesPermanent[step] : stepTitlesPopup[step];
  const progressPercent = (step / 4) * 100;

  return (
    <div className="rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1917] border border-[#181615]/10 shadow-sm overflow-hidden">
      {/* 56px Slim Sticky Wizard Header */}
      <div className="sticky top-0 z-20 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-[#181615]/10">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                setPipeline(null);
                setSelectedVenue(null);
              } else {
                setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : 1));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#181615]/20 text-xs font-bold text-[#181615] dark:text-white transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27]" />
            <span>{step === 1 ? "Change Format" : "Back"}</span>
          </button>

          {/* Step Pill */}
          <div className="text-center">
            <span className="text-xs font-bold text-[#181615] dark:text-white">
              Step {step} of 4 · {currentStepTitle}
            </span>
          </div>

          {/* Live Preview Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e84a27]/10 hover:bg-[#e84a27]/20 border border-[#e84a27]/20 text-[#e84a27] text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview Card</span>
          </button>
        </div>

        {/* 3px Progress Indicator */}
        <div className="w-full h-[3px] bg-[#181615]/5">
          <div
            className="h-full bg-[#e84a27] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Form Content with Horizontal Slide Animation */}
      <div className="p-4 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pipeline}_step_${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* ================================================================= */}
            {/* PIPELINE A: PERMANENT SPOT STEPS                                 */}
            {/* ================================================================= */}
            {pipeline === "permanent" && (
              <>
                {/* STEP 1: Find Spot */}
                {step === 1 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Find Your Spot in Oslo
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Search your restaurant name to inherit your Google Maps location and verified address.
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#e84a27] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePlacesSearch()}
                        placeholder="e.g. Koie Ramen, Farine, Trekanten, Digg Pizza..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold text-[#181615] dark:text-white placeholder-[#8A8073] focus:outline-none focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Corridor Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {OSLO_CORRIDORS.map((c) => (
                        <button
                          key={c.filter}
                          type="button"
                          onClick={() => setSelectedCorridor(c.filter)}
                          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCorridor === c.filter
                              ? "bg-[#e84a27] text-white"
                              : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Results */}
                    {(localMatches.length > 0 || externalPlaces.length > 0) && (
                      <div className="rounded-2xl border border-[#181615]/10 bg-white dark:bg-[#181615] overflow-hidden divide-y divide-[#181615]/5 shadow-xs">
                        {localMatches.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVenue(v)}
                            className="w-full text-left p-3.5 hover:bg-[#FAF7F2] dark:hover:bg-[#23201D] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#181615] dark:text-white truncate">
                                {v.name}
                              </p>
                              <p className="text-[11px] text-[#6E655F] truncate">
                                {v.address} · {v.neighborhood || v.city || "Oslo"}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#2A2624] text-[#181615] dark:text-white shrink-0">
                              Select Spot →
                            </span>
                          </button>
                        ))}

                        {externalPlaces.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVenue(v)}
                            className="w-full text-left p-3.5 hover:bg-[#FAF7F2] dark:hover:bg-[#23201D] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#181615] dark:text-white truncate flex items-center gap-1.5">
                                <span>{v.name}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Google Maps
                                </span>
                              </p>
                              <p className="text-[11px] text-[#6E655F] truncate">{v.address}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e84a27] text-white shrink-0">
                              Import Spot →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Spot Fallback */}
                    {searchQuery.trim().length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleCreateCustomVenue(searchQuery)}
                        className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#e84a27] flex items-center justify-between gap-3 transition-colors text-left cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#181615] dark:text-white truncate">
                              Not listed? Add "{searchQuery.trim()}" directly
                            </p>
                            <p className="text-[11px] text-[#6E655F]">
                              Create a new listing and customize cards right away
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-[#e84a27] group-hover:translate-x-0.5 transition-transform shrink-0">
                          Add →
                        </span>
                      </button>
                    )}

                    {/* Selected Venue Notice */}
                    {selectedVenue && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#181615] border-2 border-[#e84a27]/30 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#e84a27] uppercase tracking-wider">
                            Selected Spot
                          </span>
                          <h4 className="font-comico text-sm font-bold text-[#181615] dark:text-white truncate">
                            {selectedVenue.name}
                          </h4>
                          <p className="text-[11px] text-[#6E655F] truncate">{selectedVenue.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="px-4 py-2 rounded-xl bg-[#e84a27] text-white text-xs font-bold transition-all hover:bg-[#d43d1c] active:scale-95 cursor-pointer shrink-0"
                        >
                          Next: Signature Dish →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Signature Dish */}
                {step === 2 && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Your Oslo Signature Dish
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        The dish you are most known for. Food hunters in Oslo discover you by this meal.
                      </p>
                    </div>

                    {/* Dish Photo Switcher */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Signature Dish Photo *
                      </label>
                      <VisualPhotoSwitcher
                        currentImageUrl={dishImage}
                        onSelectPhoto={setDishImage}
                        venuePlaceId={selectedVenue?.google_place_id ?? undefined}
                        venueName={selectedVenue?.name}
                        extraPhotos={[
                          ...(selectedVenue?.cover_image_url ? [selectedVenue.cover_image_url] : []),
                          ...menuDishes.map((d) => d.imageUrl).filter(Boolean),
                        ]}
                        label="Signature Dish Photo"
                        category={spotCategory}
                      />
                    </div>

                    {/* Dish Name & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          Dish Name *
                        </label>
                        <input
                          type="text"
                          value={dishName}
                          onChange={(e) => setDishName(e.target.value)}
                          placeholder="e.g. Crispy Pork Sando, Tonkotsu Ramen"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          In-House Price (NOK) *
                        </label>
                        <input
                          type="number"
                          value={dishPrice}
                          onChange={(e) => setDishPrice(Number(e.target.value) || 0)}
                          placeholder="185"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                        />
                      </div>
                    </div>

                    {/* Taste Note */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Dish Note &amp; Preparation
                      </label>
                      <textarea
                        rows={2}
                        value={dishTasteNote}
                        onChange={(e) => setDishTasteNote(e.target.value)}
                        placeholder="Describe key ingredients, homemade sauces, or what makes this item unique..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Dietary Tags */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Dietary Specifications
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map((tag) => {
                          const active = dishDietary.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                setDishDietary((prev) =>
                                  active ? prev.filter((d) => d !== tag.id) : [...prev, tag.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                active
                                  ? "bg-[#181615] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                              }`}
                            >
                              {active ? `✓ ${tag.label}` : tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Your Menu Section */}
                    <div className="pt-3 border-t border-[#181615]/10 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-comico text-sm font-bold text-[#181615] dark:text-white">
                            Your Menu ({menuDishes.length})
                          </h4>
                          <p className="text-[11px] text-[#6E655F]">
                            Dishes showcased on your card. Tap to edit or add specials.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDish(null);
                            setIsDishEditorOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-[#181615] dark:text-white hover:border-[#e84a27] text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#e84a27]" />
                          <span>Add Another Dish</span>
                        </button>
                      </div>

                      {menuDishes.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {menuDishes.map((d, idx) => (
                            <div
                              key={d.id || idx}
                              onClick={() => {
                                setEditingDish(d);
                                setIsDishEditorOpen(true);
                              }}
                              className="p-2.5 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 hover:border-[#e84a27]/50 flex items-center gap-3 cursor-pointer group transition-all"
                            >
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-black/5">
                                {d.imageUrl ? (
                                  <img
                                    src={d.imageUrl}
                                    alt={d.dishName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <StorefrontIcon className="w-5 h-5 text-zinc-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-[#181615] dark:text-white truncate group-hover:text-[#e84a27] transition-colors">
                                  {d.dishName}
                                </p>
                                <p className="text-[11px] text-[#e84a27] font-semibold">
                                  {d.priceNok ? `${d.priceNok} NOK` : "Seasonal"}
                                </p>
                              </div>
                              <span className="text-[10px] text-zinc-400 group-hover:text-[#181615] dark:group-hover:text-white pr-1">
                                Edit →
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#181615]/10">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Spot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!dishName.trim()) {
                            showToast("Please enter a signature dish name.", "error");
                            return;
                          }
                          setStep(3);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Continue to Hours &amp; Venue →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Venue Card & Hours */}
                {step === 3 && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Venue Presentation &amp; Hours
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Keep your store atmosphere photo, operating times, and category accurate on the map.
                      </p>
                    </div>

                    {/* Cover Photo */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Store Cover Photo
                      </label>
                      <VisualPhotoSwitcher
                        currentImageUrl={spotCoverImage}
                        onSelectPhoto={setSpotCoverImage}
                        venuePlaceId={selectedVenue?.google_place_id ?? undefined}
                        venueName={selectedVenue?.name}
                        extraPhotos={[
                          ...(selectedVenue?.cover_image_url ? [selectedVenue.cover_image_url] : []),
                          ...menuDishes.map((d) => d.imageUrl).filter(Boolean),
                        ]}
                        label="Store Cover Photo"
                        category={spotCategory}
                      />
                    </div>

                    {/* Operating Schedule */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Opening Schedule *
                      </label>
                      <TimeSlotPicker
                        value={spotHours}
                        onChange={setSpotHours}
                        label="Daily Store Hours"
                      />
                    </div>

                    {/* Food Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Primary Food Category
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1">
                        {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSpotCategory(cat.id as FoodCategory)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              spotCategory === cat.id
                                ? "bg-[#e84a27] text-white shadow-2xs"
                                : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                            }`}
                          >
                            {cat.emoji} {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#181615]/10">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Dish
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Continue to Review &amp; Claim →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Claim Remote */}
                {step === 4 && (
                  <div className="space-y-6 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Review Your Card &amp; Claim Remote
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Confirm your card preview and provide verification info to receive your private kitchen link.
                      </p>
                    </div>

                    {/* Mini Card Preview Strip */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {dishImage ? (
                          <img
                            src={dishImage}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-[#181615]/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#181615]/10 flex items-center justify-center shrink-0">
                            <StorefrontIcon className="w-6 h-6 text-[#8A8073]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#181615] dark:text-white truncate">
                            {spotName || selectedVenue?.name}
                          </p>
                          <p className="text-[11px] text-[#e84a27] font-bold truncate">
                            {dishName} · {dishPrice} NOK
                          </p>
                          <p className="text-[10px] text-[#6E655F] truncate">{spotHours}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#2A2624] text-[#181615] dark:text-white text-xs font-bold border border-[#181615]/10 hover:border-[#e84a27] cursor-pointer shrink-0"
                      >
                        Full Preview 👁️
                      </button>
                    </div>

                    {/* Kitchen Batch Status Pill */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Initial Live Kitchen Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "normal", label: "✓ Normal Batch" },
                          { id: "fresh_batch", label: "🔥 Fresh Batch" },
                          { id: "low_stock", label: "⚡ Few Left" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setKitchenStatus(s.id as any)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              kitchenStatus === s.id
                                ? "bg-[#181615] text-white shadow-2xs"
                                : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Applicant Information */}
                    <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 shadow-2xs">
                      <div className="text-xs font-bold text-[#181615] dark:text-white">
                        Verification &amp; Contact Details
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Full Name *</label>
                          <input
                            type="text"
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="e.g. Henrik Olsen"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Role *</label>
                          <select
                            value={applicantRole}
                            onChange={(e) => setApplicantRole(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                          >
                            <option value="owner">Owner / Founder</option>
                            <option value="chef">Head Chef / Cook</option>
                            <option value="manager">General Manager</option>
                            <option value="staff">Kitchen Staff</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Business Email *</label>
                          <input
                            type="email"
                            value={applicantEmail}
                            onChange={(e) => setApplicantEmail(e.target.value)}
                            placeholder="contact@restaurant.no"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Norwegian Phone</label>
                          <input
                            type="tel"
                            value={applicantPhone}
                            onChange={(e) => setApplicantPhone(e.target.value)}
                            placeholder="e.g. 91234567"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Org Number (Optional)</label>
                          <input
                            type="text"
                            value={applicantOrgNumber}
                            onChange={(e) => setApplicantOrgNumber(e.target.value)}
                            placeholder="9 digits (Brønnøysund)"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Instagram Handle</label>
                          <input
                            type="text"
                            value={applicantInstagram}
                            onChange={(e) => setApplicantInstagram(e.target.value)}
                            placeholder="@restaurantoslo"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Hours
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitClaim}
                        className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Claim…</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Submit Claim &amp; Request Remote →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================================================================= */}
            {/* PIPELINE B: POP-UP RESIDENCY STEPS                               */}
            {/* ================================================================= */}
            {pipeline === "popup" && (
              <>
                {/* STEP 1: Pop-up Brand & Location */}
                {step === 1 && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Pop-up Brand &amp; Location
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Pop-ups do not need a permanent address. Set your brand name and where you will be serving in Oslo.
                      </p>
                    </div>

                    {/* Brand Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Pop-up Brand Name *
                      </label>
                      <input
                        type="text"
                        value={popupBrandName}
                        onChange={(e) => setPopupBrandName(e.target.value)}
                        placeholder="e.g. Hot Temper, Nolo Burger Crew, Seoul Bites"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Location Type Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Location Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPopupLocationType("host_venue")}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            popupLocationType === "host_venue"
                              ? "border-[#e84a27] bg-[#e84a27]/5 text-[#181615] dark:text-white font-bold"
                              : "border-[#181615]/10 bg-white dark:bg-[#181615] text-[#6E655F]"
                          }`}
                        >
                          <WineBarIcon className="w-5 h-5 text-[#e84a27]" />
                          <div>
                            <p className="text-xs font-bold">Host Bar / Venue</p>
                            <p className="text-[10px] text-[#6E655F]">Inside an existing Oslo venue</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPopupLocationType("outdoor")}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            popupLocationType === "outdoor"
                              ? "border-[#e84a27] bg-[#e84a27]/5 text-[#181615] dark:text-white font-bold"
                              : "border-[#181615]/10 bg-white dark:bg-[#181615] text-[#6E655F]"
                          }`}
                        >
                          <OutdoorParkIcon className="w-5 h-5 text-[#e84a27]" />
                          <div>
                            <p className="text-xs font-bold">Outdoor / Park</p>
                            <p className="text-[10px] text-[#6E655F]">Square, festival or truck</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Location Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        {popupLocationType === "host_venue"
                          ? "Host Venue or Bar in Oslo *"
                          : "Outdoor Location or Square *"}
                      </label>
                      <input
                        type="text"
                        value={popupLocationName}
                        onChange={(e) => setPopupLocationName(e.target.value)}
                        placeholder={
                          popupLocationType === "host_venue"
                            ? "e.g. Becco, Trekanten, Kulturhuset"
                            : "e.g. Birkelunden Park, Kuben, Youngstorget"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#181615]/10">
                      <button
                        type="button"
                        onClick={() => setPipeline(null)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Format
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!popupBrandName.trim()) {
                            showToast("Please enter your pop-up brand name.", "error");
                            return;
                          }
                          setStep(2);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Continue to Schedule →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Pop-up Dates & Schedule */}
                {step === 2 && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Residency Dates &amp; Daily Schedule
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Define when your drop occurs so radar followers know exactly when to show up.
                      </p>
                    </div>

                    {/* Date Window */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Date Window *
                      </label>
                      <DateWindowPicker
                        value={popupDateWindow}
                        onChange={setPopupDateWindow}
                      />
                    </div>

                    {/* Operating Hours */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Serving Hours *
                      </label>
                      <TimeSlotPicker
                        value={popupHours}
                        onChange={setPopupHours}
                        label="Daily Drop Window"
                      />
                    </div>

                    {/* Portion Cap & Entry Format */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          Batch Portion Cap
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PORTION_CAP_OPTIONS.map((cap) => (
                            <button
                              key={cap}
                              type="button"
                              onClick={() => setPopupPortionCap(cap)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                                popupPortionCap === cap
                                  ? "bg-[#181615] text-white"
                                  : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                              }`}
                            >
                              {cap}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          Entry Format
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "walk_in", label: "Walk-in Only" },
                            { id: "ticketed", label: "Ticketed / RSVP" },
                          ].map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => setPopupEntryType(e.id as any)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                                popupEntryType === e.id
                                  ? "bg-[#181615] text-white"
                                  : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                              }`}
                            >
                              {e.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#181615]/10">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Location
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Continue to Signature Drop →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Pop-up Signature Dish */}
                {step === 3 && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Residency Signature Drop
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Upload a photo of your feature dish and state the drop price.
                      </p>
                    </div>

                    {/* Dish Photo Switcher */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Feature Dish Photo *
                      </label>
                      <VisualPhotoSwitcher
                        currentImageUrl={popupDishImage}
                        onSelectPhoto={setPopupDishImage}
                        label="Feature Dish Photo"
                        category="street_food"
                      />
                    </div>

                    {/* Dish Name & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          Dish Name *
                        </label>
                        <input
                          type="text"
                          value={popupDishName}
                          onChange={(e) => setPopupDishName(e.target.value)}
                          placeholder="e.g. Smash Double Cheese, Kimchi Fried Chicken"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615] dark:text-white">
                          Price (NOK) *
                        </label>
                        <input
                          type="number"
                          value={popupDishPrice}
                          onChange={(e) => setPopupDishPrice(Number(e.target.value) || 0)}
                          placeholder="195"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                        />
                      </div>
                    </div>

                    {/* Drop Note */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Drop Note &amp; Story
                      </label>
                      <textarea
                        rows={2}
                        value={popupDishNote}
                        onChange={(e) => setPopupDishNote(e.target.value)}
                        placeholder="Tell diners what makes this limited drop special..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                      />
                    </div>

                    {/* Dietary Tags */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Dietary Specifications
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map((tag) => {
                          const active = popupDietary.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                setPopupDietary((prev) =>
                                  active ? prev.filter((d) => d !== tag.id) : [...prev, tag.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                active
                                  ? "bg-[#181615] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                              }`}
                            >
                              {active ? `✓ ${tag.label}` : tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#181615]/10">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!popupDishName.trim()) {
                            showToast("Please enter a drop dish name.", "error");
                            return;
                          }
                          setStep(4);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Continue to Review &amp; Claim →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Pop-up Review & Claim */}
                {step === 4 && (
                  <div className="space-y-6 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <h3 className="font-comico text-lg font-bold text-[#181615] dark:text-white">
                        Review Ticket &amp; Claim Organizer Access
                      </h3>
                      <p className="text-xs text-[#6E655F]">
                        Review your pop-up ticket card and submit contact details to claim organizer control.
                      </p>
                    </div>

                    {/* Pop-up Ticket Preview Box */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {popupDishImage ? (
                          <img
                            src={popupDishImage}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-[#181615]/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#181615]/10 flex items-center justify-center shrink-0">
                            <TicketStubIcon className="w-6 h-6 text-[#8A8073]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#e84a27] uppercase tracking-wider">
                            {popupDateWindow} · {popupHours}
                          </span>
                          <h4 className="font-comico text-sm font-bold text-[#181615] dark:text-white truncate">
                            {popupBrandName}
                          </h4>
                          <p className="text-[11px] text-[#6E655F] truncate">
                            {popupDishName} · {popupDishPrice} NOK
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#2A2624] text-[#181615] dark:text-white text-xs font-bold border border-[#181615]/10 hover:border-[#e84a27] cursor-pointer shrink-0"
                      >
                        Full Ticket 👁️
                      </button>
                    </div>

                    {/* Kitchen Status */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615] dark:text-white">
                        Initial Batch Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "normal", label: "✓ Normal Batch" },
                          { id: "fresh_batch", label: "🔥 Fresh Batch" },
                          { id: "low_stock", label: "⚡ Few Left" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setKitchenStatus(s.id as any)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              kitchenStatus === s.id
                                ? "bg-[#181615] text-white shadow-2xs"
                                : "bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F]"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Organizer Contact Details */}
                    <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#181615] border border-[#181615]/10 shadow-2xs">
                      <div className="text-xs font-bold text-[#181615] dark:text-white">
                        Organizer Contact Information
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Organizer Name *</label>
                          <input
                            type="text"
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="e.g. Astrid Berg"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Role *</label>
                          <select
                            value={applicantRole}
                            onChange={(e) => setApplicantRole(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-semibold focus:outline-none focus:border-[#e84a27]"
                          >
                            <option value="owner">Founder / Organizer</option>
                            <option value="chef">Guest Chef</option>
                            <option value="manager">Collaborator</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Contact Email *</label>
                          <input
                            type="email"
                            value={applicantEmail}
                            onChange={(e) => setApplicantEmail(e.target.value)}
                            placeholder="astrid@popupbrand.com"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Instagram Handle *</label>
                          <input
                            type="text"
                            value={applicantInstagram}
                            onChange={(e) => setApplicantInstagram(e.target.value)}
                            placeholder="@popupbrand"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-[#6E655F]">Norwegian Phone</label>
                          <input
                            type="tel"
                            value={applicantPhone}
                            onChange={(e) => setApplicantPhone(e.target.value)}
                            placeholder="e.g. 91234567"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#23201D] border border-[#181615]/10 text-xs font-medium focus:outline-none focus:border-[#e84a27]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer"
                      >
                        ← Back to Drop
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitClaim}
                        className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Pop-up…</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Submit Pop-up &amp; Request Remote →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* =========================================================================
          LIVE PREVIEW SLIDE-UP DRAWER
          ========================================================================= */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-50 w-full max-w-xl mx-auto max-h-[90dvh] overflow-y-auto bg-[#FAF7F2] dark:bg-[#1C1917] rounded-t-3xl border-t border-[#181615]/10 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-[#181615]/10">
                <div className="flex items-center gap-2">
                  <span className="font-comico text-sm font-bold text-[#181615] dark:text-white">
                    Live Card Preview
                  </span>
                  {pipeline === "permanent" && (
                    <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-[#181615] border border-[#181615]/10 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPermanentPreviewFormat("restaurant")}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          permanentPreviewFormat === "restaurant"
                            ? "bg-[#e84a27] text-white"
                            : "text-[#6E655F]"
                        }`}
                      >
                        Restaurant Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermanentPreviewFormat("feed")}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          permanentPreviewFormat === "feed"
                            ? "bg-[#e84a27] text-white"
                            : "text-[#6E655F]"
                        }`}
                      >
                        Feed Card
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-full bg-white dark:bg-[#181615] border border-[#181615]/10 text-[#6E655F] hover:text-[#181615] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 sm:p-6 flex justify-center pb-12">
                {pipeline === "permanent" ? (
                  permanentPreviewFormat === "restaurant" ? (
                    <div className="w-full">
                      <PartnerRestaurantCardPreview
                        venue={livePreviewVenue}
                        coverImageUrl={spotCoverImage || livePreviewVenue.cover_image_url || ""}
                        openingHours={spotHours}
                        spotType="restaurant"
                        dishes={
                          menuDishes.length > 0
                            ? menuDishes
                            : [
                                {
                                  id: "dish_primary",
                                  dishName: dishName || "Signature Dish",
                                  priceNok: dishPrice,
                                  imageUrl: dishImage || spotCoverImage || "",
                                  tasteNote: dishTasteNote,
                                  category: spotCategory,
                                  dietaryTags: dishDietary,
                                },
                              ]
                        }
                        onEditDish={(idx) => {
                          const target = menuDishes[idx];
                          if (target) {
                            setEditingDish(target);
                            setIsDishEditorOpen(true);
                          }
                        }}
                        onAddDish={() => {
                          setEditingDish(null);
                          setIsDishEditorOpen(true);
                        }}
                        isVerified={true}
                        isProposed={true}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-sm">
                      <PartnerCardPreview
                        venueName={spotName || livePreviewVenue.name}
                        neighborhood={livePreviewVenue.neighborhood || "Sentrum"}
                        dishName={dishName || "Signature Dish"}
                        priceNok={dishPrice}
                        imageUrl={dishImage || spotCoverImage || ""}
                        tasteNote={dishTasteNote}
                        rating={livePreviewVenue.google_rating}
                        spotType="restaurant"
                        isVerified={true}
                      />
                    </div>
                  )
                ) : (
                  <div className="w-full max-w-sm">
                    <PopupEventCard
                      venue={livePreviewVenue}
                      post={livePreviewPost}
                      priority
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partner Multi-Dish Editor Sheet */}
      <PartnerDishEditorSheet
        isOpen={isDishEditorOpen}
        onClose={() => setIsDishEditorOpen(false)}
        dish={editingDish}
        venuePlaceId={selectedVenue?.google_place_id ?? undefined}
        venueName={selectedVenue?.name || spotName}
        category={spotCategory}
        onSaveDish={handleSaveMenuDish}
        onDeleteDish={handleDeleteMenuDish}
        showToast={showToast}
      />
    </div>
  );
}
