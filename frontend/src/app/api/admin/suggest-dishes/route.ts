import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/app/api/admin/_auth";
import { captureGeminiGeneration, createAiTraceId } from "@/lib/posthog-ai";

export const runtime = "nodejs";

export interface SuggestedPopularDish {
  dish_name: string;
  price_nok: number | null;
  category: string;
  review_text: string;
  taste_tags: string[];
  why_popular: string;
  source_domain?: string | null;
}

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  sitelinks?: Array<{ title?: string; link?: string }>;
}

function resolveServerEnv(keyNames: string[]): string {
  for (const keyName of keyNames) {
    const val = process.env[keyName];
    if (val && val.trim()) return val.trim();
  }
  try {
    for (const candidate of [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "frontend", ".env.local"),
    ]) {
      if (!fs.existsSync(candidate)) continue;
      const content = fs.readFileSync(candidate, "utf8");
      for (const keyName of keyNames) {
        const m = content.match(new RegExp(`^${keyName}=(.+)$`, "m"));
        if (m?.[1]) return m[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // ignore fs read errors on serverless runtimes
  }
  return "";
}

function normalizeDishKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isDuplicateDish(candidate: string, existingNormalized: string[]): boolean {
  const norm = normalizeDishKey(candidate);
  if (!norm || norm.length < 2) return true;
  for (const ex of existingNormalized) {
    if (!ex) continue;
    if (norm === ex) return true;
    // Catch close variants such as "Pepperoni Pizza" vs "Classic Pepperoni"
    if (ex.length >= 5 && (norm.includes(ex) || ex.includes(norm))) return true;
    const normWords = norm.split(" ").filter((w) => w.length >= 3);
    const exWords = new Set(ex.split(" ").filter((w) => w.length >= 3));
    if (normWords.length > 0 && normWords.every((w) => exWords.has(w))) return true;
  }
  return false;
}

function extractDomain(urlStr = ""): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

async function querySerperOrganic(apiKey: string, query: string): Promise<SerperOrganicItem[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "no",
        hl: "en",
        num: 8,
      }),
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { organic?: SerperOrganicItem[] };
    return Array.isArray(data.organic) ? data.organic : [];
  } catch {
    return [];
  }
}

