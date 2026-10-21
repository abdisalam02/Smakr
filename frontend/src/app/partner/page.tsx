"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ChefHat, HelpCircle } from "lucide-react";
import { SmakrCardStudio } from "@/components/partner/SmakrCardStudio";

const FAQS = [
  {
    q: "How does verification work?",
    a: "We verify that you represent the kitchen or residency using your business email, phone, or organization number. Once confirmed, your edits go live.",
  },
  {
    q: "How long does review take?",
    a: "Submissions are reviewed within two working days. You receive an email update as soon as the listing is approved.",
  },
  {
    q: "What can I edit with the Kitchen Remote?",
    a: "Your private link lets you toggle live batch caps (Fresh Batch, Few Left, Sold Out), update your signature dish photo, and set residency dates.",
  },
  {
    q: "Does listing or verification cost anything?",
    a: "No. Smakr is an independent Oslo food radar. Verified kitchen access is free for restaurants, pop-ups, and food trucks.",
  },
];

export default function PartnerPage() {
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[var(--background)] text-[var(--foreground)] selection:bg-[#e84a27] selection:text-white">
      <div className="pt-24 sm:pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--surface-border)] shadow-xs text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#e84a27] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27]" />
            <span>Back to Radar Map</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#e84a27] text-[11px] font-bold">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Smakr Partner</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#e84a27]">
            Oslo Kitchens · Pop-up Residencies · Food Trucks
          </div>

          <h1 className="font-comico text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white leading-[1.08] tracking-tight">
            Design Your <span className="text-[#e84a27]">Radar Card</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-normal">
            Google Maps shows blurry doors and outdated photos. Put your real signature dish, in-house NOK price, and schedule directly on Oslo's food radar.
          </p>
        </div>

        {/* Studio Canvas Component */}
        <SmakrCardStudio />

        {/* FAQ Section */}
        <div className="rounded-3xl bg-[var(--surface)] border border-[var(--surface-border)] p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <HelpCircle className="w-4 h-4 text-[#e84a27]" />
            <h2 className="text-base font-black tracking-tight">Partner Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {FAQS.map((faq) => (
              <div key={faq.q} className="space-y-1">
                <h3 className="font-bold text-zinc-900 dark:text-white text-xs">{faq.q}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-[var(--surface-border)] text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            Smakr Partner Network · Oslo Independent Food Radar
          </p>
          <p className="text-[11px]">
            Questions? Contact the team directly at{" "}
            <a href="mailto:hei@smakr.no" className="underline hover:text-[#e84a27]">
              hei@smakr.no
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
