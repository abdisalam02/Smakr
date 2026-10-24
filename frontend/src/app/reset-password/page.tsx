"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase isn't configured.");
      setReady(true);
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setHasSession(Boolean(data.user));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Use at least 6 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase isn't configured.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    window.setTimeout(() => router.push("/"), 1800);
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100dvh-4rem)] bg-[#FAF7F2] px-4 pt-24 pb-10 sm:pt-28 sm:pb-16 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b6459] hover:text-[#e84a27] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Smakr</span>
        </Link>

        <div className="rounded-3xl border border-[#e5dec9] bg-white p-6 sm:p-8 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3">
            <SmakrSIcon className="w-10 h-10 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e84a27]">
                Smakr Account
              </p>
              <h1 className="font-comico text-2xl sm:text-3xl text-[#181615] leading-none">
                {success ? "Password updated." : "Set a new password."}
              </h1>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#6b6459]">
            {success
              ? "Your new password is active. Taking you back to Smakr…"
              : "Choose a new password for your account. This reset link expires after one hour."}
          </p>

          {!ready ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#e84a27]" />
            </div>
          ) : success ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 leading-relaxed">
                Password changed successfully. You can keep using Smakr with your new password.
              </div>
            </div>
          ) : !hasSession ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed space-y-2">
                <p>
                  This reset link is missing or has expired. Open the link from the email again, or
                  request a new one from the sign-in screen.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 font-bold text-[#b85434] hover:text-[#e84a27]"
                >
                  Return to Smakr
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-2.5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{error}</p>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password (min. 6 characters)"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#e5dec9] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#e5dec9] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password →</span>}
              </button>
            </form>
          )}

          <p className="mt-5 border-t border-[#eee5d8] pt-4 text-[10px] leading-relaxed text-[#9b8f80]">
            Need help?{" "}
            <a href="mailto:hei@smakr.no" className="font-semibold text-[#b85434] hover:text-[#e84a27]">
              hei@smakr.no
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
