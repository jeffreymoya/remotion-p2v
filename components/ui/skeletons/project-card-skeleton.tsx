import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/src/lib/storyflow/utils";

type ProjectCardSkeletonProps = {
  className?: string;
  showProgress?: boolean;
};

/**
 * Compact project card placeholder used while project queries stream in.
 */
export function ProjectCardSkeleton({ className, showProgress = true }: ProjectCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-inner shadow-slate-950/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-700/70" />
          <Skeleton className="h-3 w-20 bg-slate-800" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full bg-slate-800/90" />
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full bg-slate-800" />
        <Skeleton className="h-3 w-5/6 bg-slate-800" />
      </div>

      {showProgress ? (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Preparing assets</span>
            <span>72%</span>
          </div>
          <Progress value={72} className="h-2 bg-slate-800" />
        </div>
      ) : null}
    </div>
  );
}
