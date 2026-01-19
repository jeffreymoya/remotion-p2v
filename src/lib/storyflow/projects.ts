import { mkdir, rm } from "fs/promises";
import path from "path";

export async function createProjectDirectory(projectId: string) {
  const projectPath = path.join(process.cwd(), "public", "projects", projectId);
  await mkdir(path.join(projectPath, "assets", "images"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "audio"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "videos"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "music"), { recursive: true });
}

export async function deleteProjectDirectory(projectId: string) {
  const projectPath = path.join(process.cwd(), "public", "projects", projectId);
  await rm(projectPath, { recursive: true, force: true });
}
