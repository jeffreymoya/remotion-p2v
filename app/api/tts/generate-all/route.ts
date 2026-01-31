import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, parseQuery, withErrorHandler, withStreamErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";
import { ScriptSegment } from "@/src/lib/storyflow/types";
import { generateAudioForSegment } from "@/src/lib/storyflow/tts";

const requestSchema = z.object({
  projectId: z.string().min(1),
  force: z.boolean().optional(),
  stream: z.boolean().optional(), // Enable SSE streaming for progress updates
});

const querySchema = z.object({
  projectId: z.string().min(1),
  force: z.enum(["true", "false"]).optional(),
  stream: z.enum(["true", "false"]).optional(),
});

/**
 * Helper to create SSE-formatted message
 */
function sseMessage(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * GET endpoint for SSE streaming (EventSource only supports GET)
 */
export const GET = withStreamErrorHandler(async (req: Request) => {
  const parsed = parseQuery(req, querySchema);
  const projectId = parsed.projectId;
  const force = parsed.force === "true";
  const stream = parsed.stream === "true";

  return handleTTSGeneration(projectId, force, stream);
}, "tts/generate-all");

/**
 * POST endpoint for programmatic use
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, force = false, stream = false } = await parseBody(req, requestSchema);

  return handleTTSGeneration(projectId, force, stream);
}, "tts/generate-all");

/**
 * Shared handler for both GET and POST
 */
async function handleTTSGeneration(
  projectId: string,
  force: boolean,
  stream: boolean
): Promise<Response> {
  const script = await storyflowPrisma.script.findByProjectIdOrThrow(projectId);

  let segments = fromJsonArray<ScriptSegment>(script.segments);

  // If streaming is enabled, use SSE
  if (stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const results: { segmentIndex: number; audioUrl: string; duration: number }[] = [];
        const total = segments.filter((seg) => !seg.audioUrl || force).length;
        let completed = 0;

        try {
          // Send initial progress
          controller.enqueue(
            encoder.encode(
              sseMessage({
                type: "progress",
                completed: 0,
                total,
                message: "Starting TTS generation...",
              })
            )
          );

          for (const seg of segments) {
            if (seg.audioUrl && !force) {
              continue;
            }

            // Send segment start event
            controller.enqueue(
              encoder.encode(
                sseMessage({
                  type: "segment-start",
                  segmentIndex: seg.index,
                  text: seg.text.substring(0, 50) + "...",
                })
              )
            );

            try {
              const result = await generateAudioForSegment(projectId, seg);
              segments = segments.map((s) =>
                s.index === seg.index
                  ? {
                      ...s,
                      audioUrl: result.audioUrl,
                      actualDuration: Number((result.durationMs / 1000).toFixed(2)),
                      timestamps: result.timestamps,
                    }
                  : s
              );

              results.push({
                segmentIndex: seg.index,
                audioUrl: result.audioUrl,
                duration: result.durationMs / 1000,
              });

              completed++;

              // Send segment complete event
              controller.enqueue(
                encoder.encode(
                  sseMessage({
                    type: "segment-complete",
                    segmentIndex: seg.index,
                    audioUrl: result.audioUrl,
                    duration: result.durationMs / 1000,
                  })
                )
              );

              // Send progress update
              controller.enqueue(
                encoder.encode(
                  sseMessage({
                    type: "progress",
                    completed,
                    total,
                    message: `Generated ${completed} of ${total} segments`,
                  })
                )
              );
            } catch (error) {
              console.error(`[tts/generate-all] failed on segment ${seg.index}`, error);
              controller.enqueue(
                encoder.encode(
                  sseMessage({
                    type: "error",
                    segmentIndex: seg.index,
                    message: (error as Error).message ?? "TTS generation failed",
                  })
                )
              );
              break;
            }
          }

          // Update database
          await storyflowPrisma.script.update({
            where: { projectId },
            data: { segments: toJsonArray(segments), updatedAt: new Date() },
          });

          // Send completion event
          controller.enqueue(
            encoder.encode(
              sseMessage({
                type: "complete",
                generated: results.length,
                total: segments.length,
              })
            )
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              sseMessage({
                type: "error",
                message: (error as Error).message ?? "Unexpected error",
              })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming mode (original behavior)
  const results: { segmentIndex: number; audioUrl: string; duration: number }[] = [];

  for (const seg of segments) {
    if (seg.audioUrl && !force) {
      continue;
    }
    const result = await generateAudioForSegment(projectId, seg);
    segments = segments.map((s) =>
      s.index === seg.index
        ? {
            ...s,
            audioUrl: result.audioUrl,
            actualDuration: Number((result.durationMs / 1000).toFixed(2)),
            timestamps: result.timestamps,
          }
        : s
    );

    results.push({
      segmentIndex: seg.index,
      audioUrl: result.audioUrl,
      duration: result.durationMs / 1000,
    });
  }

  const updatedScript = await storyflowPrisma.script.update({
    where: { projectId },
    data: { segments: toJsonArray(segments), updatedAt: new Date() },
  });

  return NextResponse.json({
    script: updatedScript,
    results,
    generated: results.length,
    total: segments.length,
  });
}
