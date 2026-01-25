# Changelog: AI Observability & State Persistence Plan

**Spec:** docs/ai-observability-plan.md
**Started:** 2026-01-24

> 📋 **Spec reference added to plan**

---

## Iteration 1 - 2026-01-24
**Completed:** Phase 1 (State Persistence) - Workflow state recovery for Script Builder
**Files:**
- `src/lib/storyflow/workflow-state.ts` - Created phase determination logic with Prisma-backed parsing
- `app/(dashboard)/projects/[id]/script/page.tsx` - Extended query to fetch active blueprint/draft state
- `components/script-builder/script-builder-workflow.tsx` - Updated to accept initialState from server
- `components/script-builder/workflow-error.tsx` - Added corruption guard UI
- `src/lib/storyflow/__tests__/workflow-state.test.ts` - Unit tests for state logic

**Tests:** `npx tsx src/lib/storyflow/__tests__/workflow-state.test.ts` (pass); `npm run -s test:paths` (pass)
**Decisions:** Treat invalid blueprint/draft JSON as fatal and gate entry until user resets; default to preview when final script exists; resume in execution when blueprint approved but no draft
**Issues:** None identified for state persistence
**Next:** Implement Part 2 schema + logger/wrapper, migrate AI call sites

---

## Iteration 2 - 2026-01-24
**Completed:** Phase 2 (Database + Core Logging) foundation for AI observability
**Files:**
- `prisma/storyflow.schema.prisma` - Added AiCallLog model with AiCallStatus enum and Project relation
- `src/lib/services/ai/ai-logger.ts` - Implemented aiLogger service with SSE-ready callbacks, token estimation, error categorization
- `src/lib/services/ai/gemini-wrapper.ts` - Added geminiCall wrapper with tiered model defaults and token parsing
- `src/lib/services/ai/index.ts` - Re-exports for clean imports
- `src/lib/services/ai/__tests__/ai-logger.test.ts` - Unit tests

**Tests:** `npx tsx src/lib/services/ai/__tests__/ai-logger.test.ts` (pass); prisma generate/push succeeded
**Decisions:** Token estimate uses ~4 chars/token fallback; logging metadata stored as JSON; executor wrapper uses default gemini-3-flash model; SSE remains single-instance via in-memory callbacks
**Issues:** None for logging core
**Next:** Phase 3 call-site migrations

---

## Iteration 3 - 2026-01-24
**Completed:** Phase 3 (Migrate AI Calls) - Wrapped existing AI call sites with logging
**Files:**
- `src/lib/storyflow/script-builder.ts` - Wrapped generateBlueprint, regenerateBlueprint, executeBeat, segmentScript with geminiCall
- `src/lib/storyflow/viewport.ts` - Wrapped generateViewportForProject with geminiCall (PRO model)
- `src/lib/storyflow/tts.ts` - Wrapped Google TTS generation in aiLogger.wrap
- `src/lib/storyflow/ai.ts` - Migrated generateScriptFromGemini and generalizeTopics to geminiCall
- API routes updated to pass projectId

**Tests:** `npm run test -- src/lib/services/ai/__tests__/ai-logger.test.ts` (passes)
**Decisions:** Default FLASH for lightweight ops; PRO for blueprints/viewport/script generation; discovery endpoint enforces projectId
**Issues:** None observed
**Next:** Phase 4 API endpoints + SSE

---

## Iteration 4 - 2026-01-24
**Completed:** Phase 4 (API Layer) - AI logs list, detail, and SSE streaming endpoints
**Files:**
- `app/api/projects/[id]/ai-logs/route.ts` - GET with pagination, filters, stats aggregation
- `app/api/projects/[id]/ai-logs/[logId]/route.ts` - GET single log with lineage
- `app/api/projects/[id]/ai-logs/stream/route.ts` - SSE endpoint with keep-alive

**Tests:** `npm run test -- src/lib/services/ai/__tests__/ai-logger.test.ts` (passes)
**Decisions:** Clamp limit to 100, non-negative page; success rate from completed vs failed only; SSE with 30s keep-alive; forced dynamic/node runtime
**Issues:** None
**Next:** Phase 5 UI + Phase 6 layout integration

---

## Iteration 5 - 2026-01-24
**Completed:** Phase 5 (UI Components) + Phase 6 (Layout Integration) - Full AI Logs UI with live updates
**Files:**
- `components/ai-logs/stats-cards.tsx` - Stats metrics cards with color-coded variants
- `components/ai-logs/status-badge.tsx` - Status badge component with pending animation
- `components/ai-logs/filters.tsx` - Filter controls for status and provider
- `components/ai-logs/log-entry.tsx` - Collapsible log entry with prompt/response sections
- `components/ai-logs/ai-logs-client.tsx` - Main client component with SSE subscription, filters, tabs
- `app/(dashboard)/projects/[id]/ai-logs/page.tsx` - AI Logs page
- `app/(dashboard)/projects/[id]/layout.tsx` - Added AI Logs link beside Overview

**Tests:** Components built, API integration in place
**Decisions:** Used existing Radix UI components (Tabs, Button) and Tailwind styling; collapsible sections for readability; separated "All Logs" and "Errors" tabs; real-time updates via SSE
**Issues:** None
**Next:** Test in browser, iterate on UX polish if needed

---

## Status Summary

✅ **Phase 1: State Persistence** - Complete
✅ **Phase 2: Database & Core Logging** - Complete
✅ **Phase 3: Migrate Existing AI Calls** - Complete
✅ **Phase 4: API Routes** - Complete
✅ **Phase 5: UI Components** - Complete
✅ **Phase 6: Integration & Polish** - Complete (basic integration)

**Remaining from spec:**
- Optional enhancements: Syntax highlighting (shiki/prism), virtual scrolling, lineage visualization
- Multi-instance SSE support (database polling or Redis pub/sub)
- Advanced analytics/cost tracking features

All core functionality from the AI Observability Plan has been implemented.

---

## Iteration 6 - 2026-01-25
**Completed:** Verification and validation of full implementation
**Files:**
- Verified all 6 phases: ✅ State persistence, ✅ Database schema, ✅ AI call migrations, ✅ API routes, ✅ UI components, ✅ Layout integration
- Confirmed database schema includes `AiCallLog` model with all required fields and relations
- Confirmed all AI call sites migrated: `script-builder.ts`, `viewport.ts`, `tts.ts`, `ai.ts`
- Confirmed API routes: `app/api/projects/[id]/ai-logs/route.ts`, `[logId]/route.ts`, `stream/route.ts`
- Confirmed UI components: `stats-cards.tsx`, `status-badge.tsx`, `filters.tsx`, `log-entry.tsx`, `ai-logs-client.tsx`
- Confirmed layout integration: AI Logs link in `app/(dashboard)/projects/[id]/layout.tsx:48-52`
- Confirmed page: `app/(dashboard)/projects/[id]/ai-logs/page.tsx`

**Tests:** All tests passing (32 pass, 0 fail), lint clean, database generation successful
**Decisions:** Implementation complete per specification
**Issues:** None
**Next:** All required features implemented. Optional enhancements (syntax highlighting, virtual scrolling, lineage visualization) can be added as future improvements if needed.
