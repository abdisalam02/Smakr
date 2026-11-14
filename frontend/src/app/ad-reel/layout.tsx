import { LabRouteGuard } from "@/components/auth/LabRouteGuard";

export default function AdReelLayout({ children }: { children: React.ReactNode }) {
  return <LabRouteGuard>{children}</LabRouteGuard>;
}
