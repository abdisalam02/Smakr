import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PLACES_API_BASE } from "@/lib/places/google";
import type { StagedCandidateSpot } from "@/app/api/admin/seeding-lab/route";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getStagedFilePath(): string {
  const p1 = path.join(process.cwd(), "curation", "staged_candidates.json");
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), "frontend", "curation", "staged_candidates.json");
  if (fs.existsSync(p2)) return p2;
  return p1;
}

function resolveGeminiApiKey(): string {
  const fromEnv =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  if (fromEnv.trim()) return fromEnv.trim();
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const match =
      content.match(/^GEMINI_API_KEY=(.+)$/m) ||
      content.match(/^GOOGLE_GENERATIVE_AI_API_KEY=(.+)$/m);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore fs read errors
  }
  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export interface AiShiftSpotProposal {
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours_text: string;
  signature_dish: string;
  price_nok?: number | null;
  why_curated?: string;
  notes?: string;
  popup_meta: {
    brand_id: string;
    residency_status: "active" | "next_confirmed" | "between_residencies";
    dates_label: string;
    daily_hours: string;
    next_drop_date?: string | null;
    portion_cap?: string | null;
    host_venue_name: string;
    host_address: string;
    instagram_url?: string | null;
    entry_type: "walk_in" | "rsvp" | "ticketed";
  };
}

interface OsloHostPreset {
  keywords: string[];
  host_venue_name: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
}

const OSLO_HOST_PRESETS: OsloHostPreset[] = [
  {
    keywords: ["mike's corner", "mikes corner", "operagata", "oslobukta", "bjørvika", "bjorvika"],
    host_venue_name: "Mike's Corner, Oslobukta",
    address: "Mike's Corner, Operagata 77d, Oslo",
    neighborhood: "bjorvika",
    latitude: 59.9075,
    longitude: 10.7582,
  },
  {
    keywords: ["trekanten", "pilestredet 24", "pilestredet"],
    host_venue_name: "Trekanten",
    address: "Trekanten Residency, Pilestredet 24, Oslo",
    neighborhood: "sentrum",
    latitude: 59.9182,
    longitude: 10.7376,
  },
  {
    keywords: ["vippa", "akershusstranda"],
    host_venue_name: "Vippa Food Hall",
    address: "Vippa Food Hall, Akershusstranda 25, Oslo",
    neighborhood: "sentrum",
    latitude: 59.9029,
    longitude: 10.741,
  },
  {
    keywords: ["vulkan", "mathallen", "grünerløkka", "grunerlokka", "løkka"],
    host_venue_name: "Vulkan Oslo",
    address: "Vulkan Residency, Oslo",
    neighborhood: "grunerlokka",
    latitude: 59.9222,
    longitude: 10.7519,
  },
  {
    keywords: ["becco", "kristian augusts"],
    host_venue_name: "Becco Wine Bar",
    address: "Kristian Augusts gate 11, Oslo",
    neighborhood: "sentrum",
    latitude: 59.9167,
    longitude: 10.7378,
  },
  {
    keywords: ["bånkall", "bankall", "trondheimsveien"],
    host_venue_name: "Bånkall Gård",
    address: "Bånkall Gård Supper Club, Oslo",
    neighborhood: "groruddalen",
    latitude: 59.9632,
    longitude: 10.8745,
  },
  {
    keywords: ["frogner", "oscars gate", "bygdøy"],
    host_venue_name: "Frogner Pop-Up Space",
    address: "Frogner Pop-Ups, Oslo",
    neighborhood: "frogner",
    latitude: 59.9195,
    longitude: 10.7061,
  },
  {
    keywords: ["torggata", "youngstorget", "kulturhuset"],
    host_venue_name: "Torggata Residency",
    address: "Torggata, Oslo",
    neighborhood: "torggata",
    latitude: 59.9148,
    longitude: 10.7501,
  },
  {
    keywords: ["grønland", "gronland", "tøyen", "toyen"],
    host_venue_name: "Grønland / Tøyen Pop-Up",
    address: "Grønland, Oslo",
    neighborhood: "gronland",
    latitude: 59.9132,
    longitude: 10.7634,
  },
  {
    keywords: ["løren", "loren", "hasle"],
    host_venue_name: "Løren Torg",
    address: "Løren Torg, Oslo",
    neighborhood: "hasle",
    latitude: 59.9304,
    longitude: 10.7915,
  },
];

