import fs from "node:fs/promises";
import path from "node:path";

import {
  animationPlanSchema,
  type AnimationPlan,
} from "@/src/components/prompt-to-video/schema";

import type { AnimationPlanWriteResult } from "./types";

const PUBLIC_GENERATED_ROOT = path.join(
  "public",
  "generated",
  "prompt-to-video"
);

function normalizeElementTimelines(
  rawPlan: AnimationPlan
): AnimationPlan {
  const normalizedScenes = rawPlan.scenes.map((scene) => {
    const normalizedElements = scene.elements.map((element) => {
      let cumulativeFrame = 0;
      const normalizedOps = element.ops.map((op, index) => {
        const startFrame = cumulativeFrame;
        const opWithFrame = { ...op, startFrame };
        cumulativeFrame += op.durationFrames;
        if (index === element.ops.length - 1) {
          return { ...opWithFrame, startFrame };
        }
        return opWithFrame;
      });
      return { ...element, ops: normalizedOps };
    });

    const totalFrames = Math.max(
      ...normalizedElements.map((el) =>
        el.ops.reduce((sum, op) => sum + op.durationFrames, 0)
      )
    );

    return { ...scene, elements: normalizedElements, totalFrames };
  });

  return { ...rawPlan, scenes: normalizedScenes };
}

export function parseAnimationPlan(
  raw: string,
  runId: string
): AnimationPlan {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Stage 6: failed to parse animation plan JSON. Raw: ${cleaned.substring(0, 200)}`
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stage 6: animation plan must be a JSON object");
  }

  const rawObj = parsed as Record<string, unknown>;
  if (!Array.isArray(rawObj.scenes) || rawObj.scenes.length === 0) {
    throw new Error("Stage 6: animation plan must include a non-empty scenes array");
  }

  const plan: AnimationPlan = {
    runId,
    generatedAt: new Date().toISOString(),
    scenes: rawObj.scenes as AnimationPlan["scenes"],
  };

  const validated = animationPlanSchema.parse(plan);
  return normalizeElementTimelines(validated);
}

export async function writeAnimationPlanArtifacts(
  plan: AnimationPlan,
  runId: string
): Promise<AnimationPlanWriteResult> {
  const runDir = path.join(PUBLIC_GENERATED_ROOT, runId);
  await fs.mkdir(runDir, { recursive: true });

  const planPath = path.join(runDir, "animation-plan.json");
  await fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf-8");

  return { plan, planPath };
}
