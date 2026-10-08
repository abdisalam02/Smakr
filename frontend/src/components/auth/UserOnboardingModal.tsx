"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Shuffle,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  ACCESSORIES_OPTIONS,
  CLOTHING_COLORS,
  DEFAULT_OPEN_PEEPS_CONFIG,
  EXPRESSION_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  HEADWEAR_OPTIONS,
  MENS_HAIR_CATEGORIES,
  NATURAL_HAIR_COLORS,
  OPEN_PEEPS_PRESETS,
  SKIN_TONES,
  WOMENS_HAIR_CATEGORIES,
  buildOpenPeepsDataUri,
  buildOpenPeepsSvg,
  normalizeOpenPeepsConfig,
  openPeepsConfigFromPreset,
  surpriseOpenPeepsConfig,
  type MensHairCategoryKey,
  type OpenPeepsConfig,
  type OpenPeepsPresetId,
  type WomensHairCategoryKey,
} from "@/lib/onboardingAvatar";
import { persistOnboarding } from "@/lib/supabase/data";

/**
 * Open Peeps avatar builder — a **staged wizard** so users are never confronted
 * with everything at once. The avatar preview is pinned and stays visible while
 * each step's options change it live.
 *
 * Two modes: first-run onboarding, and "Customize Avatar & Look" edit mode.
 */