function matchOsloHostPreset(text: string): OsloHostPreset | null {
  const lower = text.toLowerCase();
  for (const preset of OSLO_HOST_PRESETS) {
    if (preset.keywords.some((kw) => lower.includes(kw))) {
      return preset;
    }
  }
  return null;
}

async function callGeminiShiftParser(
  apiKey: string,
  rawText: string,
  currentSpot: Partial<StagedCandidateSpot>
): Promise<Partial<AiShiftSpotProposal> | null> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  const prompt = `You are the lead culinary data curator for Smakr Oslo.
Parse the curator's natural language update or Instagram announcement and produce a structured JSON update for this Oslo food spot / pop-up.

CURRENT SPOT STATE:
${JSON.stringify(
  {
    id: currentSpot.id,
    name: currentSpot.name,
    neighborhood: currentSpot.neighborhood,
    address: currentSpot.address,
    latitude: currentSpot.latitude,
    longitude: currentSpot.longitude,
    spot_type: currentSpot.spot_type,
    signature_dish: currentSpot.signature_dish || currentSpot.dish_highlights?.[0]?.dish_name,
    price_nok: currentSpot.dish_highlights?.[0]?.price_nok,
    notes: currentSpot.notes,
  },
  null,
  2
)}

NEW UPDATE / ANNOUNCEMENT FROM CURATOR:
"""
${rawText}
"""

OSLO HOST VENUE REFERENCE:
- Mike's Corner (Oslobukta / Bjørvika): neighborhood="bjorvika", address="Mike's Corner, Operagata 77d, Oslo", lat=59.9075, lng=10.7582
- Trekanten (Pilestredet 24): neighborhood="sentrum", address="Trekanten Residency, Pilestredet 24, Oslo", lat=59.9182, lng=10.7376
- Vippa Food Hall: neighborhood="sentrum", address="Vippa Food Hall, Akershusstranda 25, Oslo", lat=59.9029, lng=10.7410
- Vulkan / Mathallen: neighborhood="grunerlokka", address="Vulkan Residency, Oslo", lat=59.9222, lng=10.7519
- Becco: neighborhood="sentrum", address="Kristian Augusts gate 11, Oslo", lat=59.9167, lng=10.7378

Return STRICT JSON matching this exact shape:
{
  "neighborhood": string (lowercase slug e.g. "bjorvika", "grunerlokka", "sentrum", "frogner", "torggata", "gronland", "toyen"),
  "address": string (clean host/residency address in Oslo, no raw postal codes unless helpful),
  "latitude": number,
  "longitude": number,
  "opening_hours_text": string (e.g. "Thu Nov 14 · 12:00 until sold out"),
  "signature_dish": string,
  "price_nok": number | null (numeric NOK price if mentioned, else keep existing),
  "popup_meta": {
    "residency_status": "active" | "next_confirmed" | "between_residencies",
    "dates_label": string (short punchy badge <= 24 chars, e.g. "Nov 14 · 12:00" or "Live Weekend Drop" or "Dates TBA"),
    "daily_hours": string (e.g. "Thu Nov 14 · 12:00 until sold out"),
    "next_drop_date": string | null (ISO date string e.g. "2026-11-14T12:00:00" if a specific future date is mentioned),
    "portion_cap": string | null (e.g. "80 cups only" or "Limited Kyoto Matcha Batches"),
    "host_venue_name": string (e.g. "Mike's Corner, Oslobukta"),
    "host_address": string (e.g. "Operagata 77d, Oslo"),
    "entry_type": "walk_in" | "rsvp" | "ticketed"
  }
}`;

  for (const model of models) {
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOut) {
            return JSON.parse(textOut);
          }
        }
      } catch {
        // try next endpoint
      }
    }
  }
  return null;
}

