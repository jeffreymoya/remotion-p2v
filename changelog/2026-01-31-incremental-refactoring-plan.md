# 2026-01-31 — docs/incremental-refactoring-plan.md

## Iteration 34
- Scope/goal: Wave 8 — consolidate viewport/boards types to a single canonical source to reduce drift across schemas and hooks.
- Changes: Moved all viewport + board domain types (regions, keyframes, triggers, board plan/regions/prompts) into `src/lib/storyflow/types.ts` as the source of truth. Updated `viewport-types.ts` and `boards-types.ts` to re-export those types and kept only their Zod schemas/logic. Aligned API clients and utilities to import from the canonical types; re-exported `Board`/`BoardRegion` from the API layer for consumers. Lint now clean.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Kept schemas in their existing files to avoid churn; only type duplication removed. No runtime behavior changes expected. Left duration units migration for a later slice.
- Blockers: None.
- Next steps: Continue Wave 8 by migrating duration fields to branded `Milliseconds`/`Seconds` and auditing any residual duplicated types.

## Iteration 35
- Scope/goal: Wave 1 polish — remove manual error translation from upscale API by pushing ApiError mapping into the service and relying on `withErrorHandler`.
- Changes: `src/lib/storyflow/upscale/job.ts` now throws `ValidationError` for non-image assets and `ServiceUnavailableError` when Real-ESRGAN is missing; route `app/api/assets/upscale/route.ts` simplified to just parse input and return the job result (no local try/catch). Keeps Prisma `findByIdOrThrow` path unchanged.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Upscale remains synchronous per existing codepath; no retries added. Error surfaces stay consistent via shared handler.
- Blockers: Remaining manual try/catch blocks in other routes still to be migrated or justified in a future slice.
- Next steps: Continue Wave 1 cleanup by eliminating remaining route-level catch blocks (ai refine/script, script-builder execute/resume, boards triggers/viewport reads) or move mappings into underlying services where needed.

## Iteration 36
- Scope/goal: Wave 8 completion — migrate duration fields across the codebase to use branded `Milliseconds`/`Seconds` types.
- Changes: Updated core type definitions in `src/lib/storyflow/types.ts` (`ScriptSegment.estimatedDuration`/`actualDuration` → `Seconds`, `WordTimestamp.startMs`/`endMs` → `Milliseconds`, `ViewportKeyframe.transitionDurationMs` → `Milliseconds`, `ViewportTrigger.wordStartMs`/`transitionMs` → `Milliseconds`). Migrated service files: `build-utils.ts` (audio/text manifest), `boards/plan-service.ts` (`SegmentMetrics`, `calculateMetrics` with `secToMs`), `services/ai/gemini-wrapper.ts` (`GeminiResult.durationMs`), `services/ai/ai-logger.ts` (`AiCallResult.durationMs` with `ms()` wrapper on Date calculations), `storyflow/viewport.ts` (`SegmentTiming` with `ms()` casts), `storyflow/script-builder.ts` (function signatures for `calculateTargetWordCount`/`calculateBeatCount`). All duration calculations now use unit helper functions (`ms()`, `sec()`, `secToMs()`) from `@/src/lib/types/units`.
- Tests: `npm run lint -- --max-warnings=0` (pass).
- Decisions/assumptions: Used branded type casts at construction sites (e.g., `ms(value)`) to maintain type safety while minimizing refactoring scope. Left Zod schemas unchanged (schemas still use `z.number()`) since branded types are TypeScript-only; type safety enforced at interface boundaries. Duration fields in database models remain plain numbers; branded types applied only to in-memory interfaces.
- Blockers: None. Wave 8 complete.
- Next steps: All refactoring waves (0-8) complete. Codebase now has consistent error handling, path utilities, retry logic, query hooks, Prisma extensions, AI gateway, pipeline stages, and unified types. Future work: ongoing maintenance and application of conventions to new code via agent config files.
