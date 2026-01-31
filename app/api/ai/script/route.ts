import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { aiLogger } from "@/src/lib/logger";
import { generateScriptFromGemini } from "@/src/lib/storyflow/ai";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { generateDemoScript, saveScript } from "@/src/lib/storyflow/scripts";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  topic: z.string().min(1).max(500),
  regenerate: z.boolean().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, topic } = await parseBody(req, requestSchema);

  const project = await storyflowPrisma.project.findByIdOrThrow(projectId);

  try {
    let scriptPayload = null;

    try {
      scriptPayload = await generateScriptFromGemini(projectId, topic);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      aiLogger.warn({ projectId, topic, error: errorMsg }, "Gemini generation failed, returning demo script");
      scriptPayload = generateDemoScript(topic);
    }

    const script = await saveScript(projectId, scriptPayload);

    if (topic !== project.topic) {
      await storyflowPrisma.project.update({
        where: { id: projectId },
        data: { topic },
      });
    }

    return NextResponse.json({ script });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    aiLogger.error({ projectId, topic, error: errorMsg }, "Failed to generate script");
    throw error;
  }
}, "api/ai/script");
