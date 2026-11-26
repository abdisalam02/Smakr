"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Download,
  Heart,
  MessageCircle,
  Music,
  Pause,
  Play,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";

type DeadzoneOverlayMode = "bounds" | "tiktok_mock" | "off";
type ScreenRatioPreset = "9:16" | "20:9" | "19.5:9";

interface TikTokSafeReelStageProps {
  videoSrc: string;
  downloadFilename?: string;
}

const RATIO_META: Record<
  ScreenRatioPreset,
  { label: string; badge: string; aspectClass: string; desc: string }
> = {
  "9:16": {
    label: "9:16 Standard",
    badge: "1080×1920",
    aspectClass: "aspect-[9/16]",
    desc: "Native master canvas (iPhone SE / Desktop TikTok)",
  },
  "19.5:9": {
    label: "19.5:9 iPhone",
    badge: "Dynamic Island",
    aspectClass: "aspect-[9/19.5]",
    desc: "iPhone 15 / 16 Pro · Top island + slight L/R edge cover",
  },
  "20:9": {
    label: "20:9 Android",
    badge: "Tall Crop",
    aspectClass: "aspect-[9/20]",
    desc: "Galaxy Ultra / Android gesture bar · heaviest L/R trim",
  },
};

export const TikTokSafeReelStage: React.FC<TikTokSafeReelStageProps> = ({
  videoSrc,
  downloadFilename = "smakr-oslo-fried-chicken-reel-v19.mp4",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(31.3);
  const [overlayMode, setOverlayMode] = useState<DeadzoneOverlayMode>("bounds");
  const [screenPreset, setScreenPreset] = useState<ScreenRatioPreset>("9:16");
  const [showPaidCtaLine, setShowPaidCtaLine] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSaveToPhone = async () => {
    setIsSavingVideo(true);
    setSaveNotice(null);
    try {
      const res = await fetch(videoSrc, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch video");
      const blob = await res.blob();
      const file = new File([blob], downloadFilename, { type: "video/mp4" });

      // Prefer native mobile Share Sheet ("Save Video" directly to iOS Photos / Android Gallery)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Smakr Oslo Fried Chicken Reel",
        });
        setSaveNotice("Opened Share Sheet — tap Save Video");
        return;
      }

      // Desktop / fallback: trigger direct MP4 download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setSaveNotice("Download started (.mp4)");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        // Last-resort direct link open so mobile Safari can still save
        window.open(videoSrc, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsSavingVideo(false);
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = speed;
  }, [speed]);

  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      await vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleRestart = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    setCurrentTime(0);
    await vid.play();
    setIsPlaying(true);
  };

  const handleSeek = (nextTime: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const ratioSpec = RATIO_META[screenPreset];

  return (
    <section
      aria-label="Oslo Fried Chicken TikTok Reel & Deadzone Inspector"
      className="flex-1 w-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-4"
    >
      {/* Top Studio Controls Bar (Responsive cleanly down to 375px) */}
      <div className="w-full max-w-4xl rounded-3xl bg-[#1C1A18] border border-white/10 p-3 sm:p-4 shadow-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e84a27] text-white text-[10px] font-extrabold uppercase tracking-wider">
                {duration.toFixed(1)}s · 60fps · 1080×1920
              </span>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                TikTok Safe-Zone Tuned
              </span>
            </div>
            <h1 className="font-display text-base sm:text-lg font-extrabold text-white mt-1 truncate">
              Oslo Fried Chicken Reel (Storo + 4 Spots)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveToPhone}
              disabled={isSavingVideo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSavingVideo ? "Preparing MP4..." : "Save to Phone / Download MP4"}</span>
            </button>
            <a
              href={videoSrc}
              download={downloadFilename}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-bold transition-colors"
            >
              <span>Direct MP4</span>
            </a>
          </div>
        </div>
        {saveNotice && (
          <div className="text-[11px] font-bold text-emerald-400">{saveNotice}</div>
        )}

        {/* Overlay Mode & Screen Size Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          {/* Deadzone Mode Toggle */}
          <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
            {(
              [
                { id: "bounds", label: "TikTok Deadzones" },
                { id: "tiktok_mock", label: "Mock TikTok UI" },
                { id: "off", label: "Clean Video" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOverlayMode(id)}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                  overlayMode === id
                    ? "bg-[#e84a27] text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile Screen Ratio Simulator */}
          <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
            {(Object.keys(RATIO_META) as ScreenRatioPreset[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScreenPreset(key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                  screenPreset === key
                    ? "bg-white text-[#181615]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{RATIO_META[key].label}</span>
              </button>
            ))}
          </div>
        </div>

        {overlayMode === "bounds" && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>
              Organic Safe Box: <strong className="text-zinc-200">x: 48..934px</strong> ·{" "}
              <strong className="text-zinc-200">y: 150..1590px</strong> · Bottom{" "}
              <strong className="text-red-300">330px</strong> &amp; Right Rail{" "}
              <strong className="text-red-300">146px</strong> clear
            </span>
            <button
              type="button"
              onClick={() => setShowPaidCtaLine((v) => !v)}
              className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                showPaidCtaLine
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {showPaidCtaLine ? "Hide Long-Caption 470px line" : "Show Long-Caption 470px line"}
            </button>
          </div>
        )}
      </div>

      {/* Center Stage: Responsive Mobile Viewport Frame + Video + Interactive TikTok Overlays */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 max-w-5xl">
        <div className="w-full max-w-[360px] sm:max-w-[380px] flex flex-col items-center gap-3">
          <div className="text-[11px] font-medium text-zinc-400 text-center">
            {ratioSpec.badge} · {ratioSpec.desc}
          </div>

          {/* Phone Bezel simulating real screen cropping (object-cover on 20:9 / 19.5:9) */}
          <div
            className={`relative w-full ${ratioSpec.aspectClass} max-h-[72dvh] rounded-[34px] border-[5px] border-[#2C2826] bg-[#FAF7F2] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)]`}
          >
            {/* Simulated Dynamic Island / Punch Hole for tall mobile devices */}
            {screenPreset !== "9:16" && (
              <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-[26%] h-[18px] rounded-full bg-black/90 border border-white/10" />
            )}

            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              loop
              muted={isMuted}
              preload="metadata"
              onClick={togglePlay}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 20.4)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* OVERLAY MODE 1: RESEARCH-BACKED ORGANIC TIKTOK / IG REELS PIXEL DEADZONES */}
            {overlayMode === "bounds" && (
              <div className="pointer-events-none absolute inset-0 z-30">
                {/* Top UI & Notch/Dynamic Island Deadzone (150px / 1920 = 7.81%) */}
                <div
                  style={{ height: "7.81%" }}
                  className="absolute top-0 inset-x-0 bg-red-500/25 border-b-2 border-dashed border-red-400 flex items-end justify-center pb-0.5"
                >
                  <span className="text-[8.5px] font-mono font-extrabold tracking-wide text-white bg-red-600/90 px-2 py-0.5 rounded-full">
                    TOP UI / NOTCH · 150px
                  </span>
                </div>

                {/* Left Edge Crop Buffer (48px / 1080 = 4.44%) */}
                <div
                  style={{ width: "4.44%", top: "7.81%", bottom: "17.19%" }}
                  className="absolute left-0 bg-amber-500/20 border-r border-dashed border-amber-400"
                />

                {/* Right Engagement Action Rail (146px / 1080 = 13.52%, lower half 48%..92% Y) */}
                <div
                  style={{ width: "13.52%", top: "48%", bottom: "8%" }}
                  className="absolute right-0 bg-red-500/25 border-l-2 border-t-2 border-dashed border-red-400 flex items-center justify-center"
                >
                  <span className="-rotate-90 whitespace-nowrap text-[8.5px] font-mono font-extrabold text-white bg-red-600/90 px-2 py-0.5 rounded-full">
                    LIKES / SHARE · 146px
                  </span>
                </div>

                {/* Bottom Caption, Audio Ticker & Nav Bar Deadzone (330px / 1920 = 17.19%) */}
                <div
                  style={{ height: "17.19%" }}
                  className="absolute bottom-0 inset-x-0 bg-red-500/25 border-t-2 border-dashed border-red-400 flex items-start justify-center pt-1.5"
                >
                  <span className="text-[8.5px] font-mono font-extrabold tracking-wide text-white bg-red-600/90 px-2 py-0.5 rounded-full">
                    CAPTION &amp; NAV BAR · 330px
                  </span>
                </div>

                {/* Optional Long Caption / Paid Ad 470px threshold (24.48%) */}
                {showPaidCtaLine && (
                  <div
                    style={{ bottom: "24.48%" }}
                    className="absolute inset-x-0 border-t-2 border-dotted border-amber-400 flex justify-center"
                  >
                    <span className="text-[8.5px] font-mono font-bold text-amber-950 bg-amber-300/95 px-2 py-0.5 rounded-b-md">
                      LONG CAPTION / AD LIMIT · 470px
                    </span>
                  </div>
                )}

                {/* Green Organic Safe Zone Outline */}
                <div
                  style={{
                    top: "7.81%",
                    left: "4.44%",
                    right: "13.52%",
                    bottom: "17.19%",
                  }}
                  className="absolute border-2 border-dashed border-emerald-400/90 rounded-xl"
                >
                  <span className="absolute top-1 left-1.5 text-[8.5px] font-mono font-extrabold text-emerald-950 bg-emerald-300/90 px-1.5 py-0.5 rounded">
                    IG + TIKTOK SAFE ZONE
                  </span>
                </div>
              </div>
            )}

            {/* OVERLAY MODE 2: AUTHENTIC SIMULATED TIKTOK UI CHROME */}
            {overlayMode === "tiktok_mock" && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between text-white">
                {/* TikTok Top Tabs */}
                <div className="pt-4 px-4 flex items-center justify-between text-[12px] font-bold drop-shadow">
                  <span className="opacity-65">LIVE</span>
                  <div className="flex items-center gap-3">
                    <span className="opacity-75">Following</span>
                    <span className="border-b-2 border-white pb-0.5">For You</span>
                  </div>
                  <Search className="w-4 h-4 opacity-90" />
                </div>

                {/* Middle Right Action Column + Bottom Info */}
                <div className="relative flex-1">
                  <div className="absolute right-2.5 bottom-[14%] flex flex-col items-center gap-3.5 text-[10px] font-semibold drop-shadow">
                    <div className="w-9 h-9 rounded-full bg-[#e84a27] border-2 border-white flex items-center justify-center font-comico text-xs">
                      S
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Heart className="w-6 h-6 fill-white/95" />
                      <span>14.2K</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <MessageCircle className="w-6 h-6 fill-white/95" />
                      <span>312</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Bookmark className="w-6 h-6 fill-amber-400 text-amber-400" />
                      <span>2,840</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Share2 className="w-6 h-6" />
                      <span>645</span>
                    </div>
                  </div>

                  {/* Bottom Handle, Caption, Sound & TikTok Nav Bar */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-8 pb-2 px-3">
                    <div className="max-w-[76%] space-y-1 text-[11px] leading-snug drop-shadow">
                      <div className="font-extrabold">@smakr.no</div>
                      <p className="text-white/90 line-clamp-2">
                        4 local fried chicken spots worth trying in Oslo — Vulkan, Grünerløkka, St.
                        Hanshaugen &amp; Storo #oslofood #smakr
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/85 pt-0.5">
                        <Music className="w-3 h-3" />
                        <span className="truncate">Original sound · Smakr Oslo Radar</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-around text-[9px] font-bold text-white/80">
                      <span className="text-white">Home</span>
                      <span>Friends</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white text-black font-black text-xs">
                        +
                      </span>
                      <span>Inbox</span>
                      <span>Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Transport & Speed Controls */}
          <div className="w-full rounded-2xl bg-[#1C1A18] border border-white/10 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-extrabold cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-black/35 rounded-xl p-0.5">
                {[0.75, 1, 1.25].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
                      speed === spd ? "bg-white text-[#181615]" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span className="w-9">{currentTime.toFixed(1)}s</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-[#e84a27] cursor-pointer"
              />
              <span className="w-9 text-right">{duration.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Side Safe-Zone Research Summary Card (Stacks cleanly below on mobile) */}
        <aside className="w-full max-w-[380px] lg:max-w-xs rounded-3xl bg-[#1C1A18] border border-white/10 p-4 text-xs text-zinc-300 space-y-3">
          <h2 className="font-display text-sm font-extrabold text-white">
            Mobile Screen Safety Checklist
          </h2>
          <ul className="space-y-2 text-[11px] leading-relaxed">
            <li>
              <strong className="text-white">Top (150px):</strong> Clear of Dynamic Island, punch-hole cameras, &amp; TikTok Following / For You / IG Reels tabs.
            </li>
            <li>
              <strong className="text-white">Right Rail (146px):</strong> Spot tags, speech bubbles &amp; finale cards stay left of Like / Comment / Save / Share icons.
            </li>
            <li>
              <strong className="text-white">Bottom (330px):</strong> Mascot host, spot descriptions, Scene 1 caption &amp; Scene 3 CTA sit above organic captions, audio ticker &amp; phone nav bar.
            </li>
            <li>
              <strong className="text-white">20:9 Edge Crop (48px):</strong> Zero edge-hugging text clipped on tall Galaxy Ultra or narrow iPhones.
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
};
