import { mkdir } from 'fs/promises';
import path from 'path';

/**
 * Centralized path management for the project.
 * Uses `public/projects/{projectId}` layout exclusively.
 */

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const PROJECTS_DIR = path.join(PUBLIC_DIR, 'projects');

export interface ProjectPaths {
  root: string;
  assets: string;
  assetsImages: string;
  assetsVideos: string;
  assetsAudio: string;
  assetsMusic: string;
  renders: string;
  boards: string;
  timeline: string;
  viewport: string;
}

/**
 * Get the root directory for a project (new layout)
 */
export function getProjectDir(projectId: string): string {
  return path.join(PROJECTS_DIR, projectId);
}

export function getPublicDir(): string {
  return PUBLIC_DIR;
}

export function getConfigPath(configName: string): string {
  return path.join(PROJECT_ROOT, 'config', `${configName}.json`);
}

export function getBinPath(binaryName: string): string {
  return path.join(PROJECT_ROOT, 'bin', binaryName);
}


/**
 * Get all paths for a project
 */
export function getProjectPaths(projectId: string): ProjectPaths {
  const root = getProjectDir(projectId);

  return {
    root,
    assets: path.join(root, 'assets'),
    assetsImages: path.join(root, 'assets', 'images'),
    assetsVideos: path.join(root, 'assets', 'videos'),
    assetsAudio: path.join(root, 'assets', 'audio'),
    assetsMusic: path.join(root, 'assets', 'music'),
    renders: path.join(root, 'renders'),
    boards: path.join(root, 'boards'),
    timeline: path.join(root, 'timeline.json'),
    viewport: path.join(root, 'viewport.json'),
  };
}

/**
 * Ensure all project directories exist
 */
export async function ensureProjectDirs(projectId: string): Promise<ProjectPaths> {
  const paths = getProjectPaths(projectId);

  // Create root directory
  await mkdir(paths.root, { recursive: true });

  // Create subdirectories
  const dirsToCreate = [
    paths.assets,
    paths.assetsImages,
    paths.assetsVideos,
    paths.assetsAudio,
    paths.assetsMusic,
    paths.renders,
    paths.boards,
  ];

  for (const dir of dirsToCreate) {
    await mkdir(dir, { recursive: true });
  }

  return paths;
}

