# Automated Regression Test Plan

Date: January 31, 2026
Source: `docs/regression-checklist.md`

## Decisions

| Decision | Choice |
|----------|--------|
| E2E framework | Playwright (Chromium only) |
| E2E strategy | Full sanity sequence, mock all external services, seeded SQLite DB |
| node:test migration | Yes — swap + refactor to Vitest conventions |
| Priority order | API routes first, then hooks/components, then business logic, then E2E |
| Test organization | Grouped by domain (one test file per domain) |
| Test data | Centralized factories in `src/test/factories/` |
| Coverage target | Pragmatic ~70% (all routes, critical logic, main component flows) |
| CI | Not included (separate effort) |
| Auth | Skipped (not implemented) |
| Concurrency | Skipped (deprioritized) |
| Wave structure | 5 medium waves, each independently shippable |
| Plan detail level | Domain + guidance (exact test cases omitted; patterns and scenarios described) |

## Checklist Coverage Map

Items from `docs/regression-checklist.md` mapped to waves. Items marked `SKIP` are out of scope.

| Checklist Section | Wave | Strategy |
|---|---|---|
| Environment & Configuration | 1 (factories seed env) | Factory defaults + env mock |
| Auth & Permissions | SKIP | Not implemented |
| Project Lifecycle | 2 (API) + 3 (components) + 5 (E2E) | Route tests + component tests + E2E flow |
| Topic Refinement | 2 (API) + 3 (components) | AI route mock + component error/reset |
| Script Generation | 2 (API) + 3 (components) | Validation, persistence, dedup |
| TTS + Emphasis | 2 (API) + 4 (integration) | TTS route + service layer mock |
| Assets Management | 2 (API) + 3 (components) | Upload validation, search, type checks |
| Boards Pipeline (all 7 steps) | 2 (API) + 4 (integration) + 5 (E2E) | Route tests + pipeline integration + E2E |
| Concurrency & Cache | SKIP | Deprioritized |
| Timeline Preview | 4 (integration) + 5 (E2E) | Timeline builder unit + E2E scrub |
| Render | 2 (API) + 5 (E2E) | Route tests + E2E render start/progress |
| API & Error Handling | 2 (API) | withErrorHandler 400/404/409/503 for all routes |
| Persistence & Paths | 1 (migration) | Refactored paths.test.ts covers this |
| Queries & Caching | 3 (hooks) | All 13 TanStack Query hooks |
| Accessibility & UI Polish | 5 (E2E) | axe-core audit on all page routes |
| Observability & Logs | 4 (integration) | AiLogger unit tests (refactored from node:test) |
| Regression Smoke (CLI Removed) | 5 (E2E) | Playwright checks no dead CLI links |

---

## Wave 1: Foundation & Infrastructure

**Goal**: Set up all shared test infrastructure so Waves 2–5 can be implemented without blockers.

### 1.1 Install Playwright ✅

Add `@playwright/test` as a dev dependency. Create `playwright.config.ts` at the repo root:

- **Base URL**: `http://localhost:3000`
- **Web server**: `npm run web:dev` (auto-start before tests)
  - `reuseExistingServer: true` — reuse an already-running dev server to avoid port conflicts
  - `url: "http://localhost:3000/api/settings"` — health check endpoint (waits until server responds)
- **Projects**: Chromium only (Desktop Chrome)
- **Test directory**: `e2e/`
- **Retries**: 1 on CI, 0 locally
- **Timeout**: 30s per test, 5s per action
- **Screenshots**: on failure only
- **Trace**: retain on first retry

Add npm scripts:
- `test:e2e` — run Playwright tests
- `test:e2e:ui` — Playwright UI mode
- `test:e2e:debug` — headed + debug

Add `e2e/` to `tsconfig.json` includes. Add `test-results/`, `playwright-report/`, `*.test.db` to `.gitignore`.

### 1.2 Centralized Test Factories ✅

Create `src/test/factories/` with builder functions that return valid, realistic test data for every core domain model. Each factory returns a plain object matching the Prisma/Zod types from `src/lib/types.ts`, `src/lib/boards-types.ts`, `src/lib/storyflow/types.ts`, and the Prisma schema.

**Files to create:**

| File | Factories | Source Types |
|------|-----------|-------------|
| `src/test/factories/project.ts` | `buildProject()`, `buildProjectWithScript()`, `buildProjectWithAssets()` | `Project` from Prisma, `ProjectStatus` enum |
| `src/test/factories/script.ts` | `buildScript()`, `buildSegment()`, `buildBlueprint()`, `buildScriptDraft()` | `Script`, `Segment`, `Blueprint`, `ScriptDraft` |
| `src/test/factories/board.ts` | `buildBoard()`, `buildBoardPlan()`, `buildBoardRegion()`, `buildViewportTrigger()` | `Board`, `BoardPlan`, `BoardRegion`, `ViewportTrigger` |
| `src/test/factories/asset.ts` | `buildAsset()`, `buildAudioAsset()`, `buildImageAsset()` | `Asset` from Prisma |
| `src/test/factories/timeline.ts` | `buildTimeline()`, `buildTimelineSegment()`, `buildBackgroundElement()`, `buildTextElement()`, `buildAudioElement()` | Timeline schemas from `src/lib/types.ts` |
| `src/test/factories/viewport.ts` | `buildViewport()`, `buildViewportAnimation()`, `buildViewportKeyframe()` | Viewport schemas from `src/lib/viewport-types.ts` |
| `src/test/factories/ai.ts` | `buildAiCallContext()`, `buildAiCallResult()`, `buildGeminiResponse()` | `AiCallContext`, `AiCallResult` from ai-logger |
| `src/test/factories/render.ts` | `buildRender()` | `Render` from Prisma |
| `src/test/factories/index.ts` | Re-export all factories | — |

