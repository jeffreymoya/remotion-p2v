# 2026-01-30 — docs/incremental-refactoring-plan.md

## Iteration 1
- Scope/goal: Start Wave 1 Step 0 by unifying logging with error handling and migrate first routes onto the new wrapper; add streaming-safe error handling.
- Changes: 
  - Enhanced `withErrorHandler` in `app/api/lib/errors.ts` with request IDs, pino logging, duration tracking, sanitized error responses (prod hides internal messages), and requestId in responses; added shared error normalization helper.
  - Added `withStreamErrorHandler` for SSE routes emitting `event: error` on failure; wrapped AI logs stream route with it.
  - Shimmied `withLogging` to delegate to `withErrorHandler` to ease migration.
  - Migrated AI routes `app/api/ai/refine` and `app/api/ai/script` to `withErrorHandler` + `parseBody` + `NotFoundError/ServiceUnavailableError` pattern; removed inline try/catch/validation boilerplate.
- Tests: `npm run lint -- --max-warnings=0` (fails on pre-existing @ts-nocheck ban in `src/lib/board-planner.deprecated.ts`; new changes lint clean).
- Decisions/assumptions: Keep shim temporarily to avoid breaking untouched routes; defer deleting `src/lib/api-logger.ts` until migrations complete. SSE errors should surface requestId to clients for observability.
- Blockers: Existing lint failure unrelated to touched code (`@ts-nocheck` in deprecated board planner); needs follow-up or ignore for lint passes.
- Next steps: Migrate remaining 6 routes off `withLogging`, then remove shim file; apply new wrapper to all routes per Wave 1; consider fixing or excluding deprecated planner to unblock lint in CI.

## Iteration 2
- Scope/goal: Finish Wave 1 Step 0 by removing the withLogging shim and migrating remaining board routes; clear lint blocker.
- Changes:
  - Migrated board routes (`plan`, `prompts`, `regions`, `triggers`, `viewport`, `upload-image`) to `withErrorHandler` + `parseBody`/error classes; removed manual try/catch and inline validation.
  - Adopted `src/lib/paths` for all board route file paths; added `viewport/preview/final` to `ProjectPaths`; ensured boards dir creation via `ensureProjectDirs` where needed.
  - Added `withStreamErrorHandler` usage confirmed; deleted legacy `src/lib/api-logger.ts`.
  - Removed `@ts-nocheck` from `src/lib/board-planner.deprecated.ts` to satisfy lint.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Conflict errors used for missing prerequisites (plan/regions/triggers/images); validation errors for malformed regions and uploads. Kept deprecated planner otherwise untouched.
- Blockers: None outstanding for Wave 1; Wave 2+ ready to start.
- Next steps: Begin Wave 2 path migrations across remaining files or advance to Wave 3 as per plan; consider adding project path fields if new consumers arise.

## Iteration 3
- Scope/goal: Wave 1 — migrate project list/create/update/delete routes to `withErrorHandler` + `parseBody` and align tests with unified error responses.
- Changes:
  - Updated `app/api/projects/route.ts` and `app/api/projects/[id]/route.ts` to use `withErrorHandler`, `parseBody`, and `NotFoundError`; removed inline `safeParse`/try-catch patterns while preserving validation rules and project directory creation/deletion.
  - Adjusted `app/api/projects/__tests__/route.test.ts` expectations to the standardized error envelope (`error`, `code`, `details`, `requestId`) and validation error structure.
  - Annotated the incremental refactoring spec to mark the Projects CRUD batch as in progress with list/create/update/delete migrated.
- Tests: `npx vitest run app/api/projects/__tests__/route.test.ts` (pass).
- Decisions/assumptions: Retained existing schema refinements (at least one field on PATCH) and status transitions; deferred timeline/ancillary project routes to subsequent slices within the Projects batch.
- Blockers: None new; remaining project-adjacent routes (timeline, logs) still need migration.
- Next steps: Finish the Projects batch by wrapping timeline/aux project routes with `withErrorHandler`/`parseQuery` as needed, then proceed to the next domain in Wave 1.

