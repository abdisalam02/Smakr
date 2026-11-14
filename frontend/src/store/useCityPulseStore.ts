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
  DietaryTag,
  Neighborhood,
  MascotConfig,
  DEFAULT_MASCOT_CONFIG,
  MASCOT_STORAGE_KEY,
  WeeklyPick,
  DEFAULT_WEEKLY_PICK,
  WEEKLY_PICK_STORAGE_KEY,
  SpotType,
} from "@/types";
import { getDistanceInMeters } from "@/lib/math";
import { persistMascotConfig } from "@/lib/supabase/data";
import {
  type PendingSubmission,
  loadPendingSubmissions,
  savePendingSubmissions,
} from "@/lib/pendingQueue";

/* Debounced, best-effort sync of the mascot config to the signed-in profile. */
let mascotPersistTimer: ReturnType<typeof setTimeout> | null = null;
export function cancelMascotPersist() {
  if (mascotPersistTimer) {
    clearTimeout(mascotPersistTimer);
    mascotPersistTimer = null;
  }
}
function scheduleMascotPersist(userId: string, config: MascotConfig) {
  if (typeof window === "undefined") return;
  if (mascotPersistTimer) clearTimeout(mascotPersistTimer);
  mascotPersistTimer = setTimeout(() => {
    void persistMascotConfig(userId, config);
  }, 1200);
}