**Pattern**: Each factory uses an `overrides` parameter so tests can customize only the fields they care about. Fields must match the actual Prisma model:

```typescript
export function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: createId(),           // cuid
    name: "Test Project",
    topic: null,              // optional
    status: "DRAFT",
    aspectRatio: "16:9",
    createdAt: new Date(),
    updatedAt: new Date(),
    assetMappings: null,      // Json, optional
    ...overrides,
  };
}
```

**ProjectStatus values** (all 9 must be covered in tests): `DRAFT`, `SCRIPT_READY`, `ASSETS_READY`, `VIEWPORT_READY`, `BOARDS_READY`, `RENDER_READY`, `RENDERING`, `COMPLETED`, `ERROR`.

### 1.3 Expand MSW Handlers ✅

The current `src/test/mocks/handlers.ts` only covers 5 endpoints. Expand it to cover all API domains needed by component and hook tests. Group handlers by domain in separate files, then aggregate in the main handlers file:

| File | Endpoints Covered |
|------|-------------------|
| `src/test/mocks/handlers/projects.ts` | `/api/projects`, `/api/projects/:id`, `/api/projects/:id/mappings`, `/api/projects/:id/timeline`, `/api/projects/:id/viewport`, `/api/projects/:id/music` |
| `src/test/mocks/handlers/script-builder.ts` | All 14 script-builder routes |
| `src/test/mocks/handlers/boards.ts` | All 8 boards routes (URL pattern: `/api/projects/:id/boards/*`) |
| `src/test/mocks/handlers/assets.ts` | `/api/assets/*` (5 routes) |
| `src/test/mocks/handlers/tts.ts` | `/api/tts/*` (3 routes) |
| `src/test/mocks/handlers/ai.ts` | `/api/ai/*` (3 routes) |
| `src/test/mocks/handlers/ai-logs.ts` | `/api/projects/:id/ai-logs/*` (3 routes) |
| `src/test/mocks/handlers/render.ts` | `/api/render/*` (2 routes) |
| `src/test/mocks/handlers/discover.ts` | `/api/discover`, `/api/discover/generalize` (2 routes) |
| `src/test/mocks/handlers/settings.ts` | `/api/settings` |
| `src/test/mocks/handlers/index.ts` | Aggregate all handlers |

Handlers are organized by **domain**, not by URL structure. For example, board routes live at `/api/projects/:id/boards/*` in the app, but their MSW handlers go in `handlers/boards.ts` since they belong to the boards domain.

Each handler should use factories from `src/test/factories/` for response data. Handlers should be individually importable so tests can override defaults with `server.use()`.

**`onUnhandledRequest` escalation**: Start with `"warn"` during development (default in `src/test/setup.ts`). Once all handlers are in place after Wave 2, switch to `"error"` so unhandled requests fail tests — this prevents silent regressions when new API routes are added without corresponding MSW handlers.

### 1.4 E2E Seed Database ✅

Create `e2e/fixtures/seed.ts` — a script that populates a test SQLite database with project data at various pipeline stages. This is used by Playwright's `globalSetup` to prepare the database before E2E tests run.

**Database isolation**: E2E tests use a separate SQLite database file at `e2e/fixtures/test.db`. Override via environment variable in `playwright.config.ts`:

```typescript
// playwright.config.ts
export default defineConfig({
  // ...
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run web:dev",
    url: "http://localhost:3000",
    env: {
      STORYFLOW_DATABASE_URL: "file:./e2e/fixtures/test.db",
    },
  },
});
```

The seed script should use the same `STORYFLOW_DATABASE_URL` override to write to the test database.

**Seed data** (covers all 9 ProjectStatus values):
- `project-draft` — status DRAFT, no artifacts
- `project-scripted` — status SCRIPT_READY, has script segments
- `project-assets` — status ASSETS_READY, has TTS audio + images
- `project-viewport` — status VIEWPORT_READY, has viewport.json
- `project-boards` — status BOARDS_READY, has board plan/regions/triggers/viewport
- `project-renderable` — status RENDER_READY, has timeline + viewport
- `project-rendering` — status RENDERING, has render job in progress
- `project-completed` — status COMPLETED, has rendered video
- `project-error` — status ERROR, has error metadata

Create `e2e/fixtures/artifacts/` with minimal fixture files (tiny MP3, small JPEG, JSON artifacts) so E2E tests can verify file presence without generating real media.

### 1.5 Migrate node:test Files to Vitest ✅

Migrate all 7 node:test files to Vitest, refactoring each to use the new factory/pattern conventions. After migration, remove the `exclude` entries from `vitest.config.ts` and remove the individual `test:schema`, `test:timeline`, etc. npm scripts (consolidate to `test:vitest`).

