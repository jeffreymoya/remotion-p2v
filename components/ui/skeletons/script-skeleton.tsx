import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/src/lib/storyflow/utils";

type ScriptSkeletonProps = {
  segments?: number;
  className?: string;
};

/**
 * Placeholder for script builder segments with auto-save + TTS progress affordances.
 */
export function ScriptSkeleton({ segments = 3, className }: ScriptSkeletonProps) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-inner shadow-slate-950/50",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-700/70" />
          <Skeleton className="h-3 w-44 bg-slate-800" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16 rounded-full bg-emerald-500/30" />
          <Skeleton className="h-8 w-24 rounded-md bg-slate-800" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: segments }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-slate-800/70 bg-slate-900/40 p-4"
          >
            <Skeleton className="h-3 w-28 bg-slate-800" />
            <Skeleton className="h-3 w-full bg-slate-800" />
            <Skeleton className="h-3 w-[92%] bg-slate-800" />
            <Skeleton className="h-3 w-[78%] bg-slate-800" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Auto-save</span>
            <span>Saving…</span>
          </div>
          <Progress value={48} className="h-2 bg-slate-800" />
        </div>
        <div className="space-y-2 rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>TTS synthesis</span>
            <span>32%</span>
          </div>
          <Progress value={32} className="h-2 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
