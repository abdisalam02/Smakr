"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Mail,
  ShieldCheck,
  Clock,
  Instagram,
  Phone,
  Building2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { PartnerCardPreview } from "@/components/partner/PartnerCardPreview";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface ClaimRecord {
  id: string;
  venue_id: string;
  status: "pending" | "approved" | "rejected";
  applicant_name: string;
  applicant_role: string;
  applicant_email: string;
  applicant_phone?: string;
  applicant_instagram?: string;
  org_number?: string;
  proposed: {
    dish_name: string;
    price_nok: number | null;
    image_url: string;
    taste_note: string;
    category?: string;
    dietary_tags?: string[];
    opening_hours?: string;
    location_schedule?: string;
    spot_type?: "standard" | "food_truck" | "pop_up";
  };
  snapshot?: {
    venue_name: string;
    address: string;
    dish_name: string;
    price_nok: number | null;
    dish_image_url: string;
    taste_note: string;
    opening_hours?: string;
    spot_type?: "standard" | "food_truck" | "pop_up";
  };
  venue?: {
    id: string;
    name: string;
    address: string;
    food_category?: string;
    cover_image_url?: string;
  };
  created_at: string;
}

export function PartnerClaimsQueue() {
  const showToast = useCityPulseStore((s) => s.showToast);

  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution states
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [approvedDetails, setApprovedDetails] = useState<
    Record<string, { kitchenUrl: string; fullKitchenUrl: string; mailtoLink: string }>
  >({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partner-claims");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load partner claims.");
        setLoading(false);
        return;
      }
      setClaims(data.claims || []);
    } catch {
      setError("Network error fetching claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleResolve = async (claimId: string, action: "approve" | "reject") => {
    setResolvingId(claimId);
    try {
      const note = rejectionNotes[claimId] || "";
      const res = await fetch("/api/admin/partner-claims/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action, note }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Resolution failed.");
        return;
      }

      if (action === "approve") {
        setApprovedDetails((prev) => ({
          ...prev,
          [claimId]: {
            kitchenUrl: data.kitchenUrl,
            fullKitchenUrl: data.fullKitchenUrl,
            mailtoLink: data.mailtoLink,
          },
        }));
        showToast("Claim approved! Radar and food post updated live. ✨");
      } else {
        showToast("Claim marked rejected.");
      }

      // Update local status
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: action === "approve" ? "approved" : "rejected" } : c))
      );
    } catch {
      showToast("Network error resolving claim.");
    } finally {
      setResolvingId(null);
      setShowRejectInput(null);
    }
  };

  const handleCopy = (claimId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(claimId);
    showToast("Kitchen Remote link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const pendingClaims = claims.filter((c) => c.status === "pending");

  if (loading) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-[#e84a27]" />
        <span className="text-xs font-semibold">Loading partner claims queue…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadClaims}
          className="px-3 py-1 rounded-xl bg-red-100 hover:bg-red-200 font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Partner Claim Moderation Queue</span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#e84a27] text-xs font-bold">
              {pendingClaims.length} Pending
            </span>
          </h2>
          <p className="text-xs text-zinc-500">
            Compare proposed partner cards against live radar listings before issuing Kitchen Remote links.
          </p>
        </div>

        <button
          onClick={loadClaims}
          className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all"
        >
          Refresh Queue
        </button>
      </div>

      {pendingClaims.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-[#E7E0D4] text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800">Queue is Clear</h3>
          <p className="text-xs text-zinc-500">
            All partner verification claims have been reviewed. New submissions from /partner appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingClaims.map((claim) => {
            const venueName = claim.venue?.name || claim.snapshot?.venue_name || "Restaurant";
            const approvedInfo = approvedDetails[claim.id];

            return (
              <div
                key={claim.id}
                className="p-5 sm:p-7 rounded-3xl bg-white border border-[#E7E0D4] shadow-xs space-y-6"
              >
                {/* Applicant Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-zinc-900">{venueName}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 capitalize">
                        {claim.applicant_role}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Submitted by <strong className="text-zinc-800">{claim.applicant_name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-600 flex-wrap">
                      <a
                        href={`mailto:${claim.applicant_email}`}
                        className="inline-flex items-center gap-1 hover:text-[#e84a27]"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{claim.applicant_email}</span>
                      </a>

                      {claim.applicant_phone && (
                        <a
                          href={`tel:${claim.applicant_phone}`}
                          className="inline-flex items-center gap-1 hover:text-[#e84a27]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{claim.applicant_phone}</span>
                        </a>
                      )}

                      {claim.applicant_instagram && (
                        <span className="inline-flex items-center gap-1 text-pink-600">
                          <Instagram className="w-3.5 h-3.5" />
                          <span>{claim.applicant_instagram}</span>
                        </span>
                      )}

                      {claim.org_number && (
                        <span className="inline-flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Org: {claim.org_number}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 self-start sm:self-auto">
                    {new Date(claim.created_at).toLocaleDateString("no-NO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Side-by-Side Card Comparison Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: Live Snapshot */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500 px-1">
                      <span>1. Current Live Radar Card</span>
                      <span className="text-[10px] uppercase font-mono">Snapshot</span>
                    </div>

                    <PartnerCardPreview
                      compact
                      venueName={venueName}
                      neighborhood="Oslo"
                      dishName={claim.snapshot?.dish_name || venueName}
                      priceNok={claim.snapshot?.price_nok ?? null}
                      imageUrl={claim.snapshot?.dish_image_url || claim.venue?.cover_image_url || ""}
                      tasteNote={claim.snapshot?.taste_note || ""}
                      spotType={claim.snapshot?.spot_type || "standard"}
                      isVerified={false}
                    />
                  </div>

                  {/* Right: Proposed Partner Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#e84a27] px-1">
                      <span>2. Proposed Partner Card</span>
                      <span className="text-[10px] uppercase font-mono font-bold">New Submission</span>
                    </div>

                    <PartnerCardPreview
                      compact
                      venueName={venueName}
                      neighborhood="Oslo"
                      dishName={claim.proposed.dish_name}
                      priceNok={claim.proposed.price_nok}
                      imageUrl={claim.proposed.image_url}
                      tasteNote={claim.proposed.taste_note}
                      spotType={claim.proposed.spot_type || "standard"}
                      locationSchedule={claim.proposed.location_schedule}
                      isVerified={true}
                    />
                  </div>
                </div>

                {/* Changed Fields Highlights */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                  <span className="font-bold text-zinc-700 block">Proposed Adjustments:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-600">
                    <div>
                      <span className="text-zinc-400">Dish:</span>{" "}
                      <strong className="text-zinc-900">{claim.proposed.dish_name}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400">Price:</span>{" "}
                      <strong className="text-[#e84a27]">
                        {claim.proposed.price_nok ? `${claim.proposed.price_nok} kr` : "None set"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-400">Format:</span>{" "}
                      <strong className="text-zinc-900 capitalize">
                        {claim.proposed.spot_type || "standard"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Approved State Banner with Magic Link and Email Button */}
                {approvedInfo ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Card Approved and Deployed to Radar!</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={approvedInfo.fullKitchenUrl}
                        className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white border border-emerald-300 text-zinc-800 select-all"
                      />

                      <button
                        type="button"
                        onClick={() => handleCopy(claim.id, approvedInfo.fullKitchenUrl)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedToken === claim.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken === claim.id ? "Copied" : "Copy Remote Link"}</span>
                      </button>

                      {approvedInfo.mailtoLink && (
                        <a
                          href={approvedInfo.mailtoLink}
                          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Email to Chef</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Action Controls */
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                    {showRejectInput === claim.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectionNotes[claim.id] || ""}
                          onChange={(e) =>
                            setRejectionNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))
                          }
                          placeholder="Reason for rejection (e.g. invalid photo, wrong price)..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={resolvingId === claim.id}
                          onClick={() => handleResolve(claim.id, "reject")}
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                          Confirm Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(null)}
                          className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(claim.id)}
                          disabled={resolvingId === claim.id}
                          className="px-4 py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Reject with Note
                        </button>

                        <button
                          type="button"
                          disabled={resolvingId === claim.id}
                          onClick={() => handleResolve(claim.id, "approve")}
                          className="px-5 py-2.5 rounded-full bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                        >
                          {resolvingId === claim.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Deploying Updates…</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve &amp; Publish Card</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
