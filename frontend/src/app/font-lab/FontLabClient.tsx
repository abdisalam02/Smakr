"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Smartphone, Monitor } from "lucide-react";
import { PopupBrandWordmark } from "@/components/food/PopupBrandWordmark";

interface FontPairDef {
  id: number;
  label: string;
  tag: string;
  displayFamily: string;
  displayWeight: number;
  bodyFamily: string;
  note: string;
}

const FONT_PAIRS: FontPairDef[] = [
  {
    id: 1,
    label: "General Sans (700) + General Sans (400/500)",
    tag: "Same Designer as Comico",
    displayFamily: "'General Sans', sans-serif",
    displayWeight: 700,
    bodyFamily: "'General Sans', sans-serif",
    note: "Designed by Frode Helland (creator of Comico). Shared organic rhythm and compact horizontal width.",
  },
  {
    id: 2,
    label: "Pally (700) + Satoshi (400/500/700)",
    tag: "Playful Rounded Sibling",
    displayFamily: "'Pally', sans-serif",
    displayWeight: 700,
    bodyFamily: "'Satoshi', sans-serif",
    note: "Soft rounded terminals echo Comico's warmth while keeping headings thick and legible.",
  },
  {
    id: 3,
    label: "Cabinet Grotesk (800) + Satoshi (400/500/700)",
    tag: "Indie Editorial Magazine",
    displayFamily: "'Cabinet Grotesk', sans-serif",
    displayWeight: 800,
    bodyFamily: "'Satoshi', sans-serif",
    note: "Expressive pinched grotesk at weight 800; bold contrast next to clean Satoshi metadata.",
  },
  {
    id: 4,
    label: "Pilcrow Rounded (700) + General Sans (400/500)",
    tag: "Chunky Street Food",
    displayFamily: "'Pilcrow Rounded', sans-serif",
    displayWeight: 700,
    bodyFamily: "'General Sans', sans-serif",
    note: "Plump rounded headlines paired with Frode Helland's General Sans for clean Norwegian areas.",
  },
  {
    id: 5,
    label: "Chillax (600/700) + Switzer (400/500/600)",
    tag: "Soft-Cut Quirky Display",
    displayFamily: "'Chillax', sans-serif",
    displayWeight: 600,
    bodyFamily: "'Switzer', sans-serif",
    note: "Playful geometric ink-cuts paired with neutral Swiss Switzer body copy.",
  },
  {
    id: 6,
    label: "Clash Grotesk (600/700) + Switzer (400/500/600)",
    tag: "Tight Anti-Clip Grid",
    displayFamily: "'Clash Grotesk', sans-serif",
    displayWeight: 600,
    bodyFamily: "'Switzer', sans-serif",
    note: "Slightly tighter horizontal metrics fit multi-word dish titles cleanly inside 210px cards.",
  },
  {
    id: 7,
    label: "Clash Display (600/700) + General Sans (400/500)",
    tag: "High-Impact Poster",
    displayFamily: "'Clash Display', sans-serif",
    displayWeight: 600,
    bodyFamily: "'General Sans', sans-serif",
    note: "Wide-stance display headings for high energy alongside structured General Sans copy.",
  },
  {
    id: 8,
    label: "Alpino (700) + Ranade (400/500/600)",
    tag: "Nordic Warmth",
    displayFamily: "'Alpino', sans-serif",
    displayWeight: 700,
    bodyFamily: "'Ranade', sans-serif",
    note: "Friendly geometric display paired with warm humanist Ranade for quotes and bubbles.",
  },
  {
    id: 9,
    label: "Boska (700) + Satoshi (400/500/600)",
    tag: "Food Zine Serif Contrast",
    displayFamily: "'Boska', serif",
    displayWeight: 700,
    bodyFamily: "'Satoshi', sans-serif",
    note: "Editorial serif titles juxtaposed against Comico price tags and geometric Satoshi metadata.",
  },
  {
    id: 10,
    label: "Author (600/700) + Ranade (400/500/600)",
    tag: "Modernist Culinary",
    displayFamily: "'Author', sans-serif",
    displayWeight: 600,
    bodyFamily: "'Ranade', sans-serif",
    note: "Structured utilitarian headings that keep focus on photography and Burnt Paprika accents.",
  },
];

