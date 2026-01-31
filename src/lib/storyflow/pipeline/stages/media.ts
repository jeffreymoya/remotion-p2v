import { ConflictError, NotFoundError } from "@/app/api/lib";
import { runStage } from "@/src/lib/storyflow/pipeline/runner";
import type {
  PipelineStage,
  PipelineStageOptions,
} from "@/src/lib/storyflow/pipeline/types";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { ProjectStatus } from "@/src/lib/storyflow/types";

type MediaStageInput = { projectId: string; projectStatus: ProjectStatus; assetCount: number };
type MediaStageOptions = PipelineStageOptions;

export const mediaStage = {
  id: "media",
  requiredStatus: "SCRIPT_READY",
  allowedStatuses: ["SCRIPT_READY", "ASSETS_READY", "BOARDS_READY", "VIEWPORT_READY", "RENDER_READY", "COMPLETED"],
  targetStatus: "ASSETS_READY",
  async prepare(projectId: string): Promise<MediaStageInput> {
    const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
      select: { status: true, script: true },
    });

    if (!project.script) {
      throw new NotFoundError("Script", projectId);
    }

    const assetCount = await storyflowPrisma.asset.count({
      where: { projectId },
    });

    if (assetCount === 0) {
      throw new ConflictError("Upload or import assets before marking Media complete.");
    }

    return { projectId, projectStatus: project.status, assetCount };
  },
  async execute(input: MediaStageInput, options?: MediaStageOptions): Promise<MediaStageInput> {
    options?.onProgress?.(1);
    return input;
  },
  async commit(projectId: string, _output: MediaStageInput, input?: MediaStageInput) {
    const priorStatus = input?.projectStatus;
    if (priorStatus && ["BOARDS_READY", "VIEWPORT_READY", "RENDER_READY", "RENDERING", "COMPLETED"].includes(priorStatus)) {
      return;
    }

    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { status: "ASSETS_READY" },
    });
  },
} satisfies PipelineStage<MediaStageInput, MediaStageInput, MediaStageOptions>;

export function runMediaStage(projectId: string, options?: MediaStageOptions) {
  return runStage(mediaStage, projectId, options);
}
