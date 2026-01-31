# Incremental Refactoring Plan

Reduce duplication and maximize reusability across the codebase through consistent adoption of patterns that already exist but are underutilized.

## Wave 0: Enforce Conventions in AI Agent Config Files ✅

**Goal:** Prevent AI coding agents from re-introducing the anti-patterns this plan eliminates. Every agent (Claude Code, Codex, Cursor, Copilot) reads its config file before writing code — the conventions must live there.

**What was done:**

### `CLAUDE.md` — Added "Coding Conventions (MUST follow)" section

New section appended after "Environment Variables" covering:
- API routes: must use `withErrorHandler` + `parseBody` from `@/app/api/lib`
- File paths: must use `@/src/lib/paths` — never `path.join(process.cwd(), ...)`
- React data fetching: must use TanStack Query hooks from `src/hooks/queries/`
- Retry: must use `withRetry`/`withTimeout` from `src/lib/utils/retry.ts`
- AI calls: must go through `geminiCall()` → `parseGeminiOutput()`
- DB access: must use `storyflowPrisma` singleton

### `AGENTS.md` — Added matching "Coding Conventions (MUST follow)" section

Same conventions as CLAUDE.md, plus:
- "Where Things Go" table mapping code type → directory
- Explicit instructions for adding new query hooks (3-step process)
- Available error classes listed with status codes

### Subdirectory `CLAUDE.md` Files

Agents get scoped context when working in specific directories. Each file contains only the rules relevant to that directory — no duplication of unrelated conventions.

| File | Scope |
|------|-------|
| `app/api/CLAUDE.md` | `withErrorHandler` pattern, error classes, `parseBody`/`parseQuery`, file paths in routes |
| `components/CLAUDE.md` | TanStack Query hooks for data fetching, available hooks table, how to add new hooks, when `useState` is fine |
| `src/hooks/CLAUDE.md` | Directory layout (queries/ vs root), server data vs UI hooks separation |
| `src/hooks/queries/CLAUDE.md` | Query key factory pattern, mutation cache invalidation, reference files for examples |
| `src/lib/api/CLAUDE.md` | API client pattern (thin fetch wrappers), no retry logic here, one file per domain |
| `src/lib/storyflow/CLAUDE.md` | Prisma singleton, JSON helpers, stage validation, paths, AI calls, retry |
| `src/lib/services/ai/CLAUDE.md` | `geminiCall` as single entry point, `parseGeminiOutput`, logging, no custom retry, no API-style CLI flags |
| `src/lib/boards/CLAUDE.md` | Boards pipeline rules (use AI gateway `aiGenerate`), file paths, retry via `retry.ts`, types location |

### Why this is Wave 0

Every subsequent wave migrates existing code to match these conventions. Without Wave 0, an agent could write a new route during Wave 4 that uses the old `try/catch` pattern — undoing Wave 1's work. The config files prevent that.

### Future agent configs

If the project adopts other tools, add the same conventions to:
- `.cursorrules` (Cursor)
- `.github/copilot-instructions.md` (GitHub Copilot)
- `.windsurfrules` (Windsurf)

The source of truth is the conventions in `CLAUDE.md` and `AGENTS.md`. Subdirectory `CLAUDE.md` files provide scoped context. Other tool config files should reference or duplicate them.

---

## Current State

The codebase already has solid infrastructure that is barely adopted:

| Infrastructure | Location | Adoption |
|---|---|---|
| Error classes + `withErrorHandler()` | `app/api/lib/errors.ts` (259 lines) | **0 of 48 routes** (0%) — 8 routes use `withLogging` instead (see Wave 1 Step 0) |
| `parseBody()` / `parseQuery()` (Zod) | `app/api/lib/errors.ts` | **0 of 48 routes** — all validation is inline `safeParse` |
| TanStack Query hooks | `src/hooks/queries/` (11 hooks) | **~16 of ~80 components** (~20%) |
| `QueryClient` factory | `src/lib/query-client.ts` | Configured, underused |
| Path utilities | `src/lib/paths.ts` (122 lines) | **1 file** (test only) — 27 `path.join(process.cwd()` across 15 files |
| Stage validation | `src/lib/storyflow/stage-validation.ts` | Inconsistently used |
| Retry/timeout utilities | `src/lib/utils/retry.ts` | Used in media + TTS; boards AI now uses shared helper (no custom `callWithRetry`) |
| Request logging (`withLogging`) | `src/lib/api-logger.ts` | **8 of 48 routes** — provides request ID, timing, structured logging but no error handling |

