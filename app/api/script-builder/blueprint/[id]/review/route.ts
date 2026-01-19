import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";
import { type Beat } from "@/src/lib/storyflow/script-builder";

const beatReviewSchema = z.object({
  beatIndex: z.number().int(), // Use index instead of ID
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

const requestSchema = z.object({
  reviews: z.array(beatReviewSchema),
});

/**
 * PUT /api/script-builder/blueprint/[id]/review
 * Submit per-beat reviews for a blueprint
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { reviews } = parsed.data;

  try {
    // Find blueprint
    const blueprint = await storyflowPrisma.blueprint.findUnique({
      where: { id },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    // Get beats from blueprint
    const beats = blueprint.beats as Beat[];

    // Create a map of reviews by beatIndex
    const reviewMap = new Map(reviews.map(r => [r.beatIndex, r]));

    // Check if any beats are rejected
    const hasRejections = reviews.some(r => r.status === "rejected");

    // Collect rejection notes for regeneration
    const rejectionNotes: string[] = [];

    // Update beat review status in the beats array
    const updatedBeats = beats.map(beat => {
      const review = reviewMap.get(beat.index);
      if (review) {
        const updatedBeat = {
          ...beat,
          reviewStatus: review.status,
          reviewNotes: review.notes,
        };

        // Collect rejection notes
        if (review.status === "rejected" && review.notes) {
          rejectionNotes.push(`Beat ${beat.index} (${beat.title}): ${review.notes}`);
        }

        return updatedBeat;
      }
      return beat;
    });

    // Determine new blueprint status
    const allApproved = reviews.every(r => r.status === "approved") &&
                        reviews.length === beats.length;
    const newStatus = hasRejections
      ? "REJECTED"
      : allApproved
        ? "APPROVED"
        : "PENDING_REVIEW";

    // Update blueprint with reviewed beats and status
    const updated = await storyflowPrisma.blueprint.update({
      where: { id },
      data: {
        beats: updatedBeats,
        status: newStatus,
        rejectionNotes: rejectionNotes.length > 0
          ? rejectionNotes.join("\n\n")
          : null,
        updatedAt: new Date(),
      },
    });

    await recordBlueprintHistory(updated, "reviewed");

    return NextResponse.json({
      blueprint: updated,
      requiresRegeneration: hasRejections,
      message: hasRejections
        ? "Blueprint has rejections. Please regenerate."
        : allApproved
          ? "Blueprint fully approved"
          : "Review saved",
    });
  } catch (error) {
    console.error("[api/script-builder/blueprint/review] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit review",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
