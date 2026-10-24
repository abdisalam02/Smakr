"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clipboard, Mail, Moon, Smartphone, Sparkles, Sun } from "lucide-react";
import { SmakrSIcon } from "@/components/ui/SmakrSIcon";
import {
  getAuthEmailHtml,
  getAuthEmailMeta,
  type AuthEmailKind,
  type AuthEmailTheme,
} from "@/lib/emails/templates";

const PREVIEW_ACTION_URL = "https://smakr.no/auth/callback?preview=1";

export default function EmailPreviewPage() {
  const [kind, setKind] = useState<AuthEmailKind>("confirmation");
  const [theme, setTheme] = useState<Exclude<AuthEmailTheme, "auto">>("light");
  const [copied, setCopied] = useState(false);
  const [assetBase, setAssetBase] = useState("https://smakr.no");
  const [frameHeight, setFrameHeight] = useState(1800);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setAssetBase(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    const requestedTheme = params.get("theme");
    const requestedKind = params.get("kind");
    if (requestedTheme === "dark" || requestedTheme === "light") {
      setTheme(requestedTheme);
    }
    if (requestedKind === "reset" || requestedKind === "confirmation") {
      setKind(requestedKind);
    }
  }, []);

  const meta = useMemo(() => getAuthEmailMeta(kind), [kind]);
  const previewHtml = useMemo(
    () => getAuthEmailHtml(kind, PREVIEW_ACTION_URL, assetBase, theme),
    [kind, assetBase, theme]
  );
  const productionHtml = useMemo(
    () => getAuthEmailHtml(kind, "{{ .ConfirmationURL }}", "https://smakr.no"),
    [kind]
  );

  const syncFrameHeight = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0
    );
    setFrameHeight(height + 8);
  };

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const attach = () => {
      const doc = el.contentDocument;
      if (!doc) return;
      syncFrameHeight();
      observer?.disconnect();
      if (typeof ResizeObserver !== "undefined" && doc.body) {
        observer = new ResizeObserver(() => syncFrameHeight());
        observer.observe(doc.body);
      }
    };
    const timers = [200, 900, 2000].map((ms) => window.setTimeout(attach, ms));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewHtml]);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(productionHtml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-[#F4EFE7]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6459] hover:text-[#E84A27] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Smakr</span>
          </Link>
          <span className="rounded-full border border-[#E4D9C8] bg-[#FFFDF8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7F72]">
            Design preview
          </span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <SmakrSIcon className="h-9 w-9" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E84A27]">
                Smakr transactional email
              </p>
            </div>
            <h1 className="font-comico text-3xl sm:text-4xl tracking-tight text-[#181615]">
              A little table-side note.
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-[#6B6459]">
              Full-map background, official mascot, translucent cards and a real spot card — with
              dedicated light and dark artwork. Toggle the theme to see exactly what each inbox
              gets, then copy the HTML straight into Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-[#E4D9C8] bg-[#FFFDF8] p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setKind("confirmation")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  kind === "confirmation"
                    ? "bg-[#181615] text-white"
                    : "text-[#6B6459] hover:text-[#181615]"
                }`}
              >
                Confirm email
              </button>
              <button
                type="button"
                onClick={() => setKind("reset")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  kind === "reset"
                    ? "bg-[#181615] text-white"
                    : "text-[#6B6459] hover:text-[#181615]"
                }`}
              >
                Reset password
              </button>
            </div>
            <div className="flex rounded-2xl border border-[#E4D9C8] bg-[#FFFDF8] p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  theme === "light"
                    ? "bg-[#E84A27] text-white"
                    : "text-[#6B6459] hover:text-[#181615]"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  theme === "dark"
                    ? "bg-[#181615] text-white"
                    : "text-[#6B6459] hover:text-[#181615]"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,600px)_320px] lg:justify-center">
          <div className="overflow-hidden rounded-3xl border border-[#E4D9C8] bg-[#FFFDF8] shadow-xl shadow-black/5">
            <div className="flex items-center justify-between gap-3 border-b border-[#EEE5D8] bg-[#FAF7F2] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E84A27]" />
                <span className="truncate text-[11px] font-bold text-[#181615]">
                  {meta.subject}
                </span>
              </div>
              <div className="hidden items-center gap-1.5 text-[10px] text-[#8A7F72] sm:flex">
                <Mail className="h-3 w-3" />
                <span>noreply@smakr.no</span>
              </div>
            </div>
            <iframe
              ref={frameRef}
              title={`${meta.subject} email preview`}
              srcDoc={previewHtml}
              onLoad={syncFrameHeight}
              style={{ height: frameHeight }}
              className="mx-auto block w-full max-w-[600px] bg-[#F4EFE7] transition-[height] duration-200"
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-[#E4D9C8] bg-[#FFFDF8] p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E84A27]">
                <Sparkles className="h-3.5 w-3.5" />
                Template details
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#A79B8C]">
                    Subject
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#181615]">{meta.subject}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#A79B8C]">
                    From
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#181615]">
                    Smakr Oslo &lt;noreply@smakr.no&gt;
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#A79B8C]">
                    Reply / support
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#181615]">hei@smakr.no</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={copyHtml}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E84A27] px-4 py-3 text-xs font-bold text-white shadow-md shadow-[#E84A27]/25 transition-colors hover:bg-[#D23E1D]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                <span>{copied ? "HTML copied" : "Copy HTML for Supabase"}</span>
              </button>
              <p className="mt-2 text-center text-[10px] leading-relaxed text-[#A79B8C]">
                Uses <code>{"{{ .ConfirmationURL }}"}</code> and hosted <code>smakr.no</code> image
                URLs.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E4D9C8] bg-[#F8F2E8] p-5 text-xs leading-relaxed text-[#6B6459]">
              <div className="flex items-center gap-2 font-bold text-[#181615]">
                <Smartphone className="h-4 w-4 text-[#E84A27]" />
                Paste into Supabase
              </div>
              <ol className="mt-3 list-decimal space-y-2 pl-4">
                <li>Deploy first so <code>/email/*.jpg</code> and the Comico font resolve.</li>
                <li>Authentication → Emails → Templates.</li>
                <li>Choose <strong>Confirm signup</strong> or <strong>Reset password</strong>.</li>
                <li>Paste the copied HTML and keep <code>{"{{ .ConfirmationURL }}"}</code>.</li>
                <li>Use the subject shown here for the matching template.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