## Iteration 4
- Scope/goal: Finish the Wave 1 Projects batch by migrating remaining project-adjacent routes to the unified error/validation wrappers.
- Changes:
  - Wrapped `app/api/projects/[id]/timeline/route.ts`, `.../viewport/route.ts`, `.../mappings/route.ts`, `.../ai-logs/route.ts`, and `.../ai-logs/[logId]/route.ts` with `withErrorHandler`; replaced inline `safeParse`/try-catch with `parseBody`/`parseQuery` and `NotFoundError` as appropriate.
  - Preserved existing behaviors (status transitions on viewport save, validation transforms on mappings, pagination/filters for AI logs) while standardizing responses and logging.
  - Updated the incremental refactoring spec to mark the Projects CRUD batch as ✅ complete.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: AI log query validation now uses `parseQuery` with the same Zod schema; kept custom date validation and pagination bounds. Viewport creation still advances status when prerequisites met.
- Blockers: None.
- Next steps: Continue Wave 1 with the next domain (e.g., TTS or script-builder routes) using the same wrapper/validation pattern.

## Iteration 5
- Scope/goal: Wave 1 — migrate TTS domain routes to the unified error/validation/logging wrapper.
- Changes:
  - `app/api/tts/generate/route.ts`: switched to `withErrorHandler` + `parseBody`; use `NotFoundError` for missing script/segment; removed manual try/catch.
  - `app/api/tts/generate-all/route.ts`: GET now uses `withStreamErrorHandler` and `parseQuery`; POST uses `withErrorHandler` + `parseBody`; `NotFoundError` for missing script; removed ad-hoc error handling while preserving SSE progress behavior.
  - `app/api/tts/analyze-emphasis/route.ts`: wrapped with `withErrorHandler` + `parseBody`; removed console-based error handling.
  - Updated spec to mark the TTS batch ✅.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Non-stream POST responses remain JSON; SSE stream keeps in-stream error events while wrapper handles outer errors. Validation semantics unchanged (boolean flags coerced via query schema).
- Blockers: None.
- Next steps: Proceed to the next Wave 1 domain (e.g., script-builder routes) or begin Wave 2 path migrations.

## Iteration 6
- Scope/goal: Wave 1 — migrate Script Builder blueprint routes to the unified error/validation wrapper.
- Changes:
  - `app/api/script-builder/blueprint/route.ts`: now uses `withErrorHandler` + `parseBody`; `NotFoundError` for missing project; retains beat count and history recording.
  - `app/api/script-builder/blueprint/[id]/approve|review|history|regenerate/route.ts`: wrapped with `withErrorHandler`; validation via `parseBody` where applicable; `NotFoundError` for missing blueprint; removed inline try/catch responses while preserving review/regeneration logic and history tracking.
  - Spec updated to mark Script Builder batch as 🔄 with blueprint subset migrated.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Blueprint review keeps rejection note aggregation; regeneration defaults to stored rejection notes when not provided. No behavior changes beyond standardized errors/logging.
- Blockers: Remaining Script Builder routes (draft/execute/segment/beat) still pending migration.
- Next steps: Finish remaining Script Builder routes or advance Wave 2 path migrations.

## Iteration 7
- Scope/goal: Wave 1 — migrate Assets routes to unified error/logging wrapper and adopt path utils for upscale job.
- Changes:
  - Wrapped assets endpoints (`upload`, `import`, `[id]` delete, `upscale`, `search`) with `withErrorHandler`/`parseBody` patterns; mapped validation/not-found/service errors to ApiError classes; deprecated search now logs via wrapper.
  - Assets upload/import now raise structured validation errors; import uses `ensureProjectDirs`; upscale job translates service availability and validation issues into typed errors.
  - Upscale pipeline now uses `getPublicDir` instead of manual `process.cwd()` path joins.
  - Spec updated to mark Assets batch ✅ under Wave 1.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept asset status bump (to ASSETS_READY) semantics; preserved existing metadata extraction behavior; validated form-data without altering limits.
- Blockers: None for Wave 1 assets.
- Next steps: Continue Wave 1 with remaining domains (AI/render/music/settings/discover) or pick Script Builder remaining routes; begin Wave 2 path migrations if preferred.

