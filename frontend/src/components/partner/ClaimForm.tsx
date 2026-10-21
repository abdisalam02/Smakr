"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight, Building2, Mail, Phone, Instagram } from "lucide-react";

export interface ClaimFormProps {
  venueId: string;
  venueName: string;
  proposedCard: {
    dishName: string;
    priceNok: number | null;
    imageUrl: string;
    tasteNote: string;
    category?: string;
    dietaryTags?: string[];
    openingHours?: string;
    locationSchedule?: string;
    spotType?: string;
  };
  onSuccess: (claimId: string) => void;
}

export function ClaimForm({ venueId, venueName, proposedCard, onSuccess }: ClaimFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "chef" | "manager" | "staff">("owner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  // Honeypot field for bot protection
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!venueId) {
      setError("Please search and select your venue first.");
      return;
    }

    if (!proposedCard.dishName.trim()) {
      setError("Please specify your signature dish name before submitting.");
      return;
    }

    if (!proposedCard.imageUrl.trim()) {
      setError("Please select or upload a dish photo before submitting.");
      return;
    }

    if (!name.trim()) {
      setError("Please provide your name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid business email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/partner/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          website: websiteHoneypot,
          applicant: {
            name: name.trim(),
            role,
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            instagram: instagram.trim(),
            orgNumber: orgNumber.trim(),
          },
          proposedCard,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Submission failed. Please check your information and retry.");
        setIsSubmitting(false);
        return;
      }

      setSubmittedClaimId(data.claimId);
      onSuccess(data.claimId);
    } catch {
      setError("Network error while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedClaimId) {
    return (
      <div className="rounded-[26px] bg-[var(--surface)] border border-[var(--surface-border)] p-6 sm:p-8 shadow-xs text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#e84a27] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-comico text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Claim Received
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-bold text-zinc-900 dark:text-white">{name}</span>. Your proposed card for{" "}
            <span className="font-bold text-zinc-900 dark:text-white">{venueName}</span> has been queued for verification.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-left max-w-sm mx-auto text-xs space-y-1.5">
          <div className="flex justify-between text-zinc-500 font-mono text-[11px]">
            <span>Reference:</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{submittedClaimId.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between text-zinc-500 font-mono text-[11px]">
            <span>Confirmation sent to:</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">{email}</span>
          </div>
          <div className="flex justify-between text-zinc-500 font-mono text-[11px]">
            <span>Verification review:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">Within 2 working days</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
          Once approved, your card goes live on the Oslo radar, and we send your private, zero-password Kitchen Remote link to your email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[26px] bg-[var(--surface)] border border-[var(--surface-border)] p-6 sm:p-8 shadow-xs space-y-5">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-[#e84a27] text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Step 3 · Verification &amp; Claim</span>
        </div>
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
          Submit Your Card for Verification
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Pick your spot. Design your card. Send it to us. We check it and publish it.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Honeypot field (hidden from real users, caught by bots) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="partner-website-check">Leave empty</label>
        <input
          id="partner-website-check"
          type="text"
          value={websiteHoneypot}
          onChange={(e) => setWebsiteHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Your Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ken Purvis"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
          />
        </div>

        {/* Role */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Your Role at Venue *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
          >
            <option value="owner">Owner / Founder</option>
            <option value="chef">Head Chef / Cook</option>
            <option value="manager">General Manager</option>
            <option value="staff">Kitchen / Front Staff</option>
          </select>
        </div>

        {/* Business Email */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Business Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. post@koieramen.no"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
          <span className="text-[10px] text-zinc-400 block mt-1">
            We will send your private Kitchen Remote link to this address.
          </span>
        </div>

        {/* Phone */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Contact Phone (8 digits)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 912 34 567"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Instagram Handle
          </label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="e.g. @koieramen"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>

        {/* Org. Number */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Organisation Number (Brønnøysund)
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={orgNumber}
              onChange={(e) => setOrgNumber(e.target.value)}
              placeholder="9 digits (optional)"
              maxLength={9}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !venueId}
          className="w-full py-3.5 rounded-full bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Verification Claim…</span>
            </>
          ) : (
            <>
              <span>Submit Card for Verification</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
