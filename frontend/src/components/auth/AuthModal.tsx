"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  AtSign,
  Loader2,
  ShieldCheck,
  Zap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const ADMIN_HANDLE = "@smakr_oslo";
const GOOGLE_DISABLED_MESSAGE =
  "Google login is currently disabled in Supabase. Please use email sign-in for the beta.";

type AuthTab = "signin" | "signup";
type BusyState = null | "google" | "signin" | "signup" | "magic";

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
  const setCurrentUser = useCityPulseStore((state) => state.setCurrentUser);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState<BusyState>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Clear stale messages each time the modal is (re)opened.
  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setNotice(null);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const supabase = getSupabaseBrowserClient();
  const isDev = process.env.NODE_ENV === "development";
  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;

  const guard = () => {
    if (!supabase) {
      setError("Supabase isn't configured yet — use Beta Dev Access below.");
      return false;
    }
    return true;
  };

  const isGoogleDisabledError = (message: string, code?: string) => {
    const m = (message || "").toLowerCase();
    return (
      code === "provider_disabled" ||
      m.includes("provider_disabled") ||
      m.includes("unsupported provider") ||
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
      setError(
        isGoogleDisabledError(error.message, (error as { code?: string }).code)
          ? GOOGLE_DISABLED_MESSAGE
          : error.message
      );
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

    // Confirmation required — guide the user, don't hang.
    setNotice(
      `Account created! We sent a confirmation link to ${cleanEmail}. Open it to confirm, then sign in to build your foodie avatar. (Check spam if it's not there in a minute.)`
    );
  };

  const handleMagicLink = async () => {
    setError(null);
    setNotice(null);
    if (!guard()) return;
    if (!email.trim()) {
      setError("Enter your email to receive a magic link.");
      return;
    }
    setBusy("magic");
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl },
    });
    setBusy(null);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setNotice(`Check your inbox! We sent a magic sign-in link to ${email.trim()}.`);
  };

  const enterAsAdmin = () => {
    setCurrentUser({
      id: "admin-1",
      handle: ADMIN_HANDLE,
      role: "admin",
      is_official: true,
    });
    showToast("Welcome back, @smakr_oslo — Admin Portal unlocked 🛡️");
  };

  const enterAsFoodie = () => {
    setCurrentUser({
      id: "user-1",
      name: "Astrid Lindholm",
      handle: "@astrid_eats_oslo",
      role: "foodie",
      is_official: false,
      avatar_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    });
    showToast("Signed in as @astrid_eats_oslo");
  };

  const inputClass =
    "w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1.5 text-center pt-2">
          <div className="flex items-center justify-center mx-auto mb-1">
            <SmakrSIcon className="w-9 h-9" />
          </div>
          <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
            {tab === "signin" ? "Welcome back to Smakr" : "Join the Smakr table"}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            {tab === "signin"
              ? "Sign in to log dishes, save spots and unlock admin tools."
              : "Create an account to start logging your Oslo food finds."}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-100">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError(null);
                setNotice(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={busy !== null}
          className="w-full flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-zinc-50 disabled:opacity-60 text-zinc-800 font-semibold text-xs border border-zinc-200 shadow-xs transition-all active:scale-[0.99]"
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

        {/* Feedback banners */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{error}</p>
          </div>
        )}
        {notice && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-emerald-800">{notice}</p>
          </div>
        )}

        {tab === "signin" ? (
          /* ---------- Sign In ---------- */
          <div className="space-y-2">
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
                placeholder="Password"
                className={inputClass}
              />
            </div>
            <button
              onClick={handleSignIn}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
            >
              {busy === "signin" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Sign In →</span>
              )}
            </button>

            <button
              onClick={handleMagicLink}
              disabled={busy !== null}
              className="w-full text-center text-[11px] font-semibold text-zinc-500 hover:text-[#e84a27] disabled:opacity-60 transition-colors py-1"
            >
              {busy === "magic" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Sending magic link…
                </span>
              ) : (
                "✨ Email me a magic link instead"
              )}
            </button>
          </div>
        ) : (
          /* ---------- Create Account ---------- */
          <div className="space-y-2">
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
                placeholder="Password (min. 6 characters)"
                className={inputClass}
              />
            </div>
            <button
              onClick={handleCreateAccount}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
            >
              {busy === "signup" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Create Account &amp; Start Tasting →</span>
              )}
            </button>
          </div>
        )}

        {!isSupabaseConfigured && (
          <p className="text-[10px] text-center text-amber-600 bg-amber-50 border border-amber-200/70 rounded-lg px-2 py-1.5">
            Supabase env vars missing — social &amp; email sign-in will activate once configured.
          </p>
        )}

        {/* Dev bypass — development only */}
        {isDev && (
          <div className="rounded-2xl border border-dashed border-[#e84a27]/40 bg-orange-50/40 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#e84a27] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Beta testing (dev only)
            </p>
            <button
              onClick={enterAsAdmin}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.99]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Beta Dev Access: Enter as @smakr Admin</span>
            </button>
            <button
              onClick={enterAsFoodie}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-600 font-semibold text-[11px] border border-zinc-200 transition-all active:scale-[0.99]"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Enter as a foodie (@astrid_eats_oslo)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
