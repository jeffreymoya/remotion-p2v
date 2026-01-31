import { mkdir, rm } from "fs/promises";

import { ensureProjectDirs, getProjectDir, getProjectPaths } from "@/src/lib/paths";

export async function createProjectDirectory(projectId: string) {
  await ensureProjectDirs(projectId);
  const paths = getProjectPaths(projectId);
  await mkdir(paths.assetsVideos, { recursive: true });
}

export async function deleteProjectDirectory(projectId: string) {
  const projectPath = getProjectDir(projectId);
  await rm(projectPath, { recursive: true, force: true });
}
