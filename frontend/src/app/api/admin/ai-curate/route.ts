import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  PLACES_API_BASE,
  PLACES_FIELD_MASK,
  mapGooglePlace,
  mockPlace,
  type GooglePlaceNew,
  type PlaceResult,
} from "@/lib/places/google";
import { curatedVenuePhotos } from "@/lib/places/curatedPhotos";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Only admins and official Smakr editors may spend AI/Places quota here.
 * Public card rendering uses a deterministic local fallback instead.
 */
async function canUseAiCurator(): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_official")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin" || profile?.is_official === true;
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

interface GenerateDishNotePayload {
  mode: "generate-dish-note";
  dishName: string;
  venueName?: string;
  category?: string;
  rawGoogleReviews?: Array<{ text?: string; rating?: number } | string>;
}

interface ExtractMenuPricesPayload {
  mode: "extract-menu-prices";
  menuTextOrImageBase64: string;
  mimeType?: string;
}

interface GenerateIgCaptionPayload {
  mode: "generate-ig-caption";
  dishName?: string;
  priceNok?: string;
  venueName?: string;
  neighborhood?: string;
  address?: string;
  rating?: string;
  tasteNote?: string;
  category?: string;
  dietaryTags?: string[];
  openingHoursSummary?: string;
  angle?: "hype-drop" | "hidden-gem" | "budget-steal" | "debate-question";
  language?: "en" | "no" | "bilingual";
}

interface ParsePopupDropPayload {
  mode: "parse-popup-drop";
  rawText?: string;
  imageBase64?: string;
  mimeType?: string;
}

type AiCurateRequest =
  | GenerateDishNotePayload
  | ExtractMenuPricesPayload
  | GenerateIgCaptionPayload
  | ParsePopupDropPayload;

// In-memory rate limiting map for dish note suggestions (20 per 10 mins per IP)
const aiRateMap = new Map<string, { count: number; expiresAt: number }>();

function resolveServerNeighborhoodTags(
  neighborhood = "",
  address = "",
  category = "",
  dishName = ""
): { resolvedNeighborhood: string; hashtags: string[] } {
  const combined = `${neighborhood} ${address}`.toLowerCase();
  let resolvedNeighborhood = neighborhood.trim() || "Oslo";
  let areaTags: string[] = ["#oslosentrum", "#midtibyen"];

  if (
    combined.includes("grünerløkka") ||
    combined.includes("grunerlokka") ||
    combined.includes("løkka") ||
    combined.includes("markveien") ||
    combined.includes("thorvald meyers")
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === "oslo" ? "Grünerløkka" : neighborhood;
    areaTags = ["#grünerløkka", "#løkka", "#markveien", "#thorvaldmeyersgate"];
  } else if (
    combined.includes("torggata") ||
    combined.includes("sentrum") ||
    combined.includes("bernt ankers") ||
    combined.includes("youngstorget")
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === "oslo" ? "Sentrum / Torggata" : neighborhood;
    areaTags = ["#torggata", "#oslosentrum", "#youngstorget", "#midtibyen"];
  } else if (
    combined.includes("grønland") ||
    combined.includes("gronland") ||
    combined.includes("tøyen") ||
    combined.includes("toyen") ||
    combined.includes("gamle oslo")
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === "oslo" ? "Grønland / Tøyen" : neighborhood;
    areaTags = ["#grønlandoslo", "#tøyen", "#gamleoslo", "#oslostreetfood"];
  } else if (
    combined.includes("frogner") ||
    combined.includes("majorstuen") ||
    combined.includes("bogstadveien") ||
    combined.includes("vestkanten")
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === "oslo" ? "Frogner" : neighborhood;
    areaTags = ["#frogner", "#majorstuen", "#vestkanten", "#oslobakery"];
  } else if (
    combined.includes("bjørvika") ||
    combined.includes("bjorvika") ||
    combined.includes("barcode") ||
    combined.includes("sørenga") ||
    combined.includes("operagata")
  ) {
    resolvedNeighborhood =
      !neighborhood || neighborhood.toLowerCase() === "oslo" ? "Bjørvika" : neighborhood;
    areaTags = ["#bjørvika", "#oslobukta", "#barcodeoslo", "#sørenga"];
  }

  const dishCat = `${category} ${dishName}`.toLowerCase();
  const foodTags: string[] = [];
  if (dishCat.includes("matcha") || dishCat.includes("tea")) {
    foodTags.push("#matchaoslo", "#oslocafe");
  } else if (dishCat.includes("coffee") || dishCat.includes("latte") || dishCat.includes("espresso")) {
    foodTags.push("#oslocoffee", "#oslocafe");
  } else if (dishCat.includes("bakery") || dishCat.includes("bun") || dishCat.includes("bolle") || dishCat.includes("croissant") || dishCat.includes("cardamom")) {
    foodTags.push("#oslobakeri", "#oslocafe");
  } else if (dishCat.includes("pizza") || dishCat.includes("slice")) {
    foodTags.push("#oslopizza", "#osloeats");
  } else if (dishCat.includes("dumpling") || dishCat.includes("gyoza") || dishCat.includes("bao")) {
    foodTags.push("#dumplingsoslo", "#oslostreetfood");
  } else if (dishCat.includes("chicken") || dishCat.includes("korean") || dishCat.includes("k-fried")) {
    foodTags.push("#koreanfoodoslo", "#oslostreetfood");
  } else if (dishCat.includes("ramen") || dishCat.includes("noodle") || dishCat.includes("pho")) {
    foodTags.push("#ramenoslo", "#osloeats");
  } else if (dishCat.includes("kebab") || dishCat.includes("shawarma") || dishCat.includes("burger") || dishCat.includes("taco")) {
    foodTags.push("#oslostreetfood", "#osloeats");
  } else {
    foodTags.push("#osloeats", "#oslorestaurant");
  }

  const baseTags = ["#oslofood", "#visitoslo", "#spiseioslo", ...areaTags, ...foodTags, "#smakroslo"];
  const deduped = Array.from(new Set(baseTags)).slice(0, 10);
  return { resolvedNeighborhood, hashtags: deduped };
}

