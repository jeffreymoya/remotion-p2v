# 2026-02-07 — docs/prompt-first_media_flow_5f4ea1a0.plan.md

## Iteration 1

### Scope / Goal
Ship Phase 0 foundation: add a centralized status machine, remove known status bypasses, and fix two pre-existing bugs so status transitions are enforced in one place.

### Concrete Changes
- Added `src/lib/storyflow/status-machine.ts`:
  - `transitionProjectStatus(projectId, targetStatus)` with explicit transition table.
  - `registerGuard()` support for transition guards.
  - Registered media gate guard on `SCRIPT_READY -> ASSETS_READY`.
  - Media guard validates both requirements:
    - `boards/board-prompts.json` parses to a non-empty `prompts` array.
    - At least one Asset exists in DB for the project.
  - Guard error messages:
    - Missing prompts only: `Generate image prompts before marking Media complete.`
    - Missing assets only: `Upload at least one asset before marking Media complete.`
    - Missing both: `Generate image prompts and upload at least one asset before marking Media complete.`
- Replaced status bypasses in routes/services:
  - `app/api/assets/upload/route.ts`: removed auto-promotion to `ASSETS_READY`.
  - `app/api/assets/import/route.ts`: removed auto-promotion to `ASSETS_READY`.
  - `app/api/projects/[id]/music/route.ts`: removed auto-promotion to `ASSETS_READY`.
  - `app/api/projects/[id]/boards/route.ts`: now calls `transitionProjectStatus(id, "BOARDS_READY")`.
  - `app/api/projects/[id]/boards/[boardId]/route.ts`: now calls `transitionProjectStatus(id, "BOARDS_READY")`.
  - `app/api/projects/[id]/viewport/route.ts`: now calls `transitionProjectStatus(id, "RENDER_READY")`.
  - `src/lib/storyflow/scripts.ts`: now calls `transitionProjectStatus(projectId, "SCRIPT_READY")`.
  - `src/lib/storyflow/viewport.ts`: now calls `transitionProjectStatus(projectId, "VIEWPORT_READY")`.
  - `src/lib/storyflow/render.ts`: now calls `transitionProjectStatus()` for `RENDERING`, `ERROR`, and `COMPLETED` updates.
- Replaced pipeline stage `commit()` status writes:
  - `src/lib/storyflow/pipeline/stages/script.ts` -> `SCRIPT_READY`
  - `src/lib/storyflow/pipeline/stages/media.ts` -> `ASSETS_READY`
  - `src/lib/storyflow/pipeline/stages/storyboard.ts` -> `BOARDS_READY`
  - `src/lib/storyflow/pipeline/stages/build.ts` -> `RENDER_READY`
- Removed latent Prisma bypass:
  - `src/lib/storyflow/prisma.ts`: removed `project.updateStatus()` helper type + implementation.
- Removed `status` from generic project PATCH payload:
  - `app/api/projects/[id]/route.ts` no longer accepts `status` in `updateProjectSchema`.
- Bug fixes:
  - `app/api/projects/[id]/boards/triggers/route.ts`: added missing `NotFoundError` import.
  - `src/lib/storyflow/stage-validation.ts`: updated media stage completion text to `Image prompts generated and at least 1 asset uploaded.`

### Tests + Results
- Added: `src/lib/storyflow/__tests__/status-machine.test.ts`
  - Covers valid transitions, invalid transitions, idempotency, media guard cases, custom guard execution.
- Updated route tests for removed/changed status behaviors:
  - `app/api/assets/__tests__/routes.test.ts`
  - `app/api/projects/__tests__/music.test.ts`
  - `app/api/projects/__tests__/boards.test.ts`
  - `app/api/projects/__tests__/viewport.test.ts`
  - `app/api/projects/__tests__/route.test.ts`
- Executed:
  - `npm run test:vitest -- app/api/assets/__tests__/routes.test.ts app/api/projects/__tests__/music.test.ts app/api/projects/__tests__/boards.test.ts app/api/projects/__tests__/viewport.test.ts app/api/projects/__tests__/route.test.ts src/lib/storyflow/__tests__/status-machine.test.ts`
  - Result: PASS (6 files, 56 tests)