## Iteration 8
- Scope/goal: Continue Wave 1 by migrating remaining AI/render/music routes to unified error/logging/validation wrapper.
- Changes:
  - `app/api/ai/viewport`: uses `withErrorHandler` + `parseBody`; standardized error handling while delegating to viewport generator.
  - Render routes: `render/start` and `render/[id]/status` now wrapped; status throws `NotFoundError` when missing.
  - Music routes: project music selection wrapped; validation errors surfaced; ensures project dirs before writing; deprecated music library endpoint now wrapped for logging.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept download host allowlist and status bump semantics; did not change viewport generation logic.
- Blockers: Discover/settings routes still pending migration in Wave 1.
- Next steps: Finish Wave 1 by migrating discover, settings, and remaining script-builder draft/execute/segment/beat routes.

## Iteration 9
- Scope/goal: Finish Wave 1 by migrating remaining routes (discover, settings, render, music, boards root, full script-builder set) to unified error/logging/validation wrapper.
- Changes:
  - All remaining API routes now wrapped with `withErrorHandler`/`parseBody`/`parseQuery`; Wave 1 now 100% coverage.
  - Script Builder: migrated draft/detail/history/polish/glue-analysis, execute/resume/status, segment, beat regenerate; validation and not-found errors standardized; history/checkpoint behaviors preserved.
  - Discover + generalize routes now validated via Zod helpers and surfaced errors via wrapper; defaults retained.
  - Settings route uses wrapper and parseBody; render start/status and music selection/library routes standardized; boards list/create and board detail/update now wrapped.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept existing status transitions, checkpointing, and logging `console` breadcrumbs for long-running script-builder flows; discover defaults remain geo=US when unspecified.
- Blockers: None for Wave 1; ready to start Wave 2 path migrations or subsequent waves.
- Next steps: Begin Wave 2 (path utilities adoption) or proceed to Wave 3 retry unification per plan.

## Iteration 10
- Scope/goal: Start Wave 2 by migrating core storyflow services to centralized paths and adding missing render dir support; include project music route.
- Changes: Added `renders` directory to `ProjectPaths`/`ensureProjectDirs`; migrated `storyflow` filesystem helpers (projects, render worker, assets save/delete, TTS audio paths, viewport asset lookup) and the project music API route to use `getProjectPaths`/`getPublicDir` instead of `process.cwd()` joins.
- Tests: `npm run lint -- --max-warnings=0` (running now — see iteration summary for result).
- Decisions/assumptions: Kept existing relative paths stored in DB (`/projects/...`) while switching absolute resolution to centralized helpers; retained explicit directory creation where writes occur even though `ensureProjectDirs` creates base structure.
- Blockers: Remaining occurrences in `src/lib/config.ts`, `src/lib/storyflow/upscale/realesrgan.ts`, and tests still use `process.cwd()` paths — to be migrated in next slice.
- Next steps: Finish Wave 2 by updating remaining production files (`config.ts`, upscale) and adjusting tests (`src/test/lib/paths.test.ts`); then rerun lint/tests.

## Iteration 11
- Scope/goal: Continue Wave 2 by removing remaining `process.cwd()` path joins in assets/upscale flows and test suites; align music download route with centralized paths.
- Changes:
  - `src/lib/storyflow/assets.ts`: now uses `ensureProjectDirs` + project-scoped asset dirs for saves/deletes; returns public-relative paths; delete operations normalized.
  - `src/lib/storyflow/upscale/job.ts`: resolves input/output via `getProjectPaths`; stores upscaled path under `/projects/{id}/assets/images/...`.
  - `app/api/projects/[id]/music/route.ts`: writes downloads into `paths.assetsMusic` and stores public-relative path; uses `getPublicDir`.
  - Tests: `tests/schema.test.ts`, `tests/timeline.test.ts`, `src/test/lib/paths.test.ts` updated to rely on path helpers and cover new `renders/preview/final` fields.
  - Spec updated (Wave 2 tables) marking migrated files/tests as ✅.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept stored DB paths public-relative (`/projects/...`); `config.ts` already avoided `process.cwd()` path joins so left untouched.