**The problem is not missing abstractions. It is inconsistent adoption.**

---

## Wave 1: Adopt `withErrorHandler` + `parseBody` Across All Routes ✅

**Goal:** Every API route uses the existing error infrastructure.

**What exists:** `app/api/lib/errors.ts` exports `withErrorHandler()`, `parseBody()`, `parseQuery()`, `NotFoundError`, `ValidationError`, and other error classes. Currently used in 0 routes. 8 routes use a separate `withLogging` wrapper from `src/lib/api-logger.ts`.

**What to do:** Merge `withLogging` into `withErrorHandler`, then migrate all 48 routes to use the unified wrapper.

### Step 0: Merge `withLogging` into `withErrorHandler` ✅

Before migrating routes, merge the logging features from `withLogging` (`src/lib/api-logger.ts`) into `withErrorHandler` (`app/api/lib/errors.ts`). `withLogging` provides:

- Request ID generation (`crypto.randomUUID()`)
- Structured start/end logging with pino (`logger.child({ requestId, method, path })`)
- Duration timing

These belong in the error handler wrapper — every route should get logging and error handling from a single wrapper. After merging:

1. Update `withErrorHandler` to generate a request ID, log request start/end with timing, and include the request ID in error responses
2. Delete `src/lib/api-logger.ts` and its `withLogging` export
3. Update the 8 routes that import `withLogging` to use `withErrorHandler` instead

**Progress:** Logging features merged into `withErrorHandler` with request IDs and structured timing; `withStreamErrorHandler` added for SSE routes. All routes previously using `withLogging` now use `withErrorHandler`/`parseBody`; SSE stream wrapped. `src/lib/api-logger.ts` removed. 2026-01-31: Upscale route now relies on service-level `ApiError`s (no inline try/catch); remaining route-level catch blocks to migrate/justify in next slices.

**Routes currently using `withLogging`:**
- `app/api/ai/refine/route.ts`
- `app/api/ai/script/route.ts`
- `app/api/projects/[id]/boards/plan/route.ts`
- `app/api/projects/[id]/boards/prompts/route.ts`
- `app/api/projects/[id]/boards/regions/route.ts`
- `app/api/projects/[id]/boards/triggers/route.ts`
- `app/api/projects/[id]/boards/viewport/route.ts`
- `app/api/projects/[id]/boards/upload-image/route.ts`

### Streaming routes

Streaming routes (e.g., `app/api/projects/[id]/ai-logs/stream/route.ts`) cannot use `withErrorHandler` because they send SSE events, not JSON responses. Create a `withStreamErrorHandler` variant that:

1. Wraps the handler in try/catch
2. On error, sends an SSE error event (`event: error\ndata: {...}\n\n`) before closing the stream
3. Logs the error the same way as `withErrorHandler`

### Before (typical route today)

