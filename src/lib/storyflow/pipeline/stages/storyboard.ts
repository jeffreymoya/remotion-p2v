import { ConflictError, NotFoundError } from "@/app/api/lib";
import { runStage } from "@/src/lib/storyflow/pipeline/runner";
import type {
  PipelineStage,
  PipelineStageOptions,
} from "@/src/lib/storyflow/pipeline/types";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { ProjectStatus } from "@/src/lib/storyflow/types";

type StoryboardStageInput = {
  projectId: string;
  projectStatus: ProjectStatus;
  boardCount: number;
};

type StoryboardStageOptions = PipelineStageOptions;

export const storyboardStage = {
  id: "storyboard",
  requiredStatus: "ASSETS_READY",
  allowedStatuses: ["ASSETS_READY", "BOARDS_READY", "VIEWPORT_READY", "RENDER_READY", "COMPLETED"],
  targetStatus: "BOARDS_READY",
  async prepare(projectId: string): Promise<StoryboardStageInput> {
    const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
      include: { script: true, boards: true },
    });

    if (!project.script) {
      throw new NotFoundError("Script", projectId);
    }

    const boards = project.boards ?? [];
    if (boards.length === 0) {
      throw new ConflictError("No boards found. Generate boards before running storyboard stage.");
    }

    const missingRegions = boards.filter((b) => !b.regions).map((b) => b.id);
    if (missingRegions.length) {
      throw new ConflictError(
        `Boards missing regions: ${missingRegions.join(", ")}. Generate regions before progressing.`
      );
    }

    return { projectId, projectStatus: project.status, boardCount: boards.length };
  },
  async execute(
    input: StoryboardStageInput,
    options?: StoryboardStageOptions
  ): Promise<StoryboardStageInput> {
    options?.onProgress?.(1);
    return input;
  },
  async commit(projectId: string, _output: StoryboardStageInput, input?: StoryboardStageInput) {
    const priorStatus = input?.projectStatus;
    if (priorStatus && ["RENDER_READY", "RENDERING", "COMPLETED"].includes(priorStatus)) {
      return;
    }

    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { status: "BOARDS_READY" },
    });
  },
} satisfies PipelineStage<StoryboardStageInput, StoryboardStageInput, StoryboardStageOptions>;

export function runStoryboardStage(projectId: string, options?: StoryboardStageOptions) {
  return runStage(storyboardStage, projectId, options);
}
