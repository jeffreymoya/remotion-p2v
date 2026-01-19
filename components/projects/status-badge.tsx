import { ProjectStatus } from "@/src/lib/storyflow/types";
import { cn } from "@/src/lib/storyflow/utils";

const STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-800 text-slate-200" },
  SCRIPT_READY: { label: "Script Ready", color: "bg-emerald-900/60 text-emerald-200" },
  ASSETS_READY: { label: "Assets Ready", color: "bg-amber-900/60 text-amber-200" },
  VIEWPORT_READY: { label: "Viewport Ready", color: "bg-sky-900/60 text-sky-200" },
  BOARDS_READY: { label: "Boards Ready", color: "bg-indigo-900/60 text-indigo-200" },
  RENDER_READY: { label: "Render Ready", color: "bg-purple-900/60 text-purple-200" },
  RENDERING: { label: "Rendering", color: "bg-blue-900/60 text-blue-100" },
  COMPLETED: { label: "Completed", color: "bg-green-900/60 text-green-100" },
  ERROR: { label: "Error", color: "bg-rose-900/60 text-rose-100" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const style = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        style.color
      )}
    >
      {style.label}
    </span>
  );
}
