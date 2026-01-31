import { NextResponse } from "next/server";
import { z } from "zod";

import { refineTopicPrompt, RefinePromptVariables } from "@/config/prompts";
import { parseBody, withErrorHandler, ServiceUnavailableError } from "@/app/api/lib";
import { aiLogger } from "@/src/lib/logger";
import { aiGenerate } from "@/src/lib/services/ai";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { getSettings } from "@/src/lib/storyflow/settings";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  title: z.string().min(1, "title is required").max(500),
  description: z.string().optional(),
  category: z.string().optional(),
  targetAudience: z.string().optional().default("ages 20-40"),
  minDuration: z.number().optional().default(60),
  maxDuration: z.number().optional().default(600),
});

const refinementResponseSchema = z.object({
  refinedTitle: z.string(),
  refinedDescription: z.string(),
  targetAudience: z.string(),
  keyAngles: z.array(z.string()).min(3).max(5),
  hooks: z.array(z.string()).min(2).max(3),
  suggestedDuration: z.number(),
  reasoning: z.string(),
});

export type RefinementResponse = z.infer<typeof refinementResponseSchema>;

async function refineTopicWithGemini(
  projectId: string,
  vars: RefinePromptVariables
): Promise<RefinementResponse> {
  const settings = await getSettings();
  const model = settings.ai.proModel;

  const prompt = refineTopicPrompt(vars);

  const { data } = await aiGenerate<z.infer<typeof refinementResponseSchema>>({
    projectId,
    operation: "refine-topic",
    prompt,
    model,
    outputFormat: "json",
    schema: refinementResponseSchema,
    metadata: { title: vars.title },
  });

  return data;
}

export const POST = withErrorHandler(async (req: Request) => {
  const {
    projectId,
    title,
    description,
    category,
    targetAudience,
    minDuration,
    maxDuration,
  } = await parseBody(req, requestSchema);

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  try {
    const refinement = await refineTopicWithGemini(projectId, {
      title,
      description,
      category,
      targetAudience: targetAudience!,
      minDuration: minDuration!,
      maxDuration: maxDuration!,
    });

    // Store refinement data in project
    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: {
        topic: refinement.refinedTitle,
      },
    });

    return NextResponse.json(refinement);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to refine topic";

    aiLogger.error({ projectId, title, error: errorMessage }, "Failed to refine topic");

    if (errorMessage.includes("ENOENT") || errorMessage.includes("gemini")) {
      throw new ServiceUnavailableError("Gemini CLI", errorMessage);
    }

    throw error;
  }
}, "api/ai/refine");
