"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Activity, ChevronDown, Scissors, Mic, Sparkles, Film, Cog, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

// Task status lifecycle: running → completed | failed | cancelled
type BackgroundTaskStatus = "running" | "completed" | "failed" | "cancelled";

export interface BackgroundTask {
  id: string;
  projectId: string;
  category: string;
  name: string;
  icon: "scissors" | "mic" | "sparkles" | "film" | "cog";
  status: BackgroundTaskStatus;
  progress: {
    current: number;
    total: number;
    label?: string;
  } | null;
  startedAt: number;
  completedAt: number | null;
  error: string | null;
  abortController: AbortController;
}

interface BackgroundActivityContextValue {
  tasks: BackgroundTask[];
  addTask: (config: {
    projectId: string;
    category: string;
    name: string;
    icon: BackgroundTask["icon"];
  }) => {
    id: string;
    abortSignal: AbortSignal;
    updateProgress: (current: number, total: number, label?: string) => void;
    complete: () => void;
    fail: (error: string) => void;
  };
  cancelTask: (id: string) => void;
  dismissTask: (id: string) => void;
  isTaskRunning: (category: string, projectId?: string) => boolean;
  hasFailedTasks: boolean;
}

const BackgroundActivityContext = createContext<BackgroundActivityContextValue | null>(null);