function fallbackIgCaption(payload: GenerateIgCaptionPayload): {
  caption: string;
  storyTeaser: string;
  altText: string;
} {
  const dishName = (payload.dishName || "Signature Dish").trim();
  const priceNok = (payload.priceNok || "145 kr").trim();
  const venueName = (payload.venueName || "Oslo Spot").trim();
  const address = (payload.address || `${venueName}, Oslo`).trim();
  const rating = (payload.rating || "4.8").trim();
  const category = (payload.category || "Food").trim();
  const angle = payload.angle || "hype-drop";
  const language = payload.language || "en";

  const { resolvedNeighborhood, hashtags } = resolveServerNeighborhoodTags(
    payload.neighborhood,
    address,
    category,
    dishName
  );

  const defaultNote = fallbackDishNote(dishName, venueName, category).note;
  const rawTasteNote =
    payload.tasteNote &&
    !payload.tasteNote.toLowerCase().includes("balanced seasoning") &&
    !payload.tasteNote.toLowerCase().includes("worth crossing town for")
      ? payload.tasteNote.trim()
      : defaultNote;

  let hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - worth crossing Oslo for`;
  let verdict = `${rawTasteNote} At ${priceNok}, this is one of the sharpest orders at ${venueName} right now.`;
  let cta = `Send this to someone you want to get a ${dishName} with. Type "beta test" to get the link and be an early tester of Smakr and to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`;
  let storyTeaser = `New ${priceNok} ${dishName} drop in ${resolvedNeighborhood} — type "beta test" for early access 👉`;

  if (language === "no") {
    if (angle === "hype-drop") {
      hook = `${dishName} (${priceNok}) i ${resolvedNeighborhood} som alle snakker om akkurat nå`;
      verdict = `${rawTasteNote} Til ${priceNok} hos ${venueName} leverer denne fra første slurk eller bit.`;
      storyTeaser = `Ny ${priceNok} ${dishName}-favoritt i ${resolvedNeighborhood} 👉`;
    } else if (angle === "hidden-gem") {
      hook = `Ikke gå forbi ${venueName} i ${resolvedNeighborhood} uten å bestille ${dishName} (${priceNok})`;
      verdict = `${rawTasteNote} En ekte lokal favoritt i ${resolvedNeighborhood} til ${priceNok}.`;
      storyTeaser = `Skjult perle i ${resolvedNeighborhood}: ${dishName} (${priceNok}) 👉`;
    } else if (angle === "budget-steal") {
      hook = `${priceNok} for ${dishName} i ${resolvedNeighborhood} - beste kjøpet i Oslo akkurat nå?`;
      verdict = `${rawTasteNote} Sjelden du får så mye kvalitet for ${priceNok} hos ${venueName}.`;
      storyTeaser = `Oslo-kupp: ${dishName} til ${priceNok} i ${resolvedNeighborhood} 👉`;
    } else {
      hook = `Er dette Oslos beste ${dishName.toLowerCase()}? (${priceNok} i ${resolvedNeighborhood})`;
      verdict = `${rawTasteNote} Vi gir den ${rating}/5 hos ${venueName} - hva er din dom?`;
      storyTeaser = `Oslos beste ${dishName}? (${priceNok} hos ${venueName}) 👉`;
    }
    cta = `Send denne til noen du vil teste ${dishName} med. Skriv "beta test" i kommentarfeltet for å få linken og bli tidlig betatester av Smakr, og se ${venueName} + alle steder i nærheten på Oslo Food Radar-kartet.`;
  } else if (language === "bilingual") {
    if (angle === "hype-drop") {
      hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - ny Oslo-favoritt du må teste`;
    } else if (angle === "hidden-gem") {
      hook = `Low-key ${resolvedNeighborhood} gem: ${dishName} (${priceNok}) at ${venueName}`;
    } else if (angle === "budget-steal") {
      hook = `${priceNok} in ${resolvedNeighborhood}: ${dishName} at ${venueName} er et ekte kupp`;
    } else {
      hook = `Best ${dishName.toLowerCase()} in Oslo? (${priceNok} at ${venueName}) - enig eller uenig?`;
    }
    verdict = `${rawTasteNote} At ${priceNok}, this is one of the sharpest orders at ${venueName} right now.`;
    cta = `Send this to someone you want to get a ${dishName} with ("Spise her? 👀"). Type "beta test" to get the link and be an early tester of Smakr and to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`;
    storyTeaser = `${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood} — type "beta test" 👉`;
  } else {
    // English
    if (angle === "hype-drop") {
      hook = `${dishName} (${priceNok}) in ${resolvedNeighborhood} - worth crossing Oslo for`;
    } else if (angle === "hidden-gem") {
      hook = `Don't walk past ${venueName} in ${resolvedNeighborhood} without ordering the ${dishName}`;
    } else if (angle === "budget-steal") {
      hook = `${priceNok} for ${dishName} in ${resolvedNeighborhood} might be Oslo's best value order`;
    } else {
      hook = `Is this the best ${dishName.toLowerCase()} in Oslo right now? (${priceNok} in ${resolvedNeighborhood})`;
    }
  }

  if (hook.length > 108) {
    hook = `${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood}`.slice(0, 108);
  }

  const hoursLine = payload.openingHoursSummary
    ? `\n🕒 Hours: ${payload.openingHoursSummary}`
    : "";

  const cheatSheet = [
    `📍 Spot: ${venueName}`,
    `🗺️ Area: ${address} (${resolvedNeighborhood})`,
    `💰 Price: ${priceNok}`,
    `⭐ Rating: ${rating}/5${hoursLine}`,
  ].join("\n");

  const caption = [hook, verdict, cheatSheet, cta, hashtags.join(" ")].join("\n\n");
  const altText = `${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood}, Oslo — Smakr Oslo Food Guide`;

  return { caption, storyTeaser, altText };
}


