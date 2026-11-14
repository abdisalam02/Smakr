import { LabRouteGuard } from "@/components/auth/LabRouteGuard";

export default function MascotStudioLayout({ children }: { children: React.ReactNode }) {
  return <LabRouteGuard>{children}</LabRouteGuard>;
}
