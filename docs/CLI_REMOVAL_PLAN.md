# CLI Removal Plan

> **Purpose**: Fully remove the deprecated CLI implementation to prevent confusion, while preserving shared utilities that are actively used by tests and the web UI.

## Executive Summary

The CLI (`cli/` directory) is deprecated in favor of the Next.js web UI (`app/`). However, several CLI utilities are actively imported by:
- 31 test files
- All prompt templates in `config/prompts/`
- Future web UI features

This plan outlines a safe removal strategy that:
1. Migrates shared utilities to `src/lib/`
2. Updates all dependent imports
3. Removes CLI-only code
4. Cleans up package.json scripts

---

## Phase 1: Migrate Shared Utilities

**Goal**: Move actively-used CLI utilities to `src/lib/` before removing CLI.

### 1.1 Core Libraries (cli/lib/ → src/lib/)

| Source | Destination | LOC | Used By |
|--------|-------------|-----|---------|
| `cli/lib/config.ts` | `src/lib/config.ts` | 402 | 15+ test files, future web API |
| `cli/lib/prompt-manager.ts` | `src/lib/prompt-manager.ts` | 117 | All prompts in config/prompts/ |
| `cli/lib/types.ts` | `src/lib/ai-types.ts` | 73 | AI provider interface |
| `cli/lib/media-types.ts` | `src/lib/media-types.ts` | 221 | Tests, media services |
| `cli/lib/scraper-types.ts` | `src/lib/scraper-types.ts` | 200+ | Web scraper tests |

### 1.2 Board Planning Utilities

| Source | Destination | LOC | Used By |
|--------|-------------|-----|---------|
| `cli/lib/board-planner.ts` | `src/lib/board-planner.ts` | ~150 | boards-build tests |
| `cli/lib/trigger-generator.ts` | `src/lib/trigger-generator.ts` | ~200 | boards-triggers tests |
| `cli/lib/animation-speed.ts` | `src/lib/animation-speed.ts` | ~50 | viewport calculations |

### 1.3 CLI Utilities to Migrate

| Source | Destination | Reason |
|--------|-------------|--------|
| `cli/utils/logger.ts` | `src/lib/logger.ts` | General logging utility |

---

## Phase 2: Migrate Essential Services

**Goal**: Move media and TTS services that have reusable logic.

### 2.1 Media Services (cli/services/media/ → src/lib/services/media/)

| Source | Destination | Priority | Reason |
|--------|-------------|----------|--------|
| `aspect-processor.ts` | `src/lib/services/media/aspect-processor.ts` | HIGH | Used by tests, web UI needs |
| `quality.ts` | `src/lib/services/media/quality.ts` | HIGH | Quality scoring for assets |
| `deduplication.ts` | `src/lib/services/media/deduplication.ts` | MEDIUM | Asset deduplication |
| `image-validator.ts` | `src/lib/services/media/image-validator.ts` | MEDIUM | Image quality validation |
| `timeout-wrapper.ts` | `src/lib/services/media/timeout-wrapper.ts` | HIGH | Resilience utilities |
| `sample-generator.ts` | `tests/utils/sample-generator.ts` | LOW | Test-only utility |

### 2.2 TTS Services (cli/services/tts/ → src/lib/services/tts/)

| Source | Destination | Priority | Reason |
|--------|-------------|----------|--------|
| `google-tts.ts` | `src/lib/services/tts/google-tts.ts` | HIGH | Core TTS functionality |
| `index.ts` | `src/lib/services/tts/index.ts` | HIGH | TTSProviderFactory |

### 2.3 Services to NOT Migrate (CLI-only)

These services are only used by CLI commands and should be deleted:

- `cli/services/ai/` - AI CLI providers (gemini-cli, claude-code, codex)
- `cli/services/trends/` - Google Trends (discover command only)
- `cli/services/music/` - Background music (not implemented in web UI)
- `cli/services/web/` - Curation server (replaced by Next.js)
- `cli/services/media/stock-search.ts` - Stock providers (web UI has own implementation)
- `cli/services/media/pexels.ts`, `unsplash.ts`, `pixabay.ts` - Provider-specific (web UI)
- `cli/services/media/downloader.ts` - Asset downloader (web UI)
- `cli/services/media/local-repo.ts` - Local media repo (web UI has Prisma)
- `cli/services/media/google-search.ts` - Google Custom Search
- `cli/services/media/web-scraper.ts` - Web scraping

---

## Phase 3: Update Import Paths

**Goal**: Update all files that import from CLI to use new paths.