**Migration mapping:**

| Source (node:test) | Target (Vitest) | Refactor Notes |
|---|---|---|
| `tests/schema.test.ts` | `src/test/lib/schema.test.ts` | Use `expect()` instead of `assert`, use factories for test data |
| `tests/timeline.test.ts` | `src/test/lib/timeline.test.ts` | Replace inline fixtures with `buildTimeline()` / `buildTimelineSegment()` |
| `tests/word-timing.test.ts` | `src/test/lib/word-timing.test.ts` | Replace `assert.strictEqual` with `expect().toBe()` |
| `tests/boards-build.test.ts` | `src/test/lib/boards-build.test.ts` | **Note**: This is a standalone async script (not node:test), using raw `assert` and `process.exit(1)`. Requires full restructuring into `describe`/`it` blocks, replacing `assert` with `expect()`, using board factories, and mocking file system reads + `sharp` |
| `src/lib/__tests__/stage-invalidation.test.ts` | `src/test/lib/stage-invalidation.test.ts` | Use `describe/it` blocks, project factories |
| `src/lib/storyflow/__tests__/workflow-state.test.ts` | `src/test/lib/workflow-state.test.ts` | Refactor to Vitest matchers |
| `src/lib/services/ai/__tests__/ai-logger.test.ts` | `src/test/lib/ai-logger.test.ts` | Use AI factories for test data |
| `remotion/lib/__tests__/music-ducking.test.ts` | `src/test/lib/music-ducking.test.ts` | Pure function — straightforward swap |

After migration, update the `test` npm script to just `vitest run` (single command runs everything).

### 1.6 Acceptance Criteria — Wave 1

- [x] `npm run test:vitest` runs all migrated + existing tests (no node:test scripts remain)
- [x] `npm run test:e2e` starts the dev server and runs a placeholder Playwright smoke test
- [x] Factories are importable: `import { buildProject } from "@/src/test/factories"`
- [x] MSW handlers cover all API domains; `src/test/mocks/handlers.ts` aggregates them
- [x] E2E seed script creates test database with 9 projects (one per ProjectStatus) at different stages
- [x] No regressions in existing tests

---

## Wave 2: API Route Tests 🔄

**Goal**: Test all 51 API routes for correct behavior, error handling, and input validation. Every route must verify that `withErrorHandler` catches errors and returns the correct HTTP status codes.

### 2.1 Test File Structure

Create one test file per API domain, colocated with the routes:

| Test File | Routes Covered | Key Scenarios |
|---|---|---|
| `app/api/projects/__tests__/route.test.ts` | (already exists — extend) `/api/projects` GET/POST, `/api/projects/[id]` GET/PATCH/DELETE | Create with valid/invalid data, list pagination, update status transitions, delete cascades |
| `app/api/projects/__tests__/mappings.test.ts` | `/api/projects/[id]/mappings` | CRUD mappings, validate mapping references exist |
| `app/api/projects/__tests__/timeline.test.ts` | `/api/projects/[id]/timeline` | Build timeline, missing artifacts error, rebuild after edits |
| `app/api/projects/__tests__/viewport.test.ts` | `/api/projects/[id]/viewport` | Get/set viewport, validate viewport schema |
| `app/api/projects/__tests__/music.test.ts` | `/api/projects/[id]/music` | Set music track + volume, clear music |
| `app/api/projects/__tests__/storyboard.test.ts` | `/api/projects/[id]/storyboard` | Storyboard stage handling |
| `app/api/projects/__tests__/media.test.ts` | `/api/projects/[id]/media/stage` | Media stage handling |
| `app/api/projects/__tests__/script.test.ts` ✅ | `/api/projects/[id]/script/stage` | Script stage handling |
| `app/api/script-builder/__tests__/routes.test.ts` ✅ | All 14 script-builder routes | Blueprint CRUD + history/review/regenerate/approve, draft CRUD + history, execution start/status/resume, beat regeneration, glue analysis, polish, segment |
| `app/api/projects/__tests__/boards.test.ts` ✅ | All 8 boards routes (actual path: `/api/projects/[id]/boards/*`) | Board CRUD, plan generation, prompts, regions, triggers, viewport, image upload |
| `app/api/assets/__tests__/routes.test.ts` | All 5 asset routes | Upload (valid types, oversized, disallowed), import, search, upscale, delete |
| `app/api/tts/__tests__/routes.test.ts` ✅ | All 3 TTS routes | Generate single, generate-all batch, emphasis analysis |
| `app/api/ai/__tests__/routes.test.ts` ✅ | All 3 AI routes | Script generation, refinement, viewport AI |
| `app/api/render/__tests__/routes.test.ts` ✅ | Both render routes | Start render, poll status, handle missing artifacts |
| `app/api/settings/__tests__/route.test.ts` ✅ | `/api/settings` | Get settings, update settings, validate setting values |
| `app/api/projects/__tests__/ai-logs.test.ts` ✅ | All 3 AI log routes (actual path: `/api/projects/[id]/ai-logs/*`) | List logs, get log detail, stream logs |
| `app/api/discover/__tests__/routes.test.ts` ✅ | Both discover routes | Discover, generalize |
| `app/api/music/__tests__/routes.test.ts` ✅ | `/api/music/library` | Search with query, empty query, pagination |

