import { create } from "zustand";
import {
  Venue,
  VenueDetail,
  FilterState,
  LiveRadarEvent,
  VibeMetrics,
  LiveCheckin,
  WifiSpeedTest,
  FoodPost,
  FoodCategory,
  ViewMode,
  UserProfile,
  AvatarOption,
  ColorTheme,
  TypographyStyle,
  LogoVariant,
} from "@/types";
import { INITIAL_FOOD_SPOTS, INITIAL_FOOD_POSTS } from "@/lib/foodSeeds";
import { getDistanceInMeters } from "@/lib/math";

const COMBINED_SPOTS: Venue[] = INITIAL_FOOD_SPOTS;

const INITIAL_FILTERS: FilterState = {
  place_type: null,
  food_category: "all",
  has_outlets: null,
  silent_zone: null,
  open_late: null,
  outdoor_seating: null,
  dog_friendly: null,
  min_download_mbps: null,
  vibe_status: null,
  search_query: "",
};

interface PulseStoreState {
  venues: Venue[];
  selectedVenue: VenueDetail | null;
  filters: FilterState;
  userLocation: { lat: number; lon: number } | null;
  mapCenter: [number, number]; // [lng, lat]
  mapZoom: number;
  viewMode: ViewMode;
  foodPosts: FoodPost[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  currentUser: UserProfile | null;
  isAuthModalOpen: boolean;
  mobileSheetState: "peek" | "half" | "full";
  isCheckInModalOpen: boolean;
  isSpeedTestModalOpen: boolean;
  isCreateBiteModalOpen: boolean;
  bottomSheetOpen: boolean;
  wsConnected: boolean;
  lastEvent: LiveRadarEvent | null;
  isLoadingVenues: boolean;
  toastMessage: string | null;
  mapCategory: FoodCategory;
  feedCategory: FoodCategory;
  selectedAvatar: AvatarOption;

  // Theme & Style Studio
  activeTheme: ColorTheme;
  activeFont: TypographyStyle;
  activeLogoVariant: LogoVariant;
  isThemeStudioOpen: boolean;

  // Actions
  setActiveTheme: (theme: ColorTheme) => void;
  setActiveFont: (font: TypographyStyle) => void;
  setActiveLogoVariant: (variant: LogoVariant) => void;
  setIsThemeStudioOpen: (open: boolean) => void;
  setSelectedAvatar: (avatar: AvatarOption) => void;
  showToast: (message: string, durationMs?: number) => void;
  clearToast: () => void;
  setVenues: (venues: Venue[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setFoodCategory: (category: FoodCategory) => void;
  setMapCategory: (category: FoodCategory) => void;
  setFeedCategory: (category: FoodCategory) => void;
  setMobileSheetState: (state: "peek" | "half" | "full") => void;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (user?: UserProfile) => void;
  logout: () => void;
  updateVenueVibe: (
    venueId: string,
    vibe: VibeMetrics,
    newCheckin?: LiveCheckin,
    speedTest?: WifiSpeedTest
  ) => void;
  setSelectedVenue: (venue: VenueDetail | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setUserLocation: (loc: { lat: number; lon: number } | null) => void;
  setMapCenter: (coords: [number, number], zoom?: number) => void;
  flyToSpot: (coords: [number, number], spotId?: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addFoodPost: (post: FoodPost) => void;
  openCheckInModal: (venue?: Venue | VenueDetail) => void;
  closeCheckInModal: () => void;
  openSpeedTestModal: (venue?: Venue | VenueDetail) => void;
  closeSpeedTestModal: () => void;
  setIsCreateBiteModalOpen: (open: boolean) => void;
  setBottomSheetOpen: (open: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setLastEvent: (event: LiveRadarEvent) => void;
  setIsLoadingVenues: (loading: boolean) => void;
}

export const useCityPulseStore = create<PulseStoreState>((set, get) => ({
  venues: COMBINED_SPOTS,
  selectedVenue: null,
  filters: INITIAL_FILTERS,
  userLocation: { lat: 59.9171, lon: 10.7516 }, // Oslo Sentrum (Torggata / Youngstorget)
  mapCenter: [10.7516, 59.9171], // Oslo Sentrum (Torggata / Youngstorget)
  mapZoom: 13.8,
  viewMode: "split",
  foodPosts: INITIAL_FOOD_POSTS,
  likedPostIds: new Set<string>(["post-001-ca-phe-coconut"]),
  savedPostIds: new Set<string>(["post-003-farine-cardamom", "post-006-zz-pizza-nduja"]),
  currentUser: null,
  isAuthModalOpen: false,
  mobileSheetState: "half",
  isCheckInModalOpen: false,
  isSpeedTestModalOpen: false,
  isCreateBiteModalOpen: false,
  bottomSheetOpen: false,
  wsConnected: false,
  lastEvent: null,
  isLoadingVenues: false,
  toastMessage: null,
  mapCategory: "all",
  feedCategory: "all",
  selectedAvatar: "lordicon_barista",

  // Theme & Style Studio Initial State
  activeTheme: "oslo-minimalist",
  activeFont: "modern-sans",
  activeLogoVariant: "fluid",
  isThemeStudioOpen: false,

  setActiveTheme: (activeTheme: ColorTheme) => {
    set({ activeTheme });
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
      try {
        localStorage.setItem("smakr_theme", activeTheme);
      } catch {}
    }
  },

  setActiveFont: (activeFont: TypographyStyle) => {
    set({ activeFont });
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-font", activeFont);
      try {
        localStorage.setItem("smakr_font", activeFont);
      } catch {}
    }
  },

  setActiveLogoVariant: (activeLogoVariant: LogoVariant) => {
    set({ activeLogoVariant });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("smakr_logo", activeLogoVariant);
      } catch {}
    }
  },

  setIsThemeStudioOpen: (isThemeStudioOpen: boolean) => set({ isThemeStudioOpen }),

  setSelectedAvatar: (selectedAvatar: AvatarOption) => set({ selectedAvatar }),

  showToast: (message: string, durationMs = 4500) => {
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: null });
      }
    }, durationMs);
  },

  clearToast: () => set({ toastMessage: null }),

  setVenues: (venues) => set({ venues }),

  setViewMode: (viewMode) => set({ viewMode }),

  setMapCategory: (mapCategory) => set({ mapCategory }),

  setFeedCategory: (feedCategory) =>
    set((state) => ({
      feedCategory,
      filters: { ...state.filters, food_category: feedCategory },
    })),

  setFoodCategory: (foodCategory) =>
    set((state) => ({
      feedCategory: foodCategory,
      filters: { ...state.filters, food_category: foodCategory },
    })),

  toggleLikePost: (postId) => {
    set((state) => {
      const newLiked = new Set(state.likedPostIds);
      const isAlreadyLiked = newLiked.has(postId);
      if (isAlreadyLiked) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }

      const updatedPosts = state.foodPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: isAlreadyLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      });

      return {
        likedPostIds: newLiked,
        foodPosts: updatedPosts,
      };
    });
  },

  toggleSavePost: (postId) => {
    set((state) => {
      const newSaved = new Set(state.savedPostIds);
      const isAlreadySaved = newSaved.has(postId);
      if (isAlreadySaved) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }

      const updatedPosts = state.foodPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            saves_count: isAlreadySaved ? post.saves_count - 1 : post.saves_count + 1,
          };
        }
        return post;
      });

      return {
        savedPostIds: newSaved,
        foodPosts: updatedPosts,
      };
    });
  },

  addFoodPost: (post) => {
    set((state) => ({
      foodPosts: [post, ...state.foodPosts],
      isCreateBiteModalOpen: false,
    }));
  },

  setMobileSheetState: (mobileSheetState) =>
    set({
      mobileSheetState,
      ...(mobileSheetState !== "peek" ? { bottomSheetOpen: false, selectedVenue: null } : {}),
    }),

  setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

  login: (user) =>
    set({
      currentUser: user || {
        id: "user-1",
        name: "Astrid Lindholm",
        handle: "@astrid_eats_oslo",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        badge: "Verified Foodie",
      },
      isAuthModalOpen: false,
    }),

  logout: () => set({ currentUser: null }),

  flyToSpot: (coords, spotId) => {
    const { venues, viewMode } = get();
    set({
      mapCenter: [coords[0], coords[1]],
      mapZoom: 15.5,
      mobileSheetState: "peek", // Smoothly slide down feed so map & card show!
      bottomSheetOpen: true,
      viewMode: viewMode === "feed" ? "split" : viewMode,
    });

    if (spotId) {
      const spot = venues.find((v) => v.id === spotId);
      if (spot) {
        set({
          selectedVenue: spot as VenueDetail,
          bottomSheetOpen: true,
        });
      }
    }
  },

  updateVenueVibe: (venueId, vibe, newCheckin, speedTest) => {
    set((state) => {
      const updatedVenues = state.venues.map((v) => {
        if (v.id === venueId) {
          return { ...v, vibe };
        }
        return v;
      });

      let updatedSelected = state.selectedVenue;
      if (updatedSelected && updatedSelected.id === venueId) {
        const checkins = newCheckin
          ? [newCheckin, ...updatedSelected.recent_checkins.filter((c) => c.id !== newCheckin.id)]
          : updatedSelected.recent_checkins;

        const speedTests = speedTest
          ? [speedTest, ...updatedSelected.recent_speed_tests.filter((s) => s.id !== speedTest.id)]
          : updatedSelected.recent_speed_tests;

        updatedSelected = {
          ...updatedSelected,
          vibe,
          recent_checkins: checkins,
          recent_speed_tests: speedTests,
        };
      }

      return {
        venues: updatedVenues,
        selectedVenue: updatedSelected,
      };
    });
  },

  setSelectedVenue: (venue) =>
    set({
      selectedVenue: venue,
      bottomSheetOpen: venue !== null,
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: INITIAL_FILTERS }),

  setUserLocation: (loc) =>
    set((state) => {
      if (!loc) return { userLocation: null };
      const updatedVenues = state.venues.map((venue) => ({
        ...venue,
        distance_meters: getDistanceInMeters(loc.lat, loc.lon, venue.latitude, venue.longitude),
      }));
      let updatedSelected = state.selectedVenue;
      if (updatedSelected) {
        updatedSelected = {
          ...updatedSelected,
          distance_meters: getDistanceInMeters(
            loc.lat,
            loc.lon,
            updatedSelected.latitude,
            updatedSelected.longitude
          ),
        };
      }
      return {
        userLocation: loc,
        venues: updatedVenues,
        selectedVenue: updatedSelected,
      };
    }),

  setMapCenter: (coords, zoom) =>
    set((state) => ({
      mapCenter: coords,
      mapZoom: zoom ?? state.mapZoom,
    })),

  openCheckInModal: (venue) => {
    if (venue && !get().selectedVenue) {
      set({ selectedVenue: venue as VenueDetail });
    }
    set({ isCheckInModalOpen: true });
  },

  closeCheckInModal: () => set({ isCheckInModalOpen: false }),

  openSpeedTestModal: (venue) => {
    if (venue && !get().selectedVenue) {
      set({ selectedVenue: venue as VenueDetail });
    }
    set({ isSpeedTestModalOpen: true });
  },

  closeSpeedTestModal: () => set({ isSpeedTestModalOpen: false }),

  setIsCreateBiteModalOpen: (open) => set({ isCreateBiteModalOpen: open }),

  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  setLastEvent: (event) => set({ lastEvent: event }),

  setIsLoadingVenues: (loading) => set({ isLoadingVenues: loading }),
}));
