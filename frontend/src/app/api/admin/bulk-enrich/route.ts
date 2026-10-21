import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  PLACES_API_BASE,
  PLACES_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  inferNeighborhood,
  type GooglePlaceNew,
  type PlaceResult,
} from "@/lib/places/google";
import { resolveFoodCategoryAndIcon } from "@/lib/categoryResolver";
import { curatedVenuePhotos } from "@/lib/places/curatedPhotos";
import type { DietaryTag, FoodCategory, ReviewItem } from "@/types";

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

async function verifyAdminAuth(): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = getAdminClient();
  if (!admin) return false;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin";
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
    // ignore
  }
  return "";
}

async function callGeminiGenerateContent(
  apiKey: string,
  contents: Array<Record<string, unknown>>,
  temperature = 0.35
) {
  const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

  for (const model of models) {
    const endpoints = apiKey.startsWith("AQ.")
      ? [
          `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        ]
      : [
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`,
        ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature,
              responseMimeType: "application/json",
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) return rawText as string;
        }
      } catch {
        // try next
      }
    }
  }
  return null;
}

function cleanVenueName(googleName: string, userInputName?: string): string {
  if (!googleName) return (userInputName || "").trim();

  let name = googleName.trim();

  // If user provided a clean brand name (e.g. "House of Mandi", "Dirty Taco", "Zamzam"),
  // and Google returned an SEO-stuffed string with taglines or secondary languages:
  if (userInputName && userInputName.trim().length >= 3) {
    const cleanUser = userInputName.trim();
    const userLower = cleanUser.toLowerCase();
    const googleLower = name.toLowerCase();
    if (googleLower.includes(userLower) && name.length > cleanUser.length + 6) {
      return cleanUser;
    }
    if (userLower.includes("mandi") && googleLower.includes("mandi")) {
      return "Mandi House";
    }
  }

  // Strip non-Latin scripts (Arabic, Cyrillic, Chinese, etc.) if Latin text is present
  if (/[a-zA-ZæøåÆØÅ]/.test(name)) {
    name = name.replace(/[^\x00-\x7F\u00C0-\u017F\u0180-\u024F\u1E00-\u1EFF\s.,\-–—'’&()]/g, " ");
  }

  // Strip dot-separated subheadings e.g. ".yemeni restaurant"
  name = name.replace(/\s*\.[a-zA-Z\s]+$/i, "");

  // Strip hyphens/pipes/slashes with promotional taglines
  name = name.replace(/\s*[-–—|•·/]\s*(?:halal|best|authentic|catering|takeaway|delivery|oslo|yemeni|norway).*$/i, "");

  // Clean trailing "avd HASLE" -> "(Hasle)"
  name = name.replace(/\s+avd\.?\s+([a-zA-ZæøåÆØÅ]+)/i, (_, branch) =>
    branch ? ` (${branch[0].toUpperCase()}${branch.slice(1).toLowerCase()})` : ""
  );

  // Remove redundant trailing "restaurant Oslo", "restaurant", "cafe Oslo", etc.
  name = name.replace(/\s+(?:restaurant|bar|cafe|café|kjøkken|kitchen|eatery)\s+oslo\b/i, "");
  name = name.replace(/\s+oslo\s+norway\b/i, "");
  name = name.replace(/\s+oslo\b/i, "");

  // Collapse whitespace and trim trailing punctuation
  name = name.replace(/\s+/g, " ").replace(/[\s,.-]+$/, "").trim();

  return name || googleName;
}

export interface ParsedLine {
  rawLine: string;
  venueName: string;
  neighborhoodHint?: string;
  dishName?: string;
  priceNok?: number;
}

function parseRawLine(line: string): ParsedLine {
  const raw = line.trim();
  if (!raw) return { rawLine: raw, venueName: "" };

  let working = raw;

  // 1. Extract Price (e.g. "(185 kr)", "185kr", "185 NOK", "185,-", "185")
  let priceNok: number | undefined;
  const priceMatch = working.match(/\(?(\d{2,4})\s*(?:kr|nok|,-)?\)?$/i);
  if (priceMatch) {
    priceNok = parseInt(priceMatch[1], 10);
    working = working.replace(/\(?(\d{2,4})\s*(?:kr|nok|,-)?\)?$/i, "").trim();
  }

  // 2. Check for delimiter between Venue and Dish: e.g. "Venue -- find meal", "Venue --- cheesesteak", "Venue --", "Venue - Dish"
  let venuePart = working;
  let dishPart: string | undefined;

  // Matches 1 or more dashes, em-dashes, or colons
  const dashMatch = working.match(/^(.+?)\s*(?:[-–—:]+)\s*(.*)$/);
  if (dashMatch) {
    venuePart = dashMatch[1].trim();
    const rawDish = dashMatch[2].trim();
    // Check if rawDish is empty or is a trigger phrase like "find meal", "find dish", "auto", "meal", etc.
    const isAutoTrigger =
      !rawDish ||
      /^(?:find\s*(?:meal|dish|food)?|auto|signature|best|pick|any)$/i.test(rawDish);

    if (!isAutoTrigger) {
      dishPart = rawDish;
    }
  }

  // 3. Strip any remaining trailing dashes or colons from venuePart
  venuePart = venuePart.replace(/[\s\-–—:]+$/, "").trim();

  // 4. Check for comma in venuePart for neighborhood hint: e.g. "Hot Temper, Grünerløkka"
  let venueName = venuePart;
  let neighborhoodHint: string | undefined;
  const commaMatch = venuePart.match(/^(.+?),\s*(.+)$/);
  if (commaMatch) {
    venueName = commaMatch[1].trim();
    neighborhoodHint = commaMatch[2].trim();
  }

  return {
    rawLine: raw,
    venueName: venueName || working,
    neighborhoodHint,
    dishName: dishPart,
    priceNok,
  };
}

export interface EnrichedStagingItem {
  id: string;
  rawInput: string;
  venueName: string;
  formattedAddress: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  googleRating: number | null;
  googleReviewsCount: number;
  priceLevel: string;
  openNow: boolean;
  openingHoursText: string[];
  reviews: ReviewItem[];
  photoUrls: string[];
  selectedPhoto: string;
  // Dish parameters
  dishName: string;
  priceNok: number;
  tasteNote: string;
  category: FoodCategory;
  icon: string;
  dietaryTags: DietaryTag[];
  dinerQuote?: string;
  included: boolean;
}

async function lookupGooglePlace(venueQuery: string, category: string): Promise<PlaceResult> {
  const KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (KEY) {
    try {
      const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask": PLACES_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: `${venueQuery} Oslo Norway`,
          maxResultCount: 5,
          languageCode: "en",
          regionCode: "NO",
          locationBias: {
            circle: {
              center: { latitude: 59.9139, longitude: 10.7522 },
              radius: 25000.0,
            },
          },
        }),
        cache: "no-store",
      });
      const data = (await res.json()) as { places?: GooglePlaceNew[] };
      if (data.places && data.places.length > 0) {
        // Prioritize candidates strictly inside Oslo / Greater Oslo bounds (lat 59.5-60.5, lng 10.0-11.5)
        const osloPlace =
          data.places.find((p) => {
            const lat = p.location?.latitude;
            const lng = p.location?.longitude;
            if (typeof lat === "number" && typeof lng === "number") {
              return lat >= 59.5 && lat <= 60.5 && lng >= 10.0 && lng <= 11.5;
            }
            return true;
          }) || data.places[0];
        return mapGooglePlace(osloPlace, category);
      }
    } catch (err) {
      console.warn(`[bulk-enrich] Google lookup failed for "${venueQuery}":`, err);
    }
  }
  return mockPlace(`${venueQuery} Oslo`, category);
}