```typescript
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const project = await storyflowPrisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // ... logic
    return NextResponse.json(result);
  } catch (error) {
    console.error("[route] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### After (using existing infrastructure — route with path params)

```typescript
export const POST = withErrorHandler(async (req, ctx) => {
  const data = await parseBody(req, schema);
  const { id } = await ctx!.params!;
  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (!project) throw new NotFoundError("Project", id);
  // ... logic
  return NextResponse.json(result);
}, "route-name");
```

### After (route without path params — `ctx` is undefined)

```typescript
export const POST = withErrorHandler(async (req) => {
  const data = await parseBody(req, schema);
  // ... logic — no ctx needed for root collection routes
  return NextResponse.json(result);
}, "route-name");
```

### Migration order

Migrate routes in batches grouped by domain to keep PRs reviewable:

1. **Projects CRUD** — `app/api/projects/` (6 routes) — ✅ all project routes (list/create/update/delete, timeline, mappings, viewport, ai-logs) migrated to `withErrorHandler`/`parseBody`/`parseQuery`
2. **Boards pipeline** — `app/api/projects/[id]/boards/` (8 routes) — ✅ all boards routes migrated
3. **TTS** — `app/api/tts/` (3 routes) — ✅ migrated to `withErrorHandler`/`parseBody`/`parseQuery`; streaming GET uses `withStreamErrorHandler`
4. **Script Builder** — `app/api/script-builder/` (8 routes) — ✅ all draft/execute/segment/beat/regenerate/status/polish/history/glue-analysis endpoints migrated to unified wrapper
5. **Assets** — `app/api/assets/` (5 routes) — ✅ migrated to `withErrorHandler`/`parseBody`; upscale maps errors to ApiError variants; deprecated search wrapped for logging
6. **AI** — `app/api/ai/` (3 routes) — ✅ refine/script/viewport routes migrated to unified wrapper
7. **Remaining** — settings, render, music, discover, etc. — ✅ render start/status, music selection/library, settings, discover/generalize migrated

### Per-route migration steps

1. Add `withErrorHandler` wrapper
2. Replace manual `req.json()` + `safeParse` with `parseBody(req, schema)`
3. Replace `if (!project) return NextResponse.json(...)` with `throw new NotFoundError(...)`
4. Remove the `try/catch` block (handled by wrapper)
5. Run the route's test if one exists, or smoke-test manually

Status check (2026-01-30): All JSON-based routes now use `parseBody` / `parseQuery`; the only remaining manual validation is the form-data music/asset upload handler, which cannot consume JSON.

### Estimated reduction

- ~8-15 lines removed per route (validation boilerplate + catch block)
- 48 routes total = ~400-720 lines eliminated
- ~12 routes currently missing error handling entirely get it for free

### Rollback

Each batch within a wave is a separate commit. If a batch introduces regressions, revert the commit.

### Verification

```bash
# After completion, this should return 0 results outside app/api/lib/:
grep -r "catch (error)" app/api/ --include="*.ts" -l | grep -v "app/api/lib/"
```

---

## Wave 2: Adopt `src/lib/paths.ts` Everywhere ✅

**Goal:** All project file system operations use `getProjectPaths()` / `getProjectDir()`.

**What exists:** `src/lib/paths.ts` exports `getProjectDir()`, `getProjectPaths()`, `ensureProjectDirs()`. Currently used in 0 production files (only 1 test).

**What to do:** Replace 27 `path.join(process.cwd(), "public", "projects", ...)` occurrences across 15 files.

### Files to migrate — production code (21 occurrences across 12 files)

| File | Occurrences | Change |
|---|---|---|
| `src/lib/storyflow/assets.ts` | 4 | Use `getProjectPaths(id).assetsImages` etc. ✅ |
| `src/lib/storyflow/render.ts` | 3 | Use `getProjectPaths(id).root` ✅ |
| `src/lib/storyflow/projects.ts` | 2 | Use `getProjectDir(id)` ✅ |
| `src/lib/storyflow/upscale/job.ts` | 2 | Use `getProjectPaths(id)` ✅ |
| `src/lib/config.ts` | 2 | Use `getConfigPath` helper backed by path utilities ✅ |
| `app/api/projects/[id]/boards/prompts/route.ts` | 2 | Use `getProjectPaths(id).boards` ✅ |
| `src/lib/storyflow/tts.ts` | 1 | Use `getProjectPaths(id).assetsAudio` ✅ |
| `src/lib/storyflow/viewport.ts` | 1 | Use `getProjectPaths(id).root` ✅ |
| `src/lib/storyflow/upscale/realesrgan.ts` | 1 | Use `getProjectPaths(id)` ✅ |
| `app/api/projects/[id]/boards/upload-image/route.ts` | 1 | Use `getProjectPaths(id).boards` ✅ |
| `app/api/projects/[id]/boards/regions/route.ts` | 1 | Use `getProjectPaths(id).boards` ✅ |
| `app/api/projects/[id]/music/route.ts` | 1 | Use `getProjectPaths(id).assetsMusic` ✅ |

### Files to migrate — test files (6 occurrences across 3 files)

| File | Occurrences | Change |
|---|---|---|
| `src/test/lib/paths.test.ts` | 3 | Use `getProjectPaths(id)` — this tests paths.ts itself, some occurrences may stay ✅ |
| `tests/timeline.test.ts` | 2 | Use `getProjectPaths(id)` ✅ |
| `tests/schema.test.ts` | 1 | Use `getProjectPaths(id)` ✅ |

### Steps per file

1. Import `getProjectPaths` or `getProjectDir` from `@/src/lib/paths`
2. Replace `path.join(process.cwd(), "public", "projects", id, ...)` with the appropriate path property
3. Replace `mkdir(dir, { recursive: true })` with `ensureProjectDirs(id)` where applicable
4. Remove now-unused `path` and `process.cwd()` imports

### Missing paths — add to `ProjectPaths` interface

The following paths are used in production code but not yet in `ProjectPaths`. Add them before migrating the files that need them:

```typescript
// Add to ProjectPaths interface in src/lib/paths.ts:
viewport: string;    // path.join(root, 'viewport.json')
preview: string;     // path.join(root, 'preview.mp4')
final: string;       // path.join(root, 'final.mp4')
```

### Verification

```bash
# After completion, should return 0 outside of paths.ts itself:
grep -r "process.cwd().*projects" src/ app/ --include="*.ts" -l | grep -v "src/lib/paths.ts"
```

---

## Wave 3: Unify Retry Logic Into Shared `retry.ts` ✅

**Goal:** One retry implementation used everywhere.

**What exists:** `src/lib/utils/retry.ts` exports `withRetry()`, `withTimeout()`, and `withTimeoutAndRetry()` with configurable exponential backoff. Media services, TTS, and boards AI now consume this shared helper; no duplicate retry helpers remain.

**Progress:** 
- Step 1 (move `timeout-wrapper.ts` → `src/lib/utils/retry.ts`) ✅ — imports updated to the shared path.
- Step 2 (replace `boards/ai-service.ts` `callWithRetry()` with `withRetry`) ✅ — local helper removed; operations now use the shared exponential-backoff config.

### Verification

```bash
# Should return only src/lib/utils/retry.ts:
grep -rn "new Promise.*setTimeout.*resolve" src/lib/ --include="*.ts" -l
```

---

## Wave 4: Migrate Remaining Components to TanStack Query Hooks ✅

**Goal:** All data-fetching components use existing TanStack Query hooks.

**What exists:** 11 query hooks in `src/hooks/queries/` covering projects, boards, assets, render, TTS, viewport, execution status, AI logs, asset search, music library, and mappings. ~16 of ~80 components already use them.

**Filtering criterion:** Only migrate components with `fetch()` calls or `useState`+`useEffect` managing server data. Pure UI state (`useState(false)` for modals, toggles, form inputs) is **not** a migration target.

**Remaining components with manual fetch patterns:**

Prioritize by duplication severity — components with the most `useState` + `useEffect` fetch patterns:

### High priority (most manual state)

| Component | Manual patterns | Existing hook to use |
|---|---|---|
| `BoardPlannerWizard.tsx` | 20 occurrences | `use-boards` ✅ |
| `reset-to-ai-button.tsx` | 8 occurrences | Extract mutation to `use-boards` or `use-assets` |
| `script-builder-workflow.tsx` | 7 occurrences | `use-execution-status` (partially adopted) |
| `topic-refinement.tsx` | 5 occurrences | New hook or inline `useMutation` |
| `stock-search.tsx` | 3 occurrences | `use-asset-search` |

### Medium priority

| Component | Manual patterns | Existing hook to use |
|---|---|---|
| `ImageUploader.tsx` | 4 occurrences | `use-boards` upload mutation ✅ |
| `media-manager.tsx` | 2 occurrences | `use-assets` |
| `upload-zone.tsx` | 2 occurrences | `use-assets` upload mutation |
| `music-settings.tsx` | 2 occurrences | `use-music-library` |
| `music-library.tsx` | 2 occurrences | `use-music-library` |
| `simple-boards-editor.tsx` | 2 occurrences | `use-boards` |
| `simple-viewport-editor.tsx` | 2 occurrences | `use-viewport` |
| `execution-progress.tsx` | 2 occurrences | `use-execution-status` |

### Low priority (1 occurrence each — often just UI state, not data fetching)

Review individually: `asset-manager.tsx`, `PromptDisplay.tsx`, `RegionEditor.tsx`, `ViewportPreview.tsx`, `video-preview.tsx`, `toast-provider.tsx`, `tts-manager.tsx`, `mobile-nav.tsx`, `log-entry.tsx`, `audio-preview.tsx`, `tts-progress-indicator.tsx`, `render-panel.tsx`.

### Steps per component

1. Identify which `useState`/`useEffect` pairs are data-fetching (vs. UI state)
2. Find the matching hook in `src/hooks/queries/`
3. Replace manual state with hook: `const { data, isLoading, error } = useQuery(...)` or `const { mutate } = useMutation(...)`
4. Remove the replaced `useState`, `useEffect`, and `fetch()` calls
5. If no hook exists for the operation, add a mutation/query to the appropriate hook file

### New hooks needed

Based on the gaps, these hooks may need new queries or mutations added:

- `use-boards.ts` — add `uploadBoardImage` mutation
- `use-assets.ts` — add `uploadAsset` mutation if missing
- `use-projects.ts` — add `updateTopicRefinement` mutation if missing

Progress 2026-01-30: Boards wizard/uploader migrated; music settings now use `use-music-library` volume mutation; stock search imports use `use-assets` import mutation; topic refinement uses a new `useRefineTopic` mutation hook; script-builder workflow now uses query mutations for project updates and TTS client wrapper instead of manual fetch. Remaining components now rely on existing hooks (no direct `fetch` usage).

### Verification

```bash
# Track adoption progress:
grep -r "from.*@/src/hooks/queries" components/ --include="*.tsx" -l | wc -l
# Target: 30+ (up from 16)