- Blockers: None for Wave 2 remaining items; verify if any `process.cwd()` joins emerge later.
- Next steps: Confirm no outstanding Wave 2 items (re-check `config.ts`); begin Wave 3 retry unification or continue Wave 2 cleanup as needed.

## Iteration 12
- Scope/goal: Wave 3 — centralize retry utilities and remove duplicate board-specific retry helper.
- Changes:
  - Moved `src/lib/services/media/timeout-wrapper.ts` to shared `src/lib/utils/retry.ts`; updated TTS services and agent guidance to import from the new path.
  - Updated AGENTS/CLAUDE docs and the incremental refactoring spec to reflect the shared retry location; Wave 3 marked complete.
  - Refactored `src/lib/boards/ai-service.ts` to use `withRetry` from the shared helper with a preserved 2s/4s backoff profile; removed the custom `callWithRetry`.
  - Added a shared retry config constant to clarify legacy timing; refreshed `retry.ts` header to reflect general use.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept three-attempt pattern (two retries with 2s then 4s delays) to mirror prior behavior while adopting the shared helper.
- Blockers: None.
- Next steps: Proceed to Wave 4 (TanStack Query migrations) or Wave 5 (Prisma extensions) per plan; consider adding ai-gateway work (Wave 6) after retry consolidation.

## Iteration 13
- Scope/goal: Wave 4 kickoff — migrate boards pipeline UI (wizard + uploader) to TanStack Query hooks, removing manual fetch/imperative error handling.
- Changes:
  - Added full boards domain client surface in `src/lib/api/boards.ts` (plan, prompts, regions, triggers, viewport, upload) with shared JSON error parsing.
  - Expanded `use-boards` query hook keys/mutations to cover planning, prompts, regions, triggers, viewport, and image upload with cache writes/invalidations.
  - Refactored `components/boards/BoardPlannerWizard.tsx` to call the new mutations (with background-task integration) instead of ad hoc `fetch` + state plumbing.
  - Updated `components/boards/ImageUploader.tsx` to reuse the upload mutation for consistency and standardized error handling.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept background activity UX; continue storing prompts/plan results in component state for step flow while caching via hooks. Prompts API sometimes returns `{ data }`; client normalizes this.
- Blockers: None. Remaining Wave 4 targets (other components listed in spec) still pending.
- Next steps: Continue Wave 4 by migrating remaining manual-fetch components (e.g., script-builder workflow, topic-refinement, stock-search) onto query/mutation hooks; consider adding any missing hook APIs as needed.

## Iteration 14
- Scope/goal: Finish Wave 1 validation cleanup by moving remaining JSON routes onto `parseBody`/`parseQuery` and reconciling the spec status note.
- Changes:
  - Updated routes to use `parseBody` + unified wrapper instead of inline `safeParse`: `app/api/assets/import`, `app/api/assets/upscale`, `app/api/discover/generalize`, `app/api/projects/[id]/music`, `app/api/projects/[id]/boards` (GET/POST), `app/api/projects/[id]/boards/[boardId]` (PUT), `app/api/script-builder/execute`, `app/api/script-builder/segment`, `app/api/script-builder/beat/[beatDraftId]/regenerate`, and `app/api/script-builder/draft/[draftId]/polish`.
  - Removed duplicated `req.json()`/manual validation boilerplate and aligned NotFound/Validation errors with the shared handler; union payloads now parsed through `parseBody`.
  - Spec updated with a status note confirming all JSON routes are standardized; noted the form-data upload handler remains manual by design.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Form-data upload route still validates manually because `parseBody` only handles JSON; retained business-logic try/catch blocks that manage checkpointing/state transitions.
- Blockers: None.
- Next steps: Continue Wave 4 component migrations (e.g., music settings/topic refinement/stock search) or begin Wave 5 Prisma extension work once UI fetch patterns are reduced.

