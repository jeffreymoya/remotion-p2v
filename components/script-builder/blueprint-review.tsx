"use client";

import { useState } from "react";
import { Blueprint, BeatReviewInput, Beat } from "@/src/lib/storyflow/script-builder-types";
import { BlueprintBeatCard } from "./blueprint-beat-card";
import { useToast } from "@/components/ui/toast-provider";
import { RotateCcw, CheckCircle } from "lucide-react";
import { useReviewBlueprint } from "@/src/hooks/queries/use-execution-status";
import { useBackgroundTask } from "@/src/hooks/use-background-task";

interface BlueprintReviewProps {
  projectId: string;
  blueprint: Blueprint;
  onApproved: () => void;
  onRegenerate: () => void;
}

export function BlueprintReview({
  projectId,
  blueprint,
  onApproved,
  onRegenerate,
}: BlueprintReviewProps) {
  const [beatReviews, setBeatReviews] = useState<Map<number, BeatReviewInput>>(new Map());
  const toast = useToast();
  const { isTaskRunning } = useBackgroundTask();
  const reviewMutation = useReviewBlueprint();

  const handleApprove = (beatIndex: number) => {
    setBeatReviews((prev) => {
      const next = new Map(prev);
      next.set(beatIndex, { beatIndex, status: "approved" });
      return next;
    });
  };

  const handleReject = (beatIndex: number, notes?: string) => {
    setBeatReviews((prev) => {
      const next = new Map(prev);
      next.set(beatIndex, { beatIndex, status: "rejected", notes });
      return next;
    });
  };

  const handleApproveAll = () => {
    // Mark all beats as approved
    const reviews: BeatReviewInput[] = blueprint.beats.map((beat) => ({
      beatIndex: beat.index,
      status: "approved" as const,
    }));

    reviewMutation.mutate(
      { blueprintId: blueprint.id, reviews },
      {
        onSuccess: (data) => {
          toast({ title: "Blueprint approved", variant: "success" });
          if (!data.requiresRegeneration) {
            onApproved();
          }
        },
        onError: (error) => {
          toast({ title: error.message || "Failed to approve blueprint", variant: "error" });
        },
      }
    );
  };

  const handleSubmitReviews = () => {
    if (beatReviews.size === 0) {
      toast({ title: "Please review at least one beat", variant: "error" });
      return;
    }

    const reviews = Array.from(beatReviews.values());
    reviewMutation.mutate(
      { blueprintId: blueprint.id, reviews },
      {
        onSuccess: (data) => {
          toast({ title: "Reviews submitted", variant: "success" });
          if (data.requiresRegeneration) {
            onRegenerate();
          } else {
            onApproved();
          }
        },
        onError: (error) => {
          toast({ title: error.message || "Failed to submit reviews", variant: "error" });
        },
      }
    );
  };

  const totalDuration = blueprint.beats.reduce(
    (sum, beat) => sum + beat.estimatedDurationMs,
    0
  );

  const formatTotalDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  };

  const approvedCount = blueprint.beats.filter((b) => {
    const review = beatReviews.get(b.index);
    const status = review?.status ?? b.reviewStatus ?? "pending";
    return status === "approved";
  }).length;

  const allApproved = approvedCount === blueprint.beats.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Blueprint Review</h2>
          <p className="text-sm text-slate-400">
            {blueprint.beats.length} beats · {formatTotalDuration(totalDuration)} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApproveAll}
            disabled={reviewMutation.isPending || allApproved}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="h-4 w-4" />
            Approve All
          </button>
          <button
            onClick={onRegenerate}
            disabled={reviewMutation.isPending || isTaskRunning("blueprint-regeneration", projectId)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Regenerate Blueprint
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      {beatReviews.size > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {approvedCount} / {blueprint.beats.length} beats reviewed
            </span>
            {!allApproved && (
              <button
                onClick={handleSubmitReviews}
                disabled={reviewMutation.isPending}
                className="text-brand-400 hover:text-brand-300 disabled:opacity-60"
              >
                Submit Reviews
              </button>
            )}
          </div>
        </div>
      )}

      {/* Beat Cards */}
      <div className="space-y-4">
        {blueprint.beats.map((beat) => {
          const review = beatReviews.get(beat.index);
          const baseBeat: Beat = {
            ...beat,
            reviewStatus: beat.reviewStatus ?? "pending",
            reviewNotes: beat.reviewNotes ?? undefined,
          };

          const effectiveBeat: Beat = review
            ? {
                ...baseBeat,
                reviewStatus: review.status as Beat["reviewStatus"],
                reviewNotes: review.notes,
              }
            : baseBeat;

          return (
            <BlueprintBeatCard
              key={beat.index}
              beat={effectiveBeat}
              onApprove={handleApprove}
              onReject={handleReject}
              disabled={reviewMutation.isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
