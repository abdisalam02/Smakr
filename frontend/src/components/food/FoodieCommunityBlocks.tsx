"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Plus, MapPin } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { getPeepSpriteDataUri } from "@/lib/bustCrowdPeep";
import type { FoodPost, Venue } from "@/types";

/** Clean, verified Open Peeps sprite indices (zero flagged faces/limbs; includes pointing & mug poses). */
const CLEAN_LOCAL_SPRITES = [37, 35, 55, 38, 71, 98];

function useCleanPeepSprites(indices: number[]) {
  const [uris, setUris] = useState<Record<number, string>>({});
  const key = indices.join(",");

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      indices.map(async (idx) => {
        const uri = await getPeepSpriteDataUri(idx, "colorized");
        return [idx, uri] as const;
      })
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<number, string> = {};
      for (const [idx, uri] of pairs) {
        if (uri) next[idx] = uri;
      }
      setUris(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return uris;
}

export function FoodieCalloutCard() {
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const setIsFoodieInviteOpen = useCityPulseStore((s) => s.setIsFoodieInviteOpen);
  const openCreateDish = useCityPulseStore((s) => s.openCreateDish);
  const sprites = useCleanPeepSprites([37]);
  const spriteUri = sprites[37];

  return (
    <section className="col-span-full py-2 px-1">
      {/* Centered section label matching Smakr Weekly Pick style */}
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <SmakrFoodIcon name="street_food" className="w-4 h-4 shrink-0" />
        <span className="text-[12px] font-comico tracking-[0.12em] uppercase text-[#E84A27]">
          OSLO FOODIES
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Clean sprite on left mirroring Weekly Pick mascot placement */}
        <div className="w-[64px] h-[78px] shrink-0 flex items-end justify-center">
          {spriteUri ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={spriteUri}
              alt=""
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <SmakrFoodIcon name="ramen" className="w-10 h-10 opacity-70" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative rounded-2xl rounded-bl-md bg-white/80 border border-[#E6DFD3] px-3 py-2 shadow-2xs inline-block max-w-full">
            <h3 className="font-comico font-normal text-[17px] leading-tight uppercase text-[#181615]">
              {currentUser ? "GOT AN OSLO BITE TO DROP?" : "GOT ELITE TASTE IN OSLO?"}
            </h3>
            <span
              aria-hidden="true"
              className="absolute -left-[5px] bottom-1.5 h-2.5 w-2.5 rotate-45 bg-white/80 border-l border-b border-[#E6DFD3]"
            />
          </div>

          <div className="mt-2">
            {currentUser ? (
              <button
                type="button"
                onClick={openCreateDish}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E84A27] hover:bg-[#d63e1c] active:scale-95 text-[#FAF7F2] font-bold text-[12px] px-4 py-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Drop a Local Pick</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFoodieInviteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E84A27] hover:bg-[#d63e1c] active:scale-95 text-[#FAF7F2] font-bold text-[12px] px-4 py-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Become a Smakr Foodie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface LocalsPicksSwimlaneProps {
  posts: FoodPost[];
  venueById: Map<string, Venue>;
}

export function LocalsPicksSwimlane({ posts, venueById }: LocalsPicksSwimlaneProps) {
  const selectVenueById = useCityPulseStore((s) => s.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore((s) => s.setIsVenueDetailModalOpen);
  const sprites = useCleanPeepSprites(CLEAN_LOCAL_SPRITES);
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({});

  const localPickCards = useMemo(() => {
    const approvedUserPicks = posts.filter(
      (p) => !p.is_archived && (p.is_local_pick || (p.dietary_tags as string[] | undefined)?.includes("local_pick"))
    );

    const curatedFallback = posts.filter(
      (p) => !p.is_archived && p.image_url && !approvedUserPicks.some((a) => a.id === p.id)
    );

    const combined = [...approvedUserPicks, ...curatedFallback].slice(0, 6);

    return combined.map((post, idx) => ({
      post,
      venue: venueById.get(post.spot_id) ?? null,
      spriteIdx: CLEAN_LOCAL_SPRITES[idx % CLEAN_LOCAL_SPRITES.length],
    }));
  }, [posts, venueById]);

  if (localPickCards.length === 0) return null;

  return (
    <section className="col-span-full bg-[#F2EDE4]/65 border-y border-[#E6DFD3] -mx-3 px-3.5 py-4 rounded-2xl my-2">
      <div className="flex items-end justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <h3 className="text-[19px] font-comico font-normal tracking-tight text-[#181615] uppercase leading-tight flex items-center gap-1.5">
            <span className="text-[#E84A27]">✦</span>
            <span>LOCALS&apos; PICKS</span>
          </h3>
          <p className="text-[11px] text-[#5f5b55] font-medium leading-snug mt-0.5">
            Curated Oslo bites picked by Smakr Foodies.
          </p>
        </div>
        <span className="text-[#E84A27] font-comico text-[11px] whitespace-nowrap shrink-0">
          Swipe →
        </span>
      </div>

      <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-1 no-scrollbar">
        {localPickCards.map(({ post, venue, spriteIdx }) => {
          const spriteUri = sprites[spriteIdx];
          const isImgBroken = Boolean(brokenIds[post.id]) || !post.image_url;

          return (
            <article
              key={`locals-pick-${post.id}`}
              onClick={() => {
                if (post.spot_id) {
                  selectVenueById(post.spot_id);
                  setIsVenueDetailModalOpen(true);
                }
              }}
              className="w-[215px] h-[265px] shrink-0 snap-start rounded-[24px] overflow-hidden relative bg-[#181615] border border-white/75 shadow-sm cursor-pointer group"
            >
              {isImgBroken ? (
                <div className="w-full h-full bg-[#241E1C] flex items-center justify-center">
                  <SmakrFoodIcon name={post.category || "street_food"} className="w-12 h-12" />
                </div>
              ) : (
                <Image
                  src={post.image_url}
                  alt=""
                  fill
                  sizes="220px"
                  onError={() =>
                    setBrokenIds((prev) => ({ ...prev, [post.id]: true }))
                  }
                  className="object-cover text-transparent group-hover:scale-105 transition-transform duration-300"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#181615]/95 via-[#181615]/30 to-transparent" />

              {post.price_nok ? (
                <span className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white font-comico font-normal text-[11px] shadow-xs">
                  {post.price_nok} kr
                </span>
              ) : null}

              {/* Bottom-left dish title & spot */}
              <div className="absolute bottom-3 left-3 right-[66px] z-10 text-[#FAF7F2]">
                <h4 className="font-comico font-normal text-[17px] leading-[1.12] uppercase line-clamp-2 drop-shadow-sm">
                  {post.dish_name}
                </h4>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#FAF7F2]/85 truncate">
                  <MapPin className="w-3 h-3 text-[#E84A27] shrink-0" />
                  <span className="truncate">
                    {post.spot_name} · {venue?.neighborhood || post.spot_neighborhood || "Oslo"}
                  </span>
                </p>
              </div>

              {/* Bottom-right flipped sprite looking/pointing left at the title */}
              {spriteUri && (
                <div className="absolute bottom-0 right-1 z-10 w-[60px] h-[78px] pointer-events-none select-none overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spriteUri}
                    alt=""
                    className="w-full h-full object-contain object-bottom -scale-x-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function MakrStudioTicketCard() {
  return (
    <section className="col-span-full rounded-2xl bg-[#F3EDE2] text-[#181615] border border-[#181615]/12 px-4 py-4 shadow-2xs my-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5">
            <SmakrFoodIcon name="popup" className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-comico tracking-[0.1em] uppercase text-[#E84A27]">
              MAKR STUDIO · NO LOGIN REQUIRED
            </span>
          </div>

          <h3 className="font-comico font-normal text-[20px] leading-tight uppercase tracking-wide text-[#181615]">
            RUN A SPOT OR POP-UP IN OSLO?
          </h3>
          <p className="text-[12px] text-[#181615]/70 leading-snug">
            Submit a weekend pop-up or upload fresh kitchen photos directly.
          </p>
        </div>

        <Link
          href="/makr"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#181615] hover:bg-[#2c2826] active:scale-[0.99] text-[#FAF7F2] font-bold text-[12.5px] px-4 py-2.5 shadow-2xs transition-all"
        >
          <span>Open Makr Studio</span>
          <ArrowUpRight className="w-4 h-4 text-[#E84A27]" />
        </Link>
      </div>
    </section>
  );
}
