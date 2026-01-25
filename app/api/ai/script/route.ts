import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { generateScriptFromGemini } from "@/src/lib/storyflow/ai";
import { generateDemoScript, saveScript } from "@/src/lib/storyflow/scripts";
import { aiLogger } from "@/src/lib/logger";
import { withLogging } from "@/src/lib/api-logger";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  topic: z.string().min(1).max(500),
  regenerate: z.boolean().optional(),
});

export const POST = withLogging(async (req: Request) => {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { projectId, topic } = parsed.data;

  const project = await storyflowPrisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
});
