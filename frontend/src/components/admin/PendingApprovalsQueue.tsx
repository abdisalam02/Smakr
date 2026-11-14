"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  X,
  Clock,
  MapPin,
  Instagram,
  Camera,
  Ticket,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import { ensureBustAvatarSvg } from "@/lib/onboardingAvatar";
import type { PendingSubmission } from "@/lib/pendingQueue";

const EDITABLE_ICON_KEYS = [
  "street_food",
  "ramen",
  "burger",
  "bakery",
  "coffee",
  "matcha",
  "pizza",
  "tacos",
  "dumplings",
  "fried_chicken",
  "dessert",
  "popup",
];

export function PendingApprovalsQueue() {
  const pendingSubmissions = useCityPulseStore((s) => s.pendingSubmissions);
  const setPendingSubmissions = useCityPulseStore((s) => s.setPendingSubmissions);
  const resolvePendingSubmission = useCityPulseStore((s) => s.resolvePendingSubmission);
  const showToast = useCityPulseStore((s) => s.showToast);

  const [syncing, setSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"pending" | "all">("pending");
  const [iconOverrides, setIconOverrides] = useState<Record<string, string>>({});

  const fetchServerQueue = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/makr/submit", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.items)) {
        const local = useCityPulseStore.getState().pendingSubmissions;
        const mergedMap = new Map<string, PendingSubmission>();
        for (const item of json.items as PendingSubmission[]) {
          mergedMap.set(item.id, item);
        }
        for (const item of local) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        }
        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );
        setPendingSubmissions(merged);
      }
    } catch {
      // Ignore network/auth errors when running in preview mode
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void fetchServerQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    if (filterStatus === "pending") {
      return pendingSubmissions.filter((x) => x.status === "pending");
    }
    return pendingSubmissions;
  }, [pendingSubmissions, filterStatus]);

  const pendingCount = useMemo(
    () => pendingSubmissions.filter((x) => x.status === "pending").length,
    [pendingSubmissions]
  );

  const handleDecision = async (item: PendingSubmission, action: "approve" | "reject") => {
    const iconOverride = iconOverrides[item.id] || item.icon_key;
    resolvePendingSubmission(item.id, action, iconOverride);

    try {
      await fetch("/api/makr/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action, icon_key: iconOverride }),
      });
    } catch {
      // Client store already resolved cleanly
    }

    if (action === "approve") {
      showToast(
        item.kind === "foodie_dish"
          ? `Approved ${item.dish_name || item.venue_name} to Locals' Picks!`
          : `Published ${item.venue_name} to the Smakr Radar & Feed!`
      );
    } else {
      showToast(`Rejected ${item.dish_name || item.venue_name}.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-comico font-black text-lg text-[#181615] uppercase">
            Pending Approvals (Foodies &amp; Makr)
          </h2>
          <p className="text-xs text-zinc-600">
            Review Smakr Foodie dish picks before they hit Locals&apos; Picks, plus no-login Pop-Ups &amp; Spot Photo drops from /makr.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-[#EFEAE1] p-1 border border-[#181615]/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === "pending"
                  ? "bg-[#181615] text-white"
                  : "text-zinc-600 hover:text-[#181615]"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === "all"
                  ? "bg-[#181615] text-white"
                  : "text-zinc-600 hover:text-[#181615]"
              }`}
            >
              All ({pendingSubmissions.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchServerQueue()}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#181615]/12 text-xs font-bold text-[#181615] hover:bg-[#FAF7F2] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#181615]/10 p-10 text-center space-y-2">
          <Clock className="w-7 h-7 text-[#E84A27] mx-auto" />
          <p className="font-bold text-sm text-[#181615]">Queue is clear</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            New Foodie dish picks and /makr pop-up or kitchen photo drops will appear here for one-click curation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleItems.map((item) => {
            const isFoodie = item.kind === "foodie_dish";
            const isPopup = item.kind === "makr_popup";
            const activeIcon = iconOverrides[item.id] || item.icon_key || item.category || "street_food";
            const avatarSrc = item.author_avatar_url
              ? ensureBustAvatarSvg(item.author_avatar_url)
              : null;

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white border border-[#181615]/12 p-4 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-3">
                  {/* Top metadata badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isFoodie
                          ? "bg-[#E84A27]/12 text-[#E84A27]"
                          : isPopup
                          ? "bg-[#181615] text-[#FAF7F2]"
                          : "bg-[#4E8752]/15 text-[#36643a]"
                      }`}
                    >
                      {isFoodie ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Foodie Dish Pick
                        </>
                      ) : isPopup ? (
                        <>
                          <Ticket className="w-3 h-3 text-[#E84A27]" />
                          Makr Pop-Up Drop
                        </>
                      ) : (
                        <>
                          <Camera className="w-3 h-3" />
                          Makr Photo Drop
                        </>
                      )}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Preview row: image + core details */}
                  <div className="flex gap-3">
                    {item.photo_url ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-black/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.photo_url}
                          alt={item.dish_name || item.venue_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-[#F3EDE2] shrink-0 flex items-center justify-center border border-[#181615]/10">
                        <SmakrFoodIcon name={activeIcon} className="w-10 h-10" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-[15px] text-[#181615] leading-snug truncate">
                        {item.dish_name || item.venue_name}
                        {item.price_nok ? (
                          <span className="ml-1.5 text-xs font-extrabold text-[#E84A27]">
                            · {item.price_nok} kr
                          </span>
                        ) : null}
                      </h3>

                      <p className="text-xs font-semibold text-[#181615]/80 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                        <span className="truncate">
                          {item.venue_name} ·{" "}
                          {item.is_location_tba
                            ? "Location TBA"
                            : item.address
                            ? `${item.address}, ${item.neighborhood}`
                            : item.neighborhood || "Oslo"}
                        </span>
                      </p>

                      {item.drop_dates && (
                        <p className="text-[11px] font-medium text-zinc-600">
                          Dates: {item.drop_dates}
                          {item.drop_hours ? ` · ${item.drop_hours}` : ""}
                        </p>
                      )}

                      {item.instagram_handle && (
                        <p className="text-[11px] font-semibold text-[#181615]/70 flex items-center gap-1">
                          <Instagram className="w-3 h-3 text-[#E84A27]" />
                          <span>@{item.instagram_handle.replace(/^@/, "")}</span>
                        </p>
                      )}

                      {item.review_text && (
                        <p className="text-[11.5px] text-zinc-600 line-clamp-2 italic">
                          &ldquo;{item.review_text}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Foodie Author Strip + Optional Icon Override */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5">
                    {isFoodie ? (
                      <div className="inline-flex items-center gap-2">
                        {avatarSrc && (
                          <span className="w-7 h-7 rounded-full overflow-hidden border border-[#E84A27] bg-[#F3EDE2] shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={avatarSrc} alt={item.author_handle || "Foodie"} className="w-full h-full object-cover" />
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#181615]">
                          {item.author_handle?.startsWith("@")
                            ? item.author_handle
                            : `@${item.author_handle || "foodie"}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-500">
                        {item.extra_photos && item.extra_photos.length > 0
                          ? `${item.extra_photos.length + (item.photo_url ? 1 : 0)} photos attached`
                          : "Direct /makr drop"}
                      </span>
                    )}

                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600">
                      <SmakrFoodIcon name={activeIcon} className="w-4 h-4" />
                      <span>Icon:</span>
                      <select
                        value={activeIcon}
                        onChange={(e) =>
                          setIconOverrides((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="rounded-lg border border-black/15 bg-[#FAF7F2] px-2 py-1 text-[11px] font-semibold text-[#181615]"
                      >
                        {EDITABLE_ICON_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => void handleDecision(item, "approve")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4E8752] hover:bg-[#3f7142] text-white font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isFoodie ? "Approve to Locals' Picks" : "Approve & Publish to Map/Feed"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDecision(item, "reject")}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
