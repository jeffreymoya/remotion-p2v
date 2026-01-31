import fs from 'fs';
import { mkdir, access, writeFile } from 'fs/promises';
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
  project: string; // Alias for root (clarity in CLI commands)
  discovered: string;
  selected: string;
  refined: string;
  scripts: string;
  assets: string;
  assetsImages: string;
  assetsVideos: string;
  assetsAudio: string;
  assetsMusic: string;
  renders: string;
  boards: string;
  tags: string;
  timeline: string;
  viewport: string;
  preview: string;
  final: string;
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
    project: root,
    discovered: path.join(root, 'discovered.json'),
    selected: path.join(root, 'selected.json'),
    refined: path.join(root, 'refined.json'),
    scripts: path.join(root, 'scripts'),
    assets: path.join(root, 'assets'),
    assetsImages: path.join(root, 'assets', 'images'),
    assetsVideos: path.join(root, 'assets', 'videos'),
    assetsAudio: path.join(root, 'assets', 'audio'),
    assetsMusic: path.join(root, 'assets', 'music'),
    renders: path.join(root, 'renders'),
    boards: path.join(root, 'boards'),
    tags: path.join(root, 'tags.json'),
    timeline: path.join(root, 'timeline.json'),
    viewport: path.join(root, 'viewport.json'),
    preview: path.join(root, 'preview.mp4'),
    final: path.join(root, 'final.mp4'),
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
    paths.scripts,
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

    // Create .keep file to preserve empty directories in git
    const keepFile = path.join(dir, '.keep');
    try {
      await access(keepFile);
    } catch {
      await writeFile(keepFile, '');
    }
  }

  return paths;
}

/**
 * List all project IDs
 */
export function listAllProjects(): string[] {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Get video clip path
 */
export function getVideoClipPath(projectId: string, videoId: string): string {
  return path.join(getProjectDir(projectId), 'assets', 'videos', `${videoId}.mp4`);
}

/**
 * Get background music path
 */
export function getBackgroundMusicPath(projectId: string, musicId: string): string {
  return path.join(getProjectDir(projectId), 'assets', 'music', `${musicId}.mp3`);
}
