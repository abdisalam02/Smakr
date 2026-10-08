import type { OnboardingAvatarConfig } from "./onboarding";

export type VibeStatus = "optimal" | "moderate" | "packed";

export type FoodCategory =
  | "all"
  | "bakery"
  | "burger"
  | "ramen"
  | "pizza"
  | "coffee"
  | "street_food"
  | "sushi"
  | "dessert"
  | "drinks";

export type DietaryTag = "vegan" | "vegetarian" | "halal" | "gluten_free";

export type Neighborhood =
  | "all"
  | "grunerlokka"
  | "torggata"
  | "toyen"
  | "gronland"
  | "sentrum"
  | "frogner"
  | "kampen";

export type AvatarOption = "open_peeps" | "ouch_3d" | "lordicon_barista";

export interface AvatarDefinition {
  id: AvatarOption;
  name: string;
  sourceLabel: string;
  tag: string;
  tagEmoji: string;
  description: string;
  animationDesc: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  handle: string;
  role: "admin" | "foodie";
  is_official: boolean;
  /** Optional display name (social profiles / legacy). */
  name?: string;
  /** Optional avatar image (social profiles / legacy). */
  avatar_url?: string;
  /** Onboarding avatar levers persisted to `public.profiles.avatar_config`. */
  avatar_config?: OnboardingAvatarConfig | null;
  /** Whether the 15-second onboarding flow has been completed. */
  onboarding_completed?: boolean;
  badge?: "Verified Foodie" | "Chef" | "Local Guide" | "Top Taster";
}

export interface WeeklyPick {
  id: string;
  venue_id: string;
  dish_name: string;
  dish_image: string;
  /** Optional custom mascot avatar URL */
  mascot_avatar_url?: string;
  /** e.g. "Skip the queue at Koie, order the Spicy Miso before 17:30!" */
  speech_bubble: string;
  coords: [number, number]; // [lng, lat]
  price_nok: number;
  /** e.g. "Week 41 Pick" */
  week_label: string;
  active: boolean;
}

export const WEEKLY_PICK_STORAGE_KEY = "smakr_weekly_pick";
export const USER_STORAGE_KEY = "smakr_user";

export const DEFAULT_WEEKLY_PICK: WeeklyPick = {
  id: "weekly-pick-koie-ramen",
  venue_id: "spot-koie",
  dish_name: "Spicy Miso Tonkotsu Ramen",
  dish_image:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  speech_bubble: "Skip the queue at Koie — order the Spicy Miso before 17:30!",
  coords: [10.7516, 59.9171],
  price_nok: 215,
  week_label: "Week 41 Pick",
  active: true,
};

export interface FoodCategoryDef {
  id: FoodCategory;
  label: string;
  emoji: string;
  shortDesc: string;
}

export interface ReviewItem {
  id: string;
  author_name: string;
  author_photo: string | null;
  /** 1–5 stars. */
  rating: number;
  text: string;
  /** e.g. "2 weeks ago". */
  relative_time: string;
}

export interface FoodPost {
  id: string;
  spot_id: string;
  spot_name: string;
  spot_address: string;
  spot_neighborhood: string;
  spot_coords: [number, number]; // [lng, lat]
  dish_name: string;
  category: FoodCategory;
  image_url: string;
  price_nok: number;
  rating: number; // e.g. 9.6 out of 10
  taste_tags: string[];
  review_text: string;
  author: {
    name: string;
    handle: string;
    avatar_url: string;
    badge?: "Verified Foodie" | "Chef" | "Local Guide" | "Top Taster";
  };
  likes_count: number;
  saves_count: number;
  created_at_relative: string;
  is_drop?: boolean;
  drop_badge?: string; // e.g. "🔥 Trending Drop", "✨ New Item", "⏳ Limited Batch", "🥐 Fresh from Oven"
  item_availability?: "Available Now" | "Sold Out Today" | "Fresh From Oven" | "Weekend Only";
  dietary_tags?: DietaryTag[];
  /** Curated by the Smakr admin via the Control Center moderation queue. */
  is_official_pick?: boolean;
  /** Customer soundbites curated onto this dish (JSONB `diner_quotes`). */
  diner_quotes?: ReviewItem[];
}