function getInitialSavedSpots(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem("smakr_saved_spots");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set<string>();
}

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
  dietary: [],
  neighborhood: "all",
  open_now: null,
  spot_type: "all",
  price_tier: null,
  staff_picks_only: false,
  saved_only: false,
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
  isFoodieInviteOpen: boolean;
  pendingSubmissions: PendingSubmission[];
  mobileSheetState: "peek" | "half" | "full";
  isCheckInModalOpen: boolean;
  isSpeedTestModalOpen: boolean;
  isCreateBiteModalOpen: boolean;
  bottomSheetOpen: boolean;
  isVenueDetailModalOpen: boolean;
  setIsVenueDetailModalOpen: (open: boolean) => void;
  wsConnected: boolean;
  lastEvent: LiveRadarEvent | null;
  isLoadingVenues: boolean;
  /** True until the first venues/posts/weekly-drop sync resolves. */
  isHydratingData: boolean;
  /** True once the Supabase auth session has been resolved (or confirmed absent). */
  isAuthResolved: boolean;
  /**
   * True once `public.profiles` has actually been read for the signed-in user
   * (not merely seeded from the JWT metadata). Onboarding must wait for this so
   * returning users don't get a flash of the avatar-setup card before their
   * stored `onboarding_completed` arrives.
   */
  profileResolved: boolean;
  /** True once the server-prefetched payload has been applied to the store. */
  serverDataApplied: boolean;
  toastMessage: string | null;
  mapCategory: FoodCategory;
  feedCategory: FoodCategory;
  feedMode: "food" | "places" | "popups";
  feedLayout: "list" | "grid";
  selectedAvatar: AvatarOption;
  mapNeighborhood: Neighborhood;
  selectedDietary: DietaryTag[];
  selectedGroup: string | null;
  selectedDishCategory: string | null;
  selectedSpotKind: string | null;
  selectedCuisine: string | null;
  mascotConfig: MascotConfig;
  weeklyPick: WeeklyPick;

  // Theme & Style Studio
  activeTheme: ColorTheme;
  activeFont: TypographyStyle;
  activeLogoVariant: LogoVariant;
  isThemeStudioOpen: boolean;
  /** True when the avatar builder is opened in edit mode from the profile menu. */
  isAvatarStudioOpen: boolean;
  /** True when the in-app beta feedback drawer is open. */
  isBetaFeedbackOpen: boolean;

  // Actions
  setActiveTheme: (theme: ColorTheme) => void;
  setActiveFont: (font: TypographyStyle) => void;
  setActiveLogoVariant: (variant: LogoVariant) => void;
  setIsThemeStudioOpen: (open: boolean) => void;
  openAvatarStudio: () => void;
  setIsAvatarStudioOpen: (open: boolean) => void;
  openBetaFeedback: () => void;
  setIsBetaFeedbackOpen: (open: boolean) => void;
  setSelectedAvatar: (avatar: AvatarOption) => void;
  showToast: (message: string, durationMsOrType?: number | string) => void;
  clearToast: () => void;
  setVenues: (venues: Venue[]) => void;
  setFoodPosts: (posts: FoodPost[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setFoodCategory: (category: FoodCategory) => void;
  setMapCategory: (category: FoodCategory) => void;
  setFeedCategory: (category: FoodCategory) => void;
  setMapNeighborhood: (neighborhood: Neighborhood) => void;
  toggleDietary: (tag: DietaryTag) => void;
  setSelectedGroup: (group: string | null) => void;
  setSelectedDishCategory: (category: string | null) => void;
  setSelectedSpotKind: (kind: string | null) => void;
  setSelectedCuisine: (cuisine: string | null) => void;
  resetAllFilters: () => void;
  updateMascotConfig: (updates: Partial<MascotConfig>) => void;
  resetMascotConfig: () => void;
  /** Hydrate the mascot from the server profile without scheduling a write-back. */
  hydrateMascotConfig: (config: MascotConfig) => void;
  setFeedMode: (mode: "food" | "places" | "popups") => void;
  setFeedLayout: (layout: "list" | "grid") => void;
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
  /** Auth- + onboarding-aware entry point for the "+ Log a Dish" flow. */
  openCreateDish: () => void;
  setBottomSheetOpen: (open: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setLastEvent: (event: LiveRadarEvent) => void;
  setIsLoadingVenues: (loading: boolean) => void;
  setIsHydratingData: (loading: boolean) => void;
  setIsAuthResolved: (resolved: boolean) => void;
  setProfileResolved: (resolved: boolean) => void;
  isLocating: boolean;
  setIsLocating: (isLocating: boolean) => void;
  markServerDataApplied: () => void;

  // Weekly Dispatch (Mascot Pick of the Week)
  setWeeklyPick: (pick: WeeklyPick) => void;

  // Auth / admin
  setCurrentUser: (user: UserProfile | null) => void;
  selectVenueById: (venueId: string) => void;

  // Admin moderation & venue management
  deletePost: (postId: string) => void;
  updatePost: (postId: string, updates: Partial<FoodPost>) => void;
  toggleOfficialPick: (postId: string) => void;
  addVenue: (venue: Venue) => void;
  updateVenue: (venueId: string, updates: Partial<Venue>) => void;
  deleteVenue: (venueId: string) => void;

  // In-Feed Admin Quick-Edit
  quickEditPost: FoodPost | null;
  setQuickEditPost: (post: FoodPost | null) => void;

  // Enriched Filters
  setSpotTypeFilter: (spotType: SpotType | 'all') => void;
  setPriceTierFilter: (tier: string | null) => void;
  toggleStaffPicksOnly: () => void;
  toggleSavedOnly: () => void;

  // Foodie Invite & Pending Moderation Queue (Foodies + Makr Studio)
  setIsFoodieInviteOpen: (open: boolean) => void;
  setPendingSubmissions: (items: PendingSubmission[]) => void;
  addPendingSubmission: (item: PendingSubmission) => void;
  resolvePendingSubmission: (
    id: string,
    action: "approve" | "reject",
    iconKeyOverride?: string
  ) => void;
}

export const useCityPulseStore = create<PulseStoreState>((set, get) => ({
  // Venues are DB-driven — start empty and hydrate via fetchVenues().
  venues: [],
  selectedVenue: null,
  filters: INITIAL_FILTERS,
  // No phantom location on load — the "You're here" puck only appears once the
  // user shares their location (avoids overlapping the Weekly Pick marker).
  userLocation: null,
  mapCenter: [10.7516, 59.9171], // Oslo Sentrum (Torggata / Youngstorget)
  mapZoom: 13.8,
  viewMode: "map",
  // The feed is DB-driven — start empty and hydrate via fetchFoodPosts().
  foodPosts: [],
  likedPostIds: new Set<string>(),
  savedPostIds: getInitialSavedSpots(),
  currentUser: null,
  isAuthModalOpen: false,
  isFoodieInviteOpen: false,
  pendingSubmissions: loadPendingSubmissions(),
  quickEditPost: null,
  mobileSheetState: "peek",
  isCheckInModalOpen: false,
  isSpeedTestModalOpen: false,
  isCreateBiteModalOpen: false,
  bottomSheetOpen: false,
  isVenueDetailModalOpen: false,
  wsConnected: false,
  lastEvent: null,
  isLoadingVenues: false,
  isHydratingData: true,
  isAuthResolved: false,
  profileResolved: false,
  serverDataApplied: false,
  isLocating: false,
  toastMessage: null,
  mapCategory: "all",
  feedCategory: "all",
  feedMode: "food",
  feedLayout: "grid",
  selectedAvatar: "lordicon_barista",
  mapNeighborhood: "all",
  selectedDietary: [],
  selectedGroup: null,
  selectedDishCategory: null,
  selectedSpotKind: null,
  selectedCuisine: null,
  mascotConfig: DEFAULT_MASCOT_CONFIG,
  weeklyPick: DEFAULT_WEEKLY_PICK,

  // Theme & Style Studio Initial State
  activeTheme: "oat-espresso",
  activeFont: "modern-sans",
  activeLogoVariant: "fluid",
  isThemeStudioOpen: false,
  isAvatarStudioOpen: false,
  isBetaFeedbackOpen: false,

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

  openAvatarStudio: () => set({ isAvatarStudioOpen: true, isAuthModalOpen: false }),

  setIsAvatarStudioOpen: (isAvatarStudioOpen: boolean) => set({ isAvatarStudioOpen }),

  openBetaFeedback: () => set({ isBetaFeedbackOpen: true, isAuthModalOpen: false }),

  setIsBetaFeedbackOpen: (isBetaFeedbackOpen: boolean) => set({ isBetaFeedbackOpen }),
  setIsVenueDetailModalOpen: (isVenueDetailModalOpen: boolean) => set({ isVenueDetailModalOpen }),

  setSelectedAvatar: (selectedAvatar: AvatarOption) => set({ selectedAvatar }),

  showToast: (message: string, durationMsOrType: number | string = 4500) => {
    const duration = typeof durationMsOrType === "number" ? durationMsOrType : 4500;
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: null });
      }
    }, duration);
  },

  clearToast: () => set({ toastMessage: null }),

  setVenues: (venues) => set({ venues }),

  setFoodPosts: (foodPosts) => set({ foodPosts }),

  setViewMode: (viewMode) => set({ viewMode }),

  setMapCategory: (mapCategory) => set({ mapCategory }),

  setFeedCategory: (feedCategory) =>
    set((state) => ({
      feedCategory,
      filters: { ...state.filters, food_category: feedCategory },
    })),

  setMapNeighborhood: (mapNeighborhood) =>
    set((state) => ({
      mapNeighborhood,
      filters: { ...state.filters, neighborhood: mapNeighborhood },
    })),

  toggleDietary: (tag) =>
    set((state) => {
      const selectedDietary = state.selectedDietary.includes(tag)
        ? state.selectedDietary.filter((t) => t !== tag)
        : [...state.selectedDietary, tag];
      return {
        selectedDietary,
        filters: { ...state.filters, dietary: selectedDietary },
      };
    }),

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  setSelectedDishCategory: (selectedDishCategory) => set({ selectedDishCategory }),

  setSelectedSpotKind: (selectedSpotKind) => set({ selectedSpotKind }),

  setSelectedCuisine: (selectedCuisine) => set({ selectedCuisine }),

  resetAllFilters: () =>
    set({
      filters: INITIAL_FILTERS,
      feedCategory: "all",
      mapCategory: "all",
      selectedDietary: [],
      selectedGroup: null,
      selectedDishCategory: null,
      selectedSpotKind: null,
      selectedCuisine: null,
    }),

  updateMascotConfig: (updates) =>
    set((state) => {
      const mascotConfig: MascotConfig = { ...state.mascotConfig, ...updates };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(MASCOT_STORAGE_KEY, JSON.stringify(mascotConfig));
        } catch {}
      }
      if (state.currentUser) scheduleMascotPersist(state.currentUser.id, mascotConfig);
      return { mascotConfig };
    }),

  hydrateMascotConfig: (config) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MASCOT_STORAGE_KEY, JSON.stringify(config));
      } catch {}
    }
    set({ mascotConfig: config });
  },

  resetMascotConfig: () => {
    set({ mascotConfig: DEFAULT_MASCOT_CONFIG });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(MASCOT_STORAGE_KEY);
      } catch {}
    }
    const userId = get().currentUser?.id;
    if (userId) scheduleMascotPersist(userId, DEFAULT_MASCOT_CONFIG);
  },

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

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("smakr_saved_spots", JSON.stringify(Array.from(newSaved)));
        } catch {}
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

  setFeedMode: (feedMode) => set({ feedMode }),
  setFeedLayout: (feedLayout) => set({ feedLayout }),

  setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

  login: (user) =>
    set({
      currentUser: user || {
        id: "user-1",
        name: "Astrid Lindholm",
        handle: "@astrid_eats_oslo",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        role: "foodie",
        is_official: false,
      },
      isAuthModalOpen: false,
    }),

  setCurrentUser: (user) => set({ currentUser: user, isAuthModalOpen: false }),

  logout: () => {
    cancelMascotPersist();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("smakr_app_cache_v1");
        localStorage.removeItem("smakr_app_cache_v2");
      } catch {}
    }
    set({
      currentUser: null,
      mascotConfig: DEFAULT_MASCOT_CONFIG,
      isAuthResolved: true,
      profileResolved: true,
    });
  },

  setWeeklyPick: (pick) => {
    set({ weeklyPick: pick });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(WEEKLY_PICK_STORAGE_KEY, JSON.stringify(pick));
      } catch {}
    }
  },

  selectVenueById: (venueId) => {
    const venue = get().venues.find((v) => v.id === venueId);
    if (!venue) {
      get().showToast("That spot is no longer on the radar.");
      return;
    }
    set({
      selectedVenue: {
        ...venue,
        recent_checkins: [],
        recent_speed_tests: [],
      },
      isVenueDetailModalOpen: true,
      bottomSheetOpen: true,
    });
  },

  deletePost: (postId) => {
    set((state) => ({
      foodPosts: state.foodPosts.filter((post) => post.id !== postId),
    }));
  },

  updatePost: (postId, updates) => {
    set((state) => ({
      foodPosts: state.foodPosts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post
      ),
    }));
  },

  toggleOfficialPick: (postId) => {
    set((state) => ({
      foodPosts: state.foodPosts.map((post) =>
        post.id === postId
          ? { ...post, is_official_pick: !post.is_official_pick }
          : post
      ),
    }));
  },

  addVenue: (venue) => {
    set((state) => ({ venues: [venue, ...state.venues] }));
  },

  updateVenue: (venueId, updates) => {
    set((state) => {
      const venues = state.venues.map((v) =>
        v.id === venueId ? { ...v, ...updates } : v
      );
      let selectedVenue = state.selectedVenue;
      if (selectedVenue && selectedVenue.id === venueId) {
        selectedVenue = { ...selectedVenue, ...updates };
      }
      return { venues, selectedVenue };
    });
  },

  deleteVenue: (venueId) => {
    set((state) => ({
      venues: state.venues.filter((v) => v.id !== venueId),
      selectedVenue:
        state.selectedVenue && state.selectedVenue.id === venueId
          ? null
          : state.selectedVenue,
    }));
  },

  flyToSpot: (coords, spotId) => {
    const { venues, foodPosts, viewMode } = get();
    let spot = spotId ? venues.find((v) => v.id === spotId) : null;
    if (!spot && spotId) {
      const post = foodPosts.find((p) => p.spot_id === spotId);
      if (post) {
        spot = {
          id: post.spot_id,
          name: post.spot_name,
          address: post.spot_address || "Oslo, Norway",
          neighborhood: (post.spot_neighborhood?.toLowerCase() as any) || "sentrum",
          latitude: post.spot_coords[1] || coords[1],
          longitude: post.spot_coords[0] || coords[0],
          city: "Oslo",
          place_type: "cafe",
          food_category: post.category,
          cover_image_url: post.image_url,
          vibe: {
            seat_score: 8,
            seat_label: "Available",
            noise_score: 4,
            noise_label: "Lively",
            outlets_percentage: 50,
          } as any,
          has_wifi: true,
          has_outlets: true,
          silent_zone: false,
          outdoor_seating: false,
          dog_friendly: false,
          open_late: false,
          baseline_seats: 10,
          baseline_noise: 5,
          baseline_outlets: true,
        };
      }
    }
    console.info("[locate] store.flyToSpot", { coords, spotId, found: Boolean(spot) });
    set({
      mapCenter: [coords[0], coords[1]],
      mapZoom: 16,
      mobileSheetState: "peek",
      isVenueDetailModalOpen: false,
      selectedVenue: spot ? (spot as VenueDetail) : null,
      bottomSheetOpen: true,
      viewMode: viewMode === "feed" ? "split" : viewMode,
    });
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
      ...(venue === null ? { isVenueDetailModalOpen: false } : {}),
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({
      filters: INITIAL_FILTERS,
      selectedGroup: null,
      selectedDishCategory: null,
      selectedSpotKind: null,
      selectedCuisine: null,
    }),

  setQuickEditPost: (post) => set({ quickEditPost: post }),

  setSpotTypeFilter: (spot_type) =>
    set((state) => ({
      filters: { ...state.filters, spot_type },
    })),

  setPriceTierFilter: (price_tier) =>
    set((state) => ({
      filters: { ...state.filters, price_tier },
    })),

  toggleStaffPicksOnly: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        staff_picks_only: !state.filters.staff_picks_only,
      },
    })),

  toggleSavedOnly: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        saved_only: !state.filters.saved_only,
      },
    })),

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

  setMapCenter: (coords, zoom) => {
    console.info("[locate] store.setMapCenter", { coords, zoom });
    return set((state) => ({
      mapCenter: coords,
      mapZoom: zoom ?? state.mapZoom,
    }));
  },

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

  setIsFoodieInviteOpen: (open) => set({ isFoodieInviteOpen: open }),

  setPendingSubmissions: (items) => {
    savePendingSubmissions(items);
    set({ pendingSubmissions: items });
  },

  addPendingSubmission: (item) =>
    set((state) => {
      const next = [item, ...state.pendingSubmissions.filter((x) => x.id !== item.id)];
      savePendingSubmissions(next);
      return { pendingSubmissions: next };
    }),

  resolvePendingSubmission: (id, action, iconKeyOverride) =>
    set((state) => {
      const target = state.pendingSubmissions.find((x) => x.id === id);
      const nextQueue = state.pendingSubmissions.map((item) =>
        item.id === id
          ? {
              ...item,
              status: action === "approve" ? ("approved" as const) : ("rejected" as const),
              icon_key: iconKeyOverride || item.icon_key,
            }
          : item
      );
      savePendingSubmissions(nextQueue);

      if (action !== "approve" || !target) {
        return { pendingSubmissions: nextQueue };
      }

      let nextFoodPosts = state.foodPosts;
      let nextVenues = state.venues;

      if (target.kind === "foodie_dish") {
        const matchedVenue = state.venues.find((v) => v.id === target.venue_id);
        const approvedPost: FoodPost = {
          id: `approved-${target.id}`,
          spot_id: target.venue_id || matchedVenue?.id || `spot-${target.id}`,
          spot_name: target.venue_name,
          spot_address: target.address || matchedVenue?.address || "Oslo",
          spot_neighborhood: String(target.neighborhood || matchedVenue?.neighborhood || "Oslo"),
          spot_coords: [
            target.longitude ?? matchedVenue?.longitude ?? 10.7522,
            target.latitude ?? matchedVenue?.latitude ?? 59.9139,
          ],
          dish_name: target.dish_name || "Local Foodie Pick",
          category: target.category || "street_food",
          image_url: target.photo_url || matchedVenue?.cover_image_url || "",
          price_nok: target.price_nok ?? null,
          rating: 4.8,
          taste_tags: target.vibe_note ? [target.vibe_note] : ["Locals' Pick"],
          review_text: target.review_text || "Approved from Oslo Locals' Picks.",
          author: {
            name: target.author_name || "Oslo Foodie",
            handle: target.author_handle || "oslo_foodie",
            avatar_url: target.author_avatar_url || "",
            badge: "Local Guide",
          },
          likes_count: 1,
          saves_count: 0,
          created_at_relative: "Just now",
          is_official_pick: false,
          is_local_pick: true,
          moderation_status: "approved",
          dietary_tags: target.dietary_tags || [],
          spot_type: matchedVenue?.spot_type || "restaurant",
        };
        nextFoodPosts = [approvedPost, ...state.foodPosts];
      } else if (target.kind === "makr_popup") {
        const newVenueId = `popup-${target.id}`;
        const igUrl = target.instagram_handle
          ? `https://instagram.com/${target.instagram_handle.replace(/^@/, "")}`
          : undefined;
        const popupVenue: Venue = {
          id: newVenueId,
          name: target.venue_name,
          address: target.is_location_tba ? "Oslo" : target.address || String(target.neighborhood || "Oslo"),
          city: "Oslo",
          neighborhood: (target.neighborhood as Venue["neighborhood"]) || "sentrum",
          place_type: "cafe",
          food_category: target.category || "street_food",
          icon: target.icon_key || target.category || "popup",
          latitude: target.latitude ?? 59.9139,
          longitude: target.longitude ?? 10.7522,
          has_wifi: false,
          has_outlets: false,
          silent_zone: false,
          outdoor_seating: false,
          dog_friendly: false,
          open_late: false,
          baseline_seats: 20,
          baseline_noise: 50,
          baseline_outlets: false,
          vibe: {
            seat_score: 75,
            seat_label: "Seats available",
            noise_score: 60,
            noise_label: "Lively",
            outlets_percentage: 0,
            outlets_label: "No outlets",
            overall_status: "moderate",
            overall_score: 80,
            active_checkins_count: 1,
            last_checkin_at: new Date().toISOString(),
            is_live: true,
            decay_factor: 1,
            avg_download_mbps: null,
            avg_ping_ms: null,
          },
          open_now: !target.is_location_tba,
          cover_image_url: target.photo_url,
          google_rating: 4.8,
          spot_type: "popup",
          current_opening_hours_text: target.drop_dates || target.drop_hours || "Next Drop TBA",
          popup_meta: {
            residency_status: target.is_location_tba ? "between_residencies" : "active",
            dates_label: target.drop_dates || "Next Drop TBA",
            daily_hours: target.drop_hours,
            instagram_url: igUrl,
          },
          signature_dishes: target.dish_name ? [target.dish_name] : [],
          dietary_tags: target.dietary_tags || [],
        };
        nextVenues = [popupVenue, ...state.venues];

        if (target.dish_name && target.photo_url) {
          nextFoodPosts = [
            {
              id: `popup-dish-${target.id}`,
              spot_id: newVenueId,
              spot_name: target.venue_name,
              spot_address: popupVenue.address,
              spot_neighborhood: String(popupVenue.neighborhood || "Oslo"),
              spot_coords: [popupVenue.longitude, popupVenue.latitude],
              dish_name: target.dish_name,
              category: target.category || "street_food",
              image_url: target.photo_url,
              price_nok: target.price_nok ?? null,
              rating: 4.9,
              taste_tags: ["Pop-Up Drop"],
              review_text: target.review_text || `Pop-up drop at ${target.venue_name}.`,
              author: {
                name: target.venue_name,
                handle: target.instagram_handle?.replace(/^@/, "") || "smakr_makr",
                avatar_url: "",
                badge: "Chef",
              },
              likes_count: 1,
              saves_count: 0,
              created_at_relative: "Just now",
              is_drop: true,
              drop_badge: "Pop-Up Drop",
              spot_type: "popup",
              dietary_tags: target.dietary_tags || [],
            },
            ...state.foodPosts,
          ];
        }
      } else if (target.kind === "makr_photos" && target.photo_url) {
        if (target.venue_id) {
          nextVenues = state.venues.map((v) =>
            v.id === target.venue_id ? { ...v, cover_image_url: target.photo_url } : v
          );
        }
        if (target.dish_name) {
          const matchedVenue = state.venues.find((v) => v.id === target.venue_id);
          nextFoodPosts = [
            {
              id: `makr-photo-${target.id}`,
              spot_id: target.venue_id || matchedVenue?.id || `spot-${target.id}`,
              spot_name: target.venue_name,
              spot_address: matchedVenue?.address || "Oslo",
              spot_neighborhood: matchedVenue?.neighborhood || String(target.neighborhood || "Oslo"),
              spot_coords: [matchedVenue?.longitude ?? 10.7522, matchedVenue?.latitude ?? 59.9139],
              dish_name: target.dish_name,
              category: target.category || matchedVenue?.food_category || "street_food",
              image_url: target.photo_url,
              price_nok: target.price_nok ?? null,
              rating: 4.8,
              taste_tags: ["Studio Drop"],
              review_text: target.review_text || `Fresh photo drop from ${target.venue_name}.`,
              author: {
                name: target.venue_name,
                handle: target.instagram_handle?.replace(/^@/, "") || "smakr_makr",
                avatar_url: "",
                badge: "Chef",
              },
              likes_count: 1,
              saves_count: 0,
              created_at_relative: "Just now",
              is_official_pick: true,
              dietary_tags: target.dietary_tags || [],
              spot_type: matchedVenue?.spot_type || "restaurant",
            },
            ...state.foodPosts,
          ];
        }
      }

      return {
        pendingSubmissions: nextQueue,
        foodPosts: nextFoodPosts,
        venues: nextVenues,
      };
    }),

  setIsCreateBiteModalOpen: (open) => set({ isCreateBiteModalOpen: open }),

  openCreateDish: () => {
    const { currentUser } = get();

    // 1) Guests see the warm "Become a Smakr Foodie" invite modal first.
    if (!currentUser) {
      set({ isFoodieInviteOpen: true });
      return;
    }

    // 2) Not-yet-onboarded foodies finish their 15-second profile first. The
    //    UserOnboardingModal is always mounted and overlays when this is true.
    const needsOnboarding =
      currentUser.onboarding_completed !== true &&
      !currentUser.is_official &&
      currentUser.role !== "admin";
    if (needsOnboarding) {
      get().showToast("Finish your 15-second profile first ✨");
      return;
    }

    set({ isCreateBiteModalOpen: true });
  },

  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  setLastEvent: (event) => set({ lastEvent: event }),

  setIsLoadingVenues: (loading) => set({ isLoadingVenues: loading }),

  setIsHydratingData: (isHydratingData) => set({ isHydratingData }),

  setIsAuthResolved: (isAuthResolved) => set({ isAuthResolved }),
  setProfileResolved: (profileResolved) => set({ profileResolved }),

  setIsLocating: (isLocating) => set({ isLocating }),
  markServerDataApplied: () => set({ serverDataApplied: true }),
}));

if (typeof window !== "undefined") {
  (window as unknown as { __store: typeof useCityPulseStore }).__store = useCityPulseStore;
}
