import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { segmentScript, type Beat } from "@/src/lib/storyflow/script-builder";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";

const requestSchema = z.object({
  draftId: z.string().min(1, "draftId is required"),
});

/**
 * POST /api/script-builder/segment
 * Create final TTS-optimized segments from completed draft
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { draftId } = parsed.data;

  try {
    // Find completed script draft
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      include: {
        blueprint: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    const allowedStatuses = ["GLUING", "POLISHING", "COMPLETED"] as const;
    if (!allowedStatuses.includes(scriptDraft.status as typeof allowedStatuses[number])) {
      return NextResponse.json(
        { error: "Script draft must finish execution or glue before segmentation" },
        { status: 400 }
      );
    }

    if (!scriptDraft.polishedText) {
      return NextResponse.json(
        { error: "Script draft has no polished text" },
        { status: 400 }
      );
    }

    const beats = scriptDraft.blueprint.beats as Beat[];

    // Segment the script
    const segmentData = await segmentScript(
      scriptDraft.blueprint.projectId,
      scriptDraft.polishedText,
      beats
    );

    // Calculate estimated duration for each segment (140 WPM)
    const segments = segmentData.segments.map((seg) => ({
      index: seg.index,
      text: seg.text,
      wordCount: seg.wordCount,
      estimatedDuration: Math.round((seg.wordCount / 140) * 60), // seconds
      audioUrl: null,
      actualDuration: null,
      timestamps: null,
    }));

    // Create or update Script record
    const existingScript = await storyflowPrisma.script.findUnique({
      where: { projectId: scriptDraft.blueprint.projectId },
    });

    let script;
    if (existingScript) {
      script = await storyflowPrisma.script.update({
        where: { id: existingScript.id },
        data: {
          blueprintId: scriptDraft.blueprintId,
          title: `${scriptDraft.blueprint.project.topic || "Untitled"} — Script Builder`,
          segments,
          updatedAt: new Date(),
        },
      });
    } else {
      script = await storyflowPrisma.script.create({
        data: {
          projectId: scriptDraft.blueprint.projectId,
          blueprintId: scriptDraft.blueprintId,
          title: `${scriptDraft.blueprint.project.topic || "Untitled"} — Script Builder`,
          segments,
        },
      });
    }

    const completedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: scriptDraft.id },
      data: {
        status: "COMPLETED",
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(completedDraft, "segmented");

    return NextResponse.json({
      script,
      message: `Script segmented into ${segments.length} segments`,
    });
  } catch (error) {
    console.error("[api/script-builder/segment] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to segment script",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
