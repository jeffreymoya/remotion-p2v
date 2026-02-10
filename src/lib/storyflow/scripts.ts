import { z } from "zod";
import { storyflowPrisma } from "./prisma";
import { Script } from "./types";
import { transitionProjectStatus } from "./status-machine";

export const scriptSegmentSchema = z.object({
  index: z.number(),
  text: z.string(),
  wordCount: z.number().optional(),
  estimatedDuration: z.number().optional(),
  audioUrl: z.string().optional(),
  actualDuration: z.number().optional(),
  timestamps: z
    .array(
      z.object({
        word: z.string(),
        startMs: z.number(),
        endMs: z.number(),
      })
    )
    .optional(),
});

export const scriptSchema = z.object({
  title: z.string(),
  segments: z.array(scriptSegmentSchema),
});

export type ScriptPayload = z.infer<typeof scriptSchema>;

export async function getScript(projectId: string): Promise<Script | null> {
  return storyflowPrisma.script.findUnique({
    where: { projectId },
  }) as unknown as Script | null;
}

export async function saveScript(projectId: string, payload: ScriptPayload) {
  const parsed = scriptSchema.parse(payload);

  const script = await storyflowPrisma.script.upsert({
    where: { projectId },
    update: {
      title: parsed.title,
      segments: parsed.segments,
      updatedAt: new Date(),
    },
    create: {
      projectId,
      title: parsed.title,
      segments: parsed.segments,
    },
  });

  await transitionProjectStatus(projectId, "SCRIPT_READY");

  return script as unknown as Script;
}

// Very lightweight deterministic generator to unblock UI.
export function generateDemoScript(topic: string): ScriptPayload {
  const baseSegments = [
    "Hook the viewer with a bold statement about the topic.",
    "Explain why this topic matters right now.",
    "Share the first key insight with a concrete example.",
    "Layer in a surprising or counterintuitive fact.",
    "Offer a short story that illustrates the impact.",
    "Describe the challenge or tension that remains.",
    "Lay out a simple 3-step takeaway the viewer can remember.",
    "End with a forward-looking thought that invites action.",
  ];

  const segments = baseSegments.map((text, idx) => {
    const combined = `${text} (Topic: ${topic}).`;
    const words = combined.split(/\s+/).length;
    const estimatedDuration = Math.round((words / 140) * 60); // seconds at ~140 wpm
    return {
      index: idx + 1,
      text: combined,
      wordCount: words,
      estimatedDuration,
    };
  });

  return {
    title: `${topic} — StoryFlow Outline`,
    segments,
  };
}