### 2.2 Testing Pattern

Every API route test follows this structure:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
// Mock Prisma before importing the route handler
vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: { /* mock methods */ },
}));
// Mock AI gateway for AI-dependent routes
vi.mock("@/src/lib/services/ai/ai-gateway", () => ({
  aiGenerate: vi.fn(),
}));

import { GET, POST } from "../route";
import { buildProject } from "@/src/test/factories";

describe("POST /api/projects", () => {
  it("creates project with valid data", async () => { /* ... */ });
  it("returns 400 for invalid body (ValidationError)", async () => { /* ... */ });
  it("returns 404 when project not found (NotFoundError)", async () => { /* ... */ });
  it("returns 409 for invalid status transition (ConflictError)", async () => { /* ... */ });
  it("returns 503 when AI service unavailable (ServiceUnavailableError)", async () => { /* ... */ });
});
```

**Prisma mock shape**: The `storyflowPrisma` export is a Prisma client extended with custom model methods (e.g., `project.findByIdOrThrow`). When mocking it, each test must include both:
1. **Custom extension methods** used by the route (`findByIdOrThrow`, `findWithScript`, `findWithAssets`, `updateStatus`, `findByProjectIdOrThrow`)
2. **Standard Prisma delegates** used by the route (`appSettings.findMany`, `board.findMany`, `render.create`, `viewport.upsert`, `aiCallLog.findMany`, `$transaction`, etc.)

Only mock what the specific route-under-test actually calls. Reference table for routes needing standard delegates beyond the extension methods:

| Route domain | Standard delegates needed |
|---|---|
| Settings | `appSettings.findMany`, `appSettings.upsert`, `$transaction` |
| Boards | `board.findMany`, `board.create`, `board.findFirst`, `board.update`, `board.count` |
| Viewport | `viewport.findUnique`, `viewport.upsert` |
| AI Logs | `aiCallLog.findMany`, `aiCallLog.findUnique`, `aiCallLog.count`, `aiCallLog.groupBy`, `aiCallLog.aggregate` |
| Render | `render.findFirst`, `render.create`, `render.update`, `render.findUnique` |
| TTS | `script.findUnique` (via `findByProjectIdOrThrow` extension) |

**SSE streaming test pattern** (for `/api/projects/[id]/ai-logs/stream`):

```typescript
it("streams AI log events as SSE", async () => {
  const req = new Request("http://localhost:3000/api/projects/test-id/ai-logs/stream");
  const response = await GET(req, { params: Promise.resolve({ id: "test-id" }) });

  expect(response.headers.get("content-type")).toBe("text/event-stream");
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const { value } = await reader.read();
  const chunk = decoder.decode(value);
  expect(chunk).toContain("data:");
});
```

**Multipart upload test pattern** (for `/api/projects/[id]/boards/upload-image`):

```typescript
it("uploads image via FormData", async () => {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(100)], { type: "image/jpeg" }), "test.jpg");
  formData.append("boardId", "board-1");

  const req = new Request("http://localhost:3000/api/projects/test-id/boards/upload-image", {
    method: "POST",
    body: formData,
  });
  const response = await POST(req, { params: Promise.resolve({ id: "test-id" }) });
  expect(response.status).toBe(200);
});
```

### 2.3 Scenarios Per Domain

**Projects** — Create with all 4 aspect ratios, update metadata, status transitions covering all 9 states (DRAFT → SCRIPT_READY → ASSETS_READY → VIEWPORT_READY → BOARDS_READY → RENDER_READY → RENDERING → COMPLETED, plus ERROR from any state), reject invalid transitions (e.g., DRAFT → COMPLETED), delete removes project and cascades.

**Script Builder** — Blueprint create/approve/reject/regenerate lifecycle, draft CRUD and history, execution start/poll/resume, beat regeneration, glue analysis parsing, polish operation. Validate empty prompt rejection.

**Boards** — Board CRUD, plan generation (segment→board grouping), prompt generation, image upload (valid types/oversize), region detection response shape, trigger generation, viewport build (success + missing artifact error).

**Assets** — Upload with allowed MIME types (image/jpeg, image/png, image/webp, audio/mpeg, video/mp4), reject disallowed types, reject oversize files, stock search with query params, import from URL, upscale request, delete asset.

**TTS** — Single segment generation, batch generation (generate-all), emphasis analysis response shape. Mock Google TTS API responses.

**AI** — Script generation, topic refinement, viewport AI. Mock `aiGenerate()` to return factory data. Verify prompt construction and schema validation.

**Render** — Start render job, poll status (pending/running/completed/failed), handle missing timeline/viewport gracefully.

**Settings** — Get current settings, update AI model preference, validate setting schema.

### 2.4 Acceptance Criteria — Wave 2

- [x] Every API route file (`app/api/**/route.ts`) has a corresponding test
- [x] Each test verifies at least: happy path, ValidationError (400), and NotFoundError (404)
- [x] AI-dependent routes mock `aiGenerate()` and verify it was called with correct operation/schema
- [x] No route test requires network access or real database
- [x] All tests pass with `npm run test:vitest`

---

## Wave 3: Hooks & Components

**Goal**: Test all TanStack Query hooks and critical UI components for data fetching, mutation, loading/error states, form validation, and user interactions.

### 3.1 TanStack Query Hook Tests

Create/extend test files in `src/hooks/queries/__tests__/`:

| Test File | Hook(s) | Key Scenarios |
|---|---|---|
| `use-projects.test.tsx` ✅ | (extend existing) | List projects, get single project, create mutation + cache invalidation, update mutation, delete mutation |
| `use-boards.test.tsx` ✅ | `useBoards`, `useBoardPlan`, `useBoardPrompts`, `useBoardRegions`, `useBoardTriggers`, `useBoardViewport` | Fetch boards for project, plan mutation, prompts mutation, region/trigger mutations, viewport build |
| `use-assets.test.tsx` ✅ | `useAssets`, `useUploadAsset`, `useDeleteAsset` | List assets, upload triggers invalidation, delete removes from cache |
| `use-music-library.test.tsx` ✅ | `useMusicLibrary` | Search with debounce, empty results, pagination |
| `use-render.test.tsx` ✅ | `useRender`, `useStartRender` | Fetch render status, start render mutation, poll status with refetchInterval |
| `use-tts.test.tsx` ✅ | `useTts`, `useGenerateTts`, `useGenerateAllTts`, `useAnalyzeEmphasis` | Single generation, batch generation, emphasis analysis |
| `use-viewport.test.tsx` ✅ | `useViewport` | Fetch viewport, update viewport |
| `use-execution-status.test.tsx` ✅ | `useExecutionStatus` | Poll status, handle completion, handle failure |
| `use-ai-logs.test.tsx` ✅ | `useAiLogs`, `useAiLogDetail` | List with filters, get detail, stream (if applicable) |
| `use-asset-search.test.tsx` ✅ | `useAssetSearch` | Search stock media, provider-specific results |
| `use-mappings.test.tsx` ✅ | `useMappings` | Get mappings, update mapping |
| `use-ai.test.tsx` ✅ | `useAi` hooks | AI operation hooks |
| `use-pipeline.test.tsx` ✅ | `usePipeline` hooks | Pipeline stage operations |

**Pattern**: Each hook test uses `renderHook()` with the `QueryClientProvider` wrapper from `src/test/utils.tsx`, spy on the API client function from `src/lib/api/`, and verify cache behavior after mutations.

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import * as projectsApi from "@/src/lib/api/projects";
import { useProjects } from "../use-projects";
import { buildProject } from "@/src/test/factories";
import { createQueryWrapper } from "@/src/test/utils";

it("fetches projects and exposes data", async () => {
  vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue([buildProject()]);
  const { result } = renderHook(() => useProjects(), {
    wrapper: createQueryWrapper(),
  });
  await waitFor(() => expect(result.current.data).toHaveLength(1));
});
```