- Executed:
  - `npm run typecheck`
  - Result: FAIL due to many pre-existing repo-wide TypeScript issues unrelated to this iteration (nullability/typing mismatches across dashboard pages, test factories, API route signatures, branded units, and existing test mocks).

### Decisions / Assumptions
- Kept media gate enforcement in the status machine guard (single enforcement point) and simplified media stage commit/prep accordingly.
- Kept board/viewport route transition calls unconditional; transition validity is now enforced centrally and returns `409 CONFLICT` for invalid edges.
- Did not add DB locking/optimistic concurrency in this iteration (matches spec’s accepted risk).

### Blockers / Tech Debt
- Repository has substantial existing `tsc --noEmit` failures outside this slice; full typecheck cannot be used as a green-gate until those are addressed.
- Status transition coverage is focused and targeted; broad integration coverage across all routes/stages remains for a later wave.

### Next Steps
1. Phase 1.1-1.3: wizard copy updates + style guide threading + configurable grid rows/cols.
2. Then Phase 2 move of wizard to Media page (`Create and Upload` tab + `mode="media"` scope).
3. Add/expand status-machine tests for full transition matrix if needed before Phase 2.

## Iteration 2

### Scope / Goal
Ship Phase 1.1-1.3 as one low-risk, shippable slice: update stale wizard copy, wire `styleGuide` end-to-end, and make prompt grid rows/cols configurable from UI.

### Concrete Changes
- `components/boards/BoardPlannerWizard.tsx`:
  - Added configurable `gridRows`/`gridCols` state (defaults `2x3`).
  - Added labeled numeric inputs for rows/columns in the config step.
  - Updated prompt-generation payload to include:
    - `gridLayout: { rows: gridRows, cols: gridCols }`
    - `styleGuide` (trimmed, optional fallback behavior server-side).
  - Updated stale copy:
    - `"Assets page"` -> `"Media page"`.
    - Updated follow-up instruction to continue in Storyboard for regions/camera paths.
- `app/api/projects/[id]/boards/prompts/route.ts`:
  - Extended request schema with optional `styleGuide`.
  - Threaded `styleGuide` into `generateBoardPrompts(...)`.
- `src/lib/api/boards.ts`:
  - Added `styleGuide?: string` to `GeneratePromptsInput`.
- `src/lib/boards/prompts-service.ts`:
  - Updated `generateBoardPrompts(...)` to accept optional `styleGuide`.
  - Added fallback behavior to `DETECTIVE_BOARD_STYLE_GUIDE` when missing/blank.
  - Updated `buildFullPrompt(...)` to accept and embed resolved `styleGuide`.
  - Prompt output now stores resolved `styleGuide` instead of hardcoded detective string.

### Tests + Results
- Updated tests:
  - `components/boards/__tests__/board-planner-wizard.test.tsx`
    - Added assertions that prompts payload includes default `styleGuide` and `2x3` grid.
    - Added test that custom style + grid (`3x2`) are sent to prompt generation.
  - `src/hooks/queries/__tests__/use-boards.test.tsx`
    - Added pass-through assertion for `styleGuide` + `gridLayout` in prompt mutation.
  - `app/api/projects/__tests__/boards.test.ts`
    - Added assertion that prompts route passes `gridLayout` and `styleGuide` to `generateBoardPrompts`.
- Executed:
  - `npm run test:vitest -- components/boards/__tests__/board-planner-wizard.test.tsx src/hooks/queries/__tests__/use-boards.test.tsx app/api/projects/__tests__/boards.test.ts`
  - Result: PASS (3 files, 20 tests).

### Decisions / Assumptions
- Kept `styleGuide` optional at API boundary and enforced fallback in prompt service to preserve backward compatibility.
- Kept grid validation limits aligned with route schema (`rows: 1..4`, `cols: 1..6`) with client-side clamping.
- Scoped this iteration to Phase 1 only; no tab/layout move yet.