# Track remaining manual patterns:
grep -c "useState.*false\|setLoading\|setIsLoading" components/**/*.tsx 2>/dev/null | grep -v ":0$" | wc -l
# Target: < 5 files
```

---

## Wave 5: Prisma Client Extension for Project Operations ✅

**Goal:** Encapsulate repeated project database operations behind a typed extension.

**What exists:** `storyflowPrisma` singleton in `src/lib/storyflow/prisma.ts`. Currently 202 direct usages across 53 files.

### Step 1: Create the extension (Prisma ^6.8.0)

Prisma 6.x supports client extensions via `$extends()` (stable since 4.16). Use the `Prisma.defineExtension` helper:

```typescript
// src/lib/storyflow/prisma-extensions.ts
import { Prisma } from '@/src/generated/storyflow';
import { NotFoundError } from '@/app/api/lib';

export const projectExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      project: {
        async findByIdOrThrow(id: string) {
          const project = await client.project.findUnique({ where: { id } });
          if (!project) throw new NotFoundError('Project', id);
          return project;
        },
        async findWithScript(id: string) {
          return client.project.findUnique({
            where: { id },
            include: { scriptDrafts: true },
          });
        },
        async updateStatus(id: string, status: string) {
          return client.project.update({
            where: { id },
            data: { status, updatedAt: new Date() },
          });
        },
      },
    },
  });
});
```

### Step 2: Apply extension to the Prisma client

```typescript
// src/lib/storyflow/prisma.ts
import { projectExtension } from './prisma-extensions';

