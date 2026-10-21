"use client";

import React, { useState } from "react";
import { Clock, Calendar, Check, ChevronDown, Flame, Sun, Moon, Sparkles } from "lucide-react";

export interface TimeSlotPickerProps {
  value: string;
  onChange: (formattedHours: string) => void;
  className?: string;
  label?: string;
}

const PRESET_HOURS = [
  { label: "☀️ Daytime", schedule: "11:00 – 17:00", icon: Sun },
  { label: "🌙 Evening", schedule: "17:00 – 22:00", icon: Moon },
  { label: "🔥 17:00 – Til tomt", schedule: "17:00 – Til tomt (Sold Out)", icon: Flame },
  { label: "🎉 Late Night", schedule: "18:00 – 01:00", icon: Sparkles },
];

const TIME_OPTIONS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "Late",
  "Til tomt",
];

export function TimeSlotPicker({
  value,
  onChange,
  className = "",
  label,
}: TimeSlotPickerProps) {
  // Parse initial start and end if possible
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);

  const parts = value ? value.split(/–|-/).map((s) => s.trim()) : [];
  const currentStart = parts[0] || "12:00";
  const currentEnd = parts[1] || "22:00";

  const handleSelectTime = (selected: string) => {
    if (activePicker === "start") {
      const updated = `${selected} – ${currentEnd}`;
      onChange(updated);
      setActivePicker(null);
    } else if (activePicker === "end") {
      const updated = `${currentStart} – ${selected}`;
      onChange(updated);
      setActivePicker(null);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#181615] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E84A27]" />
            <span>{label}</span>
          </label>
          {value && (
            <span className="text-[11px] font-mono font-bold text-[#E84A27] bg-[#E84A27]/10 px-2 py-0.5 rounded-md">
              {value}
            </span>
          )}
        </div>
      )}

      {/* Row 1 — 1-Tap Quick Schedule Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {PRESET_HOURS.map((preset) => {
          const isActive = value === preset.schedule;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.schedule);
                setActivePicker(null);
              }}
              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#181615] text-[#FAF7F2] shadow-xs"
                  : "bg-[#FAF7F2] text-[#181615]/80 border border-[#181615]/10 hover:border-[#181615]/30 hover:bg-white"
              }`}
            >
              <span>{preset.label}</span>
              {isActive && <Check className="w-3 h-3 text-[#E84A27]" />}
            </button>
          );
        })}
      </div>

      {/* Row 2 — Tactile "Opens → Closes" Button Pair */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActivePicker((prev) => (prev === "start" ? null : "start"))}
          className={`h-11 px-3.5 rounded-2xl border font-bold text-xs sm:text-sm text-[#181615] flex items-center justify-between transition-all cursor-pointer ${
            activePicker === "start"
              ? "bg-white border-[#E84A27] ring-2 ring-[#E84A27]/15"
              : "bg-[#FAF7F2] border-[#181615]/15 hover:border-[#181615]/30"
          }`}
        >
          <span className="text-zinc-500 font-normal text-xs">Opens:</span>
          <span className="font-mono font-bold">{currentStart}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#E84A27] transition-transform ${
              activePicker === "start" ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setActivePicker((prev) => (prev === "end" ? null : "end"))}
          className={`h-11 px-3.5 rounded-2xl border font-bold text-xs sm:text-sm text-[#181615] flex items-center justify-between transition-all cursor-pointer ${
            activePicker === "end"
              ? "bg-white border-[#E84A27] ring-2 ring-[#E84A27]/15"
              : "bg-[#FAF7F2] border-[#181615]/15 hover:border-[#181615]/30"
          }`}
        >
          <span className="text-zinc-500 font-normal text-xs">Closes:</span>
          <span className="font-mono font-bold">{currentEnd}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#E84A27] transition-transform ${
              activePicker === "end" ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expandable 4-Column Thumb Grid */}
      {activePicker && (
        <div className="p-3 rounded-2xl bg-white border border-[#181615]/10 shadow-lg space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
            <span>Select {activePicker === "start" ? "Opening" : "Closing"} Time:</span>
            <button
              type="button"
              onClick={() => setActivePicker(null)}
              className="text-[#E84A27] hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {TIME_OPTIONS.map((time) => {
              const isSelected =
                activePicker === "start" ? currentStart === time : currentEnd === time;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleSelectTime(time)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    isSelected
                      ? "bg-[#E84A27] text-white shadow-xs"
                      : "bg-[#FAF7F2] hover:bg-[#181615]/5 text-[#181615]"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   COMPANION: DateWindowPicker
   ========================================================================= */

export interface DateWindowPickerProps {
  value: string;
  onChange: (formattedDate: string) => void;
  className?: string;
  label?: string;
}

const PRESET_DATES = [
  { label: "Today Only", compute: () => "Today Only" },
  { label: "This Weekend", compute: () => "This Weekend (Fri–Sun)" },
  { label: "Next Weekend", compute: () => "Next Weekend" },
];

export function DateWindowPicker({
  value,
  onChange,
  className = "",
  label = "Dates / Residency Window",
}: DateWindowPickerProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      onChange(`${startDate} – ${endDate}`);
    } else if (startDate) {
      onChange(startDate);
    }
    setIsCustomOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#181615] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#E84A27]" />
          <span>{label}</span>
        </label>
        {value && (
          <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
            {value}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESET_DATES.map((preset) => {
          const isActive = value === preset.compute();
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.compute());
                setIsCustomOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#181615] text-[#FAF7F2] shadow-xs"
                  : "bg-[#FAF7F2] text-[#181615]/80 border border-[#181615]/10 hover:border-[#181615]/30 hover:bg-white"
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsCustomOpen((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
            isCustomOpen
              ? "bg-white border-[#E84A27] text-[#E84A27]"
              : "bg-[#FAF7F2] border-[#181615]/10 text-[#181615]/80 hover:bg-white"
          }`}
        >
          <span>Pick Dates 📅</span>
        </button>
      </div>

      {isCustomOpen && (
        <div className="p-3 rounded-2xl bg-white border border-[#181615]/10 shadow-sm space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Starts</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Ends</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-mono font-semibold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomOpen(false)}
              className="px-3 py-1 rounded-xl text-xs text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCustom}
              className="px-3 py-1 rounded-xl bg-[#E84A27] text-white text-xs font-bold"
            >
              Set Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
