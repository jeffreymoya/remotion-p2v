import { Lock } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/src/lib/storyflow/utils";

type StageGateProps = {
  locked: boolean;
  message?: string;
  children: ReactNode;
  className?: string;
};

export function StageGate({ locked, message, children, className }: StageGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-400",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Lock className="h-4 w-4" /> Stage locked
      </div>
      <p className="text-sm">{message ?? "Complete the previous stage to unlock this step."}</p>
    </div>
  );
}
