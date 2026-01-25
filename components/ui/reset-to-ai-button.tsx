"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/src/lib/storyflow/utils";

type ResetToAiButtonProps = {
  onReset: () => Promise<void>;
  stageName?: string;
  description?: string;
  triggerLabel?: string;
  disabled?: boolean;
  className?: string;
};

const DEFAULT_DESCRIPTION = "This will delete all your changes and regenerate from AI. Continue?";

/**
 * Confirmation gate for destructive AI resets.
 * Shows a dialog, runs the provided reset callback, and surfaces retryable errors.
 */
export function ResetToAiButton({
  onReset,
  stageName = "this stage",
  description,
  triggerLabel = "Reset to AI Default",
  disabled,
  className,
}: ResetToAiButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const details = useMemo(() => description ?? DEFAULT_DESCRIPTION, [description]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onReset();
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset to AI default.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setError(null);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "border-amber-500/50 text-amber-50 hover:border-amber-400 hover:bg-amber-500/10",
            className
          )}
          disabled={disabled}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-950">
        <DialogHeader>
          <DialogTitle>Reset {stageName} to AI Default</DialogTitle>
          <DialogDescription>{details}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" aria-hidden />
            <div className="space-y-1">
              <p className="font-medium text-amber-50">All manual edits will be removed.</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-200/90">
                <li>No backup or history is kept during reset.</li>
                <li>If regeneration fails, you can retry from this dialog.</li>
              </ul>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-50">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Resetting...
              </>
            ) : (
              "Delete changes and reset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
