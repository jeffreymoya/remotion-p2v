"use client";

import { useState } from "react";
import { Blueprint, BeatReviewInput, Beat } from "@/src/lib/storyflow/script-builder-types";
import { BlueprintBeatCard } from "./blueprint-beat-card";
import { useToast } from "@/components/ui/toast-provider";
import { RotateCcw, CheckCircle } from "lucide-react";

interface BlueprintReviewProps {
  blueprint: Blueprint;
  onApproved: () => void;
  onRegenerate: () => void;
}

export function BlueprintReview({
  blueprint,
  onApproved,
  onRegenerate,
}: BlueprintReviewProps) {
  const [loading, setLoading] = useState(false);
  const [beatReviews, setBeatReviews] = useState<Map<number, BeatReviewInput>>(new Map());
  const toast = useToast();

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

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      // Mark all beats as approved
      const reviews: BeatReviewInput[] = blueprint.beats.map((beat) => ({
        beatIndex: beat.index,
        status: "approved" as const,
      }));

      const res = await fetch(`/api/script-builder/blueprint/${blueprint.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: body.error || "Failed to approve blueprint", variant: "error" });
        return;
      }

      const { blueprint: updated, requiresRegeneration } = await res.json();
      toast({ title: "Blueprint approved", variant: "success" });

      if (!requiresRegeneration) {
        onApproved();
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Network error approving blueprint", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReviews = async () => {
    if (beatReviews.size === 0) {
      toast({ title: "Please review at least one beat", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const reviews = Array.from(beatReviews.values());
      const res = await fetch(`/api/script-builder/blueprint/${blueprint.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: body.error || "Failed to submit reviews", variant: "error" });
        return;
      }

      const { blueprint: updated, requiresRegeneration } = await res.json();
      toast({ title: "Reviews submitted", variant: "success" });

      if (requiresRegeneration) {
        onRegenerate();
      } else {
        onApproved();
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Network error submitting reviews", variant: "error" });
    } finally {
      setLoading(false);
    }
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
            disabled={loading || allApproved}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="h-4 w-4" />
            Approve All
          </button>
          <button
            onClick={onRegenerate}
            disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
            />
          );
        })}
      </div>
    </div>
  );
}