## Iteration 15
- Scope/goal: Wave 4 — migrate remaining music/topic stock-fetch components to TanStack Query hooks and add missing client surfaces.
- Changes:
  - Added `src/lib/api/ai.ts` + `useRefineTopic` mutation hook; refactored `components/projects/topic-refinement.tsx` to use it instead of manual fetch.
  - Expanded music client surface with `updateMusicVolume` and corresponding `useUpdateMusicVolume`; `components/assets/music-settings.tsx` now uses the hook and surfaces toast errors.
  - Added stock import API client + `useImportAsset`; `components/media/stock-search.tsx` now imports via mutation with cache updates and consistent toasts.
  - Media manager now uses `useSelectMusicAsset` hook for soundtrack selection (no direct fetch).
  - Spec Wave 4 progress note updated to reflect new migrations.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept per-item loading indicator via local `importingId` while mutation manages network state; volume updates still require selected asset ID (matches API contract).
- Blockers: Remaining Wave 4 targets include script-builder workflow and any other manual-fetch components; no new blockers.
- Next steps: Continue Wave 4 by migrating script-builder workflow/topic consumption of execution status, or begin Wave 5 Prisma extension once fetch cleanup is satisfactory.

## Iteration 16
- Scope/goal: Wave 4 — migrate script builder workflow off manual fetches for project updates and TTS generation.
- Changes:
  - Script builder workflow now uses `useUpdateProject` mutation for topic autosave and status transitions; removes inline `fetch` calls.
  - TTS generation loop now uses the shared `generateTTS` API client; still streamed via background task runner with progress updates.
  - Spec Wave 4 note updated to include script-builder workflow migration.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept background task orchestration and progress UX intact; TTS remains sequential per segment as before.
- Blockers: Remaining manual fetches confined to other components (see plan) — ready for next migration slice.

## Iteration 17
- Scope/goal: Wave 4 wrap-up—confirm remaining components use hooks instead of manual fetch and align spec notes.
- Changes:
  - Verified components now rely on existing query/mutation hooks; only hook-driven `refetch` remains.
  - Updated Wave 4 progress note in `docs/incremental-refactoring-plan.md` to reflect hook-only status.
- Tests: Not run (documentation-only).
- Decisions/assumptions: No further manual-fetch components detected; next work can move to remaining Wave 4 refinements or Wave 5.
- Blockers: None.
- Next steps: Continue Wave 4 component migrations (e.g., music settings/topic refinement/stock search) or begin Wave 5 Prisma extension once fetch patterns are reduced.

## Iteration 18
- Scope/goal: Kick off Wave 5 by introducing the Prisma project extension and migrating the first callers; tidy API helper exports.
- Changes:
  - Added `projectExtension` with `findByIdOrThrow`, `findWithScript`, `findWithAssets`, and `updateStatus`; `storyflowPrisma` now applies the extension singleton.
  - Migrated initial callers to the new helper: AI refine/script routes, project music selection, project asset mappings, timeline builder, viewport generation, and render job setup (now using typed ApiErrors instead of ad-hoc status properties). Exported `withStreamErrorHandler` via `app/api/lib/index.ts`.
  - Filled missing imports (`path` in viewport/render) while updating callers; render/timeline now raise structured NotFound/Conflict/429 errors for wrapper handling.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept `findByIdOrThrow` generic to allow `include` payloads; retained updateStatus helper for later batches though not yet adopted widely. Kept existing render queue semantics while standardizing error surfaces.
- Blockers: Remaining direct `findUnique` usages (assets upload/import, boards + project CRUD, script-builder blueprint, project viewport routes, tests) still need migration to the extension.
- Next steps: Continue Wave 5 by migrating a focused batch (e.g., projects CRUD + boards routes) onto `findByIdOrThrow`/`updateStatus`, then adjust route tests/mocks accordingly.

## Iteration 19
- Scope/goal: Wave 5 continuation — replace remaining project `findUnique` usages with the Prisma extension in routes and tests.
- Changes:
  - Migrated project CRUD routes, project viewport save/get, boards plan/viewport/triggers/list/detail routes, assets upload/import, and script-builder blueprint generation to use `storyflowPrisma.project.findByIdOrThrow`.
  - Updated render/timeline earlier; now added index export for `withStreamErrorHandler` already available; cleaned unused imports/variables after migration.
  - Adjusted project route unit tests to mock `findByIdOrThrow` and throw `NotFoundError` for missing projects.
  - Lint clean after migrations.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept non-project `findUnique` usages (scripts, blueprints, assets) untouched pending potential model-specific extensions; render/board logic unchanged aside from standardized project lookup.
