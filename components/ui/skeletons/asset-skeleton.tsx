import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/src/lib/storyflow/utils";

type AssetSkeletonProps = {
  count?: number;
  className?: string;
};

/**
 * Grid placeholder for the asset library, mirroring mixed media aspect ratios.
 */
export function AssetSkeleton({ count = 6, className }: AssetSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 bg-slate-700/70" />
        <Skeleton className="h-9 w-32 rounded-md bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-lg border border-slate-800/70 bg-slate-900/50 p-3"
          >
            <Skeleton className="h-36 w-full rounded-md bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4 bg-slate-800" />
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>Uploading</span>
                  <span>54%</span>
                </div>
                <Progress value={54} className="h-2 bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