export interface VibeMetrics {
  seat_score: number;
  seat_label: string;
  noise_score: number;
  noise_label: string;
  outlets_percentage: number;
  outlets_label: string;
  overall_status: VibeStatus;
  overall_score: number;
  active_checkins_count: number;
  last_checkin_at: string | null;
  is_live: boolean;
  decay_factor: number;
  avg_download_mbps: number | null;
  avg_ping_ms: number | null;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  place_type: "cafe" | "library" | "coworking" | "hotel_lobby";
  food_category?: FoodCategory;
  /** Admin-curated emoji shown on the map pin & venue cards (stored in `vibe_signals.icon`). */
  icon?: string;
  price_level?: "$" | "$$" | "$$$";
  signature_dishes?: string[];
  live_food_status?: string;
  google_place_id?: string | null;
  /** Google's aggregate star rating (0–5). */
  google_rating?: number | null;
  /** Google's total review count. */
  google_reviews_count?: number | null;
  /** Hand-picked Google reviews saved to the venue (JSONB `curated_reviews`). */
  curated_reviews?: ReviewItem[];
  opening_hours_json?: Record<string, string> | null;
  cover_image_url?: string | null;
  description?: string | null;
  has_wifi: boolean;
  has_outlets: boolean;
  silent_zone: boolean;
  outdoor_seating: boolean;
  dog_friendly: boolean;
  open_late: boolean;
  baseline_seats: number;
  baseline_noise: number;
  baseline_outlets: boolean;
  created_at?: string | null;
  vibe: VibeMetrics;
  distance_meters?: number | null;
  neighborhood?: Neighborhood;
  dietary_tags?: DietaryTag[];
  open_now?: boolean;
}

export interface LiveCheckin {
  id: string;
  venue_id: string;
  user_id?: string | null;
  seat_level: number;
  noise_level: number;
  outlets_available: boolean;
  comment?: string | null;
  created_at: string;
}

export interface WifiSpeedTest {
  id: string;
  venue_id: string;
  download_mbps: number;
  ping_ms: number;
  network_ssid?: string | null;
  created_at: string;
}

export interface VenueDetail extends Venue {
  recent_checkins: LiveCheckin[];
  recent_speed_tests: WifiSpeedTest[];
  community_posts?: FoodPost[];
}

export interface SavedCollection {
  id: string;
  title: string;
  description?: string | null;
  emoji: string;
  tag?: string | null;
  is_curated?: boolean;
  created_at?: string | null;
  venue_ids: string[];
}

export type ViewMode = "feed" | "map" | "split";

export interface FilterState {
  place_type: "cafe" | "library" | "coworking" | "hotel_lobby" | null;
  food_category: FoodCategory;
  has_outlets: boolean | null;
  silent_zone: boolean | null;
  open_late: boolean | null;
  outdoor_seating: boolean | null;
  dog_friendly: boolean | null;
  min_download_mbps: number | null;
  vibe_status: VibeStatus | null;
  search_query: string;
  dietary: DietaryTag[];
  neighborhood: Neighborhood;
  open_now: boolean | null;
}

export interface LiveRadarEvent {
  type?: string;
  data?: {
    venue_id: string;
    venue_name?: string;
    vibe: VibeMetrics;
    new_checkin?: LiveCheckin;
    speed_test?: WifiSpeedTest;
    new_food_post?: FoodPost;
  };
  event_type?: string;
  food_post?: FoodPost;
  timestamp?: string;
}

export type ColorTheme =
  // 4 Signature Food-Culture Themes (anchored to Burnt Paprika #e84a27)
  | "oat-espresso"
  | "warm-bakery"
  | "late-night"
  | "nordic-minimal"
  // Legacy / Transitional Aliases (kept for existing localStorage keys)
  | "oslo-minimalist"
  | "obsidian-slate"
  | "nordic-linen"
  | "copenhagen-clay"
  | "stockholm-sage"
  | "bistro-navy"
  | "smoked-espresso"
  | "bordeaux-chalk"
  | "swiss-monolith"
  | "alabaster-bronze"
  // Legacy / Transitional Aliases
  | "electric-orange"
  | "cyber-midnight"
  | "nordic-bakery"
  | "kyoto-matcha"
  | "amalfi-coast"
  | "seoul-sunset"
  | "oslo-brutalist"
  | "retro-diner"
  | "nordic-amber"
  | "midnight-gastro"
  | "matcha-botanic"
  | "oslo-monolith";

export type TypographyStyle =
  | "comico"
  | "modern-sans"
  | "jakarta-sans"
  | "editorial-serif"
  | "classic-garamond"
  | "street-grotesk"
  | "rounded-modern"
  | "fashion-syne"
  | "clean-dm";

export type LogoVariant =
  | "fluid"
  | "geometric"
  | "ribbon"
  | "block"
  | "monoline"
  | "stencil"
  | "dual-blade"
  | "serif";

// Modular Mascot System (types, config defaults & studio option metadata)
export * from "./mascot";

// 15-second onboarding avatar schema & lever metadata
export * from "./onboarding";
