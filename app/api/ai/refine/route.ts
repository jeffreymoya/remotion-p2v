import { NextResponse } from "next/server";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { refineTopicPrompt, RefinePromptVariables } from "@/config/prompts";
import { getSettings } from "@/src/lib/storyflow/settings";
import { parseGeminiOutputWithSchema } from "@/src/lib/storyflow/gemini-parser";

const execFileAsync = promisify(execFile);

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
  vars: RefinePromptVariables
): Promise<RefinementResponse> {
  const settings = await getSettings();
  const model = settings.ai.model || "gemini-2.5-pro";

  const prompt = refineTopicPrompt(vars);

  const args = [
    "--yolo",
    "--model",
    model,
    "--output-format",
    "json",
    prompt,
  ];

  const { stdout, stderr } = await execFileAsync("gemini", args, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 60000,
  });

  if (stderr) {
    console.warn("[refineTopicWithGemini] stderr:", stderr);
  }

  return parseGeminiOutputWithSchema(stdout, refinementResponseSchema);
}

export async function POST(req: Request) {
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
    const refinement = await refineTopicWithGemini({
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
    console.error("[api/ai/refine] Error refining topic:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to refine topic";

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
}
