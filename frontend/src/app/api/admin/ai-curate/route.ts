import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

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

type AiCurateRequest = GenerateDishNotePayload | ExtractMenuPricesPayload;

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
  const endpoints = apiKey.startsWith("AQ.")
    ? [
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      ]
    : [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AiCurateRequest;
    const apiKey = resolveGeminiApiKey();

    if (body.mode === "generate-dish-note") {
      const dishName = (body.dishName || "Signature Dish").trim();
      const venueName = (body.venueName || "Oslo Spot").trim();
      const category = body.category || "all";
      const rawReviews = (body.rawGoogleReviews || [])
        .map((r) => (typeof r === "string" ? r : r?.text || ""))
        .filter(Boolean)
        .slice(0, 6);

      const fb = fallbackDishNote(dishName, venueName, category, rawReviews);
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

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch {
    const fb = fallbackDishNote("Signature Dish", "Oslo Spot");
    return NextResponse.json(
      { note: fb.note, tasteNote: fb.note, suggestedPriceNok: fb.suggestedPriceNok },
      { status: 200 }
    );
  }
}
