/**
 * Path Helper Tests
 * Tests the centralized path management system
 *
 * Migrated from tests/paths.test.ts (node:test → Vitest)
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getProjectDir,
  getProjectPaths,
  ensureProjectDirs,
  listAllProjects,
  getVideoClipPath,
  getBackgroundMusicPath,
} from '@/src/lib/paths';

const TEST_PROJECT_ID = 'test-project-' + Date.now();

describe('Path Helpers', () => {
  afterAll(() => {
    // Cleanup test project directory if it exists
    const testProjectDir = getProjectDir(TEST_PROJECT_ID);
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  it('getProjectDir returns correct path', () => {
    const projectDir = getProjectDir(TEST_PROJECT_ID);
    const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID);

    expect(projectDir).toBe(expected);
  });

  it('getProjectPaths returns all required paths', () => {
    const paths = getProjectPaths(TEST_PROJECT_ID);

    expect(paths.root).toBeTruthy();
    expect(paths.project).toBeTruthy();
    expect(paths.discovered).toBeTruthy();
    expect(paths.selected).toBeTruthy();
    expect(paths.refined).toBeTruthy();
    expect(paths.scripts).toBeTruthy();
    expect(paths.assets).toBeTruthy();
    expect(paths.assetsImages).toBeTruthy();
    expect(paths.assetsVideos).toBeTruthy();
    expect(paths.assetsAudio).toBeTruthy();
    expect(paths.assetsMusic).toBeTruthy();
    expect(paths.boards).toBeTruthy();
    expect(paths.tags).toBeTruthy();
    expect(paths.timeline).toBeTruthy();

    // Check timeline path ends with timeline.json
    expect(paths.timeline.endsWith('timeline.json')).toBe(true);

    // Check tags path ends with tags.json
    expect(paths.tags.endsWith('tags.json')).toBe(true);
  });

  it('ensureProjectDirs creates all directories', () => {
    const paths = ensureProjectDirs(TEST_PROJECT_ID);

    // Check that all directories were created
    expect(fs.existsSync(paths.root)).toBe(true);
    expect(fs.existsSync(paths.scripts)).toBe(true);
    expect(fs.existsSync(paths.assets)).toBe(true);
    expect(fs.existsSync(paths.assetsImages)).toBe(true);
    expect(fs.existsSync(paths.assetsVideos)).toBe(true);
    expect(fs.existsSync(paths.assetsAudio)).toBe(true);
    expect(fs.existsSync(paths.assetsMusic)).toBe(true);
    expect(fs.existsSync(paths.boards)).toBe(true);

    // Check that .keep files were created
    expect(fs.existsSync(path.join(paths.scripts, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.assets, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.assetsImages, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.assetsVideos, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.assetsAudio, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.assetsMusic, '.keep'))).toBe(true);
    expect(fs.existsSync(path.join(paths.boards, '.keep'))).toBe(true);

    // Cleanup
    fs.rmSync(paths.root, { recursive: true, force: true });
  });

  it('listAllProjects returns array of project IDs', () => {
    const projects = listAllProjects();

    expect(Array.isArray(projects)).toBe(true);

    // Should include our demo projects
    const projectIds = projects;
    const hasProjects = projectIds.length > 0;

    if (hasProjects) {
      // Check that each entry is a string
      projectIds.forEach(id => {
        expect(typeof id).toBe('string');
      });
    }
  });

  it('getVideoClipPath returns correct path', () => {
    const videoPath = getVideoClipPath(TEST_PROJECT_ID, 'test-video-id');
    const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID, 'assets', 'videos', 'test-video-id.mp4');

    expect(videoPath).toBe(expected);
    expect(videoPath.endsWith('.mp4')).toBe(true);
  });

  it('getBackgroundMusicPath returns correct path', () => {
    const musicPath = getBackgroundMusicPath(TEST_PROJECT_ID, 'test-music-id');
    const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID, 'assets', 'music', 'test-music-id.mp3');

    expect(musicPath).toBe(expected);
    expect(musicPath.endsWith('.mp3')).toBe(true);
  });

  it('existing demo projects have valid structure', () => {
    const projects = listAllProjects();

    if (projects.length === 0) {
      console.log('⚠ No projects found, skipping structure validation');
      return;
    }

    for (const projectId of projects) {
      const paths = getProjectPaths(projectId);

      // Check that root exists
      expect(fs.existsSync(paths.root)).toBe(true);

      // Check if timeline exists
      if (fs.existsSync(paths.timeline)) {
        // Verify it's a valid JSON file
        const content = fs.readFileSync(paths.timeline, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    }
  });

  it('path helpers use consistent separators', () => {
    const paths = getProjectPaths(TEST_PROJECT_ID);

    // All paths should use the system's path separator
    const allPaths = [
      paths.root,
      paths.discovered,
      paths.selected,
      paths.refined,
      paths.scripts,
      paths.assets,
      paths.boards,
      paths.timeline,
    ];

    allPaths.forEach(p => {
      // Should not have mixed separators
      expect(p.includes('/\\')).toBe(false);
      expect(p.includes('\\/')).toBe(false);
    });
  });
});
