import { LabRouteGuard } from "@/components/auth/LabRouteGuard";
import { anton } from "@/lib/fonts";

export default function AdReelLayout({ children }: { children: React.ReactNode }) {
  return (
    <LabRouteGuard>
      <div className={anton.variable}>{children}</div>
    </LabRouteGuard>
  );
}
