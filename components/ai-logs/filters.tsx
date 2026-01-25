"use client";

import type { AiCallStatus } from "@/src/generated/storyflow";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  status: AiCallStatus | "all";
  provider: string;
  onStatusChange: (status: AiCallStatus | "all") => void;
  onProviderChange: (provider: string) => void;
  onReset: () => void;
}

const statusOptions: Array<{ value: AiCallStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
];

const providerOptions = [
  { value: "all", label: "All Providers" },
  { value: "gemini-cli", label: "Gemini CLI" },
  { value: "google-tts", label: "Google TTS" },
];

export function Filters({
  status,
  provider,
  onStatusChange,
  onProviderChange,
  onReset,
}: FiltersProps) {
  const hasFilters = status !== "all" || provider !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="h-4 w-px bg-slate-700" />

      <div className="flex gap-2">
        {providerOptions.map((option) => (
          <Button
            key={option.value}
            variant={provider === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onProviderChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {hasFilters && (
        <>
          <div className="h-4 w-px bg-slate-700" />
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
