import { access, writeFile } from "fs/promises";

import { NotFoundError } from "@/app/api/lib";
import { ensureProjectDirs, getProjectPaths } from "@/src/lib/paths";
import { runStage } from "@/src/lib/storyflow/pipeline/runner";
import type {
  PipelineStage,
  PipelineStageOptions,
} from "@/src/lib/storyflow/pipeline/types";
import { buildTimeline } from "@/src/lib/storyflow/timeline-builder";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { ProjectStatus, Timeline } from "@/src/lib/storyflow/types";
import { transitionProjectStatus } from "@/src/lib/storyflow/status-machine";

type BuildStageOptions = PipelineStageOptions;

type BuildStageInput = {
  projectId: string;
  projectStatus: ProjectStatus;
};

async function ensureViewportExists(projectId: string) {
  const paths = getProjectPaths(projectId);
  try {
    await access(paths.viewport);
  } catch {
    throw new NotFoundError("Viewport", projectId);
  }
}

export const buildStage = {
  id: "build",
  requiredStatus: "BOARDS_READY",
  allowedStatuses: ["BOARDS_READY", "VIEWPORT_READY", "RENDER_READY", "COMPLETED"],
  targetStatus: "RENDER_READY",
  async prepare(projectId: string): Promise<BuildStageInput> {
    const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
      select: { status: true },
    });

    await ensureViewportExists(projectId);
    // Validate script presence early to provide clearer errors than timeline builder.
    await storyflowPrisma.script.findByProjectIdOrThrow(projectId, { select: { id: true } });

    await ensureProjectDirs(projectId);

    return { projectId, projectStatus: project.status };
  },
  async execute(
    input: BuildStageInput,
    options?: BuildStageOptions
  ): Promise<Timeline> {
    options?.onProgress?.(0.1);
    const timeline = await buildTimeline(input.projectId);
    options?.onProgress?.(0.7);

    const paths = getProjectPaths(input.projectId);
    await writeFile(paths.timeline, JSON.stringify(timeline, null, 2));
    options?.onProgress?.(1);

    return timeline;
  },
  async commit(projectId: string): Promise<void> {
    await transitionProjectStatus(projectId, "RENDER_READY");
  },
} satisfies PipelineStage<BuildStageInput, Timeline, BuildStageOptions>;

export async function buildProjectArtifacts(
  projectId: string,
  options?: BuildStageOptions
) {
  return runStage(buildStage, projectId, options);
}
