"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCityPulseStore } from "@/store/useCityPulseStore";

const ThemeStudioModal = dynamic(
  () => import("@/components/ui/ThemeStudioModal").then((m) => m.ThemeStudioModal),
  { ssr: false }
);
const UserOnboardingModal = dynamic(
  () => import("@/components/auth/UserOnboardingModal").then((m) => m.UserOnboardingModal),
  { ssr: false }
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((m) => m.AuthModal),
  { ssr: false }
);
const BetaFeedbackDrawer = dynamic(
  () => import("@/components/feedback/BetaFeedbackDrawer").then((m) => m.BetaFeedbackDrawer),
  { ssr: false }
);
const CreateFoodPostModal = dynamic(
  () => import("@/components/food/CreateFoodPostModal").then((m) => m.CreateFoodPostModal),
  { ssr: false }
);
const AdminQuickEditModal = dynamic(
  () => import("@/components/admin/AdminQuickEditModal").then((m) => m.AdminQuickEditModal),
  { ssr: false }
);

/**
 * Lazy-loaded modal host for RootLayout so heavy dialog bundles (CreateFoodPostModal,
 * UserOnboardingModal, ThemeStudioModal, etc.) never bloat initial page hydration.
 */
export function GlobalModalsHost() {
  const isThemeStudioOpen = useCityPulseStore((s) => s.isThemeStudioOpen);
  const isAvatarStudioOpen = useCityPulseStore((s) => s.isAvatarStudioOpen);
  const isAuthModalOpen = useCityPulseStore((s) => s.isAuthModalOpen);
  const isBetaFeedbackOpen = useCityPulseStore((s) => s.isBetaFeedbackOpen);
  const isCreateBiteModalOpen = useCityPulseStore((s) => s.isCreateBiteModalOpen);
  const quickEditPost = useCityPulseStore((s) => s.quickEditPost);
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const profileResolved = useCityPulseStore((s) => s.profileResolved);

  const [onboardingPreviewRequested, setOnboardingPreviewRequested] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("onboarding") || sp.has("preview_onboarding")) {
      setOnboardingPreviewRequested(true);
    }
    const win = window as unknown as {
      openOnboardingPreview?: () => void;
      __smakrOnboardingPreviewQueued?: boolean;
    };
    if (!win.openOnboardingPreview) {
      win.openOnboardingPreview = () => {
        win.__smakrOnboardingPreviewQueued = true;
        setOnboardingPreviewRequested(true);
      };
    }

    // Warm the CreateFoodPostModal chunk during idle so tapping '+' opens instantly.
    const timer = window.setTimeout(() => {
      void import("@/components/food/CreateFoodPostModal");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const needsOnboarding =
    onboardingPreviewRequested ||
    isAvatarStudioOpen ||
    Boolean(
      currentUser &&
        profileResolved &&
        currentUser.onboarding_completed !== true &&
        !currentUser.is_official &&
        currentUser.role !== "admin"
    );

  return (
    <>
      {isThemeStudioOpen && <ThemeStudioModal />}
      {needsOnboarding && <UserOnboardingModal />}
      {isAuthModalOpen && <AuthModal />}
      {isBetaFeedbackOpen && <BetaFeedbackDrawer />}
      {isCreateBiteModalOpen && <CreateFoodPostModal />}
      {Boolean(quickEditPost) && <AdminQuickEditModal />}
    </>
  );
}
