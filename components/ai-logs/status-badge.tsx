import type { AiCallStatus } from "@/src/generated/storyflow";
import { cn } from "@/src/lib/storyflow/utils";

interface StatusBadgeProps {
  status: AiCallStatus;
  className?: string;
}

const statusConfig: Record<
  AiCallStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-950/50 text-amber-200 border-amber-800/50",
  },
  STREAMING: {
    label: "Streaming",
    className: "bg-brand-950/50 text-brand-200 border-brand-800/50",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-950/50 text-emerald-200 border-emerald-800/50",
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-950/50 text-rose-200 border-rose-800/50",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-900/50 text-slate-400 border-slate-800/50",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {status === "PENDING" && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      )}
      {config.label}
    </span>
  );
}
