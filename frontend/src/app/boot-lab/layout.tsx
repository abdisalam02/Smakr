import { LabRouteGuard } from "@/components/auth/LabRouteGuard";

export default function BootLabLayout({ children }: { children: React.ReactNode }) {
  return <LabRouteGuard>{children}</LabRouteGuard>;
}
