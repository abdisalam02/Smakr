"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Shuffle,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import {
  ACCESSORIES_OPTIONS,
  CLOTHING_COLORS,
  DEFAULT_OPEN_PEEPS_CONFIG,
  EXPRESSION_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  HAIR_CATEGORIES,
  HAIR_CATEGORY_TABS,
  HAT_COLORS,
  HEADWEAR_OPTIONS,
  NATURAL_HAIR_COLORS,
  OPEN_PEEPS_PRESETS,
  SKIN_TONES,
  buildOpenPeepsDataUri,
  buildOpenPeepsSvg,
  hairCategoryForHead,
  normalizeOpenPeepsConfig,
  openPeepsConfigFromPreset,
  surpriseOpenPeepsConfig,
  type HairCategoryTabKey,
  type OpenPeepsConfig,
  type OpenPeepsPresetId,
} from "@/lib/onboardingAvatar";
import {
  OFFICIAL_SMAKR_MASCOT_CONFIG,
  getOfficialSmakrMascotConfig,
  resetOfficialSmakrMascotConfig,
  saveOfficialSmakrMascotConfig,
} from "@/lib/officialSmakrMascot";
import { MascotCharacter } from "@/components/avatar/MascotCharacter";
import { SmakrMascotRig } from "@/components/studio/SmakrMascotRig";
import {
  PEEPS_ACCESSORY_OPTIONS,
  PEEPS_FACE_OPTIONS,
  PEEPS_FACIAL_HAIR_OPTIONS,
  PEEPS_HEAD_OPTIONS,
  SKIN_TONE_SWATCHES,
  TOP_COLOR_SWATCHES,
  HAIR_COLOR_SWATCHES,
  BOTTOM_COLOR_SWATCHES,
  type MascotConfig,
} from "@/types/mascot";
import { persistOnboarding, persistMascotConfig } from "@/lib/supabase/data";

/**
 * Open Peeps avatar builder — a **staged wizard** so users are never confronted
 * with everything at once. The avatar preview is pinned and stays visible while
 * each step's options change it live.
 *
 * Two modes: first-run onboarding, and "Customize Avatar & Look" edit mode.
 */
