"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { submitCheckin } from "@/lib/api";
import { Users, Volume2, Zap, CheckCircle2, Loader2 } from "lucide-react";

export function QuickCheckInModal() {
  const isCheckInModalOpen = useCityPulseStore((state) => state.isCheckInModalOpen);
  const closeCheckInModal = useCityPulseStore((state) => state.closeCheckInModal);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);

  const [seatLevel, setSeatLevel] = useState<number>(1);
  const [noiseLevel, setNoiseLevel] = useState<number>(2);
  const [outletsAvailable, setOutletsAvailable] = useState<boolean>(true);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!selectedVenue) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenue) return;

    setIsSubmitting(true);
    try {
      await submitCheckin(selectedVenue.id, {
        seat_level: seatLevel,
        noise_level: noiseLevel,
        outlets_available: outletsAvailable,
        comment: comment.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setComment("");
        closeCheckInModal();
      }, 1200);
    } catch (err) {
      console.error("Check-in error:", err);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isCheckInModalOpen}
      onClose={closeCheckInModal}
      title="Live Check-In"
      subtitle={`Share current vibe at ${selectedVenue.name}`}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#edf6f0] border border-[#b8dec4] flex items-center justify-center text-[#2e6843]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#221e19]">Vibe Updated</h4>
          <p className="text-xs text-[#6b6459] max-w-xs">
            Your live update is now broadcasting to everyone on the map.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Seats */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#221e19]">
              <Users className="w-3.5 h-3.5 text-[#6b6459]" />
              <span>Seat Availability</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 1, label: "Empty", desc: "Plenty of spots" },
                { level: 2, label: "Moderate", desc: "Half full" },
                { level: 3, label: "Packed", desc: "No seats" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.level}
                  onClick={() => setSeatLevel(item.level)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    seatLevel === item.level
                      ? "bg-[#fcf5e8] border-[#b85434] text-[#221e19]"
                      : "bg-[#ffffff] border-[#e3dcce] text-[#6b6459] hover:border-[#b85434]"
                  }`}
                >
                  <p className="font-semibold text-xs">{item.label}</p>
                  <p className="text-[10px] text-[#8c8374] mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Noise */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#221e19]">
              <Volume2 className="w-3.5 h-3.5 text-[#6b6459]" />
              <span>Noise Environment</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 1, label: "Quiet", desc: "Silent / Whisper" },
                { level: 2, label: "Ambient", desc: "Gentle Buzz" },
                { level: 3, label: "Loud", desc: "Music / Chatter" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.level}
                  onClick={() => setNoiseLevel(item.level)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    noiseLevel === item.level
                      ? "bg-[#fcf5e8] border-[#b85434] text-[#221e19]"
                      : "bg-[#ffffff] border-[#e3dcce] text-[#6b6459] hover:border-[#b85434]"
                  }`}
                >
                  <p className="font-semibold text-xs">{item.label}</p>
                  <p className="text-[10px] text-[#8c8374] mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Outlets */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#221e19]">
              <Zap className="w-3.5 h-3.5 text-[#c28421]" />
              <span>Power Outlets</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutletsAvailable(true)}
                className={`p-2 rounded-lg border text-center font-medium text-xs transition-colors ${
                  outletsAvailable
                    ? "bg-[#edf6f0] border-[#b8dec4] text-[#2e6843]"
                    : "bg-[#ffffff] border-[#e3dcce] text-[#6b6459] hover:border-[#b8dec4]"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setOutletsAvailable(false)}
                className={`p-2 rounded-lg border text-center font-medium text-xs transition-colors ${
                  !outletsAvailable
                    ? "bg-[#fbeeed] border-[#ecc3bf] text-[#9c3426]"
                    : "bg-[#ffffff] border-[#e3dcce] text-[#6b6459] hover:border-[#ecc3bf]"
                }`}
              >
                None / Blocked
              </button>
            </div>
          </div>

          {/* 4. Quick Note */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#6b6459]">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2nd floor silent room has empty desks"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e3dcce] text-xs text-[#221e19] placeholder-[#8c8374] focus:outline-none focus:border-[#b85434]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#b85434] hover:bg-[#a6482a] text-white font-medium text-xs shadow transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Check-In</span>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
