import { cn } from "@/src/lib/storyflow/utils";

export type BeatStatus = "completed" | "in_progress" | "pending";

interface BeatStatusIndicatorProps {
  status: BeatStatus;
  className?: string;
}

export function BeatStatusIndicator({ status, className }: BeatStatusIndicatorProps) {
  const icons = {
    completed: "✓",
    in_progress: "◐",
    pending: "○",
  };

  const colors = {
    completed: "text-green-400",
    in_progress: "text-brand-400",
    pending: "text-slate-600",
  };

  return (
    <span className={cn("text-lg", colors[status], className)}>
      {icons[status]}
    </span>
  );
}