> **Note**: `renderHook` is imported directly from `@testing-library/react` (it is also re-exported by `src/test/utils.tsx` via `export *`). The `createQueryWrapper()` helper from `src/test/utils.tsx` provides the `QueryClientProvider` wrapper needed for hook tests. If `createQueryWrapper` doesn't exist yet, add it to `src/test/utils.tsx` alongside the existing `renderWithProviders`.

### 3.2 Component Tests

Create test files colocated with components in `__tests__/` directories:

| Test File | Component | Key Scenarios |
|---|---|---|
| `components/projects/__tests__/topic-refinement.test.tsx` ✅ | `TopicRefinement` | Enter title+description, submit triggers AI call, display refined result, "Start Over" resets state, AI error shows toast and preserves inputs |
| `components/script-builder/__tests__/script-builder-workflow.test.tsx` ✅ | `ScriptBuilderWorkflow` | Multi-phase workflow rendering, phase transitions, segment display, edit + save |
| `components/script-builder/__tests__/glue-phase.test.tsx` ✅ | `GluePhase` | Glue analysis display, approve/reject actions |
| `components/boards/__tests__/boards-workflow.test.tsx` ✅ | `BoardsWorkflow` | Step navigation (config → plan → prompts → upload → regions → triggers → viewport), step completion gating |
| `components/boards/__tests__/board-planner-wizard.test.tsx` ✅ | `BoardPlannerWizard` | Duration/style config, save persistence |
| `components/boards/__tests__/image-uploader.test.tsx` ✅ | `ImageUploader` | Upload image, preview, replace, missing image warning |
| `components/assets/__tests__/music-library.test.tsx` ✅ | (extend existing) | Search execution, preview audio, track selection, volume control, persistence after remount |
| `components/assets/__tests__/music-settings.test.tsx` ✅ | `MusicSettings` | Volume slider, track selection save |
| `components/media/__tests__/media-manager.test.tsx` ✅ | `MediaManager` | Upload tab: accept/reject file types, progress indicator. Stock tab: search + select |
| `components/media/__tests__/stock-search.test.tsx` ✅ | `StockSearch` | Search submission, result display, select image |
| `components/render/__tests__/render-panel.test.tsx` ✅ | `RenderPanel` | Quality preset selection, start render button, progress display, download link on completion |
| `components/video/__tests__/video-preview.test.tsx` ✅ | `VideoPreview` | Timeline loads, captions display, missing asset placeholder |
| `components/pipeline/__tests__/pipeline-stepper.test.tsx` ✅ | `PipelineStepper` | Stage progression display, current stage highlight, click navigation |
| `components/pipeline/__tests__/stage-gate.test.tsx` ✅ | `StageGate` | Blocks content when prerequisites unmet, shows content when met |

