"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/src/lib/storyflow/utils";
import { Project } from "@/src/lib/storyflow/types";
import { useToast } from "@/components/ui/toast-provider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { useDeleteProject } from "@/src/hooks/queries/use-projects";

export function ProjectCard({ project }: { project: Project }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const deleteMutation = useDeleteProject();

  const performDelete = () => {
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        toast({
          title: "Project deleted",
          description: `${project.name} was removed.`,
          variant: "success",
        });
        window.location.reload();
      },
      onError: (error) => {
        toast({
          title: "Delete failed",
          description: error.message || "Failed to delete project",
          variant: "error",
        });
      },
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
        <Dialog open={confirmOpen} onOpenChange={(open) => !deleteMutation.isPending && setConfirmOpen(open)}>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleteMutation.isPending}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-red-300 disabled:opacity-50"
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-400">
              Delete "{project.name}"? This removes its assets directory. This action cannot be undone.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setConfirmOpen(false);
                  performDelete();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      {deleteMutation.error && (
        <div className="mt-3">
          <InlineError
            title="Could not delete project"
            message={deleteMutation.error.message}
            suggestions={[
              "Check your connection and try again.",
              "Make sure the project still exists and you have permission to delete it.",
            ]}
            retryLabel="Retry delete"
            onRetry={performDelete}
          />
        </div>
      )}
    </div>
  );
}
