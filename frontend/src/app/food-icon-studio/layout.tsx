import { LabRouteGuard } from "@/components/auth/LabRouteGuard";

export default function FoodIconStudioLayout({ children }: { children: React.ReactNode }) {
  return <LabRouteGuard>{children}</LabRouteGuard>;
}
