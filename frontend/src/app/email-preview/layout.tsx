import { LabRouteGuard } from "@/components/auth/LabRouteGuard";

export default function EmailPreviewLayout({ children }: { children: React.ReactNode }) {
  return <LabRouteGuard>{children}</LabRouteGuard>;
}
