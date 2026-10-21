import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Reconcile denormalised reaction counters with the join tables.
 *
 * The live database currently has an extra reaction trigger, so one like/save
 * increments the counter twice. This idempotent endpoint is called after the
 * client reaction write and restores the exact counts. The SQL migration in
 * `supabase/migrations/20261022_fix_reaction_counters_and_feedback.sql` fixes
 * the trigger itself for future writes.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const postId = typeof body.postId === "string" ? body.postId.trim() : "";

  if (!UUID_RE.test(postId)) {
    return NextResponse.json(
      { success: false, error: "Invalid postId." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database is not configured." },
      { status: 503 }
    );
  }

  const [likes, saves] = await Promise.all([
    supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("post_saves").select("*", { count: "exact", head: true }).eq("post_id", postId),
  ]);

  if (likes.error || saves.error) {
    return NextResponse.json(
      { success: false, error: likes.error?.message || saves.error?.message || "Count failed." },
      { status: 500 }
    );
  }

  const likesCount = likes.count ?? 0;
  const savesCount = saves.count ?? 0;

  const { error } = await supabase
    .from("food_posts")
    .update({ likes_count: likesCount, saves_count: savesCount })
    .eq("id", postId);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    likes_count: likesCount,
    saves_count: savesCount,
  });
}