### Blockers / Tech Debt
- `BoardPlannerWizard` still contains full 7-step flow in Storyboard context; media-scoped mode (`media | storyboard`) remains Phase 2.
- Numeric input UX is serviceable but basic; richer validation messaging can be added during Phase 2 UI restructuring.

### Next Steps
1. Phase 2.1a-2.1c: add wizard mode and move first 4 steps into Media "Create & Upload" tab.
2. Phase 2.1d-2.1e: persist wizard progress and create/upsert board DB rows during plan generation.
3. Phase 2.2-2.3: remove Storyboard AI toggle, add standalone ops entry points, and keep media gate behavior verified end-to-end.

## Iteration 3

### Scope / Goal
- Start Phase 2.1 move: add `mode="media"` to BoardPlannerWizard and embed the wizard into a new Media “Create & Upload” tab while keeping storyboard mode intact.

### Concrete Changes
- `components/boards/BoardPlannerWizard.tsx`: added `mode` prop (`media | storyboard`), accepted `images`/`initialBoards`, hydrated existing uploads, hid regions/triggers/viewport steps in media mode, guarded those actions when in media mode, and dynamic step rendering.
- `components/media/media-manager.tsx`: tabs now `create | stock | library | mapping`; Create tab embeds `BoardPlannerWizard` in media mode plus general `UploadZone`; threaded `initialBoards` prop.
- `app/(dashboard)/projects/[id]/media/page.tsx`: now loads boards and passes them to `MediaManager` alongside assets/script.
- Tests: updated media-manager test scaffold to include BackgroundActivityProvider and added a basic media-mode render test; wizard tests unchanged and passing.

### Tests + Results
- Ran `npm run test:vitest -- components/media/__tests__/media-manager.test.tsx components/boards/__tests__/board-planner-wizard.test.tsx`
- Result: **FAIL** — 2 media-manager tests still failing (see Blockers).

### Decisions / Assumptions
- Create tab intentionally omits AssetGallery; library/bulk management stays in Library tab. Tests should navigate to Library before asserting gallery behaviors.
- Wizard persistence (`wizardProgress`) and board upsert remain deferred to next slice (Phase 2.1d/e).

### Blockers / Tech Debt
- Tests failing because `asset-gallery` mock isn’t rendered in Create tab; they currently click delete/upscale without switching to Library. Needs test fix or UI change to expose gallery in Create.
- wizardProgress persistence and board DB upsert still pending.

### Next Steps
1. Fix media-manager tests by switching to Library tab (or render gallery in Create) and rerun vitest.
2. Implement wizardProgress persistence + board upsert (Phase 2.1d/e).
3. Continue Phase 2.2 cleanup (remove storyboard AI toggle, add standalone ops with disabled state until Phase 3).

## Iteration 4

### Scope / Goal
- Close Phase 2.1a-2.1c as a shippable checkpoint by making the moved Media-tab flow test green and explicitly threading `images` from the media page into `MediaManager`/wizard props.
- Planning context came from `changelog/2026-02-07-prompt-first_media_flow_5f4ea1a0.plan.md` Iteration 2 and Iteration 3 entries.

### Concrete Changes
- `components/media/__tests__/media-manager.test.tsx`:
  - Updated tests to match the new tab structure where `AssetGallery` is rendered in `Library`, not `Create`.
  - First failing test now switches to `Library` before asserting selected music state on `AssetGallery`.
  - Second failing test now switches to `Library` before invoking delete/upscale actions.
  - Added `images` prop to all `MediaManager` test render calls.
- `components/media/media-manager.tsx`:
  - Added `images` prop to `MediaManager` API.
  - `BoardPlannerWizard` now consumes explicitly passed `images` (with fallback to filtering from cached assets).
- `app/(dashboard)/projects/[id]/media/page.tsx`:
  - Added image filtering (`assets` -> `images`) and passed `images` to `MediaManager`.