const basePrisma = new PrismaClient({ ... });
export const storyflowPrisma = basePrisma.$extends(projectExtension);
```

> **Note:** The extended client's type changes — TypeScript will enforce using the new methods. Callers that destructure `storyflowPrisma` will need no changes since the extension adds methods, it doesn't remove any.

### Step 3: Migrate routes incrementally

Start with routes already migrated to `withErrorHandler` (from Wave 1):

```typescript
// Before:
const project = await storyflowPrisma.project.findUnique({ where: { id } });
if (!project) throw new NotFoundError("Project", id);

// After:
const project = await storyflowPrisma.project.findByIdOrThrow(id);
```

### Migration order

Same domain batches as Wave 1. Migrate one batch at a time — each batch is a small PR.

### What NOT to abstract

Not every Prisma call needs an extension method. Only extract patterns that appear 3+ times:

- `findByIdOrThrow` — used 15+ times
- `updateStatus` — used 15+ times
- `findWithScript` — used 5+ times
- `findWithAssets` — used 4+ times

Leave one-off queries as direct Prisma calls.

**Progress 2026-01-30:** Prisma project extension added with `findByIdOrThrow`/`findWithScript`/`findWithAssets`/`updateStatus`, and `storyflowPrisma` now applies it. Callers migrated so far: AI refine/script routes, project music + mappings routes, timeline builder, viewport generation, render job setup, project CRUD routes, boards plan/viewport/triggers/list/detail routes, assets upload/import, script-builder blueprint generation, dashboard project pages (layout/redirect/overview/render/media/storyboard/script), blueprint routes, TTS generation, music selection, and upscale jobs. `withStreamErrorHandler` is exported alongside other API helpers. Remaining direct `findUnique` usages are intentional optional lookups (e.g., script upsert, delete flows) or legacy repository helpers; add model-specific extensions only if duplication grows.

### Verification

```bash
# Count direct findUnique calls — should decrease over time:
grep -r "storyflowPrisma.project.findUnique" app/ src/ --include="*.ts" -l | wc -l
```

---

## Wave 6: AI Gateway — Consolidate AI Call Patterns ✅

**Goal:** Single entry point for all AI operations with unified retry, logging, and parsing.

**What exists:**
- `src/lib/services/ai/gemini-wrapper.ts` — CLI execution + model fallback
- `src/lib/storyflow/gemini-parser.ts` — JSON extraction from CLI output (244 lines, well-tested)
- `src/lib/services/ai/ai-logger.ts` — database-backed call logging
- `src/lib/utils/retry.ts` — shared retry/timeout helpers (moved from media/)

### Step 1: Create the gateway

```typescript
// src/lib/services/ai/ai-gateway.ts
import { geminiCall } from './gemini-wrapper';
import { parseGeminiOutput } from '@/src/lib/storyflow/gemini-parser';
import { aiLogger } from './ai-logger';
import { withRetry } from '@/src/lib/utils/retry';
import { z } from 'zod';