**Pattern**: All component tests use `renderWithProviders()` from `src/test/utils.tsx` and `userEvent` for interactions. Mock API client functions via `vi.spyOn()`. Assert on screen content, not implementation details.

### 3.3 Form Validation Tests

For components with forms (topic refinement, script generation, music settings, upload zone):

- Empty required fields show inline error on submit
- Submit button disabled during async operation
- Success shows toast/indicator
- Failure shows error toast without clearing user input

### 3.4 Acceptance Criteria — Wave 3

- [x] All 13 query hook files have corresponding tests
- [x] Each hook test verifies: initial loading state, data fetch, mutation + cache invalidation, error state
- [x] Critical components (topic-refinement, script-builder, boards-workflow, render-panel, media-manager) have test coverage
- [x] Form validation covered for all user-input forms
- [x] All tests pass with `npm run test:vitest`

---

## Wave 4: Business Logic & Integration

**Goal**: Test service-layer logic, pipeline integration flows, and cross-module interactions that aren't covered by isolated route or component tests.

### 4.1 AI Service Layer

| Test File | Module | Key Scenarios |
|---|---|---|
| `src/test/services/ai-gateway.test.ts` | `aiGenerate()` | Successful generation, retry on transient failure, schema validation failure, model fallback, timeout handling |
| `src/test/services/gemini-wrapper.test.ts` | `runGemini()` | CLI invocation with correct args, model selection from settings, fallback model on failure, token parsing from output |
| `src/test/services/gemini-parser.test.ts` | `parseGeminiOutput()` | Valid JSON extraction, markdown-wrapped JSON, malformed JSON recovery, empty response handling |

Mock `child_process.execFile` for `runGemini()` tests — never invoke the real Gemini CLI. Mock `aiLogger.wrap()` to verify logging calls without database.

### 4.2 TTS Service Layer

| Test File | Module | Key Scenarios |
|---|---|---|
| `src/test/services/tts.test.ts` | TTS generation functions | Single segment generation (mock Google TTS HTTP), batch generation (all segments), word timestamp parsing, audio file write verification, transient error does not delete existing audio |

Mock `fetch()` or the Google TTS client. Verify correct file paths via `paths.ts` helpers.

### 4.3 Boards Pipeline Integration

| Test File | Module | Key Scenarios |
|---|---|---|
| `src/test/integration/boards-pipeline.test.ts` | Plan → Prompts → Regions → Triggers → Viewport | Full pipeline: plan groups segments into boards (counts match), prompts generated per board, regions detected per board image, triggers align words to regions, viewport.json structure validates against schema |

This extends the migrated `boards-build.test.ts` with more comprehensive scenarios. Mock AI calls (`aiGenerate`) at each step. Verify data flows correctly between pipeline stages.

### 4.4 Timeline Builder

| Test File | Module | Key Scenarios |
|---|---|---|
| `src/test/integration/timeline-builder.test.ts` | `timeline-builder.ts` | Assemble timeline from script + TTS + assets + viewport, segment ordering, duration calculation, missing optional music handled, missing required artifacts throw |

Use factories for all input data. Verify output matches `TimelineSchema`.

### 4.5 File Path & Persistence

Extend the migrated `paths.test.ts`:
- All artifact subdirectories created by `ensureProjectDirs()`
- `getProjectPaths()` returns correct paths for every artifact type
- Path helpers work on both Unix and Windows-style paths (if applicable)
- Cleaning a project removes only its artifacts

### 4.6 Storyflow Business Logic

| Test File | Module | Key Scenarios |
|---|---|---|
| `src/test/lib/build-utils.test.ts` | `build-utils.ts` | Build validation, prerequisite checking |
| `src/test/lib/viewport-utils.test.ts` | (extend existing) | Additional viewport state calculations if gaps found |
| `src/test/lib/config.test.ts` | `config.ts` | Configuration loading, defaults, validation |

### 4.7 Acceptance Criteria — Wave 4

- [x] AI gateway tests mock CLI execution and verify retry/fallback/timeout behavior
- [ ] TTS tests verify file writes and timestamp parsing without hitting Google API
- [ ] Boards pipeline integration test covers all 7 steps end-to-end (with mocked AI)
- [ ] Timeline builder test assembles a complete timeline from factory data
- [ ] All tests pass with `npm run test:vitest`

---

## Wave 5: E2E & Accessibility

**Goal**: Playwright tests covering the full user-visible sanity sequence and accessibility compliance.

### 5.1 Playwright Infrastructure

