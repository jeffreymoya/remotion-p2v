import { useBackgroundActivity } from "@/components/ui/background-activity-provider";
import type { BackgroundTask } from "@/components/ui/background-activity-provider";
import { useToast } from "@/components/ui/toast-provider";

export function useBackgroundTask() {
  const { addTask, cancelTask, isTaskRunning } = useBackgroundActivity();
  const toast = useToast();

  const runTask = async <T,>(
    config: { projectId: string; category: string; name: string; icon: BackgroundTask["icon"] },
    fn: (controls: {
      signal: AbortSignal;
      updateProgress: (current: number, total: number, label?: string) => void;
    }) => Promise<T>
  ): Promise<T | null> => {
    const { abortSignal, updateProgress, complete, fail } = addTask(config);

    try {
      const result = await fn({ signal: abortSignal, updateProgress });
      complete();
      toast({ title: "Task completed", description: config.name, variant: "success" });
      return result;
    } catch (error) {
      if (abortSignal.aborted) {
        // User-initiated cancellation - no toast (user already knows)
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      fail(errorMessage);
      toast({ title: "Task failed", description: errorMessage, variant: "error" });
      return null;
    }
  };

  return { runTask, isTaskRunning, cancelTask };
}
