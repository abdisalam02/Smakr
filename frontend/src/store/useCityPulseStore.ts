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
} from "@/types";
import { getDistanceInMeters } from "@/lib/math";
import { persistMascotConfig } from "@/lib/supabase/data";

/* Debounced, best-effort sync of the mascot config to the signed-in profile. */
let mascotPersistTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMascotPersist(userId: string, config: MascotConfig) {
  if (typeof window === "undefined") return;
  if (mascotPersistTimer) clearTimeout(mascotPersistTimer);
  mascotPersistTimer = setTimeout(() => {
    void persistMascotConfig(userId, config);
  }, 1200);
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
  isVenueDetailModalOpen: boolean;
  setIsVenueDetailModalOpen: (open: boolean) => void;
  wsConnected: boolean;
  lastEvent: LiveRadarEvent | null;
  isLoadingVenues: boolean;
  /** True until the first venues/posts/weekly-drop sync resolves. */
  isHydratingData: boolean;
  /** True once the Supabase auth session has been resolved (or confirmed absent). */
  isAuthResolved: boolean;
  /** True once the server-prefetched payload has been applied to the store. */
  serverDataApplied: boolean;
  toastMessage: string | null;
  mapCategory: FoodCategory;
  feedCategory: FoodCategory;
  feedMode: "food" | "places";
  selectedAvatar: AvatarOption;
  mapNeighborhood: Neighborhood;
  selectedDietary: DietaryTag[];
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
  showToast: (message: string, durationMs?: number) => void;
  clearToast: () => void;
  setVenues: (venues: Venue[]) => void;
  setFoodPosts: (posts: FoodPost[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setFoodCategory: (category: FoodCategory) => void;
  setMapCategory: (category: FoodCategory) => void;
  setFeedCategory: (category: FoodCategory) => void;
  setMapNeighborhood: (neighborhood: Neighborhood) => void;
  toggleDietary: (tag: DietaryTag) => void;
  updateMascotConfig: (updates: Partial<MascotConfig>) => void;
  resetMascotConfig: () => void;
  /** Hydrate the mascot from the server profile without scheduling a write-back. */
  hydrateMascotConfig: (config: MascotConfig) => void;
  setFeedMode: (mode: "food" | "places") => void;
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
  viewMode: "split",
  // The feed is DB-driven — start empty and hydrate via fetchFoodPosts().
  foodPosts: [],
  likedPostIds: new Set<string>(),
  savedPostIds: new Set<string>(),
  currentUser: null,
  isAuthModalOpen: false,
  mobileSheetState: "half",
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
  serverDataApplied: false,
  toastMessage: null,
  mapCategory: "all",
  feedCategory: "all",
  feedMode: "food",
  selectedAvatar: "lordicon_barista",
  mapNeighborhood: "all",
  selectedDietary: [],
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

  logout: () => set({ currentUser: null }),

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
    const { venues, viewMode } = get();
    const spot = spotId ? venues.find((v) => v.id === spotId) : null;
    set({
      mapCenter: [coords[0], coords[1]],
      mapZoom: 16,
      mobileSheetState: "peek", // Smoothly slide down feed so map shows!
      isVenueDetailModalOpen: false, // Ensure full detail drawer is dismissed so map is visible
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

  openCreateDish: () => {
    const { currentUser } = get();

    // 1) Guests must sign in first.
    if (!currentUser) {
      set({ isAuthModalOpen: true });
      get().showToast("Sign in or create an account to log dishes on Smakr.");
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

  markServerDataApplied: () => set({ serverDataApplied: true }),
}));

if (typeof window !== "undefined") {
  (window as unknown as { __store: typeof useCityPulseStore }).__store = useCityPulseStore;
}
