import fs from "fs";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StagedCandidateSpot } from "@/app/api/admin/seeding-lab/route";

const CURATION_BUCKET = "admin-curation";
const CURATION_FILE = "staged_candidates.json";

let bucketEnsured = false;

export function getLocalStagedFilePath(): string {
  const p1 = path.join(process.cwd(), "curation", CURATION_FILE);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), "frontend", "curation", CURATION_FILE);
  if (fs.existsSync(p2)) return p2;
  return p1;
}

function readBundledCandidates(): StagedCandidateSpot[] {
  try {
    const filePath = getLocalStagedFilePath();
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensurePrivateCurationBucket(adminClient: SupabaseClient): Promise<void> {
  if (bucketEnsured) return;
  const { data: buckets, error: listErr } = await adminClient.storage.listBuckets();
  if (!listErr && buckets?.some((b) => b.id === CURATION_BUCKET)) {
    bucketEnsured = true;
    return;
  }

  const { error: createErr } = await adminClient.storage.createBucket(CURATION_BUCKET, {
    public: false,
    allowedMimeTypes: ["application/json"],
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (!createErr || createErr.message?.toLowerCase().includes("already exists")) {
    bucketEnsured = true;
  }
}

function mergeBundledWithCloud(
  bundled: StagedCandidateSpot[],
  cloud: StagedCandidateSpot[]
): StagedCandidateSpot[] {
  if (cloud.length === 0) return bundled;
  if (bundled.length === 0) return cloud;

  const cloudById = new Map<string, StagedCandidateSpot>(cloud.map((s) => [s.id, s]));
  const merged: StagedCandidateSpot[] = [];

  // Preserve cloud edits for existing spots while absorbing newly harvested dishes/photos from git
  for (const cloudSpot of cloud) {
    const bundledSpot = bundled.find((b) => b.id === cloudSpot.id);
    if (!bundledSpot) {
      merged.push(cloudSpot);
      continue;
    }

    const existingDishIds = new Set((cloudSpot.dish_highlights || []).map((d) => d.id));
    const newlyBundledDishes = (bundledSpot.dish_highlights || []).filter(
      (d) => !existingDishIds.has(d.id)
    );

    const existingPool = new Set(cloudSpot.candidate_photos || []);
    const mergedPool = [
      ...(cloudSpot.candidate_photos || []),
      ...(bundledSpot.candidate_photos || []).filter((u) => !existingPool.has(u)),
    ];

    merged.push({
      ...cloudSpot,
      candidate_photos: mergedPool.length > 0 ? mergedPool : cloudSpot.candidate_photos,
      dish_highlights: [...(cloudSpot.dish_highlights || []), ...newlyBundledDishes],
    });
  }

  // Append any brand-new spots pushed in git that aren't in cloud storage yet
  for (const bundledSpot of bundled) {
    if (!cloudById.has(bundledSpot.id)) {
      merged.push(bundledSpot);
    }
  }

  return merged;
}

export async function readStagedCandidates(
  adminClient: SupabaseClient | null
): Promise<StagedCandidateSpot[]> {
  const bundled = readBundledCandidates();
  if (!adminClient) return bundled;

  try {
    await ensurePrivateCurationBucket(adminClient);
    const { data, error } = await adminClient.storage
      .from(CURATION_BUCKET)
      .download(CURATION_FILE);

    if (error || !data) {
      return bundled;
    }

    const text = await data.text();
    const cloudParsed = JSON.parse(text);
    if (!Array.isArray(cloudParsed)) return bundled;

    return mergeBundledWithCloud(bundled, cloudParsed as StagedCandidateSpot[]);
  } catch {
    return bundled;
  }
}

export async function writeStagedCandidates(
  adminClient: SupabaseClient | null,
  candidates: StagedCandidateSpot[]
): Promise<{ persistedCloud: boolean; persistedLocal: boolean }> {
  const payload = JSON.stringify(candidates, null, 2);
  let persistedCloud = false;
  let persistedLocal = false;
  let cloudErrorMsg = "";

  // 1. Persist to private Supabase Storage bucket (works on Vercel serverless + local)
  if (adminClient) {
    try {
      await ensurePrivateCurationBucket(adminClient);
      const { error } = await adminClient.storage
        .from(CURATION_BUCKET)
        .upload(CURATION_FILE, Buffer.from(payload, "utf8"), {
          contentType: "application/json",
          cacheControl: "0",
          upsert: true,
        });

      if (!error) {
        persistedCloud = true;
      } else {
        cloudErrorMsg = error.message;
      }
    } catch (err: any) {
      cloudErrorMsg = err?.message || "Cloud storage error";
    }
  }

  // 2. Mirror to local disk when writable (local dev); ignore EROFS on Vercel
  try {
    const filePath = getLocalStagedFilePath();
    fs.writeFileSync(filePath, payload, "utf8");
    persistedLocal = true;
  } catch {
    // Expected on Vercel read-only deployment filesystem
  }

  if (!persistedCloud && !persistedLocal) {
    throw new Error(
      `Failed to persist staged candidates (${cloudErrorMsg || "storage unavailable"}).`
    );
  }

  return { persistedCloud, persistedLocal };
}
