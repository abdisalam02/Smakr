"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Plus, MapPin, Bookmark } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { getPeepSpriteDataUri } from "@/lib/bustCrowdPeep";
import { trackEvent } from "@/lib/analytics";
import { formatOsloLocation } from "@/lib/location";
import { KineticFeedLane } from "@/components/food/FeedMotionLanes";
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
            <span className="text-[11px] font-display font-bold tracking-[0.12em] uppercase text-[#E84A27]">
              OSLO FOODIES
            </span>
          </div>

          <h3 className="font-display font-bold text-[17.5px] leading-tight uppercase text-[#181615]">
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
  const openCreateDish = useCityPulseStore((s) => s.openCreateDish);
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const savedPostIds = useCityPulseStore((s) => s.savedPostIds);
  const toggleSavePost = useCityPulseStore((s) => s.toggleSavePost);
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
        <h3 className="text-[19px] font-display font-bold tracking-tight text-[#181615] uppercase leading-tight flex items-center gap-1.5 min-w-0">
          <span className="text-[#E84A27]">✦</span>
          <span>LOCALS&apos; PICKS</span>
        </h3>
        <span className="text-[#E84A27] font-comico text-[11px] whitespace-nowrap shrink-0">
          Swipe →
        </span>
      </div>

      <KineticFeedLane driftDirection={1}>
        {localPickCards.map(({ post, venue, handle, quote, spriteIdx, customAvatarUrl }) => {
          let spriteUri = customAvatarUrl || sprites[spriteIdx];
          if (spriteUri && spriteUri.startsWith("data:image/svg+xml")) {
            try {
              const idx = spriteUri.indexOf(",");
              if (idx > 0) {
                const payload = spriteUri.slice(idx + 1);
                let rawSvg = spriteUri.includes(";base64,") ? atob(payload) : decodeURIComponent(payload);
                rawSvg = rawSvg
                  .replace(/<mask[^>]*id="viewboxMask"[^>]*>[\s\S]*?<\/mask>/gi, "")
                  .replace(/\s*mask="url\(#viewboxMask\)"/gi, "")
                  .replace(/<rect[^>]*?(?:width="100%"|width="360")[^>]*?>/gi, "");
                spriteUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`;
              }
            } catch {
              // Keep original spriteUri if SVG decoding fails
            }
          }
          const isImgBroken = Boolean(brokenIds[post.id]) || !post.image_url;
          const isSaved = savedPostIds.has(post.id);
          const loc = formatOsloLocation(venue?.address || post.spot_address, venue?.city);
          const neighborhood = (loc.neighborhood || venue?.neighborhood || post.spot_neighborhood || "Oslo")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <article
              key={`locals-pick-${post.id}`}
              data-lane-card="true"
              onClick={() => {
                if (post.spot_id) {
                  trackEvent("spot_opened", {
                    venue_id: post.spot_id,
                    venue_name: venue?.name || post.spot_name,
                    spot_type: venue?.spot_type || post.spot_type || "restaurant",
                    source: "locals_picks",
                  });
                  selectVenueById(post.spot_id);
                  setIsVenueDetailModalOpen(true);
                }
              }}
              className="w-[210px] shrink-0 snap-start flex flex-col cursor-pointer group select-none will-change-transform"
            >
              {/* Clean Photo Card Above with floating bottom-left mascot */}
              <div className="relative w-full h-[205px] rounded-[22px] overflow-hidden bg-[#EDE6DA] border border-black/[0.08] shadow-xs group-hover:shadow-md transition-shadow">
                {isImgBroken ? (
                  <div className="w-full h-full bg-[#EFE9DE] flex items-center justify-center">
                    <SmakrFoodIcon name={post.category || "street_food"} className="w-12 h-12" />
                  </div>
                ) : (
                  <Image
                    src={post.image_url}
                    alt={post.dish_name}
                    fill
                    sizes="215px"
                    onError={() =>
                      setBrokenIds((prev) => ({ ...prev, [post.id]: true }))
                    }
                    className="object-cover text-transparent group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                {/* Top bar: @handle pill + bookmark */}
                <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2]/95 text-[#181615] border border-black/10 text-[10.5px] font-bold shadow-sm truncate max-w-[140px]">
                    {handle}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextSaved = !isSaved;
                      toggleSavePost(post.id);
                      trackEvent("spot_saved", {
                        venue_id: post.spot_id,
                        venue_name: venue?.name || post.spot_name,
                        saved: nextSaved,
                      });
                    }}
                    aria-label={isSaved ? "Saved" : "Save dish"}
                    className={`p-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                      isSaved
                        ? "bg-white text-zinc-900 border-white shadow-xs"
                        : "bg-black/45 text-white border-white/15 hover:bg-black/65"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-zinc-900" : ""}`} />
                  </button>
                </div>

                {/* Bottom row inside photo: floating Living Open Peeps mascot (no ring) + dish title */}
                <div className="absolute bottom-0 inset-x-0 z-10 px-2.5 pb-2 flex items-end gap-2">
                  {spriteUri && (
                    <div
                      data-living-avatar="true"
                      className="w-[46px] h-[52px] shrink-0 overflow-visible pointer-events-none origin-bottom will-change-transform"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={spriteUri}
                        alt=""
                        className={`w-full h-full object-contain object-bottom drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${
                          customAvatarUrl ? "" : "scale-x-100"
                        }`}
                      />
                    </div>
                  )}
                  <h4 className="flex-1 min-w-0 font-display font-bold text-[14.5px] leading-[1.12] uppercase text-[#FAF7F2] line-clamp-2 drop-shadow-sm pb-0.5">
                    {post.dish_name}
                  </h4>
                </div>
              </div>

              {/* Clean Warm Oat Outer Footer Below Card (spot + single price + quote) */}
              <div
                data-lane-footer="true"
                className="mt-2 px-1 space-y-1 transition-opacity duration-150"
              >
                <p className="text-[11.5px] font-bold text-[#181615] dark:text-zinc-100 leading-snug truncate">
                  <span>{post.spot_name} · {neighborhood}</span>
                  {post.price_nok ? (
                    <span className="text-[#E84A27]"> · {post.price_nok} kr</span>
                  ) : null}
                </p>

                <p className="text-[11px] leading-snug text-[#181615]/80 dark:text-zinc-300 line-clamp-2">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            </article>
          );
        })}

        {/* End-of-lane Foodie Invite Card matching exact outer-footer card height */}
        <article
          data-lane-card="true"
          onClick={openCreateDish}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openCreateDish();
            }
          }}
          className="w-[210px] shrink-0 snap-start flex flex-col cursor-pointer group select-none will-change-transform"
        >
          <div className="h-[205px] rounded-[22px] bg-[#F3EDE2] border border-[#181615]/15 group-hover:border-[#E84A27]/50 p-4 flex flex-col justify-between transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E84A27]">
                Oslo Foodies
              </span>
              <h4 className="mt-1 font-display font-bold text-[18px] leading-[1.08] uppercase text-[#181615]">
                Your Avatar Here
              </h4>
              <p className="mt-1.5 text-[11px] leading-snug text-[#181615]/70">
                {currentUser
                  ? "Log an Oslo favourite. Approved picks go live with your avatar."
                  : "Build your avatar and drop your favourite Oslo dish."}
              </p>
            </div>

            <div className="flex items-end -space-x-2">
              {CLEAN_LOCAL_SPRITES.slice(0, 3).map((idx) => (
                <div key={idx} className="w-9 h-10 shrink-0 overflow-visible">
                  {sprites[idx] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={sprites[idx]}
                      alt=""
                      className="w-full h-full object-contain object-bottom"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div data-lane-footer="true" className="mt-2 px-0.5 transition-opacity duration-150">
            <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E84A27] group-hover:bg-[#d63e1c] text-[#FAF7F2] font-bold text-[11.5px] py-2 px-3 shadow-xs transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>Drop a Pick</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </article>
      </KineticFeedLane>
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
            <span className="text-[11px] font-display font-bold tracking-[0.1em] uppercase text-[#E84A27]">
              MAKR STUDIO · NO LOGIN REQUIRED
            </span>
          </div>

          <h3 className="font-display font-bold text-[20px] leading-tight uppercase tracking-tight text-[#181615]">
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

export function BecomeAFoodieBanner() {
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const setIsFoodieInviteOpen = useCityPulseStore((s) => s.setIsFoodieInviteOpen);
  const openCreateDish = useCityPulseStore((s) => s.openCreateDish);
  const sprites = useCleanPeepSprites([37, 55, 71]);

  return (
    <section className="col-span-full rounded-2xl bg-[#F3EDE2] text-[#181615] border border-[#181615]/12 px-4 py-4 shadow-2xs my-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5">
            <SmakrFoodIcon name="street_food" className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-display font-bold tracking-[0.12em] uppercase text-[#E84A27]">
              SMAKR FOODIE CLUB
            </span>
          </div>

          <h3 className="font-display font-bold text-[19px] leading-tight uppercase tracking-tight text-[#181615]">
            {currentUser ? "SHARE YOUR NEXT OSLO FIND" : "BECOME A FOODIE IN OSLO"}
          </h3>
          <p className="text-[12px] text-[#181615]/75 leading-snug">
            {currentUser
              ? "Drop a favourite dish and your mascot goes live in Locals' Picks."
              : "Build your mascot, save your Oslo hit-list, and get featured in Locals' Picks."}
          </p>
        </div>

        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-end -space-x-2.5">
            {[37, 55, 71].map((idx) => (
              <div key={idx} className="w-9 h-10 shrink-0 overflow-visible">
                {sprites[idx] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={sprites[idx]}
                    alt=""
                    className="w-full h-full object-contain object-bottom drop-shadow-[0_2px_4px_rgba(24,22,21,0.16)]"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                openCreateDish();
              } else {
                setIsFoodieInviteOpen(true);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E84A27] hover:bg-[#d63e1c] active:scale-[0.98] text-[#FAF7F2] font-bold text-[12px] px-4 py-2.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <span>{currentUser ? "Drop a Pick" : "Become a Foodie"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
