# 2026-02-07 — docs/test-automation-plan.md

## Iteration 1

- Scope/goal: Perform a reality check of the test automation spec, ship one small quality fix that closes a known warning path, and align spec status markers with executable state.
- Iteration plan: Use `changelog/2026-02-07-test-automation-plan.md` as the running log; complete a single shippable slice focused on `ScriptPreview` warning cleanup and status audit updates.

### Concrete changes

- Updated spec progress marker:
  - `docs/test-automation-plan.md`: changed `Wave 2` from `🔄` to `✅` after validating all listed route test suites are present and passing.
- Updated test totals in the spec:
  - `docs/test-automation-plan.md`: Wave 4 acceptance summary updated from `354` to `368` tests to match current Vitest output.
- Added explicit audit + carry-forward section:
  - `docs/test-automation-plan.md`: new `Current State Audit (2026-02-07)` section with validated command outcomes and known technical debt.
- Fixed React list-key warning path:
  - `components/script/script-preview.tsx`: changed `SegmentCard` key from `segment.index` to `${segment.index}-${idx}` to prevent duplicate-key warnings when segment indices repeat.
- Added regression coverage for duplicate segment indices:
  - `components/script/__tests__/script-preview.test.tsx`: verifies rendering with duplicate indices and asserts no React unique-key warning is emitted.

### Tests run + results

- `npm run test:vitest -- components/script/__tests__/script-preview.test.tsx`
  - Result: pass (`1/1` tests)
- `npm run test:vitest -- app/api/projects/__tests__/route.test.ts app/api/projects/__tests__/timeline.test.ts app/api/projects/__tests__/boards.test.ts app/api/projects/__tests__/storyboard.test.ts app/api/projects/__tests__/media.test.ts app/api/discover/__tests__/routes.test.ts app/api/music/__tests__/routes.test.ts`
  - Result: pass (`47/47` tests)
- `npm run test`
  - Result: pass (`66` files, `368` tests)
- `npm run test:e2e`
  - Result: pass (`32 passed`, `1 skipped`, `0 failed`)
- `npm run test:e2e -- e2e/pages-smoke.spec.ts`
  - Result: pass (`17/17` tests)

### Decisions / assumptions

- Assumed the spec is largely implemented and current work should focus on verification + incremental cleanup rather than broad new feature additions.
- Treated server-side `ConflictError` logs in render-page smoke paths as expected behavior under current seeded statuses, not a failing condition.

### Blockers / tech debt carried forward

- E2E output remains noisy due to expected server-side `ConflictError` logs for `/render` when seeded project status is not render-ready.
- Accessibility known issues still open (`select-name`, `color-contrast`, `html-has-lang`).
- Worktree contains additional pre-existing modified API test files; left untouched except validated by tests.

### Next steps

- Option A: Reduce E2E log noise by adjusting render-page smoke fixture status or route behavior so expected conflicts do not emit noisy error logs.
- Option B: Start clearing Wave 5 accessibility known issues (target `select-name` first for high impact).
- Option C: Harden page-smoke console/error assertions to fail on predictable regressions while allowing explicitly expected errors.

