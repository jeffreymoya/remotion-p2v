/**
 * Path Helper Tests
 * Tests the centralized path management system
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import {
  getProjectDir,
  getProjectPaths,
  ensureProjectDirs,
} from '@/src/lib/paths';

const TEST_PROJECT_ID = 'test-project-' + Date.now();

describe('Path Helpers', () => {
  afterAll(() => {
    const testProjectDir = getProjectDir(TEST_PROJECT_ID);
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  it('getProjectDir returns correct path', () => {
    const projectDir = getProjectDir(TEST_PROJECT_ID);
    expect(projectDir).toContain(TEST_PROJECT_ID);
    expect(projectDir).toContain('public/projects');
  });

  it('getProjectPaths returns all required paths', () => {
    const paths = getProjectPaths(TEST_PROJECT_ID);

    expect(paths.root).toBeTruthy();
    expect(paths.assets).toBeTruthy();
    expect(paths.assetsImages).toBeTruthy();
    expect(paths.assetsVideos).toBeTruthy();
    expect(paths.assetsAudio).toBeTruthy();
    expect(paths.assetsMusic).toBeTruthy();
    expect(paths.renders).toBeTruthy();
    expect(paths.boards).toBeTruthy();
    expect(paths.timeline).toBeTruthy();
    expect(paths.viewport).toBeTruthy();

    expect(paths.timeline.endsWith('timeline.json')).toBe(true);
    expect(paths.viewport.endsWith('viewport.json')).toBe(true);
  });

  it('ensureProjectDirs creates all directories', async () => {
    const paths = await ensureProjectDirs(TEST_PROJECT_ID);

    expect(fs.existsSync(paths.root)).toBe(true);
    expect(fs.existsSync(paths.assets)).toBe(true);
    expect(fs.existsSync(paths.assetsImages)).toBe(true);
    expect(fs.existsSync(paths.assetsVideos)).toBe(true);
    expect(fs.existsSync(paths.assetsAudio)).toBe(true);
    expect(fs.existsSync(paths.assetsMusic)).toBe(true);
    expect(fs.existsSync(paths.boards)).toBe(true);
    expect(fs.existsSync(paths.renders)).toBe(true);

    // Cleanup
    fs.rmSync(paths.root, { recursive: true, force: true });
  });

  it('path helpers use consistent separators', () => {
    const paths = getProjectPaths(TEST_PROJECT_ID);

    const allPaths = [
      paths.root,
      paths.assets,
      paths.renders,
      paths.boards,
      paths.timeline,
    ];

    allPaths.forEach(p => {
      expect(p.includes('/\\')).toBe(false);
      expect(p.includes('\\/')).toBe(false);
    });
  });
});