const STEPS = [
  { key: "base", title: "Base preset", hint: "Pick your starting look" },
  { key: "hair", title: "Hair style", hint: "Find your texture & cut" },
  { key: "hats", title: "Hats & headwear", hint: "Add a fitted hat or wrap" },
  { key: "colors", title: "Colours", hint: "Skin, hair & outfit" },
  { key: "vibe", title: "Face & Beard", hint: "Expression, eyewear & facial hair" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

/** Sub-filter tabs for the men's hair section. */
const MENS_HAIR_TABS: { key: MensHairCategoryKey; label: string }[] = [
  { key: "fades", label: "Fades & Short" },
  { key: "wavyVolume", label: "Wavy & Quiff" },
  { key: "flowLong", label: "Flow & Long" },
  { key: "braidsAfro", label: "Braids & Afro" },
];

/** Sub-filter tabs for the women's hair section. */
const WOMENS_HAIR_TABS: { key: WomensHairCategoryKey; label: string }[] = [
  { key: "bobBangs", label: "Bob & Bangs" },
  { key: "longWavy", label: "Long & Wavy" },
  { key: "bunsUpdos", label: "Buns & Updos" },
  { key: "afroBraids", label: "Afro & Braids" },
];

type HairCategoryKey = MensHairCategoryKey | WomensHairCategoryKey;

function mensCategoryForHead(value: string): MensHairCategoryKey {
  for (const tab of MENS_HAIR_TABS) {
    if (MENS_HAIR_CATEGORIES[tab.key].some((o) => o.value === value)) return tab.key;
  }
  return "fades";
}

function womensCategoryForHead(value: string): WomensHairCategoryKey {
  for (const tab of WOMENS_HAIR_TABS) {
    if (WOMENS_HAIR_CATEGORIES[tab.key].some((o) => o.value === value)) return tab.key;
  }
  return "bobBangs";
}

function categoryForHead(isMasculine: boolean, value: string): HairCategoryKey {
  return isMasculine ? mensCategoryForHead(value) : womensCategoryForHead(value);
}

export function UserOnboardingModal() {
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setCurrentUser = useCityPulseStore((state) => state.setCurrentUser);
  const showToast = useCityPulseStore((state) => state.showToast);
  const isStudioOpen = useCityPulseStore((state) => state.isAvatarStudioOpen);
  const setIsStudioOpen = useCityPulseStore((state) => state.setIsAvatarStudioOpen);

  const [config, setConfig] = useState<OpenPeepsConfig>(DEFAULT_OPEN_PEEPS_CONFIG);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hairCategory, setHairCategory] = useState<HairCategoryKey>("fades");
  const seededFor = useRef<string | null>(null);

  const isEditMode = isStudioOpen;
  const isMasculine = config.genderPreset.startsWith("male");
  const isLastStep = step === STEPS.length - 1;

  // Seed levers from the signed-in user the first time we see them.
  useEffect(() => {
    if (!currentUser) {
      setDismissed(false);
      seededFor.current = null;
      return;
    }
    if (seededFor.current === currentUser.id) return;
    seededFor.current = currentUser.id;
    const seeded = normalizeOpenPeepsConfig(currentUser.avatar_config);
    setConfig(seeded);
    setHairCategory(categoryForHead(seeded.genderPreset.startsWith("male"), seeded.headType));
    setStep(0);
    setHandle(
      (currentUser.handle || "").replace(/^[@_\s]+/, "") ||
        (currentUser.email ? currentUser.email.split("@")[0] : "")
    );
    setDisplayName(currentUser.name || "");
  }, [currentUser]);

  // Re-seed the moment the builder opens in edit mode.
  useEffect(() => {
    if (!isStudioOpen) return;
    const user = useCityPulseStore.getState().currentUser;
    if (!user) return;
    const seeded = normalizeOpenPeepsConfig(user.avatar_config);
    setConfig(seeded);
    setHairCategory(categoryForHead(seeded.genderPreset.startsWith("male"), seeded.headType));
    setStep(0);
    setHandle((user.handle || "").replace(/^[@_\s]+/, ""));
    setDisplayName(user.name || "");
  }, [isStudioOpen]);

  const previewSvg = useMemo(() => buildOpenPeepsSvg(config), [config]);

  // Live miniatures for the four base presets (computed once).
  const presetSvgs = useMemo(
    () => OPEN_PEEPS_PRESETS.map((p) => buildOpenPeepsSvg(openPeepsConfigFromPreset(p.id))),
    []
  );

  const shouldShowOnboarding =
    Boolean(currentUser) &&
    currentUser!.onboarding_completed !== true &&
    !currentUser!.is_official &&
    currentUser!.role !== "admin" &&
    !dismissed;

  const shouldShow = Boolean(currentUser) && (isEditMode || shouldShowOnboarding);

  if (!shouldShow || !currentUser) return null;

  const update = (patch: Partial<OpenPeepsConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const applyPreset = (id: OpenPeepsPresetId) => {
    const next = openPeepsConfigFromPreset(id);
    setConfig(next);
    setHairCategory(categoryForHead(id.startsWith("male"), next.headType));
  };

  const surprise = () => {
    const next = surpriseOpenPeepsConfig();
    setConfig(next);
    setHairCategory(categoryForHead(next.genderPreset.startsWith("male"), next.headType));
  };

  // Picking hair takes any hat off so the choice is immediately visible.
  const selectHair = (value: string) => update({ headType: value, headwear: "none" });

  const close = () => {
    if (isEditMode) setIsStudioOpen(false);
    else setDismissed(true);
  };

  const handleComplete = async () => {
    const cleanHandle = "@" + handle.trim().replace(/^@+/, "").replace(/\s+/g, "_");
    if (cleanHandle === "@") {
      showToast("Pick a @handle to finish your profile.");
      return;
    }
    setSaving(true);
    const avatarUrl = buildOpenPeepsDataUri(config);
    const cleanName = displayName.trim();
    const persisted = await persistOnboarding({
      userId: currentUser.id,
      handle: cleanHandle,
      name: cleanName,
      avatarConfig: config,
      avatarUrl,
    });
    // Hydrate locally regardless — the UI reflects the choice instantly.
    setCurrentUser({
      ...currentUser,
      handle: cleanHandle,
      name: cleanName || undefined,
      avatar_url: avatarUrl,
      avatar_config: config,
      onboarding_completed: true,
    });
    setSaving(false);
    setDismissed(true);
    setIsStudioOpen(false);
    showToast(
      persisted
        ? isEditMode
          ? "Avatar updated ✨ Looking sharp."
          : "Welcome to Smakr ✨ Your foodie profile is ready."
        : "Profile saved locally — run the onboarding migration to sync to Supabase."
    );
  };

  const renderStep = (key: StepKey) => {
    switch (key) {
      case "base":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {OPEN_PEEPS_PRESETS.map((p, i) => {
                const active = config.genderPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`group relative p-2.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      active
                        ? "border-[#e84a27] bg-orange-50/60 ring-2 ring-[#e84a27]/15"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#e84a27] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="flex items-center gap-2.5">
                      <span
                        className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-orange-50 border border-black/5"
                        dangerouslySetInnerHTML={{ __html: presetSvgs[i] }}
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-xs font-bold ${
                            active ? "text-[#e84a27]" : "text-zinc-800"
                          }`}
                        >
                          {p.label}
                        </span>
                        <span className="block text-[10px] text-zinc-500 leading-tight">
                          {p.hint}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Section title="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all"
              />
            </Section>

            <Section title="Your @handle">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#e84a27]">
                  @
                </span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="your_foodie_handle"
                  className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all"
                />
              </div>
            </Section>
          </div>
        );

      case "hair": {
        const tabs: { key: string; label: string }[] = isMasculine
          ? MENS_HAIR_TABS
          : WOMENS_HAIR_TABS;
        const activeKey = tabs.some((t) => t.key === hairCategory) ? hairCategory : tabs[0].key;
        const options: readonly { label: string; value: string }[] = isMasculine
          ? MENS_HAIR_CATEGORIES[activeKey as MensHairCategoryKey]
          : WOMENS_HAIR_CATEGORIES[activeKey as WomensHairCategoryKey];
        return (
          <div className="space-y-4">
            <div className="-mx-1 px-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {tabs.map((tab) => {
                const active = activeKey === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setHairCategory(tab.key as HairCategoryKey)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                      active
                        ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm shadow-[#e84a27]/25"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {options.map((opt) => (
                <Pill
                  key={opt.value}
                  active={config.headType === opt.value}
                  onClick={() => selectHair(opt.value)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>
        );
      }

      case "hats":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {HEADWEAR_OPTIONS.map((item) => (
                <Pill
                  key={item.value}
                  active={config.headwear === item.value}
                  onClick={() => update({ headwear: item.value })}
                >
                  {item.label}
                </Pill>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Hats sit over your hair. Pick <span className="font-semibold text-zinc-500">No Hat</span>{" "}
              to show your hairstyle.
            </p>
          </div>
        );

      case "colors":
        return (
          <div className="space-y-4">
            <Section title="Skin tone">
              <SwatchRow
                options={SKIN_TONES}
                active={config.skinColor}
                onSelect={(value) => update({ skinColor: value })}
              />
            </Section>
            <Section title="Hair colour">
              <SwatchRow
                options={NATURAL_HAIR_COLORS}
                active={config.headColor}
                onSelect={(value) => update({ headColor: value })}
              />
            </Section>
            <Section title="Outfit">
              <SwatchRow
                options={CLOTHING_COLORS}
                active={config.clothingColor}
                onSelect={(value) => update({ clothingColor: value })}
              />
            </Section>
          </div>
        );

      case "vibe":
        return (
          <div className="space-y-4">
            <Section title="Expression">
              <div className="grid grid-cols-2 gap-1.5">
                {EXPRESSION_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={config.faceExpression === opt.value}
                    onClick={() => update({ faceExpression: opt.value })}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title="Eyewear">
              <div className="grid grid-cols-2 gap-1.5">
                {ACCESSORIES_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={config.accessories === opt.value}
                    onClick={() => update({ accessories: opt.value })}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Section>

            <Section title="Facial hair">
              <div className="grid grid-cols-2 gap-1.5">
                {FACIAL_HAIR_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={config.facialHair === opt.value}
                    onClick={() => update({ facialHair: opt.value })}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Section>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        <button
          onClick={close}
          aria-label={isEditMode ? "Close" : "Skip onboarding"}
          className="absolute top-3.5 right-3.5 z-10 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title (compact) */}
        <div className="px-5 sm:px-6 pt-5 pb-2 pr-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-[#e84a27] border border-orange-200/60 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>{isEditMode ? "Edit mode" : "✦ OSLO BETA CONTRIBUTOR"}</span>
          </div>
          <h2 className="font-comico text-xl leading-tight text-zinc-900">
            {isEditMode ? "Customize your profile" : "WELCOME TO THE SMAKR BETA!"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5">
            {isEditMode
              ? "Change your avatar anytime — your saved dishes stay untouched."
              : "Create your foodie persona, claim your handle, and help us map Oslo's best dishes."}
          </p>
        </div>

        {/* Pinned avatar preview + progress — ALWAYS visible */}
        <div className="px-5 sm:px-6 pb-3.5">
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3">
            <div className="relative w-[92px] h-[92px] shrink-0 rounded-full overflow-hidden ring-4 ring-[#e84a27]/70 border-2 border-white bg-orange-50/60 shadow-sm">
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                  Step {step + 1} of {STEPS.length}
                </span>
                <button
                  onClick={surprise}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold transition-all active:scale-95"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Surprise</span>
                </button>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-1 truncate">{STEPS[step].title}</p>
              <p className="text-[10px] text-zinc-500 truncate">{STEPS[step].hint}</p>

              <div className="flex items-center gap-1 mt-2">
                {STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    title={s.title}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= step ? "bg-[#e84a27]" : "bg-zinc-200 hover:bg-zinc-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step body (only the current step scrolls) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 sm:px-6 pb-4">
          {renderStep(STEPS[step].key)}
        </div>

        {/* Footer: Back + Next/Save */}
        <div className="px-5 sm:px-6 py-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center gap-2.5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl border border-zinc-200 bg-white text-zinc-600 text-sm font-bold hover:bg-zinc-50 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditMode ? "Save profile" : "Start Exploring Oslo"}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`py-2 px-1.5 rounded-xl border text-[10px] font-semibold leading-tight transition-all active:scale-[0.97] ${
        active
          ? "border-[#e84a27] bg-[#e84a27] text-white shadow-sm shadow-[#e84a27]/25"
          : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}

function SwatchRow({
  options,
  active,
  onSelect,
}: {
  options: readonly { label: string; value: string; hex: string }[];
  active: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {options.map((opt) => {
        const isActive = active.toLowerCase() === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={isActive}
            className="w-8 h-8 rounded-full border-2 transition-all active:scale-95"
            style={{
              backgroundColor: opt.hex,
              borderColor: isActive ? "#e84a27" : "rgba(0,0,0,0.12)",
              boxShadow: isActive ? "0 0 0 3px rgba(232,74,39,0.2)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
