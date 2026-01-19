"use client";

import { useState } from "react";
import { cn } from "@/src/lib/storyflow/utils";

interface DurationPickerProps {
  value: number; // milliseconds
  onChange: (ms: number) => void;
  className?: string;
}

const PRESET_DURATIONS = [
  { label: "30 sec", ms: 30000 },
  { label: "1 min", ms: 60000 },
  { label: "2 min", ms: 120000 },
  { label: "3 min", ms: 180000 },
  { label: "5 min", ms: 300000 },
  { label: "10 min", ms: 600000 },
];

export function DurationPicker({ value, onChange, className }: DurationPickerProps) {
  const [customMode, setCustomMode] = useState(false);

  const formatDisplay = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${minutes} min`;
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = parseInt(e.target.value, 10);
    if (!isNaN(seconds) && seconds > 0) {
      onChange(seconds * 1000);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-slate-200">Target Duration</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_DURATIONS.map((preset) => (
          <button
            key={preset.ms}
            onClick={() => {
              onChange(preset.ms);
              setCustomMode(false);
            }}
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-semibold transition",
              value === preset.ms
                ? "border-brand-500 bg-brand-500/20 text-brand-300"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
            )}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setCustomMode(true)}
          className={cn(
            "rounded-md border px-3 py-2 text-xs font-semibold transition",
            customMode
              ? "border-brand-500 bg-brand-500/20 text-brand-300"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
          )}
        >
          Custom
        </button>
      </div>
      {customMode && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10"
            max="3600"
            placeholder="Duration in seconds"
            defaultValue={Math.floor(value / 1000)}
            onChange={handleCustomInput}
            className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          />
          <span className="text-sm text-slate-400">seconds</span>
        </div>
      )}
      {!customMode && (
        <p className="text-xs text-slate-400">
          Selected: {formatDisplay(value)}
        </p>
      )}
    </div>
  );
}
