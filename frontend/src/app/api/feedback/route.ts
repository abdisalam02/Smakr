import { NextRequest, NextResponse, after } from "next/server";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { createClient } from "@supabase/supabase-js";
import { posthogLogLogger, posthogLogProvider } from "@/instrumentation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const ALLOWED_CATEGORIES = new Set(["bug", "missing", "design", "other"]);
const rateMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateMap.get(ip);
  if (current && current.expiresAt > now) {
    if (current.count >= 6) return false;
    current.count++;
    return true;
  }
  rateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
  return true;
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function recordFeedbackOutcome(
  outcome: "created" | "rate_limited" | "validation_rejected" | "storage_unavailable" | "storage_failed",
  severityNumber: SeverityNumber,
  statusCode: number,
  category?: string
) {
  try {
    posthogLogLogger?.emit({
      body: "feedback submission completed",
      severityNumber,
      attributes: {
        event: "feedback_submission",
        outcome,
        status_code: statusCode,
        ...(category ? { category } : {}),
      },
    });
  } catch {
    // Log delivery must never affect the feedback response.
  }

  const logProvider = posthogLogProvider;
  if (logProvider) {
    after(() => logProvider.forceFlush().catch(() => {}));
  }
}

/**
 * Server-side beta feedback endpoint.
 *
 * The live `beta_feedback` RLS policy has been missing in some environments, so
 * browser inserts can fail with 401/403. This route writes with the server key
 * and derives the reporter identity from the session instead of trusting the
 * client.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    recordFeedbackOutcome("rate_limited", SeverityNumber.WARN, 429);
    return NextResponse.json(
      { success: false, error: "Too many feedback submissions. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const feedback =
    typeof body.feedback === "string" ? body.feedback.trim().slice(0, 2000) : "";
  if (!feedback) {
    recordFeedbackOutcome("validation_rejected", SeverityNumber.WARN, 400);
    return NextResponse.json(
      { success: false, error: "Feedback text is required." },
      { status: 400 }
    );
  }

  const category =
    typeof body.category === "string" && ALLOWED_CATEGORIES.has(body.category)
      ? body.category
      : "other";
  const deviceInfo =
    body.device_info && typeof body.device_info === "object" && !Array.isArray(body.device_info)
      ? body.device_info
      : {};

  const supabase = getAdminClient();
  if (!supabase) {
    recordFeedbackOutcome("storage_unavailable", SeverityNumber.ERROR, 503, category);
    return NextResponse.json(
      { success: false, error: "Feedback database is not configured." },
      { status: 503 }
    );
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  let userHandle: string | null = null;

  try {
    const ssr = await getSupabaseServerClient();
    const {
      data: { user },
    } = (await ssr?.auth.getUser()) ?? { data: { user: null } };

    if (user) {
      userId = user.id;
      userEmail = user.email ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();
      userHandle = profile?.handle ? String(profile.handle).slice(0, 50) : null;
    }
  } catch {
    // Anonymous feedback is valid; never fail because session lookup failed.
  }

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: userId,
    user_email: userEmail,
    user_handle: userHandle,
    category,
    feedback,
    device_info: deviceInfo,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    recordFeedbackOutcome("storage_failed", SeverityNumber.ERROR, 500, category);
    return NextResponse.json(
      { success: false, error: "Could not save feedback right now." },
      { status: 500 }
    );
  }

  recordFeedbackOutcome("created", SeverityNumber.INFO, 200, category);
  return NextResponse.json({ success: true });
}
