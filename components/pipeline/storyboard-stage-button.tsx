"use client";

import { Check, PanelsTopLeft, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRunStoryboard } from "@/src/hooks/queries/use-pipeline";
import { useBackgroundTask } from "@/src/hooks/use-background-task";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  projectId: string;
  onCompleted?: () => void;
};

export function StoryboardStageButton({ projectId, onCompleted }: Props) {
  const { toast } = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const mutation = useRunStoryboard(projectId);
  const [lastCompletedAt, setLastCompletedAt] = useState<Date | null>(null);

  const busy = mutation.isPending || isTaskRunning("pipeline-storyboard", projectId);

  const handleStoryboard = async () => {
    await runTask(
      { projectId, category: "pipeline-storyboard", name: "Validating boards", icon: "layout" },
      async ({ signal }) => {
        const result = await mutation.mutateAsync({ signal });
        setLastCompletedAt(new Date());
        onCompleted?.();
        toast({
          title: "Storyboard ready",
          description: `Boards validated (${result.boardCount}). Status set to BOARDS_READY.`,
        });
        return result;
      }
    );
  };

  const statusLabel = useMemo(() => {
    if (busy) return "Running…";
    if (lastCompletedAt) return `Ready · ${lastCompletedAt.toLocaleTimeString()}`;
    return "Mark Storyboard Ready";
  }, [busy, lastCompletedAt]);

  return (
    <Button onClick={handleStoryboard} disabled={busy} variant="secondary" className="gap-2">
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : lastCompletedAt ? (
        <Check className="h-4 w-4" />
      ) : (
        <PanelsTopLeft className="h-4 w-4" />
      )}
      {statusLabel}
    </Button>
  );
}
