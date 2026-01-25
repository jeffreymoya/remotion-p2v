import { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";
import { Button } from "@/components/ui/button";

type InlineErrorProps = {
  title?: string;
  message: string;
  details?: string;
  suggestions?: string[];
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Inline error surface with optional retry action and guidance.
 * Use inside cards/sections to provide contextual recovery without modals.
 */
export function InlineError({
  title = "Something went wrong",
  message,
  details,
  suggestions,
  onRetry,
  retryLabel = "Retry",
  actions,
  className,
}: InlineErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-rose-500/40 bg-rose-900/30 p-4 text-rose-50 shadow-inner shadow-rose-950/40",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-rose-500/20 p-1 text-rose-100">
          <AlertCircle className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="text-sm text-rose-100/90">{message}</p>
            {details && <p className="text-xs text-rose-100/80">{details}</p>}
          </div>

          {suggestions?.length ? (
            <ul className="space-y-1 rounded-md bg-white/5 p-3 text-xs text-rose-50/90">
              {suggestions.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-rose-300" aria-hidden />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {(onRetry || actions) && (
            <div className="flex flex-wrap items-center gap-2">
              {onRetry ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-rose-400/60 text-rose-50 hover:bg-rose-500/15 hover:text-rose-50"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                  {retrying ? "Retrying..." : retryLabel}
                </Button>
              ) : null}
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
