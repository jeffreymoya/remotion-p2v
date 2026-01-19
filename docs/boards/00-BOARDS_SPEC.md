> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Boards Command Specification

## Overview

The `boards` command generates detective board-style images with precise word-level viewport synchronization. This solves the camera timing issue where panning moves too early/late relative to narration.

**Core Solution**: Word-Level Viewport Triggers (Solution 2 from VIEWPORT_PANNING_ANALYSIS.md)

> **MVP Note**: This command replaces the existing `viewport.ts` command entirely. The boards pipeline is the sole method for viewport generation going forward.

---

## Pipeline Flow

```
Script (script-v1.json)
    │
    ▼
┌─────────────────────┐
│  1. boards plan     │  → board-plan.json
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  2. boards prompts  │  → board-prompts.json
└─────────────────────┘
    │
    ▼ [USER: Generate images with AI tool, upload to assets/images/]
    │
    ▼
┌─────────────────────┐
│  3. boards regions  │  → board-regions.json
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  4. boards preview  │  → localhost:3456
└─────────────────────┘
    │
    ▼ [USER: Run upscale command 2k→8k]
    │
    ▼
┌─────────────────────┐
│  5. boards triggers │  → board-triggers.json
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  6. boards build    │  → viewport.json
└─────────────────────┘
```

---

## Specification Documents

Implement in order:

| # | Document | Description | Dependencies |
|---|----------|-------------|--------------|
| 1 | [01-types.md](./01-types.md) | TypeScript interfaces & Zod schemas | None |
| 2 | [02-plan-stage.md](./02-plan-stage.md) | Image count & segment mapping | Types |
| 3 | [03-prompts-stage.md](./03-prompts-stage.md) | AI image prompt generation | Plan stage |
| 4 | [04-regions-stage.md](./04-regions-stage.md) | Gemini region detection | Prompts stage |
| 5 | [05-preview-stage.md](./05-preview-stage.md) | Browser preview with drag/resize | Regions stage |
| 6 | [06-triggers-stage.md](./06-triggers-stage.md) | Word-level viewport triggers | Regions stage |
| 7 | [07-build-stage.md](./07-build-stage.md) | Final assembly to viewport.json | All stages |
| 8 | [08-cli-command.md](./08-cli-command.md) | CLI command structure | All stages |

---

## Output Directory Structure

```
public/projects/{projectId}/
├── scripts/
│   └── script-v1.json          # Input
├── assets/images/
│   ├── board-1.png             # User uploads (2k)
│   ├── board-1_8k.png          # After upscale
│   ├── board-2.png
│   └── board-2_8k.png
├── boards/                      # New directory
│   ├── board-plan.json         # Stage 1 output
│   ├── board-prompts.json      # Stage 2 output
│   ├── board-regions.json      # Stage 3 output
│   └── board-triggers.json     # Stage 5 output
└── viewport.json                # Stage 6 output (updated)
```

---

## CLI Usage

```bash
# Run individual stages
npm run boards -- --project <id> plan
npm run boards -- --project <id> prompts
npm run boards -- --project <id> regions
npm run boards -- --project <id> preview
npm run boards -- --project <id> triggers
npm run boards -- --project <id> build

# Options
--grid 2x3          # Override default grid layout (default: 2x3)
--port 3456         # Preview server port
--board-index 1     # Process specific board only
```

---

## Incremental Development Checklist

- [x] **Phase 1: Foundation**
  - [x] Implement types (01-types.md)
  - [x] Update paths.ts with boards directory
  - [x] Add npm script to package.json

- [ ] **Phase 2: Planning**
  - [x] Implement plan stage (02-plan-stage.md)
  - [x] Test with project-1764548027472 (5 boards generated 2026-01-09)

- [ ] **Phase 3: Prompt Generation**
  - [x] Implement prompts stage (03-prompts-stage.md)
  - [ ] Test prompt output quality

- [ ] **Phase 4: Region Detection**
  - [x] Implement regions stage (04-regions-stage.md)
  - [ ] Compare with current viewport.ts output

- [ ] **Phase 5: Preview UI**
  - [x] Implement preview stage (05-preview-stage.md)
  - [ ] Test drag/resize functionality

- [ ] **Phase 6: Triggers**
  - [x] Implement triggers stage (06-triggers-stage.md)
  - [in-progress] Verify word-level timing accuracy (unit tests now cover board switches, gaps, missing word timestamps, and unordered timings; still need real-project validation)

- [ ] **Phase 7: Integration**
  - [x] Implement build stage (07-build-stage.md)
  - [in-progress] Add automated build-stage verification (unit test added; full video preview still pending)

---

## Quick Reference

### Files Created by This Pipeline

```
src/lib/boards-types.ts          # TypeScript interfaces & Zod schemas
cli/commands/boards.ts           # Main CLI command
cli/lib/board-planner.ts         # Planning & prompt generation
cli/lib/trigger-generator.ts     # Word-level trigger generation
cli/lib/preview-server.ts        # Browser preview server
config/prompts/boards-plan.prompt.ts    # LLM prompt for planning
config/prompts/boards-image.prompt.ts   # AI image prompt generation
config/prompts/boards-region.prompt.ts  # Region detection prompt
```

### Key Improvements

| Aspect | Boards Pipeline |
|--------|-----------------|
| Region detection | Grid hints from prompts for deterministic detection |
| Sync method | Word-level triggers for precise audio sync |
| Zoom calculation | Aspect-aware for correct panel isolation |
| Multi-image | Multiple board images with hard-cut transitions |
| Verification | Browser preview with drag/resize adjustment |
| Error handling | Retry 3x with exponential backoff, fail-fast on missing assets |

---

## Related Documentation

- [VIEWPORT_PANNING_ANALYSIS.md](../VIEWPORT_PANNING_ANALYSIS.md) - Problem analysis and solutions
- [VIEWPORT_ANIMATION_INVESTIGATION.md](../VIEWPORT_ANIMATION_INVESTIGATION.md) - Original investigation
