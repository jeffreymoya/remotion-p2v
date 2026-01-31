"use client";

import { FileText, Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRunScriptStage } from "@/src/hooks/queries/use-pipeline";
import { useBackgroundTask } from "@/src/hooks/use-background-task";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  projectId: string;
  onCompleted?: () => void;
};

export function ScriptStageButton({ projectId, onCompleted }: Props) {
  const { toast } = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const mutation = useRunScriptStage(projectId);
  const [lastCompletedAt, setLastCompletedAt] = useState<Date | null>(null);

  const busy = mutation.isPending || isTaskRunning("pipeline-script", projectId);

  const handleCompleteScript = async () => {
    await runTask(
      { projectId, category: "pipeline-script", name: "Validating script", icon: "file-text" },
      async ({ signal }) => {
        const result = await mutation.mutateAsync({ signal });
        setLastCompletedAt(new Date());
        onCompleted?.();
        toast({
          title: "Script ready",
          description: `Script validated (${result.segments} segments). Status set to SCRIPT_READY.`,
        });
        return result;
      }
    );
  };

  const statusLabel = useMemo(() => {
    if (busy) return "Validating…";
    if (lastCompletedAt) return `Ready · ${lastCompletedAt.toLocaleTimeString()}`;
    return "Mark Script Ready";
  }, [busy, lastCompletedAt]);

  return (
    <Button onClick={handleCompleteScript} disabled={busy} variant="secondary" className="gap-2">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : lastCompletedAt ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      {statusLabel}
    </Button>
  );
}