- Blockers: None for project lookups; next step is to decide whether to add extensions for other models or leave direct lookups as-is.

## Iteration 20
- Scope/goal: Wave 2 wrap-up verification — ensure remaining path utility adoption is complete and align spec status.
- Changes:
  - Confirmed `src/lib/config.ts` already relies on `getConfigPath` (no `process.cwd()` joins); no code changes required.
  - Updated `docs/incremental-refactoring-plan.md` Wave 2 table to mark the `config.ts` row as ✅ with helper usage.
- Tests: Not run (docs-only).
- Decisions/assumptions: Path helpers now cover all known project path joins; any new filesystem logic should extend `paths.ts`.
- Blockers: None.
- Next steps: Continue Wave 5 Prisma extension migrations or proceed to Wave 6 AI gateway once remaining callers are updated.

## Iteration 21
- Scope/goal: Wave 5 — migrate remaining dashboard project pages to the Prisma project extension and align agent docs.
- Changes:
  - Updated dashboard project pages (`layout`, root redirector, overview, render, media, storyboard, script) to use `storyflowPrisma.project.findByIdOrThrow` with `NotFoundError` handling, ensuring consistent lookup semantics with API routes.
  - Adjusted `app/api/CLAUDE.md` sample to demonstrate `findByIdOrThrow` instead of manual `findUnique`/NotFound checks.
- Tests: Not run (UI/server-component fetch refactor only).
- Decisions/assumptions: Next.js server components catch `NotFoundError` to return `notFound()` for 404 behavior; other models remain on direct queries until dedicated extensions are added.
- Blockers: None for project lookups; consider additional extensions for script/asset models if duplication warrants.
- Next steps: Continue Wave 5 by evaluating non-project model extensions or move to Wave 6 AI gateway consolidation.

## Iteration 22
- Scope/goal: Wave 5 — extend Prisma helpers to scripts/blueprints/assets and migrate routes off manual `findUnique` checks.
- Changes:
  - Added `findByProjectIdOrThrow` (script), `findByIdOrThrow` (blueprint, asset) to the shared Prisma extension while keeping project helpers; applied via the existing `$extends` setup.
  - Migrated script-builder blueprint routes (approve, review, history, regenerate, execute) to the new blueprint helper; removed inline not-found checks.
  - TTS generate/generate-all now use `script.findByProjectIdOrThrow`; music selection route uses `asset.findByIdOrThrow` for soundtrack lookup; upscale job uses the asset helper.
  - Cleaned imports of unused `NotFoundError` where wrappers now cover lookup failures.
  - Updated spec progress note to reflect the new helper coverage.
- Tests: Not run (logic-equivalent refactor using standardized helpers).
- Decisions/assumptions: Delete-asset flow still returns null when already absent (caller expects null); script creation flow keeps optional upsert logic (no helper needed there).
- Blockers: None noted; remaining direct `findUnique` calls are intentional (optional lookups/upserts).
- Next steps: Evaluate need for additional model-specific helpers (scriptDraft/asset mappings) and proceed toward Wave 6 AI gateway work.

## Iteration 23
- Scope/goal: Kick off Wave 6 by adding the AI gateway and migrating first callers; align agent guidance and fix lint fallout.
- Changes:
  - Added `aiGenerate` gateway (`src/lib/services/ai/ai-gateway.ts`) wrapping `geminiCall` with retry + optional Zod validation; exported via services index.
  - Migrated `src/lib/storyflow/ai.ts` (script generation + topic generalization) and `src/lib/storyflow/viewport.ts` to use `aiGenerate` with structured validation/metadata; preserved fallback behaviors.
  - Updated agent instructions (`AGENTS.md`, `CLAUDE.md`) to point AI work through the gateway; marked Wave 6 as 🔄 in the spec with current coverage.
  - Fixed lint failure in `app/api/script-builder/blueprint/[id]/approve/route.ts` (unused blueprint binding) surfaced during lint run.
