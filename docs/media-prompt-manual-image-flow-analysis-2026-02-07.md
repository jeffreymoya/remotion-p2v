# Media Prompt -> External LLM -> Upload Flow Analysis

Date: 2026-02-07  
Status: Updated after implementation (prompt-first flow shipped)

## Update (Implemented)
- Prompt generation now lives on the Media page (`Create & Upload` tab) alongside upload.
- Media gate requires **both** generated prompts and at least one asset (status machine guard).
- Board images are stored as `Asset` records with deterministic `{boardId}` filenames; board upload route was removed.
- Storyboard hosts only the post-upload steps (regions, triggers, viewport) with images resolved via `assetId`.

## Context

Requested workflow:

1. Generate an image prompt inside Storyflow.
2. Copy prompt to an external image model site.
3. Generate image externally.
4. Upload generated image back into Storyflow.

The concern is valid: the current stage flow can make it feel like upload is required before prompt generation.

## Historical Implementation (Evidence, pre-prompt-first)

_This section describes the state before the prompt-first Media flow shipped. The Update section above reflects the current behavior._

### 1) Prompt generation exists, but in Storyboard (Step 3), not Media (Step 2)

- Storyboard page hosts the boards workflow: `app/(dashboard)/projects/[id]/storyboard/page.tsx:35`
- Boards workflow uses `BoardPlannerWizard`: `components/boards/BoardsWorkflow.tsx:65`
- Prompt UI includes explicit copy action:
  - `components/boards/PromptDisplay.tsx:84`
  - `components/boards/PromptDisplay.tsx:90`
  - `components/boards/PromptDisplay.tsx:99`

### 2) Media page did not expose prompt generation (resolved)

- Media now exposes prompt generation in the `Create & Upload` tab alongside uploads: `components/media/media-manager.tsx` (create tab), `components/boards/BoardPlannerWizard.tsx`.

### 3) Stage gating order blocks Storyboard until Media is complete

- Stage order is `script -> media -> storyboard`: `src/lib/storyflow/stage-validation.ts:5`
- Storyboard unlock requires `ASSETS_READY`: `src/lib/storyflow/stage-validation.ts:64`
- Media stage currently requires at least one asset:
  - `src/lib/storyflow/pipeline/stages/media.ts:27`
  - `src/lib/storyflow/pipeline/stages/media.ts:31`
  - error: "Upload or import assets before marking Media complete.": `src/lib/storyflow/pipeline/stages/media.ts:32`

Net effect: if user wants prompts first, they cannot reach prompt generation until Media is considered complete.

### 4) Messaging was internally inconsistent in the boards wizard (resolved)

- Prompts step copy now points to the Media page (Create & Upload), and the legacy Assets page redirects to Media: `app/(dashboard)/projects/[id]/assets/page.tsx:7`.
- Wizard upload step aligns with the Media asset-backed flow; board upload route was removed.

### 5) Board image uploads and Media assets are separate pipelines (resolved)

- Original state: board upload route wrote to `boards/<boardId>.<ext>`; media upload created `Asset` rows under `assets/`.
- Current state: board upload route removed; board images now upload through the asset route, stored as `Asset` records in `assets/images/` with deterministic `{boardId}` filenames.

### 6) Style guide control appears partially implemented

- UI captures a style guide input: `components/boards/BoardPlannerWizard.tsx:46`, `components/boards/BoardPlannerWizard.tsx:307`
- Prompt generation payload does not include style guide: `components/boards/BoardPlannerWizard.tsx:97`
- Prompt service always uses a hardcoded detective style:
  - `src/lib/boards/prompts-service.ts:93`
  - `src/lib/boards/prompts-service.ts:125`
  - `src/lib/boards/prompts-service.ts:321`

## Why This Feels Wrong to Users

The product asks users to perform an external generation step (copy prompt to another site), but that entrypoint is placed behind a prior stage that currently encourages or requires uploads first. That is backwards for users who do not have images yet and need the prompts to create them.

## Reference to Original Implementation Plan

This behavior aligns with the initial staged architecture documented in `docs/incremental-refactoring-plan.md`:

- Stage orchestration and gating were formalized in Wave 7: `docs/incremental-refactoring-plan.md:542`
- Planned order explicitly lists `storyboard` before `media` complexity discussion and preserves separate stage responsibilities: `docs/incremental-refactoring-plan.md:552`, `docs/incremental-refactoring-plan.md:553`
- Wave 4 migration explicitly split `ImageUploader` (boards hook) and `media-manager` (assets hook), reinforcing two upload paths:
  - `docs/incremental-refactoring-plan.md:311`
  - `docs/incremental-refactoring-plan.md:312`
  - `docs/incremental-refactoring-plan.md:336`
  - `docs/incremental-refactoring-plan.md:340`

Related expected behavior is also reflected in regression checklist where boards flow is `Prompts -> Upload`: `docs/regression-checklist.md:53`, `docs/regression-checklist.md:54`.

## Root Cause Summary (historical)

1. Prompt generation was implemented under Storyboard instead of Media.
2. Storyboard was stage-locked behind Media completion.
3. Media completion depended on existing assets.
4. Upload responsibilities were split across boards and assets domains.
5. UI copy referenced the old "Assets page" wording while the route redirected to Media (now updated to Media → Create & Upload).

## Recommendation

Recommended direction: support a true "prompt-first" path in Step 2 (Media), while keeping downstream board region/trigger/viewport work in Storyboard.

### Proposed UX target

1. Script complete.
2. Media:
   - Generate board prompts.
   - Copy prompts externally.
   - Generate images externally.
   - Upload images back (to media library and/or board slots).
3. Storyboard:
   - Region detection, trigger generation, viewport build, manual overrides.

## Implementation Plan (Proposed)

### Phase 1: Consistency fixes (low risk)

1. Update stale text "Assets page" to "Media page" in wizard copy.
2. Clarify that external generation happens before upload.
3. Either wire style guide into prompt generation or remove the unused input until supported.

### Phase 2: Unlock prompt-first without breaking stage model (implemented)

1. Add prompt-generation UI entrypoint on Media page (reuse existing boards hooks/APIs). ✅
2. Keep current Storyboard prompt UI temporarily for backward compatibility (later removed in Phase 2.2). ✅
3. Media completion requires **both** prompts generated and at least one asset (enforced by status machine guard). ✅

### Phase 3: Unify image ingestion paths (implemented)

1. Canonical storage chosen: store board images as IMAGE assets and reference them via `assetId`. ✅
2. Duplicate/competing upload instructions removed with board upload route deletion. ✅

## Risks and Tradeoffs

- Relaxing Media gate too much could allow users into Storyboard without usable images.
- Keeping dual upload systems increases confusion and maintenance cost.
- Migrating board images into asset records affects existing artifact assumptions and tests.

## Acceptance Criteria for Fix

1. A new user can generate prompts before any upload.
2. Instructions are consistent across Media and Storyboard.
3. The upload destination and ownership model are unambiguous.
4. The style guide control either works end-to-end or is removed.
5. Stage progression messaging matches actual required actions.

