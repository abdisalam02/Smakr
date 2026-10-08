"use client";

import { useEffect, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OnboardingAvatarConfig } from "@/types/onboarding";
import type { MascotConfig } from "@/types/mascot";
import type { UserProfile } from "@/types";

/**
 * Keeps Zustand's `currentUser` in sync with the real Supabase session.
 *
 * On every auth event we resolve `public.profiles` for the signed-in user and
 * map it into the store. If the row is missing (trigger delay / omission) we
 * best-effort upsert it client-side so the user is always hydrated. `SIGNED_OUT`
 * clears the user. Mounted in the root layout so the header / admin gate react
 * to session changes everywhere.
 */

interface ProfileRow {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_official: boolean | null;
  avatar_config?: OnboardingAvatarConfig | null;
  onboarding_completed?: boolean | null;
  mascot_config?: MascotConfig | null;
}

// `*` (rather than an explicit column list) keeps the lookup resilient while the
// onboarding migration is pending — PostgREST simply omits absent columns.
const PROFILE_COLUMNS = "*";

/** Display handles with a leading `@` regardless of how the DB stored them. */
function formatHandle(raw: string | null | undefined, email?: string): string {
  const base = (raw && raw.trim()) || (email ?? "foodie").split("@")[0];
  const cleaned = base.replace(/^[@_\s]+/, "") || (email ?? "foodie").split("@")[0];
  return `@${cleaned}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setCurrentUser = useCityPulseStore((state) => state.setCurrentUser);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const setIsAuthResolved = useCityPulseStore((state) => state.setIsAuthResolved);
  const hydrateMascotConfig = useCityPulseStore((state) => state.hydrateMascotConfig);
  const showToast = useCityPulseStore((state) => state.showToast);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // No Supabase configured (local dev bypass) → stop showing the skeleton.
      setIsAuthResolved(true);
      return;
    }

    let cancelled = false;

    const fetchProfile = async (id: string): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        // RLS may hide the row, or the trigger may not have run yet.
        console.warn("[AuthProvider] profiles lookup failed:", error.message);
        return null;
      }
      return (data as ProfileRow) ?? null;
    };

    /** Resolve the profile row, retrying once then falling back to an upsert. */
    const ensureProfile = async (session: Session): Promise<ProfileRow | null> => {
      const user = session.user;

      let profile = await fetchProfile(user.id);
      if (profile) return profile;

      // The `handle_new_user` trigger can lag a moment behind the auth insert.
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (cancelled) return null;
      profile = await fetchProfile(user.id);
      if (profile) return profile;

      // Still nothing — create the row ourselves.
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const rawHandle =
        (meta.user_name as string) ||
        (meta.handle as string) ||
        (user.email ?? "foodie").split("@")[0];
      const handle =
        rawHandle.replace(/^[@_\s]+/, "") || (user.email ?? "foodie").split("@")[0];
      const name = (meta.full_name as string) || (meta.name as string) || "Smakr Foodie";
      const avatar = (meta.avatar_url as string) || null;

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          handle,
          name,
          avatar_url: avatar,
          role: "foodie",
          is_official: false,
        })
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        // Usually RLS without an INSERT policy — fall back to metadata below.
        console.warn("[AuthProvider] profile upsert failed:", error.message);
        return null;
      }
      return (data as ProfileRow) ?? null;
    };

    const hydrate = async (session: Session) => {
      const user = session.user;
      const profile = await ensureProfile(session);
      if (cancelled) return;

      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: user.email,
          handle: formatHandle(profile.handle, user.email),
          name: profile.name ?? undefined,
          role: profile.role === "admin" ? "admin" : "foodie",
          is_official: Boolean(profile.is_official),
          avatar_url: profile.avatar_url ?? undefined,
          avatar_config: profile.avatar_config ?? undefined,
          onboarding_completed: Boolean(profile.onboarding_completed),
        });
        // Mascot is per-user (profiles.mascot_config) — restore it when present.
        if (profile.mascot_config) {
          hydrateMascotConfig(profile.mascot_config);
        }
        return;
      }

      // Last resort: build a transient user from the auth metadata.
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const rawHandle =
        (meta.user_name as string) ||
        (meta.handle as string) ||
        (user.email ?? "foodie").split("@")[0];
      setCurrentUser({
        id: user.id,
        email: user.email,
        handle: formatHandle(rawHandle, user.email),
        name: (meta.full_name as string) || (meta.name as string) || undefined,
        role: "foodie",
        is_official: false,
        avatar_url: (meta.avatar_url as string) || undefined,
        onboarding_completed: false,
      });
    };

    /** Build a transient user straight from the JWT metadata (no network). */
    const metaUser = (session: Session): UserProfile => {
      const user = session.user;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const rawHandle =
        (meta.user_name as string) ||
        (meta.handle as string) ||
        (user.email ?? "foodie").split("@")[0];
      return {
        id: user.id,
        email: user.email,
        handle: formatHandle(rawHandle, user.email),
        name: (meta.full_name as string) || (meta.name as string) || undefined,
        role: "foodie",
        is_official: false,
        avatar_url: (meta.avatar_url as string) || undefined,
        onboarding_completed: false,
      };
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        // No session → never leave a stale (cached) user on screen.
        setCurrentUser(null);
        setIsAuthResolved(true);
        return;
      }

      // Instant, network-free hydration so the header shows the user on the
      // first frame; the `profiles` row then enriches it in the background.
      if (!useCityPulseStore.getState().currentUser) {
        setCurrentUser(metaUser(session));
      }
      setIsAuthResolved(true);

      // Never await inside the callback — defer the async work instead.
      setTimeout(() => {
        void hydrate(session);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setCurrentUser, setIsAuthResolved, hydrateMascotConfig]);

  // Surface middleware / callback bounces: `?auth=required` opens the modal,
  // `?auth_error=...` explains a failed PKCE exchange.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const needsAuth = params.get("auth") === "required";
    const authError = params.get("auth_error");

    if (needsAuth) {
      setIsAuthModalOpen(true);
    }

    if (authError) {
      setIsAuthModalOpen(true);
      showToast("We couldn't complete that sign-in. Please try again.");
    }

    if (needsAuth || authError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [setIsAuthModalOpen, showToast]);

  return <>{children}</>;
}