function resolveFallbackPrice(dishName: string, venueName: string, category: string): number {
  const combined = `${dishName} ${venueName} ${category}`.toLowerCase();
  if (combined.includes("mandi")) {
    return 225;
  }
  if (combined.includes("cheesesteak") || combined.includes("zamzam")) {
    return 175;
  }
  if (combined.includes("ramen") || combined.includes("tonkotsu")) {
    return 215;
  }
  if (combined.includes("pizza")) {
    return 225;
  }
  if (combined.includes("burger") || combined.includes("smash")) {
    return 185;
  }
  if (combined.includes("sushi")) {
    return 235;
  }
  if (combined.includes("pasta")) {
    return 210;
  }
  if (combined.includes("dumpling") || combined.includes("bao") || combined.includes("taco") || combined.includes("kebab")) {
    return 145;
  }
  if (/\b(?:coffee|espresso|latte|cortado|cappuccino)\b/i.test(combined)) {
    return 62;
  }
  if (combined.includes("matcha") || /\btea\b/i.test(combined)) {
    return 74;
  }
  if (combined.includes("cardamom") || /\bbun\b/i.test(combined) || combined.includes("croissant") || combined.includes("bakery")) {
    return 58;
  }
  return 175;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];

    const parsedLines: ParsedLine[] = lines
      .map((l: unknown) => (typeof l === "string" ? parseRawLine(l) : null))
      .filter((p: ParsedLine | null): p is ParsedLine => Boolean(p && p.venueName));

    if (parsedLines.length === 0) {
      return NextResponse.json({ error: "No valid venue lines provided." }, { status: 400 });
    }

    const apiKey = resolveGeminiApiKey();

    // Concurrency pool (max 3-4 parallel lookups)
    const concurrency = 3;
    const enrichedItems: EnrichedStagingItem[] = [];

    for (let i = 0; i < parsedLines.length; i += concurrency) {
      const slice = parsedLines.slice(i, i + concurrency);
      const chunkPromises = slice.map(async (parsed) => {
        // Initial category guess for Places search
        const initialCat = resolveFoodCategoryAndIcon(parsed.dishName || "", parsed.venueName);
        const place = await lookupGooglePlace(parsed.venueName, initialCat.category);

        // Build up to 8 photo URLs
        let photoUrls: string[] = [];
        if (place.photos && place.photos.length > 0) {
          photoUrls = place.photos
            .filter((p) => typeof p === "string" && !p.startsWith("mock:"))
            .slice(0, 8)
            .map((ref) => `/api/places/photos?ref=${encodeURIComponent(ref)}&w=800`);
        }
        if (photoUrls.length === 0) {
          photoUrls = curatedVenuePhotos(initialCat.category, 6);
        }

        // Reviews snippet for AI
        const reviewTexts = (place.reviews || []).map((r) => r.text).filter(Boolean).slice(0, 5);

        // Gemini auto-enrichment
        let dishName = parsed.dishName || "";
        let priceNok = parsed.priceNok || 0;
        let tasteNote = "";
        let category: FoodCategory = initialCat.category;
        let icon = initialCat.icon;
        let dietaryTags: DietaryTag[] = [];
        let dinerQuote = reviewTexts[0] || "";

        if (apiKey) {
          const prompt = [
            `You are a master Oslo food editor for Smakr Oslo.`,
            `Input line from admin: "${parsed.rawLine}"`,
            `Venue Name found on Google: "${place.name}" (${place.formatted_address}) in Oslo, Norway.`,
            parsed.dishName
              ? `Provided Dish: "${parsed.dishName}". Clean, format, and capitalize it.`
              : `User provided NO dish name (or requested "find meal"). INFER the single most famous, craveable signature order for "${place.name}" in Oslo from diner reviews, menu data, or Oslo food culture!`,
            parsed.priceNok
              ? `Provided Price: ${parsed.priceNok} kr.`
              : `User provided NO price. Suggest a realistic Oslo restaurant/cafe price in NOK integer (e.g. 58-75 kr for bakery/coffee, 140-185 kr for street food/burger/sandwich/taco/cheesesteak, 195-255 kr for ramen/pizza/mandi/mains).`,
            reviewTexts.length > 0 ? `Google diner review snippets: ${JSON.stringify(reviewTexts)}` : ``,
            ``,
            `Return strict JSON with this exact schema:`,
            `{`,
            `  "dishName": string, // Clean Title Case dish name (2-5 words)`,
            `  "priceNok": number, // Realistic Oslo price in NOK integer`,
            `  "tasteNote": string, // 12-16 word concrete, appetizing taste note focusing on crust, broth, texture or flavor craftsmanship`,
            `  "category": string, // One of: "mandi_rice", "middle_eastern", "coffee", "matcha", "bakery", "ramen", "burger", "pizza", "street_food", "sushi", "dessert", "drinks", "dumplings", "tacos", "bao", "fried_chicken", "kebab", "vietnamese", "indian", "pasta"`,
            `  "dietaryTags": string[], // Subset of ["vegan", "vegetarian", "halal", "gluten_free"]`,
            `  "dinerQuote": string // The most mouth-watering 1-sentence diner quote from reviews` ,
            `}`,
          ]
            .filter(Boolean)
            .join("\n");

          const rawReply = await callGeminiGenerateContent(
            apiKey,
            [{ role: "user", parts: [{ text: prompt }] }],
            0.25
          );

          if (rawReply) {
            try {
              const parsedAi = JSON.parse(rawReply);
              if (parsedAi.dishName) dishName = parsedAi.dishName.trim();
              if (typeof parsedAi.priceNok === "number" && parsedAi.priceNok > 0) {
                priceNok = parsedAi.priceNok;
              }
              if (parsedAi.tasteNote) tasteNote = parsedAi.tasteNote.trim();
              if (parsedAi.category) {
                const catDef = resolveFoodCategoryAndIcon(dishName, place.name, [parsedAi.category]);
                category = catDef.category;
                icon = catDef.icon;
              }
              if (Array.isArray(parsedAi.dietaryTags)) {
                dietaryTags = parsedAi.dietaryTags.filter((t: string): t is DietaryTag =>
                  ["vegan", "vegetarian", "halal", "gluten_free"].includes(t)
                );
              }
              if (parsedAi.dinerQuote) dinerQuote = parsedAi.dinerQuote.trim();
            } catch {
              // fallback below
            }
          }
        }

        // Clean Fallbacks
        if (!dishName) {
          const lowerVenue = place.name.toLowerCase();
          if (lowerVenue.includes("mandi")) dishName = "Lamb Mandi Platter";
          else if (lowerVenue.includes("zamzam")) dishName = "Philly Cheesesteak";
          else if (lowerVenue.includes("taco")) dishName = "Birria Tacos with Consomé";
          else if (lowerVenue.includes("ramen")) dishName = "Spicy Miso Tonkotsu Ramen";
          else if (lowerVenue.includes("burger")) dishName = "Classic Double Smash Burger";
          else if (lowerVenue.includes("pizza")) dishName = "Artisanal Margherita Pizza";
          else {
            const auto = resolveFoodCategoryAndIcon("", place.name);
            dishName = `${auto.label} Specialty`;
          }
        }
        if (!priceNok) {
          priceNok = resolveFallbackPrice(dishName, place.name, category);
        }
        if (!tasteNote) {
          const combined = `${dishName} ${place.name} ${category}`.toLowerCase();
          if (combined.includes("mandi") || combined.includes("kabsa") || combined.includes("bariis")) {
            tasteNote = "Fall-apart tender spiced lamb over fragrant cardamom-studded rice with crispy fried onions and fiery sahawiq.";
          } else if (combined.includes("cheesesteak") || combined.includes("zamzam")) {
            tasteNote = "Thinly shaved griddled ribeye loaded with sweet caramelized onions and gooey melted provolone in a warm toasted roll.";
          } else if (combined.includes("taco") || combined.includes("birria")) {
            tasteNote = "Slow-braised beef folded into crisp, pan-seared corn tortillas served with rich dipping consomé, cilantro, and lime.";
          } else if (combined.includes("ramen") || combined.includes("tonkotsu")) {
            tasteNote = "Silky, 14-hour simmered bone broth paired with springy handmade noodles, molten ajitsuke egg, and smoky chashu.";
          } else if (combined.includes("burger") || combined.includes("smash")) {
            tasteNote = "Lacy, ultra-crisp seared beef patties with American cheese, tangy house pickles, and savory special sauce on a soft bun.";
          } else if (combined.includes("pizza")) {
            tasteNote = "Wood-fired airy sourdough crust with charred leopard spots, sweet San Marzano tomato sauce, and molten fior di latte.";
          } else if (combined.includes("fried chicken") || combined.includes("chicken")) {
            tasteNote = "Double-fried shatteringly crisp coating glazed in sticky sweet-garlic sauce over juicy, succulent chicken.";
          } else if (combined.includes("dumpling") || combined.includes("bao") || combined.includes("gyoza")) {
            tasteNote = "Golden pan-crisped bottoms with delicate pleated wrappers and a savory, aromatic meat filling paired with chili crunch.";
          } else if (combined.includes("coffee") || combined.includes("cortado") || combined.includes("espresso")) {
            tasteNote = "Silky steamed oat milk over light-roasted Ethiopian espresso with bright stone-fruit acidity and sweet caramel notes.";
          } else if (combined.includes("cardamom") || combined.includes("bun") || combined.includes("bakery") || combined.includes("croissant")) {
            tasteNote = "Warm, freshly baked pastry with caramelized buttery layers and a fragrant punch of freshly ground Nordic cardamom.";
          } else if (combined.includes("kebab") || combined.includes("shawarma")) {
            tasteNote = "Charcoal-kissed spiced meat shaved thin into warm pillowy flatbread with garlicky toum, crisp pickles, and sumac.";
          } else {
            tasteNote = `Rich, authentic ${dishName.toLowerCase()} prepared fresh to order with house spices and balanced seasoning.`;
          }
        }
        const resolvedFinal = resolveFoodCategoryAndIcon(dishName, place.name);
        if (category === "all") category = resolvedFinal.category;
        if (!icon || icon === "🍽️") icon = resolvedFinal.icon;

        const neighborhood =
          parsed.neighborhoodHint && parsed.neighborhoodHint.length > 2
            ? inferNeighborhood(parsed.neighborhoodHint)
            : place.neighborhood || inferNeighborhood(place.formatted_address);

        const item: EnrichedStagingItem = {
          id: `staging-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          rawInput: parsed.rawLine,
          venueName: cleanVenueName(place.name || parsed.venueName, parsed.venueName),
          formattedAddress: place.formatted_address,
          neighborhood,
          latitude: place.location.lat,
          longitude: place.location.lng,
          googlePlaceId: place.place_id,
          googleRating: place.google_rating,
          googleReviewsCount: place.google_reviews_count,
          priceLevel: place.price_level || "$$",
          openNow: place.open_now ?? true,
          openingHoursText: place.opening_hours_text || [],
          reviews: place.reviews || [],
          photoUrls,
          selectedPhoto: photoUrls[0] || "",
          dishName,
          priceNok,
          tasteNote,
          category,
          icon,
          dietaryTags,
          dinerQuote,
          included: true,
        };

        return item;
      });

      const chunkResults = await Promise.all(chunkPromises);
      enrichedItems.push(...chunkResults);
    }

    return NextResponse.json({ items: enrichedItems });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process bulk enrichment." },
      { status: 500 }
    );
  }
}
