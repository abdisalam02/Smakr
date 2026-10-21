"use client";

import React, { useMemo, useState } from "react";
import { SavedCollection, Venue } from "@/types";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { VenueCard } from "@/components/venue/VenueCard";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { ArrowLeft, Compass } from "lucide-react";
import { useRouter } from "next/navigation";

type CollectionDefinition = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tag: string;
  matches: (venue: Venue) => boolean;
};

const COLLECTION_DEFINITIONS: CollectionDefinition[] = [
  {
    id: "staff-picks",
    title: "Smakr Staff Picks",
    description:
      "The dishes and spots the Smakr editorial team keeps coming back to. Marked picks only — no filler.",
    emoji: "⭐",
    tag: "Editorial",
    matches: (venue) => venue.is_official_pick === true,
  },
  {
    id: "ramen-noodles",
    title: "Ramen & Noodle Run",
    description:
      "Broth, noodles and comfort bowls across Oslo — from late-night ramen to Vietnamese and Korean favourites.",
    emoji: "🍜",
    tag: "Comfort Food",
    matches: (venue) => {
      const cat = String(venue.food_category || "").toLowerCase();
      return ["ramen", "japanese", "noodles", "vietnamese", "korean"].includes(cat);
    },
  },
  {
    id: "coffee-bakery",
    title: "Coffee & Bakery Stops",
    description:
      "Flat whites, cardamom buns and quiet corners for a laptop session or a slow morning.",
    emoji: "☕",
    tag: "Café Mode",
    matches: (venue) => {
      const cat = String(venue.food_category || "").toLowerCase();
      return ["coffee", "bakery", "dessert", "cafe"].includes(cat);
    },
  },
  {
    id: "street-food",
    title: "Street Food & Quick Bites",
    description:
      "Pizza slices, smashburgers, tacos and kebabs — the high-reward, low-friction Oslo eats.",
    emoji: "🌮",
    tag: "Quick Bites",
    matches: (venue) => {
      const cat = String(venue.food_category || "").toLowerCase();
      return ["street_food", "burger", "pizza", "kebab", "tacos", "sandwich", "pastrami"].includes(cat);
    },
  },
  {
    id: "open-now",
    title: "Open Right Now",
    description:
      "Live spots currently flagged open. Useful when the group chat has already spent 25 minutes deciding.",
    emoji: "🟢",
    tag: "Live",
    matches: (venue) => venue.open_now === true,
  },
];

export default function CollectionsPage() {
  const venues = useCityPulseStore((state) => state.venues);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);
  const [selectedCollection, setSelectedCollection] = useState<SavedCollection | null>(null);
  const router = useRouter();

  const collections = useMemo<SavedCollection[]>(() => {
    return COLLECTION_DEFINITIONS.map((definition) => {
      const venueIds = venues
        .filter((venue) => definition.matches(venue))
        .map((venue) => venue.id);
      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        emoji: definition.emoji,
        tag: definition.tag,
        is_curated: true,
        created_at: null,
        venue_ids: venueIds,
      };
    }).filter((collection) => collection.venue_ids.length > 0);
  }, [venues]);

  const collectionVenues = useMemo<Venue[]>(() => {
    if (!selectedCollection) return [];
    const ids = new Set(selectedCollection.venue_ids);
    return venues.filter((venue) => ids.has(venue.id));
  }, [selectedCollection, venues]);

  function handleOpenOnMap(venue: Venue) {
    setSelectedVenue(venue as any);
    setMapCenter([venue.longitude, venue.latitude], 16);
    router.push("/");
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 overflow-y-auto bg-[#f6f3ee]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5dec9] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#221e19] tracking-tight">
            Oslo Curated Collections
          </h1>
          <p className="text-xs text-[#6b6459] mt-0.5">
            Live picks from the Smakr radar: staff favourites, ramen runs, coffee stops and what&apos;s open right now.
          </p>
        </div>

        {selectedCollection && (
          <button
            onClick={() => setSelectedCollection(null)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff] text-[#221e19] hover:text-[#b85434] border border-[#e3dcce] text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Collections</span>
          </button>
        )}
      </div>

      {/* Body */}
      {selectedCollection ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#ffffff] border border-[#ded5c2] flex items-start gap-4 shadow-xs">
            <span className="text-3xl p-2.5 bg-[#fbf9f5] rounded-xl border border-[#ded5c2] shrink-0">
              {selectedCollection.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#221e19]">
                  {selectedCollection.title}
                </h2>
                {selectedCollection.tag && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#edf6f0] text-[#225c37] border border-[#b8dec4]">
                    {selectedCollection.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6b6459] mt-1 leading-relaxed">
                {selectedCollection.description}
              </p>
            </div>
          </div>

          {collectionVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {collectionVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={() => handleOpenOnMap(venue)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-[#6b6459] gap-2">
              <Compass className="w-6 h-6 text-[#b85434]" />
              <p className="text-xs">No live spots match this collection yet.</p>
            </div>
          )}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onClick={() => setSelectedCollection(col)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center text-[#6b6459] gap-2">
          <Compass className="w-6 h-6 text-[#b85434]" />
          <p className="text-xs">Live venue data is still loading. Check back in a moment.</p>
        </div>
      )}
    </div>
  );
}
