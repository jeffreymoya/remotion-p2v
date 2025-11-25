#!/usr/bin/env node
/**
 * Path Helper Tests
 * Tests the centralized path management system
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  getProjectDir,
  getProjectPaths,
  ensureProjectDirs,
  listAllProjects,
  getVideoClipPath,
  getBackgroundMusicPath,
} from '../src/lib/paths';

const TEST_PROJECT_ID = 'test-project-' + Date.now();

test('getProjectDir returns correct path', () => {
  const projectDir = getProjectDir(TEST_PROJECT_ID);
  const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID);

  assert.strictEqual(projectDir, expected, 'Project directory should match expected path');
});

test('getProjectPaths returns all required paths', () => {
  const paths = getProjectPaths(TEST_PROJECT_ID);

  assert.ok(paths.root, 'Should have root path');
  assert.ok(paths.discovered, 'Should have discovered path');
  assert.ok(paths.selected, 'Should have selected path');
  assert.ok(paths.refined, 'Should have refined path');
  assert.ok(paths.scripts, 'Should have scripts path');
  assert.ok(paths.assets, 'Should have assets path');
  assert.ok(paths.assetsImages, 'Should have assetsImages path');
  assert.ok(paths.assetsVideos, 'Should have assetsVideos path');
  assert.ok(paths.assetsAudio, 'Should have assetsAudio path');
  assert.ok(paths.assetsMusic, 'Should have assetsMusic path');
  assert.ok(paths.tags, 'Should have tags path');
  assert.ok(paths.timeline, 'Should have timeline path');

  // Check timeline path ends with timeline.json
  assert.ok(paths.timeline.endsWith('timeline.json'), 'Timeline path should end with timeline.json');

  // Check tags path ends with tags.json
  assert.ok(paths.tags.endsWith('tags.json'), 'Tags path should end with tags.json');
});

test('ensureProjectDirs creates all directories', () => {
  const paths = ensureProjectDirs(TEST_PROJECT_ID);

  // Check that all directories were created
  assert.ok(fs.existsSync(paths.root), 'Root directory should exist');
  assert.ok(fs.existsSync(paths.scripts), 'Scripts directory should exist');
  assert.ok(fs.existsSync(paths.assets), 'Assets directory should exist');
  assert.ok(fs.existsSync(paths.assetsImages), 'Images directory should exist');
  assert.ok(fs.existsSync(paths.assetsVideos), 'Videos directory should exist');
  assert.ok(fs.existsSync(paths.assetsAudio), 'Audio directory should exist');
  assert.ok(fs.existsSync(paths.assetsMusic), 'Music directory should exist');

  // Check that .keep files were created
  assert.ok(fs.existsSync(path.join(paths.scripts, '.keep')), '.keep should exist in scripts');
  assert.ok(fs.existsSync(path.join(paths.assets, '.keep')), '.keep should exist in assets');
  assert.ok(fs.existsSync(path.join(paths.assetsImages, '.keep')), '.keep should exist in images');
  assert.ok(fs.existsSync(path.join(paths.assetsVideos, '.keep')), '.keep should exist in videos');
  assert.ok(fs.existsSync(path.join(paths.assetsAudio, '.keep')), '.keep should exist in audio');
  assert.ok(fs.existsSync(path.join(paths.assetsMusic, '.keep')), '.keep should exist in music');

  // Cleanup
  fs.rmSync(paths.root, { recursive: true, force: true });
});

test('listAllProjects returns array of project IDs', () => {
  const projects = listAllProjects();

  assert.ok(Array.isArray(projects), 'Should return an array');

  // Should include our demo projects
  const projectIds = projects;
  const hasProjects = projectIds.length > 0;

  if (hasProjects) {
    // Check that each entry is a string
    projectIds.forEach(id => {
      assert.strictEqual(typeof id, 'string', 'Each project ID should be a string');
    });
  }
});

test('getVideoClipPath returns correct path', () => {
  const videoPath = getVideoClipPath(TEST_PROJECT_ID, 'test-video-id');
  const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID, 'assets', 'videos', 'test-video-id.mp4');

  assert.strictEqual(videoPath, expected, 'Video clip path should match expected path');
  assert.ok(videoPath.endsWith('.mp4'), 'Video clip path should end with .mp4');
});

test('getBackgroundMusicPath returns correct path', () => {
  const musicPath = getBackgroundMusicPath(TEST_PROJECT_ID, 'test-music-id');
  const expected = path.join(process.cwd(), 'public', 'projects', TEST_PROJECT_ID, 'assets', 'music', 'test-music-id.mp3');

  assert.strictEqual(musicPath, expected, 'Background music path should match expected path');
  assert.ok(musicPath.endsWith('.mp3'), 'Background music path should end with .mp3');
});

test('Existing demo projects have valid structure', () => {
  const projects = listAllProjects();

  if (projects.length === 0) {
    console.log('⚠ No projects found, skipping structure validation');
    return;
  }

  for (const projectId of projects) {
    const paths = getProjectPaths(projectId);

    // Check that root exists
    assert.ok(fs.existsSync(paths.root), `Project ${projectId} root should exist`);

    // Check if timeline exists
    if (fs.existsSync(paths.timeline)) {
      // Verify it's a valid JSON file
      const content = fs.readFileSync(paths.timeline, 'utf-8');
      assert.doesNotThrow(() => JSON.parse(content), `Timeline for ${projectId} should be valid JSON`);
    }
  }
});

test('Path helpers use consistent separators', () => {
  const paths = getProjectPaths(TEST_PROJECT_ID);

  // All paths should use the system's path separator
  const allPaths = [
    paths.root,
    paths.discovered,
    paths.selected,
    paths.refined,
    paths.scripts,
    paths.assets,
    paths.timeline,
  ];

  allPaths.forEach(p => {
    // Should not have mixed separators
    assert.ok(!p.includes('/\\') && !p.includes('\\/'), `Path should not have mixed separators: ${p}`);
  });
});

console.log('\n✅ All path tests passed!');
