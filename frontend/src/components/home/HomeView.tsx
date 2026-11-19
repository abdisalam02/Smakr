"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from "react";
import { FeedFilterBar } from "@/components/filter/FeedFilterBar";
import { SmakrWeeklyPickSplitBanner } from "@/components/food/SmakrWeeklyPickSplitBanner";
import { FoodPostCard } from "@/components/food/FoodPostCard";
import { FeedEmptyState } from "@/components/food/FeedEmptyState";
import { FoodPostCardSkeleton, FoodSpotCardSkeleton, WeeklyPickSkeleton, FeedFilterBarSkeleton, PopupEventCardSkeleton } from "@/components/food/CardSkeletons";
import { FoodSpotCard } from "@/components/food/FoodSpotCard";
import { PopupEventCard } from "@/components/food/PopupEventCard";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { FoodViewSlider } from "@/components/food/FoodViewSlider";
import { MapNeighborhoodDock } from "@/components/map/MapNeighborhoodDock";
import dynamic from "next/dynamic";
import { VenueBottomSheet } from "@/components/venue/VenueBottomSheet";
import { LocationPrompt } from "@/components/location/LocationPrompt";
import { VenueDetailPane } from "@/components/venue/VenueDetailPane";
import { SmakrFoodieInviteModal } from "@/components/auth/SmakrFoodieInviteModal";
import {
  BecomeAFoodieBanner,
  FoodieCalloutCard,
  LocalsPicksSwimlane,
  resolveLocalsPicks,
} from "@/components/food/FoodieCommunityBlocks";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useLiveVibeSync } from "@/hooks/useLiveVibeSync";
import { useSyncAppData } from "@/hooks/useSyncAppData";
import { FOOD_CATEGORIES } from "@/lib/foodCategories";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { PeepsBootScreen } from "@/components/ui/PeepsBootScreen";
import { motion, AnimatePresence } from "motion/react";
import { Utensils } from "lucide-react";
import type { FoodPost, Venue, WeeklyPick } from "@/types";
import { isVisibleInFeed, getPopupUrgencyScore, isPopupVenue, resolvePopupLifecycle } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import { resolveEntityTaxonomy } from "@/lib/taxonomy";
import { slugifyVenue } from "@/lib/slugify";
import { formatOsloLocation } from "@/lib/location";
import { PopupBrandWordmark } from "@/components/food/PopupBrandWordmark";
import { trackEvent } from "@/lib/analytics";

function slugifySpotParam(value: string): string {
  return slugifyVenue(value);
}

const OSLO_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Oslo",
});

function getOsloDateSeed(): string {
  return OSLO_DATE_FORMATTER.format(new Date());
}

function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic daily shuffle (SSR/client hydration safe via Oslo YYYY-MM-DD). */
function dailySeededShuffle<T>(items: T[], seedKey: string): T[] {
  const out = [...items];
  const rand = mulberry32(fnv1a32(`${getOsloDateSeed()}::${seedKey}`));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Spread adjacent dishes in 2-col rows so identical categories do not sit side-by-side when alternatives exist. */
function spreadAdjacentCategories(posts: FoodPost[]): FoodPost[] {
  const out = [...posts];
  for (let i = 1; i < out.length; i += 2) {
    const leftCat = out[i - 1]?.category;
    if (!leftCat || out[i]?.category !== leftCat) continue;
    for (let j = i + 1; j < out.length; j++) {
      if (out[j]?.category !== leftCat) {
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
        break;
      }
    }
  }
  return out;
}

function dailyUnitNoise(id: string, seedKey: string): number {
  return mulberry32(fnv1a32(`${getOsloDateSeed()}::${seedKey}::${id}`))();
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * MapLibre is a large dependency — load it lazily (client-only) so it never
 * blocks the first paint / store hydration. The real map initializes underneath
 * PeepsBootScreen and reveals seamlessly when boot fades away.
 */
const MapRadarView = dynamic(
  () => import("@/components/map/MapRadarView").then((m) => m.MapRadarView),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="w-full h-full relative overflow-hidden bg-[#EFECE4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(43,24,16,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,24,16,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              "radial-gradient(circle at 62% 58%, rgba(169,207,226,0.38) 0%, rgba(169,207,226,0) 42%)",
          }}
        />
      </div>
    ),
  }
);

function getCardInitial(_totalCount: number) {
  return { opacity: 1, scale: 0.985, y: 10 };
}

function getCardTransition(_index: number, _totalCount: number) {
  return { type: "spring" as const, stiffness: 460, damping: 34, mass: 0.6 };
}

export interface HomeInitialData {
  venues: Venue[];
  foodPosts: FoodPost[];
  weeklyPick: WeeklyPick;
}

let hasPlayedBootThisLoad = false;