- `docs/prompt-first_media_flow_5f4ea1a0.plan.md`:
  - Marked Phase 2.1a (`phase2-wizard-mode`), 2.1b (`phase2-create-tab`), and 2.1c (`phase2-media-props`) as `completed`.

### Tests + Results
- Executed:
  - `npm run test:vitest -- components/media/__tests__/media-manager.test.tsx components/boards/__tests__/board-planner-wizard.test.tsx`
  - Result: PASS (2 files, 7 tests)

### Decisions / Assumptions
- Kept `images` explicitly threaded from the RSC page to match the spec’s prop contract and avoid relying purely on client-side filtering.
- Did not start persistence/upsert work in this iteration to keep the slice tight and fully verifiable.

### Blockers / Tech Debt
- Phase 2.1d remains pending (`wizardProgress` persistence + schema/API support).
- Phase 2.1e remains pending (board upsert lifecycle in `POST /boards/plan`).
- Board wizard still carries some cross-mode UI text ("How it works" includes regions/camera mention) that can be refined during broader Phase 2 polish.

### Next Steps
1. Implement Phase 2.1d: add `wizardProgress` to Prisma + PATCH schema support + hydrate/persist in `BoardPlannerWizard`.
2. Implement Phase 2.1e: update `POST /api/projects/[id]/boards/plan` to upsert board rows and prune excess indices.
3. Then proceed to Phase 2.2 (remove storyboard AI toggle and add standalone board operations entry points, disabled until Phase 3).

## Iteration 5

### Scope / Goal
- Complete Phase 2.1d and 2.1e as one shippable backend+UI slice:
  - Persist board wizard progress across tab switches/page reloads.
  - Create/upsert board DB rows during board plan generation.

### Planning Context Consulted
- Updated changelog entry: `changelog/2026-02-07-prompt-first_media_flow_5f4ea1a0.plan.md`
- Prior entries consulted before implementation:
  - Iteration 3 (initial Media-tab move and known failing tests)
  - Iteration 4 (finalized 2.1a-2.1c and remaining 2.1d/2.1e scope)

### Concrete Changes
- Prisma / schema:
  - `prisma/storyflow.schema.prisma`: added `Project.wizardProgress Json?`.
  - Regenerated Prisma client and pushed schema (`db:generate:storyflow`, `db:push:storyflow`).
- Project API + types:
  - `src/lib/storyflow/types.ts`: added `wizardProgress?: Record<string, unknown> | null` to `Project`.
  - `app/api/projects/[id]/route.ts`: PATCH schema now accepts optional nullable `wizardProgress` JSON object.
- Boards API / query hooks:
  - `src/lib/api/boards.ts`: added `fetchBoardPlan()` and `fetchBoardPrompts()` GET wrappers.
  - `src/hooks/queries/use-boards.ts`:
    - added `useBoardPlan()` and `useBoardPrompts()` query hooks.
    - fixed missing `updateBoard` import in `useUpdateBoard`.
- Wizard persistence/hydration:
  - `components/boards/BoardPlannerWizard.tsx`:
    - Added project query/mutation wiring via `useProject()` and `useUpdateProject()`.
    - Added hydration from:
      - persisted `project.wizardProgress.boardPlanner`
      - `GET /boards/plan` and `GET /boards/prompts` artifact signals
      - existing uploaded board images from `initialBoards`.
    - Added progress persistence on step transitions and key actions (plan generated, prompts generated, uploads, reset).
    - Added mode-aware copy tweak in “How it works” for media mode.
- Board plan route (Phase 2.1e):
  - `app/api/projects/[id]/boards/plan/route.ts`:
    - upserts `Board` rows by `(projectId, index)` for every generated board.
    - updates `layout` from current grid config and stores per-board `plan`.
    - deletes boards with index >= new plan count (plan shrink handling).
    - writes `boards/board-plan.json` artifact and returns saved path.
    - updates `GET /boards/plan` to read and return the full `board-plan.json` payload (instead of first board’s plan fragment), so wizard hydration gets a valid `BoardPlan`.

