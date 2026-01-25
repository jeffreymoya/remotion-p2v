import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { refineTopicPrompt, RefinePromptVariables } from "@/config/prompts";
import { getSettings } from "@/src/lib/storyflow/settings";
import { parseGeminiOutputWithSchema } from "@/src/lib/storyflow/gemini-parser";
import { geminiCall } from "@/src/lib/services/ai";
import { aiLogger } from "@/src/lib/logger";
import { withLogging } from "@/src/lib/api-logger";

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

  const { rawResponse } = await geminiCall<Record<string, unknown>>(
    {
      projectId,
      operation: "refine-topic",
      metadata: { title: vars.title },
    },
    prompt,
    { model }
  );

  return parseGeminiOutputWithSchema(rawResponse!, refinementResponseSchema);
}

export const POST = withLogging(async (req: Request) => {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const {
    projectId,
    title,
    description,
    category,
    targetAudience,
    minDuration,
    maxDuration,
  } = parsed.data;

  const project = await storyflowPrisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: "PROJECT_NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const refinement = await refineTopicWithGemini(projectId, {
      title,
      description,
      category,
      targetAudience: targetAudience!,
      minDuration: minDuration!,
      maxDuration: maxDuration!,
    });

    // Store refinement data in project metadata
    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: {
        topic: refinement.refinedTitle,
        metadata: {
          ...(project.metadata as object),
          refinement: {
            originalTitle: title,
            originalDescription: description,
            ...refinement,
            refinedAt: new Date().toISOString(),
          },
        },
      },
    });

    return NextResponse.json(refinement);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to refine topic";

    aiLogger.error({ projectId, title, error: errorMessage }, "Failed to refine topic");

    if (errorMessage.includes("ENOENT") || errorMessage.includes("gemini")) {
      return NextResponse.json(
        {
          error: "Gemini CLI not available",
          code: "GEMINI_CLI_NOT_AVAILABLE",
          details: "Please ensure gemini CLI is installed and in PATH",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to refine topic", code: "REFINEMENT_FAILED" },
      { status: 500 }
    );
  }
});