export interface AiRequest<T> {
  prompt: string;
  projectId: string;       // Required — used by aiLogger.wrap()
  operation: string;       // Required — used by aiLogger.wrap()
  schema?: z.ZodSchema<T>;
  model?: string;          // Specific model name, or omit for settings default
  outputFormat?: 'json' | 'text';
  maxRetries?: number;
  metadata?: Record<string, unknown>; // Additional logging context
}

export async function aiGenerate<T>(request: AiRequest<T>): Promise<AiCallResult<T>> {
  const { prompt, projectId, operation, schema, model, outputFormat = 'json', maxRetries = 2, metadata } = request;

  return withRetry(
    async () => {
      const result = await geminiCall<T>(
        { projectId, operation, metadata },
        prompt,
        { model, outputFormat },
      );

      if (schema && outputFormat === 'json') {
        const validated = schema.parse(result.data);
        return { ...result, data: validated };
      }

      return result;
    },
    { maxRetries, retryDelayMs: 2000, exponentialBackoff: true },
    operation
  );
}
```

### Step 2: Migrate callers one at a time

| File | Current pattern | Migration |
|---|---|---|
| `src/lib/storyflow/ai.ts` | Direct `geminiCall` + manual parse | Use `aiGenerate({ schema })` |
| Boards pipelines (plan/regions/emphasis) | Legacy `BoardsAIService` | Use `aiGenerate` (gateway) |
| `src/lib/storyflow/viewport.ts` | Direct `geminiCall` + parse | Use `aiGenerate({ schema })` |
| `app/api/ai/refine/route.ts` | Direct gemini call | Use `aiGenerate` |
| `src/lib/storyflow/script-builder.ts` | `executeGeminiRaw` with inline retry | Use `aiGenerate` |

### Step 3: Delete `BoardsAIService`

Completed — legacy `src/lib/boards/ai-service.ts` removed; boards now use `aiGenerate`.

**Progress 2026-01-31 (✅ Wave 6):** Shared gateway added at `src/lib/services/ai/ai-gateway.ts` with retry + schema validation. `src/lib/storyflow/ai.ts`, `src/lib/storyflow/viewport.ts`, script-builder flows, AI refine route, boards planning/regions, and TTS emphasis now call `aiGenerate`. Legacy `BoardsAIService` removed. Gateway now logs once per logical call (retries use unlogged `runGemini`), preventing duplicate AI log rows. Audit confirms no remaining direct `geminiCall` usages outside the gateway exports.

### What to preserve

- `gemini-parser.ts` — keep as-is, it's well-tested and does one thing
- `ai-logger.ts` — integrate into gateway, don't duplicate
- Model fallback logic from `gemini-wrapper.ts` — keep in wrapper, expose via `modelTier` option

---

## Wave 7: Pipeline Stage Interface ✅

**Goal:** Formalize the stage lifecycle so adding a new stage is implementing an interface, not copying 400 lines.

**What exists:** `src/lib/storyflow/stage-validation.ts` defines `PipelineStageId`, `STAGE_ORDER`, and gating logic. Each stage currently has its own ad-hoc implementation.

### Define the interface (✅ added)

`src/lib/storyflow/pipeline/types.ts` now declares the `PipelineStage` contract and shared options.

### Create a runner (✅ added)

`src/lib/storyflow/pipeline/runner.ts` orchestrates prepare/execute/commit, enforces required status with `storyflowPrisma.project.findByIdOrThrow`, and raises `ConflictError` when invoked out of order. Supports optional `onProgress` callback.

**Progress 2026-01-31 (✅ Wave 7):** Render, Build, Storyboard, Script, and Media stages now delegate through `runStage` with appropriate gating/status promotion; render keeps the existing worker launch while build writes `timeline.json`. Dashboard pages surface stage trigger buttons via pipeline hooks so users can advance statuses before rendering.

### Migration plan

### Migrate stages incrementally

Start with the simplest stage and work toward the most complex. Use canonical `PipelineStageId` values from `stage-validation.ts`:

1. **`render`** (simplest — few inputs, clear output)
2. **`build`** (viewport + timeline generation)
3. **`storyboard`** (multiple sub-steps but well-defined)
4. **`media`** (TTS + media — most complex, may need sub-stages)
5. **`script`** (Script Builder — stateful, hardest to fit into the pattern)

Each migration is one PR. The existing route handlers remain but delegate to `runStage()`.

---

## Wave 8: Type Consolidation ✅

**Goal:** Single source of truth for overlapping type definitions.

### Settings types (5 overlapping definitions → 1 source of truth)

| Current location | Type | Action |
|---|---|---|
| `src/lib/storyflow/settings.ts` | `AppSettings` | **Keep as source of truth** — has `ai`, `tts`, `render` sections |
| `src/lib/storyflow/types.ts` | `AISettings` | **Delete** — replace usages with `AppSettings['ai']` (note: `AISettings` is missing `fallbackModel`, `proModel`, `proFallbackModel` fields that `AppSettings['ai']` has) |
| `src/lib/storyflow/types.ts` | `TTSSettings` | **Delete** — replace usages with `AppSettings['tts']` |
| `src/lib/storyflow/types.ts` | `RenderSettings` | **Delete** — replace usages with `AppSettings['render']` |
| `src/lib/storyflow/types.ts` | `ProjectSettings` | **Refactor** — this is a per-project override (has `id`, `projectId`, TTS fields, music). Make it `{ id: string; projectId: string } & Partial<AppSettings['tts']> & { musicTrackId?: string; musicVolume?: number }` or keep as a distinct interface since it's a DB model, not a settings type |

### Duration types

Add branded types to prevent ms/seconds confusion:

```typescript
// src/lib/types/units.ts
export type Milliseconds = number & { readonly __brand: 'ms' };
export type Seconds = number & { readonly __brand: 'sec' };