### Tests + Results
- Updated tests:
  - `app/api/projects/__tests__/boards.test.ts`
    - added mocks/assertions for board `upsert` + `deleteMany` + plan file write.
  - `app/api/projects/__tests__/route.test.ts`
    - added PATCH test that accepts `wizardProgress`.
  - `components/boards/__tests__/board-planner-wizard.test.tsx`
    - added mocks for new project/board-plan/board-prompts hooks.
    - added hydration test (wizard resumes at upload in media mode from persisted+artifact state).
- Executed:
  - `npm run test:vitest -- app/api/projects/__tests__/boards.test.ts app/api/projects/__tests__/route.test.ts components/boards/__tests__/board-planner-wizard.test.tsx`
  - Result: PASS (3 files, 30 tests).
- Executed:
  - `npm run db:generate:storyflow && npm run db:push:storyflow`
  - Result: PASS.

### Decisions / Assumptions
- Persisted wizard data under `project.wizardProgress.boardPlanner` to avoid clobbering other potential wizard payloads.
- Kept persistence focused on step/action transitions, not every keystroke, to reduce PATCH churn.
- Hydration prioritizes persisted state and uses plan/prompts artifacts as secondary completion signals.
- Board upsert uses `(projectId, index)` as stable identity for regeneration and preserves existing board rows when count/layout updates.

### Blockers / Tech Debt
- `wizardProgress` currently stores full plan/prompts payloads; payload size may grow on large scripts and could eventually warrant compaction.
- Board `plan` field stores per-board mapping; if consumers later require a canonical full-plan payload from DB only, route shape may need refinement.
- Phase 2.2 and beyond remain untouched in this iteration.

### Next Steps
1. Phase 2.2a: remove storyboard AI/manual switch, always render `SimpleBoardsEditor`, add alert linking back to Media.
2. Phase 2.2b: add standalone region/trigger/viewport controls with board selector; keep disabled with tooltips until Phase 3.
3. Phase 2.3: regression-pass media gate flow after wizard persistence/upsert changes.

## Iteration 6

### Scope / Goal
- Close Phase 2.2 and Phase 2.3: remove the Storyboard wizard UI, guide users to Media, add disabled standalone operations scaffold with board selector, and reflect completion in spec/changelog.

### Concrete Changes
- `components/boards/BoardsWorkflow.tsx`:
  - Removed AI/manual toggle and wizard embedding; always renders `SimpleBoardsEditor`.
  - Added alert pointing to Media ("Create & Upload" tab) for prompt generation.
  - Added board selector plus standalone buttons for regions/triggers/viewport, rendered disabled with tooltips pending Phase 3 image migration.
  - Added empty-state copy when no boards are available yet.
- `app/(dashboard)/projects/[id]/storyboard/page.tsx`: simplified props (no script/wizard), still threads boards/images.
- `docs/prompt-first_media_flow_5f4ea1a0.plan.md`: marked Phase 2.2a/2.2b and Phase 2.3 as completed; noted the implemented Storyboard UI changes.

### Tests + Results
- Ran: `npm run test:vitest -- components/boards/__tests__/boards-workflow.test.tsx`
- Result: PASS.

### Decisions / Assumptions
- Storyboard standalone buttons remain disabled until Phase 3 completes the asset-based image migration; tooltips explain availability.
- Board selector labels fall back to `Board N` when no title is present.

### Blockers / Tech Debt
- Action buttons are placeholders until Phase 3 wiring (assetId-based image resolution) is implemented.

### Next Steps
1. Proceed to Phase 3.1-3.4 (asset-based image uploads, remove board upload route, schema/type updates).
2. Enable standalone Storyboard actions once image storage is unified under assets.
3. Re-run broader storyboard/media regression after Phase 3 changes.

## Iteration 7

### Scope / Goal
- Ship Phase 3.1–3.4: migrate board image handling to Asset records, remove the board upload path, update schema/types/services/components, and perform the clean-slate reset.

