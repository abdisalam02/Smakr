import { uploadDishPhoto } from "@/lib/supabase/data";

export async function uploadAdminImage(
  file: File,
  opts: { spotId?: string; dishId?: string } = {}
): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (opts.spotId) formData.append("spotId", opts.spotId);
    if (opts.dishId) formData.append("dishId", opts.dishId);

    const res = await fetch("/api/admin/upload-seed-image", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return { url: data.url as string, error: null };
    }
    const errData = await res.json().catch(() => ({}));
    const fallback = await uploadDishPhoto(file);
    if (fallback.url) return fallback;
    return {
      url: null,
      error: (errData?.error as string) || fallback.error || "Image upload failed.",
    };
  } catch (err) {
    const fallback = await uploadDishPhoto(file);
    if (fallback.url) return fallback;
    return {
      url: null,
      error: err instanceof Error ? err.message : fallback.error || "Image upload failed.",
    };
  }
}

export async function triggerAdminRevalidate(): Promise<void> {
  try {
    await fetch("/api/admin/revalidate", { method: "POST" });
  } catch {
    // Non-fatal: Zustand already updated client state optimistically
  }
}
