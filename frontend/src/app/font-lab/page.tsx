import { LabRouteGuard } from "@/components/auth/LabRouteGuard";
import { FontLabClient } from "./FontLabClient";

export const dynamic = "force-dynamic";

export default function FontLabPage() {
  return (
    <LabRouteGuard>
      <FontLabClient />
    </LabRouteGuard>
  );
}
