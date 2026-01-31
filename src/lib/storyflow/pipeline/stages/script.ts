import { ConflictError, NotFoundError } from "@/app/api/lib";
import { runStage } from "@/src/lib/storyflow/pipeline/runner";
import type {
  PipelineStage,
  PipelineStageOptions,
} from "@/src/lib/storyflow/pipeline/types";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { ProjectStatus } from "@/src/lib/storyflow/types";

type ScriptStageInput = { projectId: string; projectStatus: ProjectStatus; segmentCount: number };
type ScriptStageOptions = PipelineStageOptions;

export const scriptStage = {
  id: "script",
  requiredStatus: "DRAFT",
  allowedStatuses: ["DRAFT", "SCRIPT_READY", "ASSETS_READY", "BOARDS_READY", "RENDER_READY", "COMPLETED"],
  targetStatus: "SCRIPT_READY",
  async prepare(projectId: string): Promise<ScriptStageInput> {
    const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
      select: { status: true, script: true },
    });

    if (!project.script) {
      throw new NotFoundError("Script", projectId);
    }

    const segments = (project.script.segments as unknown[]) ?? [];
    if (segments.length === 0) {
      throw new ConflictError("Script has no segments. Generate a script before completing this stage.");
    }

    return { projectId, projectStatus: project.status, segmentCount: segments.length };
  },
  async execute(input: ScriptStageInput, options?: ScriptStageOptions): Promise<ScriptStageInput> {
    options?.onProgress?.(1);
    return input;
  },
  async commit(projectId: string, _output: ScriptStageInput, input?: ScriptStageInput) {
    const priorStatus = input?.projectStatus;
    if (priorStatus && ["ASSETS_READY", "BOARDS_READY", "VIEWPORT_READY", "RENDER_READY", "RENDERING", "COMPLETED"].includes(priorStatus)) {
      return;
    }

    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { status: "SCRIPT_READY" },
    });
  },
} satisfies PipelineStage<ScriptStageInput, ScriptStageInput, ScriptStageOptions>;

export function runScriptStage(projectId: string, options?: ScriptStageOptions) {
  return runStage(scriptStage, projectId, options);
}