function fallbackDishNote(
  dishName: string,
  venueName = "this Oslo spot",
  category = "all",
  rawReviews: string[] = []
): { note: string; suggestedPriceNok: number | null } {
  const joined = rawReviews.join(" ");
  const priceMatch =
    joined.match(/(\d{2,3})\s*(?:kr|nok|,-)/i) ||
    dishName.match(/(\d{2,3})\s*(?:kr|nok)/i);
  let suggestedPriceNok = priceMatch ? Number(priceMatch[1]) : null;

  // Match strictly on dishName + venueName FIRST so a mis-categorized dish
  // (e.g. "Korean Fried Chicken" with category="dumplings") never gets a dumpling note!
  const dishAndVenue = `${dishName} ${venueName}`.toLowerCase();
  const fullLower = `${dishName} ${venueName} ${category}`.toLowerCase();

  if (!suggestedPriceNok) {
    if (dishAndVenue.includes("coffee") || dishAndVenue.includes("matcha") || dishAndVenue.includes("latte")) {
      suggestedPriceNok = 68;
    } else if (dishAndVenue.includes("bun") || dishAndVenue.includes("cardamom") || dishAndVenue.includes("bakery") || dishAndVenue.includes("croissant")) {
      suggestedPriceNok = 58;
    } else if (dishAndVenue.includes("fried chicken") || dishAndVenue.includes("k-fried") || dishAndVenue.includes("wings")) {
      suggestedPriceNok = 185;
    } else if (dishAndVenue.includes("dumpling") || dishAndVenue.includes("gyoza") || dishAndVenue.includes("bao")) {
      suggestedPriceNok = 145;
    } else if (dishAndVenue.includes("ramen") || dishAndVenue.includes("pizza") || dishAndVenue.includes("pasta")) {
      suggestedPriceNok = 215;
    } else if (dishAndVenue.includes("burger") || dishAndVenue.includes("taco") || dishAndVenue.includes("kebab")) {
      suggestedPriceNok = 175;
    }
  }

  let note = `Standout ${dishName.toLowerCase()} at ${venueName}—balanced seasoning, fresh texture, and cooked to order.`;

  if (
    dishAndVenue.includes("fried chicken") ||
    dishAndVenue.includes("k-fried") ||
    dishAndVenue.includes("korean") ||
    dishAndVenue.includes("wings") ||
    dishAndVenue.includes("chicken")
  ) {
    note = `Double-fried shatteringly crisp crust glazed in sticky sweet-heat gochujang and toasted sesame at ${venueName}.`;
  } else if (
    dishAndVenue.includes("dumpling") ||
    dishAndVenue.includes("gyoza") ||
    dishAndVenue.includes("dim sum") ||
    dishAndVenue.includes("yum cha") ||
    dishAndVenue.includes("wonton")
  ) {
    note = `Crisp pan-seared bottoms, delicate hand-pleated wrappers, and juicy aromatic filling—a standout plate at ${venueName}.`;
  } else if (dishAndVenue.includes("kebab") || dishAndVenue.includes("shawarma") || dishAndVenue.includes("döner") || dishAndVenue.includes("falafel")) {
    note = `Char-grilled spiced meat shaved thin into warm flatbread with bright herbs, crisp pickles, and garlicky sauce.`;
  } else if (dishAndVenue.includes("ramen") || dishAndVenue.includes("noodle") || dishAndVenue.includes("pho")) {
    note = `Silky, slow-simmered broth with springy noodles, rich aromatic oil, and deeply savory tare at ${venueName}.`;
  } else if (
    dishAndVenue.includes("bakery") ||
    dishAndVenue.includes("brød") ||
    dishAndVenue.includes("bun") ||
    dishAndVenue.includes("bolle") ||
    dishAndVenue.includes("croissant") ||
    dishAndVenue.includes("cardamom")
  ) {
    note = `Flaky, caramelized crust with a tender, butter-rich crumb and freshly ground spice—best warm from ${venueName}'s oven.`;
  } else if (dishAndVenue.includes("pizza") || dishAndVenue.includes("slice")) {
    note = `Blistered, airy sourdough cornicione with bright crushed San Marzano tomatoes and creamy melted fior di latte.`;
  } else if (dishAndVenue.includes("burger") || dishAndVenue.includes("smash")) {
    note = `Lacy, hard-seared beef edges, melted cheese, tangy house pickles, and a soft toasted potato bun at ${venueName}.`;
  } else if (dishAndVenue.includes("taco") || dishAndVenue.includes("birria") || dishAndVenue.includes("quesadilla")) {
    note = `Warm pressed corn tortillas loaded with tender slow-braised meat, bright lime, white onion, and smoky salsa.`;
  } else if (dishAndVenue.includes("sushi") || dishAndVenue.includes("nigiri") || dishAndVenue.includes("maki") || dishAndVenue.includes("omakase")) {
    note = `Clean, melt-in-your-mouth Nordic fish over warm, lightly seasoned shari with a brush of aged nikiri soy.`;
  } else if (dishAndVenue.includes("matcha")) {
    note = `Velvety oat microfoam poured over vibrant ceremonial-grade Uji matcha—earthy, smooth, and zero bitterness.`;
  } else if (dishAndVenue.includes("coffee") || dishAndVenue.includes("espresso") || dishAndVenue.includes("latte") || dishAndVenue.includes("cappuccino")) {
    note = `Silky microfoam over bright Nordic-roasted espresso with clean stone-fruit sweetness and a lingering finish.`;
  } else if (dishAndVenue.includes("gelato") || dishAndVenue.includes("ice cream") || dishAndVenue.includes("cake") || dishAndVenue.includes("waffle")) {
    note = `Dense, silky texture with deep natural flavor and a clean, not-too-sweet finish at ${venueName}.`;
  } else if (fullLower.includes("dumpling")) {
    note = `Delicate hand-folded wrappers with savory, herb-bright filling and house chili oil at ${venueName}.`;
  }

  return { note, suggestedPriceNok };
}