### 3.1 Test Files to Update (31 files)

```
tests/boards-triggers.test.ts
tests/boards-build.test.ts
tests/web-scraper.test.ts
tests/schema.test.ts
tests/scraper-types.test.ts
tests/aspect-processor.test.ts
tests/image-validator.test.ts
tests/media-fallback.test.ts
tests/timeout-retry.test.ts
tests/google-search.test.ts
tests/local-library.test.ts
tests/word-timing.test.ts
tests/tts-resilience.test.ts
tests/e2e/local-library-gather.test.ts
tests/e2e/word-sync.test.ts
tests/e2e/edge-cases/media-edge-cases.test.ts
tests/e2e/edge-cases/network-resilience.test.ts
tests/integration/phase3-aspect-fit.test.ts
```

**Update pattern**:
```typescript
// Before
import { ConfigManager } from '../cli/lib/config';
import { StockImage } from '../cli/lib/media-types';

// After
import { ConfigManager } from '../src/lib/config';
import { StockImage } from '../src/lib/media-types';
```

### 3.2 Config Prompts to Update

All files in `config/prompts/` import from `cli/lib/prompt-manager.ts`:

```
config/prompts/discover.prompt.ts
config/prompts/script.prompt.ts
config/prompts/refine.prompt.ts
config/prompts/gather.prompt.ts
config/prompts/viewport.prompt.ts
config/prompts/boards-plan.prompt.ts
config/prompts/boards-image.prompt.ts
config/prompts/boards-region.prompt.ts
config/prompts/script-builder-*.prompt.ts
config/prompts/index.ts
```

**Update pattern**:
```typescript
// Before
import { PromptVariables, renderPrompt } from '../../cli/lib/prompt-manager';

// After
import { PromptVariables, renderPrompt } from '../../src/lib/prompt-manager';
```

---

## Phase 4: Remove CLI Directory

**Goal**: Delete CLI-only code after migrations complete.

### 4.1 Files to Delete

```
cli/
├── commands/           # All 13 command files (DELETE)
│   ├── discover.ts
│   ├── curate.ts
│   ├── refine.ts
│   ├── script.ts
│   ├── gather.ts
│   ├── build.ts
│   ├── viewport.ts
│   ├── boards.ts
│   ├── upscale.ts
│   ├── render.ts
│   ├── media-seed.ts
│   ├── media-stats.ts
│   └── media-gc.ts
│
├── services/           # DELETE after migration
│   ├── ai/             # All AI providers (DELETE)
│   ├── media/          # DELETE unmigrated files
│   ├── tts/            # DELETE after migration
│   ├── trends/         # DELETE
│   ├── music/          # DELETE
│   └── web/            # DELETE
│
├── lib/                # DELETE after migration
├── utils/              # DELETE after migration
├── service.ts          # DELETE (legacy)
├── test-ai-providers.ts # DELETE
├── test-e2e-pipeline.sh # DELETE
└── README.md           # DELETE
```

### 4.2 Total Removal Stats

| Category | Files | LOC |
|----------|-------|-----|
| Commands | 13 | ~4,227 |
| Services | ~30 | ~8,000 |
| Libraries | 8 | ~1,200 |
| Utils | 4 | ~500 |
| Other | 3 | ~300 |
| **Total** | **58** | **~14,227** |

---

## Phase 5: Clean Up package.json

**Goal**: Remove CLI-related npm scripts.

### 5.1 Scripts to Remove

```json
{
  "discover": "tsx cli/commands/discover.ts",
  "curate": "tsx cli/commands/curate.ts",
  "refine": "tsx cli/commands/refine.ts",
  "script": "tsx cli/commands/script.ts",
  "gather": "tsx cli/commands/gather.ts",
  "boards": "npx ts-node cli/commands/boards.ts",
  "viewport": "tsx cli/commands/viewport.ts",
  "build:timeline": "tsx cli/commands/build.ts",
  "render:project": "tsx cli/commands/render.ts",
  "upscale": "tsx cli/commands/upscale.ts",
  "media:seed": "tsx cli/commands/media-seed.ts",
  "media:stats": "tsx cli/commands/media-stats.ts",
  "media:gc": "tsx cli/commands/media-gc.ts",
  "pipeline": "bash cli/test-e2e-pipeline.sh"
}
```

### 5.2 Scripts to Keep (update paths if needed)

```json
{
  "test:boards-triggers": "tsx tests/boards-triggers.test.ts",
  "test:boards-build": "tsx tests/boards-build.test.ts"
}
```

---

