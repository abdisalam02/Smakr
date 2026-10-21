import { redirect } from "next/navigation";
import { fetchCurrentUserServer } from "@/lib/supabase/serverData";

/**
 * Server-side gate for the Control Center.
 *
 * The previous protection lived entirely in the client bundle, so any signed-in
 * user could load /admin and only saw the client-side heuristic. This layout
 * validates the real `public.profiles.role` on the server before rendering.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await fetchCurrentUserServer();
  if (!user) redirect("/?auth=required");
  if (user.role !== "admin") redirect("/");
  return <>{children}</>;
}
