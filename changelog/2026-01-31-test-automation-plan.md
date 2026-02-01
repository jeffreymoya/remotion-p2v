# 2026-01-31 — docs/test-automation-plan.md

## Iteration 14
- **Scope/Goal**: Cover the script stage API route to keep Wave 2 momentum and update the spec checklist.
- **Changes**:
  - Added `app/api/projects/__tests__/script.test.ts` covering happy path, missing script (404), and validation error (400) by mocking `runScriptStage`.
  - Updated `docs/test-automation-plan.md` to mark the script stage row ✅ in the Wave 2 test file matrix.
- **Tests & Results**:
  - `npm run test:vitest -- app/api/projects/__tests__/script.test.ts` ✅ (3 tests).
  - `npm run test:vitest` ✅ (26 files, 200 tests).
- **Decisions/Assumptions**: Kept route behavior unchanged; rely on `withErrorHandler` to map domain errors; no additional Prisma mocking needed since the stage runner is isolated.
- **Blockers**: Remaining Wave 2 domains still open — boards, AI, render, settings, AI logs, discover. Need to add tests for those next.
- **Next Steps**: Pick the next API cluster (boards or AI) for coverage; keep MSW `onUnhandledRequest` at `error` to catch gaps.

## Iteration 15
- **Scope/Goal**: Add full coverage for AI routes (script, refine, viewport) to progress Wave 2.
- **Changes**:
  - Created `app/api/ai/__tests__/routes.test.ts` covering Gemini happy path, fallback to demo script, validation errors, 404s, and ServiceUnavailable for refine; viewport generation happy/validation/404.
  - Updated `docs/test-automation-plan.md` to mark the AI routes row ✅ in the Wave 2 matrix.
- **Tests & Results**:
  - `npm run test:vitest -- app/api/ai/__tests__/routes.test.ts` ✅.
  - `npm run test:vitest` ✅ (26 files, 200 tests).
- **Decisions/Assumptions**: Mocked Prisma, AI gateway, settings, and viewport generator to keep tests hermetic; retained existing error mapping via `withErrorHandler`.
- **Blockers**: Remaining Wave 2 domains: boards, render, settings, AI logs, discover.
- **Next Steps**: Pick next API cluster (boards or render) for coverage while MSW stays strict.