export const ms = (n: number) => n as Milliseconds;
export const sec = (n: number) => n as Seconds;
export const msToSec = (n: Milliseconds) => (n / 1000) as Seconds;
export const secToMs = (n: Seconds) => (n * 1000) as Milliseconds;
```

Migrate `durationMs`, `estimatedDuration`, `actualDuration` fields to use these types. This is a gradual migration — add the types first, then convert fields file by file.

### Viewport types (3 files → 1 canonical export)

| Current location | Types | Action |
|---|---|---|
| `src/lib/types.ts` | `ViewportAnimation` | Keep |
| `src/lib/boards-types.ts` | `ViewportTrigger` | Move to `types.ts` or re-export |
| viewport-types (if exists) | `ViewportConfig`, `ViewportKeyframe` | Consolidate into `types.ts` |

**Progress 2026-01-31 (✅ Wave 8):** Settings types consolidated — `AISettings`, `TTSSettings`, and `RenderSettings` removed from `src/lib/storyflow/types.ts`; `ProjectSettings` now derives from `AppSettings` overrides. TTS uses `AppSettings['tts']` for synthesis paths. Added branded duration utilities at `src/lib/types/units.ts` (`Milliseconds`/`Seconds` with helpers) and applied to TTS segment results. Viewport + boards types are now canonicalized in `src/lib/storyflow/types.ts` (consumers import via this single source; `viewport-types.ts`/`boards-types.ts` re-export). Duration fields migrated across core services: `ScriptSegment`, `WordTimestamp`, `ViewportKeyframe`, `ViewportTrigger`, `SegmentTiming`, AI logger, boards plan service, script-builder, and viewport generation now use branded `Milliseconds`/`Seconds` types.

---

## Execution Order and Dependencies

```
Wave 0 (Agent configs)      ─── DONE. Prevents regressions during all other waves.

