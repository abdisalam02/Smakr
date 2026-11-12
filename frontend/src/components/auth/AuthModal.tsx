"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Mail,
  Lock,
  User,
  AtSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const GOOGLE_DISABLED_MESSAGE =
  "Google sign-in isn't switched on yet. Enable the Google provider in Supabase (Authentication → Providers), or use email sign-in for the beta.";

type AuthTab = "signin" | "signup" | "reset";
type BusyState = null | "google" | "signin" | "signup" | "reset";

/** Official multi-colour Google "G" vector. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function friendlyAuthError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (m.includes("email not confirmed")) {
    return "Your email isn't confirmed yet — check your inbox for the confirmation link.";
  }
  if (m.includes("password should be at least")) {
    return "Password is too short — use at least 6 characters.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "That doesn't look like a valid email address.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts — please wait a moment and try again.";
  }
  // Supabase returns a generic 500 when the `auth.users` → `profiles` trigger
  // fails (see supabase/migrations/20261014_fix_signup_and_deletes.sql).
  if (m.includes("database error")) {
    return "We couldn't finish setting up your account on our side. Please try again in a moment — if it keeps happening the signup service is being fixed.";
  }
  return message;
}

export function AuthModal() {
  const isAuthModalOpen = useCityPulseStore((state) => state.isAuthModalOpen);
  const setIsAuthModalOpen = useCityPulseStore((state) => state.setIsAuthModalOpen);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState<BusyState>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signupConfirmedEmail, setSignupConfirmedEmail] = useState<string | null>(null);

  // Clear stale messages each time the modal is (re)opened.
  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setNotice(null);
      setSignupConfirmedEmail(null);
      setTab((current) => (current === "reset" ? "signin" : current));
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const supabase = getSupabaseBrowserClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback`;
  const resetRedirectUrl = `${origin}/auth/callback?next=/reset-password`;

  const guard = () => {
    if (!supabase) {
      setError("Sign-in is currently unavailable. Please try again later.");
      return false;
    }
    return true;
  };

  const isGoogleDisabledError = (message: string, code?: string) => {
    const m = (message || "").toLowerCase();
    return (
      code === "provider_disabled" ||
      code === "validation_failed" ||
      m.includes("provider_disabled") ||
      m.includes("unsupported provider") ||
      m.includes("provider is not enabled") ||
      m.includes("not enabled") ||
      (m.includes("provider") && (m.includes("disabled") || m.includes("enabled")))
    );
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    if (!guard()) return;
    setBusy("google");
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    // On success the browser is redirected to Google, so we only reset on error.
    setBusy(null);
    if (error) {
      const disabled = isGoogleDisabledError(
        error.message,
        (error as { code?: string }).code
      );
      if (!disabled) console.warn("[auth] Google sign-in failed:", error.message);
      setError(disabled ? GOOGLE_DISABLED_MESSAGE : friendlyAuthError(error.message));
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setNotice(null);
    if (!guard()) return;
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setBusy("signin");
    const { error } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(null);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setIsAuthModalOpen(false);
    showToast("Welcome back!");
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!guard()) return;
    if (!email.trim()) {
      setError("Enter the email address for your Smakr account.");
      return;
    }
    setBusy("reset");
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetRedirectUrl,
    });
    setBusy(null);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setNotice(
      `If an account exists for ${email.trim()}, a password reset link is on its way. Check your inbox and spam folder.`
    );
  };

  const handleCreateAccount = async () => {
    setError(null);
    setNotice(null);
    if (!guard()) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Enter your email and a password to create an account.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const local = cleanEmail.split("@")[0];
    // Store the bare handle — the DB `handle_new_user` trigger sanitises "@".
    const cleanHandle = (handle.trim() || local).replace(/^@+/, "");
    const cleanName = name.trim() || local;

    setBusy("signup");
    const { data, error } = await supabase!.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          user_name: cleanHandle,
        },
        emailRedirectTo: callbackUrl,
      },
    });
    setBusy(null);

    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }

    // Instant session (email confirmation disabled) — AuthProvider hydrates the
    // profile, so we just close the modal.
    if (data.session) {
      setIsAuthModalOpen(false);
      showToast("Welcome to Smakr! 🎉");
      return;
    }

    // Confirmation required — transition out inputs and show centered confirmation card.
    setSignupConfirmedEmail(cleanEmail);
  };

  const inputClass =
    "w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden">
      {/* Living backdrop: soft drifting brand glows */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#E84A27]/20 blur-3xl"
          animate={{ x: [0, 26, 0], y: [0, -18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-[#F2C879]/25 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 16, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
          layout: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
        }}
        className="smakr-auth-card relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl border border-[#181615]/10 shadow-2xl p-6 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-black/5 hover:rotate-90 transition-all duration-200"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {signupConfirmedEmail ? (
            /* ---------- Centered Account Created / Confirmation View ---------- */
            <motion.div
              key="signup-confirmed"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="py-5 px-1 flex flex-col items-center text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.05 }}
                className="w-16 h-16 rounded-full bg-[#e84a27]/12 border border-[#e84a27]/25 flex items-center justify-center shadow-xs"
              >
                <CheckCircle2 className="w-8 h-8 text-[#e84a27]" />
              </motion.div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  ✦ Account Created
                </span>
                <h2 className="font-comico text-xl text-[#181615] tracking-tight">
                  CHECK YOUR INBOX
                </h2>
                <p className="text-xs text-[#6E655F] max-w-[260px] mx-auto leading-relaxed">
                  We sent a confirmation link to:
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#181615] shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span className="truncate max-w-[210px]">{signupConfirmedEmail}</span>
                </div>
                <p className="text-[11px] text-zinc-500 max-w-[260px] mx-auto leading-relaxed pt-1">
                  Tap the link in your email to verify, then sign in to customize your foodie mascot. (Check spam if it takes a minute.)
                </p>
              </div>

              <div className="w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignupConfirmedEmail(null);
                    setTab("signin");
                    setError(null);
                    setNotice(null);
                  }}
                  className="smakr-cta w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignupConfirmedEmail(null);
                    setError(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 border border-black/10 text-zinc-700 font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to details</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`auth-form-${tab}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col space-y-4"
            >
              <div className="space-y-1.5 text-center pt-2">
                <div className="flex items-center justify-center mx-auto mb-1">
                  <SmakrSIcon className="w-9 h-9" />
                </div>
                <h2 className="font-comico text-lg text-[#181615] tracking-tight">
                  {tab === "signin"
                    ? "WELCOME BACK"
                    : tab === "signup"
                    ? "JOIN THE SMAKR TABLE"
                    : "RESET PASSWORD"}
                </h2>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  {tab === "signin"
                    ? "Sign in to log dishes, save spots and unlock your foodie radar."
                    : tab === "signup"
                    ? "Create an account to start logging your Oslo food finds."
                    : "Enter your account email and we'll send you a secure reset link."}
                </p>
              </div>

              {/* Tabs with shared spring pill */}
              {tab !== "reset" && (
                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#EDE7DD] border border-black/[0.06]">
                  {(["signin", "signup"] as const).map((t) => {
                    const active = tab === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTab(t);
                          setError(null);
                          setNotice(null);
                        }}
                        className={`relative py-2 rounded-xl text-xs font-bold transition-colors ${
                          active ? "text-[#181615]" : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="authModalTabPill"
                            transition={{ type: "spring", stiffness: 460, damping: 34 }}
                            className="absolute inset-0 rounded-xl bg-white shadow-xs"
                          />
                        )}
                        <span className="relative z-10">
                          {t === "signin" ? "Sign In" : "Create Account"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {tab !== "reset" && (
                <>
                  {/* Google */}
                  <button
                    onClick={handleGoogle}
                    disabled={busy !== null}
                    className="w-full flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-zinc-50 disabled:opacity-60 text-zinc-800 font-semibold text-xs border border-zinc-200 shadow-xs transition-all active:scale-[0.98]"
                  >
                    {busy === "google" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GoogleIcon className="w-4 h-4" />
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-zinc-200" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      or email
                    </span>
                    <span className="h-px flex-1 bg-zinc-200" />
                  </div>
                </>
              )}

              {/* Feedback banners */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{error}</p>
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-emerald-800">{notice}</p>
                </div>
              )}

              {tab === "reset" ? (
                /* ---------- Reset Password ---------- */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@smakr.no"
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    disabled={busy !== null}
                    className="smakr-cta w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
                  >
                    {busy === "reset" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Send Reset Link →</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signin");
                      setError(null);
                      setNotice(null);
                    }}
                    className="w-full text-center text-[11px] font-semibold text-zinc-500 hover:text-[#e84a27] transition-colors py-1"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : tab === "signin" ? (
                /* ---------- Sign In ---------- */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@smakr.no"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSignIn();
                      }}
                      placeholder="Password"
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={busy !== null}
                    className="smakr-cta w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
                  >
                    {busy === "signin" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Sign In →</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("reset");
                      setError(null);
                      setNotice(null);
                    }}
                    className="w-full text-center text-[11px] font-semibold text-zinc-500 hover:text-[#e84a27] transition-colors py-1"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                /* ---------- Create Account ---------- */
                <div className="space-y-2.5">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="Handle (e.g. astrid_eats_oslo)"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@smakr.no"
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateAccount();
                      }}
                      placeholder="Password (min. 6 characters)"
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={handleCreateAccount}
                    disabled={busy !== null}
                    className="smakr-cta w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
                  >
                    {busy === "signup" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Create Account &amp; Start Tasting →</span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isSupabaseConfigured && (
          <p className="text-[10px] text-center text-amber-600 bg-amber-50 border border-amber-200/70 rounded-lg px-2 py-1.5">
            Supabase env vars missing — social &amp; email sign-in will activate once configured.
          </p>
        )}
      </motion.div>
    </div>
  );
}
