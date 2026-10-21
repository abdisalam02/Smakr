import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Server-side admin authentication guard */
async function verifyAdminAuth(): Promise<{ isAdmin: boolean; userId?: string }> {
  const ssrClient = await getSupabaseServerClient();
  if (!ssrClient) return { isAdmin: false };

  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) return { isAdmin: false };

  const supabase = getAdminClient();
  if (!supabase) return { isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return { isAdmin: true, userId: user.id };
  }

  return { isAdmin: false };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin session required." }, { status: 403 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database unconfigured" }, { status: 500 });
    }

    // Try fetching from partner_claims table
    const { data: claims, error: claimsErr } = await supabase
      .from("partner_claims")
      .select("*, venue:venues(id, name, address, image_url, vibe_signals, category)")
      .order("created_at", { ascending: false });

    if (claimsErr) {
      // If table is unmigrated, check fallback in vibe_signals
      if (claimsErr.code === "42P01" || claimsErr.message.includes("does not exist")) {
        const { data: fallbackVenues } = await supabase
          .from("venues")
          .select("id, name, address, image_url, vibe_signals, category");

        const syntheticClaims = (fallbackVenues || [])
          .filter((v) => {
            const sig = (v.vibe_signals || {}) as Record<string, unknown>;
            return Boolean(sig.pending_partner_claim);
          })
          .map((v) => {
            const sig = v.vibe_signals as Record<string, any>;
            const claim = sig.pending_partner_claim;
            return {
              id: `fallback_${v.id}`,
              venue_id: v.id,
              status: "pending",
              applicant_name: claim.applicant?.name || "Applicant",
              applicant_role: claim.applicant?.role || "owner",
              applicant_email: claim.applicant?.email || "",
              applicant_phone: claim.applicant?.phone || "",
              applicant_instagram: claim.applicant?.instagram || "",
              org_number: claim.applicant?.org_number || "",
              proposed: claim.proposed,
              snapshot: claim.snapshot,
              created_at: claim.submitted_at || new Date().toISOString(),
              venue: v,
            };
          });

        return NextResponse.json({
          success: true,
          claims: syntheticClaims,
          note: "Served via fallback pending database migration.",
        });
      }

      return NextResponse.json({ success: false, error: claimsErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claims: claims || [],
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