const STEPS = [
  { key: "base", title: "Base preset", hint: "Pick your starting look" },
  { key: "hair", title: "Hair style", hint: "Short, waves, afro & twists" },
  { key: "hats", title: "Hats & headwear", hint: "Add a fitted hat, hijab or wrap" },
  { key: "vibe", title: "Face & Beard", hint: "Expression, eyewear & facial hair" },
  { key: "colors", title: "Colours", hint: "Skin, hair, beard & outfit" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function UserOnboardingModal() {
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setCurrentUser = useCityPulseStore((state) => state.setCurrentUser);
  const showToast = useCityPulseStore((state) => state.showToast);
  const isStudioOpen = useCityPulseStore((state) => state.isAvatarStudioOpen);
  const setIsStudioOpen = useCityPulseStore((state) => state.setIsAvatarStudioOpen);
  const profileResolved = useCityPulseStore((state) => state.profileResolved);

  const [config, setConfig] = useState<OpenPeepsConfig>(DEFAULT_OPEN_PEEPS_CONFIG);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  /** First-run only: show the "account confirmed" welcome before the builder. */
  const [introDone, setIntroDone] = useState(false);
  const [hairCategory, setHairCategory] = useState<HairCategoryTabKey>("shortFades");
  const [activeVibeAccordion, setActiveVibeAccordion] = useState<"expression" | "eyewear" | "facialHair" | null>("expression");
  const seededFor = useRef<string | null>(null);

  const effectiveUser =
    currentUser ||
    (isPreview
      ? {
          id: "preview-user-id",
          email: "foodie@smakr.no",
          name: displayName || "Alex",
          handle: handle ? `@${handle}` : "@alex_foodie",
          role: "user" as const,
          is_official: false,
          onboarding_completed: false,
          avatar_url: "",
          avatar_config: config,
        }
      : null);

  const isEditMode = isStudioOpen && !isPreview;
  const isAdmin = !isPreview && Boolean(effectiveUser?.role === "admin" || effectiveUser?.is_official);
  const isLastStep = step === STEPS.length - 1;

  // Admin Brand Mascot Customizer state
  const updateStoreMascotConfig = useCityPulseStore((state) => state.updateMascotConfig);
  const [brandConfig, setBrandConfig] = useState<MascotConfig>(() =>
    getOfficialSmakrMascotConfig()
  );
  const [brandTab, setBrandTab] = useState<"pose" | "hair" | "face" | "colors">("pose");

  // Allow instant testing of on-signup flow via ?onboarding=1 or window.openOnboardingPreview()
  useEffect(() => {
    const triggerPreview = () => {
      setIsPreview(true);
      setDismissed(false);
      setIntroDone(false);
      setStep(0);
      if (!currentUser) {
        setDisplayName("Alex");
        setHandle("alex_foodie");
        setConfig(DEFAULT_OPEN_PEEPS_CONFIG);
        setHairCategory(hairCategoryForHead(DEFAULT_OPEN_PEEPS_CONFIG.headType));
      }
    };

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has("onboarding") || sp.has("preview_onboarding")) {
        triggerPreview();
      }
      (window as unknown as { openOnboardingPreview?: () => void }).openOnboardingPreview = triggerPreview;
    }
  }, [currentUser]);

  useEffect(() => {
    if (isStudioOpen && isAdmin) {
      setBrandConfig(getOfficialSmakrMascotConfig());
      setBrandTab("pose");
    }
  }, [isStudioOpen, isAdmin]);

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
    setHairCategory(hairCategoryForHead(seeded.headType));
    setStep(0);
    setIntroDone(false);
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
    setHairCategory(hairCategoryForHead(seeded.headType));
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
    isPreview ||
    (Boolean(currentUser) &&
      // Wait until `public.profiles` has actually been read — otherwise a returning
      // user briefly sees the setup card before their stored flag arrives.
      profileResolved &&
      currentUser!.onboarding_completed !== true &&
      !currentUser!.is_official &&
      currentUser!.role !== "admin" &&
      !dismissed);

  const shouldShow = Boolean(effectiveUser) && (isEditMode || shouldShowOnboarding);

  if (!shouldShow || !effectiveUser) return null;

  const showIntro = !isEditMode && !introDone;

  const update = (patch: Partial<OpenPeepsConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const applyPreset = (id: OpenPeepsPresetId) => {
    const next = openPeepsConfigFromPreset(id);
    setConfig(next);
    setHairCategory(hairCategoryForHead(next.headType));
  };

  const surprise = () => {
    const next = surpriseOpenPeepsConfig();
    setConfig(next);
    setHairCategory(hairCategoryForHead(next.headType));
  };

  // Picking hair takes any hat off so the choice is immediately visible.
  const selectHair = (value: string) => update({ headType: value, headwear: "none" });

  const close = () => {
    if (isEditMode) setIsStudioOpen(false);
    else setDismissed(true);
    if (isPreview) setIsPreview(false);
  };

  const handleSkipRandom = async () => {
    setSaving(true);
    const randomCfg = surpriseOpenPeepsConfig();
    const avatarUrl = buildOpenPeepsDataUri(randomCfg);
    const rawHandle =
      handle.trim().replace(/^@+/, "").replace(/\s+/g, "_") ||
      (effectiveUser.email ? effectiveUser.email.split("@")[0] : "") ||
      `foodie_${effectiveUser.id.slice(0, 5)}`;
    const cleanHandle = "@" + rawHandle;
    const cleanName = displayName.trim() || effectiveUser.name || "";

    if (effectiveUser.id === "preview-user-id") {
      setSaving(false);
      setDismissed(true);
      setIsPreview(false);
      showToast("Random foodie avatar created ✨ Customize it anytime in your profile.");
      return;
    }

    await persistOnboarding({
      userId: effectiveUser.id,
      handle: cleanHandle,
      name: cleanName,
      avatarConfig: randomCfg,
      avatarUrl,
    });

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        handle: cleanHandle,
        name: cleanName || undefined,
        avatar_url: avatarUrl,
        avatar_config: randomCfg,
        onboarding_completed: true,
      });
    }
    setSaving(false);
    setDismissed(true);
    setIsPreview(false);
    setIsStudioOpen(false);
    showToast("Random foodie avatar created ✨ Customize it anytime in your profile.");
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

    if (effectiveUser.id === "preview-user-id") {
      setSaving(false);
      setDismissed(true);
      setIsPreview(false);
      showToast("Welcome to Smakr ✨ Your foodie profile is ready.");
      return;
    }

    const result = await persistOnboarding({
      userId: effectiveUser.id,
      handle: cleanHandle,
      name: cleanName,
      avatarConfig: config,
      avatarUrl,
    });

    // Duplicate @handle (unique_violation) — keep the modal open, jump back to
    // the handle step, and give an actionable message instead of hanging.
    if (!result.success && result.code === "23505") {
      setSaving(false);
      setStep(0);
      showToast(`@${cleanHandle.replace(/^@/, "")} is already taken — try adding a number.`);
      return;
    }

    // Hydrate locally regardless — the UI reflects the choice instantly.
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        handle: cleanHandle,
        name: cleanName || undefined,
        avatar_url: avatarUrl,
        avatar_config: config,
        onboarding_completed: true,
      });
    }
    setSaving(false);
    setDismissed(true);
    setIsPreview(false);
    setIsStudioOpen(false);
    showToast(
      result.success
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
                        className="w-12 h-14 shrink-0 rounded-2xl overflow-hidden bg-orange-50/80 border border-black/10 flex items-end justify-center pt-1"
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
        const activeKey = HAIR_CATEGORY_TABS.some((t) => t.key === hairCategory)
          ? hairCategory
          : HAIR_CATEGORY_TABS[0].key;
        const options = HAIR_CATEGORIES[activeKey];
        return (
          <div className="space-y-4">
            <div className="-mx-1 px-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {HAIR_CATEGORY_TABS.map((tab) => {
                const active = activeKey === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setHairCategory(tab.key)}
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
                  active={config.headType === opt.value && config.headwear === "none"}
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
            {config.headwear && config.headwear !== "none" && (
              <Section title="Hat / Hijab colour">
                <SwatchRow
                  options={HAT_COLORS}
                  active={config.hatColor || config.clothingColor}
                  onSelect={(value) => update({ hatColor: value })}
                />
              </Section>
            )}
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Hats sit over your hair. Pick <span className="font-semibold text-zinc-500">No Hat</span>{" "}
              to show your hairstyle.
            </p>
          </div>
        );

      case "vibe": {
        const activeExpressionLabel =
          EXPRESSION_OPTIONS.find((o) => o.value === config.faceExpression)?.label ?? "Expression";
        const activeEyewearLabel =
          ACCESSORIES_OPTIONS.find((o) => o.value === config.accessories)?.label ?? "None";
        const activeBeardLabel =
          FACIAL_HAIR_OPTIONS.find((o) => o.value === config.facialHair)?.label ?? "Clean Shaven";
        const isWearingHijab = config.headwear === "hijab";

        const toggleAccordion = (sec: "expression" | "eyewear" | "facialHair") => {
          setActiveVibeAccordion((cur) => (cur === sec ? null : sec));
        };

        return (
          <div className="space-y-2.5">
            {/* 1. Collapsible Expression Accordion */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("expression")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Expression
                  </span>
                  <span className="text-xs font-bold text-zinc-800">{activeExpressionLabel}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    activeVibeAccordion === "expression" ? "rotate-180 text-[#e84a27]" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {activeVibeAccordion === "expression" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-zinc-100"
                  >
                    <div className="p-2.5 grid grid-cols-2 gap-1.5 bg-zinc-50/40">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Collapsible Eyewear Accordion */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("eyewear")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Eyewear
                  </span>
                  <span className="text-xs font-bold text-zinc-800">{activeEyewearLabel}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    activeVibeAccordion === "eyewear" ? "rotate-180 text-[#e84a27]" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {activeVibeAccordion === "eyewear" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-zinc-100"
                  >
                    <div className="p-2.5 grid grid-cols-2 gap-1.5 bg-zinc-50/40">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Collapsible Facial Hair Accordion (hidden when wearing hijab) */}
            {!isWearingHijab && (
              <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleAccordion("facialHair")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Facial hair
                    </span>
                    <span className="text-xs font-bold text-zinc-800">{activeBeardLabel}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      activeVibeAccordion === "facialHair" ? "rotate-180 text-[#e84a27]" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activeVibeAccordion === "facialHair" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden border-t border-zinc-100"
                    >
                      <div className="p-2.5 grid grid-cols-2 gap-1.5 bg-zinc-50/40">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        );
      }

      case "colors": {
        const hasBeard =
          config.facialHair && config.facialHair !== "none" && config.headwear !== "hijab";
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
            {hasBeard && (
              <Section title="Facial hair colour">
                <SwatchRow
                  options={NATURAL_HAIR_COLORS}
                  active={config.facialHairColor || config.headColor}
                  onSelect={(value) => update({ facialHairColor: value })}
                />
              </Section>
            )}
            <Section title="Outfit">
              <SwatchRow
                options={CLOTHING_COLORS}
                active={config.clothingColor}
                onSelect={(value) => update({ clothingColor: value })}
              />
            </Section>
            <Section title="Hat / Hijab colour">
              <SwatchRow
                options={HAT_COLORS}
                active={config.hatColor || config.clothingColor}
                onSelect={(value) => update({ hatColor: value })}
              />
            </Section>
          </div>
        );
      }
    }
  };

  // ---------------------------------------------------------------------
  // First-run confirmation screen — reassures the user their account is
  // created before sending them into the avatar builder.
  // ---------------------------------------------------------------------
  if (showIntro) {
    const firstName = (effectiveUser.name || "").trim().split(/\s+/)[0];
    const shownHandle = `@${handle.trim().replace(/^@+/, "") || "foodie"}`;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col">
          <button
            onClick={close}
            aria-label="Skip onboarding"
            className="absolute top-3.5 right-3.5 z-10 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-9 pb-4 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-[#e84a27] border border-orange-200/60 text-[10px] font-bold uppercase tracking-wider">
              ✦ OSLO BETA CONTRIBUTOR
            </div>
            <h2 className="font-comico text-2xl leading-tight text-zinc-900">
              {firstName ? `Welcome, ${firstName}!` : "You're in!"}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              Your Smakr account is confirmed. Last step: build the foodie avatar that
              shows up on the map, the feed and every review you post.
            </p>
          </div>

          <div className="px-6 space-y-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Account
                </p>
                <p className="text-xs font-semibold text-zinc-800 truncate">
                  {effectiveUser.email ?? "confirmed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Handle
                </p>
                <p className="text-xs font-semibold text-zinc-800 truncate">{shownHandle}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-2.5">
            <button
              onClick={() => setIntroDone(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm &amp; build my avatar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSkipRandom}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-all active:scale-[0.99]"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Skip &amp; surprise me with a random avatar</span>
            </button>
            <p className="text-[10px] text-zinc-400 text-center">
              You can change your display name, @handle and avatar anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // Admin Brand Mascot Studio Modal — customizes both the General Site
  // Mascot AND the Weekly Pick Dropdown Mascot live across Smakr.
  // ---------------------------------------------------------------------
  if (isEditMode && isAdmin) {
    const updateBrand = (patch: Partial<MascotConfig>) => {
      setBrandConfig((prev) => ({ ...prev, ...patch }));
    };

    const handleSaveBrandMascot = async () => {
      setSaving(true);
      const savedCfg = saveOfficialSmakrMascotConfig(brandConfig);
      updateStoreMascotConfig(savedCfg);
      const store = useCityPulseStore.getState();
      if (store.weeklyPick?.mascot_avatar_url) {
        store.setWeeklyPick({ ...store.weeklyPick, mascot_avatar_url: undefined });
      }
      if (currentUser?.id) {
        await persistMascotConfig(currentUser.id, savedCfg);
        setCurrentUser({
          ...currentUser,
          mascot_config: savedCfg,
        });
      }
      setSaving(false);
      setIsStudioOpen(false);
      showToast("✦ Official Smakr Mascot & Weekly Pick updated across the site.");
    };

    const handleResetBrandMascot = () => {
      const resetCfg = resetOfficialSmakrMascotConfig();
      setBrandConfig(resetCfg);
      updateStoreMascotConfig(resetCfg);
      showToast("Reset to the classic @smak brand mascot.");
    };

    const WEEKLY_POSES = [
      { id: "pointing-up", label: "Pointing Up", hint: "Classic Critic Pick" },
      { id: "jacket-2", label: "Street Jacket", hint: "Oslo Bomber" },
      { id: "coffee", label: "Coffee Cup", hint: "Morning Brew" },
      { id: "shrug", label: "Shrug Pose", hint: "Playful Vibe" },
      { id: "striped-pocket-tee", label: "Pocket Tee", hint: "Casual Tee" },
      { id: "hoodie", label: "Cozy Hoodie", hint: "Nordic Layer" },
    ];

    const rigAccessories =
      !brandConfig.peepsAccessories || brandConfig.peepsAccessories === "none"
        ? "none"
        : brandConfig.peepsAccessories === "glasses"
        ? "glasses-2"
        : brandConfig.peepsAccessories;

    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150">
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:max-w-lg bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl border border-[#181615]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
        >
          <button
            onClick={close}
            aria-label="Close Brand Mascot Studio"
            className="absolute top-3.5 right-3.5 z-10 text-zinc-400 hover:text-zinc-800 p-1.5 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="px-5 pt-4 pb-2.5 pr-12 border-b border-black/[0.06] bg-white/70">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e84a27]/12 text-[#e84a27] text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>✦ Global Brand Mascot Studio</span>
            </div>
            <h2 className="font-comico text-lg leading-tight text-[#181615]">
              CUSTOMIZE SMAKR MASCOT
            </h2>
            <p className="text-[11px] text-[#6E655F] mt-0.5">
              Changes apply live to the Header badge, Map puck, and ✦ Smakr Pick Weekly Dropdown.
            </p>
          </div>

          {/* Dual Live Preview Stage: General Mascot + Weekly Pick Mascot */}
          <div className="px-5 pt-3 pb-2.5 bg-[#F5EFE3]/70 border-b border-black/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              {/* Preview 1: General Site & Map Mascot */}
              <div className="rounded-2xl bg-white border border-black/[0.08] p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-14 h-16 rounded-xl bg-[#FAF7F2] border border-black/10 flex items-end justify-center overflow-hidden shrink-0 pt-1">
                  <MascotCharacter config={brandConfig} size={52} />
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-[#e84a27]">
                    1. General &amp; Map
                  </span>
                  <p className="text-xs font-bold text-[#181615] leading-tight mt-0.5">
                    Header &amp; Map Pin
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                    Bust avatar across Smakr
                  </p>
                </div>
              </div>

              {/* Preview 2: Weekly Pick Dropdown Mascot */}
              <div className="rounded-2xl bg-white border border-black/[0.08] p-2.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-14 h-16 rounded-xl bg-[#F5EFE3] border border-[#E6DDD0] flex items-end justify-center overflow-hidden shrink-0 pt-1">
                  <SmakrMascotRig
                    frameMode="bust-only"
                    bodyPose={brandConfig.peepsBody || "pointing-up"}
                    head={brandConfig.peepsHead || OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                    face={brandConfig.peepsFace || OFFICIAL_SMAKR_MASCOT_CONFIG.peepsFace}
                    accessories={rigAccessories}
                    facialHair={brandConfig.peepsFacialHair || "none"}
                    skinColor={`#${(brandConfig.skinColor || "d08b5b").replace(/^#/, "")}`}
                    clothingColor={`#${(brandConfig.topColor || "e84a27").replace(/^#/, "")}`}
                    innerClothingColor={`#${(brandConfig.bottomColor || "181615").replace(/^#/, "")}`}
                    hatColor={`#${(brandConfig.hatColor || "e84a27").replace(/^#/, "")}`}
                    headContrastColor={`#${(brandConfig.hairColor || "181615").replace(/^#/, "")}`}
                    stickerOutline={false}
                    size={54}
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-[#e84a27]">
                    2. Smakr Pick Drop
                  </span>
                  <p className="text-xs font-bold text-[#181615] leading-tight mt-0.5">
                    Weekly Spotlight
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                    Pose: {brandConfig.peepsBody || "pointing-up"}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 mt-2.5 rounded-xl bg-[#E8E0D2]/70">
              {(
                [
                  { id: "pose", label: "Pose & Vibe" },
                  { id: "hair", label: "Hair & Hat" },
                  { id: "face", label: "Face & Specs" },
                  { id: "colors", label: "Colours" },
                ] as const
              ).map((t) => {
                const active = brandTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBrandTab(t.id)}
                    className={`relative py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      active ? "text-[#181615]" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="adminBrandMascotTab"
                        transition={{ type: "spring", stiffness: 460, damping: 34 }}
                        className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Tab Controls */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-3.5 space-y-4">
            {brandTab === "pose" && (
              <>
                <Section title="Weekly Pick Dropdown Pose">
                  <div className="grid grid-cols-2 gap-2">
                    {WEEKLY_POSES.map((p) => {
                      const active = (brandConfig.peepsBody || "pointing-up") === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => updateBrand({ peepsBody: p.id })}
                          className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                            active
                              ? "border-[#e84a27] bg-[#e84a27]/10 ring-1 ring-[#e84a27]/30"
                              : "border-black/10 bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <span className="block text-xs font-bold text-[#181615]">{p.label}</span>
                          <span className="block text-[10px] text-zinc-500">{p.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Facial Expression">
                  <div className="grid grid-cols-3 gap-1.5">
                    {PEEPS_FACE_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.id}
                        active={brandConfig.peepsFace === opt.id}
                        onClick={() => updateBrand({ peepsFace: opt.id })}
                      >
                        {opt.emoji} {opt.label}
                      </Pill>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {brandTab === "hair" && (
              <Section title="Hairstyle, Afro & Headwear">
                <div className="grid grid-cols-3 gap-1.5">
                  {PEEPS_HEAD_OPTIONS.map((opt) => (
                    <Pill
                      key={opt.id}
                      active={brandConfig.peepsHead === opt.id}
                      onClick={() => updateBrand({ peepsHead: opt.id })}
                    >
                      {opt.emoji} {opt.label}
                    </Pill>
                  ))}
                </div>
              </Section>
            )}

            {brandTab === "face" && (
              <>
                <Section title="Eyewear & Glasses">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PEEPS_ACCESSORY_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.id}
                        active={brandConfig.peepsAccessories === opt.id}
                        onClick={() => updateBrand({ peepsAccessories: opt.id })}
                      >
                        {opt.emoji} {opt.label}
                      </Pill>
                    ))}
                  </div>
                </Section>

                <Section title="Facial Hair">
                  <div className="grid grid-cols-3 gap-1.5">
                    {PEEPS_FACIAL_HAIR_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.id}
                        active={brandConfig.peepsFacialHair === opt.id}
                        onClick={() => updateBrand({ peepsFacialHair: opt.id })}
                      >
                        {opt.emoji} {opt.label}
                      </Pill>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {brandTab === "colors" && (
              <>
                <Section title="Sweater / Top Colour">
                  <SwatchRow
                    options={TOP_COLOR_SWATCHES.map((s) => ({
                      label: s.label,
                      value: s.id,
                      hex: `#${s.id}`,
                    }))}
                    active={brandConfig.topColor}
                    onSelect={(val) => updateBrand({ topColor: val })}
                  />
                </Section>

                <Section title="Skin Tone">
                  <SwatchRow
                    options={SKIN_TONE_SWATCHES.map((s) => ({
                      label: s.label,
                      value: s.id,
                      hex: `#${s.id}`,
                    }))}
                    active={brandConfig.skinColor}
                    onSelect={(val) => updateBrand({ skinColor: val })}
                  />
                </Section>

                <Section title="Hair & Outline Colour">
                  <SwatchRow
                    options={HAIR_COLOR_SWATCHES.map((s) => ({
                      label: s.label,
                      value: s.id,
                      hex: `#${s.id}`,
                    }))}
                    active={brandConfig.hairColor}
                    onSelect={(val) => updateBrand({ hairColor: val })}
                  />
                </Section>

                <Section title="Sweater Pattern / Inner Detail">
                  <SwatchRow
                    options={BOTTOM_COLOR_SWATCHES.map((s) => ({
                      label: s.label,
                      value: s.id,
                      hex: `#${s.id}`,
                    }))}
                    active={brandConfig.bottomColor}
                    onSelect={(val) => updateBrand({ bottomColor: val })}
                  />
                </Section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-black/[0.06] bg-white/80 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetBrandMascot}
              className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl border border-black/10 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-all active:scale-95"
              title="Reset to default @smak look"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBrandMascot}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Smakr Brand Mascot</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-md bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        <button
          onClick={close}
          aria-label={isEditMode ? "Close" : "Skip onboarding"}
          className="absolute top-3.5 right-3.5 z-10 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Top Action Buttons */}
        <div className="px-5 sm:px-6 pt-4 pb-2 pr-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#e84a27] border border-orange-200/60 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>{isEditMode ? "✦ Avatar Studio" : "✦ OSLO BETA CONTRIBUTOR"}</span>
          </div>
          <h2 className="font-comico text-lg leading-tight text-zinc-900">
            {isEditMode ? "CUSTOMIZE YOUR MASCOT" : "BUILD YOUR FOODIE MASCOT"}
          </h2>

          {/* Equal-sized Skip & Save Action Buttons */}
          <div className="flex items-center gap-2 mt-2.5">
            {!isEditMode && (
              <button
                type="button"
                onClick={handleSkipRandom}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all active:scale-[0.98]"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#e84a27]" />
                <span>Skip (Random)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-xs font-bold shadow-sm shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEditMode ? "Save Mascot" : "Save Mascot"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pinned Bust Open Peeps preview + Direct Category Pill Tabs */}
        <div className="px-5 sm:px-6 pb-2.5 space-y-2.5">
          <div className="flex items-center gap-3.5 rounded-2xl border border-black/[0.08] bg-white p-2.5 shadow-2xs">
            <div className="relative w-[78px] h-[88px] shrink-0 rounded-2xl overflow-hidden ring-2 ring-[#e84a27]/70 border-2 border-white bg-[#FAF7F2] shadow-sm pt-1 flex items-end justify-center">
              <div
                className="w-full h-full flex items-end justify-center [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27]">
                  Live Map Bust
                </span>
                <button
                  onClick={surprise}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181615] hover:bg-zinc-800 text-white text-[10px] font-bold transition-all active:scale-95"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Surprise</span>
                </button>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{STEPS[step].title}</p>
              <p className="text-[10px] text-zinc-500 truncate">{STEPS[step].hint}</p>
            </div>
          </div>

          {/* 1-Tap Category Pill Tabs (No forced sequential Next clicks) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-[#EDE7DD]">
            {STEPS.map((s, i) => {
              const active = step === i;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`relative shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    active ? "text-[#181615]" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="userAvatarTabPill"
                      transition={{ type: "spring", stiffness: 460, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                    />
                  )}
                  <span className="relative z-10">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step body (only the current step scrolls) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 sm:px-6 pb-4">
          {renderStep(STEPS[step].key)}
        </div>

        {/* Footer: Next and Back */}
        <div className="px-5 sm:px-6 py-3 border-t border-black/[0.06] bg-white/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-35 disabled:hover:bg-white transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={isLastStep}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#181615] hover:bg-zinc-800 disabled:opacity-35 text-white text-xs font-bold transition-all active:scale-[0.98]"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