function extractJsonPayload(rawText: string): unknown {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      return JSON.parse(arrMatch[0]);
    }
    throw new Error("Could not parse Gemini JSON response.");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      spotName?: string;
      neighborhood?: string;
      category?: string;
      websiteUri?: string;
      existingDishes?: string[];
      count?: number;
    };

    const spotName = (body.spotName || "").trim();
    const neighborhood = (body.neighborhood || "Oslo").trim();
    const category = (body.category || "restaurant").trim();
    const websiteUri = (body.websiteUri || "").trim();
    const count = Math.min(5, Math.max(1, Number(body.count) || 4));
    const existingRaw = Array.isArray(body.existingDishes)
      ? body.existingDishes.map((d) => String(d || "").trim()).filter(Boolean)
      : [];

    if (!spotName) {
      return NextResponse.json({ error: "Missing spotName" }, { status: 400 });
    }

    const geminiKey = resolveServerEnv(["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]);
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in frontend/.env.local." },
        { status: 400 }
      );
    }

    const serperKey = resolveServerEnv(["SERPER_API_KEY"]);

    // 1. Live Web Search snippets via Serper (menus, reviews, food guides)
    let searchEvidence: Array<{ title: string; domain: string; snippet: string }> = [];
    if (serperKey) {
      const queries = [
        `${spotName} ${neighborhood} Oslo menu popular dishes`,
        `${spotName} Oslo best dish review`,
      ];
      const settled = await Promise.all(queries.map((q) => querySerperOrganic(serperKey, q)));
      const seenLinks = new Set<string>();
      for (const group of settled) {
        for (const item of group) {
          const link = (item.link || "").trim();
          const title = (item.title || "").trim();
          const snippet = (item.snippet || "").trim();
          if (!title && !snippet) continue;
          if (link && seenLinks.has(link)) continue;
          if (link) seenLinks.add(link);
          searchEvidence.push({
            title,
            domain: extractDomain(link),
            snippet,
          });
        }
      }
      searchEvidence = searchEvidence.slice(0, 12);
    }

    const useGoogleSearchTool = searchEvidence.length === 0;
    const providerLabel =
      searchEvidence.length > 0 ? "Serper + Gemini Flash Lite" : "Gemini Flash Lite Web Search";

    const prompt = `You are a culinary researcher for Smakr, an Oslo food discovery app.
Find ${count} distinct, genuinely popular, well-known signature dishes or menu staples ordered at "${spotName}" (${neighborhood}, Oslo · category: ${category}${websiteUri ? ` · website: ${websiteUri}` : ""}).

ALREADY PICKED DISHES (STRICTLY EXCLUDE ALL OF THESE AND ANY CLOSE VARIANTS):
${existingRaw.length > 0 ? existingRaw.map((d, i) => `${i + 1}. ${d}`).join("\n") : "(none yet)"}

${
  searchEvidence.length > 0
    ? `LIVE WEB SEARCH RESULTS FOR "${spotName}":\n${searchEvidence
        .map(
          (ev, idx) =>
            `[${idx + 1}] (${ev.domain || "web"}) ${ev.title}\n    ${ev.snippet}`
        )
        .join("\n")}`
    : `Use Google Search to verify actual menu items and well-known dishes served at "${spotName}" in Oslo.`
}

RULES:
- Every dish MUST be a real item served at "${spotName}" (never invent fake menu items).
- Strictly exclude all already picked dishes above (do not rename or slightly rephrase existing dishes).
- Prefer concrete, specific dish names diners actually order (e.g. "Nduja Honey Pizza", "Tonkotsu Ramen", "Cardamom Bun").
- "price_nok": integer NOK price ONLY if explicitly stated in the search results; otherwise null (never guess prices).
- "review_text": 1 concise factual sentence describing the dish ingredients/texture/flavor (<= 135 chars, no exclamation marks, no hype words like bespoke/elevated/seamless).
- "taste_tags": 2 to 3 short lowercase tags (e.g. ["crispy crust", "spicy honey", "wood-fired"]).
- "why_popular": brief reason this dish is known at ${spotName} (<= 85 chars).
- "source_domain": hostname where you saw it (e.g. "jungelpizza.no" or "meravoslo.no"), or null.

Return STRICT JSON with this exact shape:
{
  "suggestions": [
    {
      "dish_name": string,
      "price_nok": number | null,
      "category": string,
      "review_text": string,
      "taste_tags": string[],
      "why_popular": string,
      "source_domain": string | null
    }
  ]
}`;

    const traceId = createAiTraceId();
    const models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
    let rawJsonText = "";
    let lastError = "";

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      try {
        const startedAt = Date.now();
        const payload: Record<string, unknown> = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: useGoogleSearchTool
            ? { temperature: 0.25 }
            : { temperature: 0.25, responseMimeType: "application/json" },
        };
        if (useGoogleSearchTool) {
          payload.tools = [{ google_search: {} }];
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(16000),
        });

        if (!res.ok) {
          lastError = `Gemini ${model} HTTP ${res.status}: ${(await res.text()).slice(0, 180)}`;
          continue;
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const textOut = parts
          .map((p: { text?: string }) => p.text || "")
          .join("\n")
          .trim();

        await captureGeminiGeneration({
          traceId,
          distinctId: auth.userId,
          spanName: "suggest_popular_dishes",
          model,
          input: [{ role: "user", content: prompt }],
          output: textOut,
          temperature: 0.25,
          latencyMs: Date.now() - startedAt,
          status: res.status,
        });

        if (textOut) {
          rawJsonText = textOut;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Gemini request failed";
      }
    }

    if (!rawJsonText) {
      return NextResponse.json(
        { error: lastError || "AI dish discovery did not return a response." },
        { status: 502 }
      );
    }

    const parsed = extractJsonPayload(rawJsonText) as
      | { suggestions?: unknown[] }
      | unknown[];
    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
      : [];

    const existingNormalized = existingRaw.map(normalizeDishKey).filter(Boolean);
    const deduped: SuggestedPopularDish[] = [];
    const seenNormalized = [...existingNormalized];

    for (const row of rawList) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const dishName = String(item.dish_name || "").trim();
      if (!dishName || isDuplicateDish(dishName, seenNormalized)) continue;

      seenNormalized.push(normalizeDishKey(dishName));

      const rawPrice = item.price_nok;
      const cleanPrice =
        typeof rawPrice === "number" && Number.isFinite(rawPrice) && rawPrice > 0 && rawPrice < 5000
          ? Math.round(rawPrice)
          : null;

      const tags = Array.isArray(item.taste_tags)
        ? item.taste_tags
            .map((t) => String(t || "").trim())
            .filter(Boolean)
            .slice(0, 3)
        : [];

      deduped.push({
        dish_name: dishName,
        price_nok: cleanPrice,
        category: String(item.category || category).trim() || category,
        review_text: String(item.review_text || "")
          .replace(/!/g, ".")
          .trim()
          .slice(0, 140),
        taste_tags: tags,
        why_popular: String(item.why_popular || "")
          .replace(/!/g, ".")
          .trim()
          .slice(0, 95),
        source_domain: item.source_domain ? String(item.source_domain).trim() : null,
      });

      if (deduped.length >= count) break;
    }

    return NextResponse.json({
      success: true,
      suggestions: deduped,
      sourcesCount: searchEvidence.length,
      provider: providerLabel,
    });
  } catch (err: any) {
    console.error("[suggest-dishes] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to discover popular dishes" },
      { status: 500 }
    );
  }
}