export function BackgroundActivityProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setMounted(true);
    return () => {
      // Cleanup all pending dismiss timers
      dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, []);

  const addTask = useCallback(
    (config: { projectId: string; category: string; name: string; icon: BackgroundTask["icon"] }) => {
      const id = crypto.randomUUID();
      const abortController = new AbortController();

      const newTask: BackgroundTask = {
        id,
        projectId: config.projectId,
        category: config.category,
        name: config.name,
        icon: config.icon,
        status: "running",
        progress: null,
        startedAt: Date.now(),
        completedAt: null,
        error: null,
        abortController,
      };

      setTasks((prev) => [...prev, newTask]);
      setExpanded(true);

      return {
        id,
        abortSignal: abortController.signal,
        updateProgress: (current: number, total: number, label?: string) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, progress: { current, total, label } } : t
            )
          );
        },
        complete: () => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, status: "completed" as const, completedAt: Date.now() }
                : t
            )
          );
        },
        fail: (error: string) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, status: "failed" as const, completedAt: Date.now(), error }
                : t
            )
          );
        },
      };
    },
    []
  );

  const cancelTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id && t.status === "running") {
          t.abortController.abort();
          return { ...t, status: "cancelled" as const, completedAt: Date.now() };
        }
        return t;
      })
    );
    setCancelConfirmId(null);
  }, []);

  const dismissTask = useCallback((id: string) => {
    // Clear any pending auto-dismiss timer for this task
    const timer = dismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isTaskRunning = useCallback(
    (category: string, projectId?: string) => {
      return tasks.some((t) => {
        if (t.category !== category || t.status !== "running") return false;
        if (projectId !== undefined) return t.projectId === projectId;
        return true;
      });
    },
    [tasks]
  );

  const hasFailedTasks = tasks.some((t) => t.status === "failed");

  // Auto-dismiss completed/cancelled tasks (failed tasks require explicit dismissal)
  useEffect(() => {
    tasks.forEach((task) => {
      if (
        task.status !== "running" &&
        task.status !== "failed" &&
        !dismissTimersRef.current.has(task.id)
      ) {
        const timeout = 5000;
        const timer = setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          dismissTimersRef.current.delete(task.id);
        }, timeout);
        dismissTimersRef.current.set(task.id, timer);
      }
    });
  }, [tasks]);


  const value = useMemo(
    () => ({ tasks, addTask, cancelTask, dismissTask, isTaskRunning, hasFailedTasks }),
    [tasks, addTask, cancelTask, dismissTask, isTaskRunning, hasFailedTasks]
  );

  const runningTasksCount = tasks.filter((t) => t.status === "running").length;

  return (
    <BackgroundActivityContext.Provider value={value}>
      {children}
      {mounted &&
        tasks.length > 0 &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[60]">
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="relative rounded-full bg-slate-900/95 p-2.5 shadow-lg shadow-black/40 backdrop-blur border border-slate-800 hover:bg-slate-800 transition-colors"
                aria-label={`Background activity — ${runningTasksCount} tasks running`}
                role="button"
              >
                <Activity className="h-5 w-5 text-brand-500" />
                {runningTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                    {runningTasksCount}
                  </span>
                )}
              </button>
            )}

            {expanded && (
              <div className="w-80 max-h-96 overflow-y-auto rounded-xl bg-slate-900/95 backdrop-blur border border-slate-800 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Background Activity</h3>
                    {hasFailedTasks && (
                      <span className="flex items-center gap-1 text-xs text-rose-400">
                        <AlertCircle className="h-3 w-3" />
                        {tasks.filter((t) => t.status === "failed").length} failed
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (hasFailedTasks) return; // Prevent collapsing while failed tasks exist
                      setExpanded(false);
                    }}
                    className={cn(
                      "rounded-md p-1 text-slate-400",
                      hasFailedTasks
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-800 hover:text-white"
                    )}
                    aria-label={hasFailedTasks ? "Dismiss failed tasks before minimizing" : "Minimize"}
                    title={hasFailedTasks ? "Dismiss failed tasks before minimizing" : "Minimize"}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800" role="region" aria-label="Background activity monitor">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onCancel={() => setCancelConfirmId(task.id)}
                      onConfirmCancel={() => cancelTask(task.id)}
                      onCancelCancel={() => setCancelConfirmId(null)}
                      onDismiss={() => dismissTask(task.id)}
                      showCancelConfirm={cancelConfirmId === task.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </BackgroundActivityContext.Provider>
  );
}

function TaskCard({
  task,
  onCancel,
  onConfirmCancel,
  onCancelCancel,
  onDismiss,
  showCancelConfirm,
}: {
  task: BackgroundTask;
  onCancel: () => void;
  onConfirmCancel: () => void;
  onCancelCancel: () => void;
  onDismiss: () => void;
  showCancelConfirm: boolean;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (task.status === "running") {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - task.startedAt);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.status, task.startedAt]);

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const IconComponent = {
    scissors: Scissors,
    mic: Mic,
    sparkles: Sparkles,
    film: Film,
    cog: Cog,
  }[task.icon];

  const statusColor = {
    running: "text-brand-500",
    completed: "text-emerald-500",
    failed: "text-rose-500",
    cancelled: "text-amber-500",
  }[task.status];

  const StatusIcon = {
    running: Activity,
    completed: Check,
    failed: AlertCircle,
    cancelled: X,
  }[task.status];

  // Failed tasks don't fade out — they persist until explicitly dismissed
  const shouldFadeOut = task.status !== "running" && task.status !== "failed";

  return (
    <div className={cn(
      "p-4",
      shouldFadeOut && "animate-fadeOut",
      task.status === "failed" && "bg-rose-950/20"
    )}>
      <div className="flex items-start gap-3">
        <IconComponent className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{task.name}</p>
            {task.status === "running" && !showCancelConfirm && (
              <button
                onClick={onCancel}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white flex-shrink-0"
                aria-label="Cancel task"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {task.status === "failed" && (
              <button
                onClick={onDismiss}
                className="rounded-md p-1 text-slate-400 hover:bg-rose-900/50 hover:text-rose-300 flex-shrink-0"
                aria-label="Dismiss failed task"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showCancelConfirm && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">Cancel this task?</span>
              <button
                onClick={onConfirmCancel}
                className="px-2 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded"
              >
                Yes
              </button>
              <button
                onClick={onCancelCancel}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
              >
                No
              </button>
            </div>
          )}

          {task.progress && (
            <div className="mb-2">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{
                    width: `${task.progress.total > 0 ? (task.progress.current / task.progress.total) * 100 : 0}%`,
                  }}
                  role="progressbar"
                  aria-valuenow={task.progress.current}
                  aria-valuemin={0}
                  aria-valuemax={task.progress.total}
                />
              </div>
              {task.progress.label && (
                <p className="text-xs text-slate-400 mt-1">{task.progress.label}</p>
              )}
            </div>
          )}

          {!task.progress && task.status === "running" && (
            <div className="mb-2">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 animate-indeterminate" role="progressbar" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className={cn("flex items-center gap-1", statusColor)}>
              <StatusIcon className="h-3 w-3" />
              {task.status === "running" && "Running"}
              {task.status === "completed" && "Completed"}
              {task.status === "failed" && "Failed"}
              {task.status === "cancelled" && "Cancelled"}
            </span>
            <span className="text-slate-400">{formatElapsedTime(elapsedTime)}</span>
          </div>

          {task.error && (
            <p className="text-xs text-rose-400 mt-1 truncate" title={task.error}>
              {task.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function useBackgroundActivity() {
  const ctx = useContext(BackgroundActivityContext);
  if (!ctx) throw new Error("useBackgroundActivity must be used within BackgroundActivityProvider");
  return ctx;
}
