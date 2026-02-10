import { readFile } from "fs/promises";

import { ConflictError } from "@/app/api/lib";
import { getProjectPaths } from "@/src/lib/paths";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import type { ProjectStatus } from "@/src/lib/storyflow/types";

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["SCRIPT_READY"],
  SCRIPT_READY: ["ASSETS_READY", "DRAFT"],
  ASSETS_READY: ["VIEWPORT_READY", "BOARDS_READY", "SCRIPT_READY", "DRAFT"],
  BOARDS_READY: ["VIEWPORT_READY", "RENDER_READY", "ASSETS_READY", "SCRIPT_READY", "DRAFT"],
  VIEWPORT_READY: ["RENDER_READY", "BOARDS_READY", "ASSETS_READY", "SCRIPT_READY", "DRAFT"],
  RENDER_READY: ["RENDERING", "VIEWPORT_READY", "BOARDS_READY", "ASSETS_READY", "SCRIPT_READY", "DRAFT"],
  RENDERING: ["COMPLETED", "ERROR"],
  COMPLETED: ["DRAFT"],
  ERROR: ["DRAFT"],
};

export type TransitionGuardContext = {
  projectId: string;
};

export type TransitionGuard = (ctx: TransitionGuardContext) => Promise<void>;

const GUARDS: Record<string, TransitionGuard[]> = {};

function guardKey(from: ProjectStatus, to: ProjectStatus) {
  return `${from}→${to}`;
}

export function registerGuard(from: ProjectStatus, to: ProjectStatus, guard: TransitionGuard) {
  const key = guardKey(from, to);
  if (!GUARDS[key]) GUARDS[key] = [];
  GUARDS[key].push(guard);
}

export async function transitionProjectStatus(projectId: string, targetStatus: ProjectStatus): Promise<void> {
  const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
    select: { status: true },
  });

  const currentStatus = project.status as ProjectStatus;
  if (currentStatus === targetStatus) return;

  const allowed = TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new ConflictError(
      `Cannot transition from ${currentStatus} to ${targetStatus}. Allowed: [${allowed.join(", ")}]`
    );
  }

  const guards = GUARDS[guardKey(currentStatus, targetStatus)] ?? [];
  for (const guard of guards) {
    await guard({ projectId });
  }

  await storyflowPrisma.project.update({
    where: { id: projectId },
    data: { status: targetStatus },
  });
}

async function hasGeneratedBoardPrompts(projectId: string): Promise<boolean> {
  try {
    const { boards } = getProjectPaths(projectId);
    const raw = await readFile(`${boards}/board-prompts.json`, "utf-8");
    const parsed = JSON.parse(raw) as { prompts?: unknown };
    return Array.isArray(parsed.prompts) && parsed.prompts.length > 0;
  } catch {
    return false;
  }
}

async function mediaGateGuard({ projectId }: TransitionGuardContext): Promise<void> {
  const [hasPrompts, assetCount] = await Promise.all([
    hasGeneratedBoardPrompts(projectId),
    storyflowPrisma.asset.count({ where: { projectId } }),
  ]);

  const hasAssets = assetCount > 0;
  if (!hasPrompts && !hasAssets) {
    throw new ConflictError("Generate image prompts and upload at least one asset before marking Media complete.");
  }
  if (!hasPrompts) {
    throw new ConflictError("Generate image prompts before marking Media complete.");
  }
  if (!hasAssets) {
    throw new ConflictError("Upload at least one asset before marking Media complete.");
  }
}

registerGuard("SCRIPT_READY", "ASSETS_READY", mediaGateGuard);
