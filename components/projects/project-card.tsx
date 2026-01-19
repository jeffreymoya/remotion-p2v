"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/src/lib/storyflow/utils";
import { Project } from "@/src/lib/storyflow/types";
import { useToast } from "@/components/ui/toast-provider";

export function ProjectCard({ project }: { project: Project }) {
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleDelete = () => {
    setError(null);
    const confirmed = window.confirm(
      `Delete project “${project.name}”? This removes its assets directory.`
    );
    if (!confirmed) return;

    startDelete(async () => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to delete");
        return;
      }
      toast({
        title: "Project deleted",
        description: `${project.name} was removed.`,
        variant: "success",
      });
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-lg font-semibold text-white hover:text-brand-500"
          >
            {project.name}
          </Link>
          <div className="text-xs text-slate-400">
            Created {formatDate(project.createdAt)}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-red-300 disabled:opacity-50"
          aria-label="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge status={project.status} />
        <span className="text-xs text-slate-400">{project.aspectRatio}</span>
      </div>
      {project.topic && (
        <div className="mt-2 text-sm text-slate-300 line-clamp-2">
          {project.topic}
        </div>
      )}
      {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
    </div>
  );
}
