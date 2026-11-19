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
  const sprites = useCleanPeepSprites(CLEAN_LOCAL_SPRITES.slice(0, 4));

  return (
    <section className="col-span-full py-2 px-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 mb-0.5">
            <SmakrFoodIcon name="street_food" className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-comico tracking-[0.12em] uppercase text-[#E84A27]">
              OSLO FOODIES
            </span>
          </div>

          <h3 className="font-comico font-normal text-[17px] leading-tight uppercase text-[#181615]">
            {currentUser ? "GOT AN OSLO BITE TO DROP?" : "GOT ELITE TASTE IN OSLO?"}
          </h3>
          <p className="text-[11.5px] leading-snug text-[#181615]/70 mt-0.5 line-clamp-2">
            Spot a hidden Oslo gem or favourite dish. Approved picks go live in Locals&apos; Picks.
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {currentUser ? (
            <button
              type="button"
              onClick={openCreateDish}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E84A27] hover:bg-[#d63e1c] active:scale-95 text-[#FAF7F2] font-bold text-[11.5px] px-3.5 py-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drop a Local Pick</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsFoodieInviteOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-[#E84A27] hover:bg-[#d63e1c] active:scale-95 text-[#FAF7F2] font-bold text-[11.5px] px-3.5 py-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Become a Foodie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFoodieInviteOpen(true)}
            className="flex flex-col items-end gap-0.5 group cursor-pointer"
          >
            <div className="flex items-end -space-x-3">
              {CLEAN_LOCAL_SPRITES.slice(0, 4).map((idx) => (
                <div
                  key={idx}
                  className="w-11 h-12 shrink-0 overflow-visible"
                >
                  {sprites[idx] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={sprites[idx]}
                      alt=""
                      className="w-full h-full object-contain object-bottom drop-shadow-[0_2px_4px_rgba(24,22,21,0.18)]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-semibold text-[#181615]/75 group-hover:text-[#E84A27] transition-colors leading-tight">
              Make your own foodie avatar
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

interface FoundingLocalPickDef {
  handle: string;
  quote: string;
  spriteIdx: number;
  matchTerms: string[];
}

/** Curated Founding Oslo Locals showcase used to backfill up to 6 distinct venues behind real approved user picks. */
const FOUNDING_LOCAL_PICKS: FoundingLocalPickDef[] = [
  {
    handle: "@majak",
    quote: "Worth crossing town for this broth",
    spriteIdx: 37,
    matchTerms: ["ramen", "hrimnir", "koie", "sapporo", "tonkotsu", "paitan"],
  },
  {
    handle: "@jonasb",
    quote: "Crispiest crust in Grünerløkka",
    spriteIdx: 35,
    matchTerms: ["pizza", "zz pizza", "mamma", "focaccia", "sourdough", "farine"],
  },
  {
    handle: "@sara.n",
    quote: "Order this before 14:00 or it sells out",
    spriteIdx: 55,
    matchTerms: ["cardamom", "bolle", "bun", "ille brød", "croissant", "cookie", "bakery"],
  },
  {
    handle: "@henrik_s",
    quote: "Best late-lunch smash in Sentrum",
    spriteIdx: 38,
    matchTerms: ["burger", "smash", "troys", "cheesesteak", "kebab", "k-fried", "chicken"],
  },
  {
    handle: "@norah",
    quote: "Velvety pour, zero bitterness",
    spriteIdx: 71,
    matchTerms: ["matcha", "coconut coffee", "egg coffee", "cà phê", "wendelboe", "latte", "espresso"],
  },
  {
    handle: "@tarikm",
    quote: "Hidden gem I bring every visitor to",
    spriteIdx: 98,
    matchTerms: ["dumpling", "bao", "banh mi", "taco", "gelato", "fiskeriet", "izakaya"],
  },
];

export interface ResolvedLocalPick {
  post: FoodPost;
  venue: Venue | null;
  handle: string;
  quote: string;
  spriteIdx: number;
  customAvatarUrl: string | null;
  isCommunitySubmission: boolean;
}

export function resolveLocalsPicks(
  posts: FoodPost[],
  venueById: Map<string, Venue>
): ResolvedLocalPick[] {
  const result: ResolvedLocalPick[] = [];
  const usedVenueIds = new Set<string>();
  const usedPostIds = new Set<string>();

  // 1) Real approved community picks from Supabase ALWAYS come first.
  const approvedUserPicks = posts.filter(
    (p) =>
      !p.is_archived &&
      p.is_published !== false &&
      (p.is_local_pick || (p.dietary_tags as string[] | undefined)?.includes("local_pick"))
  );

  for (const post of approvedUserPicks) {
    if (result.length >= 6) break;
    const venueKey = post.spot_id || post.spot_name;
    if (venueKey && usedVenueIds.has(venueKey)) continue;
    if (venueKey) usedVenueIds.add(venueKey);
    usedPostIds.add(post.id);

    const rawHandle = post.author?.handle?.trim() || "oslo_foodie";
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
    const quote =
      post.review_text?.trim() ||
      post.diner_quotes?.[0]?.text?.trim() ||
      "Approved Oslo local pick";
    const customAvatar =
      post.author?.avatar_url && post.author.avatar_url.trim().length > 0
        ? post.author.avatar_url
        : null;

    result.push({
      post,
      venue: venueById.get(post.spot_id) ?? null,
      handle,
      quote,
      spriteIdx: CLEAN_LOCAL_SPRITES[result.length % CLEAN_LOCAL_SPRITES.length],
      customAvatarUrl: customAvatar,
      isCommunitySubmission: true,
    });
  }

  // 2) Curated Founding Oslo Locals backfill (distinct venues only, never raw created_at DESC dump).
  const eligible = posts.filter(
    (p) =>
      !p.is_archived &&
      p.is_published !== false &&
      Boolean(p.image_url) &&
      !usedPostIds.has(p.id) &&
      venueById.get(p.spot_id)?.spot_type !== "popup" &&
      p.spot_type !== "popup"
  );

  for (const slot of FOUNDING_LOCAL_PICKS) {
    if (result.length >= 6) break;
    const match = eligible.find((p) => {
      const venueKey = p.spot_id || p.spot_name;
      if (venueKey && usedVenueIds.has(venueKey)) return false;
      const hay = `${p.dish_name} ${p.spot_name} ${p.category || ""}`.toLowerCase();
      return slot.matchTerms.some((term) => hay.includes(term));
    });
    if (match) {
      const venueKey = match.spot_id || match.spot_name;
      if (venueKey) usedVenueIds.add(venueKey);
      usedPostIds.add(match.id);
      result.push({
        post: match,
        venue: venueById.get(match.spot_id) ?? null,
        handle: slot.handle,
        quote: slot.quote,
        spriteIdx: slot.spriteIdx,
        customAvatarUrl: null,
        isCommunitySubmission: false,
      });
    }
  }

  // 3) Safety backfill if fewer than 6 matched (highest-rated distinct venues).
  if (result.length < 6) {
    const byQuality = [...eligible]
      .filter((p) => !usedPostIds.has(p.id) && !usedVenueIds.has(p.spot_id || p.spot_name))
      .sort((a, b) => {
        const ra = venueById.get(a.spot_id)?.google_rating ?? a.rating ?? 0;
        const rb = venueById.get(b.spot_id)?.google_rating ?? b.rating ?? 0;
        return rb - ra;
      });
    for (const post of byQuality) {
      if (result.length >= 6) break;
      const venueKey = post.spot_id || post.spot_name;
      if (venueKey && usedVenueIds.has(venueKey)) continue;
      if (venueKey) usedVenueIds.add(venueKey);
      const fallbackSlot = FOUNDING_LOCAL_PICKS[result.length % FOUNDING_LOCAL_PICKS.length];
      result.push({
        post,
        venue: venueById.get(post.spot_id) ?? null,
        handle: fallbackSlot.handle,
        quote: post.diner_quotes?.[0]?.text?.trim() || fallbackSlot.quote,
        spriteIdx: fallbackSlot.spriteIdx,
        customAvatarUrl: null,
        isCommunitySubmission: false,
      });
    }
  }

  return result;
}

interface LocalsPicksSwimlaneProps {
  posts: FoodPost[];
  venueById: Map<string, Venue>;
  resolvedPicks?: ResolvedLocalPick[];
}

export function LocalsPicksSwimlane({
  posts,
  venueById,
  resolvedPicks,
}: LocalsPicksSwimlaneProps) {
  const selectVenueById = useCityPulseStore((s) => s.selectVenueById);
  const setIsVenueDetailModalOpen = useCityPulseStore((s) => s.setIsVenueDetailModalOpen);
  const sprites = useCleanPeepSprites(CLEAN_LOCAL_SPRITES);
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({});

  const localPickCards = useMemo(
    () => resolvedPicks ?? resolveLocalsPicks(posts, venueById),
    [resolvedPicks, posts, venueById]
  );

  if (localPickCards.length === 0) return null;

  return (
    <section className="col-span-full -mx-3 px-3 py-2 my-1">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h3 className="text-[19px] font-comico font-normal tracking-tight text-[#181615] uppercase leading-tight flex items-center gap-1.5 min-w-0">
          <span className="text-[#E84A27]">✦</span>
          <span>LOCALS&apos; PICKS</span>
        </h3>
        <span className="text-[#E84A27] font-comico text-[11px] whitespace-nowrap shrink-0">
          Swipe →
        </span>
      </div>

      <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-1 no-scrollbar">
        {localPickCards.map(({ post, venue, handle, quote, spriteIdx, customAvatarUrl }) => {
          const spriteUri = customAvatarUrl || sprites[spriteIdx];
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

              <div className="absolute inset-0 bg-gradient-to-t from-[#181615]/95 via-[#181615]/45 to-black/15" />

              {/* Top-left foodie @handle pill */}
              <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-[#181615]/75 text-[#FAF7F2] border border-white/15 text-[10px] font-bold tracking-tight max-w-[125px] truncate">
                {handle}
              </span>

              {post.price_nok ? (
                <span className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white font-comico font-normal text-[11px] shadow-xs">
                  {post.price_nok} kr
                </span>
              ) : null}

              {/* Bottom-left quote + dish title & spot */}
              <div className="absolute bottom-3 left-3 right-[62px] z-10 text-[#FAF7F2]">
                <p className="text-[10.5px] italic text-[#FDEA6B] leading-snug line-clamp-1 mb-1 drop-shadow-xs">
                  &ldquo;{quote}&rdquo;
                </p>
                <h4 className="font-comico font-normal text-[16px] leading-[1.12] uppercase line-clamp-2 drop-shadow-sm">
                  {post.dish_name}
                </h4>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-[#FAF7F2]/85 truncate">
                  <MapPin className="w-3 h-3 text-[#E84A27] shrink-0" />
                  <span className="truncate">
                    {post.spot_name} · {venue?.neighborhood || post.spot_neighborhood || "Oslo"}
                  </span>
                </p>
              </div>

              {/* Bottom-right flipped sprite / user avatar looking/pointing left at the title */}
              {spriteUri && (
                <div className="absolute bottom-0 right-1 z-10 w-[58px] h-[74px] pointer-events-none select-none overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spriteUri}
                    alt=""
                    className={`w-full h-full object-contain object-bottom drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] ${
                      customAvatarUrl ? "" : "-scale-x-100"
                    }`}
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
