"use client";

import React, { useEffect, useState } from "react";
import { fetchCollections, fetchCollectionVenues } from "@/lib/api";
import { SavedCollection, Venue } from "@/types";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { VenueCard } from "@/components/venue/VenueCard";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { OSLO_CURATED_COLLECTIONS, INITIAL_OSLO_SPOTS } from "@/lib/seeds";
import { ArrowLeft, Loader2, Compass } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<SavedCollection[]>(OSLO_CURATED_COLLECTIONS);
  const [selectedCollection, setSelectedCollection] = useState<SavedCollection | null>(null);
  const [collectionVenues, setCollectionVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(false);

  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCollections();
        if (Array.isArray(data) && data.length > 0) {
          setCollections(data);
        }
      } catch (err) {
        console.warn("Backend collections API not available, using curated collections:", err);
      }
    }
    load();
  }, []);

  async function handleSelectCollection(col: SavedCollection) {
    setSelectedCollection(col);
    setLoadingVenues(true);
    try {
      const data = await fetchCollectionVenues(col.id);
      if (Array.isArray(data) && data.length > 0) {
        setCollectionVenues(data);
      } else {
        // Fallback from local seed venues
        const localVenues = INITIAL_OSLO_SPOTS.filter((v) => col.venue_ids.includes(v.id));
        setCollectionVenues(localVenues);
      }
    } catch {
      const localVenues = INITIAL_OSLO_SPOTS.filter((v) => col.venue_ids.includes(v.id));
      setCollectionVenues(localVenues);
    } finally {
      setLoadingVenues(false);
    }
  }

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
            Oslo Secret Study Guides & Curated Zones
          </h1>
          <p className="text-xs text-[#6b6459] mt-0.5">
            Handpicked study sanctuaries: Blindern specialist libraries, 24/7 OsloMet hideaways, archive reading rooms, and laptop cafés.
          </p>
        </div>

        {selectedCollection && (
          <button
            onClick={() => setSelectedCollection(null)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff] text-[#221e19] hover:text-[#b85434] border border-[#e3dcce] text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Guides</span>
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-[#6b6459] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#b85434]" />
          <p className="text-xs">Loading guides...</p>
        </div>
      ) : selectedCollection ? (
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

          {loadingVenues ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#b85434]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {collectionVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={() => handleOpenOnMap(venue)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onClick={() => handleSelectCollection(col)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
