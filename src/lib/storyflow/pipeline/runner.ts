import { ConflictError } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { PipelineStage } from "@/src/lib/storyflow/pipeline/types";

/**
 * Run a pipeline stage with standard gating and status transitions.
 * Does not mutate stage implementations; it simply orchestrates prepare/execute/commit.
 */
export async function runStage<I, O, Opt extends Parameters<PipelineStage<I, O>["execute"]>[1]>(
  stage: PipelineStage<I, O, Opt>,
  projectId: string,
  options?: Opt
): Promise<O> {
  const project = await storyflowPrisma.project.findByIdOrThrow(projectId);

  const allowed = stage.allowedStatuses ?? [stage.requiredStatus];
  if (!allowed.includes(project.status)) {
    throw new ConflictError(
      `Stage "${stage.id}" requires status ${allowed.join(", ")}, got ${project.status}`
    );
  }

  const input = await stage.prepare(projectId);
  const output = await stage.execute(input, options);
  await stage.commit(projectId, output, input);

  return output;
}
