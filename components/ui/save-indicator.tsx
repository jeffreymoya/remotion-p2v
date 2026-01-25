import { Check, Clock3, CloudOff } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";
import { AutoSaveStatus } from "@/src/hooks/use-auto-save";

type SaveIndicatorProps = {
  status: AutoSaveStatus;
  lastSavedAt?: Date | null;
  error?: string | null;
  className?: string;
};

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SaveIndicator({ status, lastSavedAt, error, className }: SaveIndicatorProps) {
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";

  if (status === "saving") {
    return (
      <span
        className={cn(
          base,
          "border border-amber-400/40 bg-amber-500/10 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]",
          className
        )}
      >
        <Clock3 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className={cn(
          base,
          "border border-rose-400/50 bg-rose-500/10 text-rose-100 shadow-[0_0_0_1px_rgba(248,113,113,0.2)]",
          className
        )}
        title={error ?? "Auto-save failed"}
      >
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        Auto-save failed
      </span>
    );
  }

  return (
    <span
      className={cn(
        base,
        "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.15)]",
        className
      )}
    >
      <Check className="h-3.5 w-3.5" aria-hidden />
      {lastSavedAt ? `Saved ${formatTimestamp(lastSavedAt)}` : "Saved"}
    </span>
  );
}