**Files to create:**

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Main config (Chromium, base URL, web server, timeouts) |
| `e2e/fixtures/seed.ts` | (from Wave 1) Database + artifact seeding |
| `e2e/fixtures/artifacts/` | Minimal test files (1KB MP3, 1KB JPEG, JSON stubs) |
| `e2e/helpers/mock-routes.ts` | Playwright `page.route()` interceptors for external services (Gemini CLI responses, Google TTS, Pixabay API) |
| `e2e/helpers/selectors.ts` | Shared page object selectors/locators for common UI elements |
| `e2e/global-setup.ts` | Seed database + create artifact directories before all tests |
| `e2e/global-teardown.ts` | Clean up test database and artifacts |

### 5.2 E2E Route Mocking

Intercept all external service calls at the network level using Playwright's `page.route()`:

| Service | Mock Strategy |
|---------|---------------|
| Gemini CLI | Not network-based (CLI). Mock by setting a test env var that swaps `runGemini()` to return fixture data, OR intercept the API routes that call it (`/api/ai/*`, `/api/script-builder/*`, `/api/boards/*/prompts`, etc.) |
| Google TTS | Intercept `https://texttospeech.googleapis.com/*` → return fixture MP3 bytes |
| Pixabay | Intercept `https://pixabay.com/api/*` → return fixture search results |
| Pexels/Unsplash | Intercept their API URLs → return fixture results |

For Gemini CLI (not HTTP-based), the recommended approach is to mock at the API route level: intercept `/api/ai/*` and return pre-built responses. This avoids needing to mock the CLI binary.

### 5.3 Full Sanity Sequence Test

`e2e/sanity-sequence.spec.ts` — Single test file that walks through the entire user pipeline:

**Test: Create project and complete full pipeline**

1. **Navigate to `/projects/new`** — Verify page loads, form visible
2. **Create project** — Fill name, select aspect ratio (16:9), submit. Verify redirect to overview/script page. Verify project appears in project list.
3. **Topic refinement** — Enter title + description, click refine. Verify AI-generated suggestions appear. Accept refinement.
4. **Script generation** — Submit prompt (or use Script Builder if flag on). Verify segments appear in order. Verify persistence (reload page, segments still present).
5. **TTS generation** — Click "Generate All". Verify progress indicator. Verify audio segments appear per segment. Test per-segment regenerate.
6. **Media gathering** — Upload one image (fixture JPEG). Search stock media via Pixabay (mocked). Select a track from music library. Verify volume control. Verify persistence.
7. **Boards pipeline** — Navigate to storyboard/boards:
   - Config: set duration + style, save
   - Plan: verify board count matches segments
   - Prompts: verify prompts generated per board
   - Upload: attach image to a board
   - Regions: verify regions detected (mocked AI)
   - Triggers: verify word-level triggers generated
   - Viewport: build viewport, verify success indicator
8. **Build / Timeline** — Trigger timeline build (combines script + TTS + assets + viewport into `timeline.json`). Verify timeline.json is created. Verify project status advances to RENDER_READY.
9. **Preview** — Navigate to preview. Verify timeline loads (captions visible, no errors).
10. **Render** — Navigate to render page. Select quality preset. Start render. Verify progress updates. Verify completion state.

### 5.4 Page Smoke Tests

`e2e/smoke.spec.ts` — Quick test that every page route loads without errors:

```typescript
const pages = [
  "/",
  "/projects",
  "/projects/new",
  "/projects/{id}/overview",
  "/projects/{id}/script",
  "/projects/{id}/media",
  "/projects/{id}/storyboard",
  "/projects/{id}/render",
  "/settings",
];

for (const page of pages) {
  test(`${page} loads without errors`, async ({ page }) => {
    await page.goto(page.replace("{id}", seededProjectId));
    await expect(page.locator("body")).toBeVisible();
    // No uncaught errors in console
    const errors = [];
    page.on("pageerror", (e) => errors.push(e));
    expect(errors).toHaveLength(0);
  });
}
```

### 5.5 CLI Removal Regression

`e2e/no-cli-links.spec.ts` — Verify no dead CLI references in the UI:

- Navigate all pages, search for text containing "CLI", "command line", "terminal" (case-insensitive)
- Verify no links point to CLI-only routes
- Verify `npm run build` produces no dead imports referencing removed CLI modules

### 5.6 Accessibility Audit

`e2e/accessibility.spec.ts` — Run axe-core on all main page routes:

Install `@axe-core/playwright` as a dev dependency.

```typescript
import AxeBuilder from "@axe-core/playwright";

const criticalPages = ["/projects", "/projects/new", "/projects/{id}/script", "/projects/{id}/media", "/projects/{id}/storyboard", "/projects/{id}/render"];

for (const route of criticalPages) {
  test(`${route} passes WCAG AA`, async ({ page }) => {
    await page.goto(route.replace("{id}", seededProjectId));
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

This covers the checklist items: WCAG AA contrast, landmarks/aria labels, keyboard accessibility (axe checks for these).

### 5.7 Feature Flag Visibility

`e2e/feature-flags.spec.ts` — Verify that feature-flagged routes/components are hidden when the flag is off:

- With `ENABLE_SCRIPT_BUILDER=false`: Script Builder UI elements not visible on script page
- With `ENABLE_SCRIPT_BUILDER=true`: Script Builder workflow renders

This requires the E2E setup to support env var overrides between test runs (via Playwright's `use` config or test-level env).

### 5.8 Acceptance Criteria — Wave 5

- [ ] Full sanity sequence test passes end-to-end (with all external services mocked)
- [ ] All page routes load without console errors
- [ ] No CLI references found in UI
- [ ] axe-core reports zero WCAG AA violations on critical pages (or violations documented as known issues)
- [ ] Feature flag tests verify conditional rendering
- [ ] `npm run test:e2e` completes successfully

---

## Dependency Graph

```
Wave 1 (Foundation)
  ├── 1.1 Playwright setup
  ├── 1.2 Test factories
  ├── 1.3 MSW handler expansion
  ├── 1.4 E2E seed database
  └── 1.5 node:test migration
        │
        ▼