export function HomeView({
  initialData,
  bypassBoot = false,
  initialSpotSlug,
}: {
  initialData: HomeInitialData;
  bypassBoot?: boolean;
  initialSpotSlug?: string;
}) {
  // Original boot-over-background flow: PeepsBootScreen renders immediately on
  // frame 0 while the real page + MapLibre initialize underneath, and is
  // bypassed on direct ?spot= share links or ?boot=0.
  const [showBoot, setShowBoot] = useState(() => !hasPlayedBootThisLoad && !bypassBoot);
  const [mapMountReady, setMapMountReady] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const urlCampaignInitRef = useRef(false);
  const spotDeepLinkAppliedRef = useRef(false);

  useEffect(() => {
    if (mapMountReady) return;
    const fallbackTimer = window.setTimeout(() => setMapMountReady(true), 150);
    return () => window.clearTimeout(fallbackTimer);
  }, [mapMountReady]);

  // Seed the store from the server-prefetched payload in a layout effect: it
  // runs once, before the browser paints the hydrated tree, so the dish feed /
  // map pins appear on the first painted frame with NO client fetch and no
  // skeleton flash. (Zustand's SSR snapshot is its creation state, so the server
  // HTML paints the light skeletons; the RSC payload then fills them in on
  // hydration without any network round-trip.)
  const lastSeededRef = useRef<HomeInitialData | null>(null);
  useLayoutEffect(() => {
    if (lastSeededRef.current === initialData) return;
    lastSeededRef.current = initialData;
    const store = useCityPulseStore.getState();
    store.setVenues(initialData.venues);
    store.setFoodPosts(initialData.foodPosts);
    store.setWeeklyPick(initialData.weeklyPick);
    store.markServerDataApplied();
    if (initialData.venues.length > 0 || initialData.foodPosts.length > 0) {
      store.setIsHydratingData(false);
    }
  }, [initialData]);

  const hasServerData =
    initialData.venues.length > 0 || initialData.foodPosts.length > 0;

  // Activate real-time stream
  useLiveVibeSync();

  // Reconcile non-blockingly in the background after boot and on tab resume/bfcache,
  // so SSR warm edge hits never lock out fresh Supabase edits.
  useSyncAppData(hasServerData, !showBoot);

  // Only ONE MapLibre instance should mount. The desktop and mobile layouts are
  // both in the React tree (CSS just hides one), so rendering a map in each
  // initialized two maps on every load — doubling map/marker work and stalling
  // hydration. Gate them on the actual breakpoint.
  const [isDesktop, setIsDesktop] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__cityPulseStore = useCityPulseStore;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const storeVenues = useCityPulseStore((state) => state.venues);
  const venues = storeVenues.length > 0 ? storeVenues : initialData.venues;
  // O(1) venue lookups for the feed filters — `venues.find` inside a filter
  // loop was O(posts × venues) and made every filter tap feel sluggish.
  const venueById = useMemo(
    () => new Map(venues.map((venue) => [venue.id, venue])),
    [venues]
  );
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const storeFoodPosts = useCityPulseStore((state) => state.foodPosts);
  const foodPosts = storeFoodPosts.length > 0 ? storeFoodPosts : initialData.foodPosts;
  // O(1) top curated dish post lookup per venue for instant card rendering
  const topPostByVenueId = useMemo(() => {
    const map = new Map<string, { photo?: string; dishName?: string; priceNok?: number | null }>();
    for (const post of foodPosts) {
      if (post.spot_id && post.image_url && !post.is_archived && !map.has(post.spot_id)) {
        map.set(post.spot_id, {
          photo: post.image_url,
          dishName: post.dish_name,
          priceNok: post.price_nok,
        });
      }
    }
    return map;
  }, [foodPosts]);
  const isHydratingData = useCityPulseStore((state) => state.isHydratingData);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const selectedDishCategory = useCityPulseStore((state) => state.selectedDishCategory);
  const selectedCuisine = useCityPulseStore((state) => state.selectedCuisine);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const resetAllFilters = useCityPulseStore((state) => state.resetAllFilters);
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const setFeedMode = useCityPulseStore((state) => state.setFeedMode);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const mapNeighborhood = useCityPulseStore((state) => state.mapNeighborhood);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const searchQuery = useCityPulseStore((state) => state.filters.search_query);
  const spotTypeFilter = useCityPulseStore((state) => state.filters.spot_type);
  const priceTierFilter = useCityPulseStore((state) => state.filters.price_tier);
  const staffPicksOnly = useCityPulseStore((state) => state.filters.staff_picks_only);
  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const selectVenueById = useCityPulseStore((state) => state.selectVenueById);
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const isVenueDetailModalOpen = useCityPulseStore((state) => state.isVenueDetailModalOpen);

  // Full-feed mode: stop MapLibre's animation loop and hide the canvas so the
  // WebGL surface does not burn GPU while the user scrolls the feed.
  useEffect(() => {
    const map = (window as unknown as { __smakrMap?: { stop: () => void; resize: () => void } })
      .__smakrMap;
    if (!map) return;
    if (viewMode === "feed") {
      map.stop();
      return;
    }
    const raf = requestAnimationFrame(() => map.resize());
    return () => cancelAnimationFrame(raf);
  }, [viewMode]);

  // Deep linking: ?tab=popups / ?campaign=popups / ?view= / ?sheet= (once on mount)
  // and ?spot=<id-or-slug> auto-selects, flies, & opens VenueBottomSheet
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const store = useCityPulseStore.getState();

    if (!urlCampaignInitRef.current) {
      urlCampaignInitRef.current = true;
      const viewParam = params.get("view");
      if (viewParam === "map" || viewParam === "feed" || viewParam === "split") {
        store.setViewMode(viewParam);
      }
      const sheetParam = params.get("sheet");
      if (sheetParam === "peek" || sheetParam === "half" || sheetParam === "full") {
        store.setMobileSheetState(sheetParam);
      }

      const tabParam = (params.get("tab") || "").toLowerCase();
      const campaignParam = (params.get("campaign") || "").toLowerCase();
      if (tabParam === "popups" || campaignParam === "popups") {
        store.setSelectedSpotKind("popup");
      }
    }

    const spotParam = initialSpotSlug || params.get("spot");
    if (!spotParam || spotDeepLinkAppliedRef.current) return;

    const normalizedSpot = slugifySpotParam(spotParam);
    const foundVenue =
      venues.find(
        (v) =>
          v.id === spotParam ||
          v.id.toLowerCase() === spotParam.toLowerCase() ||
          slugifySpotParam(v.name) === normalizedSpot
      ) ??
      (() => {
        const foundPost = foodPosts.find(
          (p) =>
            p.spot_id === spotParam ||
            p.id === spotParam ||
            slugifySpotParam(p.spot_name || "") === normalizedSpot
        );
        return foundPost ? venues.find((v) => v.id === foundPost.spot_id) : undefined;
      })();

    if (foundVenue) {
      spotDeepLinkAppliedRef.current = true;
      store.setDeepLinkLockUntil(Date.now() + 2800);
      store.selectVenueById(foundVenue.id);
      store.setIsVenueDetailModalOpen(true);
      store.setBottomSheetOpen(true);
      flyToSpot([foundVenue.longitude, foundVenue.latitude], foundVenue.id);
      trackEvent("spot_opened", {
        venue_id: foundVenue.id,
        venue_name: foundVenue.name,
        spot_type: foundVenue.spot_type || "restaurant",
        source: "deep_link",
      });
    }
  }, [venues, foodPosts, flyToSpot, initialSpotSlug]);

  // Memoized food posts filtering to prevent unnecessary re-renders
  const filteredPosts = useMemo(() => {
    const filtered = foodPosts.filter((post) => {
      // Unpublished / archived filter (admins see drafts)
      if (currentUser?.role !== "admin") {
        if (post.is_published === false || post.is_archived === true) return false;
      }

      const linkedVenue = venueById.get(post.spot_id);
      const postTax = resolveEntityTaxonomy(linkedVenue, post);

      // Taxonomy filtering: Child dish category, Parent group, or legacy Category
      if (selectedDishCategory) {
        if (
          postTax.dishCategory !== selectedDishCategory &&
          post.category !== selectedDishCategory
        ) {
          return false;
        }
      } else if (selectedGroup) {
        if (postTax.group.id !== selectedGroup) {
          return false;
        }
      } else if (currentCategory !== "all") {
        if (
          post.category !== currentCategory &&
          postTax.dishCategory !== currentCategory
        ) {
          return false;
        }
      }

      // Cuisine filter (from expanded filter drawer)
      if (selectedCuisine && !(postTax.cuisines as string[]).includes(selectedCuisine)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = post.dish_name.toLowerCase().includes(q);
        const matchSpot = post.spot_name.toLowerCase().includes(q);
        const matchTags = post.taste_tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchSpot && !matchTags) return false;
      }

      // Exclude expired pop-ups (>7 days after closing)
      if (!isVisibleInFeed(linkedVenue)) return false;

      // Spot Type filter (sit-down restaurant, food truck, pop-up, or Map selectedSpotKind)
      const activeSpotKind =
        selectedSpotKind || (spotTypeFilter && spotTypeFilter !== "all" ? spotTypeFilter : null);
      if (activeSpotKind) {
        if (activeSpotKind === "popup") {
          const isPopupPost =
            isPopupVenue(linkedVenue) ||
            post.spot_type === "popup" ||
            postTax.spotKind === "popup";
          if (!isPopupPost) return false;
        } else {
          const venueType = linkedVenue?.spot_type || post.spot_type || postTax.spotKind || "restaurant";
          if (venueType !== activeSpotKind && postTax.spotKind !== activeSpotKind) return false;
        }
      }

      // Price Tier filter ($, $$, $$$)
      if (priceTierFilter) {
        if (post.price_tier && post.price_tier === priceTierFilter) {
          // match
        } else if (linkedVenue?.price_level && linkedVenue.price_level === priceTierFilter) {
          // match
        } else if (typeof post.price_nok === "number" && post.price_nok > 0) {
          const tier = post.price_nok <= 120 ? "$" : post.price_nok <= 250 ? "$$" : "$$$";
          if (tier !== priceTierFilter) return false;
        } else {
          return false;
        }
      }

      // Saved hit-list filter
      if (savedOnly && !savedPostIds.has(post.id) && !savedPostIds.has(post.spot_id)) {
        return false;
      }

      // Staff Picks only
      if (staffPicksOnly && !post.is_official_pick) return false;

      // Dietary inclusion (all selected tags must be present)
      if (selectedDietary.length > 0) {
        const tags = post.dietary_tags ?? linkedVenue?.dietary_tags ?? [];
        if (!selectedDietary.every((tag) => tags.includes(tag))) return false;
      }

      // Neighborhood match
      if (
        mapNeighborhood !== "all" &&
        linkedVenue?.neighborhood !== mapNeighborhood
      ) {
        return false;
      }

      // Open Now (live Oslo time against real opening_hours data)
      if (openNow && getVenueLiveOpenStatus(linkedVenue).isOpen !== true) return false;

      return true;
    });

    if (spotTypeFilter === "popup" || selectedSpotKind === "popup") {
      return [...filtered].sort((a, b) => {
        const venueA = venueById.get(a.spot_id);
        const venueB = venueById.get(b.spot_id);
        return getPopupUrgencyScore(venueA) - getPopupUrgencyScore(venueB);
      });
    }

    return filtered;
  }, [
    foodPosts,
    currentCategory,
    selectedGroup,
    selectedDishCategory,
    selectedCuisine,
    searchQuery,
    selectedDietary,
    mapNeighborhood,
    openNow,
    venueById,
    spotTypeFilter,
    selectedSpotKind,
    priceTierFilter,
    staffPicksOnly,
    savedOnly,
    savedPostIds,
    currentUser,
  ]);

  // Memoized food spots / venues filtering
  const filteredVenues = useMemo(() => {
    return venues
      .filter((venue) => {
        // Exclude expired pop-ups (>7 days after closing)
        if (!isVisibleInFeed(venue)) return false;

        const venueTax = resolveEntityTaxonomy(venue);

        // Spot Type / Map Kind filter
        const activeSpotKind =
          selectedSpotKind || (spotTypeFilter && spotTypeFilter !== "all" ? spotTypeFilter : null);
        if (activeSpotKind) {
          if (activeSpotKind === "popup") {
            if (!isPopupVenue(venue) && venueTax.spotKind !== "popup") return false;
          } else if (venue.spot_type !== activeSpotKind && venueTax.spotKind !== activeSpotKind) {
            return false;
          }
        }

        // Price Tier filter
        if (priceTierFilter && venue.price_level !== priceTierFilter) return false;

        // Saved hit-list filter
        if (savedOnly && !savedPostIds.has(venue.id)) return false;

        // Staff Picks only
        if (staffPicksOnly && !venue.is_official_pick) return false;

        // Taxonomy filtering: Child dish category, Parent group, or legacy Category
        if (selectedDishCategory) {
          if (
            venueTax.dishCategory !== selectedDishCategory &&
            venue.food_category !== selectedDishCategory
          ) {
            return false;
          }
        } else if (selectedGroup) {
          if (venueTax.group.id !== selectedGroup) {
            return false;
          }
        } else if (currentCategory !== "all") {
          if (
            venue.food_category !== currentCategory &&
            venueTax.dishCategory !== currentCategory
          ) {
            return false;
          }
        }

        // Cuisine filter (from expanded filter drawer)
        if (selectedCuisine && !(venueTax.cuisines as string[]).includes(selectedCuisine)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = venue.name.toLowerCase().includes(q);
          const matchAddress = venue.address.toLowerCase().includes(q);
          const matchCity = venue.city.toLowerCase().includes(q);
          const matchDishes = venue.signature_dishes?.some((d) =>
            d.toLowerCase().includes(q)
          );
          if (!matchName && !matchAddress && !matchCity && !matchDishes)
            return false;
        }

        // Dietary inclusion (all selected tags must be present)
        if (selectedDietary.length > 0) {
          const tags = venue.dietary_tags ?? [];
          if (!selectedDietary.every((tag) => tags.includes(tag))) return false;
        }

        // Neighborhood match
        if (
          mapNeighborhood !== "all" &&
          venue.neighborhood !== mapNeighborhood
        ) {
          return false;
        }

        // Open Now (live Oslo time against real opening_hours data)
        if (openNow && getVenueLiveOpenStatus(venue).isOpen !== true) return false;

        return true;
      })
      .sort((a, b) => {
        if (spotTypeFilter === "popup" || selectedSpotKind === "popup") {
          return getPopupUrgencyScore(a) - getPopupUrgencyScore(b);
        }
        return (a.distance_meters || 9999) - (b.distance_meters || 9999);
      });
  }, [
    venues,
    currentCategory,
    selectedGroup,
    selectedDishCategory,
    selectedCuisine,
    searchQuery,
    selectedDietary,
    mapNeighborhood,
    openNow,
    spotTypeFilter,
    selectedSpotKind,
    priceTierFilter,
    staffPicksOnly,
    savedOnly,
    savedPostIds,
  ]);

  // Remounts the grid when the filtered result set changes so cards re-enter with a stagger.
  const postsKey = useMemo(
    () => `p${filteredPosts.length}:${filteredPosts.slice(0, 3).map((p) => p.id).join(",")}`,
    [filteredPosts]
  );
  const venuesKey = useMemo(
    () => `v${filteredVenues.length}:${filteredVenues.slice(0, 3).map((v) => v.id).join(",")}`,
    [filteredVenues]
  );

  const popupVenues = useMemo(() => {
    return venues
      .filter((v) => isPopupVenue(v) && isVisibleInFeed(v))
      .sort((a, b) => getPopupUrgencyScore(a) - getPopupUrgencyScore(b));
  }, [venues]);

  // Memoized collections for the editorial swimlanes
  // STRICT drink match: dish/category/tags only (never the venue name, so a
  // "Yum Cha" dumpling spot can't sneak into the matcha lane).
  const matchaPosts = useMemo(() => {
    // STRICT: a drink category, or a drink word in the dish NAME (word
    // boundaries). Taste tags are ignored entirely, so a "cheesy/juicy" main
    // can never leak into the lane, and "cheesesteak"/"platter" cannot match
    // "tea"/"latte" substrings.
    const DRINK_WORD_RE = /\b(matcha|hojicha|teas?|coffee|latte|espresso|cocoa|chai)\b/;
    const DRINK_CATEGORIES = new Set([
      "matcha",
      "tea",
      "teas",
      "coffee",
      "espresso",
      "latte",
      "cocoa",
      "chai",
      "beverage",
      "beverages",
      "drink",
      "drinks",
      "hot_drinks",
      "cold_drinks",
    ]);
    return filteredPosts.filter((p) => {
      if (p.is_archived || p.is_published === false) return false;
      const category = (p.category || "").toLowerCase();
      const name = (p.dish_name || "").toLowerCase();
      return DRINK_CATEGORIES.has(category) || DRINK_WORD_RE.test(name);
    });
  }, [filteredPosts]);

  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const activeWeeklyPick = weeklyPick?.venue_id ? weeklyPick : initialData.weeklyPick;

  const featuredKitchens = useMemo(() => {
    const eligible = venues.filter((v) => v.spot_type !== "popup" && isVisibleInFeed(v));
    // Rating-weighted daily rotation so A–Z sorting never locks one venue to slot #1.
    return [...eligible]
      .sort((a, b) => {
        const scoreA = (a.google_rating ?? 4.2) * 0.45 + dailyUnitNoise(a.id, "kitchens");
        const scoreB = (b.google_rating ?? 4.2) * 0.45 + dailyUnitNoise(b.id, "kitchens");
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [venues]);

  const isDefaultFeedView = useMemo(() => {
    return (
      feedMode === "food" &&
      (currentCategory === "all" || !currentCategory) &&
      !selectedGroup &&
      !selectedDishCategory &&
      !selectedSpotKind &&
      !selectedCuisine &&
      selectedDietary.length === 0 &&
      (!spotTypeFilter || spotTypeFilter === "all") &&
      !priceTierFilter &&
      !staffPicksOnly &&
      !savedOnly &&
      mapNeighborhood === "all" &&
      !openNow &&
      !searchQuery.trim()
    );
  }, [
    feedMode,
    currentCategory,
    selectedGroup,
    selectedDishCategory,
    selectedSpotKind,
    selectedCuisine,
    selectedDietary,
    spotTypeFilter,
    priceTierFilter,
    staffPicksOnly,
    savedOnly,
    mapNeighborhood,
    openNow,
    searchQuery,
  ]);

  const renderDishesFeedContent = useCallback((isDesktopView: boolean) => {
    if (foodPosts.length === 0 && isHydratingData) {
      return (
        <div className="grid grid-cols-2 gap-3 pb-28">
          <WeeklyPickSkeleton />
          {Array.from({ length: 4 }).map((_, i) => (
            <FoodPostCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      );
    }

    if (filteredPosts.length === 0) {
      return <FeedEmptyState />;
    }

    const gridClass = "grid grid-cols-2 gap-3 pb-28";

    // Filter Override: When any filter pill is active, render filtered results directly without swimlanes
    if (!isDefaultFeedView) {
      return (
        <div className={gridClass}>
          {filteredPosts.map((post, index) => {
            const isPopupCard = venueById.get(post.spot_id)?.spot_type === "popup" || post.spot_type === "popup";
            return (
              <div key={post.id} className={isPopupCard ? "col-span-full" : undefined}>
                <FoodPostCard
                  post={post}
                  index={index}
                  compact
                  showSpotName
                  linkedVenue={venueById.get(post.spot_id) ?? null}
                  priority={isDesktopView && index === 0}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Default mode: editorial magazine rhythm with locked 2-up lanes.
    const isPopupPost = (post: FoodPost) =>
      venueById.get(post.spot_id)?.spot_type === "popup" || post.spot_type === "popup";

    const heroPost =
      filteredPosts[0] && isPopupPost(filteredPosts[0]) ? filteredPosts[0] : null;

    // Resolve Locals' Picks up front so Row 1 / Row 2 don't immediately repeat those spots.
    const resolvedLocalsPicks = resolveLocalsPicks(filteredPosts, venueById);
    const localsPickPostIds = new Set(resolvedLocalsPicks.map((p) => p.post.id));
    const localsPickVenueIds = new Set(
      resolvedLocalsPicks.map((p) => p.post.spot_id).filter(Boolean)
    );

    const isWeeklyPickPost = (post: FoodPost) => {
      if (!activeWeeklyPick) return false;
      if (post.id === activeWeeklyPick.id) return true;
      if (activeWeeklyPick.venue_id && post.spot_id === activeWeeklyPick.venue_id) {
        const a = (post.dish_name || "").trim().toLowerCase();
        const b = (activeWeeklyPick.dish_name || "").trim().toLowerCase();
        if (!b || a === b || a.includes(b) || b.includes(a)) return true;
      }
      return false;
    };

    // Vertical lanes never repeat the same venue and rotate deterministically each Oslo day.
    const verticalVenues = new Set<string>();
    const uniqueNonPopupPosts = filteredPosts.filter((post) => {
      if (isPopupPost(post)) return false;
      if (post.spot_id && verticalVenues.has(post.spot_id)) return false;
      if (post.spot_id) verticalVenues.add(post.spot_id);
      return true;
    });

    const shuffledVertical = spreadAdjacentCategories(
      dailySeededShuffle(uniqueNonPopupPosts, "vertical-dishes")
    );

    // Partition out Weekly Pick and Locals' Picks from the top 2 rows so adjacent lanes feel fresh.
    const deferredFromTop: FoodPost[] = [];
    const primaryPool: FoodPost[] = [];
    for (const post of shuffledVertical) {
      if (
        isWeeklyPickPost(post) ||
        localsPickPostIds.has(post.id) ||
        (post.spot_id && localsPickVenueIds.has(post.spot_id))
      ) {
        deferredFromTop.push(post);
      } else {
        primaryPool.push(post);
      }
    }

    const pool = [...primaryPool];
    const takeEven = (count: number) => {
      const out = pool.splice(0, count);
      if (out.length % 2 === 1) {
        const last = out.pop();
        if (last) pool.unshift(last);
      }
      return out;
    };

    // Row 1 (between Pop-Up Radar & Locals' Picks), Row 2 (between Locals' Picks & Matcha), Row 3 (between Matcha & Kitchens).
    const rowAfterHero = takeEven(4);
    const rowBeforeMatcha = takeEven(4);
    const rowBeforeKitchens = takeEven(4);

    // STRICT drink lane — never padded with dumplings/kebabs, only real drinks.
    const matchaLaneVenues = new Set<string>();
    const matchaLane = matchaPosts
      .filter((post) => {
        if (isPopupPost(post)) return false;
        if (post.spot_id && matchaLaneVenues.has(post.spot_id)) return false;
        if (post.spot_id) matchaLaneVenues.add(post.spot_id);
        return true;
      })
      .slice(0, 8);

    const kitchenLane = featuredKitchens;

    // Remaining editorial cards (re-append deferred non-Weekly-Pick posts at the bottom if desired, excluding duplicate Weekly Pick).
    const remaining = spreadAdjacentCategories([
      ...pool.splice(0),
      ...deferredFromTop.filter((p) => !isWeeklyPickPost(p)),
    ]);

    let cardIndex = 0;
    const renderCard = (post: FoodPost) => {
      const index = cardIndex++;
      return (
        <div key={post.id} className="min-w-0">
          <FoodPostCard
            post={post}
            index={index}
            compact
            linkedVenue={venueById.get(post.spot_id) ?? null}
            priority={isDesktopView && index === 0}
          />
        </div>
      );
    };

    const endCap = (
      <div
        key="feed-endcap"
        className="rounded-[26px] bg-[#F2EDE4] border border-[#E6DFD3] p-4 flex flex-col justify-between aspect-[6/7]"
      >
        <div>
          <p className="font-display font-bold text-[16px] uppercase tracking-tight text-[#181615]">
            That&apos;s a wrap
          </p>
          <p className="text-[11px] text-[#181615]/65 leading-snug mt-1">
            You&apos;ve seen every dish in this lane.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFeedCategory("all");
            resetAllFilters();
          }}
          className="h-9 rounded-xl bg-[#181615] text-white text-[11px] font-bold"
        >
          See all dishes
        </button>
      </div>
    );

    // Every lane is its own 2-column grid: the row can never leave a half-cell.
    const renderRow = (posts: FoodPost[]) => {
      if (posts.length === 0) return null;
      return (
        <div className="col-span-full grid grid-cols-2 gap-3">
          {posts.map((post) => renderCard(post))}
          {posts.length % 2 === 1 && endCap}
        </div>
      );
    };

    const renderSwimlane = (
      title: React.ReactNode,
      _subtitle: string,
      items: React.ReactNode,
      hasItems: boolean
    ) => {
      if (!hasItems) return null;
      return (
        <section className="col-span-full -mx-3 px-3 py-2 my-1">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="text-[19px] font-display font-bold tracking-tight text-[#181615] dark:text-zinc-100 uppercase leading-tight flex items-center gap-1.5 min-w-0">
              {title}
            </h3>
            <span className="text-[#E84A27] font-comico text-[11px] whitespace-nowrap shrink-0">
              Swipe →
            </span>
          </div>
          <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-1 no-scrollbar">
            {items}
          </div>
        </section>
      );
    };

    return (
      <div className={gridClass}>
        {/* 1. Smakr Weekly Pick Split Banner */}
        <div
          className="col-span-full my-0.5 will-change-[transform,opacity]"
          style={{
            transform: "translate3d(0, calc(var(--feed-scroll, 0) * 0.1px), 0) scale(calc(1 - min(var(--feed-scroll, 0), 180) * 0.0001))",
            opacity: "calc(1 - min(var(--feed-scroll, 0), 200) * 0.0012)",
          }}
        >
          <SmakrWeeklyPickSplitBanner />
        </div>

        {/* 2. Horizontal Lane 1 — Oslo Pop-Up Radar (unified flagship pop-up lane) */}
        {(() => {
          const seenPopupVenues = new Set<string>();
          const rawPopupDishes = [
            ...(heroPost ? [heroPost] : []),
            ...filteredPosts.filter((p) => {
              if (heroPost && p.id === heroPost.id) return false;
              const v = venueById.get(p.spot_id);
              return p.spot_type === "popup" || v?.spot_type === "popup" || Boolean(p.is_drop);
            }),
          ]
            .sort((a, b) => getPopupUrgencyScore(venueById.get(a.spot_id)) - getPopupUrgencyScore(venueById.get(b.spot_id)))
            .filter((p) => {
              const key = p.spot_id || p.id;
              if (seenPopupVenues.has(key)) return false;
              seenPopupVenues.add(key);
              return true;
            });

          // Include any visible pop-up venues that don't yet have a dedicated food_post
          const extraPopupVenues = popupVenues.filter((v) => !seenPopupVenues.has(v.id));
          const totalPopupCount = rawPopupDishes.length + extraPopupVenues.length;
          if (totalPopupCount === 0) return null;

          return (
            <section className="col-span-full -mx-3 px-3 py-1.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-[19px] font-display font-bold tracking-tight text-[#181615] dark:text-zinc-100 uppercase leading-tight flex items-center gap-1.5 min-w-0">
                  <SmakrFoodIcon name="popup" className="w-5 h-5 shrink-0" />
                  <span>Oslo Pop-Up Radar</span>
                </h3>
                {totalPopupCount > 1 && (
                  <span className="text-[#E84A27] font-comico text-[11px] whitespace-nowrap shrink-0">
                    Swipe →
                  </span>
                )}
              </div>
              <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2 no-scrollbar">
                {rawPopupDishes.map((post) => {
                  const v = venueById.get(post.spot_id) ?? null;
                  const lifecycle = v ? resolvePopupLifecycle(v) : null;
                  const loc = formatOsloLocation(v?.address || post.spot_address, v?.city);
                  const neighborhood = (
                    loc.neighborhood ||
                    (v?.neighborhood && v.neighborhood !== "all" ? v.neighborhood : post.spot_neighborhood) ||
                    ""
                  )
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  const statusParts: string[] = [];
                  if (lifecycle?.state === "live") {
                    const lbl = lifecycle.shortDateLabel || "Live Now";
                    statusParts.push(/^live/i.test(lbl) ? lbl : `Live Now · ${lbl}`);
                  } else if (lifecycle?.state === "upcoming") {
                    const lbl = lifecycle.shortDateLabel || "Upcoming";
                    statusParts.push(/^upcoming/i.test(lbl) ? lbl : `Upcoming · ${lbl}`);
                  } else if (lifecycle?.state === "passed") {
                    statusParts.push(lifecycle.badgeLabel || "Next drop TBA");
                  } else if (lifecycle?.state === "tba") {
                    statusParts.push("Next drop TBA");
                  } else if (post.drop_badge) {
                    statusParts.push(post.drop_badge.replace(/\s*Drop$/i, "").trim());
                  } else {
                    statusParts.push("Next drop TBA");
                  }
                  if (neighborhood && lifecycle?.state !== "tba" && lifecycle?.state !== "passed") {
                    statusParts.push(neighborhood);
                  }
                  const metaLine = statusParts.join(" · ");

                  return (
                    <div
                      key={`popup-radar-${post.id}`}
                      className="w-[210px] sm:w-[225px] shrink-0 snap-start flex flex-col"
                    >
                      <div className="w-full h-[205px] sm:h-[215px]">
                        <FoodPostCard
                          post={post}
                          index={0}
                          fillHeight
                          cleanPhoto
                          trackSource="popup_radar"
                          linkedVenue={v}
                        />
                      </div>
                      <div className="mt-2 px-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <PopupBrandWordmark venueName={v?.name || post.spot_name} size="sm" />
                          {typeof post.price_nok === "number" && post.price_nok > 0 && (
                            <span className="font-comico font-normal text-[11.5px] text-[#E84A27] shrink-0 whitespace-nowrap">
                              {post.price_nok} kr
                            </span>
                          )}
                        </div>
                        <p className="font-display text-[12.5px] font-bold text-[#181615] dark:text-zinc-100 leading-snug line-clamp-1">
                          {post.dish_name}
                        </p>
                        <p className="text-[11px] font-medium text-[#181615]/65 dark:text-zinc-400 leading-snug line-clamp-1">
                          {metaLine}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {extraPopupVenues.map((venue) => (
                  <div
                    key={`popup-radar-venue-${venue.id}`}
                    className="w-[210px] sm:w-[225px] h-[205px] sm:h-[215px] shrink-0 snap-start overflow-hidden rounded-[22px]"
                  >
                    <PopupEventCard venue={venue} compact />
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* 3. Vertical 2-Col Grid — Row 1 */}
        {renderRow(rowAfterHero)}

        {/* 4a. Compact Bare-Background Oslo Foodies Callout Row */}
        <FoodieCalloutCard />

        {/* 4b. Horizontal Lane 2 — ✦ Locals' Picks */}
        <LocalsPicksSwimlane
          posts={filteredPosts}
          venueById={venueById}
          resolvedPicks={resolvedLocalsPicks}
        />

        {/* 5. Vertical 2-Col Grid — Row 2 */}
        {renderRow(rowBeforeMatcha)}

        {/* 6. Horizontal Lane 3 — Matcha, Coffee & Cocoa */}
        {renderSwimlane(
          "🍵 Matcha, Coffee & Cocoa",
          "Ceremonial Uji whisks, hojicha, cocoa & signature pours worth crossing town for.",
          matchaLane.map((post) => {
            const v = venueById.get(post.spot_id) ?? null;
            const loc = formatOsloLocation(v?.address || post.spot_address, v?.city);
            const neighborhood = (
              loc.neighborhood ||
              (v?.neighborhood && v.neighborhood !== "all" ? v.neighborhood : post.spot_neighborhood) ||
              "Oslo"
            )
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={`swimlane-matcha-${post.id}`}
                className="w-[210px] shrink-0 snap-start flex flex-col"
              >
                <div className="w-full h-[205px]">
                  <FoodPostCard
                    post={post}
                    index={0}
                    compact
                    fillHeight
                    cleanPhoto
                    hideTopTag
                    trackSource="feed"
                    linkedVenue={v}
                  />
                </div>
                <div className="mt-2 px-1 space-y-0.5">
                  <p className="font-display text-[13.5px] font-bold text-[#181615] dark:text-white leading-snug line-clamp-2">
                    {post.dish_name}
                  </p>
                  <p className="text-[11px] font-semibold text-[#181615]/70 dark:text-zinc-300 truncate">
                    <span>{v?.name || post.spot_name}</span>
                    {typeof post.price_nok === "number" && post.price_nok > 0 && (
                      <span className="text-[#E84A27] font-bold"> · {post.price_nok} kr</span>
                    )}
                  </p>
                  <p className="text-[10.5px] font-medium text-[#181615]/55 dark:text-zinc-400 truncate">
                    {neighborhood}
                  </p>
                </div>
              </div>
            );
          }),
          matchaLane.length > 0
        )}

        {/* 7. Vertical 2-Col Grid — Row 3 */}
        {renderRow(rowBeforeKitchens)}

        {/* 8. Become a Foodie Banner (visible mid-scroll before Kitchens) */}
        <BecomeAFoodieBanner />

        {/* 9. Horizontal Lane 4 — The Kitchens Behind the Dishes */}
        {renderSwimlane(
          <span className="inline-flex items-center gap-1.5 font-display font-bold">
            <Utensils className="w-5 h-5 shrink-0" />
            <span className="font-display font-bold">The Kitchens Behind the Dishes</span>
          </span>,
          "",
          kitchenLane.map((venue, idx) => {
            const topPost = topPostByVenueId.get(venue.id);
            return (
              <div
                key={`swimlane-kitchen-${venue.id}`}
                className="w-[210px] shrink-0 snap-start"
              >
                <FoodSpotCard
                  venue={venue}
                  index={idx}
                  editorial
                  primaryDishPhoto={topPost?.photo}
                  topDishName={topPost?.dishName}
                  signaturePrice={topPost?.priceNok}
                />
              </div>
            );
          }),
          kitchenLane.length > 0
        )}

        {/* 10. Vertical 2-Col Grid — Remaining Oslo Dishes */}
        {renderRow(remaining)}
      </div>
    );
  }, [
    filteredPosts,
    isDefaultFeedView,
    isHydratingData,
    foodPosts.length,
    venueById,
    activeWeeklyPick,
    matchaPosts,
    popupVenues,
    featuredKitchens,
    topPostByVenueId,
    resetAllFilters,
    setFeedCategory,
  ]);

  // Memoized feed trees: selecting a map pin re-renders HomeView, but the
  // heavy 33-card editorial feed elements are reused by identity (fast bail).
  const desktopDishesFeed = useMemo(
    () => renderDishesFeedContent(true),
    [renderDishesFeedContent]
  );
  const mobileDishesFeed = useMemo(
    () => renderDishesFeedContent(false),
    [renderDishesFeedContent]
  );

  const activeCategoryDef = FOOD_CATEGORIES.find((c) => c.id === currentCategory) || FOOD_CATEGORIES[0];

  // Render all filtered cards stably without 2-frame unmount/remount flicker on filter click
  const visiblePostsCount = filteredPosts.length;

  // Content scroll container ref & mode scroll tracker
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const desktopFeedScrollRef = useRef<HTMLDivElement>(null);
  const modeScrollRef = useRef<Record<string, number>>({ food: 0, places: 0, popups: 0 });
  const prevModeRef = useRef<string>(feedMode);

  // Independent scroll per mode (prevents Food and Spots from scrolling together)
  const mobileTopVeilRef = useRef<HTMLDivElement>(null);
  const mobileFilterWrapRef = useRef<HTMLDivElement>(null);
  const desktopTopLipRef = useRef<HTMLDivElement>(null);

  const syncScrollVisuals = useCallback((el: HTMLDivElement | null, isMobileEl: boolean) => {
    if (!el) return;
    const y = Math.max(0, el.scrollTop);
    const progress = Math.min(1, y / 60);
    el.style.setProperty("--feed-scroll", String(Math.min(220, y)));

    if (isMobileEl) {
      if (mobileTopVeilRef.current) {
        mobileTopVeilRef.current.style.opacity = String((progress * 0.82).toFixed(3));
      }
      if (mobileFilterWrapRef.current) {
        mobileFilterWrapRef.current.style.transform = `translate3d(0, ${(-progress * 2).toFixed(2)}px, 0)`;
      }
    } else if (desktopTopLipRef.current) {
      desktopTopLipRef.current.style.opacity = String((progress * 0.85).toFixed(3));
    }
  }, []);

  const handleDesktopScroll = useCallback(() => {
    if (desktopFeedScrollRef.current) {
      modeScrollRef.current[feedMode] = desktopFeedScrollRef.current.scrollTop;
      syncScrollVisuals(desktopFeedScrollRef.current, false);
    }
  }, [feedMode, syncScrollVisuals]);

  const handleMobileScroll = useCallback(() => {
    if (feedScrollRef.current) {
      modeScrollRef.current[feedMode] = feedScrollRef.current.scrollTop;
      syncScrollVisuals(feedScrollRef.current, true);
    }
  }, [feedMode, syncScrollVisuals]);

  useEffect(() => {
    if (prevModeRef.current !== feedMode) {
      prevModeRef.current = feedMode;
      const targetScroll = modeScrollRef.current[feedMode] || 0;
      const applyScroll = () => {
        if (desktopFeedScrollRef.current) {
          desktopFeedScrollRef.current.scrollTop = targetScroll;
          syncScrollVisuals(desktopFeedScrollRef.current, false);
        }
        if (feedScrollRef.current) {
          feedScrollRef.current.scrollTop = targetScroll;
          syncScrollVisuals(feedScrollRef.current, true);
        }
      };
      applyScroll();
      const timer = setTimeout(applyScroll, 20);
      return () => clearTimeout(timer);
    }
  }, [feedMode, syncScrollVisuals]);

  return (
    <div className="relative flex-1 w-full h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-zinc-100 lg:flex lg:pt-[57px]">
      {showBoot && (
        <PeepsBootScreen
          colorMode="colorized"
          crowdCount={46}
          onAtlasReady={() => setMapMountReady(true)}
          onComplete={() => {
            hasPlayedBootThisLoad = true;
            setMapMountReady(true);
            setShowBoot(false);
          }}
        />
      )}
      {/* Ask for location when we don't have a fix yet (map-wide) after boot completes. */}
      {!showBoot && <LocationPrompt />}
      {/* ========================================================================= */}
      {/* DESKTOP FEED STREAM (Visible on lg screens)                              */}
      {/* ========================================================================= */}
      {isDesktop && (
      <div
        className={`hidden lg:flex ${
          selectedVenue
            ? "w-[46%] xl:w-[42%] opacity-100 border-r border-zinc-200/80"
            : viewMode === "map"
            ? "w-0 max-w-0 opacity-0 pointer-events-none p-0 border-r-0"
            : viewMode === "feed"
            ? "w-full max-w-5xl mx-auto opacity-100 border-r-0"
            : "w-[46%] xl:w-[42%] opacity-100 border-r border-zinc-200/80"
        } h-full bg-[#F5F0E6] dark:bg-[#181615] flex-col overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,opacity] relative shrink-0`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {selectedVenue ? (
            <motion.div
              key={`desktop-venue-${selectedVenue.id}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col h-full w-full overflow-hidden"
            >
              <VenueDetailPane
                venue={selectedVenue}
                onBack={() => setSelectedVenue(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="desktop-feed-stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col h-full w-full overflow-hidden"
            >
              <div className="sticky top-0 z-20 bg-[#F5F0E6]/95 dark:bg-[#181615]/95 backdrop-blur-md relative">
                {isHydratingData && foodPosts.length === 0 ? (
                  <FeedFilterBarSkeleton />
                ) : (
                  <FeedFilterBar />
                )}
                <div
                  ref={desktopTopLipRef}
                  aria-hidden="true"
                  style={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 -bottom-5 h-5 bg-gradient-to-b from-[#F5F0E6]/75 via-[#F5F0E6]/35 to-transparent dark:from-[#181615]/75 dark:via-[#181615]/35 transition-opacity duration-150"
                />
              </div>
              <div
                ref={desktopFeedScrollRef}
                onScroll={handleDesktopScroll}
                data-feed-scroll
                className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2.5 no-scrollbar pb-36"
              >
                {/* Pop-ups Feed Panel */}
                {feedMode === "popups" && (
                  popupVenues.length === 0 ? (
                    isHydratingData ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-full"><PopupEventCardSkeleton /></div>
                        <div className="col-span-full"><PopupEventCardSkeleton /></div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-xs text-zinc-500 space-y-2 max-w-sm mx-auto">
                        <p className="font-semibold text-sm text-[#181615] dark:text-zinc-200">No active pop-ups right now</p>
                        <p>Check back soon for limited Oslo kitchen residencies and guest drops.</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {popupVenues.map((venue, index) => (
                        <div key={venue.id} className="col-span-full">
                          <PopupEventCard
                            venue={venue}
                            priority={isDesktop && index === 0}
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Dishes Feed Panel (Two-Frame Progressive Mount + 120fps Cascade) */}
                {feedMode === "food" && desktopDishesFeed}

                {/* Spots Feed Panel */}
                {feedMode === "places" && (
                  venues.length === 0 && isHydratingData ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <FoodSpotCardSkeleton key={`spot-skeleton-${i}`} />
                      ))}
                    </div>
                  ) : filteredVenues.length === 0 ? (
                    <div className="py-16 text-center text-xs text-zinc-500">
                      No spots found in this category.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pb-28">
                      {filteredVenues.map((venue, index) => {
                        if (venue.spot_type === "popup") {
                          return (
                            <div key={venue.id} className="col-span-full">
                              <PopupEventCard
                                venue={venue}
                                priority={isDesktop && index === 0}
                              />
                            </div>
                          );
                        }
                        const topPost = topPostByVenueId.get(venue.id);
                        return (
                          <div key={venue.id} className="h-full">
                            <FoodSpotCard
                              venue={venue}
                              index={index}
                              primaryDishPhoto={topPost?.photo}
                              topDishName={topPost?.dishName}
                              signaturePrice={topPost?.priceNok}
                              priority={isDesktop && index === 0}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Floating Slider Toggle at bottom of feed */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <FoodViewSlider
                  dishesCount={filteredPosts.length}
                  spotsCount={filteredVenues.length}
                  popupsCount={popupVenues.length}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE PERSISTENT MAP INSTANCE                                            */}
      {/* Full-bleed background on mobile; right split pane on desktop.            */}
      {/* Deferred until PeepsBootScreen starts dismissing so WebGL doesn't stall boot. */}
      {/* ========================================================================= */}
      <div
        className={`
          absolute inset-0 w-full h-full z-0 isolate
          lg:relative lg:h-full lg:z-0 overflow-hidden
          ${
            selectedVenue
              ? "lg:w-[54%] lg:xl:w-[58%] lg:opacity-100"
              : viewMode === "feed"
              ? "lg:w-0 lg:max-w-0 lg:opacity-0 lg:pointer-events-none"
              : viewMode === "map"
              ? "lg:w-full lg:opacity-100"
              : "lg:w-[54%] lg:xl:w-[58%] lg:opacity-100"
          }
          relative
        `}
      >
        {mapMountReady && <MapRadarView isBooting={showBoot} />}

        {/* Bottom-of-Map Neighborhood Dock + Spot Cards */}
        <div
          className={`absolute left-0 right-0 z-20 pointer-events-auto transition-all duration-[220ms] ${
            viewMode === "map"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          } bottom-[76px] lg:bottom-4`}
        >
          <MapNeighborhoodDock
            isDesktop={isDesktop}
            initialVenues={initialData.venues}
            initialFoodPosts={initialData.foodPosts}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FULL-PAGE FEED VIEW (< lg screens)                                 */}
      {/* ========================================================================= */}
      {!isDesktop && (
        <div
          className={`lg:hidden fixed inset-0 bg-[#FAF7F2]/[0.96] dark:bg-[#181615]/[0.96] z-30 overflow-hidden flex flex-col will-change-transform w-full max-w-[100vw] transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            viewMode === "map"
              ? "-translate-x-full opacity-0 pointer-events-none shadow-none"
              : "translate-x-0 opacity-100 pointer-events-auto shadow-2xl"
          }`}
        >
          {/* Scroll-reactive Warm Oat frosted veil behind header & filter bar so cards
              feather gently instead of peeking sharply between floating pills. */}
          <div
            ref={mobileTopVeilRef}
            aria-hidden="true"
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-[118px] z-[15] bg-gradient-to-b from-[#FAF7F2]/85 via-[#FAF7F2]/55 to-transparent dark:from-[#181615]/85 dark:via-[#181615]/55 backdrop-blur-[4px] [mask-image:linear-gradient(to_bottom,black_48%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_48%,transparent_100%)] transition-opacity duration-150"
          />

          {/* Warm Oat fill behind logo/Sign In gap ONLY while filter dropdown is expanded */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-[110px] z-[16] bg-[#FAF7F2] dark:bg-[#181615] transition-opacity duration-150 ${
              isMobileFilterOpen && !isVenueDetailModalOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Floating filter bar + Dishes/Spots toggle under the SMAKR header. */}
          {viewMode !== "map" && (
            <>
          <div
            ref={mobileFilterWrapRef}
            className={`absolute inset-x-0 top-[64px] z-20 pointer-events-auto w-full max-w-full overflow-hidden transition-opacity duration-150 will-change-transform ${
              isVenueDetailModalOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {isHydratingData && foodPosts.length === 0 ? (
              <FeedFilterBarSkeleton />
            ) : (
              <FeedFilterBar compact onExpandedChange={setIsMobileFilterOpen} />
            )}
          </div>

          {/* Scrollable Feed Dishes or Spots — starts at the top so cards can
              feather softly behind the header/filters; pt clears the overlays. */}
          <div
            ref={feedScrollRef}
            data-feed-scroll
            onScroll={handleMobileScroll}
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0px, transparent 48px, rgba(0,0,0,0.4) 84px, #000 116px)",
              maskImage:
                "linear-gradient(to bottom, transparent 0px, transparent 48px, rgba(0,0,0,0.4) 84px, #000 116px)",
            }}
            className="flex-1 min-h-0 overflow-y-auto px-3 pt-[122px] pb-32 space-y-2.5 no-scrollbar overscroll-contain"
          >
            {/* 1. Mobile Pop-ups Panel */}
            {feedMode === "popups" && (
              popupVenues.length === 0 ? (
                isHydratingData ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-full"><PopupEventCardSkeleton /></div>
                    <div className="col-span-full"><PopupEventCardSkeleton /></div>
                  </div>
                ) : (
                  <div className="py-14 text-center text-xs text-zinc-500 space-y-2 max-w-sm mx-auto">
                    <p className="font-semibold text-sm text-[#181615] dark:text-zinc-200">No active pop-ups right now</p>
                    <p>Check back soon for limited Oslo kitchen residencies and guest drops.</p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {popupVenues.map((venue, index) => (
                    <div key={venue.id} className="col-span-full">
                      <PopupEventCard
                        venue={venue}
                        priority={!isDesktop && index === 0}
                      />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 2. Mobile Dishes Feed Panel (Two-Frame Progressive Mount + 120fps Cascade) */}
            {feedMode === "food" && mobileDishesFeed}

            {/* 3. Mobile Spots Feed Panel */}
            {feedMode === "places" && (
              venues.length === 0 && isHydratingData ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <FoodSpotCardSkeleton key={`m-spot-skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                  <p>No food spots found for this category.</p>
                  <button
                    onClick={() => {
                      setFeedCategory("all");
                      resetAllFilters();
                    }}
                    className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium"
                  >
                    Show all
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredVenues.map((venue, index) => {
                    if (venue.spot_type === "popup") {
                      return (
                        <div key={venue.id} className="col-span-full">
                          <PopupEventCard
                            venue={venue}
                            priority={!isDesktop && index === 0}
                          />
                        </div>
                      );
                    }
                    const topPost = topPostByVenueId.get(venue.id);
                    return (
                      <div key={venue.id} className="h-full">
                        <FoodSpotCard
                          venue={venue}
                          index={index}
                          primaryDishPhoto={topPost?.photo}
                          topDishName={topPost?.dishName}
                          signaturePrice={topPost?.priceNok}
                          priority={!isDesktop && index === 0}
                        />
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING BOTTOM DOCK (Feed | + | Map) — visible in Map & Mobile Feed     */}
      {/* ========================================================================= */}
      {(!isDesktop || viewMode === "map") && (
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[45] pointer-events-auto flex items-center justify-center transition-all duration-[220ms] ease-out ${
          isVenueDetailModalOpen || showBoot
            ? "opacity-0 pointer-events-none translate-y-12 scale-90"
            : "opacity-100 translate-y-0 scale-100"
        }`}
        style={{
          bottom: "max(calc(env(safe-area-inset-bottom, 0px) + 18px), 20px)",
        }}
      >
        <FoodViewSlider
          dishesCount={filteredPosts.length}
          spotsCount={filteredVenues.length}
          popupsCount={popupVenues.length}
        />
      </div>
      )}

      {/* Modals & Floating Spot Cards (auth + log-a-dish mount globally in layout) */}
      <VenueBottomSheet />
      <SmakrFoodieInviteModal />
    </div>
  );
}