- Tests: `npm run lint -- --max-warnings=0` (pass after fix).
- Decisions/assumptions: Gateway retries (default 2) currently create one AI log per attempt via `geminiCall`; acceptable for now but revisit if dedup needed. Metadata stored with calls includes topic/image path for debugging. Kept fallback viewport generation on gateway failure.
- Blockers: Remaining AI callers (script-builder helpers, AI routes, boards AI service) still use direct helpers; `BoardsAIService` not removed yet.
- Next steps: Migrate remaining AI call sites to `aiGenerate`, then delete `BoardsAIService`; consider consolidating AI logging per logical call if duplicate entries become noisy.

## Iteration 24
- Scope/goal: Continue Wave 6 by migrating remaining AI callers to `aiGenerate` and removing the legacy boards AI service.
- Changes:
  - Refactored script-builder service to route all Gemini calls through `aiGenerate` with schema validation (blueprint/segment) and text handling (beat drafts); removed custom raw/text helpers.
  - AI refine route now uses `aiGenerate` with schema validation; viewport generation already on gateway.
  - Replaced boards AI usage in board planning (topic breaks + summaries), board regions route, and TTS emphasis analysis with gateway calls (project-scoped metadata, schemas).
  - Removed `src/lib/boards/ai-service.ts` and its exports; updated boards CLAUDE guidance to point to the AI gateway.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Board planning now requires `projectId` for AI logging and retry; summaries still trim text response. AI gateway still logs per retry attempt.
- Blockers: None for Wave 6; remaining cleanup is to consider consolidating AI log entries across retries if noisy.
- Next steps: Update spec Wave 6 status to reflect near-complete migration; optionally dedupe AI logs per logical call or proceed to Wave 7.

## Iteration 25
- Scope/goal: Sweep for remaining direct Gemini helpers and finalize boards AI removal references.
- Changes:
  - Removed last `getBoardsAIService` imports/usages; deleted `src/lib/boards/ai-service.ts` artifacts from boards exports and docs; boards prompts service now embeds JSON parsing helper locally (no ai-service dependency).
  - Confirmed no production `geminiCall` usages outside the gateway; updated spec Wave 6 table/notes accordingly.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: AI gateway remains single-call-per-retry logging; acceptable for now.
- Blockers: None.
- Next steps: Optionally dedupe AI logs across retries or proceed to Wave 7 pipeline interface work.

## Iteration 26
- Scope/goal: Deduplicate AI logs across retries by logging once per logical call in the gateway.
- Changes:
  - Refactored `gemini-wrapper` to expose `runGemini` (unlogged execution with fallback) and re-based `geminiCall` on it.
  - Updated `ai-gateway` to log once via `aiLogger.wrap` and perform retries using `runGemini`, preventing multiple AI log rows per retry attempt while retaining fallback behavior.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Per-call logging now stable; retry still uses the same backoff settings. Model used on fallback is recorded in runtime logs (metadata), but DB log keeps requested model as before.
- Blockers: None.
- Next steps: Proceed to Wave 7 pipeline interface or add tests around ai-gateway retry behavior if desired.

## Iteration 27
- Scope/goal: Begin Wave 7 by introducing the pipeline stage interface and runner scaffolding without altering existing stage implementations.
- Changes:
  - Added `src/lib/storyflow/pipeline/types.ts` defining the `PipelineStage` contract and shared options.
  - Added `src/lib/storyflow/pipeline/runner.ts` to enforce required status gating via `storyflowPrisma.project.findByIdOrThrow`, raise `ConflictError` on misuse, and orchestrate prepare/execute/commit.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: No existing stages wired yet; runner keeps behavior unchanged until individual stages adopt it. Progress hooks supported via optional `onProgress` callback.
- Blockers: Need to migrate concrete stages (render/build/storyboard/media/script) to the interface in subsequent iterations.
- Next steps: Wire the simplest stage (render) through `runStage`, then migrate remaining stages incrementally, updating spec status accordingly.
