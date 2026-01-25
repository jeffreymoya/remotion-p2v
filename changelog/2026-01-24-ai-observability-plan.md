# 2026-01-24 — docs/ai-observability-plan.md

## Iteration 1
- Scope/goal: deliver Phase 1 (state persistence) so script builder restores the correct phase and surfaces corrupted DB state.
- Concrete changes: added `determineWorkflowState` utility with Prisma-backed parsing; updated `script` page query to fetch active blueprint/draft state; wired `ScriptBuilderWorkflow` to server-provided state and added corruption guard UI; introduced unit tests for workflow state logic.
- Tests: `npx tsx src/lib/storyflow/__tests__/workflow-state.test.ts` (pass); `npm run -s test:paths` (pass, sanity check from prior suite).
- Decisions/assumptions: treat invalid blueprint/draft JSON as fatal and gate entry until user resets; default to preview when a final script exists; resume in execution when blueprint approved but no draft.
- Blockers: none identified for state persistence; downstream phases (AI logging/schema/UI) still pending.
- Next steps: implement Part 2 schema + logger/wrapper, migrate AI call sites, and add API/UI layers per plan.

## Iteration 2
- Scope/goal: deliver Phase 2 (database + core logging) foundation for AI observability.
- Concrete changes: added `AiCallLog` model and `AiCallStatus` enum to `prisma/storyflow.schema.prisma` with Project relation; ran `npm run db:push:storyflow` and `npm run db:generate:storyflow`. Implemented `aiLogger` service with SSE-ready callbacks, token estimation, error categorization, and wrapped logging lifecycle. Added `gemini-wrapper` with tiered model defaults and token parsing helpers; re-exported through `src/lib/services/ai/index.ts`. Added unit tests for token estimation, error categorization, and usage parsing.
- Tests: `npx tsx src/lib/services/ai/__tests__/ai-logger.test.ts` (pass); prisma generate/push succeeded.
- Decisions/assumptions: token estimate uses ~4 chars/token fallback; logging metadata stored as JSON without schema; executor wrapper leaves model tier selection to callers (defaults to `gemini-3-flash`). SSE remains single-instance via in-memory callbacks.
- Blockers: none for logging core; Phase 3 call-site migrations and Phase 4+ APIs/UI remain.

## Iteration 3
- Scope/goal: migrate existing AI call sites to the logging wrapper (Phase 3) and ensure TTS calls are captured; keep behaviour unchanged while adding observability metadata.
- Concrete changes:
  - Wrapped script-builder Gemini calls with `geminiCall` and threaded `projectId` through `generateBlueprint`, `regenerateBlueprint`, `executeBeat`, and `segmentScript`; updated API routes to pass project IDs.
  - Wrapped viewport Gemini call in `generateViewportForProject` with `geminiCall` (PRO model).
  - Wrapped Google TTS generation in `aiLogger.wrap` (provider `google-tts`, operation `tts-generate`) for per-segment audio synthesis.
  - Migrated `generateScriptFromGemini` and `generalizeTopics` to use `geminiCall`; discovery generalize API now requires `projectId` for logging.
- Tests: `npm run test -- src/lib/services/ai/__tests__/ai-logger.test.ts` (passes; triggers full quick suite per script).
- Decisions/assumptions: default FLASH for lightweight ops; PRO for blueprints/viewport/script generation; discovery endpoint now enforces `projectId` to keep logs relational.
- Blockers: None observed for Phase 3; API/UI layers (Phases 4-6) still pending.
- Next steps: build AI logs API endpoints + SSE, then UI surface and layout link; update spec markers accordingly.

## Iteration 4
- Scope/goal: deliver Phase 4 API layer for AI observability — list, detail, and SSE streaming endpoints that expose logged Gemini/TTS calls per project.
- Concrete changes: added `GET /api/projects/[id]/ai-logs` with pagination, filters (status/provider/operation/date range), status/latency/token summary metrics; added `GET /api/projects/[id]/ai-logs/[logId]` with lineage relations; added SSE stream `/api/projects/[id]/ai-logs/stream` wired to `aiLogger.onNewLog` with keep-alive pings; marked Phase 4 complete in `docs/ai-observability-plan.md`.
- Tests: `npm run test -- src/lib/services/ai/__tests__/ai-logger.test.ts` (passes; runs full quick suite).
- Decisions/assumptions: clamp limit to 100 and require non-negative page; success rate derived from completed vs failed only; SSE kept single-instance with in-memory callbacks plus 30s keep-alive; responses forced dynamic/node runtime to avoid caching/edge mismatch.
- Blockers: UI surface (Phase 5) and layout link (Phase 6) still outstanding; no backend blockers identified.
- Next steps: build AI Logs client UI (stats cards, log list, errors tab, SSE hookup) and wire layout link; consider polling fallback for multi-instance deployments later.