## Phase 6: Update Documentation

### 6.1 Files to Update

| File | Action |
|------|--------|
| `CLAUDE.md` | Remove CLI references, update architecture section |
| `README.md` | Remove CLI usage instructions |
| `cli/README.md` | Delete entirely |
| `docs/E2E_TEST_IMPLEMENTATION_HANDOFF.md` | Update test references |

### 6.2 CLAUDE.md Changes

Remove:
- CLI commands section under "Build, Lint, Test Commands"
- CLI directory from "Key Directories"
- CLI-related pipeline stages
- References to `cli/services/`, `cli/lib/`, `cli/commands/`

Update:
- Architecture to focus on web UI only
- Note that shared utilities live in `src/lib/`

---

## Phase 7: Handle Tests

### 7.1 Tests to Delete (CLI-specific)

These tests only test CLI functionality and should be deleted:

```
tests/e2e/local-library-gather.test.ts  # Tests CLI gather command
tests/google-search.test.ts              # Tests CLI Google search
tests/local-library.test.ts              # Tests CLI local repo
tests/web-scraper.test.ts                # Tests CLI web scraper
```

### 7.2 Tests to Update (shared utilities)

These tests test utilities that will be migrated:

```
tests/boards-triggers.test.ts   # Update imports
tests/boards-build.test.ts      # Update imports
tests/aspect-processor.test.ts  # Update imports
tests/image-validator.test.ts   # Update imports
tests/timeout-retry.test.ts     # Update imports
tests/tts-resilience.test.ts    # Update imports
tests/word-timing.test.ts       # Update imports
tests/schema.test.ts            # Update imports
tests/scraper-types.test.ts     # Update imports
tests/media-fallback.test.ts    # Update imports
```

---

## Implementation Order

### Wave 1: Migrate Core Utilities (No Breaking Changes)
1. Copy `cli/lib/config.ts` → `src/lib/config.ts`
2. Copy `cli/lib/prompt-manager.ts` → `src/lib/prompt-manager.ts`
3. Copy `cli/lib/types.ts` → `src/lib/ai-types.ts`
4. Copy `cli/lib/media-types.ts` → `src/lib/media-types.ts`
5. Copy `cli/lib/scraper-types.ts` → `src/lib/scraper-types.ts`
6. Copy board planning utilities
7. Verify all tests still pass

### Wave 2: Migrate Essential Services
1. Create `src/lib/services/media/` directory
2. Migrate aspect-processor, quality, deduplication, timeout-wrapper
3. Create `src/lib/services/tts/` directory
4. Migrate google-tts and TTS factory
5. Move sample-generator to `tests/utils/`
6. Verify all tests still pass

### Wave 3: Update Import Paths
1. Update all test file imports (31 files)
2. Update all config/prompts imports (~15 files)
3. Run full test suite
4. Fix any broken imports

### Wave 4: Delete CLI
1. Delete `cli/` directory entirely
2. Remove CLI scripts from package.json
3. Update documentation
4. Final test verification

---

## Risk Mitigation

### Potential Issues

1. **Circular Dependencies**: Some CLI services may have circular imports
   - **Mitigation**: Carefully audit imports during migration

2. **Hidden Dependencies**: Undocumented imports may exist
   - **Mitigation**: Run `grep -r "from.*cli/" .` before final deletion

3. **Test Failures**: Tests may fail after migration
   - **Mitigation**: Run tests after each wave

4. **Path Resolution**: TypeScript path aliases may need updates
   - **Mitigation**: Check `tsconfig.json` paths

### Rollback Strategy

Keep a Git branch with the CLI intact:
```bash
git checkout -b archive/cli-backup
git push origin archive/cli-backup
```

---

## Success Criteria

- [ ] All shared utilities migrated to `src/lib/`
- [ ] All test files updated and passing
- [ ] All config/prompts updated
- [ ] `cli/` directory deleted
- [ ] package.json cleaned up
- [ ] Documentation updated
- [ ] No references to `cli/` remain in codebase
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

---

## Estimated Scope

| Phase | Files Changed | Complexity |
|-------|---------------|------------|
| Phase 1: Migrate utilities | 10 new files | Medium |
| Phase 2: Migrate services | 8 new files | Medium |
| Phase 3: Update imports | 46 files | Low (find/replace) |
| Phase 4: Delete CLI | 58 files deleted | Low |
| Phase 5: package.json | 1 file | Low |
| Phase 6: Documentation | 4 files | Low |
| Phase 7: Tests | 15 files | Medium |

**Total**: ~140 file operations
