"use client";

import { Images, Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRunMediaStage } from "@/src/hooks/queries/use-pipeline";
import { useBackgroundTask } from "@/src/hooks/use-background-task";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  projectId: string;
  onCompleted?: () => void;
};

export function MediaStageButton({ projectId, onCompleted }: Props) {
  const { toast } = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const mutation = useRunMediaStage(projectId);
  const [lastCompletedAt, setLastCompletedAt] = useState<Date | null>(null);

  const busy = mutation.isPending || isTaskRunning("pipeline-media", projectId);

  const handleCompleteMedia = async () => {
    await runTask(
      { projectId, category: "pipeline-media", name: "Marking media ready", icon: "images" },
      async ({ signal }) => {
        const result = await mutation.mutateAsync({ signal });
        setLastCompletedAt(new Date());
        onCompleted?.();
        toast({
          title: "Media ready",
          description: `Assets checked (${result.assets}). Status set to ASSETS_READY.`,
        });
        return result;
      }
    );
  };

  const statusLabel = useMemo(() => {
    if (busy) return "Marking…";
    if (lastCompletedAt) return `Ready · ${lastCompletedAt.toLocaleTimeString()}`;
    return "Mark Media Ready";
  }, [busy, lastCompletedAt]);

  return (
    <Button onClick={handleCompleteMedia} disabled={busy} variant="secondary" className="gap-2">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : lastCompletedAt ? <Check className="h-4 w-4" /> : <Images className="h-4 w-4" />}
      {statusLabel}
    </Button>
  );
}
