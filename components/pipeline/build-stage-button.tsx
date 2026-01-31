"use client";

import { Hammer, Loader2, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useBuildProject } from "@/src/hooks/queries/use-pipeline";
import { useBackgroundTask } from "@/src/hooks/use-background-task";

type Props = {
  projectId: string;
  onBuilt?: () => void;
};

export function BuildStageButton({ projectId, onBuilt }: Props) {
  const { toast } = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const buildMutation = useBuildProject(projectId);
  const [lastBuiltAt, setLastBuiltAt] = useState<Date | null>(null);

  const busy = buildMutation.isPending || isTaskRunning("pipeline-build", projectId);

  const handleBuild = async () => {
    await runTask(
      { projectId, category: "pipeline-build", name: "Building timeline", icon: "hammer" },
      async ({ signal }) => {
        const timeline = await buildMutation.mutateAsync({ signal });
        setLastBuiltAt(new Date());
        onBuilt?.();
        toast({
          title: "Build completed",
          description: "timeline.json regenerated and saved",
        });
        return timeline;
      }
    );
  };

  const statusLabel = useMemo(() => {
    if (busy) return "Building…";
    if (lastBuiltAt) return `Built ${lastBuiltAt.toLocaleTimeString()}`;
    return "Build timeline";
  }, [busy, lastBuiltAt]);

  return (
    <Button onClick={handleBuild} disabled={busy} variant="secondary" className="gap-2">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : lastBuiltAt ? <Check className="h-4 w-4" /> : <Hammer className="h-4 w-4" />}
      {statusLabel}
    </Button>
  );
}
