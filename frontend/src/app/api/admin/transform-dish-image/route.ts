import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dns from "node:dns/promises";
import fs from "fs";
import net from "node:net";
import path from "path";
import sharp from "sharp";
import {
  buildDishSynthesisPrompt,
  resolveCategoryRemixDefaults,
  type AnglePresetId,
  type EnvironmentPresetId,
} from "@/lib/dishImageRemixConfig";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";
import { requireAdmin } from "@/app/api/admin/_auth";
import { captureGeminiGeneration, createAiTraceId } from "@/lib/posthog-ai";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const STORAGE_BUCKET = "dish-photos";
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

function isPrivateIpAddress(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/i, "");
  if (net.isIPv4(normalized)) {
    const parts = normalized.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const lower = normalized.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

async function assertSafeRemoteImageUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https image URLs are allowed.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    throw new Error("Blocked private or localhost URL.");
  }
  if (net.isIP(host)) {
    if (isPrivateIpAddress(host)) throw new Error("Blocked private IP address.");
    return parsed;
  }
  const records = await dns.lookup(host, { all: true });
  if (!records?.length || records.some((rec) => isPrivateIpAddress(rec.address))) {
    throw new Error("Blocked private DNS target.");
  }
  return parsed;
}

function resolveLocalPublicFile(relUrl: string): string | null {
  const cleanRel = relUrl.replace(/^\/+/, "").split("?")[0];
  const publicRoots = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "frontend", "public"),
  ];
  for (const root of publicRoots) {
    const resolved = path.resolve(root, cleanRel);
    if (resolved.startsWith(root + path.sep) && fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

async function fetchSourceImageBuffer(rawUrl: string, origin: string): Promise<Buffer> {
  let targetUrl = rawUrl.trim();
  let allowOriginFallback = false;

  if (targetUrl.startsWith("places/") || targetUrl.includes("/api/places/photos")) {
    const resolved = await ingestGooglePhotoToSupabase(targetUrl);
    if (resolved && resolved.startsWith("http")) {
      targetUrl = resolved;
    } else if (targetUrl.startsWith("/")) {
      targetUrl = `${origin}${targetUrl}`;
      allowOriginFallback = true;
    }
  } else if (targetUrl.startsWith("/")) {
    const localPublicPath = resolveLocalPublicFile(targetUrl);
    if (localPublicPath) {
      return fs.readFileSync(localPublicPath);
    }
    targetUrl = `${origin}${targetUrl}`;
    allowOriginFallback = true;
  }

  let currentUrl = allowOriginFallback
    ? new URL(targetUrl)
    : await assertSafeRemoteImageUrl(targetUrl);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
  };

  let res: Response | null = null;
  for (let hop = 0; hop <= 3; hop++) {
    res = await fetch(currentUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers,
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location || hop === 3) {
        throw new Error(`Blocked or excessive redirects fetching source image: ${targetUrl}`);
      }
      currentUrl = await assertSafeRemoteImageUrl(new URL(location, currentUrl).toString());
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new Error(`Failed to fetch source image (${res?.status ?? "unknown"}): ${targetUrl}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Direct Multimodal Image-to-Image Camera & Background Shift using Nano Banana Lite
 * (`gemini-3.1-flash-lite-image` with fallback to `gemini-2.5-flash-image`).
 * Never calls paid `gemini-3.1-flash-image`.
 * Passes the reference image inlineData directly into the model so the exact bowl/plate,
 * rim pattern, food colors, and lack of extra props are preserved 100%.
 */
async function runMultimodalCameraShift(
  referenceJpegBase64: string,
  synthesisPrompt: string,
  temperature: number,
  observability: { traceId: string; distinctId: string }
): Promise<{ imageBuffer: Buffer; visualReceipt: string; modelUsed: string }> {
  const modelsToTry = ["gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"];
  let lastError = "Multimodal image transformation failed";

  for (const modelName of modelsToTry) {
    try {
      const startedAt = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: referenceJpegBase64,
                  },
                },
                { text: synthesisPrompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        lastError = `${modelName} returned ${res.status}: ${errBody.slice(0, 200)}`;
        await captureGeminiGeneration({
          ...observability,
          spanName: "transform_dish_image",
          model: modelName,
          input: [{ role: "user", content: [{ type: "image", image: referenceJpegBase64 }, { type: "text", text: synthesisPrompt }] }],
          temperature,
          latencyMs: Date.now() - startedAt,
          status: res.status,
          error: lastError,
        });
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let imageBuffer: Buffer | null = null;
      const textParts: string[] = [];

      for (const part of parts) {
        if (part?.text && !part?.thought) {
          textParts.push(part.text.trim());
        }
        if (part?.inlineData?.data) {
          imageBuffer = Buffer.from(part.inlineData.data, "base64");
        }
      }

      if (imageBuffer) {
        const visualReceipt =
          textParts.filter(Boolean).join(" ") ||
          "Direct multimodal reference image locked (vessel, glaze, and ingredient geometry preserved).";
        await captureGeminiGeneration({
          ...observability,
          spanName: "transform_dish_image",
          model: modelName,
          input: [{ role: "user", content: [{ type: "image", image: referenceJpegBase64 }, { type: "text", text: synthesisPrompt }] }],
          output: visualReceipt,
          temperature,
          latencyMs: Date.now() - startedAt,
          status: res.status,
        });
        return {
          imageBuffer,
          visualReceipt,
          modelUsed: modelName,
        };
      }

      lastError = `${modelName} returned no image inlineData.`;
      await captureGeminiGeneration({
        ...observability,
        spanName: "transform_dish_image",
        model: modelName,
        input: [{ role: "user", content: [{ type: "image", image: referenceJpegBase64 }, { type: "text", text: synthesisPrompt }] }],
        output: textParts.join(" "),
        temperature,
        latencyMs: Date.now() - startedAt,
        status: res.status,
        error: lastError,
      });
    } catch (err: any) {
      lastError = err.message || String(err);
      await captureGeminiGeneration({
        ...observability,
        spanName: "transform_dish_image",
        model: modelName,
        input: [{ role: "user", content: [{ type: "image", image: referenceJpegBase64 }, { type: "text", text: synthesisPrompt }] }],
        temperature,
        latencyMs: 0,
        error: lastError,
      });
    }
  }

  throw new Error(lastError);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in frontend/.env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      imageUrl,
      dishName = "Signature Dish",
      category = "restaurant",
      anglePreset,
      environmentPreset,
      variationSeed,
    } = body as {
      imageUrl: string;
      dishName?: string;
      category?: string;
      anglePreset?: AnglePresetId;
      environmentPreset?: EnvironmentPresetId;
      variationSeed?: number;
    };

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Missing source imageUrl" }, { status: 400 });
    }

    if (isDeliveryAppImageUrl(imageUrl)) {
      return NextResponse.json(
        {
          error:
            "Wolt/Foodora photos cannot be AI-shifted — pick a Google Maps, kitchen, or uploaded photo instead.",
        },
        { status: 400 }
      );
    }

    const defaults = resolveCategoryRemixDefaults(category, dishName);
    const chosenAngle: AnglePresetId = anglePreset || "preserve_food_clean_scene";
    const chosenEnvironment: EnvironmentPresetId =
      environmentPreset || defaults.defaultEnvironment;

    // 1. Fetch source image & convert to clean JPEG buffer for multimodal input
    const rawBuffer = await fetchSourceImageBuffer(imageUrl, req.nextUrl.origin);
    const normalizedJpegBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const jpegBase64 = normalizedJpegBuffer.toString("base64");

    // 2. Build Direct Multimodal Polish / Camera Shift Prompt
    const {
      prompt: synthesisPrompt,
      selectedAngleLabel,
      selectedSurfaceLabel,
      recommendedTemperature,
    } = buildDishSynthesisPrompt({
      dishName,
      category,
      anglePreset: chosenAngle,
      environmentPreset: chosenEnvironment,
      variationSeed: variationSeed || Math.floor(1000 + Math.random() * 9000),
    });

    // 3. Run single-pass multimodal image transform (Nano Banana Lite)
    const { imageBuffer: generatedRawBuffer, visualReceipt, modelUsed } =
      await runMultimodalCameraShift(jpegBase64, synthesisPrompt, recommendedTemperature, {
        traceId: createAiTraceId(),
        distinctId: auth.userId,
      });

    // 4. Post-process via Sharp to exact 4:3 (1080x810) WebP @ quality 84
    const finalWebpBuffer = await sharp(generatedRawBuffer)
      .resize({ width: 1080, height: 810, fit: "cover" })
      .webp({ quality: 84 })
      .toBuffer();

    const hash = crypto
      .createHash("sha256")
      .update(`${dishName}_${Date.now()}_${Math.random()}`)
      .digest("hex")
      .slice(0, 20);
    const fileName = `remix_${hash}.webp`;
    const storagePath = `ai-remix/${fileName}`;

    // 5. Upload to Supabase Storage `dish-photos/`
    let finalPublicUrl = "";
    let storageFailureReason = "Supabase Storage client unavailable";
    const supabase = auth.adminClient;
    if (supabase) {
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, finalWebpBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });

      if (!uploadErr) {
        finalPublicUrl = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath).data.publicUrl;
      } else {
        storageFailureReason = uploadErr.message;
        console.warn("[transform-dish-image] Supabase upload failed:", uploadErr.message);
      }
    }

    if (!finalPublicUrl) {
      const isProductionReadOnly =
        process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
      if (isProductionReadOnly) {
        return NextResponse.json(
          {
            error: `Supabase Storage upload failed in production (${storageFailureReason}). Cannot fall back to local filesystem.`,
          },
          { status: 502 }
        );
      }

      try {
        const hasRootPublic = fs.existsSync(path.join(process.cwd(), "public"));
        const localDir = hasRootPublic
          ? path.join(process.cwd(), "public", "curation-remix")
          : path.join(process.cwd(), "frontend", "public", "curation-remix");
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localDir, fileName), finalWebpBuffer);
        finalPublicUrl = `/curation-remix/${fileName}`;
      } catch (fsErr: any) {
        return NextResponse.json(
          {
            error: `Supabase upload failed (${storageFailureReason}) and local fallback failed (${fsErr?.message || "EROFS"}).`,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalPublicUrl,
      modelUsed,
      selectedAngleLabel,
      selectedSurfaceLabel,
      extractedCulinaryDna: visualReceipt,
      promptReceipt: synthesisPrompt,
    });
  } catch (err: any) {
    console.error("[transform-dish-image] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to transform dish image" },
      { status: 500 }
    );
  }
}
