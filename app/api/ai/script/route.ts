import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { generateScriptFromGemini } from "@/src/lib/storyflow/ai";
import { generateDemoScript, saveScript } from "@/src/lib/storyflow/scripts";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  topic: z.string().min(1).max(500),
  regenerate: z.boolean().optional(),
});

export async function POST(req: Request) {
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
      scriptPayload = await generateScriptFromGemini(topic);
    } catch (error) {
      console.warn(
        "[api/ai/script] Gemini generation failed, returning demo script:",
        (error as Error).message
      );
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
    console.error("[api/ai/script] Error generating script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
