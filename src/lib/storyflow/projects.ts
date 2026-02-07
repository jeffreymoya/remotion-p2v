import { rm } from "fs/promises";

import { ensureProjectDirs, getProjectDir } from "@/src/lib/paths";

export async function createProjectDirectory(projectId: string) {
  await ensureProjectDirs(projectId);
}

export async function deleteProjectDirectory(projectId: string) {
  const projectPath = getProjectDir(projectId);
  await rm(projectPath, { recursive: true, force: true });
}
