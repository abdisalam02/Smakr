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
  name: string;
  handle: string;
  avatar_url: string;
  badge?: "Verified Foodie" | "Chef" | "Local Guide" | "Top Taster";
}

export interface FoodCategoryDef {
  id: FoodCategory;
  label: string;
  emoji: string;
  shortDesc: string;
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
  price_level?: "$" | "$$" | "$$$";
  signature_dishes?: string[];
  live_food_status?: string;
  google_place_id?: string | null;
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
  | "modern-sans"
  | "editorial-serif"
  | "street-grotesk"
  | "rounded-modern";

export type LogoVariant = "fluid" | "geometric" | "ribbon" | "block";
