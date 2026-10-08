"use client";

import { useMemo, useState } from "react";
import { FoodPost, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { getCulinaryImageForDish, getRealisticPrice } from "@/lib/culinaryImages";

export type VenueReaction = "craving" | "must_try" | "ate_here";

export interface UseVenueDetailResult {
  /** Community posts that belong to the selected venue. */
  venuePosts: FoodPost[];
  /** Community posts + signature dishes merged into a single "can't miss" list. */
  recommendedMeals: FoodPost[];
  /** Per-dish one-tap foodie reactions (Craving / Must Try / Tried). */
  reactions: Record<string, VenueReaction | null>;
  handleReaction: (dishId: string, type: VenueReaction) => void;
  /** Store-backed social state so mobile + desktop stay perfectly in sync. */
  likedPostIds: Set<string>;
  toggleLikePost: (postId: string) => void;
  savedPostIds: Set<string>;
  toggleSavePost: (postId: string) => void;
  /** Ready-to-use Google Maps directions link for the venue. */
  googleMapsUrl: string;
}

/**
 * Shared venue data calculation used by both the mobile bottom sheet and the
 * desktop in-place detail pane, so their content can never drift apart.
 */
export function useVenueDetail(venue: Venue | null): UseVenueDetailResult {
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const likedPostIds = useCityPulseStore((state) => state.likedPostIds);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const toggleLikePost = useCityPulseStore((state) => state.toggleLikePost);
  const toggleSavePost = useCityPulseStore((state) => state.toggleSavePost);
  const showToast = useCityPulseStore((state) => state.showToast);

  // Local interactive food discovery reactions (Craving, Must Order, Ate Here)
  const [reactions, setReactions] = useState<
    Record<string, VenueReaction | null>
  >({});

  // Filter posts matching this spot
  const venuePosts = useMemo<FoodPost[]>(() => {
    if (!venue) return [];
    return foodPosts.filter(
      (p) =>
        p.spot_id === venue.id ||
        p.spot_name.toLowerCase().includes(venue.name.toLowerCase()) ||
        venue.name.toLowerCase().includes(p.spot_name.toLowerCase())
    );
  }, [foodPosts, venue]);

  // Build a recommended dishes array combining community posts & signature
  // dishes with exact photo matches.
  const recommendedMeals = useMemo<FoodPost[]>(() => {
    if (!venue) return [];

    const fromPosts: FoodPost[] = venuePosts.map((p) => {
      let cleanTitle = p.dish_name;
      if (cleanTitle.length > 50 || cleanTitle.includes("POV:")) {
        cleanTitle = cleanTitle
          .replace(/POV:\s*/i, "")
          .replace(/#[\wæøåÆØÅ]+/g, "")
          .trim();
        if (cleanTitle.toLowerCase().includes("sandwich")) {
          cleanTitle = "Crispy Pork Sandwich with Loaded Fries";
        } else if (
          cleanTitle.toLowerCase().includes("kaffe") ||
          cleanTitle.toLowerCase().includes("coffee")
        ) {
          cleanTitle = "Iced Coconut Coffee Slush";
        } else {
          const parts = cleanTitle.split(/[.!?\n]/);
          cleanTitle = parts[0].slice(0, 42).trim();
        }
      }
      return {
        ...p,
        dish_name: cleanTitle,
        image_url:
          p.image_url || getCulinaryImageForDish(cleanTitle, p.category),
      };
    });

    const fromSignature: FoodPost[] = (venue.signature_dishes || [])
      .filter(
        (dish) =>
          !venuePosts.some((p) =>
            p.dish_name.toLowerCase().includes(dish.toLowerCase())
          )
      )
      .map((dish, i) => ({
        id: `sig-${venue.id}-${i}`,
        spot_id: venue.id,
        spot_name: venue.name,
        spot_address: venue.address,
        spot_neighborhood: venue.city,
        spot_coords: [venue.longitude, venue.latitude] as [number, number],
        dish_name: dish,
        category: venue.food_category || "coffee",
        image_url: getCulinaryImageForDish(dish, venue.food_category),
        price_nok: getRealisticPrice(dish, venue.food_category),
        rating: 9.6 - i * 0.1,
        taste_tags: ["Chef Signature", "Must Order"],
        review_text: `Signature house specialty recommended by foodies visiting ${venue.name}.`,
        author: {
          name: "Oslo Foodie Radar",
          handle: "@smakr_radar",
          avatar_url:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
          badge: "Verified Foodie" as const,
        },
        likes_count: 85 + i * 18,
        saves_count: 42 + i * 9,
        created_at_relative: "Chef Signature",
      }));

    return [...fromPosts, ...fromSignature];
  }, [venue, venuePosts]);

  const googleMapsUrl = useMemo(() => {
    if (!venue) return "https://www.google.com/maps";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      venue.name + ", " + venue.address + ", Oslo"
    )}`;
  }, [venue]);

  const handleReaction = (dishId: string, type: VenueReaction) => {
    const current = reactions[dishId];
    const next = current === type ? null : type;
    setReactions((prev) => ({ ...prev, [dishId]: next }));

    if (next === "craving") showToast("Added to your cravings list 🔥");
    else if (next === "must_try") showToast("Marked as Must-Order ⭐");
    else if (next === "ate_here") showToast("Marked as tried! 🍽️");
  };

  return {
    venuePosts,
    recommendedMeals,
    reactions,
    handleReaction,
    likedPostIds,
    toggleLikePost,
    savedPostIds,
    toggleSavePost,
    googleMapsUrl,
  };
}