function fallbackExtractMenu(input: string) {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items: Array<{
    dishName: string;
    priceNok: number | null;
    category: string;
    dietaryTags: string[];
    shortNote: string;
  }> = [];

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*[-–—:·]?\s*(\d{2,3})\s*(?:kr|nok|,-)?$/i);
    if (match) {
      const dishName = match[1].trim();
      const priceNok = Number(match[2]);
      const { note } = fallbackDishNote(dishName);
      items.push({
        dishName,
        priceNok,
        category: "all",
        dietaryTags: [],
        shortNote: note,
      });
    }
  }
  return items;
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
        // try next endpoint
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseAiCurator())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or official account required." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as AiCurateRequest;
    const apiKey = resolveGeminiApiKey();

    if (body.mode === "generate-dish-note") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const now = Date.now();
      const rateData = aiRateMap.get(ip);
      const dishName = (body.dishName || "Signature Dish").trim();
      const venueName = (body.venueName || "Oslo Spot").trim();
      const category = body.category || "all";
      const rawReviews = (body.rawGoogleReviews || [])
        .map((r) => (typeof r === "string" ? r : r?.text || ""))
        .filter(Boolean)
        .slice(0, 6);

      const fb = fallbackDishNote(dishName, venueName, category, rawReviews);

      if (rateData && rateData.expiresAt > now) {
        if (rateData.count >= 20) {
          return NextResponse.json({
            note: fb.note,
            tasteNote: fb.note,
            suggestedPriceNok: fb.suggestedPriceNok,
          });
        }
        rateData.count++;
      } else {
        aiRateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
      }

      if (!apiKey) {
        return NextResponse.json({
          note: fb.note,
          tasteNote: fb.note,
          suggestedPriceNok: fb.suggestedPriceNok,
        });
      }

      const prompt = [
        `You are an insider Oslo food editor for Smakr.`,
        `Write a concrete, human, 12-to-16 word taste note specifically about the dish "${dishName}" at "${venueName}" (category: ${category}).`,
        `Focus strictly on flavor, texture, crust, broth, or craftsmanship. Never mention building architecture, service, or generic hype adjectives.`,
        rawReviews.length
          ? `Reference context from diner reviews (ignore non-food chatter): ${JSON.stringify(rawReviews)}`
          : ``,
        `Return strict JSON: { "note": string, "suggestedPriceNok": number | null }`,
      ]
        .filter(Boolean)
        .join("\n");

      const rawText = await callGeminiGenerateContent(
        apiKey,
        [{ role: "user", parts: [{ text: prompt }] }],
        0.35
      );

      if (!rawText) {
        return NextResponse.json({
          note: fb.note,
          tasteNote: fb.note,
          suggestedPriceNok: fb.suggestedPriceNok,
        });
      }

      const parsed = JSON.parse(rawText);
      const finalNote =
        typeof parsed.note === "string" && parsed.note.trim()
          ? parsed.note.trim()
          : fb.note;
      return NextResponse.json({
        note: finalNote,
        tasteNote: finalNote,
        suggestedPriceNok:
          typeof parsed.suggestedPriceNok === "number" && parsed.suggestedPriceNok > 0
            ? parsed.suggestedPriceNok
            : fb.suggestedPriceNok,
      });
    }

    if (body.mode === "extract-menu-prices") {
      const input = (body.menuTextOrImageBase64 || "").trim();
      if (!apiKey) {
        return NextResponse.json({ items: fallbackExtractMenu(input) });
      }

      const isBase64Image =
        input.startsWith("data:image/") || /^[A-Za-z0-9+/=]{200,}$/.test(input);
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Extract Oslo menu items into strict JSON array: [{"dishName": string, "priceNok": number | null, "category": string, "dietaryTags": string[], "shortNote": string}]. Keep shortNote 10-15 words focused on the dish.`,
        },
      ];

      if (isBase64Image) {
        const cleanBase64 = input.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: body.mimeType || "image/jpeg",
            data: cleanBase64,
          },
        });
      } else {
        parts.push({ text: input });
      }

      const rawText = await callGeminiGenerateContent(
        apiKey,
        [{ role: "user", parts }],
        0.2
      );

      if (!rawText) {
        return NextResponse.json({ items: fallbackExtractMenu(input) });
      }

      const parsed = JSON.parse(rawText);
      return NextResponse.json({
        items: Array.isArray(parsed) ? parsed : parsed?.items || [],
      });
    }

    if (body.mode === "generate-ig-caption") {
      const fb = fallbackIgCaption(body);
      if (!apiKey) {
        return NextResponse.json(fb);
      }

      const dishName = (body.dishName || "Signature Dish").trim();
      const priceNok = (body.priceNok || "145 kr").trim();
      const venueName = (body.venueName || "Oslo Spot").trim();
      const address = (body.address || `${venueName}, Oslo`).trim();
      const rating = (body.rating || "4.8").trim();
      const category = (body.category || "Food").trim();
      const angle = body.angle || "hype-drop";
      const language = body.language || "en";
      const dietary =
        Array.isArray(body.dietaryTags) && body.dietaryTags.length > 0
          ? body.dietaryTags.join(", ")
          : "";
      const { resolvedNeighborhood, hashtags } = resolveServerNeighborhoodTags(
        body.neighborhood,
        address,
        category,
        dishName
      );
      const tasteNote =
        body.tasteNote &&
        !body.tasteNote.toLowerCase().includes("balanced seasoning") &&
        !body.tasteNote.toLowerCase().includes("worth crossing town for")
          ? body.tasteNote.trim()
          : fallbackDishNote(dishName, venueName, category).note;

      const angleInstructions: Record<string, string> = {
        "hype-drop":
          "Write a high-energy, mouth-watering new drop announcement that makes Oslo foodies immediately save the post and tag a friend.",
        "hidden-gem":
          "Write an insider local secret angle - like tipping off a friend about an underrated Oslo spot most people walk right past.",
        "budget-steal":
          "Lead with the exact NOK price and frame it as one of the sharpest value-for-money orders in Oslo right now.",
        "debate-question":
          "Lead with a bold, comment-sparking question (e.g., asking if this is Oslo's best version of this dish) to drive comment section debate.",
      };

      const languageInstructions: Record<string, string> = {
        en: "Write in sharp, natural English used by Oslo locals and expats.",
        no: "Write in natural, modern Oslo Norwegian (Bokmål). Keep it punchy and authentic, never stiff or translated-sounding.",
        bilingual:
          'Write in an authentic "Oslo Mix" (English body with natural Norwegian foodie phrases like "Spise her? 👀", "ekte kupp", or "ny favoritt").',
      };

      const prompt = [
        `You are the lead social growth editor for Smakr Oslo (@smakr.no), Oslo's dish-level food discovery radar (currently in early beta testing).`,
        `Write a high-converting Instagram post caption, story teaser, and SEO alt-text for:`,
        `- Dish / Drink: "${dishName}"`,
        `- Exact Price (MUST use this exact price everywhere): "${priceNok}"`,
        `- Venue: "${venueName}"`,
        `- Neighborhood: "${resolvedNeighborhood}"`,
        `- Address: "${address}"`,
        `- Rating: "${rating}/5"`,
        `- Flavor/Texture Verdict: "${tasteNote}"`,
        `- Category: "${category}"`,
        dietary ? `- Dietary Tags: "${dietary}"` : "",
        body.openingHoursSummary ? `- Opening Hours: "${body.openingHoursSummary}"` : "",
        ``,
        `ANGLE: ${angleInstructions[angle] || angleInstructions["hype-drop"]}`,
        `LANGUAGE: ${languageInstructions[language] || languageInstructions.en}`,
        ``,
        `STRICT VOICE & CONSISTENCY RULES:`,
        `- Sound like a sharp, authentic Oslo local foodie.`,
        `- NEVER say "Balanced seasoning and cooked to order" (especially for drinks, matcha, coffee, or pastries!). Describe only authentic flavor/texture for "${dishName}".`,
        `- NEVER use robotic AI clichés: banned words include "delightful", "culinary journey", "nestled in the heart of", "elevate", "seamless", "bespoke", "symphony of flavors", "hidden oasis", "look no further".`,
        `- PRICE CONSISTENCY: Every single mention of the price in the Hook, Verdict, and Cheat Sheet MUST be "${priceNok}" — never mix two different prices.`,
        `- Keep ` + "`caption`" + ` formatted into these exact 5 blocks separated by double newlines (\\n\\n):`,
        `  1. Scroll-Stopper Hook (Line 1): MUST be under 110 characters so it never truncates before "...more". Example: "${dishName} (${priceNok}) in ${resolvedNeighborhood} - worth crossing Oslo for"`,
        `  2. The Insider Verdict: 1-2 punchy sentences on why it stands out at ${priceNok} (e.g. "${tasteNote} At ${priceNok}, this is one of the sharpest orders at ${venueName} right now.").`,
        `  3. The "Save This" Cheat Sheet (exact 4 lines):`,
        `     📍 Spot: ${venueName}`,
        `     🗺️ Area: ${address} (${resolvedNeighborhood})`,
        `     💰 Price: ${priceNok}`,
        `     ⭐ Rating: ${rating}/5`,
        `  4. The Beta-Tester Growth CTA: Tell viewers to send this to someone they want to get a ${dishName} with, and to type "beta test" in the comments to get the link and be an early tester of Smakr and to see ${venueName} + all nearby picks on the live Oslo Food Radar map.`,
        `  5. SEO Hashtag Block: 8-10 hyper-relevant Oslo + neighborhood + dish hashtags, EVERY tag starting with "#": ${hashtags.join(" ")}`,
        ``,
        `Return strict JSON matching this schema:`,
        `{`,
        `  "caption": string,`,
        `  "storyTeaser": string, // 1-line hook for sharing to IG Stories, e.g. "New ${priceNok} ${dishName} drop in ${resolvedNeighborhood} — type 'beta test' for access 👉"`,
        `  "altText": string // Clean SEO alt-text, e.g. "${dishName} (${priceNok}) at ${venueName} in ${resolvedNeighborhood}, Oslo — Smakr Oslo Food Guide"`,
        `}`,
      ]
        .filter(Boolean)
        .join("\n");


function getUpcomingWeekendDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (daysUntilFriday === 0 && now.getHours() >= 22 ? 7 : daysUntilFriday));
  friday.setHours(17, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 0, 0, 0);

  return {
    start: friday.toISOString(),
    end: sunday.toISOString(),
  };
}

function fallbackParsePopup(
  text: string,
  defaultDates: { start: string; end: string }
) {
  const lower = text.toLowerCase();
  const isBecco = lower.includes("becco");
  const isTrekanten = lower.includes("trekanten");
  const isBurger = lower.includes("burger") || lower.includes("nolo");
  const isRamen = lower.includes("ramen") || lower.includes("hot temper") || isBecco;

  const priceMatch = text.match(/(\d{2,3})\s*(?:kr|nok)/i);
  const priceNok = priceMatch ? parseInt(priceMatch[1], 10) : isRamen ? 195 : 175;

  const capMatch = text.match(/(\d{2,3})\s*(?:bowls?|portions?|porsjoner|stk)/i);
  const portionCap = capMatch ? `${capMatch[1]} bowls/night` : "80 bowls/night";

  return {
    popupName: isRamen
      ? "Hot Temper Ramen Residency"
      : isBurger
      ? "Nolo Smash Burger Pop-up"
      : "Oslo Kitchen Residency",
    hostVenueQuery: isBecco
      ? "Becco"
      : isTrekanten
      ? "Trekanten"
      : lower.includes("fuglen")
      ? "Fuglen"
      : "Becco",
    guestChef: isRamen ? "Hot Temper" : isBurger ? "Nolo Burger Crew" : "Guest Collective",
    startDate: defaultDates.start,
    endDate: defaultDates.end,
    dailyHours: "17:00 – Late (til tomt)",
    portionCap,
    entryType: "walk_in" as const,
    ticketUrl: null,
    dishName: isRamen
      ? "Tokyo Duck Shio Ramen"
      : isBurger
      ? "Dry-Aged Double Smash Burger"
      : "Signature Pop-up Special",
    priceNok,
    category: isRamen ? "ramen" : isBurger ? "burger" : "street_food",
    tasteNote: isRamen
      ? "Rich roasted duck broth with house-made alkaline noodles and fragrant yuzu oil."
      : "Ultra-crispy lacy edges, double cheddar, and toasted buttered potato bun.",
  };
}

      const rawText = await callGeminiGenerateContent(
        apiKey,
        [{ role: "user", parts: [{ text: prompt }] }],
        0.55
      );

      if (!rawText) {
        return NextResponse.json(fb);
      }

      try {
        const parsed = JSON.parse(rawText);
        return NextResponse.json({
          caption:
            typeof parsed.caption === "string" && parsed.caption.trim()
              ? parsed.caption.trim()
              : fb.caption,
          storyTeaser:
            typeof parsed.storyTeaser === "string" && parsed.storyTeaser.trim()
              ? parsed.storyTeaser.trim()
              : fb.storyTeaser,
          altText:
            typeof parsed.altText === "string" && parsed.altText.trim()
              ? parsed.altText.trim()
              : fb.altText,
        });
      } catch {
        return NextResponse.json(fb);
      }
    }

    if (body.mode === "parse-popup-drop") {
      const getUpcomingWeekendDates = (): { start: string; end: string } => {
        const now = new Date();
        const day = now.getDay();
        const daysToFri = (5 - day + 7) % 7;
        const fri = new Date(now);
        fri.setDate(now.getDate() + daysToFri);
        const sun = new Date(fri);
        sun.setDate(fri.getDate() + 2);
        return {
          start: fri.toISOString(),
          end: sun.toISOString(),
        };
      };

      const fallbackParsePopup = (text: string, defaultDates: { start: string; end: string }) => {
        const isHotTemper = /hot temper/i.test(text);
        const isBecco = /becco/i.test(text);
        return {
          popupName: isHotTemper ? "Hot Temper Ramen Residency" : "Oslo Culinary Pop-up",
          hostVenueQuery: isBecco ? "Becco" : "Becco",
          guestChef: isHotTemper ? "Hot Temper / Chef Ole" : "Guest Chef",
          startDate: defaultDates.start,
          endDate: defaultDates.end,
          dailyHours: "17:00 – Late (til tomt)",
          portionCap: "80 bowls/night",
          entryType: "walk_in" as const,
          ticketUrl: null,
          dishName: isHotTemper ? "Tokyo-style Duck Shio Ramen" : "Signature Pop-up Special",
          priceNok: 195,
          category: isHotTemper ? "ramen" : "street_food",
          tasteNote: "Simmered duck broth with hand-crafted noodles and slow-braised chashu.",
        };
      };

      const rawText = (body.rawText || "").trim();
      const imageBase64 = body.imageBase64;
      const defaultDates = getUpcomingWeekendDates();

      let parsed: {
        popupName: string;
        hostVenueQuery: string;
        guestChef: string;
        startDate: string;
        endDate: string;
        dailyHours: string;
        portionCap: string;
        entryType: "walk_in" | "ticketed" | "rsvp";
        ticketUrl: string | null;
        dishName: string;
        priceNok: number;
        category: string;
        tasteNote: string;
      } | null = null;

      if (apiKey) {
        const parts: Array<Record<string, unknown>> = [];
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType: body.mimeType || "image/jpeg",
              data: cleanBase64,
            },
          });
        }
        parts.push({
          text: `You are a culinary curator for Smakr Oslo (@smakr.no).
Parse the following Oslo culinary pop-up / kitchen residency announcement into strict JSON:
${rawText ? `ANNOUNCEMENT TEXT:\n"""\n${rawText}\n"""` : ""}

Extract and infer:
1. popupName: Catchy official name of the pop-up residency (e.g. "Hot Temper Ramen Residency")
2. hostVenueQuery: The host venue, bar, or restaurant hosting it in Oslo (e.g. "Becco", "Trekanten", "Torggata Botaniske", "Kulturhuset", "Fuglen"). Clean venue name only!
3. guestChef: Guest chef or pop-up crew name (e.g. "Hot Temper", "Chef Ole")
4. startDate: ISO 8601 string for start date (default to "${defaultDates.start}" if unspecified)
5. endDate: ISO 8601 string for closing date (default to "${defaultDates.end}" if unspecified)
6. dailyHours: Human readable hours (e.g. "17:00 – Late (til tomt)")
7. portionCap: Batch limit string or portions per night (e.g. "80 bowls/night" or "120 portions")
8. entryType: "walk_in" | "ticketed" | "rsvp"
9. ticketUrl: URL if mentioned or null
10. dishName: Signature featured dish name (e.g. "Tokyo Duck Shio Ramen")
11. priceNok: Numeric price in NOK (e.g. 195)
12. category: Food category slug (one of: ramen, burger, pizza, tacos, dumplings, bao, street_food, bakery, coffee, dessert, drinks, indian, kebab, pasta, sushi)
13. tasteNote: 12-14 word insider verdict focusing on aroma, crispness, broth, or spices.

Return STRICT JSON:
{
  "popupName": string,
  "hostVenueQuery": string,
  "guestChef": string,
  "startDate": string,
  "endDate": string,
  "dailyHours": string,
  "portionCap": string,
  "entryType": "walk_in" | "ticketed" | "rsvp",
  "ticketUrl": string | null,
  "dishName": string,
  "priceNok": number,
  "category": string,
  "tasteNote": string
}`,
        });

        const rawResult = await callGeminiGenerateContent(
          apiKey,
          [{ role: "user", parts }],
          0.3
        );

        if (rawResult) {
          try {
            parsed = JSON.parse(rawResult);
          } catch {
            // fallback
          }
        }
      }

      const nonNullParsed = parsed ?? fallbackParsePopup(rawText, defaultDates);
      const hostQuery = nonNullParsed.hostVenueQuery || "Becco";
      const googleKey = process.env.GOOGLE_PLACES_API_KEY;
      let resolvedPlace: PlaceResult | null = null;

      if (googleKey) {
        try {
          const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": googleKey,
              "X-Goog-FieldMask": PLACES_FIELD_MASK,
            },
            body: JSON.stringify({
              textQuery: `${hostQuery} Oslo Norway`,
              maxResultCount: 3,
              languageCode: "en",
            }),
            cache: "no-store",
          });
          const data = (await res.json()) as {
            places?: GooglePlaceNew[];
          };
          if (data.places && data.places.length > 0) {
            resolvedPlace = mapGooglePlace(data.places[0], nonNullParsed.category || "drinks");
          }
        } catch (err) {
          console.warn("[ai-curate/parse-popup] Google Places lookup failed:", err);
        }
      }

      if (!resolvedPlace) {
        resolvedPlace = mockPlace(`${hostQuery} Oslo`, nonNullParsed.category || "drinks");
        if (hostQuery.toLowerCase().includes("becco")) {
          resolvedPlace.name = "Becco";
          resolvedPlace.formatted_address = "Kristian Augusts gate 11, 0164 Oslo";
          resolvedPlace.neighborhood = "sentrum";
          resolvedPlace.location = { lat: 59.9168, lng: 10.7378 };
        }
      }

      const hostPhotos = (resolvedPlace.photos || [])
        .slice(0, 8)
        .map((ref) => `/api/places/photos?ref=${encodeURIComponent(ref)}&w=800`);

      const curatedCategoryPhotos = curatedVenuePhotos(nonNullParsed.category, 6);

      return NextResponse.json({
        success: true,
        parsed: nonNullParsed,
        parsedPopup: nonNullParsed,
        hostPlace: resolvedPlace,
        hostVenue: {
          google_place_id: resolvedPlace.place_id,
          name: resolvedPlace.name,
          formatted_address: resolvedPlace.formatted_address,
          neighborhood: resolvedPlace.neighborhood,
          lat: resolvedPlace.location.lat,
          lng: resolvedPlace.location.lng,
        },
        availablePhotos: {
          hostPhotos,
          curatedCategoryPhotos,
        },
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch {
    const fb = fallbackDishNote("Signature Dish", "Oslo Spot");
    return NextResponse.json(
      { note: fb.note, tasteNote: fb.note, suggestedPriceNok: fb.suggestedPriceNok },
      { status: 200 }
    );
  }
}

