"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { executeSpeedTest } from "@/lib/api";
import { Gauge, CheckCircle2, Play, Activity } from "lucide-react";
import { WifiSpeedTest } from "@/types";

export function SpeedTestWidget() {
  const isSpeedTestModalOpen = useCityPulseStore((state) => state.isSpeedTestModalOpen);
  const closeSpeedTestModal = useCityPulseStore((state) => state.closeSpeedTestModal);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);

  const [testing, setTesting] = useState(false);
  const [stage, setStage] = useState<"idle" | "ping" | "downloading" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<WifiSpeedTest | null>(null);

  if (!selectedVenue) return null;

  async function startTest() {
    setTesting(true);
    setResult(null);
    setProgress(10);
    setStage("ping");

    try {
      const res = await executeSpeedTest(selectedVenue!.id, (st, prog) => {
        setStage(st);
        setProgress(prog);
      });
      setResult(res);
      setStage("complete");
      setTesting(false);
    } catch (err) {
      console.error("Speed test failed:", err);
      setTesting(false);
      setStage("idle");
    }
  }

  return (
    <Modal
      isOpen={isSpeedTestModalOpen}
      onClose={() => {
        setResult(null);
        setStage("idle");
        closeSpeedTestModal();
      }}
      title="WiFi Speed Test"
      subtitle={`Measure network performance at ${selectedVenue.name}`}
      maxWidth="sm"
    >
      <div className="py-2 flex flex-col items-center justify-center space-y-5">
        {/* Speedometer Circle */}
        <div className="relative w-36 h-36 rounded-full bg-[#f6f3ee] border border-[#e3dcce] flex flex-col items-center justify-center shadow-xs">
          {testing && (
            <div
              className="absolute inset-0 rounded-full border-2 border-[#b85434] border-t-transparent animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
          )}

          <Gauge
            className={`w-6 h-6 ${
              stage === "complete" ? "text-[#3e7953]" : "text-[#6b6459]"
            }`}
          />

          <div className="text-center mt-1">
            <span className="text-2xl font-bold text-[#221e19] font-mono tracking-tight">
              {result
                ? result.download_mbps
                : testing
                ? (progress * 1.5).toFixed(0)
                : selectedVenue.vibe.avg_download_mbps || "--"}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6459]">
              Mbps Down
            </p>
          </div>

          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8c8374] font-mono">
            <Activity className="w-3 h-3 text-[#b85434]" />
            <span>
              {result
                ? `${result.ping_ms}ms ping`
                : selectedVenue.vibe.avg_ping_ms
                ? `${selectedVenue.vibe.avg_ping_ms}ms ping`
                : "0ms ping"}
            </span>
          </div>
        </div>

        {/* Status Stage Text */}
        <div className="text-center space-y-1">
          {stage === "idle" && (
            <p className="text-xs text-[#6b6459]">
              Measures live download throughput & latency.
            </p>
          )}
          {stage === "ping" && (
            <p className="text-xs text-[#b85434] font-medium">
              Pinging server...
            </p>
          )}
          {stage === "downloading" && (
            <p className="text-xs text-[#b85434] font-medium">
              Measuring download speed...
            </p>
          )}
          {stage === "complete" && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#2e6843] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Speed logged to venue</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={startTest}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#b85434] hover:bg-[#a6482a] text-white font-medium text-xs shadow transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>
            {testing
              ? "Running Test..."
              : stage === "complete"
              ? "Test Again"
              : "Start Speed Test"}
          </span>
        </button>
      </div>
    </Modal>
  );
}
