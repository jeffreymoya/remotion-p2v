> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 8: CLI Command

## Overview

Implement the main `boards` CLI command that orchestrates all stages.

> **MVP Note**: The boards command replaces the existing viewport.ts command entirely. Remove the old viewport script from package.json after implementing this.

**Files to create**:
- `cli/commands/boards.ts`

**Files to modify**:
- `package.json` (add boards script, remove viewport script)

---

## Command Structure

```bash
npm run boards -- --project <id> <stage> [options]
```

### Stages

| Stage | Description |
|-------|-------------|
| `plan` | Analyze script, determine image count, map segments |
| `prompts` | Generate AI image prompts with grid positions |
| `regions` | Detect regions in uploaded images using Gemini |
| `preview` | Launch browser preview for region verification |
| `triggers` | Generate word-level viewport triggers |
| `build` | Assemble final viewport.json |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | string | required | Project ID |
| `--grid` | string | `2x3` | Grid layout (e.g., `2x3`, `3x3`) |
| `--port` | number | `3456` | Preview server port |
| `--board-index` | number | all | Process specific board only |
| `--fps` | number | `30` | Frames per second for keyframes |

---

## Implementation

```typescript
// cli/commands/boards.ts

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';

import { getProjectPaths, ensureProjectDirectories } from '../../src/lib/paths';
import {
  BoardPlan,
  BoardPromptsOutput,
  BoardTriggersOutput,
  DEFAULT_BOARDS_CONFIG,
} from '../../src/lib/boards-types';
import { planBoards, generateBoardPrompts, detectBoardRegions, buildViewportJson } from '../lib/board-planner';
import { generateBoardTriggers } from '../lib/trigger-generator';
import { startPreviewServer } from '../lib/preview-server';

// Utility functions
async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Main command
const program = new Command();

program
  .name('boards')
  .description('Generate detective board images with word-level viewport sync')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('--grid <layout>', 'Grid layout (e.g., 2x3)', '2x3')
  .option('--port <number>', 'Preview server port', '3456')
  .option('--board-index <number>', 'Process specific board only')
  .option('--fps <number>', 'Frames per second', '30')
  .argument('[stage]', 'Stage to run: plan, prompts, regions, preview, triggers, build')
  .action(async (stage, options) => {
    const projectId = options.project;

    // Validate project ID format (security: prevents path traversal)
    if (!/^project-\d+$/.test(projectId)) {
      console.error(`[BOARDS] Invalid project ID: ${projectId}`);
      console.error(`[BOARDS] Expected format: project-{timestamp} (e.g., project-1764548027472)`);
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Parse grid layout
    const gridMatch = options.grid.match(/^(\d+)x(\d+)$/);
    if (!gridMatch) {
      console.error(`Invalid grid format: ${options.grid}. Use format like 2x3`);
      process.exit(1);
    }
    const gridLayout = {
      rows: parseInt(gridMatch[1]),
      cols: parseInt(gridMatch[2]),
    };

    const config = {
      ...DEFAULT_BOARDS_CONFIG,
      gridLayout,
    };

    // Ensure boards directory exists
    await ensureProjectDirectories(projectId);
    await fs.mkdir(path.join(paths.project, 'boards'), { recursive: true });

    console.log(`\n[BOARDS] Project: ${projectId}`);
    console.log(`[BOARDS] Grid: ${gridLayout.rows}x${gridLayout.cols}`);
    console.log(`[BOARDS] Stage: ${stage || 'all'}\n`);

    try {
      switch (stage) {
        case 'plan':
          await runPlanStage(paths, config);
          break;

        case 'prompts':
          await runPromptsStage(paths, config);
          break;

        case 'regions':
          await runRegionsStage(paths);
          break;

        case 'preview':
          await runPreviewStage(paths, parseInt(options.port));
          break;

        case 'triggers':
          await runTriggersStage(paths);
          break;

        case 'build':
          await runBuildStage(paths, parseInt(options.fps));
          break;

        default:
          console.log('Available stages:');
          console.log('  plan     - Analyze script, determine image count');
          console.log('  prompts  - Generate AI image prompts');
          console.log('  regions  - Detect regions in uploaded images');
          console.log('  preview  - Launch browser preview');
          console.log('  triggers - Generate word-level triggers');
          console.log('  build    - Assemble final viewport.json');
          console.log('\nUsage: npm run boards -- --project <id> <stage>');
      }
    } catch (error) {
      // Structured error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isLLMError = errorMessage.includes('LLM') || errorMessage.includes('Gemini');
      const isMissingFile = errorMessage.includes('not found') || errorMessage.includes('Missing');

      console.error('\n[BOARDS] Error:', errorMessage);

      if (isLLMError) {
        console.error('[BOARDS] Hint: LLM errors may be temporary. Try running the stage again.');
        console.error('[BOARDS] If persistent, check your GEMINI_API_KEY in .env');
      } else if (isMissingFile) {
        console.error('[BOARDS] Hint: Ensure you run stages in order: plan → prompts → regions → preview → triggers → build');
      }

      process.exit(1);
    }
  });

// Stage implementations

async function runPlanStage(paths: ProjectPaths, config: BoardsConfig): Promise<void> {
  const scriptPath = path.join(paths.project, 'scripts', 'script-v1.json');

  if (!await fileExists(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  const script = await readJson(scriptPath);
  const plan = await planBoards(script, 'scripts/script-v1.json', config);

  const outputPath = path.join(paths.project, 'boards', 'board-plan.json');
  await writeJson(outputPath, plan);

  console.log('\n[PLAN] Summary:');
  console.log(`  Total segments: ${plan.totalSegments}`);
  console.log(`  Total duration: ${(plan.totalDurationMs / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  Boards planned: ${plan.boards.length}`);

  for (const board of plan.boards) {
    console.log(`\n  ${board.boardId}:`);
    console.log(`    Segments: ${board.segmentIndices.join(', ')}`);
    console.log(`    Duration: ${(board.totalDurationMs / 1000).toFixed(1)}s`);
    console.log(`    Topic: ${board.topicSummary}`);
  }

  console.log(`\n[PLAN] Output: ${outputPath}`);
  console.log('[PLAN] Next: npm run boards -- --project ' + paths.projectId + ' prompts');
}

async function runPromptsStage(paths: ProjectPaths, config: BoardsConfig): Promise<void> {
  const planPath = path.join(paths.project, 'boards', 'board-plan.json');

  if (!await fileExists(planPath)) {
    throw new Error('board-plan.json not found. Run plan stage first.');
  }

  const plan = await readJson<BoardPlan>(planPath);
  const script = await readJson(path.join(paths.project, 'scripts', 'script-v1.json'));

  const prompts = await generateBoardPrompts(plan, script, config.gridLayout);

  const outputPath = path.join(paths.project, 'boards', 'board-prompts.json');
  await writeJson(outputPath, prompts);

  console.log('\n[PROMPTS] Generated prompts:');
  for (const p of prompts.prompts) {
    console.log(`\n=== ${p.boardId} ===`);
    console.log(`Elements: ${p.elements.length}`);
    console.log(`Prompt preview: ${p.fullPromptText.substring(0, 200)}...`);
  }

  console.log(`\n[PROMPTS] Output: ${outputPath}`);
  console.log('\n[PROMPTS] Next steps:');
  console.log('  1. Copy prompts from board-prompts.json');
  console.log('  2. Generate images with AI tool (DALL-E, Midjourney, etc.)');
  console.log('  3. Save as board-1.png, board-2.png in assets/images/');
  console.log('  4. Run: npm run boards -- --project ' + paths.projectId + ' regions');
}

async function runRegionsStage(paths: ProjectPaths): Promise<void> {
  const promptsPath = path.join(paths.project, 'boards', 'board-prompts.json');

  if (!await fileExists(promptsPath)) {
    throw new Error('board-prompts.json not found. Run prompts stage first.');
  }

  const prompts = await readJson<BoardPromptsOutput>(promptsPath);
  const imagesDir = path.join(paths.project, 'assets', 'images');

  // Check for uploaded images
  for (const p of prompts.prompts) {
    const imagePath = path.join(imagesDir, `${p.boardId}.png`);
    if (!await fileExists(imagePath)) {
      throw new Error(`Image not found: ${p.boardId}.png. Upload images to assets/images/ first.`);
    }
  }

  const regionsOutput = await detectBoardRegions(prompts, imagesDir);

  const outputPath = path.join(paths.project, 'boards', 'board-regions.json');
  await writeJson(outputPath, { version: '1.0', boards: regionsOutput, generatedAt: new Date().toISOString() });

  console.log('\n[REGIONS] Detection complete:');
  for (const board of regionsOutput) {
    console.log(`\n  ${board.boardId}: ${board.regions.length} regions`);
    for (const r of board.regions) {
      console.log(`    ${r.id}: x=${r.bounds.x.toFixed(2)}, y=${r.bounds.y.toFixed(2)}, w=${r.bounds.width.toFixed(2)}, h=${r.bounds.height.toFixed(2)}`);
    }
  }

  console.log(`\n[REGIONS] Output: ${outputPath}`);
  console.log('[REGIONS] Next: npm run boards -- --project ' + paths.projectId + ' preview');
}

async function runPreviewStage(paths: ProjectPaths, port: number): Promise<void> {
  const regionsPath = path.join(paths.project, 'boards', 'board-regions.json');

  if (!await fileExists(regionsPath)) {
    throw new Error('board-regions.json not found. Run regions stage first.');
  }

  console.log('[PREVIEW] Starting preview server...');
  console.log('[PREVIEW] After verification:');
  console.log('  1. Adjust regions if needed (drag/resize)');
  console.log('  2. Click "Save Changes"');
  console.log('  3. Press Ctrl+C to stop');
  console.log('  4. Run upscale: npm run upscale -- --project ' + paths.projectId);
  console.log('  5. Run triggers: npm run boards -- --project ' + paths.projectId + ' triggers');

  await startPreviewServer({
    projectId: paths.projectId,
    port,
    projectPath: paths.project,
  });

  // Keep process running
  await new Promise(() => {});
}

async function runTriggersStage(paths: ProjectPaths): Promise<void> {
  const planPath = path.join(paths.project, 'boards', 'board-plan.json');
  const promptsPath = path.join(paths.project, 'boards', 'board-prompts.json');
  const regionsPath = path.join(paths.project, 'boards', 'board-regions.json');
  const tagsPath = path.join(paths.project, 'tags.json');

  for (const [name, p] of [
    ['plan', planPath],
    ['prompts', promptsPath],
    ['regions', regionsPath],
    ['tags', tagsPath]
  ]) {
    if (!await fileExists(p)) {
      throw new Error(`${name} not found: ${p}`);
    }
  }

  const plan = await readJson<BoardPlan>(planPath);
  const prompts = await readJson<BoardPromptsOutput>(promptsPath);
  const regionsData = await readJson<{ boards: BoardRegionsOutput[] }>(regionsPath);
  const tags = await readJson(tagsPath);

  // Pass regionsData.boards for elementId linking
  const triggersOutput = await generateBoardTriggers(plan, prompts, regionsData.boards, tags);

  const outputPath = path.join(paths.project, 'boards', 'board-triggers.json');
  await writeJson(outputPath, triggersOutput);

  console.log('\n[TRIGGERS] Summary:');
  console.log(`  Total words: ${triggersOutput.totalWords}`);
  console.log(`  Total triggers: ${triggersOutput.totalTriggers}`);
  console.log('\n  Triggers:');

  for (const t of triggersOutput.triggers.slice(0, 10)) {
    const timeStr = (t.wordStartMs / 1000).toFixed(2) + 's';
    console.log(`    ${t.triggerId}: "${t.word}" @ ${timeStr} → ${t.targetRegionId} (${t.triggerType})`);
  }

  if (triggersOutput.triggers.length > 10) {
    console.log(`    ... and ${triggersOutput.triggers.length - 10} more`);
  }

  console.log(`\n[TRIGGERS] Output: ${outputPath}`);
  console.log('[TRIGGERS] Next: npm run boards -- --project ' + paths.projectId + ' build');
}

async function runBuildStage(paths: ProjectPaths, fps: number): Promise<void> {
  const requiredFiles = [
    'boards/board-plan.json',
    'boards/board-prompts.json',
    'boards/board-regions.json',
    'boards/board-triggers.json',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(paths.project, file);
    if (!await fileExists(filePath)) {
      throw new Error(`Required file not found: ${file}`);
    }
  }

  const viewport = await buildViewportJson(paths.project, fps);

  const outputPath = path.join(paths.project, 'viewport.json');
  await writeJson(outputPath, viewport);

  console.log('\n[BUILD] viewport.json created:');
  console.log(`  Version: ${viewport.version}`);
  console.log(`  Boards: ${viewport.boards.length}`);
  console.log(`  Triggers: ${viewport.wordTriggers.length}`);
  console.log(`  Keyframes: ${viewport.keyframes.length}`);

  console.log('\n  Boards:');
  for (const b of viewport.boards) {
    console.log(`    ${b.boardId}: ${b.imageSource} (${b.regions.length} regions)`);
  }

  console.log(`\n[BUILD] Output: ${outputPath}`);
  console.log('[BUILD] Test: npm run preview -- --project ' + paths.projectId);
}

// Run
program.parse();
```

---

## package.json Addition

```json
{
  "scripts": {
    "boards": "npx ts-node cli/commands/boards.ts"
  }
}
```

---

## Full Workflow Example

```bash
# 1. Plan images
npm run boards -- --project project-1764548027472 plan

# 2. Generate AI prompts
npm run boards -- --project project-1764548027472 prompts

# 3. [MANUAL] Generate images with AI tool, save to assets/images/

# 4. Detect regions
npm run boards -- --project project-1764548027472 regions

# 5. Preview and adjust
npm run boards -- --project project-1764548027472 preview
# [In browser: verify regions, drag/resize if needed, save]
# [Ctrl+C to stop preview]

# 6. Upscale images (existing command)
npm run upscale -- --project project-1764548027472

# 7. Generate triggers
npm run boards -- --project project-1764548027472 triggers

# 8. Build final viewport.json
npm run boards -- --project project-1764548027472 build

# 9. Test video
npm run preview -- --project project-1764548027472
```

---

## Error Handling Summary

| Error | Stage | Recovery |
|-------|-------|----------|
| Script not found | plan | Check script-v1.json exists |
| board-plan.json not found | prompts | Run plan stage first |
| Images not uploaded | regions | Upload board-N.png to assets/images/ |
| board-regions.json not found | preview | Run regions stage first |
| tags.json not found | triggers | Run TTS generation first |
| Missing required files | build | Complete all previous stages |

---

## Verification

```bash
# Test each stage independently
npm run boards -- --project project-1764548027472 plan
npm run boards -- --project project-1764548027472 prompts

# Verify files created
ls -la public/projects/project-1764548027472/boards/

# Check file contents
cat public/projects/project-1764548027472/boards/board-plan.json | jq .
```

---

## Complete

All specification documents are now complete. Implement in order:

1. [01-types.md](./01-types.md) - Foundation types
2. [02-plan-stage.md](./02-plan-stage.md) - Image planning
3. [03-prompts-stage.md](./03-prompts-stage.md) - AI prompt generation
4. [04-regions-stage.md](./04-regions-stage.md) - Region detection
5. [05-preview-stage.md](./05-preview-stage.md) - Browser preview
6. [06-triggers-stage.md](./06-triggers-stage.md) - Word-level triggers
7. [07-build-stage.md](./07-build-stage.md) - Final assembly
8. [08-cli-command.md](./08-cli-command.md) - CLI orchestration