function deterministicShiftParser(
  rawText: string,
  currentSpot: Partial<StagedCandidateSpot>
): AiShiftSpotProposal {
  const preset = matchOsloHostPreset(rawText);
  const existingMeta = ((currentSpot as any)?.popup_meta || {}) as Record<string, any>;
  const extractedIg =
    (currentSpot as any)?.instagram_url ||
    existingMeta.instagram_url ||
    rawText.match(/https:\/\/(www\.)?instagram\.com\/[^\s"')]+/i)?.[0] ||
    currentSpot.notes?.match(/https:\/\/(www\.)?instagram\.com\/[^\s"')]+/i)?.[0] ||
    null;

  // Parse date/month mentions (e.g. "NOV 14th", "Nov 14", "14. nov", "this saturday")
  const monthMatch = rawText.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  );
  const dayFirstMatch = rawText.match(
    /\b(\d{1,2})\.?\s*(jan(?:uar)?|feb(?:ruar)?|mar(?:s)?|apr(?:il)?|mai|jun(?:i)?|jul(?:i)?|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)\b/i
  );

  // Parse time mentions (e.g. "12pm", "12:00", "kl 12", "17:00")
  const timeMatch =
    rawText.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
    rawText.match(/\b(?:kl\.?\s*|at\s+|@)?(\d{1,2}):(\d{2})\b/i);

  let formattedTime = "";
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] || "00";
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    formattedTime = `${String(hour).padStart(2, "0")}:${min}`;
  }

  let formattedDate = "";
  let isoDate: string | null = null;
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mai: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11,
  };

  if (monthMatch) {
    const mKey = monthMatch[1].slice(0, 3).toLowerCase();
    const mIdx = monthMap[mKey] ?? 10;
    const dayNum = parseInt(monthMatch[2], 10);
    formattedDate = `${monthNamesShort[mIdx]} ${dayNum}`;
    const timePart = formattedTime || "12:00";
    isoDate = `2026-${String(mIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}T${timePart}:00`;
  } else if (dayFirstMatch) {
    const dayNum = parseInt(dayFirstMatch[1], 10);
    const mKey = dayFirstMatch[2].slice(0, 3).toLowerCase();
    const mIdx = monthMap[mKey] ?? 10;
    formattedDate = `${monthNamesShort[mIdx]} ${dayNum}`;
    const timePart = formattedTime || "12:00";
    isoDate = `2026-${String(mIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}T${timePart}:00`;
  }

  const isTBA = /\b(tba|between residencies|seasonal|paused|inactive|announcing soon)\b/i.test(rawText);
  const isLiveNow = /\b(live now|open today|happening now|active now)\b/i.test(rawText);

  const residencyStatus: "active" | "next_confirmed" | "between_residencies" = isTBA
    ? "between_residencies"
    : formattedDate && !isLiveNow
    ? "next_confirmed"
    : "active";

  const datesLabel = isTBA
    ? "Dates TBA"
    : formattedDate
    ? `${formattedDate}${formattedTime ? ` · ${formattedTime}` : ""}`
    : existingMeta.dates_label || "Pop-Up Drop";

  const dailyHours = isTBA
    ? "Dates & location announcing soon"
    : formattedDate
    ? `${formattedDate}${formattedTime ? ` · ${formattedTime} until sold out` : " · Until sold out"}`
    : formattedTime
    ? `${formattedTime} – Until sold out`
    : existingMeta.daily_hours || "Drop Days · Until sold out";

  const portionMatch = rawText.match(/\b(\d+\s*(?:cups|bowls|portions|pizzas|boxes|cookies|buns|servings)(?:\s*only|\s*per\s*day|\s*\/?\s*night)?)\b/i);
  const portionCap = portionMatch
    ? portionMatch[1]
    : existingMeta.portion_cap || "Limited Batch Drop";

  const priceMatch = rawText.match(/\b(\d{2,3})\s*(?:kr|nok|,-)\b/i);
  const priceNok = priceMatch
    ? parseInt(priceMatch[1], 10)
    : currentSpot.dish_highlights?.[0]?.price_nok ?? null;

  const hostVenueName =
    preset?.host_venue_name ||
    existingMeta.host_venue_name ||
    currentSpot.address?.replace(/,\s*Oslo/i, "").trim() ||
    "Oslo Pop-Up Residency";

  const address = preset?.address || currentSpot.address || "Oslo, Norway";
  const neighborhood = preset?.neighborhood || currentSpot.neighborhood || "sentrum";
  const latitude = preset?.latitude ?? currentSpot.latitude ?? 59.9139;
  const longitude = preset?.longitude ?? currentSpot.longitude ?? 10.7522;

  return {
    neighborhood,
    address,
    latitude,
    longitude,
    opening_hours_text: dailyHours,
    signature_dish:
      currentSpot.signature_dish ||
      currentSpot.dish_highlights?.[0]?.dish_name ||
      "Signature Drop",
    price_nok: priceNok,
    why_curated: currentSpot.why_curated,
    notes: `Next Drop: ${dailyHours} at ${hostVenueName} (${address}).${extractedIg ? ` Instagram: ${extractedIg}` : ""}`,
    popup_meta: {
      brand_id: slugify(currentSpot.id || currentSpot.name || "popup"),
      residency_status: residencyStatus,
      dates_label: datesLabel,
      daily_hours: dailyHours,
      next_drop_date: isoDate || existingMeta.next_drop_date || null,
      portion_cap: portionCap,
      host_venue_name: hostVenueName,
      host_address: address,
      instagram_url: extractedIg,
      entry_type: "walk_in",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "preview", spotId, rawText = "", proposal: incomingProposal } = body as {
      mode?: "preview" | "apply";
      spotId: string;
      rawText?: string;
      proposal?: AiShiftSpotProposal;
    };

    const filePath = getStagedFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Staged candidates file not found" }, { status: 404 });
    }

    const candidates: StagedCandidateSpot[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const spotIdx = candidates.findIndex((s) => s.id === spotId);
    if (spotIdx === -1) {
      return NextResponse.json({ error: `Candidate spot "${spotId}" not found.` }, { status: 404 });
    }

    const currentSpot = candidates[spotIdx];

    // =========================================================================
    // MODE 1: PREVIEW — Parse raw natural language announcement into diff
    // =========================================================================
    if (mode === "preview") {
      if (!rawText.trim()) {
        return NextResponse.json({ error: "Please enter announcement or update text." }, { status: 400 });
      }

      const fallbackProposal = deterministicShiftParser(rawText, currentSpot);
      const apiKey = resolveGeminiApiKey();
      let aiPartial: Partial<AiShiftSpotProposal> | null = null;

      if (apiKey) {
        aiPartial = await callGeminiShiftParser(apiKey, rawText, currentSpot);
      }

      const preset = matchOsloHostPreset(rawText);

      // Merge AI extraction with deterministic preset accuracy so coordinates & Oslo neighborhoods are 100% reliable
      const merged: AiShiftSpotProposal = {
        neighborhood: (preset?.neighborhood || aiPartial?.neighborhood || fallbackProposal.neighborhood).toLowerCase(),
        address: preset?.address || aiPartial?.address || fallbackProposal.address,
        latitude: preset?.latitude ?? aiPartial?.latitude ?? fallbackProposal.latitude,
        longitude: preset?.longitude ?? aiPartial?.longitude ?? fallbackProposal.longitude,
        opening_hours_text: aiPartial?.opening_hours_text || fallbackProposal.opening_hours_text,
        signature_dish: aiPartial?.signature_dish || fallbackProposal.signature_dish,
        price_nok:
          aiPartial?.price_nok !== undefined ? aiPartial.price_nok : fallbackProposal.price_nok,
        why_curated: currentSpot.why_curated,
        notes: fallbackProposal.notes,
        popup_meta: {
          brand_id: fallbackProposal.popup_meta.brand_id,
          residency_status:
            aiPartial?.popup_meta?.residency_status || fallbackProposal.popup_meta.residency_status,
          dates_label: (
            aiPartial?.popup_meta?.dates_label || fallbackProposal.popup_meta.dates_label
          ).replace(/\s*Drop$/i, ""),
          daily_hours:
            aiPartial?.popup_meta?.daily_hours || fallbackProposal.popup_meta.daily_hours,
          next_drop_date:
            aiPartial?.popup_meta?.next_drop_date ?? fallbackProposal.popup_meta.next_drop_date,
          portion_cap:
            aiPartial?.popup_meta?.portion_cap || fallbackProposal.popup_meta.portion_cap,
          host_venue_name:
            preset?.host_venue_name ||
            aiPartial?.popup_meta?.host_venue_name ||
            fallbackProposal.popup_meta.host_venue_name,
          host_address:
            preset?.address ||
            aiPartial?.popup_meta?.host_address ||
            fallbackProposal.popup_meta.host_address,
          instagram_url: fallbackProposal.popup_meta.instagram_url,
          entry_type:
            aiPartial?.popup_meta?.entry_type || fallbackProposal.popup_meta.entry_type,
        },
      };

      // Optional Google Places coordinate lookup if no local Oslo preset matched and AI didn't change coords
      const googleKey = process.env.GOOGLE_PLACES_API_KEY;
      if (
        !preset &&
        googleKey &&
        merged.popup_meta.host_venue_name &&
        !merged.popup_meta.host_venue_name.toLowerCase().includes("tba")
      ) {
        try {
          const gRes = await fetch(`${PLACES_API_BASE}/places:searchText`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": googleKey,
              "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
            },
            body: JSON.stringify({
              textQuery: `${merged.popup_meta.host_venue_name} Oslo`,
              maxResultCount: 1,
            }),
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            const place = gData?.places?.[0];
            if (place?.location?.latitude && place?.location?.longitude) {
              merged.latitude = place.location.latitude;
              merged.longitude = place.location.longitude;
              if (place.formattedAddress) {
                merged.address = place.formattedAddress.replace(/,\s*Norway$/i, "");
              }
            }
          }
        } catch {
          // keep merged coordinates
        }
      }

      return NextResponse.json({
        success: true,
        proposal: merged,
      });
    }

    // =========================================================================
    // MODE 2: APPLY — Persist to staged_candidates.json + venues + food_posts
    // =========================================================================
    if (!incomingProposal) {
      return NextResponse.json({ error: "Missing proposal payload to apply." }, { status: 400 });
    }

    // 1. Update staged_candidates.json
    const updatedSpot: StagedCandidateSpot & Record<string, any> = {
      ...currentSpot,
      neighborhood: incomingProposal.neighborhood,
      address: incomingProposal.address,
      latitude: Number(incomingProposal.latitude),
      longitude: Number(incomingProposal.longitude),
      signature_dish: incomingProposal.signature_dish || currentSpot.signature_dish,
      notes:
        incomingProposal.notes ||
        `Next Drop: ${incomingProposal.popup_meta.daily_hours} at ${incomingProposal.popup_meta.host_venue_name}.${
          incomingProposal.popup_meta.instagram_url
            ? ` Instagram: ${incomingProposal.popup_meta.instagram_url}`
            : ""
        }`,
      popup_meta: incomingProposal.popup_meta,
    };

    if (updatedSpot.dish_highlights && updatedSpot.dish_highlights.length > 0) {
      updatedSpot.dish_highlights = updatedSpot.dish_highlights.map((d, idx) => {
        if (idx === 0) {
          return {
            ...d,
            dish_name: incomingProposal.signature_dish || d.dish_name,
            price_nok:
              typeof incomingProposal.price_nok === "number" && incomingProposal.price_nok > 0
                ? incomingProposal.price_nok
                : d.price_nok,
          };
        }
        return d;
      });
    }

    candidates[spotIdx] = updatedSpot;
    fs.writeFileSync(filePath, JSON.stringify(candidates, null, 2), "utf8");

    // 2. Sync to Supabase (`venues` + `food_posts`) if Supabase admin client is available
    const supabase = getAdminClient();
    let syncedVenueId: string | null = null;
    let syncedPostsCount = 0;

    if (supabase) {
      const { data: existingVenue } = await supabase
        .from("venues")
        .select("id, name, vibe_signals")
        .ilike("name", updatedSpot.name)
        .maybeSingle();

      if (existingVenue) {
        syncedVenueId = existingVenue.id;
        const prevSignals =
          existingVenue.vibe_signals && typeof existingVenue.vibe_signals === "object"
            ? (existingVenue.vibe_signals as Record<string, unknown>)
            : {};

        const signatureDishes = updatedSpot.signature_dish
          ? [
              updatedSpot.signature_dish,
              ...updatedSpot.dish_highlights
                .map((d) => d.dish_name)
                .filter((n) => n !== updatedSpot.signature_dish),
            ]
          : updatedSpot.dish_highlights.map((d) => d.dish_name);

        const { error: venueUpdateErr } = await supabase
          .from("venues")
          .update({
            address: updatedSpot.address,
            neighborhood: updatedSpot.neighborhood,
            latitude: updatedSpot.latitude,
            longitude: updatedSpot.longitude,
            signature_dishes: signatureDishes,
            current_opening_hours_text: incomingProposal.opening_hours_text,
            website_uri: incomingProposal.popup_meta.instagram_url || undefined,
            updated_at: new Date().toISOString(),
            vibe_signals: {
              ...prevSignals,
              icon: updatedSpot.icon,
              spot_type: updatedSpot.spot_type,
              popup_meta: incomingProposal.popup_meta,
            },
          })
          .eq("id", existingVenue.id);

        if (venueUpdateErr) {
          throw new Error(`Failed to update venue in Supabase: ${venueUpdateErr.message}`);
        }

        // 3. Sync linked `food_posts` rows in Supabase so live feed cards immediately reflect changes
        const postUpdates: Record<string, unknown> = {
          drop_badge: incomingProposal.popup_meta.dates_label,
          updated_at: new Date().toISOString(),
        };
        if (typeof incomingProposal.price_nok === "number" && incomingProposal.price_nok > 0) {
          postUpdates.price_nok = incomingProposal.price_nok;
        }
        if (incomingProposal.signature_dish) {
          postUpdates.dish_name = incomingProposal.signature_dish;
        }

        const { data: updatedPosts, error: postsUpdateErr } = await supabase
          .from("food_posts")
          .update(postUpdates)
          .eq("venue_id", existingVenue.id)
          .select("id");

        if (!postsUpdateErr && updatedPosts) {
          syncedPostsCount = updatedPosts.length;
        }
      }
    }

    try {
      revalidateTag("venues");
      revalidateTag("food_posts");
      revalidatePath("/");
    } catch {
      // ignore outside Next request context
    }

    return NextResponse.json({
      success: true,
      spot: updatedSpot,
      syncedVenueId,
      syncedPostsCount,
    });
  } catch (err: any) {
    console.error("AI Shift Spot error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process AI Shift Spot" },
      { status: 500 }
    );
  }
}