Wave 2 (API Routes) ←── depends on factories + MSW handlers
        │
        ▼
Wave 3 (Hooks & Components) ←── depends on factories + MSW handlers
        │
        ▼
Wave 4 (Business Logic) ←── depends on factories, can partially parallel with Wave 3
        │
        ▼
Wave 5 (E2E & Accessibility) ←── depends on Playwright setup + seed DB + all mocking infra
```

Waves 2 and 3 can be worked in parallel after Wave 1 completes. Wave 4 can begin once Wave 1 factories are ready. Wave 5 requires Wave 1's Playwright setup and seed database.

## Files Created/Modified Summary

### New Files (~50+)

| Category | Count | Location |
|----------|-------|----------|
| Test factories | 9 | `src/test/factories/` |
| MSW handlers | 11 | `src/test/mocks/handlers/` |
| API route tests | 18 | `app/api/**/__tests__/` |
| Hook tests | 11 (new) + 2 (extend) | `src/hooks/queries/__tests__/` |
| Component tests | 14 | `components/**/__tests__/` |
| Service/integration tests | 7 | `src/test/services/`, `src/test/integration/` |
| Migrated tests | 8 | `src/test/lib/` |
| E2E tests | 5 | `e2e/` |
| E2E infrastructure | 5 | `e2e/fixtures/`, `e2e/helpers/` |
| Config | 1 | `playwright.config.ts` |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add Playwright + axe-core deps, update test scripts |
| `vitest.config.ts` | Remove node:test exclusions after migration |
| `src/test/mocks/handlers.ts` | Refactor to import from handlers/ subdirectory |
| `src/test/setup.ts` | No changes expected (MSW lifecycle already handled) |
| `.gitignore` | Add `test-results/`, `playwright-report/`, `e2e/.auth/`, `*.test.db` |
| `tsconfig.json` | Add `e2e/` to includes |

### Deleted Files (after migration)

| File | Reason |
|------|--------|
| `tests/schema.test.ts` | Migrated to `src/test/lib/schema.test.ts` |
| `tests/timeline.test.ts` | Migrated to `src/test/lib/timeline.test.ts` |
| `tests/word-timing.test.ts` | Migrated to `src/test/lib/word-timing.test.ts` |
| `tests/boards-build.test.ts` | Migrated to `src/test/lib/boards-build.test.ts` |
| `src/lib/__tests__/stage-invalidation.test.ts` | Migrated to `src/test/lib/` |
| `src/lib/storyflow/__tests__/workflow-state.test.ts` | Migrated to `src/test/lib/` |
| `src/lib/services/ai/__tests__/ai-logger.test.ts` | Migrated to `src/test/lib/` |
| `remotion/lib/__tests__/music-ducking.test.ts` | Migrated to `src/test/lib/` |

## Out of Scope

These regression checklist items are explicitly excluded from this plan:

| Item | Reason |
|------|--------|
| Auth & Permissions | Not implemented in the app |
| Concurrency & Cache (multi-tab) | Deprioritized per decision |
| CI/CD pipeline | Separate effort |
| .env validation, Gemini CLI installation | Operational, not automatable |
| Security headers & cookies | No auth layer to test |
| Sentry/monitoring alerts | Infrastructure concern |
| Backups/restores | Operational |
| Large file handling (100MB+) | Resource-intensive, manual smoke |
| Cross-browser (Safari/Firefox) | Chromium only for now |
| Secrets redaction in logs | Requires log inspection tooling |

## Lessons Learned

### `vi.mock()` Must Use Absolute `@/` Paths (2026-02-01)

**Incident**: `components/boards/__tests__/boards-workflow.test.tsx` caused vitest worker OOM (4GB heap exhausted, 190s runtime) and was the sole failing file across the suite (266/267 tests passed, 38/39 files).

**Root cause**: `vi.mock("../editors/boards/simple-boards-editor")` resolved from `__tests__/` to a non-existent path, so vitest loaded the real `SimpleBoardsEditor` instead of the mock. The real component fired TanStack Query hooks and cascading re-renders, consuming memory unboundedly until the worker fork OOM'd.

**Fix**: Converted all 14 relative `vi.mock()` paths across 3 test files to absolute `@/` paths. Added `testTimeout: 10_000` and `hookTimeout: 10_000` to `vitest.config.ts`. Added `no-restricted-syntax` eslint rule banning `../` in `vi.mock()` selectors. Documented the convention in `CLAUDE.md`.

**Convention**: All `vi.mock()` calls must use `@/` absolute paths. This is enforced by eslint on `**/*.test.{ts,tsx}` files.
