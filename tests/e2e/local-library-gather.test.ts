#!/usr/bin/env node
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { LocalMediaRepo } from '../../cli/services/media/local-repo';
import { generateSampleImage, generateSampleVideo } from '../../cli/services/media/sample-generator';
import { TestProjectManager, type TestProject } from './helpers/test-project-manager';

const TEST_TIMEOUT = 120000; // 2 minutes

async function runGather(projectId: string, env: NodeJS.ProcessEnv) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const proc = spawn('tsx', ['cli/commands/gather.ts', '--project', projectId], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', d => (stdout += d.toString()));
    proc.stderr?.on('data', d => (stderr += d.toString()));

    proc.on('close', code => resolve({ stdout, stderr, exitCode: code || 0 }));
    proc.on('error', reject);
  });
}

describe('Local library gather paths', { timeout: TEST_TIMEOUT }, () => {
  let prisma: PrismaClient;
  let project: TestProject;
  let libraryRoot: string;
  let canRun = true;
  let pool: Pool | undefined;

  before(async () => {
    if (!process.env.DATABASE_URL) {
      console.log('⏭️  Skipping local-library E2E: DATABASE_URL not set');
      canRun = false;
      return;
    }

    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    try {
      await prisma.$connect();
    } catch (err) {
      console.log('⏭️  Skipping local-library E2E: cannot connect to Postgres');
      canRun = false;
      return;
    }

    libraryRoot = path.join(os.tmpdir(), `library-e2e-${Date.now()}`);
    const repo = new LocalMediaRepo({ libraryRoot, prisma });
    await repo.ensureAvailable();

    const tmpAssets = await fs.mkdtemp(path.join(os.tmpdir(), 'library-seed-e2e-'));
    const videoPath = path.join(tmpAssets, 'seed-video.mp4');
    await generateSampleVideo(videoPath, { color: 'navy', durationSeconds: 2 });
    await repo.ingestVideo(videoPath, ['ocean', 'sunrise', 'waves'], 'seed');

    const imageTags = ['ocean', 'waves', 'sunrise'];
    for (let i = 0; i < 3; i++) {
      const imgPath = path.join(tmpAssets, `seed-image-${i}.png`);
      await generateSampleImage(imgPath, { color: `#${7 + i}${7 + i}88cc`, label: `seed-${i}` });
      await repo.ingestImage(imgPath, [...imageTags, `still-${i}`], 'seed');
    }

    await repo.dispose();
    await fs.remove(tmpAssets);

    project = await TestProjectManager.createTestProject('local-library');

    // Minimal prerequisites
    await fs.writeJson(project.paths.selected, {
      topic: { title: 'Ocean Sunrise', description: 'Local library reuse test', keywords: ['ocean', 'sunrise'] },
      selectedAt: new Date().toISOString(),
    }, { spaces: 2 });

    await fs.writeJson(project.paths.refined, {
      topic: { title: 'Ocean Sunrise', description: 'Local library reuse test' },
      refinedAt: new Date().toISOString(),
    }, { spaces: 2 });

    await fs.writeJson(path.join(project.paths.scripts, 'script-v1.json'), {
      segments: [
        { id: 'seg-1', text: 'Ocean waves at sunrise with soft light' },
        { id: 'seg-2', text: 'Calm beach with rolling waves and sunlight' },
      ],
    }, { spaces: 2 });
  });

  after(async () => {
    if (project) await TestProjectManager.cleanupTestProject(project.id);
    if (prisma) {
      if (canRun) {
        await prisma.image.deleteMany({ where: { path: { startsWith: libraryRoot } } });
        await prisma.video.deleteMany({ where: { path: { startsWith: libraryRoot } } });
      }
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end().catch(() => undefined);
    }
    if (libraryRoot) await fs.remove(libraryRoot);
  });

  it('reuses local library assets and skips online search', async () => {
    if (!canRun) return;

    const env = {
      LIBRARY_ROOT: libraryRoot,
      DATABASE_URL: process.env.DATABASE_URL,
      STOCK_LIBRARY_TEST_MODE: '1',
      LOCAL_LIBRARY_DISABLE_ONLINE: '1',
    };

    const result = await runGather(project.id, env);
    assert.strictEqual(result.exitCode, 0, `gather failed: ${result.stderr}`);

    const manifest = await fs.readJson(path.join(project.paths.root, 'manifest.json'));
    assert.ok(manifest.videos.length >= 1, 'should reuse at least one video');
    assert.ok(manifest.images.length >= 3, 'should reuse at least three images');

    for (const vid of manifest.videos) {
      assert.strictEqual(vid.source, 'local-library');
      assert.ok(vid.libraryId, 'video should include libraryId');
    }
    for (const img of manifest.images) {
      assert.strictEqual(img.source, 'local-library');
      assert.ok(img.libraryId, 'image should include libraryId');
    }

    assert.ok(manifest.audio.length > 0, 'audio entries should be present');
    const audioPath = path.join(project.paths.audio, `${manifest.audio[0].id}.mp3`);
    const audioExists = await fs.pathExists(audioPath);
    assert.ok(audioExists, 'stub audio file should be written');
  });

  it('fails fast when Postgres is unreachable', async () => {
    if (!canRun) return;

    const env = {
      LIBRARY_ROOT: libraryRoot,
      DATABASE_URL: 'postgresql://invalid:invalid@127.0.0.1:65432/notadb',
      STOCK_LIBRARY_TEST_MODE: '1',
      LOCAL_LIBRARY_DISABLE_ONLINE: '1',
    };

    const result = await runGather(project.id, env);
    assert.notStrictEqual(result.exitCode, 0, 'gather should fail when DB is unreachable');
    assert.ok(result.stderr.includes('DATABASE_URL') || result.stderr.toLowerCase().includes('prisma'), 'stderr should mention DB failure');
  });
});