Wave 1 (Error handlers)     ──┐
Wave 2 (Paths)               │  No dependencies between these.
Wave 3 (Retry unification)  ──┤  Can run in parallel.
Wave 4 (TanStack Query)     ──┘

Wave 5 (Prisma extensions)  ─── Depends on Wave 1 (routes use NotFoundError)

Wave 6 (AI gateway)         ─── Depends on Wave 3 (uses unified retry)

Wave 7 (Pipeline interface) ─── Depends on Wave 5 (uses Prisma extensions)

Wave 8 (Type consolidation) ─── Independent, can run anytime
```

Wave 0 is complete. Waves 1-4 have no dependencies on each other and can be worked on in parallel. Waves 5-7 form a chain. Wave 8 is independent.

---

## Metrics to Track

After each wave, measure:

| Metric | Baseline | After W1 | After W2 | After W4 | After W5 |
|---|---|---|---|---|---|
| Routes using `withErrorHandler` | 0/48 | 48/48 | — | — | — |
| Routes with `withLogging` (to be merged) | 8/48 | 0 (merged) | — | — | — |
| `path.join(process.cwd()` outside `paths.ts` | 27 (15 files) | — | 0 | — | — |
| Components using query hooks | ~16/~80 | — | — | 30+/~80 | — |
| `storyflowPrisma.project.findUnique` direct calls | 15+ | — | — | — | <3 |
| Retry implementations | 2 | — | — | — | 1 |

> **Note:** Columns are measurement checkpoints, not sequential gates. Waves 1-4 can proceed in parallel.

---

## Principles

1. **No new dependencies.** TanStack Query and fs-extra are already installed. Prisma extensions are built-in. Everything else is custom code under 100 lines.
2. **Each wave is a standalone PR.** No wave requires another to be merged first (except where noted). Each delivers value independently.
3. **Adopt before abstracting.** Waves 1-4 are about using what already exists. Only Waves 5-7 create new abstractions.
4. **Test what you touch.** Run existing tests for touched files. Add tests only if a route had no test AND the migration changes behavior. Don't add tests for test's sake, but don't break existing ones.
5. **Leave working code alone.** If a route has no validation and doesn't need it, don't add validation just for consistency. Only apply patterns where they eliminate real duplication.
6. **Rollback strategy.** Each batch within a wave is a separate commit. If a batch introduces regressions, revert the commit.
7. **Error message safety.** For non-`ApiError` exceptions, `withErrorHandler` should return a generic message in production and the real error message only in development (`process.env.NODE_ENV === 'development'`).

---

## Known Limitations

These were pre-existing issues documented during planning. Items 1 and 2 have been resolved:

1. ~~**`parseQuery` drops array params.**~~ **Resolved.** `parseQuery` now collects duplicate query keys into arrays while keeping single values as strings for backward compatibility.
2. ~~**`ensureProjectDirs()` uses synchronous fs.**~~ **Resolved.** `ensureProjectDirs` is now async, using `fs.promises.mkdir`, `fs.promises.access`, and `fs.promises.writeFile`. All callers updated to `await`.
3. **Error message leakage.** The current `handleApiError` in `app/api/lib/errors.ts` returns raw `error.message` for all unhandled errors (line 159). Wave 1 should fix this as part of the `withErrorHandler` merge (see Principle 7).