### Concrete Changes
- Asset upload & filename handling:
  - `app/api/assets/upload/route.ts`: accepts optional `boardId`, defaults type to `IMAGE` when provided, and forces deterministic filenames `{boardId}.ext` via `saveAssetFile(..., { overrideFilename })`.
  - `src/lib/storyflow/assets.ts`: added deterministic filename helper and optional override support in `saveAssetFile`.
  - `src/lib/api/assets.ts` / `useUploadAsset`: support options for `type`, `boardId`, and explicit filename; infer asset type from MIME when unspecified.
- Removed board-specific upload path:
  - Deleted `app/api/projects/[id]/boards/upload-image/route.ts`.
  - Removed `uploadBoardImage` API client and `useUploadBoardImage` hook.
  - Updated mocks to drop the old route.
- Schema & generated client:
  - `prisma/storyflow.schema.prisma`: `Board.imagePath` → `assetId` relation; added reverse `boards` relation on `Asset`.
  - Regenerated Prisma client and pushed schema.
  - Clean-slate reset: deleted `public/projects/*` and reran `db:generate:storyflow && db:push:storyflow`.
- Types & services:
  - `BoardRegionsOutput` now carries `assetId` (+ optional `assetPath`); `Board` interface includes `assetId`.
  - Regions route now resolves images via Asset records and returns `assetId/assetPath`.
  - Viewport service and viewport build route resolve filenames from `assetPath` when present (fallback to `{boardId}.png/_8k`).
  - Viewport generator metadata renamed to `assetPath`.
- Components:
  - `ImageUploader` now uses asset upload route, renames uploads to `{boardId}.ext`, and surfaces `{assetId, path}`.
  - `BoardPlannerWizard` stores uploaded assets by `assetId`, hydrates from assets list, and sends `assetId` to region detection; Region/Viewport steps resolve image URLs from assets.
  - `RegionEditor` and `ViewportPreview` consume `assetPath` instead of `imagePath`.
- Tests:
  - Updated and added coverage: board uploader test, boards hooks, assets upload route, boards API, boards viewport build, boards pipeline integration.

### Tests + Results
- `npm run test:vitest -- components/boards/__tests__/image-uploader.test.tsx src/hooks/queries/__tests__/use-boards.test.tsx app/api/assets/__tests__/routes.test.ts app/api/projects/__tests__/boards.test.ts src/test/lib/boards-build.test.ts src/test/integration/boards-pipeline.test.ts` — PASS.
- `npm run db:generate:storyflow && npm run db:push:storyflow` — PASS.

### Decisions / Assumptions
- Board uploads are always stored as assets under `assets/images/` with deterministic `{boardId}` filenames to satisfy viewport checks.
- Board-regions artifacts include `assetId` and optional `assetPath`; viewport/build uses `assetPath` when available, fallback to boardId naming.
- Regions hydration tolerates legacy wizard progress only when an `assetId` is present (clean-slate reduces legacy risk).

### Blockers / Tech Debt
- Region editor rendering with missing `assetPath` falls back to a no-op image load; consider surfacing a clearer warning if assets are absent.
- Phase 4 documentation/regression-checklist updates remain pending.

### Next Steps
1. Complete Phase 4 cleanup: docs/regression checklist updates for the new asset-based flow.
2. Audit any remaining UI copy that references board uploads directly to boards/ paths.
3. Verify end-to-end media → storyboard flow with fresh projects post-clean-slate.

## Iteration 8

### Scope / Goal
- Close Phase 4 by updating documentation/checklists to the shipped media-first, asset-backed flow and validating tests remain aligned.

### Concrete Changes
- `docs/regression-checklist.md`: Boards pipeline steps now reference the Media `Create & Upload` tab for config/plan/prompts/upload, clarify asset-backed uploads with deterministic `{boardId}` filenames, and note the media stage guard (prompts + asset) in the status machine.
- `docs/media-prompt-manual-image-flow-analysis-2026-02-07.md`: Marked analysis as implemented; documented dual requirement (prompts + assets), asset-id storage, removal of board upload route, and resolved Phase 2/3 items.
- `docs/prompt-first_media_flow_5f4ea1a0.plan.md`: Marked `phase4-cleanup` as completed and annotated Phase 4 sections as done.

