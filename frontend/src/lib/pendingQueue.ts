import type { DietaryTag, FoodCategory, Neighborhood } from "@/types";

export type PendingSubmissionKind = "foodie_dish" | "makr_popup" | "makr_photos";
export type PendingSubmissionStatus = "pending" | "approved" | "rejected";

export interface PendingSubmission {
  id: string;
  kind: PendingSubmissionKind;
  status: PendingSubmissionStatus;
  created_at: string;

  // Author / Foodie info (for foodie_dish or creator attribution)
  author_id?: string;
  author_name?: string;
  author_handle?: string;
  author_avatar_url?: string;

  // Venue / Pop-Up location details
  venue_id?: string;
  venue_name: string;
  neighborhood: Neighborhood | string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_location_tba?: boolean;

  // Pop-Up & Social details
  instagram_handle?: string;
  contact_email?: string;
  drop_dates?: string;
  drop_hours?: string;

  // Dish / Photo details
  dish_name?: string;
  price_nok?: number | null;
  category?: FoodCategory;
  icon_key?: string;
  dietary_tags?: DietaryTag[];
  photo_url?: string;
  extra_photos?: string[];
  review_text?: string;
  vibe_note?: string;
  is_local_pick?: boolean;
}

const STORAGE_KEY = "smakr_pending_submissions";

export function loadPendingSubmissions(): PendingSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePendingSubmissions(items: PendingSubmission[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 60)));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
