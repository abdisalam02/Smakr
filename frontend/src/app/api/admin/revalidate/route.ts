import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    revalidateTag("venues");
    revalidateTag("food_posts");
    revalidateTag("weekly_drop");
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/seeding-lab");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Revalidation failed" },
      { status: 500 }
    );
  }
}