const FONTSHARE_LAB_CSS =
  "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=pally@700&f[]=satoshi@400,500,700&f[]=cabinet-grotesk@700,800&f[]=pilcrow-rounded@700&f[]=chillax@600,700&f[]=switzer@400,500,600&f[]=clash-grotesk@600,700&f[]=clash-display@600,700&f[]=alpino@700&f[]=ranade@400,500,600&f[]=boska@700&f[]=author@600,700&display=swap";

export function FontLabClient() {
  const [mobilePreview, setMobilePreview] = useState(false);

  return (
    <div className="min-h-dvh overflow-y-auto bg-[#FAF7F2] text-[#181615] pt-20 pb-20 px-4">
      {/* Scoped Fontshare stylesheet loaded ONLY inside /font-lab */}
      <link rel="stylesheet" href={FONTSHARE_LAB_CSS} />
      <style>{`
        @font-face { font-family: 'General Sans'; src: url('/fonts/fontshare/GeneralSans-Variable.woff2') format('woff2'); font-weight: 200 700; font-display: swap; }
        @font-face { font-family: 'Pally'; src: url('/fonts/fontshare/Pally-Variable.woff2') format('woff2'); font-weight: 400 700; font-display: swap; }
        @font-face { font-family: 'Cabinet Grotesk'; src: url('/fonts/fontshare/CabinetGrotesk-Variable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
        @font-face { font-family: 'Pilcrow Rounded'; src: url('/fonts/fontshare/PilcrowRounded-Variable.woff2') format('woff2'); font-weight: 400 900; font-display: swap; }
        @font-face { font-family: 'Chillax'; src: url('/fonts/fontshare/Chillax-Variable.woff2') format('woff2'); font-weight: 200 700; font-display: swap; }
        @font-face { font-family: 'Clash Grotesk'; src: url('/fonts/fontshare/ClashGrotesk-Variable.woff2') format('woff2'); font-weight: 200 700; font-display: swap; }
        @font-face { font-family: 'Clash Display'; src: url('/fonts/fontshare/ClashDisplay-Variable.woff2') format('woff2'); font-weight: 200 700; font-display: swap; }
        @font-face { font-family: 'Alpino'; src: url('/fonts/fontshare/Alpino-Variable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
        @font-face { font-family: 'Boska'; src: url('/fonts/fontshare/Boska-Variable.woff2') format('woff2'); font-weight: 200 900; font-display: swap; }
        @font-face { font-family: 'Author'; src: url('/fonts/fontshare/Author-Variable.woff2') format('woff2'); font-weight: 200 700; font-display: swap; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#181615]/10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E84A27] hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Oslo Radar</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181615]">
              Smakr Fontshare Pairing Lab
            </h1>
            <p className="text-xs sm:text-sm text-[#181615]/70 mt-1">
              Comparing 10 Fontshare pairings alongside <span className="font-comico text-[#E84A27]">COMICO</span> (wordmark + price stickers). 10 Variable `.woff2` files staged in <code className="bg-[#EFEAE0] px-1.5 py-0.5 rounded text-[11px]">public/fonts/fontshare/</code>.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#EFEAE0] border border-[#181615]/10">
            <button
              type="button"
              onClick={() => setMobilePreview(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                !mobilePreview ? "bg-[#181615] text-white" : "text-[#181615]/70"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Wide Compare</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePreview(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                mobilePreview ? "bg-[#E84A27] text-white" : "text-[#181615]/70"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>390px Mobile</span>
            </button>
          </div>
        </header>

        <div
          className={`mt-6 grid gap-6 ${
            mobilePreview ? "grid-cols-1 max-w-[390px] mx-auto" : "grid-cols-1 lg:grid-cols-2"
          }`}
        >
          {FONT_PAIRS.map((pair) => (
            <section
              key={pair.id}
              className="rounded-3xl bg-white border border-[#181615]/12 p-4 sm:p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#181615]/8">
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#E84A27]">
                    #{String(pair.id).padStart(2, "0")} · {pair.tag}
                  </span>
                  <h2 className="text-base font-extrabold text-[#181615] mt-0.5">
                    {pair.label}
                  </h2>
                  <p className="text-[11.5px] text-[#181615]/65 mt-0.5">{pair.note}</p>
                </div>
                <span className="font-comico text-xs px-2.5 py-1 rounded-full bg-[#E84A27] text-white shrink-0">
                  85 kr
                </span>
              </div>

              {/* Block 1: Smakr Weekly Pick (no star, bold kicker, full un-italic bubble) */}
              <div
                className="rounded-2xl bg-[#FAF7F2] border border-[#181615]/8 p-3"
                style={{ fontFamily: pair.bodyFamily }}
              >
                <div className="text-center mb-1.5">
                  <span
                    className="text-[11px] uppercase tracking-[0.12em] text-[#E84A27]"
                    style={{ fontFamily: pair.displayFamily, fontWeight: Math.max(pair.displayWeight, 700) }}
                  >
                    SMAKR WEEKLY PICK
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/smakr-pick-pointing.svg"
                    alt=""
                    className="w-16 h-20 object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="rounded-2xl rounded-bl-sm bg-white border border-[#E6DFD3] px-2.5 py-1.5 text-[11px] leading-snug text-[#181615]/85">
                      &ldquo;Catch U WAN&apos; SAM? this Sunday Nov 22 at Tullinløkka — don&apos;t miss the phin egg foam.&rdquo;
                    </div>
                    <h3
                      className="mt-1.5 text-[15px] leading-tight uppercase text-[#181615]"
                      style={{ fontFamily: pair.displayFamily, fontWeight: pair.displayWeight }}
                    >
                      Vietnamese Egg Coffee
                    </h3>
                    <p className="text-[11px] font-semibold text-[#181615]/75 mt-0.5">
                      📍 U WAN&apos; SAM? · Sentrum <span className="text-[#E84A27] font-bold">· 85 kr</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Block 2: Section Heading + Unified Outer-Footer Cards (Pop-Up Radar & Locals' Picks) */}
              <div
                className="rounded-2xl bg-[#FAF7F2] border border-[#181615]/8 p-3"
                style={{ fontFamily: pair.bodyFamily }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[16px] uppercase tracking-tight text-[#181615]"
                    style={{ fontFamily: pair.displayFamily, fontWeight: pair.displayWeight }}
                  >
                    Oslo Pop-Up Radar
                  </span>
                  <span className="font-comico text-[11px] text-[#E84A27]">SWIPE →</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Pop-Up Radar Outer-Footer Card */}
                  <div>
                    <div className="relative h-[160px] rounded-[20px] overflow-hidden bg-[#EDE6DA] border border-black/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/ad-slides/u_wan_sum_egg_coffee.webp"
                        alt="Vietnamese Egg Coffee"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2]/95 text-[#181615] border border-black/[0.06] text-[10px] font-bold">
                          Viet Coffee
                        </span>
                        <span className="w-6 h-6 rounded-full bg-black/45 text-white inline-flex items-center justify-center">
                          <Bookmark className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 px-0.5 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <PopupBrandWordmark venueName="U WAN' SAM?" size="sm" />
                        <span className="font-comico text-[11px] text-[#E84A27] shrink-0">85 kr</span>
                      </div>
                      <p
                        className="text-[12px] text-[#181615] leading-snug line-clamp-1"
                        style={{ fontFamily: pair.displayFamily, fontWeight: pair.displayWeight }}
                      >
                        Vietnamese Egg Coffee
                      </p>
                      <p className="text-[10.5px] text-[#181615]/60">Upcoming · Nov 22 · Sentrum</p>
                    </div>
                  </div>

                  {/* Locals' Picks Outer-Footer Card */}
                  <div>
                    <div className="relative h-[160px] rounded-[20px] overflow-hidden bg-[#EDE6DA] border border-black/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/ad-slides/crantz_cookies_popup.webp"
                        alt="Pork Gyoza"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2]/95 text-[#181615] border border-black/[0.06] text-[10px] font-bold">
                          95 kr
                        </span>
                        <span className="w-6 h-6 rounded-full bg-black/45 text-white inline-flex items-center justify-center">
                          <Bookmark className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="absolute bottom-2 inset-x-2.5">
                        <p
                          className="text-[13px] text-white uppercase leading-tight line-clamp-2 drop-shadow-xs"
                          style={{ fontFamily: pair.displayFamily, fontWeight: pair.displayWeight }}
                        >
                          Pork Gyoza
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 px-0.5 space-y-1">
                      <p className="text-[11px] font-bold text-[#181615] truncate">
                        Koie Ramen · Torggata · <span className="text-[#E84A27]">95 kr</span>
                      </p>
                      <p className="text-[10.5px] leading-snug text-[#181615]/75 line-clamp-2">
                        <span className="font-bold text-[#181615]">@majak</span> · Worth crossing town for this broth
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