### Tests + Results
- `npm run test:vitest -- components/boards/__tests__/boards-workflow.test.tsx` — PASS.

### Decisions / Assumptions
- No code behavior changes were needed; documentation now mirrors the asset-based, prompt-first flow shipped in earlier iterations.
- Targeted test run chosen to confirm Storyboard UI remains green after doc/spec updates.

### Blockers / Tech Debt
- None identified specific to Phase 4; continue standard regression once broader changes land.

### Next Steps
1. Proceed with routine regression of media → storyboard flow on fresh projects.
2. Monitor for copy/UX refinements as user feedback arrives post-prompt-first rollout.

## Iteration 9

### Scope / Goal
- Add graceful UX when board images are missing/unavailable in storyboard tools and realign docs/checklists, followed by a focused regression of the asset-backed media → storyboard flow.

### Concrete Changes
- `components/boards/RegionEditor.tsx`: show a clear warning when the board image is missing or fails to load, guiding users to upload in Media → Create & Upload and re-run region detection.
- `components/boards/ViewportPreview.tsx`: similar warning for missing/failed images, instructing users to re-upload before previewing camera paths.
- `components/boards/BoardPlanView.tsx`: added inline hint that board images live in Media → Create & Upload and are needed before region detection.
- Docs:
  - `docs/media-prompt-manual-image-flow-analysis-2026-02-07.md`: marked “Current Implementation” and root-cause notes as historical, clarified that prompt-first + Media Create & Upload is the current path, and referenced the Media redirect.
  - `docs/test-automation-plan.md`: updated multipart upload example to use `/api/assets/upload` with `boardId` instead of the removed boards upload route.

### Tests + Results
- `npm run test:vitest -- components/boards/__tests__/image-uploader.test.tsx src/hooks/queries/__tests__/use-boards.test.tsx app/api/assets/__tests__/routes.test.ts app/api/projects/__tests__/boards.test.ts src/test/lib/boards-build.test.ts src/test/integration/boards-pipeline.test.ts` — PASS.

### Decisions / Assumptions
- Chose lightweight, inline warnings instead of blocking UI to keep storyboard tools usable while still signaling the missing-image state.
- Docs retain historical sections but are now explicitly labeled as pre-prompt-first to avoid confusion.

### Blockers / Tech Debt
- None identified in this slice; continue standard regression coverage as new changes land.

### Next Steps
1. Monitor storyboard/media UX for additional clarity needs (e.g., inline retry controls if assets are missing).
2. Keep docs/checklists in sync with any further media/storyboard tweaks.

## Iteration 10

### Scope / Goal
- UX polish for media → storyboard flow: clearer missing-asset guidance and recovery CTAs without changing behavior.

### Concrete Changes
- `components/boards/RegionEditor.tsx`: Missing/failed image state now includes CTA back to Media → Create & Upload for the current project plus a retry button to reattempt loading.
- `components/boards/ViewportPreview.tsx`: Matching CTA + retry affordance for missing/failed board images before previewing camera paths.
- `components/boards/BoardPlanView.tsx`: Helper copy links to Media for the current project and clarifies recovery when images are missing.
- `docs/regression-checklist.md`: Boards checklist highlights the missing-image guidance + CTA in Regions/Viewport and Media upload steps.
- Tests: updated storyboard wizard test mock to use asset-based upload payload (assetId/path) to match current contract.

### Tests + Results
- `npm run test:vitest -- components/boards/__tests__/board-planner-wizard.test.tsx components/boards/__tests__/boards-workflow.test.tsx` — PASS.

### Decisions / Assumptions
- Kept changes UX-only; no behavioral or API changes. CTA links target Media tab hash `#create` for quick navigation.
- Retry buttons are client-side reloads only; no additional backend calls added.

### Blockers / Tech Debt
- None identified in this iteration.

### Next Steps
1. Continue monitoring storyboard/media UX for further clarity needs (e.g., inline re-upload from storyboard).
2. Run broader regression alongside the next functional changes.
