/**
 * Onboarding avatar schema — now backed by DiceBear **Open Peeps**.
 *
 * The canonical definitions (config type, authentic enums, the four base
 * presets, the URL generator and the local renderers) all live in
 * `@/lib/onboardingAvatar`. This module keeps a stable import surface for the
 * rest of the app — notably `UserProfile.avatar_config`, the persistence layer
 * and the auth provider — without pulling the renderer into type-only consumers.
 */

export type {
  OpenPeepsConfig,
  OpenPeepsPresetId,
  OpenPeepsPreset,
  HeadwearValue,
  AccessoryValue,
  FacialHairValue,
} from "@/lib/onboardingAvatar";

import type { OpenPeepsConfig } from "@/lib/onboardingAvatar";

/** Back-compat alias for the blob persisted to `public.profiles.avatar_config`. */
export type OnboardingAvatarConfig = OpenPeepsConfig;
