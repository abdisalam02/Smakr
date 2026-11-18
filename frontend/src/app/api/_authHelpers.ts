import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateBucket>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Lightweight per-instance sliding/fixed-window rate limiter keyed by client IP
 * + bucket name so authenticated endpoints cannot be abused in tight loops.
 */
export function checkIpRateLimit(
  request: Request,
  bucket: string,
  limit = 20,
  windowMs = 60_000
): { ok: true } | { ok: false; response: NextResponse } {
  const now = Date.now();
  if (ipBuckets.size > 500) {
    for (const [k, v] of ipBuckets.entries()) {
      if (v.resetAt <= now) ipBuckets.delete(k);
    }
  }

  const key = `${bucket}:${getClientIp(request)}`;
  const existing = ipBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    ipBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      ),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/**
 * Verifies an active Supabase user session via cookies (`auth.getUser()`).
 */
export async function requireAuthenticatedUser(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const ssrClient = await getSupabaseServerClient();
  if (!ssrClient) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 }),
    };
  }

  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 }),
    };
  }

  return { ok: true, userId: user.id };
}
