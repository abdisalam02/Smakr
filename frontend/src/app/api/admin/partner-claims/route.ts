import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const supabase = auth.adminClient;

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
